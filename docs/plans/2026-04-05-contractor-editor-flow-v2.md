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

Reads `devices/{deviceId}/state.json` blob. **Returns the manifest in the SAME flat format as the local `/api/pipeline/{id}/manifest` endpoint** — NOT nested inside a `manifest` key. The `status` and `updatedAt` fields are added as top-level fields alongside the manifest data, plus `_source: 'hosted'`. This avoids branching in `PanelEditor.tsx` deserialization.

```typescript
// Response shape (must match local endpoint format):
{
  deviceId: "fantom-06",
  deviceName: "Fantom-06",
  manufacturer: "Roland",
  sections: {...},
  controls: {...},
  editorLabels: [...],
  keyboard: {...},
  canvasWidth: 1875,
  canvasHeight: 564,
  // hosted-only fields:
  _source: "hosted",
  _status: "in-progress",
  _updatedAt: "2026-04-05T..."
}
```

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

### `isHosted` propagation strategy: direct import (no prop drilling)

Use the module-level constant via direct import in each file that needs it. Do NOT pass `isHosted` as a prop through the component tree. It's a compile-time constant (`NEXT_PUBLIC_*`), tree-shaking removes dead code in the non-matching mode.

```typescript
// Import directly in any file that needs it:
import { isHosted } from '@/lib/env';
```

### Files that need `isHosted` URL switching

**`PanelEditor.tsx`** — manifest load (GET) + force-save (PUT) + export:
```typescript
import { isHosted } from '@/lib/env';
const apiBase = isHosted ? '/api/hosted/panels' : '/api/pipeline';
const res = await fetch(`${apiBase}/${deviceId}/manifest`);
// same for PUT auto-save
```

**`useAutoSave.ts`** — auto-save PUT endpoint:
```typescript
import { isHosted } from '@/lib/env';
const apiBase = isHosted ? '/api/hosted/panels' : '/api/pipeline';
fetch(`${apiBase}/${deviceId}/manifest`, { method: 'PUT', ... });
```

**`EditorWorkspace.tsx`** — photo loading (IMPORTANT: has its own separate fetch, easy to miss):
```typescript
import { isHosted } from '@/lib/env';
const photoBase = isHosted ? '/api/hosted/panels' : '/api/pipeline';
const res = await fetch(`${photoBase}/${deviceId}/photos`);
// and the photo URL:
setPhotoUrl(`${photoBase}/${deviceId}/photos?file=${encodeURIComponent(chosen.name)}`);
```

**`EditorToolbar.tsx`** — hide/show buttons:
```typescript
import { isHosted } from '@/lib/env';
// Hide "Export Panel" in hosted mode
// Show "Submit for Review" in hosted mode
```

### Auto-save debounce for hosted mode

Increase debounce from 800ms to 2500ms when `isHosted` is true. Blob writes are network calls (not local filesystem) and aggressive writes could hit rate limits.

```typescript
const DEBOUNCE_MS = isHosted ? 2500 : 800;
```

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

### Fix existing `/admin/review/page.tsx` (review list page)

The existing scaffold at `src/app/admin/review/page.tsx` has two issues:
1. It fetches from `/api/pipeline` (filesystem) — works locally but fails on Vercel serverless
2. It has **dead links to `/admin/{id}/preview`** (deleted this session, lines 72 and 91)

**Fix:** Update this page to fetch from `/api/hosted/panels` when deployed, and replace preview links with links to `/admin/review/{deviceId}`.

### Middleware scope note

Adding middleware to `/admin/review/*` is an **intentional behavioral change** — the review page currently has no auth. In the hosted deployment, the owner must enter admin password to see contractor submissions. The existing `/admin` dashboard and `/admin/[deviceId]` pages are NOT behind middleware (they're local-only tools with filesystem dependencies).

---

## Local admin: "Send to Contractor" button

On the pipeline device card (when pipeline is complete), new button.

**IMPORTANT: This must be a LOCAL API route** that uses `@vercel/blob` SDK server-side. Do NOT make cross-origin fetch calls from the browser (localhost → vercel.app = CORS failure). Instead, create a local-only route:

**New route: `src/app/api/pipeline/[deviceId]/send-to-hosted/route.ts`**
```typescript
import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function POST(req, { params }) {
  const { deviceId } = await params;
  // 1. Read local manifest-editor.json from filesystem
  const editorPath = path.join('.pipeline', deviceId, 'manifest-editor.json');
  const manifest = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));

  // 2. Build state.json with status=ready
  const state = { deviceId, deviceName: manifest.deviceName, manufacturer: manifest.manufacturer,
    status: 'ready', manifest, updatedAt: new Date().toISOString() };

  // 3. Upload to Blob (server-side, no CORS)
  await put(`devices/${deviceId}/state.json`, JSON.stringify(state), {
    access: 'public', contentType: 'application/json', addRandomSuffix: false,
  });

  // 4. Upload photos to Blob
  const photosDir = path.join('.pipeline', deviceId, 'input', 'photos');
  if (fs.existsSync(photosDir)) {
    for (const file of fs.readdirSync(photosDir)) {
      const data = fs.readFileSync(path.join(photosDir, file));
      await put(`devices/${deviceId}/photos/${file}`, data, {
        access: 'public', addRandomSuffix: false,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
```

The admin dashboard button calls `POST /api/pipeline/{deviceId}/send-to-hosted` — a local route that reads filesystem and writes to Blob server-side. No CORS issue.

---

## Local admin: "Build Tutorials" button

Appears when hosted status = "approved". On click, calls a LOCAL API route (same CORS-safe pattern as "Send to Contractor"):

**New route: `src/app/api/pipeline/[deviceId]/pull-from-hosted/route.ts`**
```typescript
import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

export async function POST(req, { params }) {
  const { deviceId } = await params;
  const hostedUrl = process.env.NEXT_PUBLIC_HOSTED_URL || 'https://askmiyagi.vercel.app';

  // 1. Fetch approved manifest from hosted Blob (server-side, no CORS)
  const { blobs } = await list({ prefix: `devices/${deviceId}/state.json` });
  const stateBlob = blobs[0];
  if (!stateBlob) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const state = await fetch(stateBlob.url).then(r => r.json());

  // 2. Write to local manifest-editor.json
  const editorPath = path.join('.pipeline', deviceId, 'manifest-editor.json');
  fs.writeFileSync(editorPath, JSON.stringify(state.manifest, null, 2));

  // 3. Export manifest JSON for production
  // (calls the existing export-manifest route logic)
  // ... or inline the export logic here

  return NextResponse.json({ ok: true });
}
```

The admin dashboard button calls `POST /api/pipeline/{deviceId}/pull-from-hosted` → local route fetches from Blob server-side → writes locally → then the existing tutorial pipeline can proceed.

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

### Auth
- [ ] Contractor can sign in with password at `/signin?role=contractor`
- [ ] Admin can sign in with password at `/signin?role=admin`
- [ ] Public pages (`/`, `/tutorial/*`) remain accessible without password
- [ ] `/editor/*` redirects to signin without contractor cookie
- [ ] `/admin/review/*` redirects to signin without admin cookie

### Hosted editor (contractor flow)
- [ ] `/editor` lists devices from Blob
- [ ] Clicking "Edit" opens the editor with manifest loaded from Blob
- [ ] Auto-save writes to Blob (check blob store in Vercel dashboard)
- [ ] **Reload editor page — verify saved state loads correctly from Blob (round-trip)**
- [ ] Status changes to "in-progress" on first edit
- [ ] "Submit for Review" sets status to "submitted"
- [ ] Preview toggle works in hosted editor (PanelRenderer renders correctly)
- [ ] Labels, icons, section labels all persist through Blob save/load cycle
- [ ] Photo side-by-side loads from Blob URLs

### Review flow
- [ ] `/admin/review/{id}` shows panel in readOnly mode
- [ ] "Approve" sets status to "approved"
- [ ] "Request Changes" sets status back to "in-progress"
- [ ] Review list page (`/admin/review`) loads devices from Blob (no dead links)

### Local admin buttons
- [ ] "Send to Contractor" uploads manifest + photos to Blob from local
- [ ] "Build Tutorials" pulls manifest from Blob, writes locally, runs export

### Regression
- [ ] **Local editor workflow still works when `NEXT_PUBLIC_EDITOR_MODE` is unset** (load, edit, auto-save, export, preview)
- [ ] Local pipeline routes (`/api/pipeline/*`) unchanged and functional
- [ ] Existing Fantom-08 tutorials + panel unaffected

### Blob specifics
- [ ] Verify `put()` with `addRandomSuffix: false` overwrites existing blob (not accumulating duplicates)
- [ ] Auto-save debounce is 2500ms in hosted mode (not 800ms)

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

## UX polish (from final audit)

**Contractor UX:**
- `/signin` defaults to `role=contractor` when no param. Redirects to `/editor` after login (admin → `/admin/review`)
- Keep canvas W×H inputs visible (contractor may need to adjust canvas size to fit controls)
- Submit confirmation dialog: "Submit panel for review? You won't be able to edit until the owner responds."
- After submit: success banner + editor enters read-only mode. Redirect to list or show "Submitted" state
- "Submitted" panels openable in read-only mode so contractor can verify what they submitted

**Owner UX:**
- Review page hides editing-only toolbar items (Clean Up, Gap, Reset Sizes, canvas scale) — only zoom/pan/preview visible
- "Send to Contractor" shows spinner during upload
- "Build Tutorials" uses local API route (same CORS fix as Send) — `POST /api/pipeline/{id}/pull-from-hosted`
- Use `NEXT_PUBLIC_HOSTED_URL` env var for hosted API URL (not hardcoded `https://askmiyagi.vercel.app`)

---

## Audit findings (addressed in this plan)

The following issues were caught by code review and incorporated above:

| Issue | Severity | Resolution |
|---|---|---|
| CORS: "Send to Contractor" can't fetch cross-origin localhost→Vercel | Critical | Use local API route with Blob SDK server-side (no browser fetch) |
| Hosted GET response shape must match local format | Important | Returns flat manifest with `_source: 'hosted'`, not nested |
| `EditorWorkspace.tsx` has its own photo fetch needing URL swap | Important | Added to files-to-modify list with code sample |
| `/admin/review/page.tsx` has dead links to deleted preview page | Important | Fix links to `/admin/review/{id}` |
| `/admin/review/page.tsx` fetches from filesystem (fails on Vercel) | Important | Fetch from `/api/hosted/panels` in hosted mode |
| Middleware on `/admin/review/*` is a behavioral change | Important | Documented as intentional |
| Missing round-trip test (save to Blob → reload → verify) | Important | Added to testing checklist |
| Missing local regression test | Important | Added to testing checklist |
| Auto-save 800ms too aggressive for Blob network writes | Moderate | Increase to 2500ms in hosted mode |
| `isHosted` propagation unclear (prop vs import) | Moderate | Direct import, no prop drilling |
| `useAutoSave` API base URL not specified | Moderate | Added code sample |
| Blob `put()` overwrite semantics unclear | Low | Added verification item to checklist |
| CORS: "Build Tutorials" also fetches cross-origin | Critical | Create local API route `pull-from-hosted`, same pattern as send-to-hosted |
| No submit confirmation dialog | Medium | Added confirmation before PATCH |
| No feedback after submit | Medium | Success banner + read-only mode |
| Review page shows full editing toolbar | Medium | Hide editing-only items in review |
| Hardcoded Vercel URL in "Build Tutorials" | Medium | Use `NEXT_PUBLIC_HOSTED_URL` env var |

---

## PanelRenderer capability (TSX removal validation)

Removing codegen TSX limits NOTHING for the contractor editor flow. Full audit:

| Feature | Status | Notes |
|---|---|---|
| Highlighting (highlightedControls) | **PASS** | Wired to every control via `isHighlighted(id)` |
| Panel state (active/LED/values) | **PASS** | `getState(id)` reads panelState per control |
| Click interaction (onButtonClick) | **PASS** | Wired to buttons + pads |
| PanelShell styling (bezel, branding) | **PASS** | Same PanelShell component |
| All leaf components | **PASS** | Same imports as handcrafted panels |
| CSS zoom | **PASS** | Parent can `transform: scale(...)` |
| Keyboard | **PASS** | PanelShell renders at correct position |
| Labels with icons | **PASS** | editorLabels + HARDWARE_ICONS |
| Section backgrounds | **PASS** | SectionContainer with dark styling |
| Group labels | **PASS** | Computed from member control positions |
| displayState (rich screens) | **Not yet** | Add before first tutorial batch on manifest-based device |
| zones (keyboard coloring) | **Partial** | Keyboard component supports it, needs prop threading |

Fantom-08 (handcrafted panel, 59 tutorials) is completely unaffected.

---

## Non-goals

- Hosting pipeline runners (stays local, needs Claude CLI)
- Auto-triggering tutorial pipeline on approval
- Email/Slack notifications (text/messaging between owner and contractor)
- Multi-contractor support (1 contractor for now)
- Mobile editor
- Real-time collaboration
