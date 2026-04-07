import { NextRequest, NextResponse } from 'next/server';
import { getDeviceState, putDeviceState } from '@/lib/hosted-storage';

/** PATCH /api/hosted/panels/{deviceId}/status — update status + optional review note */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();
  const { status, reviewNote } = body;

  if (!['ready', 'in-progress', 'submitted', 'approved'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await getDeviceState(deviceId);
  if (!existing) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  await putDeviceState(deviceId, {
    ...existing,
    status,
    reviewNote: reviewNote ?? existing.reviewNote,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, status });
}
