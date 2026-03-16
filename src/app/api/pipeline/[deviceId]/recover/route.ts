import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readState, writeState, appendLog } from '@/lib/pipeline/state-machine';

function isProcessAlive(pid: number): boolean {
  try {
    execSync(`ps -p ${pid} -o pid= 2>/dev/null`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

function gracefulKill(pid: number, label: string): string {
  if (!isProcessAlive(pid)) return `${label} (PID ${pid}) already dead`;

  // SIGTERM first — gives the process a chance to clean up
  try { process.kill(pid, 'SIGTERM'); } catch { /* ignore */ }

  // Wait up to 5 seconds for graceful exit
  for (let i = 0; i < 10; i++) {
    execSync('sleep 0.5');
    if (!isProcessAlive(pid)) return `${label} (PID ${pid}) exited gracefully`;
  }

  // Still alive — force kill
  try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
  return `${label} (PID ${pid}) force-killed after 5s timeout`;
}

/**
 * POST /api/pipeline/[deviceId]/recover
 *
 * Recovery actions for broken pipeline states:
 * - action: "fix-stale"    — Process is dead but status says running. Resets to paused.
 * - action: "reset-failed" — Pipeline failed. Resets to the last completed phase (or pending).
 * - action: "kill-restart"  — Gracefully stop processes and reset to paused for restart.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  const { action } = await request.json() as { action: string };

  switch (action) {
    case 'fix-stale': {
      if (state.runnerPid && isProcessAlive(state.runnerPid)) {
        return NextResponse.json({ error: 'Process is still alive — not stale' }, { status: 409 });
      }
      // Also clean up any orphaned child process
      if (state.childPid && isProcessAlive(state.childPid)) {
        gracefulKill(state.childPid, 'Orphaned agent');
      }
      state.status = 'paused';
      state.runnerPid = null;
      state.childPid = null;
      appendLog(deviceId, { level: 'info', message: 'Recovered from stale running state (process was dead)' });
      writeState(deviceId, state);
      return NextResponse.json({ status: 'paused', action: 'fix-stale', message: 'Reset to paused. You can now restart.' });
    }

    case 'reset-failed': {
      if (state.status !== 'failed') {
        return NextResponse.json({ error: `Pipeline is ${state.status}, not failed` }, { status: 409 });
      }
      // Find the last completed phase and resume from the next one
      const completedPhases = state.phases.filter((p) => p.status === 'passed');
      if (completedPhases.length > 0) {
        const lastCompleted = completedPhases[completedPhases.length - 1];
        state.currentPhase = lastCompleted.phase;
        appendLog(deviceId, { level: 'info', message: `Reset failed pipeline to resume after ${lastCompleted.phase}` });
      } else {
        state.currentPhase = 'pending';
        appendLog(deviceId, { level: 'info', message: 'Reset failed pipeline to pending (no completed phases)' });
      }
      state.status = 'paused';
      state.runnerPid = null;
      state.childPid = null;
      state.activeEscalation = null;
      writeState(deviceId, state);
      return NextResponse.json({ status: 'paused', action: 'reset-failed', resumeFrom: state.currentPhase });
    }

    case 'kill-restart': {
      const messages: string[] = [];

      // Kill child agent process first (gracefully)
      if (state.childPid) {
        messages.push(gracefulKill(state.childPid, 'Agent'));
      }
      // Then kill runner
      if (state.runnerPid) {
        messages.push(gracefulKill(state.runnerPid, 'Runner'));
      }

      state.status = 'paused';
      state.runnerPid = null;
      state.childPid = null;
      const summary = messages.length > 0 ? messages.join('; ') : 'No processes to kill';
      appendLog(deviceId, { level: 'warn', message: `Recovery kill-restart: ${summary}` });
      writeState(deviceId, state);
      return NextResponse.json({ status: 'paused', action: 'kill-restart', message: summary });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
