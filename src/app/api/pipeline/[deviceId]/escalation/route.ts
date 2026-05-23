import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { readState, writeState, resolveEscalation } from '@/lib/pipeline/state-machine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { escalationId, resolution } = body;
  if (!escalationId || !resolution) {
    return NextResponse.json({ error: 'escalationId and resolution are required' }, { status: 400 });
  }

  const resolved = resolveEscalation(state, escalationId, resolution);
  if (!resolved) {
    return NextResponse.json({ error: `Escalation not found: ${escalationId}` }, { status: 404 });
  }

  writeState(deviceId, state);

  const proc = spawn('npx', ['tsx', 'scripts/pipeline-runner.ts', deviceId], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  state.runnerPid = proc.pid ?? null;
  writeState(deviceId, state);

  return NextResponse.json({ status: 'running', resolvedEscalation: escalationId });
}
