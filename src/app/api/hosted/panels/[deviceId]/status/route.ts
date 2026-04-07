import { NextRequest, NextResponse } from 'next/server';
import { getDeviceState, putDeviceState, isValidTransition, type DeviceStatus } from '@/lib/hosted-storage';

const VALID_STATUSES: DeviceStatus[] = ['ready', 'in-progress', 'submitted', 'approved'];

/**
 * PATCH /api/hosted/panels/{deviceId}/status
 * Change status + optional reviewNote. Enforces state machine transitions.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();
  const { status, reviewNote } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const existing = await getDeviceState(deviceId);
  if (!existing) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  // Enforce state machine transitions
  if (!isValidTransition(existing.status, status)) {
    return NextResponse.json(
      { error: `Invalid transition: ${existing.status} → ${status}` },
      { status: 400 },
    );
  }

  await putDeviceState(deviceId, {
    ...existing,
    status,
    // Set reviewNote when requesting changes, preserve through submitted, clear on approved
    reviewNote: status === 'approved' ? undefined : (reviewNote ?? existing.reviewNote),
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, status });
}
