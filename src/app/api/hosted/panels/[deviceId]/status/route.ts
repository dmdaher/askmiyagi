import { NextRequest, NextResponse } from 'next/server';
import { getDeviceStatus, putDeviceStatus, isValidTransition, type DeviceStatus } from '@/lib/hosted-storage';

const VALID_STATUSES: DeviceStatus[] = ['ready', 'in-progress', 'submitted', 'approved'];

/**
 * PATCH /api/hosted/panels/{deviceId}/status
 * Writes ONLY to status.json blob — completely independent of manifest.
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

  await putDeviceStatus(deviceId, {
    ...existing,
    status,
    // Admin note: set on request-changes, preserved through submitted, cleared on approved
    adminNote: status === 'approved' ? undefined : (adminNote ?? existing.adminNote),
    // Contractor note: set on submit, cleared when admin acts
    contractorNote: status === 'submitted' ? (contractorNote ?? existing.contractorNote) : undefined,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, status });
}
