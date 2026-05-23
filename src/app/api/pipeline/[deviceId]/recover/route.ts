import { NextRequest, NextResponse } from 'next/server';
import { readState, writeState, appendLog } from '@/lib/pipeline/state-machine';
import { isProcessAlive, gracefulKill } from '@/lib/pipeline/process-utils';

/**
 * POST /api/pipeline/[deviceId]/recover
 *
 * Recovery actions for broken pipeline states:
 * - action: "fix-stale"    — Process is dead but status says running. Resets to paused.
 * - action: "reset-failed" — Pipeline failed. Resets to the last completed phase (or pending).
 * - action: "kill-restart"  — Gracefully stop processes and reset to paused for restart.
 * - action: "kill-agent"    — Kill ONLY the hung agent child, leave runner alive
 *                              so it can pause cleanly via its own GATE logic.
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

    case 'pause': {
      // Soft stop — kill processes but preserve all state. Can resume later.
      const pauseMessages: string[] = [];
      if (state.childPid && isProcessAlive(state.childPid)) {
        pauseMessages.push(gracefulKill(state.childPid, 'Agent'));
      }
      if (state.runnerPid && isProcessAlive(state.runnerPid)) {
        pauseMessages.push(gracefulKill(state.runnerPid, 'Runner'));
      }
      state.status = 'paused';
      state.runnerPid = null;
      state.childPid = null;
      appendLog(deviceId, { level: 'info', message: `Pipeline paused: ${pauseMessages.join('; ') || 'No active processes'}` });
      writeState(deviceId, state);
      return NextResponse.json({ status: 'paused', action: 'pause' });
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

    case 'kill-agent': {
      // Kill ONLY the active agent (claude -p subprocess), leave the runner
      // alive. The runner's invokeAgent will see exit-1 and route through
      // its existing GATE logic (pause with escalation). Cleaner than
      // kill-restart because the runner does the cleanup.
      //
      // Use when admin spots a hung agent (e.g., reviewer idle >5min) and
      // wants to abort it without waiting 20min for the watchdog or
      // killing the whole pipeline.
      if (!state.childPid) {
        return NextResponse.json({ error: 'No active agent to kill' }, { status: 409 });
      }
      if (!isProcessAlive(state.childPid)) {
        return NextResponse.json({ error: 'Agent process not alive (already exited)' }, { status: 409 });
      }
      const killMsg = gracefulKill(state.childPid, `Agent ${state.activeAgentName ?? '(unknown)'}`);
      appendLog(deviceId, {
        level: 'warn',
        message: `[ADMIN-KILL] ${killMsg}. Runner will see exit-1 and route through normal GATE logic.`,
      });
      // Don't touch state.status / runnerPid — the runner is still alive
      // and will update state itself when it observes the agent's exit.
      writeState(deviceId, state);
      return NextResponse.json({
        status: 'agent-killed',
        action: 'kill-agent',
        message: `${killMsg}. Runner will report failure + pause shortly.`,
      });
    }

    case 'reset-to-editor': {
      // Reset pipeline back to layout engine phase for editor access.
      // Works from any status (paused, running, failed, completed).
      state.currentPhase = 'phase-0-layout-engine';
      state.status = 'paused';
      state.runnerPid = null;
      state.childPid = null;
      state.activeEscalation = null;
      appendLog(deviceId, { level: 'info', message: 'Reset to editor phase (layout engine). Ready to send to contractor.' });
      writeState(deviceId, state);
      return NextResponse.json({ status: 'paused', action: 'reset-to-editor', message: 'Reset to editor. You can now send to contractor.' });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
