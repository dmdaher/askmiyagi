import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const paths = [
    path.join('.worktrees', deviceId, '.claude', 'agent-memory', 'diagram-parser', 'spatial-blueprint.json'),
    path.join('.claude', 'agent-memory', 'diagram-parser', 'spatial-blueprint.json'),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const data = fs.readFileSync(p, 'utf-8');
        return NextResponse.json(JSON.parse(data));
      } catch {
        continue;
      }
    }
  }

  return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
}
