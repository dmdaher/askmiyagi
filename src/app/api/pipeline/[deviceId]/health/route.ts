import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readState } from '@/lib/pipeline/state-machine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  // Check if the runner process is alive
  let processAlive = false;
  let processUptime: string | null = null;
  let processMem: string | null = null;
  if (state.runnerPid) {
    try {
      const info = execSync(`ps -p ${state.runnerPid} -o etime=,rss= 2>/dev/null`, {
        encoding: 'utf-8',
      }).trim();
      if (info) {
        processAlive = true;
        const parts = info.trim().split(/\s+/);
        processUptime = parts[0] || null;
        const rssKb = parseInt(parts[1] || '0', 10);
        processMem = rssKb > 0 ? `${(rssKb / 1024).toFixed(1)} MB` : null;
      }
    } catch {
      // Process not found
    }
  }

  // Calculate phase duration
  const currentPhaseResult = state.phases.find(
    (p) => p.phase === state.currentPhase && p.status === 'running'
  );
  const phaseDurationMs = currentPhaseResult
    ? Date.now() - new Date(currentPhaseResult.startedAt).getTime()
    : null;

  // Pipeline total duration
  const totalDurationMs = Date.now() - new Date(state.createdAt).getTime();

  // Time since last state update (acts as heartbeat)
  const lastUpdateMs = Date.now() - new Date(state.updatedAt).getTime();

  // Count log entries
  let logCount = 0;
  let lastLogTimestamp: string | null = null;
  try {
    const { getLogPath } = await import('@/lib/pipeline/state-machine');
    const fs = await import('fs');
    const logPath = getLogPath(deviceId);
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      logCount = lines.length;
      if (lines.length > 0) {
        try {
          const lastLine = JSON.parse(lines[lines.length - 1]);
          lastLogTimestamp = lastLine.timestamp;
        } catch { /* ignore parse errors */ }
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json({
    deviceId: state.deviceId,
    status: state.status,
    currentPhase: state.currentPhase,
    process: {
      pid: state.runnerPid,
      alive: processAlive,
      uptime: processUptime,
      memory: processMem,
    },
    timing: {
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      lastUpdateAgoMs: lastUpdateMs,
      totalDurationMs,
      currentPhaseDurationMs: phaseDurationMs,
      currentPhaseStartedAt: currentPhaseResult?.startedAt ?? null,
    },
    logs: {
      count: logCount,
      lastTimestamp: lastLogTimestamp,
    },
    worktree: state.worktreePath,
    checkpoint: state.lastCheckpoint,
    budget: {
      spent: state.totalActualCostUsd || state.totalCostUsd,
      cap: state.budgetCapUsd,
      pctUsed: ((state.totalActualCostUsd || state.totalCostUsd) / state.budgetCapUsd * 100).toFixed(1),
    },
  });
}
