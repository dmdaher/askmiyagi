import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';

/**
 * POST /api/pipeline/{deviceId}/versions/restore
 *
 * Restore a backup version of manifest-editor.json.
 * Steps:
 * 1. Validate filename (prevent path traversal)
 * 2. Backup current manifest-editor.json (append-only)
 * 3. Copy selected backup to manifest-editor.json
 * 4. Recompute _manifestVersion from current pipeline manifest
 * 5. Return restored data for direct setState
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const { filename } = await request.json();

  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  }

  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');
  const backupDir = path.join(pipelineDir, 'backups');
  const selectedPath = path.join(backupDir, filename);

  // Security: prevent path traversal
  const resolvedBackup = path.resolve(selectedPath);
  const resolvedDir = path.resolve(backupDir);
  if (!resolvedBackup.startsWith(resolvedDir)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  if (!fs.existsSync(selectedPath)) {
    return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
  }

  try {
    // Backup current state first (append-only — never delete)
    if (fs.existsSync(editorPath)) {
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const preRestoreBackup = path.join(backupDir, `manifest-editor-${timestamp}.json`);
      fs.copyFileSync(editorPath, preRestoreBackup);
    }

    // Read the selected backup
    const restoredData = JSON.parse(fs.readFileSync(selectedPath, 'utf-8'));

    // Recompute _manifestVersion from current pipeline manifest
    // so staleness check doesn't discard the restored data
    const pipelineManifestPath = path.join(pipelineDir, 'manifest.json');
    if (fs.existsSync(pipelineManifestPath)) {
      try {
        const pipelineData = JSON.parse(fs.readFileSync(pipelineManifestPath, 'utf-8'));
        restoredData._manifestVersion = computeManifestVersion(pipelineData);
      } catch { /* keep original version */ }
    }

    // Write restored data as current manifest-editor.json
    fs.writeFileSync(editorPath, JSON.stringify(restoredData, null, 2));

    // Normalize sections/controls to arrays for the response (same as GET handler)
    if (restoredData.sections && !Array.isArray(restoredData.sections)) {
      restoredData.sections = Object.values(restoredData.sections);
    }
    if (restoredData.controls && !Array.isArray(restoredData.controls)) {
      restoredData.controls = Object.values(restoredData.controls);
    }

    return NextResponse.json({ ...restoredData, _source: 'restore' });
  } catch {
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
}
