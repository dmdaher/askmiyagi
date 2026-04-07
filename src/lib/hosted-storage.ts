/**
 * Vercel Blob storage for hosted contractor editor.
 *
 * RULES (non-negotiable):
 * 1. Every put() call MUST include allowOverwrite: true
 * 2. Every fetch() from Blob MUST include { cache: 'no-store' }
 * 3. One state.json per device at devices/{deviceId}/state.json
 * 4. Photos at devices/{deviceId}/photos/{name}.jpg
 */

import { put, list, head } from '@vercel/blob';

const PREFIX = 'devices';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DeviceStatus = 'ready' | 'in-progress' | 'submitted' | 'approved';

export interface DeviceState {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: DeviceStatus;
  manifest: Record<string, unknown>;
  reviewNote?: string;
  updatedAt: string;
}

export interface DeviceSummary {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: DeviceStatus;
  updatedAt: string;
  reviewNote?: string;
}

// ─── Valid state transitions ────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<DeviceStatus, DeviceStatus[]> = {
  'ready': ['in-progress'],
  'in-progress': ['submitted'],
  'submitted': ['approved', 'in-progress'],
  'approved': ['in-progress'],
};

export function isValidTransition(from: DeviceStatus, to: DeviceStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Read operations (ALL use cache: 'no-store') ────────────────────────────

export async function getDeviceState(deviceId: string): Promise<DeviceState | null> {
  try {
    const meta = await head(`${PREFIX}/${deviceId}/state.json`);
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function listDevices(): Promise<DeviceSummary[]> {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}/` });
    const stateBlobs = blobs.filter(b => b.pathname.endsWith('/state.json'));

    const results = await Promise.all(
      stateBlobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url, { cache: 'no-store' });
          const state: DeviceState = await res.json();
          return {
            deviceId: state.deviceId,
            deviceName: state.deviceName,
            manufacturer: state.manufacturer,
            status: state.status,
            updatedAt: state.updatedAt,
            reviewNote: state.reviewNote,
          } as DeviceSummary;
        } catch {
          return null;
        }
      })
    );

    return results.filter(Boolean) as DeviceSummary[];
  } catch {
    return [];
  }
}

export async function listPhotos(deviceId: string): Promise<Array<{ name: string; url: string }>> {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}/${deviceId}/photos/` });
    return blobs.map(b => ({
      name: b.pathname.split('/').pop() ?? b.pathname,
      url: b.url,
    }));
  } catch {
    return [];
  }
}

// ─── Write operations (ALL use allowOverwrite: true) ────────────────────────

export async function putDeviceState(deviceId: string, state: DeviceState): Promise<void> {
  await put(`${PREFIX}/${deviceId}/state.json`, JSON.stringify(state), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function putPhoto(deviceId: string, name: string, data: Buffer | Uint8Array): Promise<string> {
  const blob = await put(`${PREFIX}/${deviceId}/photos/${name}`, data as any, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}
