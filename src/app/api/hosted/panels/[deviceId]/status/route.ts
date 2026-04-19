import { NextRequest, NextResponse } from 'next/server';
import { getDeviceStatus, putDeviceStatus, isValidTransition, backupManifest, type DeviceStatus, type StatusEvent } from '@/lib/hosted-storage';

const VALID_STATUSES: DeviceStatus[] = ['ready', 'in-progress', 'submitted', 'approved'];

/**
 * PATCH /api/hosted/panels/{deviceId}/status
 * Writes ONLY to status.json blob — completely independent of manifest.
 * Appends a StatusEvent on every transition for timeline tracking.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();
  const { status, adminNote, contractorNote } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const existing = await getDeviceStatus(deviceId);
  if (!existing) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  if (!isValidTransition(existing.status, status)) {
    return NextResponse.json(
      { error: `Invalid transition: ${existing.status} → ${status}` },
      { status: 400 },
    );
  }

  // Backup manifest on contractor submit (creates restore point)
  if (status === 'submitted') {
    await backupManifest(deviceId);
  }

  // Build timeline event
  const now = new Date().toISOString();
  const event: StatusEvent = {
    type: status === 'submitted' ? 'submitted'
      : status === 'approved' ? 'approved'
      : status === 'in-progress' && adminNote ? 'changes-requested'
      : 'sent-to-contractor',
    timestamp: now,
    by: status === 'submitted' ? 'contractor' : 'admin',
    note: status === 'submitted' ? (contractorNote?.trim() || undefined)
      : (adminNote?.trim() || undefined),
  };

  const events = [...(existing.events ?? []), event];

  await putDeviceStatus(deviceId, {
    ...existing,
    status,
    adminNote: status === 'approved' ? undefined : (adminNote ?? existing.adminNote),
    contractorNote: status === 'submitted' ? (contractorNote ?? existing.contractorNote) : undefined,
    events,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, status });
}
