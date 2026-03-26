import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

function getIssuesPath(deviceId: string): string {
  return path.join('.pipeline', deviceId, 'issues.json');
}

interface Issue {
  id: string;
  type: 'missing-control' | 'wrong-type' | 'wrong-data' | 'other';
  description: string;
  controlId?: string;
  createdAt: string;
  status: 'open' | 'resolved';
  resolution?: string;
}

function readIssues(deviceId: string): Issue[] {
  const filePath = getIssuesPath(deviceId);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeIssues(deviceId: string, issues: Issue[]) {
  const filePath = getIssuesPath(deviceId);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Atomic write
  const tmp = filePath + '.tmp.' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(issues, null, 2));
  fs.renameSync(tmp, filePath);
}

/** GET /api/pipeline/{deviceId}/issues — list all issues */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  return NextResponse.json(readIssues(deviceId));
}

/** POST /api/pipeline/{deviceId}/issues — create a new issue */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  let body: { type: string; description: string; controlId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validTypes = ['missing-control', 'wrong-type', 'wrong-data', 'other'];
  if (!body.type || !validTypes.includes(body.type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
  }
  if (!body.description || body.description.trim().length < 5) {
    return NextResponse.json({ error: 'Description required (min 5 characters)' }, { status: 400 });
  }

  const issues = readIssues(deviceId);
  const newIssue: Issue = {
    id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: body.type as Issue['type'],
    description: body.description.trim(),
    controlId: body.controlId ?? undefined,
    createdAt: new Date().toISOString(),
    status: 'open',
  };

  issues.push(newIssue);
  writeIssues(deviceId, issues);

  return NextResponse.json(newIssue, { status: 201 });
}
