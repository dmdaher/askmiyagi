import { NextRequest, NextResponse } from 'next/server';
import { spawn, execSync } from 'child_process';
import { readState, writeState, ensurePipelineDir } from '@/lib/pipeline/state-machine';

function isProcessAlive(pid: number): boolean {
  try {
    execSync(`ps -p ${pid} -o pid= 2>/dev/null`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  if (state.status === 'completed') {
    return NextResponse.json({ error: 'Pipeline already completed' }, { status: 409 });
  }

  // If status is "running" but PID is dead, auto-recover to paused
  if (state.status === 'running') {
    if (state.runnerPid && isProcessAlive(state.runnerPid)) {
      return NextResponse.json({ error: 'Pipeline is already running', pid: state.runnerPid }, { status: 409 });
    }
    // Process is dead — fix stale state
    state.status = 'paused';
    state.runnerPid = null;
  }

  ensurePipelineDir(deviceId);

  const proc = spawn('npx', ['tsx', 'scripts/pipeline-runner.ts', deviceId], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  state.status = 'running';
  state.runnerPid = proc.pid ?? null;
  writeState(deviceId, state);

  return NextResponse.json({ status: 'running', pid: proc.pid, recovered: true });
}
