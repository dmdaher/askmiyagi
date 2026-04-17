import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDeviceStatus, initDevice, putPhoto } from '@/lib/hosted-storage';

/**
 * POST /api/hosted/panels/seed-practice
 *
 * Idempotently seeds sandbox practice instruments into Vercel Blob.
 * Clones real manifests + photos so contractors can practice the editor.
 */

interface PracticeDevice {
  sandboxId: string;
  deviceName: string;
  manufacturer: string;
  manifestSource: string;      // path to manifest JSON
  photosSource: string;        // directory with reference photos
}

const PRACTICE_DEVICES: PracticeDevice[] = [
  {
    sandboxId: 'sandbox-fantom-06',
    deviceName: 'Fantom 06 (Practice)',
    manufacturer: 'Roland',
    manifestSource: 'src/data/manifests/fantom-06.json',
    photosSource: '.pipeline/fantom-06/input/photos',
  },
  {
    sandboxId: 'sandbox-cdj-3000',
    deviceName: 'CDJ-3000 (Practice)',
    manufacturer: 'Pioneer DJ',
    manifestSource: '.pipeline/cdj-3000/manifest-editor.json',
    photosSource: '.pipeline/cdj-3000/input/photos',
  },
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const force = (body as Record<string, unknown>).force === true;
  const results: Array<{ deviceId: string; action: string }> = [];

  for (const device of PRACTICE_DEVICES) {
    // Skip if already seeded (unless force=true to re-seed with updated format)
    if (!force) {
      const existing = await getDeviceStatus(device.sandboxId);
      if (existing) {
        results.push({ deviceId: device.sandboxId, action: 'already exists' });
        continue;
      }
    }

    // Read manifest from disk
    const manifestPath = path.resolve(device.manifestSource);
    if (!fs.existsSync(manifestPath)) {
      results.push({ deviceId: device.sandboxId, action: `skipped — manifest not found: ${device.manifestSource}` });
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Transform production manifest format → editor auto-save format
    // Production uses editorPosition: { x, y, w, h } nested; editor expects flat x, y, w, h
    // Production uses editorSections; editor expects sections with childIds
    const manifest: Record<string, unknown> = {
      ...raw,
      deviceId: device.sandboxId,
      deviceName: device.deviceName,
      _source: 'editor',
    };

    // Convert editorSections → sections (with childIds)
    if (raw.editorSections && !raw.sections) {
      const controls = Array.isArray(raw.controls) ? raw.controls : [];
      manifest.sections = raw.editorSections.map((s: any) => ({
        ...s,
        childIds: controls
          .filter((c: any) => {
            // Assign control to section by checking if control is inside section bounds
            const pos = c.editorPosition ?? c;
            const cx = pos.x + (pos.w ?? 0) / 2;
            const cy = pos.y + (pos.h ?? 0) / 2;
            return cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h;
          })
          .map((c: any) => c.id),
      }));
      delete manifest.editorSections;
    }

    // Flatten editorPosition into controls
    if (Array.isArray(raw.controls)) {
      manifest.controls = raw.controls.map((c: any) => {
        const pos = c.editorPosition ?? {};
        const { editorPosition, ...rest } = c;
        return {
          ...rest,
          x: pos.x ?? 0,
          y: pos.y ?? 0,
          w: pos.w ?? 40,
          h: pos.h ?? 40,
          sectionId: rest.sectionId ?? '',
          locked: rest.locked ?? false,
          labelPosition: rest.labelPosition ?? 'above',
        };
      });
    }

    // Seed to Blob
    await initDevice(
      device.sandboxId,
      device.deviceName,
      device.manufacturer,
      manifest,
      { isSandbox: true },
    );

    // Upload photos
    const photosDir = path.resolve(device.photosSource);
    if (fs.existsSync(photosDir)) {
      const photos = fs.readdirSync(photosDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      for (const photo of photos) {
        const data = fs.readFileSync(path.join(photosDir, photo));
        await putPhoto(device.sandboxId, photo, data);
      }
      const controlCount = Array.isArray(manifest.controls) ? manifest.controls.length : '?';
      results.push({ deviceId: device.sandboxId, action: `seeded with ${controlCount} controls, ${photos.length} photos` });
    } else {
      results.push({ deviceId: device.sandboxId, action: `seeded (no photos found at ${device.photosSource})` });
    }
  }

  return NextResponse.json({ ok: true, results });
}
