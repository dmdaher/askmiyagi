import { NextRequest, NextResponse } from 'next/server';
import { getDeviceIssues, putDeviceIssues, type DeviceIssue } from '@/lib/hosted-storage';

const VALID_TYPES: DeviceIssue['type'][] = ['missing-control', 'wrong-type', 'wrong-data', 'other'];

/** GET /api/hosted/panels/{deviceId}/issues — list all issues */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const issues = await getDeviceIssues(deviceId);
  return NextResponse.json(issues);
}

/** POST /api/hosted/panels/{deviceId}/issues — create a new issue or replace all */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  // Full replacement mode (admin dismissing/resolving issues)
  if (body._replace && Array.isArray(body.issues)) {
    await putDeviceIssues(deviceId, body.issues);
    return NextResponse.json({ ok: true });
  }

  // Normal append mode (contractor filing new issue)
  const { type, description, controlId } = body;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }
  if (!description || description.trim().length < 5) {
    return NextResponse.json({ error: 'Description must be at least 5 characters' }, { status: 400 });
  }

  const issues = await getDeviceIssues(deviceId);

  const newIssue: DeviceIssue = {
    id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    description: description.trim(),
    controlId: controlId || undefined,
    createdAt: new Date().toISOString(),
    status: 'open',
  };

  issues.push(newIssue);
  await putDeviceIssues(deviceId, issues);

  return NextResponse.json(newIssue, { status: 201 });
}
