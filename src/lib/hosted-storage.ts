import { put, list, head } from '@vercel/blob';

const BLOB_PREFIX = 'devices';

// ─── State (manifest + status) ──────────────────────────────────────────────

export interface DeviceState {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: 'ready' | 'in-progress' | 'submitted' | 'approved';
  manifest: Record<string, unknown>;
  reviewNote?: string;
  updatedAt: string;
}

function statePath(deviceId: string) {
  return `${BLOB_PREFIX}/${deviceId}/state.json`;
}

export async function getDeviceState(deviceId: string): Promise<DeviceState | null> {
  try {
    const meta = await head(statePath(deviceId));
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function putDeviceState(deviceId: string, state: DeviceState): Promise<void> {
  await put(statePath(deviceId), JSON.stringify(state), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function listDevices(): Promise<Array<{ deviceId: string; deviceName: string; manufacturer: string; status: string; updatedAt: string; reviewNote?: string }>> {
  const { blobs } = await list({ prefix: `${BLOB_PREFIX}/` });
  const stateBlobs = blobs.filter(b => b.pathname.endsWith('/state.json'));

  const results = await Promise.all(
    stateBlobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url);
        const state: DeviceState = await res.json();
        return {
          deviceId: state.deviceId,
          deviceName: state.deviceName,
          manufacturer: state.manufacturer,
          status: state.status,
          updatedAt: state.updatedAt,
          reviewNote: state.reviewNote,
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter(Boolean) as Array<{ deviceId: string; deviceName: string; manufacturer: string; status: string; updatedAt: string }>;
}

// ─── Photos ─────────────────────────────────────────────────────────────────

export async function listPhotos(deviceId: string): Promise<Array<{ name: string; url: string }>> {
  const { blobs } = await list({ prefix: `${BLOB_PREFIX}/${deviceId}/photos/` });
  return blobs.map(b => ({
    name: b.pathname.split('/').pop() ?? b.pathname,
    url: b.url,
  }));
}

export async function putPhoto(deviceId: string, name: string, data: Buffer | Uint8Array): Promise<string> {
  const blob = await put(`${BLOB_PREFIX}/${deviceId}/photos/${name}`, data as any, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}
