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
      const resp = NextResponse.json({ ...parsed, _source: 'editor' });
      resp.headers.set('Cache-Control', 'no-store');
      return resp;
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
 *
 * Backup behavior mirrors the hosted route (parity between modes):
 *  - autosave PUT (no ?backup=force) → throttled to 1 backup per minute
 *  - manual save PUT (?backup=force&source=manual) → always creates a backup
 *  - source query param tags the filename so the dropdown can show it
 */
const AUTOSAVE_BACKUP_THROTTLE_MS = 5 * 60 * 1000;

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

  const force = request.nextUrl.searchParams.get('backup') === 'force';
  const sourceParam = request.nextUrl.searchParams.get('source');
  const source = (sourceParam === 'manual' || sourceParam === 'submit' || sourceParam === 'send')
    ? sourceParam
    : (force ? 'manual' : 'autosave');

  try {
    // Auto-backup: save a timestamped copy before overwriting.
    // Throttled for autosaves (force=false) — at most 1 backup per minute,
    // OR if newest backup is older than 5 min the next autosave creates one.
    // Forced (manual save, submit) backups always run.
    if (fs.existsSync(editorPath)) {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      let shouldBackup = force;
      if (!force) {
        // Read existing backup filenames; skip if any sits in the current minute
        // OR if the newest backup is within the 5-min throttle window.
        const now = new Date();
        const minuteStamp = now.toISOString().slice(0, 16).replace(/[:.]/g, '-');
        let inSameMinute = false;
        let newestAgeMs = Infinity;
        try {
          const files = fs.readdirSync(backupDir);
          for (const f of files) {
            if (f.includes(minuteStamp)) {
              inSameMinute = true;
              break;
            }
            const fullPath = path.join(backupDir, f);
            const stat = fs.statSync(fullPath);
            const age = now.getTime() - stat.mtime.getTime();
            if (age < newestAgeMs) newestAgeMs = age;
          }
        } catch { /* dir empty / unreadable — allow backup */ }
        shouldBackup = !inSameMinute && newestAgeMs >= AUTOSAVE_BACKUP_THROTTLE_MS;
      }

      if (shouldBackup) {
        const isoStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupPath = path.join(backupDir, `manifest-editor-${source}-${isoStamp}.json`);
        fs.copyFileSync(editorPath, backupPath);
      }
    }

    fs.writeFileSync(editorPath, JSON.stringify(body, null, 2));

    // Auto-export: regenerate src/data/manifests/<deviceId>.json so
    // production renders match the contractor's latest save. Eliminates
    // the "I forgot to click Export" workflow gap. Best-effort — a
    // failure here doesn't fail the save (contractor's primary file is
    // already on disk; the production export can be retried via the
    // /api/pipeline/{deviceId}/export-manifest route if needed).
    try {
      const { exportManifest } = await import('@/lib/pipeline/exportManifest');
      exportManifest(deviceId);
    } catch {
      /* best-effort — manual export route is the fallback */
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to write editor manifest' },
      { status: 500 },
    );
  }
}
