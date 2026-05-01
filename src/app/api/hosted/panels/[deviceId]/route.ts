import { NextRequest, NextResponse } from 'next/server';
import { getDeviceStatus, getDeviceManifest, putDeviceManifest, putDeviceStatus } from '@/lib/hosted-storage';

export const dynamic = 'force-dynamic';

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
    _updatedAt: (manifest as Record<string, unknown>)._updatedAt ?? status.updatedAt,
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

  // Server-side lock: only reject saves when approved (final state).
  // Contractor can keep editing and re-submitting while in 'submitted' status.
  if (status.status === 'approved') {
    return NextResponse.json(
      { error: 'Panel is approved — no further edits', status: status.status },
      { status: 403 },
    );
  }

  // Conflict detection: reject if someone else saved after this client loaded.
  // _loadedAt is the _updatedAt timestamp the client received on initial load.
  if (body._loadedAt) {
    const currentManifest = await getDeviceManifest(deviceId);
    const serverUpdatedAt = (currentManifest as Record<string, unknown> | null)?._updatedAt as string | undefined;
    if (serverUpdatedAt && new Date(serverUpdatedAt) > new Date(body._loadedAt)) {
      return NextResponse.json(
        { error: 'conflict', serverUpdatedAt },
        { status: 409 },
      );
    }
  }

  // Stamp the save timestamp so we can track when edits actually happened
  body._updatedAt = new Date().toISOString();
  body._source = 'hosted';
  // Remove _loadedAt before persisting — it's a client-only field
  delete body._loadedAt;

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

  return NextResponse.json({ ok: true, savedAt: body._updatedAt, status: status.status === 'ready' ? 'in-progress' : status.status });
}

/**
 * POST /api/hosted/panels/{deviceId}
 * Identical to PUT — exists because navigator.sendBeacon() only supports POST.
 * Used for flush-on-close and flush-on-unmount saves.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  return PUT(request, { params });
}
