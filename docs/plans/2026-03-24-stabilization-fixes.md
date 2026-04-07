# Stabilization Fixes Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.
> **CRITICAL WORKFLOW RULE:** After each task, run a Playwright end-to-end smoke test (editor loads → controls render → approve button visible → preview loads). Do NOT proceed to the next task if any page errors.

**Goal:** Fix the root causes that make the editor and pipeline unreliable, then improve contractor UX.

**Architecture:** Defensive persistence — protect required fields from being dropped, prevent stale browser state from overwriting pipeline data, and ensure consistent visual enrichment.

**Priority order:** Task 5 (version marker — foundation) → Task 3 (auto-save gating) → Task 4 (staleness detection using version marker + mtime) → Task 1 (field preservation) → Task 11 (visual enrichment) → Task 2 (validator) → Everything else

**Adversarial review findings (2026-03-24):**
- Task 3: `hasUserEdited` must be set by UI pointer/keyboard events, NOT by store mutations (programmatic state changes would falsely trigger it)
- Task 4: mtime alone is insufficient — version marker (Task 5) is the primary signal, mtime is tiebreaker. Execution order changed: 5→3→4
- Task 5: control ID hash is too narrow — must include structural properties (shape, archetype) not just IDs, to detect visual property changes
- Task 11: don't REQUIRE visual fields from gatekeeper with hard rejection — flag missing fields as "needs manual input" to avoid hallucination
- Task 1: carry-forward priority chain: gatekeeper output (if present) > editor manifest corrections > previous pipeline manifest

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
- **CRITICAL:** Set it to true ONLY from UI event handlers, NOT from store mutations:
  - `onPointerDown` / `onMouseDown` on canvas/control nodes that lead to drag operations
  - Keyboard shortcuts that trigger delete/duplicate (keydown handler in `useEditorKeyboard`)
  - Property panel onChange handlers (when contractor changes a dropdown/input)
- Do NOT set it inside store actions like `moveControl` — these can be called programmatically (e.g., during auto-layout in `loadFromManifest`), which would falsely trigger the flag
- In `useAutoSave.ts`, check `hasUserEdited` before saving — if false, skip
- Reset `hasUserEdited` to false in BOTH: `loadFromManifest` AND the direct `useEditorStore.setState()` call in `PanelEditor.tsx` (editor restore path, lines ~297-304)
- Keep the existing `isFirstChange` guard as secondary defense
- Comment: `// hasUserEdited is driven by UI events, not store mutations, to prevent programmatic changes from triggering auto-save`

**Verify:** Open editor, check that `manifest-editor.json` is NOT created until you actually drag a control.

### Task 4: Manifest API detects stale editor manifest

The manifest GET endpoint serves `manifest-editor.json` if it exists, regardless of whether the pipeline manifest is newer.

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/manifest/route.ts`

**Current state (from audit):** Lines 12-57 check for editor manifest first. Lines 59-76 fall back to pipeline manifest. No timestamp comparison exists.

**Changes:**
- **Primary signal: version marker** (from Task 5). If editor manifest has `_manifestVersion` that doesn't match the pipeline manifest's version, the editor state is stale.
- **Secondary signal: mtime.** If both files exist, compare `fs.statSync()` mtime. If `manifest.json` is newer, editor state is likely stale.
- **Decision logic:**
  1. If editor manifest has `_manifestVersion` AND pipeline manifest exists → compare versions. Mismatch = stale.
  2. If editor manifest has NO `_manifestVersion` (old format) → fall back to mtime comparison.
  3. If stale: rename `manifest-editor.json` to `manifest-editor.json.stale`, serve pipeline manifest.
  4. If `manifest.json` doesn't exist (new device, pre-gatekeeper) → always serve editor manifest.
- Log: "Editor manifest is stale (version/mtime mismatch), serving fresh pipeline data"
- **Note:** Depends on Task 5 (version marker) being implemented first. Without it, falls back to mtime-only (less reliable).
- **Edge case:** trivial edit-then-undo creates newer editor mtime but semantically identical data. Version marker catches this (same version = not stale).

**Verify:** Re-run gatekeeper for any device, then load the editor — it should show the fresh pipeline data, not old editor state.

### Task 5: Editor saves a version marker to detect staleness

Provides a secondary staleness check in the editor itself.

**Files:**
- Modify: `src/components/panel-editor/hooks/useAutoSave.ts`
- Modify: `src/components/panel-editor/PanelEditor.tsx`

**Current state (from audit):** No version or hash field exists in the manifest or editor state.

**Changes:**
- Compute a **structural hash** of the pipeline manifest that includes:
  - Sorted control IDs
  - Sorted section IDs
  - Per-control structural fields: `type`, `section`, `shape`, `sizeClass` (fields the editor should NOT override)
  - Exclude position fields: `x`, `y`, `w`, `h`, `editorPosition` (fields the editor SHOULD override)
- Use a simple hash function (e.g., `JSON.stringify(structuralData)` → CRC32 or first 8 chars of SHA-256)
- Store as `_manifestVersion` in the editor state and in auto-saved JSON
- When the manifest API serves editor manifest (Task 4), compare `_manifestVersion` against current pipeline manifest's computed version
- On mismatch: editor state is stale → archive it, serve fresh pipeline data
- Also invalidate localStorage undo history when version mismatches — replaying undo from an old manifest on a new one can crash (different control IDs, different counts)
- **Why structural hash, not just IDs:** If the gatekeeper re-runs and changes visual properties (shape, sizeClass) but not control IDs, the editor must pick up the new properties. An ID-only hash would miss this.

**Depends on:** Nothing — this is the foundation. Tasks 3 and 4 depend on this.

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
- If missing in the new manifest, apply priority chain:
  1. Check editor manifest (`.pipeline/{id}/manifest-editor.json`) — if contractor corrected these fields, their values win
  2. Check previous pipeline manifest — carry forward as fallback
- Log a warning: "Carried forward deviceDimensions/keyboard — gatekeeper did not include them (source: editor|previous)"
- If gatekeeper DID include them, always use the gatekeeper's values (they're the freshest from the manual)

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
3. Add: "Extract visual properties from the manual Part Names pages and hardware photos. If you cannot determine a property, leave it null — the validator will apply safe defaults. Hallucinating a visual property is WORSE than leaving it null."

**Validator changes in `validateManifestCompleteness` (line 691) — SOFT enforcement, not hard rejection:**
- Count controls missing `shape` — if >20% missing, deduct 1.0 (warning, not gate failure)
- Count controls missing `sizeClass` — if >20% missing, deduct 0.5
- Count controls missing `labelDisplay` — if >20% missing, deduct 0.5
- Count controls missing `surfaceColor` on transport/performance buttons — deduct 0.25 per missing (capped at 2.0)
- **Auto-fix defaults** (extend existing auto-fixes at lines 741-846): missing `shape` → `"rectangle"`, missing `sizeClass` → `"md"`, missing `labelDisplay` → `"below"`
- **DO NOT hard-reject** manifests for missing visual fields — this causes pipeline stalls. The contractor fixes remaining properties in the editor. Score deductions are informational warnings.
- **Anti-hallucination:** The gatekeeper is a text agent. If the diagram parser didn't extract visual properties for some controls, the gatekeeper shouldn't fabricate them. The Sieve Extraction Strategy principle applies: separate perception from cognition.

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

**Current state (from audit):** `manufacturer` and `deviceName` ARE already in the editor store — set by `loadFromManifest` (lines 596-598 in manifestSlice.ts). The toolbar just doesn't read them. However, the editor restore path (`PanelEditor.tsx` lines 297-304, direct `setState`) does NOT set these fields — only `loadFromManifest` does.

**Changes:**
- In the editor restore path (`PanelEditor.tsx`), also set `manufacturer` and `deviceName` from the API response (they're available in `data.manufacturer` and `data.deviceName`)
- In EditorToolbar, read `manufacturer` and `deviceName` from the store via `useEditorStore`
- Render: `"{manufacturer} — {deviceName}"` in the toolbar left side (e.g., "Pioneer DJ — CDJ-3000")
- Handle case where fields are not yet loaded (render empty string until manifest loads)

---

## Execution Order

```
PHASE 1 — Version marker + auto-save clobber (MUST fix first, blocks all editor work):
  Task 5 (version marker — foundation, no dependencies)
  → Task 3 (auto-save gating — prevents mtime corruption)
  → Task 4 (staleness detection — uses version marker + mtime)

PHASE 2 — Pipeline reliability:
  Task 1 (field preservation — uses version marker to decide priority)
  + Task 11 (visual enrichment — soft enforcement, anti-hallucination)
  + Task 2 (validator — enforces presence, not hard rejection)

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
