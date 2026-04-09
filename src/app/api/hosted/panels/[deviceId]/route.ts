import { NextRequest, NextResponse } from 'next/server';
import { getDeviceStatus, getDeviceManifest, putDeviceManifest, putDeviceStatus } from '@/lib/hosted-storage';

/**
 * GET /api/hosted/panels/{deviceId}
 * Returns manifest in flat format + status metadata from separate blob.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const [status, manifest] = await Promise.all([
    getDeviceStatus(deviceId),
    getDeviceManifest(deviceId),
  ]);

  if (!status || !manifest) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...(manifest as Record<string, unknown>),
    _source: 'hosted',
    _status: status.status,
    _updatedAt: status.updatedAt,
    _adminNote: status.adminNote ?? null,
    _contractorNote: status.contractorNote ?? null,
  });
}

/**
 * PUT /api/hosted/panels/{deviceId}
 * Auto-save from editor. Writes ONLY the manifest blob.
 * Never touches status — eliminates the race condition.
 *
 * Checks status blob separately: rejects when submitted/approved.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  // Check status from separate blob — no read-modify-write on same blob
  const status = await getDeviceStatus(deviceId);
  if (!status) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  // Server-side lock: reject saves when panel is under review or approved
  if (status.status === 'submitted' || status.status === 'approved') {
    return NextResponse.json(
      { error: 'Panel is locked for review', status: status.status },
      { status: 403 },
    );
  }

  // Write manifest to its own blob — completely independent of status
  await putDeviceManifest(deviceId, body);

  // First auto-save transitions ready → in-progress (update status blob)
  if (status.status === 'ready') {
    await putDeviceStatus(deviceId, {
      ...status,
      status: 'in-progress',
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, status: status.status === 'ready' ? 'in-progress' : status.status });
}
