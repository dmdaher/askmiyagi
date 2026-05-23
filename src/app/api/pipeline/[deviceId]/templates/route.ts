import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  // Check main pipeline dir first, then worktree
  const mainPath = path.join('.pipeline', deviceId, 'templates.json');
  const worktreePath = path.join('.worktrees', deviceId, '.pipeline', deviceId, 'templates.json');

  const templatesPath = fs.existsSync(mainPath) ? mainPath
    : fs.existsSync(worktreePath) ? worktreePath
    : null;

  if (!templatesPath) {
    return NextResponse.json(
      { error: 'Templates not found. Layout Engine has not run yet.' },
      { status: 404 }
    );
  }

  try {
    const data = fs.readFileSync(templatesPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ error: 'Failed to read templates' }, { status: 500 });
  }
}
