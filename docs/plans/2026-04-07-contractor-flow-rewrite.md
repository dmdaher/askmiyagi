# Contractor Flow — Clean Rewrite Plan

**Date:** 2026-04-07
**Goal:** Rewrite the hosted contractor editor flow from scratch with proper design upfront
**Branch:** `feature/pipeline-architecture-upgrade`

---

## System overview

Two interfaces share one Vercel Blob store. Strict state machine. No race conditions.

```
ADMIN (localhost:3000)                    CONTRACTOR (Vercel deployment)
─────────────────────                     ────────────────────────────
/admin dashboard                          /editor list
  └─ Contractor Submissions               └─ /editor/{id} editor
     • Send to Contractor                    • Edit + Preview + Submit
     • Review (pull + open local editor)
     • Approve / Request Changes
     • Pull & Build Tutorials
```

---

## State machine

```
          Admin: "Send to Contractor"
                    │
                    ▼
               ┌─────────┐
               │  ready   │  Contractor can edit
               └────┬─────┘
                    │ first auto-save
                    ▼
            ┌──────────────┐
            │  in-progress  │  Contractor editing
            └──────┬───────┘
                   │ Contractor: "Submit for Review"
                   ▼
             ┌───────────┐
             │ submitted  │  LOCKED — admin reviews
             └─────┬─────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    ┌──────────┐    ┌──────────────┐
    │ approved │    │ in-progress  │ + reviewNote
    └──────────┘    └──────────────┘
     Admin: Pull     Contractor edits again
     & Build         (cycle repeats)
```

### State rules

| State | Editor | Auto-save | Server PUT | Contractor UI | Admin UI |
|---|---|---|---|---|---|
| `ready` | Editable | Active (2.5s) | Accepted | "Edit →" button | "Open →", "Sent to contractor" |
| `in-progress` | Editable | Active (2.5s) | Accepted | "Continue →" button | "Open →", "Contractor editing" |
| `in-progress` + reviewNote | Editable | Active (2.5s) | Accepted | "Continue →" + feedback banner | "Open →", "Changes requested" + note |
| `submitted` | **LOCKED** (preview) | **STOPPED** | **403 Rejected** | "Submitted ✓" badge, locked | **Amber banner**, Review/Approve/Changes |
| `approved` | **LOCKED** (preview) | **STOPPED** | **403 Rejected** | "✓ Complete" | "Pull & Build Tutorials" |

---

## Storage: Vercel Blob

### Rules (non-negotiable)

1. **Every `put()` call** must include `allowOverwrite: true`
2. **Every `fetch()` from Blob** must include `{ cache: 'no-store' }`
3. **One JSON file per device** at `devices/{deviceId}/state.json`
4. **Photos** at `devices/{deviceId}/photos/{name}.jpg`

### State shape

```typescript
interface DeviceState {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: 'ready' | 'in-progress' | 'submitted' | 'approved';
  manifest: Record<string, unknown>; // full editor manifest
  reviewNote?: string;               // feedback from admin
  updatedAt: string;
}
```

### Storage module: `src/lib/hosted-storage.ts`

```typescript
// ALL reads bypass CDN cache
async function getDeviceState(deviceId): Promise<DeviceState | null>
  → head() + fetch(url, { cache: 'no-store' })

async function listDevices(): Promise<DeviceSummary[]>
  → list() + fetch each (url, { cache: 'no-store' })

// ALL writes allow overwrite
async function putDeviceState(deviceId, state): Promise<void>
  → put(path, data, { access: 'public', addRandomSuffix: false, allowOverwrite: true })

async function putPhoto(deviceId, name, data): Promise<string>
  → put(path, data, { access: 'public', addRandomSuffix: false, allowOverwrite: true })

async function listPhotos(deviceId): Promise<PhotoRef[]>
  → list() (metadata only, no content fetch needed)
```

---

## API routes

### Hosted routes (deployed to Vercel, use Blob)

| Route | Method | What it does | Status guard |
|---|---|---|---|
| `/api/hosted/panels` | GET | List all devices + statuses | None |
| `/api/hosted/panels/[id]` | GET | Return manifest (flat, `_source:'hosted'`, `_status`, `_reviewNote`) | None |
| `/api/hosted/panels/[id]` | PUT | Auto-save manifest | **Reject 403 if submitted/approved** |
| `/api/hosted/panels/[id]/status` | PATCH | Change status + optional reviewNote | Validate status enum |
| `/api/hosted/panels/[id]/photos` | GET | List photo URLs | None |

### Local routes (localhost only, use filesystem + Blob SDK)

| Route | Method | What it does |
|---|---|---|
| `/api/pipeline/[id]/send-to-hosted` | POST | Read local manifest + photos → upload to Blob with status=ready |
| `/api/pipeline/[id]/pull-from-hosted` | POST | Read manifest from Blob → write to local filesystem → run export |

---

## Auth: proxy.ts

```
/editor/*       → requires contractor_access cookie = CONTRACTOR_PASSWORD
/admin/*        → requires admin_access cookie = ADMIN_PASSWORD
/signin         → public
/               → public
/tutorial/*     → public
/api/*          → public (API routes handle their own auth if needed)
```

Redirect includes `?redirect=<original_path>` so signin sends user back where they came from.

---

## Pages

### `/signin` — password form
- Reads `role` from query params (defaults to `contractor`)
- Reads `redirect` from query params (defaults to `/editor` or `/admin`)
- Sets ONE cookie matching the role
- Verifies password works before redirecting (fetch with redirect:manual)
- Shows "Incorrect password" on failure
- Disabled button during verification

### `/editor` — contractor panel list
- Fetches `/api/hosted/panels`
- Shows cards per device:
  - `ready` / `in-progress`: "Edit →" / "Continue →" button
  - `in-progress` + reviewNote: feedback banner above card
  - `submitted`: "Waiting for review" (no button)
  - `approved`: "✓ Complete"
- Sign out button (top right, clears contractor cookie)

### `/editor/[deviceId]` — hosted editor
- "← All Panels" back link
- Wraps PanelEditor component
- On page load: if `_status === 'submitted' || 'approved'` → lock editor (previewMode=true, __submittedForReview=true)

### Admin dashboard (`/admin`) — ContractorSubmissions section
- Positioned ABOVE pipeline grid
- Polls `/api/hosted/panels` every 10s
- When `submitted` items exist:
  - Pulsing amber badge "N needs review"
  - Amber alert banner
- Per device card:
  - Always: "Open →" / "Review →" button (pulls from Blob, opens local editor)
  - `submitted`: "Approve" + "Request Changes" buttons
  - `approved`: "Pull & Build Tutorials" button
  - Status label + review note shown inline
- "Request Changes" opens feedback modal (textarea, not prompt())
- "Dashboard" link in admin header nav

---

## Editor behavior in hosted mode (`isHosted = true`)

### What's different from local
| Feature | Local | Hosted |
|---|---|---|
| Final action button | "Export Panel" | "Submit for Review" (or "Submitted ✓" badge) |
| Version History | Visible | Hidden |
| Report Issue | Visible | Hidden |
| Help button | Visible | Hidden |
| Reset Sizes | Visible | Hidden |
| Auto-save debounce | 800ms | 2500ms |
| Manifest API | `/api/pipeline/{id}/manifest` | `/api/hosted/panels/{id}` |
| Photo API | `/api/pipeline/{id}/photos` | `/api/hosted/panels/{id}/photos` (direct Blob URLs) |
| Codegen error banner | Visible | Hidden |

### What's IDENTICAL
Everything else: Undo/Redo, Snap, Zoom, Grid, Labels, +L, Sz, Photo, Canvas scale, Canvas W×H, Preview, alignment tools, grouping, section labels, label icons.

### Auto-save protection (3 layers)

1. **Client subscription guard**: `if (isHosted && previewMode) return` — prevents new save triggers
2. **Client setTimeout guard**: same check inside debounced callback — catches queued timers
3. **Server 403**: PUT handler rejects when status is `submitted` or `approved`

### Editor locking after submit

1. `previewMode` set to `true` → editor in read-only preview
2. `__submittedForReview` flag set on window → survives within session
3. Preview toggle button **disabled** (can't exit preview)
4. "Back to Editor" button **hidden**
5. "Submit for Review" replaced with "Submitted ✓" badge
6. Page load checks `_status` from API → re-locks if already submitted (survives refresh)

---

## Files to rewrite

| File | What to rewrite |
|---|---|
| `src/lib/hosted-storage.ts` | Clean rewrite — all reads with no-store, all writes with allowOverwrite |
| `src/app/api/hosted/panels/route.ts` | List endpoint |
| `src/app/api/hosted/panels/[deviceId]/route.ts` | GET (flat manifest) + PUT (with 403 guard) |
| `src/app/api/hosted/panels/[deviceId]/status/route.ts` | PATCH status + reviewNote |
| `src/app/api/hosted/panels/[deviceId]/photos/route.ts` | List photo URLs |
| `src/app/api/pipeline/[deviceId]/send-to-hosted/route.ts` | Local → Blob upload |
| `src/app/api/pipeline/[deviceId]/pull-from-hosted/route.ts` | Blob → local download |
| `src/proxy.ts` | Auth checks with redirect param |
| `src/app/signin/page.tsx` | Password form with verification |
| `src/app/editor/page.tsx` | Contractor list with status-aware UI |
| `src/app/editor/[deviceId]/page.tsx` | Editor wrapper with back link + status lock |
| `src/components/admin/ContractorSubmissions.tsx` | Submissions section with feedback modal |
| `src/app/admin/layout.tsx` | Dashboard nav link |
| `src/components/panel-editor/EditorToolbar.tsx` | isHosted branching (submit vs export, hidden items) |
| `src/components/panel-editor/PanelEditor.tsx` | isHosted API switching, page-load lock, banner text |
| `src/components/panel-editor/hooks/useAutoSave.ts` | isHosted debounce + 3-layer protection |
| `src/components/panel-editor/EditorWorkspace.tsx` | isHosted photo URL switching |

---

## Verification checklist

### Blob reads (every fetch must have cache:'no-store')
- [ ] hosted-storage.ts: getDeviceState
- [ ] hosted-storage.ts: listDevices
- [ ] Any other Blob URL fetch

### Blob writes (every put must have allowOverwrite:true)
- [ ] hosted-storage.ts: putDeviceState
- [ ] hosted-storage.ts: putPhoto
- [ ] send-to-hosted route: state.json put
- [ ] send-to-hosted route: photo puts

### State transitions
- [ ] send-to-hosted → status=ready
- [ ] First auto-save → ready becomes in-progress
- [ ] Submit for Review → status=submitted
- [ ] PUT rejected when submitted (403)
- [ ] PUT rejected when approved (403)
- [ ] Admin Approve → status=approved
- [ ] Admin Request Changes → status=in-progress + reviewNote
- [ ] Contractor resubmit → status=submitted again

### Auto-save protection
- [ ] Subscription guard checks previewMode
- [ ] setTimeout guard checks previewMode
- [ ] Server returns 403 on PUT when submitted/approved
- [ ] Auto-save works normally in local mode (non-hosted)

### Editor locking
- [ ] After submit: previewMode=true
- [ ] After submit: Preview toggle disabled
- [ ] After submit: "Back to Editor" hidden
- [ ] After submit: "Submit for Review" → "Submitted ✓"
- [ ] Page refresh: checks _status, re-locks if submitted/approved
- [ ] Admin sends changes back: contractor page refresh unlocks editor

### Auth
- [ ] /editor/* requires contractor cookie
- [ ] /admin/* requires admin cookie
- [ ] / and /tutorial/* are public
- [ ] /signin is public
- [ ] Signin redirect includes original path
- [ ] Wrong password shows error
- [ ] Sign out clears cookie

### UI
- [ ] Contractor list: correct buttons per status
- [ ] Contractor list: feedback note shown when in-progress + reviewNote
- [ ] Admin: ContractorSubmissions above pipeline grid
- [ ] Admin: amber banner + pulsing badge when submitted
- [ ] Admin: feedback modal (not prompt())
- [ ] Admin: 10s polling
- [ ] Admin: "Dashboard" link in header
- [ ] Admin: status labels show who needs to act
