import { NextRequest, NextResponse } from 'next/server';
import { readState, writeState } from '@/lib/pipeline/state-machine';
import { gracefulKill } from '@/lib/pipeline/process-utils';

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

  // Kill child agent first, then runner — with graceful shutdown
  if (state.childPid) {
    gracefulKill(state.childPid, 'Agent');
  }
  if (state.runnerPid) {
    gracefulKill(state.runnerPid, 'Runner');
  }

  state.status = 'failed';
  state.currentPhase = 'failed';
  state.runnerPid = null;
  state.childPid = null;
  writeState(deviceId, state);

  return NextResponse.json({ status: 'cancelled' });
}
