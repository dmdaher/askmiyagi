# Blob Manifest Backup + Audit Fix Action — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Prevent permanent loss of contractor edits when admin overwrites Blob manifests, and enable the audit system to fix wrong labels/types on existing controls.

**Architecture:** Add `backupManifest()` using Vercel Blob `copy()` before every admin overwrite. Add editorLabel creation for newly added controls. Keep last 5 backups per device. History API + admin UI for restore.

**Tech Stack:** Vercel Blob SDK (`copy`, `list`, `del`), Next.js API routes, React

---

### Task 1: Add backup functions to hosted-storage.ts

**Files:**
- Modify: `src/lib/hosted-storage.ts`

**Step 1: Add `copy` and `del` to imports**

```typescript
import { put, list, head, copy, del } from '@vercel/blob';
```

**Step 2: Add `backupManifest()` function after `putDeviceManifest()`**

```typescript
const MAX_HISTORY = 5;

export async function backupManifest(deviceId: string): Promise<string | null> {
  try {
    const meta = await head(manifestPath(deviceId));
    const historyPath = `${PREFIX}/${deviceId}/history/${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await copy(meta.url, historyPath, { access: 'public' });
    
    // Prune old backups beyond MAX_HISTORY
    const { blobs } = await list({ prefix: `${PREFIX}/${deviceId}/history/` });
    if (blobs.length > MAX_HISTORY) {
      const sorted = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      const toDelete = sorted.slice(MAX_HISTORY);
      for (const blob of toDelete) {
        await del(blob.url);
      }
    }
    
    return historyPath;
  } catch {
    return null; // Backup is best-effort — don't block the overwrite
  }
}
```

**Step 3: Add `listManifestHistory()` function**

```typescript
export async function listManifestHistory(deviceId: string): Promise<Array<{ name: string; url: string; timestamp: string; sizeBytes: number }>> {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}/${deviceId}/history/` });
    return blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map(b => ({
        name: b.pathname.split('/').pop() ?? b.pathname,
        url: b.url,
        timestamp: b.uploadedAt.toISOString(),
        sizeBytes: b.size,
      }));
  } catch {
    return [];
  }
}
```

**Step 4: Add `restoreFromHistory()` function**

```typescript
export async function restoreFromHistory(deviceId: string, historyUrl: string): Promise<boolean> {
  try {
    // Backup current before restoring (safety net)
    await backupManifest(deviceId);
    // Copy history file to current manifest path
    await copy(historyUrl, manifestPath(deviceId), { access: 'public', addRandomSuffix: false });
    return true;
  } catch {
    return false;
  }
}
```

**Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: clean

**Step 6: Commit**

```bash
git add src/lib/hosted-storage.ts
git commit -m "feat: blob manifest backup — backupManifest, listHistory, restoreFromHistory"
```

---

### Task 2: Call backupManifest before admin overwrites

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/send-to-hosted/route.ts`
- Modify: `src/app/api/pipeline/[deviceId]/audit-controls/add/route.ts`

**Step 1: Add backup to send-to-hosted**

In `send-to-hosted/route.ts`, add import and call before `initDevice()`:

```typescript
import { initDevice, putPhoto, backupManifest } from '@/lib/hosted-storage';
```

Before the `await initDevice(...)` call, add:
```typescript
// Backup contractor's current manifest before overwriting
await backupManifest(deviceId);
```

**Step 2: Add backup to audit-controls/add**

In `audit-controls/add/route.ts`, add import and call before `initDevice()`:

```typescript
import { initDevice, getDeviceIssues, putDeviceIssues, backupManifest } from '@/lib/hosted-storage';
```

Before the `await initDevice(...)` call, add:
```typescript
// Backup contractor's current manifest before overwriting
await backupManifest(deviceId);
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Commit**

```bash
git add src/app/api/pipeline/[deviceId]/send-to-hosted/route.ts src/app/api/pipeline/[deviceId]/audit-controls/add/route.ts
git commit -m "feat: auto-backup blob manifest before admin overwrites"
```

---

### Task 3: Create history API endpoint

**Files:**
- Create: `src/app/api/hosted/panels/[deviceId]/history/route.ts`

**Step 1: Create GET + POST route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { listManifestHistory, restoreFromHistory } from '@/lib/hosted-storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const history = await listManifestHistory(deviceId);
  return NextResponse.json(history);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }
  const ok = await restoreFromHistory(deviceId, url);
  if (!ok) {
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: 'Manifest restored from backup' });
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: clean

**Step 3: Commit**

```bash
git add src/app/api/hosted/panels/[deviceId]/history/route.ts
git commit -m "feat: manifest history API — list backups + restore"
```

---

### Task 4: Add history UI to ContractorSubmissions

**Files:**
- Modify: `src/components/admin/ContractorSubmissions.tsx`

**Step 1: Add history state**

```typescript
const [deviceHistory, setDeviceHistory] = useState<Record<string, Array<{ name: string; url: string; timestamp: string; sizeBytes: number }>>>({});
const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
const [restoring, setRestoring] = useState<string | null>(null);
```

**Step 2: Add fetch + restore handlers**

```typescript
const fetchHistory = async (deviceId: string) => {
  const res = await fetch(`/api/hosted/panels/${deviceId}/history`);
  const data = await res.json();
  setDeviceHistory(prev => ({ ...prev, [deviceId]: Array.isArray(data) ? data : [] }));
};

const handleRestore = async (deviceId: string, url: string) => {
  if (!confirm('Restore this backup? Current manifest will be backed up first.')) return;
  setRestoring(deviceId);
  try {
    const res = await fetch(`/api/hosted/panels/${deviceId}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Restore failed');
    setResult(prev => ({ ...prev, [deviceId]: '✓ Restored from backup' }));
    fetchDevices();
  } catch (err) {
    setResult(prev => ({ ...prev, [deviceId]: `✗ ${(err as Error).message}` }));
  }
  setRestoring(null);
};
```

**Step 3: Add History button + expandable section on each device card**

After the issues section, add:

```tsx
<button
  onClick={() => {
    const next = new Set(expandedHistory);
    if (next.has(d.deviceId)) {
      next.delete(d.deviceId);
    } else {
      next.add(d.deviceId);
      fetchHistory(d.deviceId);
    }
    setExpandedHistory(next);
  }}
  className="mt-2 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
>
  History {expandedHistory.has(d.deviceId) ? '▾' : '▸'}
</button>

{expandedHistory.has(d.deviceId) && (
  <div className="mt-1.5 space-y-1">
    {(deviceHistory[d.deviceId] ?? []).length === 0 ? (
      <p className="text-[10px] text-gray-600">No backups yet</p>
    ) : (
      (deviceHistory[d.deviceId] ?? []).map((h) => (
        <div key={h.name} className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500">
            {new Date(h.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            <span className="text-gray-600 ml-1">({Math.round(h.sizeBytes / 1024)}KB)</span>
          </span>
          <button
            onClick={() => handleRestore(d.deviceId, h.url)}
            disabled={restoring === d.deviceId}
            className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            Restore
          </button>
        </div>
      ))
    )}
  </div>
)}
```

**Step 4: Verify build + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean compile, 1028+ tests pass

**Step 5: Commit**

```bash
git add src/components/admin/ContractorSubmissions.tsx
git commit -m "feat: manifest history UI — list backups + restore on admin cards"
```

---

### Task 5: Fix audit "add" action to create editorLabels

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/audit-controls/add/route.ts`

**Step 1: When adding a new control, also create an editorLabel**

After pushing the new control to `manifest.controls`, add:

```typescript
// Create editorLabel for the new control so it's visible in the editor
if (Array.isArray(manifest.editorLabels)) {
  manifest.editorLabels.push({
    text: ctrl.label,
    controlId: ctrl.id,
    x: 0,
    y: -15,
    w: Math.max(ctrl.label.length * 7, 40),
    h: 14,
    fontSize: 9,
  });
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: clean

**Step 3: Commit**

```bash
git add src/app/api/pipeline/[deviceId]/audit-controls/add/route.ts
git commit -m "fix: create editorLabel for newly added controls"
```

---

### Task 6: Final verification

**Step 1: Full type check + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean, 1028+ tests pass

**Step 2: Build check**

Run: `npx next build 2>&1 | grep -E 'history|error|Error'`
Expected: `/api/hosted/panels/[deviceId]/history` route registered, no errors

**Step 3: Manual test — backup on send-to-hosted**

```bash
curl -X POST http://localhost:3000/api/pipeline/fantom-06/send-to-hosted \
  -H 'Content-Type: application/json' -d '{}'
```

Then verify backup exists:
```bash
curl http://localhost:3000/api/hosted/panels/fantom-06/history
```

Expected: array with 1 backup entry

**Step 4: Manual test — restore**

```bash
curl -X POST http://localhost:3000/api/hosted/panels/fantom-06/history \
  -H 'Content-Type: application/json' \
  -d '{"url": "<url-from-step-3>"}'
```

Expected: `{ ok: true }`

**Step 5: Push + PR**

```bash
git push origin feature/pipeline-v2
gh pr create --base test --title "feat: blob backup + audit fix action + editorLabel creation"
```
