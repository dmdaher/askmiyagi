import { NextRequest, NextResponse } from 'next/server';
import { readState, writeState } from '@/lib/pipeline/state-machine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  return NextResponse.json(state);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  if (state.runnerPid) {
    try {
      process.kill(state.runnerPid, 'SIGTERM');
    } catch { /* Process may have already exited */ }
  }

  state.status = 'failed';
  state.currentPhase = 'failed';
  state.runnerPid = null;
  writeState(deviceId, state);

  return NextResponse.json({ status: 'cancelled' });
}
