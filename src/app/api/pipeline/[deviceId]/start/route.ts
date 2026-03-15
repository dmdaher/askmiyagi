import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { readState, writeState, ensurePipelineDir } from '@/lib/pipeline/state-machine';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  if (state.status === 'running') {
    return NextResponse.json({ error: 'Pipeline is already running' }, { status: 409 });
  }

  if (state.status === 'completed') {
    return NextResponse.json({ error: 'Pipeline already completed' }, { status: 409 });
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

  return NextResponse.json({ status: 'running', pid: proc.pid });
}
