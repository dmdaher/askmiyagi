# Pipeline Flow & Navigation Plan (Final — Audit Complete)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Simple, intuitive pipeline navigation. No dead ends. Restart capability. Persistent context.

**Architecture:** Shared `layout.tsx` with persistent device header + route-based nav links. Each view (overview, editor, preview) keeps its own route and height model.

---

## Audit Summary (3 rounds)

**Cut from plan (not needed for MVP):**
- ~~Reset to Phase~~ — power user feature, Restart + Resume covers 95% of cases
- ~~Mobile disable editor~~ — nobody edits on mobile
- ~~Route redirects task~~ — implicit, one line in next.config.js

**Critical findings to address:**
1. Outer `admin/layout.tsx` has `<main className="mx-auto max-w-7xl px-6 py-8">` — this padding causes 88px height overflow when device layout uses `h-screen`. Fix: remove padding from `<main>`, let pages provide their own.
2. Keyboard shortcuts fire on focused nav links (`Backspace` triggers delete). Fix: add `a` and `button` to suppression list.
3. Remove Editor/Preview buttons from Overview page after nav tabs exist (avoids 3 ways to reach the same page).
4. Demote Cancel to diagnostics — only Pause and Restart in the main header.

---

## Step 1: Delete duplicate route tree

**Time:** 10 min | **Impact:** HIGH — eliminates "wrong page on Back"

Delete `/admin/pipeline/[deviceId]/` entirely. Add redirect in `next.config.js`. Restart dev server to clear `.next/` cache.

**Files:**
- Delete: `src/app/admin/pipeline/` (entire directory)
- Modify: `next.config.js` — add redirect `/admin/pipeline/:path*` → `/admin/:path*`
- Run: `rm -rf .next` after deletion

---

## Step 2: Fix outer admin layout for nesting

**Time:** 15 min | **Impact:** CRITICAL — unblocks all layout work

The outer `admin/layout.tsx` wraps `<main className="mx-auto max-w-7xl px-6 py-8">` around all children. The device layout's `h-screen` inside this padded `<main>` overflows by 88px (56px header + 32px padding).

**Fix:** Remove padding/max-width from `<main>` in admin layout. Move it to the dashboard page (`admin/page.tsx`) which needs it.

```tsx
// admin/layout.tsx — BEFORE:
<main className="mx-auto max-w-7xl px-6 py-8">{children}</main>

// admin/layout.tsx — AFTER:
<main className="flex-1">{children}</main>

// admin/page.tsx — ADD wrapper:
<div className="mx-auto max-w-7xl px-6 py-8">
  {/* existing dashboard content */}
</div>
```

**Files:**
- Modify: `src/app/admin/layout.tsx` — strip `<main>` padding
- Modify: `src/app/admin/page.tsx` — add padding wrapper

---

## Step 3: Create shared device layout

**Time:** 1-2 hours | **Impact:** HIGH — eliminates dead-end navigation

Create `src/app/admin/[deviceId]/layout.tsx` with:
1. **DeviceHeader** — device name, manufacturer, status badge, action buttons (Pause/Restart)
2. **DeviceNav** — route links: Overview (`./`), Editor (`./editor`), Preview (`./preview`)
3. **SSE connection** — moved from page.tsx to layout, persists across route changes
4. **Content wrapper** — `<div className="flex-1 overflow-hidden">{children}</div>`

**Nav link states:**
- **Overview** — always enabled
- **Editor** — enabled when gatekeeper passed. Disabled: "Waiting for gatekeeper..."
- **Preview** — enabled when `codegenCompleted === true`. Disabled: "Run Approve & Build first"

**No Manifest tab** — keep it inside Overview as existing collapsible section.

**DeviceHeader null safety:** `activePipeline?.deviceName ?? deviceId` for first-render before SSE populates store.

**Files:**
- Create: `src/app/admin/[deviceId]/layout.tsx`
- Create: `src/components/admin/DeviceHeader.tsx`
- Create: `src/components/admin/DeviceNav.tsx`
- Modify: `src/app/admin/[deviceId]/page.tsx` — remove header + SSE (now in layout), remove Editor/Preview buttons (now in nav)
- Modify: `src/store/pipelineStore.ts` — verify SSE cleanup handles device switches

---

## Step 4: Editor height fix + keyboard shortcut fix

**Time:** 30 min | **Impact:** CRITICAL — editor works inside layout

**Height:** Change ALL `h-screen` to `h-full` in PanelEditor.tsx (3 instances: line 171 main, line 329 loading, line 337 error). Editor page wrapper uses `h-full`.

Height chain:
```
layout.tsx:     flex flex-col h-screen
  AdminHeader:    h-14 flex-shrink-0
  DeviceHeader:   h-14 flex-shrink-0
  DeviceNav:      h-10 flex-shrink-0
  content:        flex-1 overflow-hidden
    editor/page:    h-full
      PanelEditor:    flex flex-col h-full   ← NOT h-screen
```

**Keyboard shortcuts:** Add `a` and `button` to the suppression list in `useEditorKeyboard.ts` to prevent Backspace/Delete firing on focused nav links.

```typescript
if (tag === 'input' || tag === 'textarea' || tag === 'select' ||
    tag === 'a' || tag === 'button' ||
    (document.activeElement as HTMLElement)?.isContentEditable) {
  return;
}
```

**Files:**
- Modify: `src/components/panel-editor/PanelEditor.tsx` — `h-screen` → `h-full` (3 places)
- Modify: `src/app/admin/[deviceId]/editor/page.tsx` — wrapper `h-full`
- Modify: `src/components/panel-editor/hooks/useEditorKeyboard.ts` — add `a`, `button` suppression

---

## Step 5: Preview + Overview cleanup

**Time:** 20 min | **Impact:** MEDIUM — removes clutter

**Preview:** Remove Back button, Back to Editor button, dead "Submit for Review" button. The layout nav handles all navigation. Preview page just renders the panel.

**Overview:** Remove "Visual Editor" and "Preview Panel" buttons from the page content. The layout nav tabs replace them. Avoids having 3 ways to reach the same page.

**Files:**
- Modify: `src/app/admin/[deviceId]/preview/page.tsx` — strip buttons
- Modify: `src/app/admin/[deviceId]/page.tsx` — remove Editor/Preview buttons from content

---

## Step 6: Action buttons + Pause API

**Time:** 45 min | **Impact:** MEDIUM — coherent pipeline controls

**Button visibility (in DeviceHeader):**
```
running:    [Pause]
paused:     [Resume] [Restart]
completed:  [Restart]
failed:     [Restart]
```

**Cancel demoted to diagnostics panel** — destructive action shouldn't be one click away.

**Pause API:** Extend recover route with `action: 'pause'`:
```typescript
case 'pause':
  if (state.runnerPid && isProcessAlive(state.runnerPid)) process.kill(state.runnerPid, 'SIGTERM');
  if (state.childPid && isProcessAlive(state.childPid)) process.kill(state.childPid, 'SIGTERM');
  state.status = 'paused';
  state.runnerPid = null;
  state.childPid = null;
  writeState(deviceId, state);
```

**Files:**
- Modify: `src/components/admin/DeviceHeader.tsx` — status map
- Modify: `src/app/api/pipeline/[deviceId]/recover/route.ts` — add `pause` action

---

## Step 7: Restart Pipeline API

**Time:** 1 hour | **Impact:** HIGH — critical missing capability

**API:** `POST /api/pipeline/[deviceId]/restart`

**Preserves:** manifest-editor.json (→ backup to saved/), input/manuals/, input/photos/, device metadata
**Deletes:** state.json, manifest.json, templates.json, inferred-layout.json, agents/, cost.json, runner.log, backups/, worktree

**Steps:**
1. Read existing state for metadata (manufacturer, deviceName, manualPaths, budgetCapUsd)
2. Kill runner + child PIDs (handle stale)
3. Backup manifest-editor.json
4. Delete execution artifacts
5. Remove worktree
6. Create fresh state via `createInitialState()`
7. Set `codegenCompleted = false`
8. Spawn runner
9. Return `{ status: 'running', pid }`

**UI:** Restart button in DeviceHeader. Confirmation: "Re-run pipeline with latest improvements. Editor positions preserved."

**Files:**
- Create: `src/app/api/pipeline/[deviceId]/restart/route.ts`
- Modify: `src/lib/pipeline/state-machine.ts` — add `codegenCompleted` to PipelineState, initialize as false
- Modify: `src/app/api/pipeline/[deviceId]/codegen/route.ts` — set `codegenCompleted = true` on success

---

## Step 8: Nav link gating

**Time:** 30 min | **Impact:** MEDIUM — prevents "manifest not found" errors

```typescript
const gatekeeperPassed = pipeline?.phases?.some(p => p.phase === 'phase-0-gatekeeper' && p.status === 'passed') ?? false;
const codegenCompleted = pipeline?.codegenCompleted ?? false;
```

Disabled links render as `<span>` with `cursor-not-allowed`, `opacity-50`, and tooltip.

**Files:**
- Modify: `src/components/admin/DeviceNav.tsx` — gating logic

---

## Execution Order

```
Step 1: Delete duplicate routes           (10 min, no dependencies)
Step 2: Fix outer admin layout padding    (15 min, unblocks step 3)
Step 3: Create shared device layout       (1-2 hours, the big one)
Step 4: Editor height + keyboard fix      (30 min, depends on step 3)
Step 5: Preview + Overview cleanup        (20 min, depends on step 3)
Step 6: Action buttons + Pause API        (45 min, depends on step 3)
Step 7: Restart API                       (1 hour, independent)
Step 8: Nav link gating                   (30 min, depends on step 3+7)
```

**E2E smoke test after EVERY step.**

---

## What This Does NOT Change

- Pipeline runner, state machine, phases, escalations — unchanged
- Editor functionality (positioning, auto-save, codegen) — unchanged
- Agent SOULs — unchanged
- Manifest format — unchanged
- Generated panels — unchanged
- Dashboard (`/admin`) — content unchanged, just gets its own padding wrapper
