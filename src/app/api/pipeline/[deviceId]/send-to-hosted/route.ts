import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/pipeline/{deviceId}/send-to-hosted
 *
 * Local-only route: reads manifest + photos from local filesystem,
 * uploads to Vercel Blob for the hosted contractor editor.
 * Server-side Blob SDK calls — no CORS issues.
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

    const state = {
      deviceId,
      deviceName: manifest.deviceName ?? deviceId,
      manufacturer: manifest.manufacturer ?? '',
      status: 'ready',
      manifest,
      updatedAt: new Date().toISOString(),
    };

    // Upload state — allowOverwrite required
    await put(`devices/${deviceId}/state.json`, JSON.stringify(state), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Upload photos — allowOverwrite required
    let photoCount = 0;
    const photosDir = path.join(pipelineDir, 'input', 'photos');
    if (fs.existsSync(photosDir)) {
      for (const file of fs.readdirSync(photosDir)) {
        const filePath = path.join(photosDir, file);
        if (!fs.statSync(filePath).isFile()) continue;
        const data = fs.readFileSync(filePath);
        await put(`devices/${deviceId}/photos/${file}`, data as any, {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
        });
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
