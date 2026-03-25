import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  // Check for editor-saved manifest first (preserves contractor edits)
  const editorPath = path.join('.pipeline', deviceId, 'manifest-editor.json');

  // Auto-restore: if no editor file but a saved one exists from a previous pipeline run,
  // restore it so the contractor doesn't lose their work after a pipeline reset.
  if (!fs.existsSync(editorPath)) {
    const savedPath = path.join('.pipeline', 'saved', deviceId, 'manifest-editor.json');
    if (fs.existsSync(savedPath)) {
      const pipelineDir = path.join('.pipeline', deviceId);
      if (!fs.existsSync(pipelineDir)) {
        fs.mkdirSync(pipelineDir, { recursive: true });
      }
      fs.copyFileSync(savedPath, editorPath);
    }
  }

  if (fs.existsSync(editorPath)) {
    try {
      const data = fs.readFileSync(editorPath, 'utf-8');
      const parsed = JSON.parse(data);
      // Editor stores sections/controls as Record<id, Def> objects.
      // All consumers expect arrays. Normalize before returning.
      if (parsed.sections && !Array.isArray(parsed.sections)) {
        parsed.sections = Object.values(parsed.sections);
      }
      if (parsed.controls && !Array.isArray(parsed.controls)) {
        parsed.controls = Object.values(parsed.controls);
      }
      // Check staleness: compare structural version of editor manifest vs pipeline manifest.
      // If the pipeline manifest has changed (new gatekeeper run, new controls/properties),
      // the editor state is stale and should be discarded.
      const mainManifestPath = path.join('.pipeline', deviceId, 'manifest.json');
      if (fs.existsSync(mainManifestPath)) {
        try {
          const mainData = JSON.parse(fs.readFileSync(mainManifestPath, 'utf-8'));
          const pipelineVersion = computeManifestVersion(mainData);
          const editorVersion = parsed._manifestVersion;

          if (editorVersion && editorVersion !== pipelineVersion) {
            // Editor manifest is stale — pipeline has new structural data.
            // Archive stale editor manifest and serve fresh pipeline data.
            const stalePath = editorPath + '.stale';
            fs.renameSync(editorPath, stalePath);
            return NextResponse.json(mainData);
          }

          // Carry over fields the editor manifest may lack.
          if (!parsed.deviceDimensions && mainData.deviceDimensions) {
            parsed.deviceDimensions = mainData.deviceDimensions;
          }
          if (!parsed.keyboard && mainData.keyboard) {
            parsed.keyboard = mainData.keyboard;
          }
          if (!parsed.deviceName && mainData.deviceName) {
            parsed.deviceName = mainData.deviceName;
          }
          if (!parsed.manufacturer && mainData.manufacturer) {
            parsed.manufacturer = mainData.manufacturer;
          }
        } catch { /* ignore parse errors */ }
      }
      return NextResponse.json({ ...parsed, _source: 'editor' });
    } catch {
      // Fall through to original manifest
    }
  }

  // Fall back to original pipeline manifest
  const mainPath = path.join('.pipeline', deviceId, 'manifest.json');

  const manifestPath = fs.existsSync(mainPath) ? mainPath : null;

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
  const backupDir = path.join(pipelineDir, 'backups');

  try {
    // Auto-backup: save a timestamped copy before overwriting
    if (fs.existsSync(editorPath)) {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupPath = path.join(backupDir, `manifest-editor-${timestamp}.json`);
      fs.copyFileSync(editorPath, backupPath);

      // Keep only the last 10 backups to avoid disk bloat
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('manifest-editor-'))
        .sort();
      while (backups.length > 10) {
        const oldest = backups.shift()!;
        fs.unlinkSync(path.join(backupDir, oldest));
      }
    }

    fs.writeFileSync(editorPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to write editor manifest' },
      { status: 500 },
    );
  }
}
