# Contractor Editor Flow — Final Minimal Plan

**Date:** 2026-04-05 (updated)
**Goal:** Web-based editor for 1 non-engineer contractor, lightweight end-to-end loop
**Supersedes:** `2026-04-04-hosted-editor-architecture.md`

---

## The loop (what this plan delivers)

```
YOU (local admin dashboard — localhost:3000/admin)
───────────────────────────────────────────────────
1. Click "+ New Instrument" → enter manufacturer + model
   → pipeline starts automatically (existing dashboard action)
2. Pipeline runs through phases (visible in dashboard)
3. Pipeline completes → "Send to Contractor" button appears
4. Click "Send to Contractor"
   → uploads manifest + photos to hosted Blob
   → status=ready
5. Text contractor "ready"

CONTRACTOR (website only — askmiyagi.vercel.app)
─────────────────────────────────────────────────
6. Visits site, logs in with password
7. Sees list: Fantom-06 Ready [Edit]
8. Edits panel, sees live render
9. Clicks Submit
10. Texts you "done"

YOU (website — askmiyagi.vercel.app/admin/review/...)
──────────────────────────────────────────────────────
11. Visit site, review panel in read-only editor
12. Click Approve (or Request Changes)
    → status=approved on hosted

YOU (back to local admin dashboard)
────────────────────────────────────
13. Device card now shows "Approved — Build Tutorials" button
14. Click button → pulls manifest from hosted site,
    runs codegen, runs tutorial pipeline,
    commits to test branch, opens PR
15. Visit test preview URL (visual check)
16. Merge test → main (GitHub UI, owner-only)
```

**Contractor's world: website only. Zero terminal, zero git.**
**Your world: all pipeline kickoff + handoff happens in the existing admin dashboard UI.**
**You never touch the terminal for normal workflow** — pipeline-runner runs as a subprocess under the dashboard's start button, not a command you type.

---

## Architecture

### Hosted on Vercel (contractor's interface)
- `/editor` — panel list (after password)
- `/editor/[deviceId]` — the editor
- `/admin/review/[deviceId]` — your read-only review page (editor with `readOnly=true`)
- Vercel Blob — one `state.json` per device (manifest + status + metadata)
- Vercel Blob — photos per device

### Local (your existing admin dashboard, add two buttons)
- **"Send to Contractor"** button per device — uploads manifest + photos to Blob, sets status=ready
- **"Build Tutorials"** button per device (appears when status=approved) — downloads manifest, runs codegen, runs tutorial pipeline, git commits + pushes + opens PR

### Nothing else local
- No watcher process
- No sync CLI
- No state machine library
- No email notifications (you + contractor already text)

---

## Why no auto-triggered tutorial pipeline

Approval could auto-trigger the tutorial pipeline via a local watcher, but:
- Watcher = background process = single point of failure
- Tutorial pipeline takes 1-3 hours and needs Claude CLI (local-only)
- You're going to be at your computer anyway to merge test → main
- One extra button click per cycle isn't worth the architectural complexity

**If this friction ever feels painful,** add a watcher later. For now, the flow is: hosted approval sets a flag, your local admin dashboard shows the flag as a button, you click when ready.

---

## Storage: Vercel Blob only

One JSON file per device at `devices/{deviceId}/state.json`:

```json
{
  "deviceId": "fantom-06",
  "deviceName": "Fantom-06",
  "manufacturer": "Roland",
  "status": "ready" | "in-progress" | "submitted" | "approved",
  "manifest": { /* full manifest-editor.json payload */ },
  "updatedAt": "2026-04-05T..."
}
```

Photos as separate blobs at `devices/{deviceId}/photos/{name}.jpg`.

**No Postgres, no Drizzle, no ORM, no schema migrations.**

### Why Blob, not Postgres
- 1-20 devices total
- Single JSON blob per device, read/write at the whole-blob level
- No need for relational queries, indexes, joins
- Postgres adds setup overhead with zero benefit at this scale
- Upgrade to Postgres later if/when multi-contractor scale demands it

---

## Auth: Password cookie

Shared password per role (env vars):
- `CONTRACTOR_PASSWORD` — gates `/editor/*`
- `ADMIN_PASSWORD` — gates `/admin/review/*`

Middleware:
```typescript
// src/middleware.ts
if (pathname.startsWith('/editor/')) {
  if (!hasValidCookie(req, 'contractor')) redirect('/signin?role=contractor');
}
if (pathname.startsWith('/admin/review/')) {
  if (!hasValidCookie(req, 'admin')) redirect('/signin?role=admin');
}
```

**No NextAuth, no magic links, no email.** For 1 contractor.

---

## Scope: ~320 LOC

| Piece | LOC |
|---|---|
| "Send to Contractor" button + POST to hosted API | 40 |
| Hosted API routes (POST init, GET list, GET manifest, PATCH status) | 100 |
| Vercel Blob storage helpers | 60 |
| `/editor` contractor list page (cards + links) | 60 |
| `/admin/review/[id]` read-only view (reuses editor with `readOnly=true`) | 30 |
| Hosted editor mode tweaks (hide local buttons, add Submit button) | 30 |
| Password cookie + middleware | 20 |
| `/signin` page (role parameter + password form) | 40 |
| "Build Tutorials" button + local action (pull manifest + codegen + tutorial pipeline) | 40 |

**Total: ~320 LOC.** Roughly 1-3 days of focused work.

---

## The contractor's experience in detail

### First-time login
1. Receives text from Devin: "Fantom-06 is ready in the editor. URL: askmiyagi.vercel.app, password: XYZ"
2. Visits URL, enters password → cookie set, redirects to `/editor`
3. Sees the list page with Fantom-06 card labeled "Ready"

### Editing session
1. Clicks card → opens editor for Fantom-06
2. First click flips status to `in-progress` behind the scenes
3. Edits using Align/Distribute/Group/Label tools (see `docs/contractor-guide/alignment-tools.md`)
4. Every 800ms, auto-save writes to Blob
5. When happy, clicks **"Submit for Review"** button
6. Status flips to `submitted`
7. Contractor sees confirmation + goes back to list ("Fantom-06 Submitted")
8. Contractor texts Devin "done"

### Receiving feedback
- If Devin requests changes: status flips back to `in-progress`, contractor re-opens, fixes, resubmits
- If Devin approves: status=approved, contractor sees ✓ on the list, done

---

## Your review experience in detail

1. Receive text from contractor "done"
2. Visit `askmiyagi.vercel.app/admin/review/fantom-06`
3. Enter admin password (if not already cookied)
4. See the panel rendered in the editor's read-only mode (same components as contractor saw)
5. Visually verify — does it look production-ready?
6. Click **Approve** OR **Request Changes** (with optional note)

Then switch to local admin dashboard (`localhost:3000/admin/pipeline`):
7. See Fantom-06 card with "Approved — Build Tutorials" button
8. Click it
9. Local process runs: download manifest, codegen, tutorial pipeline, git push, open PR to `test`
10. Email/notification when done
11. Visit test preview URL, visually verify
12. Merge test → main (GitHub UI)

**Done.**

---

## Upgrade path (keep optionality)

| If you later need | Upgrade |
|---|---|
| Multi-contractor support | Replace shared password with per-user auth (NextAuth) + filter Blob reads by user |
| Relational queries on devices | Swap Blob storage layer for Postgres |
| Auto-trigger tutorials on approval | Add a local watcher that polls Blob status |
| Email notifications | Add Resend, fire on status transitions |
| Rich review comments | Add comments field to state.json, render in review UI |

**Nothing here locks you out of those upgrades. Each is one swappable layer.**

---

## Execution order

1. Create Vercel Blob token + add to env
2. Build hosted API routes (init, list, manifest, status)
3. Build Blob storage helper module
4. Build `/signin` + middleware + password cookies
5. Build `/editor` list page
6. Add hosted-mode editor tweaks (Submit button, hide local-only buttons)
7. Build `/admin/review/[id]` page (readOnly editor)
8. Add "Send to Contractor" button to local admin dashboard
9. Add "Build Tutorials" button to local admin dashboard
10. Deploy to Vercel, test round-trip with real Fantom-06

---

## Editor Preview toggle (Option A — ship now)

Add a "Preview" toggle to the editor toolbar. When flipped:
- Selection outlines, drag handles, resize dots, section banners, GroupOverlay all hide
- Editor enters readOnly mode
- Contractor sees the clean panel as it would appear in production
- Flip back to continue editing

**Contractor workflow:** Edit → Preview → looks right? → Submit

**~30 LOC** (boolean flag + conditional rendering).

This gives the contractor confidence that what they see = what ships, without running codegen.

### Future upgrade: PanelRenderer (Option B — defer)

If drift between Preview and the actual generated panel ever causes problems, build a single `<PanelRenderer manifest={...} />` component (~300 LOC) used in editor preview, admin review, AND production. Same component + same data = zero drift by construction. Codegen becomes "commit JSON" instead of "generate TSX". See `memory/project_panelrenderer_future.md` for details.

---

## Non-goals (explicitly out of scope)

- Hosting pipeline runners on Vercel (requires API rewrite, incompatible with current architecture)
- Auto-triggering tutorial pipeline on approval (manual button click, one extra action)
- Email or Slack notifications (text/messaging works)
- Dashboard with multiple simultaneous instrument orchestration
- Real-time multi-contractor collaboration
- Mobile editor support
- GitHub Actions for codegen (local watcher/button is simpler)

---

## Prerequisites

- **Phase 1 editor fixes** from `2026-04-04-editor-overlap-and-codegen-sync.md` (tasks #13, #14, #18) should land first so the contractor isn't debugging editor bugs.
- **Alignment tools tutorial** at `docs/contractor-guide/alignment-tools.md` ready for contractor onboarding.
