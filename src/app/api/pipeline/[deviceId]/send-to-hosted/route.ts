import { NextRequest, NextResponse } from 'next/server';
import { initDevice, putPhoto } from '@/lib/hosted-storage';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/pipeline/{deviceId}/send-to-hosted
 *
 * Local-only route: reads manifest + photos from local filesystem,
 * uploads to Vercel Blob (separate status.json + manifest.json blobs).
 *
 * Response shape: { ok, output?, error? } — consumed by PipelineDetail.ContractorActions
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const pipelineDir = path.join(process.cwd(), '.pipeline', deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');

  if (!fs.existsSync(editorPath)) {
    return NextResponse.json({ error: 'No editor manifest found' }, { status: 404 });
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));

    // Read pipeline state for proper device name/manufacturer
    // (manifest may only have the slug as deviceName)
    let deviceName = manifest.deviceName ?? deviceId;
    let manufacturer = manifest.manufacturer ?? '';
    const statePath = path.join(pipelineDir, 'state.json');
    if (fs.existsSync(statePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        if (state.deviceName) deviceName = state.deviceName;
        if (state.manufacturer) manufacturer = state.manufacturer;
      } catch { /* ignore parse errors — fall back to manifest values */ }
    }

    // Read optional note from request body
    let note: string | undefined;
    try {
      const body = await _request.json();
      note = body?.note;
    } catch { /* no body is fine */ }

    // Write both blobs (status.json + manifest.json)
    await initDevice(
      deviceId,
      deviceName,
      manufacturer,
      manifest,
      { adminNote: note },
    );

    // Upload photos
    let photoCount = 0;
    const photosDir = path.join(pipelineDir, 'input', 'photos');
    if (fs.existsSync(photosDir)) {
      for (const file of fs.readdirSync(photosDir)) {
        const filePath = path.join(photosDir, file);
        if (!fs.statSync(filePath).isFile()) continue;
        const data = fs.readFileSync(filePath);
        await putPhoto(deviceId, file, data);
        photoCount++;
      }
    }

    const controlCount = typeof manifest.controls === 'object'
      ? Object.keys(manifest.controls).length
      : Array.isArray(manifest.controls) ? manifest.controls.length : 0;

    return NextResponse.json({
      ok: true,
      output: `Sent to contractor: ${deviceId} (${controlCount} controls, ${photoCount} photos)`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to send to hosted', details: (err as Error).message },
      { status: 500 },
    );
  }
}
