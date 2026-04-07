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

  // Backups (sorted newest first)
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('manifest-editor-') && f.endsWith('.json'))
      .sort()
      .reverse();

    for (const file of files.slice(0, 20)) {
      const fullPath = path.join(backupDir, file);
      try {
        const stat = fs.statSync(fullPath);
        // Parse timestamp from filename: manifest-editor-YYYY-MM-DDTHH-MM-SS.json
        const tsMatch = file.match(/manifest-editor-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.json/);
        const timestamp = tsMatch
          ? tsMatch[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') + 'Z'
          : stat.mtime.toISOString();

        versions.push({
          filename: file,
          timestamp,
          sizeBytes: stat.size,
          isCurrent: false,
        });
      } catch {
        // Skip unreadable files
      }
    }
  }

  return NextResponse.json({
    versions,
    total: versions.length,
  });
}
