# Task #24: Contractor Editor Flow — Implementation Handoff

**Date:** 2026-04-05
**Branch:** `feature/pipeline-architecture-upgrade`
**Target:** `test` (never push to `main` — see CLAUDE.md)
**Estimated scope:** ~320 LOC new code, 1-3 days

---

## Context for a new Claude instance

This is a music studio app that builds digital twins of hardware instruments. The pipeline:
1. Hardware pipeline (Claude CLI agents) reads manual PDFs + photos → produces `manifest.json`
2. Owner edits control positions in a panel editor → saves to `manifest-editor.json`
3. Panel renders via `PanelRenderer` component from manifest JSON (no codegen — replaced this session)
4. Tutorial pipeline builds interactive tutorials referencing control IDs from the manifest

**The contractor** is a non-engineer designer who polishes control alignment/labels in the editor. They need a hosted version of the editor accessible via URL with zero local setup.

### What was built this session (all completed, all on this branch)

| Feature | Key files |
|---|---|
| **PanelRenderer** — renders any panel from manifest JSON | `src/components/controls/PanelRenderer.tsx` |
| **Flat ControlLayer** — controls render above sections, never blocked | `src/components/panel-editor/ControlLayer.tsx` |
| **Preview toggle** — toolbar button shows PanelShell production view | `src/components/panel-editor/PanCanvas.tsx` (previewMode branch) |
| **Export Panel** — writes manifest JSON (replaced codegen TSX) | `src/app/api/pipeline/[deviceId]/export-manifest/route.ts` |
| **Section label toggle** — show/hide + editable text per section | `src/components/panel-editor/PropertiesPanel/index.tsx` |
| **Label icons** — arrows/triangles/glyphs on labels | `src/lib/hardware-icons.ts`, `LabelLayer.tsx`, `PanelRenderer.tsx` |
| **Photo scroll fix** — horizontal scroll doesn't trigger zoom | `src/components/panel-editor/EditorWorkspace.tsx` |

### What the editor currently does

- Loads manifest from `/api/pipeline/{deviceId}/manifest` (GET reads `manifest-editor.json` from local `.pipeline/` dir)
- Auto-saves every 800ms via PUT to same endpoint (writes `manifest-editor.json`)
- "Export Panel" button writes `src/data/manifests/{deviceId}.json` for production
- "Preview" button renders via `PanelRenderer` with `PanelShell` wrapping
- All controls in flat `ControlLayer` (z=200) above sections
- Labels in `LabelLayer` (z=150) with icon support
- Keyboard via `KeyboardSection` with position/width from editor state

### What needs building (this task)

A hosted version of the same editor on Vercel, with:
- Contractor visits URL, enters password, edits panels, submits for review
- Owner visits review URL, approves or requests changes
- Storage: Vercel Blob (not local filesystem)
- Auth: password cookie (not NextAuth)

---

## Architecture

### Hosted (deployed to Vercel)

**New pages:**
- `src/app/editor/page.tsx` — contractor's panel list (shows devices with status)
- `src/app/editor/[deviceId]/page.tsx` — the editor for a specific device
- `src/app/admin/review/[deviceId]/page.tsx` — owner's read-only review (exists as scaffold, needs update)
- `src/app/signin/page.tsx` — password entry form

**New API routes (hosted, read/write Vercel Blob):**
- `src/app/api/hosted/panels/route.ts` — GET list all devices + statuses
- `src/app/api/hosted/panels/[deviceId]/route.ts` — GET manifest, PUT save manifest
- `src/app/api/hosted/panels/[deviceId]/status/route.ts` — PATCH update status
- `src/app/api/hosted/panels/[deviceId]/photos/route.ts` — GET list/serve photos

**New middleware:**
- `src/middleware.ts` — password cookie check for `/editor/*` and `/admin/review/*`

**New module:**
- `src/lib/hosted-storage.ts` — Vercel Blob read/write helpers

### Local (unchanged, add two buttons)

**Modified files:**
- Admin pipeline device card — add "Send to Contractor" button
- Admin pipeline device card — add "Build Tutorials" button (when status=approved)

---

## Storage: Vercel Blob

**Per-device state** stored at blob path `devices/{deviceId}/state.json`:
```json
{
  "deviceId": "fantom-06",
  "deviceName": "Fantom-06",
  "manufacturer": "Roland",
  "status": "ready",
  "manifest": { /* full editor manifest — controls, sections, labels, keyboard, etc. */ },
  "updatedAt": "2026-04-05T20:30:00Z"
}
```

**Photos** stored at blob path `devices/{deviceId}/photos/{name}.jpg`.

**Status values:** `"ready"` | `"in-progress"` | `"submitted"` | `"approved"`

**Vercel Blob SDK:**
```typescript
import { put, list, del } from '@vercel/blob';

// Write
const blob = await put(`devices/${deviceId}/state.json`, JSON.stringify(data), {
  access: 'public',
  contentType: 'application/json',
  addRandomSuffix: false,
});

// Read
const res = await fetch(blob.url);
const data = await res.json();

// List
const { blobs } = await list({ prefix: `devices/` });
```

**Env var needed:** `BLOB_READ_WRITE_TOKEN` (created in Vercel dashboard → Storage → Blob → Create Store)

---

## Auth: Password cookie middleware

**Env vars:**
- `CONTRACTOR_PASSWORD` — for `/editor/*` routes
- `ADMIN_PASSWORD` — for `/admin/review/*` routes

**`src/middleware.ts`:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/editor')) {
    const cookie = request.cookies.get('contractor_access')?.value;
    if (cookie !== process.env.CONTRACTOR_PASSWORD) {
      return NextResponse.redirect(new URL('/signin?role=contractor', request.url));
    }
  }

  if (pathname.startsWith('/admin/review')) {
    const cookie = request.cookies.get('admin_access')?.value;
    if (cookie !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/signin?role=admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/editor/:path*', '/admin/review/:path*'],
};
```

**`src/app/signin/page.tsx`:**
Simple form: password input + submit. On submit, sets cookie and redirects.
Read `role` from URL params to know which cookie to set.

---

## Hosted API routes

### GET `/api/hosted/panels` — list all devices

Reads all `devices/*/state.json` blobs. Returns array of `{ deviceId, deviceName, manufacturer, status, updatedAt }`.

### GET `/api/hosted/panels/[deviceId]` — get manifest

Reads `devices/{deviceId}/state.json` blob. Returns the full manifest for the editor to load.

### PUT `/api/hosted/panels/[deviceId]` — save manifest (auto-save)

Writes updated manifest to `devices/{deviceId}/state.json` blob. Called by editor auto-save (800ms debounce). Sets `status` to `"in-progress"` if currently `"ready"`.

### PATCH `/api/hosted/panels/[deviceId]/status` — update status

Body: `{ "status": "submitted" | "approved" | "in-progress" }`. Updates the status field in the blob.

### GET `/api/hosted/panels/[deviceId]/photos` — list/serve photos

Lists blobs at `devices/{deviceId}/photos/`. Returns URLs for the editor's side-by-side photo panel.

---

## Editor hosted-mode detection

```typescript
// src/lib/env.ts
export const isHosted = process.env.NEXT_PUBLIC_EDITOR_MODE === 'hosted';
```

**Env var:** `NEXT_PUBLIC_EDITOR_MODE=hosted` set on Vercel deployment.

### What changes in hosted mode

| Feature | Local mode | Hosted mode |
|---|---|---|
| Manifest load/save | `/api/pipeline/{id}/manifest` (filesystem) | `/api/hosted/panels/{id}` (Blob) |
| Photo loading | `/api/pipeline/{id}/photos` (filesystem) | `/api/hosted/panels/{id}/photos` (Blob) |
| "Export Panel" button | Visible (writes local JSON) | Hidden |
| "Preview" button | Visible | Visible |
| "Submit for Review" button | Hidden | Visible |
| "Clean Up" button | Visible | Visible |
| Pipeline controls (start, diagnostics) | Visible | Hidden |

### How to switch data source

The editor's `PanelEditor.tsx` currently loads manifest from:
```typescript
const res = await fetch(`/api/pipeline/${deviceId}/manifest`);
```

In hosted mode, change to:
```typescript
const apiBase = isHosted ? '/api/hosted/panels' : '/api/pipeline';
const res = await fetch(`${apiBase}/${deviceId}/manifest`);
// same for PUT auto-save
```

Alternatively, add a `useManifestApi(deviceId)` hook that returns the correct base URL.

---

## Page: `/editor` (contractor list)

Shows all devices the contractor can edit:

```
┌──────────────────────────────────────────────────┐
│  Your panels                                     │
│                                                  │
│  ● Fantom-06     Ready           [Edit →]        │
│  ● CDJ-3000      In progress     [Continue →]    │
│  ○ Prophet-5     Submitted       (awaiting review)│
│  ○ Deepmind-12   Approved        ✓               │
└──────────────────────────────────────────────────┘
```

Fetches from `GET /api/hosted/panels`. Each card links to `/editor/{deviceId}`.

---

## Page: `/editor/[deviceId]` (hosted editor)

Renders the existing `PanelEditor` component with:
- `isHosted=true` flag → swaps API endpoints to Blob-based routes
- Hides: Export Panel, pipeline buttons, diagnostics
- Shows: "Submit for Review" button (PATCH status → "submitted")
- Shows: "Preview" button (already built, works with PanelRenderer)

The editor auto-save targets the hosted API (Blob) instead of local filesystem.

---

## Page: `/admin/review/[deviceId]` (owner review)

Loads manifest from hosted Blob, renders editor with `readOnly=true`.
Two buttons:
- **Approve** → PATCH status="approved"
- **Request Changes** → PATCH status="in-progress" (optionally with a note)

Reuses the existing editor component — just different data source + readOnly mode.

---

## Local admin: "Send to Contractor" button

On the pipeline device card (when pipeline is complete), new button:

```typescript
async function handleSendToContractor() {
  // 1. Read local manifest-editor.json
  const manifest = await fetch(`/api/pipeline/${deviceId}/manifest`).then(r => r.json());

  // 2. Read local photos
  const photos = await fetch(`/api/pipeline/${deviceId}/photos`).then(r => r.json());

  // 3. Upload manifest to hosted Blob
  await fetch(`/api/hosted/panels/${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...manifest, status: 'ready' }),
  });

  // 4. Upload photos to hosted Blob (foreach photo)
  for (const photo of photos) {
    const photoBlob = await fetch(`/api/pipeline/${deviceId}/photos?file=${photo.name}`).then(r => r.blob());
    await fetch(`/api/hosted/panels/${deviceId}/photos`, {
      method: 'POST',
      body: photoBlob,
      headers: { 'X-Filename': photo.name },
    });
  }
}
```

This is a local-only button — it reads from local filesystem and writes to hosted Blob.

---

## Local admin: "Build Tutorials" button

Appears when hosted status = "approved". On click:

```typescript
async function handleBuildTutorials() {
  // 1. Pull approved manifest from hosted Blob
  const manifest = await fetch(`https://askmiyagi.vercel.app/api/hosted/panels/${deviceId}`).then(r => r.json());

  // 2. Write to local manifest-editor.json
  await fetch(`/api/pipeline/${deviceId}/manifest`, {
    method: 'PUT',
    body: JSON.stringify(manifest),
  });

  // 3. Export manifest JSON for production
  await fetch(`/api/pipeline/${deviceId}/export-manifest`, { method: 'POST' });

  // 4. Start tutorial pipeline (existing mechanism)
  // ... pipeline runner handles the rest
}
```

---

## Execution order

1. **Install `@vercel/blob`** — `npm install @vercel/blob`
2. **Create Blob store** in Vercel dashboard, get `BLOB_READ_WRITE_TOKEN`
3. **Build `src/lib/hosted-storage.ts`** — Blob read/write helpers
4. **Build hosted API routes** — panels list, manifest CRUD, status PATCH, photos
5. **Build `src/middleware.ts`** — password cookie auth
6. **Build `src/app/signin/page.tsx`** — password form
7. **Build `src/app/editor/page.tsx`** — contractor panel list
8. **Build `src/app/editor/[deviceId]/page.tsx`** — hosted editor wrapper
9. **Add `isHosted` flag** to editor components — swap API base, hide/show buttons
10. **Update `src/app/admin/review/[deviceId]/page.tsx`** — readOnly editor from Blob
11. **Add "Send to Contractor" button** to local admin device card
12. **Add "Build Tutorials" button** to local admin device card
13. **Add env vars** to Vercel: `BLOB_READ_WRITE_TOKEN`, `CONTRACTOR_PASSWORD`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_EDITOR_MODE=hosted`
14. **Deploy to Vercel**, test full round-trip with Fantom-06

---

## Testing checklist

- [ ] Contractor can sign in with password at `/signin`
- [ ] `/editor` lists devices from Blob
- [ ] Clicking "Edit" opens the editor with manifest loaded from Blob
- [ ] Auto-save writes to Blob (check blob store in Vercel dashboard)
- [ ] Status changes to "in-progress" on first edit
- [ ] "Submit for Review" sets status to "submitted"
- [ ] `/admin/review/{id}` shows panel in readOnly mode
- [ ] "Approve" sets status to "approved"
- [ ] "Request Changes" sets status back to "in-progress"
- [ ] "Send to Contractor" uploads manifest + photos to Blob from local
- [ ] "Build Tutorials" pulls manifest from Blob, writes locally, runs export
- [ ] Public pages (`/`, `/tutorial`, `/devices/*`) remain accessible without password
- [ ] Preview toggle works in hosted editor (PanelRenderer renders correctly)
- [ ] Labels, icons, section labels all persist through Blob save/load cycle

---

## Key files to understand before starting

| File | What it does |
|---|---|
| `src/components/panel-editor/PanelEditor.tsx` | Main editor shell — loads manifest, renders toolbar + workspace |
| `src/components/panel-editor/EditorWorkspace.tsx` | Canvas wrapper with photo side-by-side |
| `src/components/panel-editor/PanCanvas.tsx` | Renders sections, controls (ControlLayer), labels, keyboard. Preview mode renders PanelRenderer |
| `src/components/panel-editor/store/` | Zustand store — canvasSlice (zoom, pan, previewMode), manifestSlice (controls, sections, labels), historySlice (undo/redo) |
| `src/components/panel-editor/hooks/useAutoSave.ts` | Debounced auto-save — currently PUTs to `/api/pipeline/{id}/manifest` |
| `src/components/controls/PanelRenderer.tsx` | Production panel renderer — takes PanelManifest, renders PanelShell + controls + labels |
| `src/app/api/pipeline/[deviceId]/manifest/route.ts` | Current manifest GET/PUT — reads/writes local `.pipeline/{id}/manifest-editor.json` |
| `src/app/api/pipeline/[deviceId]/export-manifest/route.ts` | "Export Panel" — writes `src/data/manifests/{id}.json` |
| `src/lib/deviceRegistry.ts` | Maps device IDs to panel components — Fantom-06 uses `makePanelFromManifest` |
| `docs/contractor-guide/alignment-tools.md` | Tutorial reference for the contractor |
| `docs/plans/2026-04-05-panelrenderer-replaces-codegen.md` | Context on the PanelRenderer architecture |

---

## Important constraints (from CLAUDE.md)

- **NEVER push to `main`** — all PRs target `test`
- **NEVER create PRs targeting `main`** — only repo owner merges test → main
- Pipeline API routes (`/api/pipeline/*`) are local-only — they use `fs.*` and must NOT be deployed to Vercel serverless
- Hosted API routes (`/api/hosted/*`) are Vercel-safe — they use Blob SDK, no filesystem
- The contractor is NOT an engineer — no git, terminal, or dev tools
- One editor at a time per device — no concurrent editing conflict resolution

---

## Non-goals

- Hosting pipeline runners (stays local, needs Claude CLI)
- Auto-triggering tutorial pipeline on approval
- Email/Slack notifications (text/messaging between owner and contractor)
- Multi-contractor support (1 contractor for now)
- Mobile editor
- Real-time collaboration
