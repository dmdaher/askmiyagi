# Hosted Editor for Contractor — Architecture Plan

**Date:** 2026-04-04
**Branch:** `feature/pipeline-architecture-upgrade` (or a new `feature/hosted-editor` branch)
**Goal:** Enable a non-engineer contractor (Panel Layout Designer) to use the editor via a URL, with no local setup, git, or terminal.

---

## Problem

Current architecture is 100% local-first:
- 17 pipeline API routes make 111 filesystem calls
- `manifest-editor.json` is auto-saved to the contractor's local disk
- Pipeline runner spawns `claude` CLI subprocesses, uses `execSync`, manages git worktrees

The contractor is a designer (see `memory/user_contractor_profile.md`):
- No git, no terminal, no Node.js
- Needs a URL-based editor experience
- Must be able to submit work for review without filesystem access

**The pipeline runner CANNOT be hosted** — it requires `child_process`, `execSync`, git worktrees, and minutes-to-hours runtime. Vercel serverless functions are stateless + time-bounded. This means a **hybrid architecture** is the correct answer, not full-hosted migration.

---

## Architecture Decision: Hybrid Local ⇄ Hosted

### What runs where

| Component | Runs on | Why |
|---|---|---|
| Pipeline runner (Claude CLI agents) | **Devin's MacBook** | Spawns subprocesses, git worktrees, long-running |
| Codegen (`panel-codegen.ts`) | **Devin's MacBook** | Writes to `src/`, runs via tsx, needs repo access |
| Git commits + Vercel deployments | **Devin's MacBook** | Human review + approval |
| Admin pipeline monitoring | **Devin's MacBook** | Reads `.pipeline/` local state, tails logs |
| **Editor UI + editor APIs** | **Vercel (hosted)** | Contractor access |
| **Editor state storage** | **Vercel Postgres / Neon** | Contractor edits persist server-side |
| **Photos + manual PDFs** | **Vercel Blob** | Contractor's reference material |
| **Auth + review flow** | **Vercel (hosted)** | Contractor identity + submit-for-review |

### Data flow

```
┌─ LOCAL (Devin) ────────────┐        ┌─ HOSTED (Vercel) ───────┐
│                            │        │                         │
│  1. Pipeline runner        │        │  Editor UI              │
│     → manifest.json        │        │  Editor APIs            │
│     → photos/              │        │  Review admin           │
│                            │        │                         │
│  2. `sync-up` CLI ────────────push──→  Postgres + Blob        │
│                            │        │                         │
│  5. `sync-down` CLI ←──────pull──────  Contractor's edits     │
│                            │        │        ↑                │
│  6. codegen → src/         │        │  3. Contractor edits    │
│  7. git commit + deploy    │        │  4. Submit for Review   │
│                            │        │                         │
└────────────────────────────┘        └─────────────────────────┘
```

**Key insight:** the contractor's browser never talks to Devin's MacBook. Hosted Vercel is the only thing they see. Devin's sync CLI is the bridge.

---

## Component Design

### 1. Storage Abstraction Layer (`src/lib/storage/`)

**Rationale:** The 17 API routes currently couple tightly to `fs.*` calls. Direct migration to Postgres would touch every route. Instead, introduce an interface layer once, then swap the backend.

```typescript
// src/lib/storage/types.ts
export interface EditorStorage {
  getEditorManifest(deviceId: string): Promise<EditorManifest | null>;
  saveEditorManifest(deviceId: string, data: EditorManifest): Promise<void>;
  listBackups(deviceId: string): Promise<BackupMeta[]>;
  getBackup(deviceId: string, timestamp: string): Promise<EditorManifest | null>;
  getPhotos(deviceId: string): Promise<PhotoRef[]>;
  getMasterManifest(deviceId: string): Promise<MasterManifest | null>;
}

// src/lib/storage/local-fs.ts   — current behavior, wraps `fs.*`
// src/lib/storage/postgres.ts   — new, wraps Neon + Vercel Blob
// src/lib/storage/index.ts      — factory: returns backend based on env var
export function getStorage(): EditorStorage {
  return process.env.STORAGE_BACKEND === 'postgres'
    ? new PostgresStorage()
    : new LocalFsStorage();
}
```

**Migration pattern:** Replace `fs.readFileSync(path)` calls in editor routes with `storage.getEditorManifest(deviceId)`. Routes stay identical in shape — only the data source changes.

**Scope:** Only editor-relevant routes get migrated:
- `manifest/route.ts` (GET + PUT)
- `photos/route.ts`
- `versions/route.ts` + `versions/restore/route.ts`
- `codegen/route.ts` (only the editor-read part; codegen itself stays local)
- `issues/route.ts`

Pipeline management routes (`start`, `health`, `recover`, `restart`, `logs`, `blueprint`, `templates`, etc.) **do not migrate**. They're local-only and shouldn't be deployed.

### 2. Database Schema (Postgres / Neon)

```sql
-- Devices available for editing
CREATE TABLE devices (
  device_id TEXT PRIMARY KEY,           -- e.g. 'fantom-06'
  device_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  status TEXT NOT NULL,                 -- 'draft' | 'in_review' | 'approved' | 'shipped'
  master_manifest JSONB NOT NULL,       -- the gatekeeper-approved manifest
  canvas_width INT,
  canvas_height INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor's editor state (1:1 with devices for MVP; could become 1:N for multi-contractor)
CREATE TABLE editor_sessions (
  device_id TEXT PRIMARY KEY REFERENCES devices(device_id),
  editor_manifest JSONB NOT NULL,       -- the whole manifest-editor.json payload
  editor_labels JSONB NOT NULL DEFAULT '[]',
  contractor_email TEXT,                -- who's working on it
  last_saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timestamped snapshots for version history (append-only)
CREATE TABLE editor_backups (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON editor_backups (device_id, created_at DESC);

-- Review workflow
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES devices(device_id),
  submitted_by TEXT NOT NULL,           -- contractor email
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL,                 -- 'pending' | 'approved' | 'changes_requested'
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ
);

-- Simple auth
CREATE TABLE contractors (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL,                   -- 'designer' | 'admin'
  device_allowlist TEXT[],              -- which devices they can edit (NULL = all)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
```

**Why Postgres, not Blob-only:**
- Review flow needs structured queries (pending reviews, by date, by contractor)
- Contractor allowlist = access control in a structured way
- JSONB gives us schema-less manifest storage with SQL-level queries for debugging
- Neon's free tier (512MB) handles dozens of devices comfortably

**Photos + manuals: Vercel Blob.** Stored at paths like `devices/fantom-06/photos/back.jpg`. URLs in Postgres reference them.

### 3. Auth (NextAuth v5 / Auth.js with Email provider)

**Flow for contractor:**
1. Contractor visits `askmiyagi.vercel.app/editor/fantom-06`
2. Middleware detects no session → redirect to `/auth/signin`
3. Contractor enters email → magic link emailed via Resend
4. Click link → session cookie set → back to editor

**Env vars needed:**
- `AUTH_SECRET` — NextAuth session signing
- `AUTH_RESEND_KEY` — email provider
- `AUTH_URL` — canonical URL (askmiyagi.vercel.app)
- `EMAIL_FROM` — sender address

**Access control:**
- Middleware: `/editor/*` requires any authenticated session
- Middleware: `/admin/*` requires role=admin
- Per-device access: check `device_allowlist` on session.user

**MVP simplification (first deployment):** Single contractor email hardcoded in env. Pre-seed `contractors` table with Devin (admin) + 1 contractor. Upgrade to open invitations later.

### 4. Sync CLI (`scripts/sync.ts`)

```bash
# After pipeline completes, push the manifest + photos to hosted DB
npm run sync-up fantom-06

# After contractor submits for review, pull their edits back to local
npm run sync-down fantom-06

# Show status
npm run sync-status fantom-06
# → Device: fantom-06
# → Last sync up: 2026-04-04 14:22
# → Contractor last edit: 2026-04-04 18:45
# → Review status: pending (submitted 2026-04-04 19:00)
```

**Under the hood:**
- `sync-up`: reads local `.pipeline/{deviceId}/manifest.json` + photos, writes to Postgres `devices.master_manifest` and Blob photo storage. Creates/updates `editor_sessions` with initial state if absent.
- `sync-down`: reads Postgres `editor_sessions.editor_manifest`, writes to local `.pipeline/{deviceId}/manifest-editor.json`. Then contractor's work enters the codegen flow as it does today.

**Security:** Sync uses `DATABASE_URL` env var in `.env.local` (gitignored). Only Devin's machine has it.

### 5. Submit for Review Flow

**Contractor side:**
- New button in editor toolbar: "Submit for Review" (replaces or supplements "Approve & Build")
- Clicks → POST `/api/reviews` with `{deviceId, notes?}`
- Creates `reviews` row with `status='pending'`
- Optionally sends email notification via Resend to Devin

**Devin side:**
- Admin page at `/admin/reviews` lists all pending reviews
- Click one → opens read-only editor view at `/admin/review/fantom-06`
- Buttons: "Approve" (→ status='approved') or "Request Changes" (→ status='changes_requested' + notes)
- Approval doesn't trigger codegen directly — Devin runs `sync-down` locally, runs codegen locally, commits, deploys.

### 6. Editor Mode Detection

The editor UI needs to know if it's running hosted or local:

```typescript
// src/lib/env.ts
export const isHosted = process.env.NEXT_PUBLIC_EDITOR_MODE === 'hosted';

// In EditorToolbar.tsx
{isHosted ? (
  <button onClick={submitForReview}>Submit for Review</button>
) : (
  <button onClick={approveAndBuild}>Approve & Build</button>  // local-only
)}
```

Hosted editor hides: pipeline start buttons, diagnostics panel, codegen trigger, log streaming (all require local filesystem).

---

## Execution Phases

### Phase A — Storage abstraction (non-breaking refactor)
**Scope:** Introduce `src/lib/storage/` with `LocalFsStorage` implementation. Refactor 5 editor routes to use it. Behavior unchanged — everything still reads/writes local filesystem via the new interface.

**Files:**
- New: `src/lib/storage/types.ts`, `local-fs.ts`, `index.ts`
- Refactor: `manifest/route.ts`, `photos/route.ts`, `versions/*.ts`, `issues/route.ts`

**Acceptance:** Editor works identically. All existing tests pass.

**Commit:** `refactor: storage abstraction layer for editor routes`

### Phase B — Postgres backend + sync CLI
**Scope:** Write `PostgresStorage` implementation. Write `sync-up` and `sync-down` CLIs. Test locally with `STORAGE_BACKEND=postgres` against a Neon dev DB.

**Files:**
- New: `src/lib/storage/postgres.ts`, `drizzle/schema.ts` (or raw SQL + `postgres` client)
- New: `scripts/sync.ts`
- New: `drizzle/migrations/0001_initial.sql`

**Acceptance:** Can run editor locally against Postgres backend. `sync-up` copies local manifest to DB. `sync-down` pulls it back.

**Commit:** `feat: Postgres storage backend + sync CLI`

### Phase C — Vercel deployment + auth
**Scope:** Deploy to Vercel with Postgres backend enabled. Add NextAuth with email magic links. Protect `/editor/*` and `/admin/*` routes.

**Files:**
- New: `src/app/api/auth/[...nextauth]/route.ts`, `src/auth.ts`
- New: `src/middleware.ts` (route protection)
- New: `src/app/auth/signin/page.tsx`
- Update: `next.config.ts` — env var exposure
- Update: `vercel.json` — build/runtime config

**Acceptance:** Visit production URL, sign in with email, see editor. Admin sees admin pages.

**Commit:** `feat: deploy hosted editor with auth`

### Phase D — Submit for review flow
**Scope:** Contractor-facing submit button. Admin-facing review list + approve/reject actions. Email notifications.

**Files:**
- New: `src/app/api/reviews/route.ts`
- New: `src/app/admin/reviews/page.tsx`
- New: `src/app/admin/review/[deviceId]/page.tsx` (read-only editor)
- Update: `EditorToolbar.tsx` (add Submit button, hide local-only controls in hosted mode)

**Acceptance:** Contractor submits → Devin sees review → Devin approves or rejects → contractor gets email.

**Commit:** `feat: submit-for-review workflow`

### Phase E — Hosted-mode polish
**Scope:** Hide local-only UI in hosted mode. Contractor onboarding page. Read-only admin viewer. Accessibility pass.

**Commit:** `polish: hosted editor UX cleanup`

---

## Migration Safety

Each phase is independently shippable. Specifically:
- **Phase A merges to main with zero behavior change.** Pure refactor.
- **Phase B runs in parallel** — Postgres backend can be opted into via env var. Local filesystem remains default.
- **Phase C is the first user-visible deploy.** But pipeline runner keeps working locally unchanged.
- **Phases D+E are purely additive.** Don't affect existing flows.

**Rollback:** Set `STORAGE_BACKEND=local` in env to fall back to filesystem. No code rollback needed.

---

## Good Architecture Practices Applied

| Practice | How |
|---|---|
| **Separation of concerns** | Storage interface decouples routes from backend. Pipeline stays local, editor goes hosted. |
| **Open/closed** | New backends (Redis, S3, whatever) plug into `EditorStorage` interface without touching routes. |
| **Explicit boundaries** | `isHosted` env flag + middleware gates make it obvious which code path is running. |
| **Single source of truth per concern** | Postgres is authoritative for editor state. Local `.pipeline/` is authoritative for pipeline runs. Sync CLI is the explicit bridge. |
| **Migrate incrementally** | Each phase is merge-able on its own. No big-bang rewrite. |
| **Feature-flag new behavior** | `STORAGE_BACKEND` env var gates the new backend. Safe rollback. |
| **Typed contracts** | `EditorStorage` interface + Zod schemas for Postgres rows. |
| **Append-only audit trail** | `editor_backups` table is append-only, mirrors current backup directory behavior. |
| **Least privilege** | Contractors have `device_allowlist`. Admins see all. Pipeline runner doesn't need DB access. |

---

## Open Questions (decide before Phase B)

1. **ORM or raw SQL?** Drizzle ORM is lightweight + TypeScript-native. Raw `postgres` client is simpler. Recommend **Drizzle** for schema migrations + type safety.
2. **Neon or Vercel Postgres?** They're the same service now. Vercel Postgres integrates more cleanly with env vars + billing. Recommend **Vercel Postgres**.
3. **Email provider?** Resend is standard + has Next.js SDK. Recommend **Resend**.
4. **Multi-device per contractor?** MVP = single device per contractor. Schema supports multi already via `device_allowlist`. No upfront work needed.
5. **Keep the "Approve & Build" button in hosted mode?** No — codegen must run locally. Hosted shows "Submit for Review" only.

---

## Non-Goals (explicitly out of scope)

- Hosting the pipeline runner (incompatible with Vercel)
- Real-time multi-contractor collaboration (single-contractor edits, no OT/CRDT)
- Full role-based access control with invite flow (single contractor for now)
- Webhook-driven auto-codegen on approval (Devin runs codegen manually)
- Mobile-responsive editor (desktop only)

---

## Estimated Scope

**Lines of code:** ~800-1200 new (storage layer + sync CLI + auth + review pages)

**No tutorials affected. No panel components affected.**

---

## Queue Updates

Adding the hosted-editor work as phased tasks. The flat-layer refactor (#18) and codegen data-flow fixes (#14, #13) should land **before** hosted deployment — contractor shouldn't be the first user to hit those bugs.

**Revised execution order:**
1. Phase A of `2026-04-04-editor-overlap-and-codegen-sync.md` (data-flow fix — tasks #13, #14)
2. Phase B of that plan (flat control layer — task #18)
3. **THEN** Phase A of this plan (storage abstraction)
4. Phase B (Postgres backend + sync)
5. Phase C (deploy + auth)
6. Phase D (review flow)
7. Phase E (polish)

Independent tasks (#15 label icons, #16 scroll-unzoom) can land any time.
