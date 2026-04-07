import { NextRequest, NextResponse } from 'next/server';
import { getDeviceState, putDeviceState } from '@/lib/hosted-storage';

/** GET /api/hosted/panels/{deviceId} — get manifest (flat format matching local endpoint) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = await getDeviceState(deviceId);
  if (!state) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  // Unwrap: return flat manifest with hosted metadata fields
  return NextResponse.json({
    ...(state.manifest as Record<string, unknown>),
    _source: 'hosted',
    _status: state.status,
    _updatedAt: state.updatedAt,
    _reviewNote: state.reviewNote ?? null,
  });
}

/** PUT /api/hosted/panels/{deviceId} — save manifest (auto-save from editor) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  // Read existing state to preserve status + metadata
  const existing = await getDeviceState(deviceId);
  if (!existing) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  // Wrap: editor sends flat manifest, we store nested in state.json
  const newStatus = existing.status === 'ready' ? 'in-progress' : existing.status;
  await putDeviceState(deviceId, {
    ...existing,
    status: newStatus as any,
    manifest: body,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
