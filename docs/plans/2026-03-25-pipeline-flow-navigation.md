# Pipeline Flow & Navigation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Clean up pipeline controls, navigation, and state transitions. Make it intuitive. Eliminate dead-end navigation. Add restart capability.

**Architecture decision (from frontend audit):** Use a shared `layout.tsx` with persistent device header + route-based nav links — NOT single-page tabs. Each view (overview, editor, preview) keeps its own route and height model. The layout provides the shared chrome (device name, status, action buttons, nav links).

---

## Current Problems

1. **No restart** — can't reset a pipeline from scratch. Old pipelines run with outdated code/SOULs. Only Resume/Cancel/Recovery exist.
2. **Dead-end navigation** — Editor says "manifest not found", user clicks back, lands on wrong page. Preview says "not generated yet", no clear path forward.
3. **Buttons always visible** — Editor and Preview buttons show even when they can't work. User clicks, gets errors.
4. **No persistent context** — navigating from overview to editor loses the status badge, action buttons, and pipeline context. Each page is disconnected.
5. **Pause vs Cancel confusion** — Cancel destroys everything. No soft pause.
6. **Dead "Submit for Review" button** on preview page.

---

## PHASE 1: Restart Pipeline (CRITICAL — do first)

### Task 1: Add "Restart Pipeline" API + UI

Outdated pipelines need to be re-run with the latest SOUL updates, codegen fixes, and validator improvements. This is the most important missing feature.

**What restart does:**
- Kills running process (if any)
- Preserves: `manifest-editor.json` (contractor positions are SACRED), device metadata (manufacturer, deviceName, manualPaths)
- Wipes: `state.json` (reset all phases), agent outputs, templates, cost tracking
- Re-creates initial state from device metadata
- Auto-starts the runner from preflight

**API:** `POST /api/pipeline/[deviceId]/restart`

```typescript
// 1. Kill runner if alive
// 2. Read existing state for device metadata
// 3. Backup manifest-editor.json to .pipeline/saved/{id}/
// 4. Delete state.json, agents/, templates.json, cost.json, runner.log
// 5. Create fresh state with existing manualPaths, manufacturer, deviceName, budgetCapUsd
// 6. Spawn runner
// 7. Return { status: 'running', pid }
```

**UI:** "Restart" button in the pipeline detail header.
- Visible when: `status === 'paused' || 'completed' || 'failed'`
- Confirmation dialog: "This will re-run the entire pipeline with the latest improvements. Your editor positions will be preserved."
- Not visible when running (must pause first)

**Files:**
- Create: `src/app/api/pipeline/[deviceId]/restart/route.ts`
- Modify: `src/app/admin/[deviceId]/page.tsx` — add Restart button
- Modify: `src/lib/pipeline/state-machine.ts` — add helper to create restart state from existing metadata

---

### Task 2: Add "Reset to Phase" in diagnostics

Sometimes you just want to re-run the gatekeeper, not the whole pipeline.

**API:** Extend `POST /api/pipeline/[deviceId]/recover` with `action: 'reset-to-phase'` and `targetPhase` parameter.

**UI:** Dropdown in diagnostics panel: "Reset to: [Preflight | Parser | Gatekeeper | Layout Engine]"

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/recover/route.ts`
- Modify: diagnostics component in `PipelineDetail.tsx`

---

## PHASE 2: Shared Layout + Navigation (eliminates dead ends)

### Task 3: Create shared device layout

**The key change:** Create `src/app/admin/[deviceId]/layout.tsx` that renders:
1. **Device header:** manufacturer, device name, status badge, action buttons (Pause/Resume/Restart/Cancel)
2. **Nav bar:** route links styled as tabs — Overview, Editor, Preview, Manifest
3. **`{children}`** — the route-specific content

This layout persists across route navigation. The user always sees the device name, status, and all navigation options regardless of which page they're on.

**SSE connection moves to layout** — currently in `page.tsx`, dies when navigating to editor. In the layout, it persists across all routes.

**Nav link states (gated on pipeline phase):**
- **Overview** (`/admin/{id}`) — always enabled, always linked
- **Editor** (`/admin/{id}/editor`) — enabled after gatekeeper passed. Disabled tooltip: "Waiting for gatekeeper..."
- **Preview** (`/admin/{id}/preview`) — enabled after codegen ran (device in registry). Disabled tooltip: "Run Approve & Build in Editor first"
- **Manifest** — keep as tab within Overview (already works), not a separate route

**Files:**
- Create: `src/app/admin/[deviceId]/layout.tsx`
- Create: `src/components/admin/DeviceHeader.tsx` — extracted from page.tsx header
- Create: `src/components/admin/DeviceNav.tsx` — tab-style nav links with disabled states
- Modify: `src/app/admin/[deviceId]/page.tsx` — remove header (now in layout), keep content
- Modify: `src/app/admin/[deviceId]/editor/page.tsx` — remove any duplicate header
- Modify: `src/app/admin/[deviceId]/preview/page.tsx` — remove header, remove "Back" button (layout provides nav)

---

### Task 4: Editor page — change `h-screen` to `h-full`

The editor currently uses `h-screen` which claims the full viewport. Inside the layout (which has a header + nav bar), this overflows by ~80px.

**Fix:** Change `h-screen` to `h-full` in `EditorShell` and ensure the layout's content area uses `flex-1 overflow-hidden`.

**Files:**
- Modify: `src/components/panel-editor/PanelEditor.tsx` — `h-screen` → `h-full`
- Modify: `src/app/admin/[deviceId]/layout.tsx` — content wrapper uses `flex-1 overflow-hidden`

---

### Task 5: Preview page — remove duplicate navigation

Preview currently has its own "Back" and "Back to Editor" buttons. With the shared layout nav, these are redundant.

**Fix:** Remove Back/Back to Editor buttons. Remove dead "Submit for Review" button. The preview page just renders the panel.

**Files:**
- Modify: `src/app/admin/[deviceId]/preview/page.tsx` — simplify to just panel rendering

---

## PHASE 3: Status-Aware Controls

### Task 6: Action button visibility map

Implement a single source of truth for which buttons are visible/enabled:

```
pending:    [Cancel]
running:    [Pause]
paused:     [Resume, Cancel, Restart]
completed:  [Restart]
failed:     [Restart]
```

**Pause** (new): Sends SIGTERM to runner, sets status to paused. Preserves all state. Pipeline can be resumed.
**Cancel**: Sets status to failed, cleans up. Confirmation required.
**Restart**: Wipes and re-runs from scratch. Confirmation required. Preserves editor positions.

**Files:**
- Modify: `src/components/admin/DeviceHeader.tsx` — implement status map
- Modify: `src/app/api/pipeline/[deviceId]/recover/route.ts` — add `pause` action

---

### Task 7: Nav link gating logic

The DeviceNav component checks pipeline state to enable/disable route links:

```typescript
const gatekeeperPassed = pipeline.phases.some(p => p.phase === 'phase-0-gatekeeper' && p.status === 'passed');
const codegenRan = DEVICE_REGISTRY[deviceId] !== undefined;

// Editor: enabled if gatekeeperPassed
// Preview: enabled if codegenRan
```

Disabled links show a tooltip on hover explaining what needs to happen. They don't navigate — they show the tooltip.

**Files:**
- Modify: `src/components/admin/DeviceNav.tsx` — gating logic + tooltips
- Modify: `src/lib/deviceRegistry.ts` — export `hasDevice(id: string): boolean`

---

## PHASE 4: Cleanup

### Task 8: Keep old routes as redirects

Contractor may have bookmarks to `/admin/{id}/editor`. Keep the routes but have the layout handle them. Since we're using Next.js App Router layout, these routes naturally work — the layout wraps all child routes.

No code change needed — the layout automatically wraps `/admin/{id}`, `/admin/{id}/editor`, `/admin/{id}/preview`.

### Task 9: Mobile — disable editor on narrow viewports

On screens < 768px, the Editor nav link is disabled with tooltip "Editor requires a desktop browser." Overview and Preview still work.

**Files:**
- Modify: `src/components/admin/DeviceNav.tsx` — media query check

---

## Execution Order

```
PHASE 1 (restart — critical, do first):
  Task 1 (Restart API + UI)
  Task 2 (Reset to Phase)

PHASE 2 (shared layout — eliminates dead ends):
  Task 3 (Create layout + DeviceHeader + DeviceNav)
  Task 4 (Editor h-screen → h-full)
  Task 5 (Preview cleanup)

PHASE 3 (status-aware controls):
  Task 6 (Action button visibility map + Pause)
  Task 7 (Nav link gating)

PHASE 4 (cleanup):
  Task 8 (Route redirects — no code needed)
  Task 9 (Mobile disable editor)
```

---

## What This Does NOT Change

- Pipeline runner state machine — phases, transitions, escalations unchanged
- Editor functionality — positioning, auto-save, codegen unchanged
- Agent SOULs — unchanged
- Manifest format — unchanged
- Generated panels — unchanged
- Dashboard (`/admin`) — unchanged

---

## Frontend Architecture Decision (from component architect review)

**Shared layout + route links** over single-page tabs because:
- Editor, Overview, and Preview have incompatible height models (full-viewport canvas vs scrollable document vs static render)
- Forcing all three into one tab content area requires conditional CSS that breaks when a new tab is added
- Route-level layouts give each view its own height contract while sharing the chrome
- SSE connection moves to the layout so it persists across route switches
- Next.js App Router code-splits per route — editor bundle only loads when navigating to `/editor`
- Deep-linking works naturally — contractor bookmark `/admin/cdj-3000/editor` just works
