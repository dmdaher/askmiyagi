import { spawn } from 'child_process';
import { appendLog } from './state-machine';
import { parseStreamJsonCost } from './cost-tracker';
import { CostEntry, PipelinePhase, RateLimitInfo } from './types';

/**
 * Parse a stream-json event line into a human-readable log message.
 * Returns null for events that aren't worth showing (deltas, system noise).
 */
function parseStreamEvent(line: string, agent: string): string | null {
  try {
    const evt = JSON.parse(line);

    // Assistant text content — the actual "thinking" / output
    if (evt.type === 'assistant' && evt.message?.content) {
      const texts: string[] = [];
      for (const block of evt.message.content) {
        if (block.type === 'text' && block.text) {
          // Truncate very long text blocks for log readability
          const text = block.text.length > 500
            ? block.text.slice(0, 500) + '...'
            : block.text;
          texts.push(text);
        }
        if (block.type === 'tool_use') {
          const input = block.input ? JSON.stringify(block.input).slice(0, 200) : '';
          texts.push(`[tool] ${block.name}(${input})`);
        }
      }
      return texts.length > 0 ? texts.join(' | ') : null;
    }

    // Content block with text
    if (evt.type === 'content_block_start' && evt.content_block?.type === 'text') {
      return null; // Wait for the full message
    }

    // Tool use events
    if (evt.type === 'content_block_start' && evt.content_block?.type === 'tool_use') {
      return `[tool] ${evt.content_block.name}`;
    }

    // Tool results
    if (evt.type === 'result' && evt.subtype === 'tool_result') {
      const content = typeof evt.content === 'string'
        ? evt.content.slice(0, 300)
        : JSON.stringify(evt.content ?? '').slice(0, 300);
      return `[result] ${content}`;
    }

    // Final result with usage
    if (evt.type === 'result' && evt.usage) {
      const u = evt.usage;
      const cost = evt.total_cost_usd ? `$${evt.total_cost_usd.toFixed(4)}` : '';
      return `[done] tokens: ${u.input_tokens ?? 0}in/${u.output_tokens ?? 0}out ${cost}`;
    }

    // System init
    if (evt.type === 'system' && evt.subtype === 'init') {
      return `[session] ${evt.session_id ?? 'started'}`;
    }

    // Rate limit
    if (evt.type === 'rate_limit_event') {
      return `[rate-limit] ${evt.status} (resets: ${evt.resets_at ? new Date(evt.resets_at * 1000).toLocaleTimeString() : 'unknown'})`;
    }

    return null;
  } catch {
    // Not JSON — log raw non-empty lines
    const trimmed = line.trim();
    return trimmed.length > 0 && trimmed.length < 500 ? trimmed : null;
  }
}

export interface InvokeResult {
  exitCode: number;
  output: string;
  costEntry: CostEntry | null;
  rateLimitEvents: RateLimitInfo[];
  childPid: number | null;
}

/**
 * Invoke a Claude CLI agent non-interactively.
 * Uses `claude -p --output-format stream-json` for structured output.
 */
export function invokeAgent(opts: {
  prompt: string;
  deviceId: string;
  phase: PipelinePhase;
  agent: string;
  cwd?: string;
  sectionId?: string;
  batchId?: string;
  model?: string;
  allowedTools?: string[];
  maxTurns?: number;
  remainingBudgetUsd?: number;
  maxBudgetPerInvocation?: number;
  onChildPid?: (pid: number) => void;
}): Promise<InvokeResult> {
  return new Promise((resolve) => {
    const args = [
      '-p', opts.prompt,
      '--output-format', 'stream-json',
      '--verbose',
    ];

    if (opts.model) {
      args.push('--model', opts.model);
    }

    if (opts.allowedTools) {
      for (const tool of opts.allowedTools) {
        args.push('--allowedTools', tool);
      }
    }

    if (opts.maxTurns) {
      args.push('--max-turns', String(opts.maxTurns));
    }

    if (opts.remainingBudgetUsd !== undefined && opts.remainingBudgetUsd > 0) {
      const perInvocationCap = opts.maxBudgetPerInvocation ?? 20;
      const budget = Math.min(opts.remainingBudgetUsd, perInvocationCap);
      args.push('--max-budget-usd', budget.toFixed(2));
    }

    const outputLines: string[] = [];

    appendLog(opts.deviceId, {
      level: 'info',
      agent: opts.agent,
      message: `Starting ${opts.agent} invocation${opts.cwd ? ` (cwd: ${opts.cwd})` : ''}`,
    });

    const proc = spawn('claude', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: opts.cwd,
      env: { ...process.env },
    });

    // Report child PID immediately via callback if provided
    if (opts.onChildPid && proc.pid) {
      opts.onChildPid(proc.pid);
    }

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        outputLines.push(line);

        // Parse stream-json events into human-readable log entries
        const readable = parseStreamEvent(line, opts.agent);
        if (readable) {
          appendLog(opts.deviceId, {
            level: 'agent',
            agent: opts.agent,
            message: readable,
          });
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      appendLog(opts.deviceId, {
        level: 'error',
        agent: opts.agent,
        message: data.toString(),
      });
    });

    proc.on('close', (code) => {
      const exitCode = code ?? 1;
      const model = opts.model ?? 'claude-sonnet-4-6';
      const parsed = parseStreamJsonCost(
        outputLines,
        model,
        opts.phase,
        opts.agent,
        opts.sectionId,
        opts.batchId
      );

      appendLog(opts.deviceId, {
        level: 'info',
        agent: opts.agent,
        message: `${opts.agent} exited with code ${exitCode}${parsed.costEntry ? ` ($${parsed.costEntry.costUsd.toFixed(4)}${parsed.costEntry.actualCostUsd !== null ? ` actual: $${parsed.costEntry.actualCostUsd.toFixed(4)}` : ''})` : ''}`,
      });

      resolve({
        exitCode,
        output: outputLines.join('\n'),
        costEntry: parsed.costEntry,
        rateLimitEvents: parsed.rateLimitEvents,
        childPid: proc.pid ?? null,
      });
    });

    proc.on('error', (err) => {
      appendLog(opts.deviceId, {
        level: 'error',
        agent: opts.agent,
        message: `Failed to spawn claude: ${err.message}`,
      });
      resolve({
        exitCode: 1,
        output: '',
        costEntry: null,
        rateLimitEvents: [],
        childPid: null,
      });
    });
  });
}

// ─── API resilience ────────────────────────────────────────────────────────
//
// Anthropic occasionally returns 529 Overloaded during periods of high
// platform-wide load. Discovered cdj-3000 2026-05-18 — two consecutive
// builder runs failed on 529 immediately at session start, costing nothing
// but wasting the orchestration round-trip.
//
// invokeAgentWithRetry wraps invokeAgent with:
//   - 529 detection (scans output for "API Error: 529" pattern)
//   - exponential backoff (30s, 120s, 300s — covers transient blips up to ~7min)
//   - cleanly returns the final result after exhausting retries so callers
//     can pause with a proper escalation rather than silently advancing.
//
// Note on shape: the wrapper returns the same InvokeResult as invokeAgent,
// so it's a drop-in replacement. Callers don't need to change.

const RETRY_BACKOFF_SECONDS = [30, 120, 300];

function looks529(output: string): boolean {
  return /API Error: 529|Overloaded|overloaded_error/i.test(output);
}

function sleep(seconds: number): Promise<void> {
  return new Promise((r) => setTimeout(r, seconds * 1000));
}

export async function invokeAgentWithRetry(opts: Parameters<typeof invokeAgent>[0]): Promise<InvokeResult> {
  for (let attempt = 0; attempt <= RETRY_BACKOFF_SECONDS.length; attempt++) {
    const result = await invokeAgent(opts);

    // Success or non-529 failure → return as-is. The caller's gates
    // (builder-exit check, etc.) decide what to do.
    if (result.exitCode === 0 || !looks529(result.output)) {
      if (attempt > 0) {
        appendLog(opts.deviceId, {
          level: 'info',
          agent: opts.agent,
          message: `Recovered on attempt ${attempt + 1} after 529 retry(s).`,
        });
      }
      return result;
    }

    // 529 detected. If we have retries left, sleep + try again.
    if (attempt < RETRY_BACKOFF_SECONDS.length) {
      const sleepSec = RETRY_BACKOFF_SECONDS[attempt];
      appendLog(opts.deviceId, {
        level: 'warn',
        agent: opts.agent,
        message:
          `Anthropic API 529 Overloaded on attempt ${attempt + 1}. ` +
          `Sleeping ${sleepSec}s before retry ${attempt + 2}/${RETRY_BACKOFF_SECONDS.length + 1}. ` +
          `Check status.claude.com if this persists.`,
      });
      await sleep(sleepSec);
      continue;
    }

    // Exhausted all retries — return the failure. Caller will pause the
    // pipeline via its agent-failure gate.
    appendLog(opts.deviceId, {
      level: 'error',
      agent: opts.agent,
      message:
        `Anthropic API 529 persisted through ${RETRY_BACKOFF_SECONDS.length + 1} attempts ` +
        `(${RETRY_BACKOFF_SECONDS.reduce((a, b) => a + b, 0)}s total backoff). ` +
        `Giving up so the pipeline can pause cleanly.`,
    });
    return result;
  }

  // Unreachable, but TS wants a return
  throw new Error('invokeAgentWithRetry: loop exhausted');
}

/**
 * Pre-flight Anthropic API health probe. Sends a 1-token request with the
 * cheapest model and returns true if the API is healthy.
 *
 * Use this before spawning the runner to avoid burning budget on an outage.
 */
export async function probeAnthropicHealth(opts: {
  apiKey?: string;
  timeoutMs?: number;
} = {}): Promise<{ healthy: boolean; status?: number; reason?: string }> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Can't probe without a key. Don't block the runner — let it fail
    // properly if it hits an outage, instead of failing here on missing key.
    return { healthy: true, reason: 'no ANTHROPIC_API_KEY env, skipping probe' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: '.' }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status === 529) {
      return { healthy: false, status: 529, reason: 'Anthropic API returned 529 Overloaded' };
    }
    if (res.status >= 500) {
      return { healthy: false, status: res.status, reason: `Anthropic API returned ${res.status}` };
    }
    return { healthy: true, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Network errors / timeouts are not necessarily an Anthropic problem,
    // could be local connectivity. Don't block the runner.
    return { healthy: true, reason: `probe inconclusive: ${message}` };
  }
}

/**
 * Check if the dev server is running.
 */
export async function checkDevServer(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:3000', { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Start the dev server and wait for it to be ready.
 */
export function startDevServer(cwd?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('npm', ['run', 'dev'], {
      detached: true,
      stdio: 'ignore',
      cwd,
    });
    proc.unref();

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(interval);
        resolve(false);
        return;
      }
      const ready = await checkDevServer();
      if (ready) {
        clearInterval(interval);
        resolve(true);
      }
    }, 1000);
  });
}

/**
 * Send a macOS native notification.
 */
export function sendNotification(title: string, message: string): void {
  spawn('osascript', [
    '-e',
    `display notification "${message.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}" sound name "Blow"`,
  ]);
}
