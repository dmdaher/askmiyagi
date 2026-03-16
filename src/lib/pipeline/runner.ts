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
