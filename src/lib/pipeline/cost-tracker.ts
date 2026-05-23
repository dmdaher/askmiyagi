import fs from 'fs';
import path from 'path';
import { CostEntry, PipelinePhase, PipelineState, RateLimitInfo } from './types';

const RATES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3 / 1e6, output: 15 / 1e6 },
  'claude-opus-4-6': { input: 15 / 1e6, output: 75 / 1e6 },
  'claude-haiku-4-5': { input: 1 / 1e6, output: 5 / 1e6 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number = 0,
  cacheReadTokens: number = 0
): number {
  const rate = RATES[model] ?? RATES['claude-sonnet-4-6'];
  return (
    inputTokens * rate.input +
    outputTokens * rate.output +
    cacheCreationTokens * rate.input * 1.25 +
    cacheReadTokens * rate.input * 0.1
  );
}

export function recordCostEntry(deviceId: string, entry: CostEntry): void {
  const costPath = path.join('.pipeline', deviceId, 'cost.json');
  let entries: CostEntry[] = [];

  try {
    const existing = fs.readFileSync(costPath, 'utf-8');
    entries = JSON.parse(existing);
  } catch {
    // File doesn't exist yet
  }

  entries.push(entry);

  const dir = path.dirname(costPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmp = `${costPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
  fs.renameSync(tmp, costPath);
}

export function getCostEntries(deviceId: string): CostEntry[] {
  const costPath = path.join('.pipeline', deviceId, 'cost.json');
  try {
    return JSON.parse(fs.readFileSync(costPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function accumulateCost(state: PipelineState, entry: CostEntry): void {
  state.totalCostUsd += entry.costUsd;
  state.totalActualCostUsd += entry.actualCostUsd ?? entry.costUsd;
  state.totalTokens.input += entry.inputTokens;
  state.totalTokens.output += entry.outputTokens;
  state.totalTokens.cacheCreation += entry.cacheCreationTokens;
  state.totalTokens.cacheRead += entry.cacheReadTokens;

  const phaseResult = state.phases.find(
    (p) => p.phase === entry.phase && p.status === 'running'
  );
  if (phaseResult) {
    phaseResult.costUsd += entry.costUsd;
    phaseResult.tokens.input += entry.inputTokens;
    phaseResult.tokens.output += entry.outputTokens;
    phaseResult.tokens.cacheCreation += entry.cacheCreationTokens;
    phaseResult.tokens.cacheRead += entry.cacheReadTokens;
  }

  if (entry.sectionId) {
    const section = state.sections.find((s) => s.id === entry.sectionId);
    if (section) {
      section.costUsd += entry.costUsd;
      section.tokens.input += entry.inputTokens;
      section.tokens.output += entry.outputTokens;
      section.tokens.cacheCreation += entry.cacheCreationTokens;
      section.tokens.cacheRead += entry.cacheReadTokens;
    }
  }
}

export function checkBudget(
  state: PipelineState
): { allowed: boolean; warning: string | null } {
  const cost = state.totalActualCostUsd || state.totalCostUsd;
  const ratio = cost / state.budgetCapUsd;

  if (ratio >= 1) {
    return { allowed: false, warning: null };
  }
  if (ratio >= 0.85) {
    return {
      allowed: true,
      warning: `Budget at ${(ratio * 100).toFixed(0)}% ($${cost.toFixed(2)} / $${state.budgetCapUsd.toFixed(2)})`,
    };
  }
  return { allowed: true, warning: null };
}

export interface ParsedStreamCost {
  costEntry: CostEntry | null;
  rateLimitEvents: RateLimitInfo[];
}

export function parseStreamJsonCost(
  lines: string[],
  model: string,
  phase: PipelinePhase,
  agent: string,
  sectionId?: string,
  batchId?: string
): ParsedStreamCost {
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheCreationTokens = 0;
  let cacheReadTokens = 0;
  let actualCostUsd: number | null = null;
  const rateLimitEvents: RateLimitInfo[] = [];

  // Find the last "type": "result" event — its usage block is authoritative
  let lastResultEvent: Record<string, unknown> | null = null;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);

      if (obj.type === 'result') {
        lastResultEvent = obj;
      }

      if (obj.type === 'rate_limit_event') {
        rateLimitEvents.push({
          status: obj.status ?? 'allowed',
          resetsAt: obj.resets_at ?? 0,
          rateLimitType: obj.rate_limit_type ?? '',
          overageStatus: obj.overage_status ?? '',
          isUsingOverage: obj.is_using_overage ?? false,
          capturedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  // Extract tokens from the last result event only (fixes double-counting bug)
  if (lastResultEvent) {
    const usage = lastResultEvent.usage as Record<string, number> | undefined;
    if (usage) {
      inputTokens = usage.input_tokens ?? 0;
      outputTokens = usage.output_tokens ?? 0;
      cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
      cacheReadTokens = usage.cache_read_input_tokens ?? 0;
    }

    if (typeof lastResultEvent.total_cost_usd === 'number') {
      actualCostUsd = lastResultEvent.total_cost_usd;
    }
  }

  if (inputTokens === 0 && outputTokens === 0) {
    return { costEntry: null, rateLimitEvents };
  }

  return {
    costEntry: {
      phase,
      agent,
      sectionId,
      batchId,
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      costUsd: calculateCost(model, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens),
      actualCostUsd,
      model,
      timestamp: new Date().toISOString(),
    },
    rateLimitEvents,
  };
}

export function updateBurnRate(state: PipelineState, deviceId: string): void {
  const entries = getCostEntries(deviceId);
  if (entries.length === 0) {
    state.burnRate = null;
    return;
  }

  const firstTs = new Date(entries[0].timestamp).getTime();
  const lastTs = new Date(entries[entries.length - 1].timestamp).getTime();
  const durationMinutes = Math.max((lastTs - firstTs) / 60000, 1);
  const totalCost = entries.reduce((sum, e) => sum + (e.actualCostUsd ?? e.costUsd), 0);

  const costPerMinute = totalCost / durationMinutes;
  const costPerAgent = totalCost / entries.length;

  const remainingBudget = state.budgetCapUsd - (state.totalActualCostUsd || state.totalCostUsd);
  let projectedBudgetExhaustedAt: string | null = null;
  if (costPerMinute > 0 && remainingBudget > 0) {
    const minutesRemaining = remainingBudget / costPerMinute;
    projectedBudgetExhaustedAt = new Date(Date.now() + minutesRemaining * 60000).toISOString();
  }

  // Build data points for sparkline (last 50 entries)
  const recentEntries = entries.slice(-50);
  let cumulative = 0;
  // If we sliced, start cumulative from the cost of earlier entries
  if (entries.length > 50) {
    cumulative = entries.slice(0, entries.length - 50).reduce((sum, e) => sum + (e.actualCostUsd ?? e.costUsd), 0);
  }
  const dataPoints = recentEntries.map((e) => {
    cumulative += e.actualCostUsd ?? e.costUsd;
    return { timestamp: e.timestamp, cumulativeCost: cumulative };
  });

  state.burnRate = {
    costPerMinute,
    costPerAgent,
    projectedBudgetExhaustedAt,
    dataPoints,
  };
}

export function updateSubscription(
  state: PipelineState,
  rateLimitEvents: RateLimitInfo[]
): void {
  if (rateLimitEvents.length === 0) return;

  if (!state.subscription) {
    state.subscription = {
      windowResetsAt: 0,
      isUsingOverage: false,
      overageStatus: '',
      rateLimitEvents: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // Append new events, keep ring buffer of last 20
  state.subscription.rateLimitEvents.push(...rateLimitEvents);
  if (state.subscription.rateLimitEvents.length > 20) {
    state.subscription.rateLimitEvents = state.subscription.rateLimitEvents.slice(-20);
  }

  // Update top-level fields from the latest event
  const latest = rateLimitEvents[rateLimitEvents.length - 1];
  state.subscription.windowResetsAt = latest.resetsAt;
  state.subscription.isUsingOverage = latest.isUsingOverage;
  state.subscription.overageStatus = latest.overageStatus;
  state.subscription.lastUpdated = new Date().toISOString();
}
