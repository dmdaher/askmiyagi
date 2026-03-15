import fs from 'fs';
import path from 'path';
import { CostEntry, PipelinePhase, PipelineState } from './types';

const RATES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3 / 1e6, output: 15 / 1e6 },
  'claude-opus-4-6': { input: 15 / 1e6, output: 75 / 1e6 },
  'claude-haiku-4-5': { input: 1 / 1e6, output: 5 / 1e6 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rate = RATES[model] ?? RATES['claude-sonnet-4-6'];
  return inputTokens * rate.input + outputTokens * rate.output;
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
  state.totalTokens.input += entry.inputTokens;
  state.totalTokens.output += entry.outputTokens;

  const phaseResult = state.phases.find(
    (p) => p.phase === entry.phase && p.status === 'running'
  );
  if (phaseResult) {
    phaseResult.costUsd += entry.costUsd;
    phaseResult.tokens.input += entry.inputTokens;
    phaseResult.tokens.output += entry.outputTokens;
  }

  if (entry.sectionId) {
    const section = state.sections.find((s) => s.id === entry.sectionId);
    if (section) {
      section.costUsd += entry.costUsd;
      section.tokens.input += entry.inputTokens;
      section.tokens.output += entry.outputTokens;
    }
  }
}

export function checkBudget(state: PipelineState): boolean {
  return state.totalCostUsd < state.budgetCapUsd;
}

export function parseStreamJsonCost(
  lines: string[],
  model: string,
  phase: PipelinePhase,
  agent: string,
  sectionId?: string,
  batchId?: string
): CostEntry | null {
  let totalInput = 0;
  let totalOutput = 0;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'result' && obj.result) {
        totalInput += obj.result.input_tokens ?? 0;
        totalOutput += obj.result.output_tokens ?? 0;
      }
      if (obj.usage) {
        totalInput += obj.usage.input_tokens ?? 0;
        totalOutput += obj.usage.output_tokens ?? 0;
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  if (totalInput === 0 && totalOutput === 0) return null;

  return {
    phase,
    agent,
    sectionId,
    batchId,
    inputTokens: totalInput,
    outputTokens: totalOutput,
    costUsd: calculateCost(model, totalInput, totalOutput),
    model,
    timestamp: new Date().toISOString(),
  };
}
