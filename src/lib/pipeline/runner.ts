import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { appendLog } from './state-machine';
import { parseStreamJsonCost } from './cost-tracker';
import { CostEntry, PipelinePhase, RateLimitInfo } from './types';

// Watchdog idle threshold per agent. Agents have wildly different legit
// runtimes — the threshold should be longer than the longest "I'm thinking"
// gap any real agent ever exhibits. Tonight's cdj-3000 builder paused up to
// 5 min between tool calls (PDF reads) without hanging; reviewer was similar.
// 20 min is generous; the only legit case >20min is sustained API overload
// (which Layer 1 retry handles separately).
const WATCHDOG_IDLE_MS = 20 * 60 * 1000;
const WATCHDOG_CHECK_INTERVAL_MS = 60 * 1000;

// Cap on how much stdout we persist per agent invocation. Reviewer prose can
// be 10-50KB; manual-extractor output much larger. 1MB is plenty without
// risking disk fill on a broken agent that streams gibberish forever.
const STDOUT_PERSIST_CAP_BYTES = 1_000_000;

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
  /**
   * Wall-clock idle time at exit, in ms. Distinguishes:
   *   - exit-0 after long-but-active work (low idle)
   *   - exit-1 from watchdog kill (idle >= WATCHDOG_IDLE_MS)
   *   - exit-1 from real agent error (low idle, immediate fail)
   * Callers use this to differentiate hang-recovery from real-failure paths.
   */
  idleMsAtExit: number;
  /** True if the watchdog killed this agent for being idle too long. */
  killedByWatchdog: boolean;
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
  /**
   * Called on each stdout chunk, throttled to ~30s, with the current Unix
   * ms. Caller persists to state for diagnostics-panel surfacing of
   * hung-agent warnings (>5min idle = warning, >20min = watchdog kills).
   */
  onAgentActivity?: (timestampMs: number) => void;
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

    // Watchdog state — uses monotonic clock (process.hrtime.bigint) so DST/NTP
    // shifts don't corrupt the idle calculation. Tonight's cdj-3000 batch-e
    // reviewer hung for 90+ min before manual intervention; this catches it
    // at WATCHDOG_IDLE_MS (~20 min).
    let lastActivityNs = process.hrtime.bigint();
    let lastActivityCallbackMs = 0;  // throttle onAgentActivity to every 30s
    let killedByWatchdog = false;
    const watchdog = setInterval(() => {
      const idleMs = Number(process.hrtime.bigint() - lastActivityNs) / 1_000_000;
      if (idleMs >= WATCHDOG_IDLE_MS) {
        killedByWatchdog = true;
        appendLog(opts.deviceId, {
          level: 'error',
          agent: opts.agent,
          message:
            `Watchdog: ${opts.agent} idle for ${Math.round(idleMs / 60000)}min ` +
            `(threshold ${WATCHDOG_IDLE_MS / 60000}min). Sending SIGKILL.`,
        });
        try { proc.kill('SIGKILL'); } catch { /* may already be dead */ }
        clearInterval(watchdog);
      }
    }, WATCHDOG_CHECK_INTERVAL_MS);

    proc.stdout?.on('data', (data: Buffer) => {
      lastActivityNs = process.hrtime.bigint();
      // Throttled activity callback (state writes are expensive; 30s is plenty
      // for the diagnostics panel's polling cadence).
      const nowMs = Date.now();
      if (opts.onAgentActivity && nowMs - lastActivityCallbackMs > 30_000) {
        lastActivityCallbackMs = nowMs;
        try { opts.onAgentActivity(nowMs); } catch { /* don't crash on callback error */ }
      }
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
      lastActivityNs = process.hrtime.bigint();
      appendLog(opts.deviceId, {
        level: 'error',
        agent: opts.agent,
        message: data.toString(),
      });
    });

    proc.on('close', (code) => {
      clearInterval(watchdog);
      const exitCode = code ?? 1;
      const idleMsAtExit = Number(process.hrtime.bigint() - lastActivityNs) / 1_000_000;
      const model = opts.model ?? 'claude-sonnet-4-6';
      const parsed = parseStreamJsonCost(
        outputLines,
        model,
        opts.phase,
        opts.agent,
        opts.sectionId,
        opts.batchId
      );

      // Persist full stdout to disk for postmortem / synth fallback. Tonight's
      // cdj-3000 batches c/d/e all had reviewer prose worth keeping but
      // runner.log truncates messages at ~500 chars. This file lets admin
      // (and synth logic) recover the full review when the agent fails to
      // write its own checkpoint.
      try {
        const fullOutput = outputLines.join('\n');
        const truncated = fullOutput.length > STDOUT_PERSIST_CAP_BYTES
          ? fullOutput.slice(0, STDOUT_PERSIST_CAP_BYTES) +
            `\n\n[truncated at ${STDOUT_PERSIST_CAP_BYTES} bytes; total was ${fullOutput.length}]`
          : fullOutput;
        const agentDir = path.join('.pipeline', opts.deviceId, 'agents', opts.agent);
        // wtDir if cwd provided, else relative to current dir
        const targetDir = opts.cwd
          ? path.join(opts.cwd, agentDir)
          : agentDir;
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'last-output.md'), truncated);
      } catch (err) {
        // Best-effort — don't fail the invocation over a log-preservation issue
        appendLog(opts.deviceId, {
          level: 'warn',
          agent: opts.agent,
          message: `Could not persist stdout to last-output.md: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      appendLog(opts.deviceId, {
        level: 'info',
        agent: opts.agent,
        message:
          `${opts.agent} exited with code ${exitCode}` +
          (killedByWatchdog ? ' (killed by watchdog)' : '') +
          (parsed.costEntry
            ? ` ($${parsed.costEntry.costUsd.toFixed(4)}${parsed.costEntry.actualCostUsd !== null ? ` actual: $${parsed.costEntry.actualCostUsd.toFixed(4)}` : ''})`
            : ''),
      });

      resolve({
        exitCode,
        output: outputLines.join('\n'),
        costEntry: parsed.costEntry,
        rateLimitEvents: parsed.rateLimitEvents,
        childPid: proc.pid ?? null,
        idleMsAtExit,
        killedByWatchdog,
      });
    });

    proc.on('error', (err) => {
      clearInterval(watchdog);
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
        idleMsAtExit: 0,
        killedByWatchdog: false,
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

// Transient error patterns — these typically resolve with a retry.
// Discovered during cdj-3000 2026-05-18: 529 Overloaded, stream-idle-timeout,
// socket-closed all hit during the same pipeline run. All recoverable.
const TRANSIENT_PATTERNS = [
  /API Error: 529|Overloaded|overloaded_error/i,
  /Stream idle timeout/i,
  /socket (?:hang up|connection was closed unexpectedly)/i,
  /ECONNRESET(?!\s*\(billing)/i,  // not billing-related ECONNRESET
  /ETIMEDOUT/i,
  /fetch failed/i,
];

// Errors that should NEVER auto-retry — retrying just repeats the same problem
// and burns budget. These need human intervention.
const NEVER_RETRY_PATTERNS = [
  /JavaScript heap out of memory|FATAL ERROR.*heap/i,
  /\b401 Unauthorized\b|invalid_api_key/i,
  /\b403 Forbidden\b/i,
  /\b402 Payment Required\b|insufficient_quota/i,
];

export function looksTransient(output: string): boolean {
  if (NEVER_RETRY_PATTERNS.some((p) => p.test(output))) return false;
  return TRANSIENT_PATTERNS.some((p) => p.test(output));
}

// Legacy shim — some tests/callers may still reference looks529. Keep one
// release cycle for backward compat.
function looks529(output: string): boolean {
  return looksTransient(output);
}
void looks529; // not currently called outside the legacy path

function sleep(seconds: number): Promise<void> {
  return new Promise((r) => setTimeout(r, seconds * 1000));
}

export async function invokeAgentWithRetry(opts: Parameters<typeof invokeAgent>[0]): Promise<InvokeResult> {
  for (let attempt = 0; attempt <= RETRY_BACKOFF_SECONDS.length; attempt++) {
    const result = await invokeAgent(opts);

    // Success or non-transient failure → return as-is. The caller's gates
    // (builder-exit check, etc.) decide what to do. Note: never-retry
    // patterns (OOM, auth) are explicitly NOT transient → return immediately.
    if (result.exitCode === 0 || !looksTransient(result.output)) {
      if (attempt > 0) {
        appendLog(opts.deviceId, {
          level: 'info',
          agent: opts.agent,
          message: `Recovered on attempt ${attempt + 1} after transient-error retry(s).`,
        });
      }
      return result;
    }

    // Transient failure detected. If we have retries left, sleep + try again.
    if (attempt < RETRY_BACKOFF_SECONDS.length) {
      const sleepSec = RETRY_BACKOFF_SECONDS[attempt];
      appendLog(opts.deviceId, {
        level: 'warn',
        agent: opts.agent,
        message:
          `Transient error on attempt ${attempt + 1}. ` +
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
        `Transient error persisted through ${RETRY_BACKOFF_SECONDS.length + 1} attempts ` +
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
