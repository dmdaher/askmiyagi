import { NextRequest, NextResponse } from 'next/server';
import { getDeviceStatus, getDeviceManifest } from '@/lib/hosted-storage';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/pipeline/{deviceId}/pull-from-hosted
 *
 * Local-only route: pulls contractor's manifest from hosted Blob,
 * writes to local manifest-editor.json, then runs export-manifest.
 *
 * Response shape: { ok, output?, error?, status? }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  try {
    const [status, manifest] = await Promise.all([
      getDeviceStatus(deviceId),
      getDeviceManifest(deviceId),
    ]);

    if (!status || !manifest) {
      return NextResponse.json({ error: 'Device not found in hosted storage' }, { status: 404 });
    }

    // Write manifest to local filesystem
    const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
    if (!fs.existsSync(pipelineDir)) {
      fs.mkdirSync(pipelineDir, { recursive: true });
    }
    const editorPath = path.join(pipelineDir, 'manifest-editor.json');
    // Backup local manifest before overwriting with Blob version
    if (fs.existsSync(editorPath)) {
      const backupPath = path.join(pipelineDir, `manifest-editor-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.copyFileSync(editorPath, backupPath);
    }

    // Re-stamp _manifestVersion to match the local pipeline manifest BEFORE
    // writing. The pulled file IS the new editor baseline relative to local
    // state; without this, the GET handler's staleness check (manifest/route.ts)
    // would auto-rename the contractor's freshly-pulled file to `.stale`
    // whenever the local pipeline has drifted (gatekeeper rerun, manual edit)
    // since the contractor was sent the file. That rename is silently
    // destructive and was the cause of "pulled file looks like it never started"
    // bug. If manifest.json is missing, we leave the contractor's stored
    // version intact — staleness check is a no-op without it.
    const mainPath = path.join(pipelineDir, 'manifest.json');
    const writeData: Record<string, unknown> = { ...manifest };
    if (fs.existsSync(mainPath)) {
      try {
        const mainData = JSON.parse(fs.readFileSync(mainPath, 'utf-8'));
        writeData._manifestVersion = computeManifestVersion(mainData);
      } catch { /* keep contractor's _manifestVersion if main read fails */ }
    }
    fs.writeFileSync(editorPath, JSON.stringify(writeData, null, 2));

    // Run export-manifest to write production JSON
    let exported = false;
    try {
      const exportRes = await fetch(`http://localhost:3000/api/pipeline/${deviceId}/export-manifest`, {
        method: 'POST',
      });
      exported = exportRes.ok;
    } catch { /* export is best-effort */ }

    return NextResponse.json({
      ok: true,
      status: status.status,
      output: `Pulled manifest from hosted (status: ${status.status}). Local manifest-editor.json updated.${exported ? ' Production manifest exported.' : ''}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to pull from hosted', details: (err as Error).message },
      { status: 500 },
    );
  }
}
