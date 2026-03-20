import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  // Check main pipeline dir first, then worktree
  const mainPath = path.join('.pipeline', deviceId, 'manifest.json');
  const worktreePath = path.join('.worktrees', deviceId, '.pipeline', deviceId, 'manifest.json');

  const manifestPath = fs.existsSync(mainPath) ? mainPath
    : fs.existsSync(worktreePath) ? worktreePath
    : null;

  if (!manifestPath) {
    return NextResponse.json(
      { error: 'Manifest not found. Gatekeeper has not run yet.' },
      { status: 404 }
    );
  }

  try {
    const data = fs.readFileSync(manifestPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ error: 'Failed to read manifest' }, { status: 500 });
  }
}

/**
 * PUT handler: auto-save the editor's flat model (sections + controls)
 * to manifest-editor.json, separate from the pipeline's manifest.json
 * to avoid corruption.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  const pipelineDir = path.join('.pipeline', deviceId);

  // Ensure the pipeline directory exists
  if (!fs.existsSync(pipelineDir)) {
    fs.mkdirSync(pipelineDir, { recursive: true });
  }

  const editorPath = path.join(pipelineDir, 'manifest-editor.json');

  try {
    fs.writeFileSync(editorPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to write editor manifest' },
      { status: 500 },
    );
  }
}
