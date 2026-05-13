/**
 * Vercel Blob storage for hosted contractor editor.
 *
 * ARCHITECTURE: Status and manifest are SEPARATE blobs.
 *   devices/{deviceId}/status.json   — status + reviewNote (small, PATCH only)
 *   devices/{deviceId}/manifest.json — full editor manifest (large, PUT auto-save)
 *   devices/{deviceId}/photos/*.jpg  — reference photos
 *
 * This eliminates the race condition where auto-save PUT overwrites
 * the status set by PATCH — they never touch the same blob.
 *
 * RULES:
 * 1. Every put() call MUST include allowOverwrite: true
 * 2. Every fetch() from Blob URL MUST use cache buster + { cache: 'no-store' }
 */

import { put, list, head, copy, del } from '@vercel/blob';

const PREFIX = 'devices';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DeviceStatus = 'ready' | 'in-progress' | 'submitted' | 'approved';

export type StatusEventType = 'sent-to-contractor' | 'submitted' | 'changes-requested' | 'approved';

export interface StatusEvent {
  type: StatusEventType;
  timestamp: string;
  note?: string;
  by: 'admin' | 'contractor';
}

export interface DeviceStatusData {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: DeviceStatus;
  adminNote?: string;       // admin → contractor (feedback, instructions)
  contractorNote?: string;  // contractor → admin (submission notes)
  isSandbox?: boolean;      // practice instrument — no submit, hidden from admin
  events?: StatusEvent[];   // timeline of all submissions, reviews, approvals
  updatedAt: string;
}

export interface DeviceSummary {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: DeviceStatus;
  updatedAt: string;
  adminNote?: string;
  contractorNote?: string;
  isSandbox?: boolean;
  events?: StatusEvent[];
}

// ─── Valid state transitions ────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<DeviceStatus, DeviceStatus[]> = {
  'ready': ['in-progress', 'submitted'],
  'in-progress': ['submitted'],
  'submitted': ['approved', 'in-progress', 'submitted'],
  'approved': ['in-progress'],
};

export function isValidTransition(from: DeviceStatus, to: DeviceStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Helper: fetch with cache buster ────────────────────────────────────────

async function fetchFresh(url: string): Promise<Response> {
  const bustUrl = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
  return fetch(bustUrl, { cache: 'no-store' });
}

// ─── Status operations (separate blob — never touched by auto-save) ─────────

function statusPath(deviceId: string) {
  return `${PREFIX}/${deviceId}/status.json`;
}

export async function getDeviceStatus(deviceId: string): Promise<DeviceStatusData | null> {
  try {
    const meta = await head(statusPath(deviceId));
    const res = await fetchFresh(meta.url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function putDeviceStatus(deviceId: string, data: DeviceStatusData): Promise<void> {
  await put(statusPath(deviceId), JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0, // Disable CDN caching — status changes on submit/approve
  });
}

// ─── Manifest operations (separate blob — auto-save writes here) ────────────

function manifestPath(deviceId: string) {
  return `${PREFIX}/${deviceId}/manifest.json`;
}

export async function getDeviceManifest(deviceId: string): Promise<Record<string, unknown> | null> {
  try {
    const meta = await head(manifestPath(deviceId));
    const res = await fetchFresh(meta.url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function putDeviceManifest(deviceId: string, manifest: Record<string, unknown>): Promise<void> {
  await put(manifestPath(deviceId), JSON.stringify(manifest), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0, // Disable CDN caching — manifest changes every 1.5s via auto-save
  });
}

// ─── Manifest history (backup before admin overwrites) ─────────────────────

const MAX_HISTORY = 50;
const AUTOSAVE_BACKUP_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes between autosave-triggered backups

function historyPrefix(deviceId: string) {
  return `${PREFIX}/${deviceId}/history/`;
}

/**
 * Backup the current manifest to history before overwriting. Best-effort.
 *
 * Behavior:
 * - { force: true } (default for admin actions) — always creates a snapshot
 * - { force: false } — skips if the most recent backup is < 5 minutes old.
 *   Used by the autosave PUT handler so the contractor's continuous typing
 *   doesn't flood Blob with thousands of nearly-identical snapshots.
 *
 * Returns the history path of the created backup, or null if skipped/failed.
 */
export async function backupManifest(
  deviceId: string,
  opts?: { force?: boolean },
): Promise<string | null> {
  const force = opts?.force ?? true;
  try {
    // List existing backups ONCE. We use this for both the throttle check
    // and the post-write prune so we don't hit Blob's list endpoint twice.
    const initialList = await list({ prefix: historyPrefix(deviceId) });

    // Throttle check: if not forced and a recent backup exists, skip.
    if (!force && initialList.blobs.length > 0) {
      const newest = [...initialList.blobs].sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0];
      const ageMs = Date.now() - new Date(newest.uploadedAt).getTime();
      if (ageMs < AUTOSAVE_BACKUP_THROTTLE_MS) {
        return null; // Within throttle window — skip
      }
    }

    const meta = await head(manifestPath(deviceId));
    const historyPath = `${historyPrefix(deviceId)}${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await copy(meta.url, historyPath, { access: 'public' });

    // Prune: count is current pre-copy count + 1 (the one we just wrote).
    // We compare to MAX_HISTORY using the pre-copy list — if it was already
    // at or above MAX_HISTORY, oldest entries get pruned.
    if (initialList.blobs.length >= MAX_HISTORY) {
      const sorted = [...initialList.blobs].sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      // Keep newest (MAX_HISTORY - 1) old entries + the one we just wrote = MAX_HISTORY total.
      const toDelete = sorted.slice(MAX_HISTORY - 1);
      for (const blob of toDelete) {
        await del(blob.url);
      }
    }

    return historyPath;
  } catch {
    return null; // Backup is best-effort — don't block the overwrite
  }
}

/** List manifest backups for a device, newest first. */
export async function listManifestHistory(deviceId: string): Promise<Array<{ name: string; url: string; timestamp: string; sizeBytes: number }>> {
  try {
    const { blobs } = await list({ prefix: historyPrefix(deviceId) });
    return [...blobs]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map(b => ({
        name: b.pathname.split('/').pop() ?? b.pathname,
        url: b.url,
        timestamp: typeof b.uploadedAt === 'string' ? b.uploadedAt : new Date(b.uploadedAt).toISOString(),
        sizeBytes: b.size,
      }));
  } catch {
    return [];
  }
}

/** Restore a manifest from history. Backs up current first as safety net. */
export async function restoreFromHistory(deviceId: string, historyUrl: string): Promise<boolean> {
  try {
    await backupManifest(deviceId);
    await copy(historyUrl, manifestPath(deviceId), { access: 'public', addRandomSuffix: false, allowOverwrite: true });
    return true;
  } catch {
    return false;
  }
}

// ─── List operations ────────────────────────────────────────────────────────

export async function listDevices(opts?: { sandbox?: boolean }): Promise<DeviceSummary[]> {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}/` });
    const statusBlobs = blobs.filter(b => b.pathname.endsWith('/status.json'));

    const results = await Promise.all(
      statusBlobs.map(async (blob) => {
        try {
          const res = await fetchFresh(blob.url);
          const data: DeviceStatusData = await res.json();
          return {
            deviceId: data.deviceId,
            deviceName: data.deviceName,
            manufacturer: data.manufacturer,
            status: data.status,
            updatedAt: data.updatedAt,
            adminNote: data.adminNote,
            contractorNote: data.contractorNote,
            isSandbox: data.isSandbox,
            events: data.events,
          } as DeviceSummary;
        } catch {
          return null;
        }
      })
    );

    const all = results.filter(Boolean) as DeviceSummary[];

    // Filter by sandbox flag: true = only sandbox, false/undefined = exclude sandbox
    if (opts?.sandbox === true) return all.filter(d => d.isSandbox);
    return all.filter(d => !d.isSandbox);
  } catch {
    return [];
  }
}

// ─── Photo operations ───────────────────────────────────────────────────────

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

export async function putPhoto(deviceId: string, name: string, data: Buffer | Uint8Array): Promise<string> {
  const blob = await put(`${PREFIX}/${deviceId}/photos/${name}`, data as any, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}

// ─── Issues operations (separate blob — contractor reports) ────────────────

export interface DeviceIssue {
  id: string;
  type: 'missing-control' | 'wrong-type' | 'wrong-data' | 'other';
  description: string;
  controlId?: string;
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution?: string;
  findings?: Array<{ id: string; label: string; type: string; manualPage?: string; section?: string }>;
}

function issuesPath(deviceId: string) {
  return `${PREFIX}/${deviceId}/issues.json`;
}

export async function getDeviceIssues(deviceId: string): Promise<DeviceIssue[]> {
  try {
    const meta = await head(issuesPath(deviceId));
    const res = await fetchFresh(meta.url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function putDeviceIssues(deviceId: string, issues: DeviceIssue[]): Promise<void> {
  await put(issuesPath(deviceId), JSON.stringify(issues), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// ─── Init device (writes both blobs) ────────────────────────────────────────

export async function initDevice(
  deviceId: string,
  deviceName: string,
  manufacturer: string,
  manifest: Record<string, unknown>,
  opts?: { adminNote?: string; isSandbox?: boolean },
): Promise<void> {
  await putDeviceStatus(deviceId, {
    deviceId,
    deviceName,
    manufacturer,
    status: 'ready',
    adminNote: opts?.adminNote,
    isSandbox: opts?.isSandbox,
    updatedAt: new Date().toISOString(),
  });
  await putDeviceManifest(deviceId, manifest);
}
