import { NextRequest, NextResponse } from 'next/server';
import { listManifestHistory, restoreFromHistory, getDeviceManifest, parseBackupSource } from '@/lib/hosted-storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hosted/panels/{deviceId}/history
 *
 * Returns hosted manifest backups for this device, shaped to match
 * /api/pipeline/{id}/versions so VersionHistoryDropdown can consume both.
 *
 * The `filename` field carries the blob URL — the dropdown round-trips
 * it back to this endpoint's POST handler unchanged. Since the dropdown
 * only displays `timestamp`, the opaque URL inside `filename` is fine.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const versions: Array<{
    filename: string;
    timestamp: string;
    sizeBytes: number;
    isCurrent: boolean;
    source?: 'autosave' | 'manual' | 'submit' | 'send' | 'restore';
  }> = [];

  // Current manifest (top of list)
  const currentManifest = await getDeviceManifest(deviceId);
  if (currentManifest) {
    const updatedAt = (currentManifest as Record<string, unknown>)._updatedAt;
    versions.push({
      filename: 'current',
      timestamp: typeof updatedAt === 'string' ? updatedAt : new Date().toISOString(),
      sizeBytes: JSON.stringify(currentManifest).length,
      isCurrent: true,
    });
  }

  // Historical backups (newest first from listManifestHistory).
  // Parse source from filename — `<source>-<isostamp>.json` for new backups,
  // legacy backups without a source prefix default to 'autosave'.
  const history = await listManifestHistory(deviceId);
  for (const entry of history) {
    versions.push({
      filename: entry.url, // round-trip URL via filename so restore POST gets it back
      timestamp: entry.timestamp,
      sizeBytes: entry.sizeBytes,
      isCurrent: false,
      source: parseBackupSource(entry.name),
    });
  }

  return NextResponse.json({
    versions,
    total: versions.length,
  });
}

/**
 * POST /api/hosted/panels/{deviceId}/history
 *
 * Restore a backup. Accepts either:
 *   { filename: <blob-url> } — from VersionHistoryDropdown (mirrors local API)
 *   { url: <blob-url> }      — legacy from earlier HostedHistoryButton + admin
 *
 * Validates the URL belongs to this device's history prefix before copying,
 * to prevent cross-device or external-URL restores.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();
  const candidate = (body.filename ?? body.url) as string | undefined;

  if (!candidate || typeof candidate !== 'string') {
    return NextResponse.json({ error: 'filename or url is required' }, { status: 400 });
  }

  // Security: confirm the candidate URL is one of this device's history blobs.
  // Prevents a malicious or buggy client from copying an arbitrary URL over
  // the manifest blob.
  const validBackups = await listManifestHistory(deviceId);
  const valid = validBackups.some(b => b.url === candidate);
  if (!valid) {
    return NextResponse.json({ error: 'Backup not found for this device' }, { status: 404 });
  }

  const ok = await restoreFromHistory(deviceId, candidate);
  if (!ok) {
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: 'Manifest restored from backup' });
}
