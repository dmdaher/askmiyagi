import { NextRequest, NextResponse } from 'next/server';
import { getDeviceState, putDeviceState } from '@/lib/hosted-storage';

/**
 * GET /api/hosted/panels/{deviceId}
 * Returns manifest in the SAME flat format as local /api/pipeline/{id}/manifest.
 * Adds _source:'hosted', _status, _reviewNote for the editor to detect hosted mode.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = await getDeviceState(deviceId);
  if (!state) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...(state.manifest as Record<string, unknown>),
    _source: 'hosted',
    _status: state.status,
    _updatedAt: state.updatedAt,
    _reviewNote: state.reviewNote ?? null,
  });
}

/**
 * PUT /api/hosted/panels/{deviceId}
 * Auto-save from editor. Rejects when submitted/approved (403).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  const existing = await getDeviceState(deviceId);
  if (!existing) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  // Server-side write lock: reject saves when panel is under review or approved
  if (existing.status === 'submitted' || existing.status === 'approved') {
    return NextResponse.json(
      { error: 'Panel is locked for review', status: existing.status },
      { status: 403 },
    );
  }

  // First auto-save transitions ready → in-progress
  const newStatus = existing.status === 'ready' ? 'in-progress' : existing.status;

  await putDeviceState(deviceId, {
    ...existing,
    status: newStatus as any,
    manifest: body,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
