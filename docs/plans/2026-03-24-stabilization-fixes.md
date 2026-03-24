# Stabilization Fixes Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.
> **CRITICAL WORKFLOW RULE:** After each task, run a Playwright end-to-end smoke test (editor loads → controls render → approve button visible → preview loads). Do NOT proceed to the next task if any page errors.

**Goal:** Fix the root causes that make the editor and pipeline unreliable, then improve contractor UX.

**Architecture:** Defensive persistence — protect required fields from being dropped, prevent stale browser state from overwriting pipeline data, and ensure consistent visual enrichment.

**Priority order:** Tasks 3+4 (auto-save clobber) → Task 1 (field preservation) → Task 11 (visual enrichment) → Task 2 (validator) → Everything else

---

## CRITICAL — Fix First (Auto-Save Clobber)

These must be fixed BEFORE any other work. The auto-save clobber caused 4-5 cascading failures in the previous session.

### Task 3: Auto-save only after user interaction

The auto-save hook in `useAutoSave.ts` fires on any state change, including the initial manifest load. This overwrites fresh pipeline data with stale browser state.

**Files:**
- Modify: `src/components/panel-editor/hooks/useAutoSave.ts`

**Current state (from audit):** The hook already has an `isFirstChange` guard (lines 50-53) and debounces at 800ms (line 6). But the guard only skips the very first change — if `loadFromManifest` triggers multiple state updates (e.g., setting sections then controls), the second update passes the guard.

**Changes:**
- Add `hasUserEdited` flag to the editor store (initial: false)
- Set it to true ONLY on explicit user actions: `moveControl`, `resizeControl`, `moveSection`, `resizeSection`, `updateControl` (the mutation actions in `manifestSlice.ts`)
- In `useAutoSave.ts`, check `hasUserEdited` before saving — if false, skip
- Reset `hasUserEdited` to false in `loadFromManifest` (so a fresh load resets the flag)

**Verify:** Open editor, check that `manifest-editor.json` is NOT created until you actually drag a control.

### Task 4: Manifest API detects stale editor manifest

The manifest GET endpoint serves `manifest-editor.json` if it exists, regardless of whether the pipeline manifest is newer.

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/manifest/route.ts`

**Current state (from audit):** Lines 12-57 check for editor manifest first. Lines 59-76 fall back to pipeline manifest. No timestamp comparison exists.

**Changes:**
- After reading `manifest-editor.json`, check `fs.statSync()` mtime of both files
- If `manifest.json` mtime > `manifest-editor.json` mtime, the editor state is stale
- In that case: rename `manifest-editor.json` to `manifest-editor.json.stale` (don't delete — keep for debugging) and serve `manifest.json` instead
- Log: "Editor manifest is stale (pipeline manifest is newer), serving fresh pipeline data"

**Verify:** Re-run gatekeeper for any device, then load the editor — it should show the fresh pipeline data, not old editor state.

### Task 5: Editor saves a version marker to detect staleness

Provides a secondary staleness check in the editor itself.

**Files:**
- Modify: `src/components/panel-editor/hooks/useAutoSave.ts`
- Modify: `src/components/panel-editor/PanelEditor.tsx`

**Current state (from audit):** No version or hash field exists in the manifest or editor state.

**Changes:**
- When loading manifest from API, compute a hash of the pipeline manifest's control IDs (e.g., `JSON.stringify(controlIds).hashCode()` or just the count + first/last ID)
- Store as `_manifestVersion` in the editor state
- When auto-saving, include `_manifestVersion` in the saved JSON
- On next load: if `manifest-editor.json` has a `_manifestVersion` that doesn't match the current pipeline manifest, discard it

**Depends on:** Task 3 + 4

---

## HIGH — Pipeline Field Preservation

### Task 1: Pipeline runner preserves deviceDimensions + keyboard on manifest promotion

When the gatekeeper manifest is promoted to `.pipeline/{id}/manifest.json`, it overwrites any previous manifest — including one that had `deviceDimensions` and `keyboard` added manually.

**Files:**
- Modify: `scripts/pipeline-runner.ts` — lines 1092-1102 (gatekeeper manifest promotion via `fs.copyFileSync`)

**Current state (from audit):** Promotion is a direct file copy. Fields are preserved IF the gatekeeper wrote them. The issue is when the gatekeeper omits them.

**Changes:**
- Before the `fs.copyFileSync` on line 1099, read the existing `manifest.json` (if it exists)
- After copying the new manifest, read it back and check for `deviceDimensions` and `keyboard`
- If missing in the new manifest but present in the old one, merge them in (JSON read → add fields → write back)
- Log a warning: "Carried forward deviceDimensions/keyboard from previous manifest — gatekeeper did not include them"

**Depends on:** Task 11 (gatekeeper should include these fields, but this is the safety net)

### Task 2: Validator enforces deviceDimensions presence

**Files:**
- Modify: `src/lib/pipeline/checkpoint-validators.ts`

**Current state (from audit):** `validateManifestCompleteness()` (line 691) exists. There is a -1.0 deduction for missing `deviceDimensions` already in the validator (added this session). Confirm this is working and also add `keyboard` field validation.

**Changes:**
- Verify the existing -1.0 deduction for missing `deviceDimensions` is in `validateGatekeeperManifest` (not just `validateManifestCompleteness`)
- Add: if `keyboard` field is completely absent (not even `null`), log a warning — the gatekeeper should explicitly set it to `null` for non-keyboard instruments or populate it for keyboard instruments
- This is a validator-level warning, not a hard failure

---

## HIGH — Reliable Visual Enrichment from Gatekeeper

### Task 11: Make gatekeeper reliably produce visual enrichment

The gatekeeper produces visual enrichment inconsistently. The CDJ-3000 got circle shapes, green/orange colors, LED data — but other instruments may not.

**Decision:** Keep visual enrichment IN the gatekeeper. One agent, one pass, fewer handoff points. The visual extractor SOUL (`.claude/agents/visual-extractor.md`) stays as a reference.

**Files:**
- Modify: `.claude/agents/gatekeeper.md` — add REQUIRED visual enrichment section
- Modify: `src/lib/pipeline/checkpoint-validators.ts` — validator rejects manifests missing visual fields

**Current state (from audit):** The gatekeeper SOUL does NOT explicitly mention `shape`, `surfaceColor`, or `buttonStyle`. It focuses on structural/spatial correctness. Visual enrichment happened by accident on CDJ-3000 because the gatekeeper was thorough on that run.

**Gatekeeper SOUL changes:**
1. Add a "VISUAL ENRICHMENT (REQUIRED)" section referencing the visual extractor SOUL fields:
   - `shape` (circle/rectangle/square) — check hardware photo for transport buttons, pads, knobs
   - `sizeClass` (xs/sm/md/lg/xl) — relative to section median
   - `surfaceColor` — from manual color references + hardware photo (CUE=amber, PLAY=green, etc.)
   - `buttonStyle` (flat-key/transport/rubber/raised) — from physical button type
   - `labelDisplay` (on-button/above/below/icon-only/hidden) — from Part Names diagram
   - `icon` — standard icon keys for transport buttons (play, pause, etc.)
   - `hasLed`, `ledColor`, `ledBehavior`, `ledPosition` — from manual "lights up" descriptions
   - `interactionType` (momentary/toggle/hold/rotary/slide) — from manual functional descriptions
   - `pairedWith` (symmetric) — for paired controls
   - `groupLabels` — standalone labels spanning multiple controls
   - `deviceDimensions` — from manual specs page (REQUIRED)
   - `keyboard` — from manual specs page, or `null` for non-keyboard instruments (REQUIRED)
2. Mark these fields as REQUIRED in the manifest schema example
3. Add: "The manifest completeness validator will REJECT manifests where >20% of controls are missing shape, sizeClass, or labelDisplay."

**Validator changes in `validateManifestCompleteness` (line 691):**
- Count controls missing `shape` — if >20% missing, deduct 2.0
- Count controls missing `sizeClass` — if >20% missing, deduct 1.0
- Count controls missing `labelDisplay` — if >20% missing, deduct 1.0
- Count controls missing `surfaceColor` on buttons with type `button` — deduct 0.5 per missing (capped at 3.0)

**Note:** The validator at line 691 already has auto-fix logic for some fields (shape defaults, sizeClass defaults). Extend this to also auto-fix missing `labelDisplay` to `"below"` and missing `sizeClass` to `"md"` — so the gatekeeper doesn't fail catastrophically, but still gets a score deduction.

---

## MEDIUM — Pipeline File Architecture Cleanup

### Task 6: Layout Engine uses paths() helper instead of hardcoded paths

**Files:**
- Modify: `scripts/pipeline-runner.ts` — `doPhase0LayoutEngine` function (lines 1122-1280)

**Current state (from audit):** Hardcoded paths match `pipelinePaths()` behavior. Helpers exist at `src/lib/pipeline/paths.ts` lines 187-189. This is optional cleanup — current code works.

**Changes:**
- Replace `path.join('.pipeline', deviceId, 'templates.json')` with `paths().templates`
- Replace `path.join('.pipeline', deviceId, 'manifest.json')` with `paths().manifest`
- Replace worktree variants similarly

### Task 7: Gatekeeper manifest search adds main repo legacy fallback

**Files:**
- Modify: `scripts/pipeline-runner.ts` — lines 1092-1097

**Current state (from audit):** `gkManifestSources` already has 3 entries covering worktree agent dir, main repo agent dir, and worktree legacy. Missing: main repo legacy `.pipeline/{id}/manifest.json`.

**Changes:**
- Add `paths().manifest` as fourth entry in `gkManifestSources`

### Task 8: Manual Extractor resume uses merge strategy for copyAgentOutput

**Files:**
- Modify: `scripts/pipeline-runner.ts` — `copyAgentOutput` function (line 176)

**Current state (from audit):** `copyAgentOutput` uses `fs.cpSync` with recursive flag. On resume, it copies the entire worktree agent dir to main repo, potentially overwriting completed sieve buckets with empty/stale versions.

**Changes:**
- For each file in the source directory, check `mtime` before copying
- Only copy if source file is newer than destination file (or destination doesn't exist)
- Log skipped files for debugging

### Task 9: Move extractorSealed path to pipeline root

**Files:**
- Modify: `src/lib/pipeline/paths.ts` — line 183
- Modify: `scripts/pipeline-runner.ts` — coverage auditor phase

**Current state (from audit):** `extractorSealed` is `.pipeline/{id}/agents/.extractor-sealed` (inside agents dir). Should be `.pipeline/{id}/.extractor-sealed` to avoid confusing directory scans.

**Changes:**
- Update path in `paths.ts`
- Update references in pipeline-runner.ts

### Task 10: renderDualColumn handles nested container structures

**Files:**
- Modify: `scripts/panel-codegen.ts` — `renderDualColumn` function (lines 826-852)

**Current state (from audit):** Function reads `containerAssignment['left-column']` and `['right-column']`, calls `renderControlsById()` only when the value is an Array. Nested objects (subzones with `{ controls, direction }`) are silently skipped.

**Changes:**
- Add recursive extraction: when a column value is an Object, traverse its keys and collect all `controls` arrays from nested subzones
- Render each subzone in a flex container with the specified `direction` (row/column)
- Test with CDJ-3000's HOT_CUE (8 pads in nested right-column) and TEMPO (mode-buttons + reset-controls in nested left-column)

**Impact:** Fixes 12 missing controls in section-based mode. Only matters as a fallback (flat mode doesn't use this), but should be correct.

---

## Editor UX Improvements

### Task 12: Full-screen editor canvas

**Files:**
- Modify: `src/components/panel-editor/PanelEditor.tsx` — lines 170-242 (current layout: `flex flex-col h-screen` → `flex flex-1` with LayersPanel, EditorWorkspace, PropertiesPanel as flex siblings)
- Modify: `src/components/panel-editor/LayersPanel.tsx` — currently always visible, no collapse mechanism (section expand/collapse exists at line 68 but not panel-level)
- Modify: `src/components/panel-editor/PropertiesPanel/index.tsx` — auto-hide when nothing selected
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — add collapse toggle buttons

**Changes:**
- Add `showLayers` and `showProperties` boolean flags to the editor store (default: false for layers, true for properties)
- LayersPanel: render as `position: absolute` overlay on left, `z-50`, with slide-in animation. Toggle via "L" key or toolbar button.
- PropertiesPanel: render as `position: absolute` overlay on right. Auto-show when control selected, auto-hide when deselected.
- Canvas takes full viewport width when panels hidden
- Toolbar gets layer toggle button (icon: layers) and properties toggle button (icon: sliders)

### Task 13: Section boundaries are non-constraining

**Files:**
- Modify: `src/components/panel-editor/SectionFrame.tsx` — uses react-rnd `Rnd` component (line 74). Verify no `bounds` prop constrains child controls.
- Modify: `src/components/panel-editor/ControlNode.tsx` — uses react-rnd. Verify no `bounds` prop.

**Current state (from audit):** Both components use `Rnd` with `dragGrid` and `resizeGrid` but the full props were not fully visible. Need to verify no `bounds="parent"` or similar constraint exists.

**Changes:**
- Verify and remove any `bounds` prop on ControlNode's `Rnd`
- Make SectionFrame backgrounds semi-transparent (already `rgba(0,0,0,0.12)` from SectionContainer)
- Add tooltip on section header: "Visual group only — controls can be dragged anywhere"

### Task 14: Contractor onboarding tutorial with tooltips

**Files:**
- Create: `src/components/panel-editor/OnboardingTour.tsx`
- Modify: `src/components/panel-editor/PanelEditor.tsx` — render tour on first load
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — add help (?) button
- Modify: `package.json` — add `react-joyride` dependency

**Current state (from audit):** `react-joyride` is NOT in dependencies. Must be added first.

**Steps in the tour:**
1. "This is your instrument canvas. Controls are pre-loaded from the pipeline."
2. "Toggle the Photo overlay to see the real hardware underneath — align controls to match."
3. "Drag controls freely anywhere on the canvas. Section boundaries are just visual groups."
4. "Click a control to edit its properties: shape, color, LED, label position."
5. "Use the Layers panel (press L) to find controls organized by section."
6. "Adjust the keyboard position using the properties panel when nothing is selected."
7. "When everything looks right, click Approve & Build to generate the production panel."
8. "Review the preview, then click Looks Good to finalize."

**Implementation:**
- `npm install react-joyride`
- Store "tutorial completed" in localStorage per device
- Help button (?) in toolbar to replay

### Task 15: Show instrument name in editor

**Files:**
- Modify: `src/components/panel-editor/EditorToolbar.tsx`

**Current state (from audit):** Toolbar uses `useEditorStore()` but does NOT have access to `deviceId`, `manufacturer`, or `deviceName`. These come from the manifest but aren't stored in the editor store as top-level fields.

**Changes:**
- Add `manufacturer` and `deviceName` to the editor store (set during `loadFromManifest` or during the API response restore path in `PanelEditor.tsx`)
- In EditorToolbar, read from store and render: `"Pioneer DJ — CDJ-3000"` in the toolbar left side

---

## Execution Order

```
PHASE 1 — Auto-save clobber (MUST fix first, blocks all editor work):
  Task 3 (auto-save gating) → Task 4 (API staleness) → Task 5 (version marker)

PHASE 2 — Pipeline reliability:
  Task 1 (field preservation) + Task 11 (visual enrichment) + Task 2 (validator)
  All independent, can run in parallel.

PHASE 3 — Architecture cleanup:
  Tasks 6, 7, 8, 9, 10 — all independent, can run in parallel.

PHASE 4 — Editor UX:
  Task 15 (instrument name — quick win, do first)
  Task 12 (full-screen canvas)
  Task 13 (section non-constraining)
  Task 14 (onboarding tutorial — do last, depends on final UX)
```

## E2E Smoke Test (run after EVERY task)

```bash
npx tsx -e "
import { chromium } from 'playwright';
async function smoke() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(err.message));

  // 1. Admin loads
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 15000 });

  // 2. Editor loads with controls
  await page.goto('http://localhost:3000/admin/cdj-3000/editor', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const controls = await page.$$('.control-node');

  // 3. Preview loads
  await page.goto('http://localhost:3000/admin/cdj-3000/preview', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  console.log('Errors:', errors.length);
  console.log('Controls in editor:', controls.length);
  if (errors.length > 0) { console.log('FAIL:', errors); process.exit(1); }
  if (controls.length === 0) { console.log('FAIL: no controls'); process.exit(1); }
  console.log('PASS');
  await browser.close();
}
smoke();
"
```
