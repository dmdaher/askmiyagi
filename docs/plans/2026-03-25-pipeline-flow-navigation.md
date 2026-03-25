# Pipeline Flow & Navigation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Clean up pipeline controls, navigation buttons, and state transitions so the admin UI is intuitive and nothing is clickable when it shouldn't be.

---

## Current Problems

1. **No way to restart a pipeline from scratch** — only Resume (continue from pause), Cancel (kill), and recovery actions (fix-stale, reset-failed, kill-restart). If the user wants to wipe everything and start over, they can't.

2. **"Visual Editor" and "Preview Panel" buttons always visible** — even when no manifest exists (pre-gatekeeper). Clicking Editor shows empty canvas or errors. Clicking Preview shows "Panel Not Generated Yet" message. These should be hidden or disabled until relevant.

3. **"Preview Panel" feels like a duplicate of "Editor"** — but they're different: Editor is for positioning controls, Preview is for seeing the generated panel. The distinction isn't clear to the user.

4. **"Submit for Review" button is dead** — shows alert("coming soon"). Either implement it or remove it.

5. **No "Pause" button** — pipeline can only be paused via escalation. No way to manually pause a running pipeline without cancelling it.

6. **Cancel = destroy** — cancelling sets status to "failed" and removes the worktree. There's no soft stop. The user might want to pause temporarily without losing state.

---

## Task 1: Add "Restart Pipeline" action

A restart wipes the pipeline state back to the beginning (preflight) while preserving the editor manifest (contractor's positioning work is sacred).

**Implementation:**
- Add "Restart" button to the pipeline detail page header (visible when status is paused, completed, or failed)
- API: `POST /api/pipeline/[deviceId]/restart`
  - Preserves: `manifest-editor.json`, `manifest.json`, device metadata
  - Wipes: `state.json` (reset to pending), all phase results, all escalations, agent outputs
  - Re-creates initial state with existing manualPaths and manufacturer
  - Auto-starts the runner
- UI confirmation: "This will re-run the entire pipeline from scratch. Your editor positions will be preserved. Continue?"

**Files:**
- Create: `src/app/api/pipeline/[deviceId]/restart/route.ts`
- Modify: `src/app/admin/[deviceId]/page.tsx` — add Restart button
- Modify: `src/lib/pipeline/state-machine.ts` — add `createRestartState()` that preserves device metadata

---

## Task 2: Add "Reset to Phase" action

Sometimes you want to re-run just the gatekeeper without restarting the whole pipeline.

**Implementation:**
- Add dropdown in diagnostics panel: "Reset to Phase: [Preflight | Parser | Gatekeeper | Layout Engine]"
- API: extend `POST /api/pipeline/[deviceId]/recover` with action `reset-to-phase` and a `targetPhase` parameter
- Clears all phase results AFTER the target phase
- Sets `currentPhase` to the target
- Preserves everything before it

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/recover/route.ts` — add `reset-to-phase` action
- Modify: admin diagnostics component — add phase selector dropdown

---

## Task 3: Gate "Visual Editor" button on manifest existence

**Current:** Always visible, always clickable.
**Fix:** Only show when gatekeeper has passed (manifest exists).

**Implementation:**
- Check `pipeline.phases` for gatekeeper passed status
- If not passed: show disabled button with tooltip "Manifest not ready — gatekeeper hasn't run yet"
- If passed: show enabled button

**Also:** Rename to just "Editor" — shorter, clearer.

**Files:**
- Modify: `src/app/admin/[deviceId]/page.tsx` — conditional button rendering

---

## Task 4: Gate "Preview Panel" button on codegen completion

**Current:** Always visible. Shows empty state if panel not generated.
**Fix:** Only show when codegen has been run (generated panel component exists).

**Implementation:**
- Check if device exists in `DEVICE_REGISTRY` (codegen registers it there)
- If not registered: show disabled button with tooltip "Run codegen first — open the Editor and click Approve & Build"
- If registered: show enabled button labeled "Preview"

**Also:** Rename to just "Preview" — shorter, clearer.

**Files:**
- Modify: `src/app/admin/[deviceId]/page.tsx` — check device registry
- Modify: `src/lib/deviceRegistry.ts` — export a `hasDevice(id)` helper

---

## Task 5: Clarify Editor vs Preview distinction

**Problem:** Both buttons are in the header, look similar, contractor doesn't know which to use.

**Fix:** Visual separation + labels that explain:
- **Editor** button: blue outline, subtitle "Position controls"
- **Preview** button: green outline, subtitle "View generated panel"

The Editor appears first (left) since it's the primary action. Preview appears second.

**Files:**
- Modify: `src/app/admin/[deviceId]/page.tsx` — button styling

---

## Task 6: Replace "Cancel" with "Pause" + "Cancel"

**Current:** Cancel kills the pipeline and sets status to failed.
**Fix:** Two actions:
- **Pause** (soft stop): Sets status to paused, kills the runner process, but preserves all state. Pipeline can be resumed.
- **Cancel** (hard stop): Sets status to failed, cleans up worktree. Pipeline must be restarted.

**Implementation:**
- Pause: `POST /api/pipeline/[deviceId]/recover` with action `pause` — sends SIGTERM to runner, sets status to paused
- Cancel: keep existing DELETE behavior but add confirmation dialog: "This will permanently stop the pipeline. Use Pause if you want to resume later."

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/recover/route.ts` — add `pause` action
- Modify: `src/app/admin/[deviceId]/page.tsx` — split Cancel into Pause + Cancel with confirmation

---

## Task 7: Remove or implement "Submit for Review"

The preview page has a dead "Submit for Review" button.

**Options:**
- **Remove it** if the workflow doesn't need a review step
- **Implement it** as: creates a PR to `test` branch with the generated panel + tutorials

**Recommendation:** Remove for now. The pipeline already creates panel-pr and tutorial-pr. Adding another review step adds confusion. The user reviews by looking at the preview and either going back to editor or approving.

**Files:**
- Modify: `src/app/admin/[deviceId]/preview/page.tsx` — remove Submit for Review button

---

## Task 8: Pipeline status-aware navigation

Consolidate all the button visibility/enabling logic into a single status map:

```
Status: pending
  - Editor: disabled (no manifest)
  - Preview: disabled (no panel)
  - Resume: hidden (not yet started, auto-starts)
  - Pause: hidden
  - Cancel: visible
  - Restart: hidden

Status: running
  - Editor: enabled if gatekeeper passed, disabled otherwise
  - Preview: enabled if codegen ran, disabled otherwise
  - Resume: hidden
  - Pause: visible
  - Cancel: hidden (use Pause first)
  - Restart: hidden (can't restart while running)

Status: paused
  - Editor: enabled if gatekeeper passed
  - Preview: enabled if codegen ran
  - Resume: visible
  - Pause: hidden
  - Cancel: visible (with confirmation)
  - Restart: visible (with confirmation)

Status: completed
  - Editor: enabled
  - Preview: enabled
  - Resume: hidden
  - Pause: hidden
  - Cancel: hidden
  - Restart: visible (with confirmation)

Status: failed
  - Editor: enabled if gatekeeper passed before failure
  - Preview: enabled if codegen ran before failure
  - Resume: hidden
  - Pause: hidden
  - Cancel: hidden
  - Restart: visible
```

**Files:**
- Modify: `src/app/admin/[deviceId]/page.tsx` — implement the status map

---

## Execution Order

```
Task 8 (status map) — do FIRST, defines the rules
Task 3 (gate Editor) — uses status map
Task 4 (gate Preview) — uses status map
Task 5 (clarify distinction) — visual only
Task 6 (Pause + Cancel split) — new API action
Task 1 (Restart) — new API route
Task 2 (Reset to Phase) — extends recovery API
Task 7 (Remove Submit for Review) — cleanup
```

---

## Task 9: Eliminate dead-end navigation loops

**Problem:** User clicks "Visual Editor" → gets "Manifest not found, gatekeeper hasn't finished" → clicks "Back" or "Review" → lands on a different page than where they started → confusing loop. Multiple pages that feel disconnected.

**Root cause:** The Editor, Preview, and Pipeline Detail are three separate pages (`/admin/{id}/editor`, `/admin/{id}/preview`, `/admin/{id}`). Navigating between them loses context. The "Back" button on the preview page goes to the pipeline detail, not back to where you came from.

**Fix: Single-page instrument view with tabs**

Instead of three separate pages, make the pipeline detail page (`/admin/{id}`) the ONE page for everything. The editor and preview become tabs within this page, alongside Logs, Manifest, and Layout.

```
/admin/{deviceId}
├─ Header: device name, status badge, action buttons (Pause/Resume/Restart/Cancel)
├─ Tab bar:
│   ├─ Overview (logs, phase timeline, escalation, diagnostics) — always enabled
│   ├─ Editor (canvas, positioning) — enabled after gatekeeper
│   ├─ Preview (generated panel) — enabled after codegen
│   ├─ Manifest (read-only viewer) — enabled after gatekeeper
│   └─ (Layout tab merged into Editor)
└─ Tab content area
```

**Benefits:**
- No separate pages = no dead-end navigation
- Tabs are disabled with tooltip explaining WHY (not just grayed out)
- User never leaves the instrument context
- "Back" always means "back to dashboard" (one level, not ambiguous)
- Status badge and action buttons are always visible regardless of which tab is active

**Implementation:**
- Move `PanelEditor` component into a tab within the pipeline detail page
- Move preview panel rendering into a tab
- Remove `/admin/{id}/editor` and `/admin/{id}/preview` as separate pages (or redirect to the tabbed view)
- Layout tab merges into Editor tab (it's part of the same editing workflow)

**Tab enablement rules (from Task 8 status map):**
- **Overview:** Always enabled
- **Editor:** Enabled when gatekeeper has passed. Disabled tooltip: "Waiting for gatekeeper to produce manifest..."
- **Preview:** Enabled when codegen has run. Disabled tooltip: "Open Editor and click Approve & Build first"
- **Manifest:** Enabled when gatekeeper has passed

**Files:**
- Modify: `src/app/admin/[deviceId]/page.tsx` — restructure as tabbed single-page view
- Move: `src/components/panel-editor/PanelEditor.tsx` usage into a tab
- Move: `src/app/admin/[deviceId]/preview/page.tsx` content into a tab
- Remove or redirect: `/admin/{id}/editor` and `/admin/{id}/preview` routes

---

## Task 10: Disabled tab tooltips explain what to do

When a tab is disabled, it shouldn't just be grayed out — it should tell the user what needs to happen.

**Implementation:**
- Hover over disabled "Editor" tab → tooltip: "Waiting for gatekeeper to identify controls. Check the Overview tab for progress."
- Hover over disabled "Preview" tab → tooltip: "No generated panel yet. Open the Editor tab and click Approve & Build."
- Hover over disabled "Manifest" tab → tooltip: "Manifest not available until gatekeeper completes."

**Files:**
- Modify: `src/components/admin/PipelineDetail.tsx` — add tooltip on disabled tabs

---

## What This Does NOT Change

- Pipeline runner state machine — phases, transitions, escalations stay the same
- Editor functionality — positioning, auto-save, codegen all unchanged
- Agent SOULs — no changes
- Manifest format — no changes
- Generated panels — no changes
