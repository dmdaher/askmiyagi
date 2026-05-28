import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';
import { buildPhotoSearchDirs } from './dirs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  const photoDirs = buildPhotoSearchDirs(deviceId, state.manufacturer, state.deviceName);

  const photos: Array<{ name: string; path: string; size: number }> = [];

  for (const dir of photoDirs) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          photos.push({
            name: file,
            path: `/api/pipeline/${deviceId}/photos/${encodeURIComponent(file)}`,
            size: stat.size,
          });
        }
      }
      if (photos.length > 0) break; // Found photos, stop searching
    } catch { /* dir doesn't exist */ }
  }

  // If a specific photo is requested via query param, serve the file
  const fileName = request.nextUrl.searchParams.get('file');
  if (fileName) {
    for (const dir of photoDirs) {
      const filePath = path.join(dir, fileName);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const contentType = ext === '.png' ? 'image/png'
          : ext === '.webp' ? 'image/webp'
          : 'image/jpeg';
        return new Response(data, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
        });
      }
    }
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  return NextResponse.json({ photos });
}
