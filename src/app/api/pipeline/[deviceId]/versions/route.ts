import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/pipeline/{deviceId}/versions
 *
 * List all editor manifest backups for this device, newest first.
 * Includes the current manifest-editor.json as the first entry.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');
  const backupDir = path.join(pipelineDir, 'backups');

  const versions: Array<{
    filename: string;
    timestamp: string;
    sizeBytes: number;
    isCurrent: boolean;
    source?: 'autosave' | 'pull-from-hosted';
  }> = [];

  // Current version
  if (fs.existsSync(editorPath)) {
    const stat = fs.statSync(editorPath);
    versions.push({
      filename: 'current',
      timestamp: stat.mtime.toISOString(),
      sizeBytes: stat.size,
      isCurrent: true,
    });
  }

  // Helper: parse timestamp from a filename. Handles two patterns:
  //   - manifest-editor-2026-05-02T16-07-10.json      (regular autosave; in backups/)
  //   - manifest-editor-backup-2026-05-02T05-20-34-700Z.json  (pull-from-hosted; in pipelineDir/)
  function parseTimestamp(file: string, fallbackMtime: Date): string {
    const m1 = file.match(/manifest-editor-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.json/);
    if (m1) return m1[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') + 'Z';
    const m2 = file.match(/manifest-editor-backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3})Z\.json/);
    if (m2) {
      // 2026-05-02T05-20-34-700 → 2026-05-02T05:20:34.700Z
      return m2[1].replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})/, 'T$1:$2:$3.$4') + 'Z';
    }
    return fallbackMtime.toISOString();
  }

  // Regular autosave backups (in .pipeline/<id>/backups/). Contractor saves write
  // here via /api/pipeline/<id>/manifest PUT. Previously limited to 20; removed
  // the slice so contractors see their full edit history across sessions.
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('manifest-editor-') && f.endsWith('.json'));
    for (const file of files) {
      const fullPath = path.join(backupDir, file);
      try {
        const stat = fs.statSync(fullPath);
        versions.push({
          filename: file,
          timestamp: parseTimestamp(file, stat.mtime),
          sizeBytes: stat.size,
          isCurrent: false,
          source: 'autosave',
        });
      } catch { /* skip unreadable */ }
    }
  }

  // Pull-from-hosted backups (in .pipeline/<id>/ parent dir, not in backups/
  // subfolder). Written by /api/pipeline/<id>/pull-from-hosted route when admin
  // pulls contractor's edits. These were invisible in the dropdown until now.
  if (fs.existsSync(pipelineDir)) {
    const files = fs.readdirSync(pipelineDir)
      .filter(f => f.startsWith('manifest-editor-backup-') && f.endsWith('.json'));
    for (const file of files) {
      const fullPath = path.join(pipelineDir, file);
      try {
        const stat = fs.statSync(fullPath);
        versions.push({
          filename: file,
          timestamp: parseTimestamp(file, stat.mtime),
          sizeBytes: stat.size,
          isCurrent: false,
          source: 'pull-from-hosted',
        });
      } catch { /* skip unreadable */ }
    }
  }

  // Sort newest first by timestamp. Current always at top (its ISO mtime is
  // freshest by definition).
  versions.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return NextResponse.json({
    versions,
    total: versions.length,
  });
}
