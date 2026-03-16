import { spawn } from 'child_process';
import { appendLog } from './state-machine';
import { parseStreamJsonCost } from './cost-tracker';
import { CostEntry, PipelinePhase, RateLimitInfo } from './types';

export interface InvokeResult {
  exitCode: number;
  output: string;
  costEntry: CostEntry | null;
  rateLimitEvents: RateLimitInfo[];
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
}): Promise<InvokeResult> {
  return new Promise((resolve) => {
    const args = [
      '-p', opts.prompt,
      '--output-format', 'stream-json',
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
      const perInvocationCap = 20;
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
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: opts.cwd,
      env: { ...process.env },
    });

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        outputLines.push(line);
        appendLog(opts.deviceId, {
          level: 'agent',
          agent: opts.agent,
          message: line,
        });
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
