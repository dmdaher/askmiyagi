# Stabilization Fixes Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Fix the two root causes that make the editor unreliable: gatekeeper dropping fields and auto-save clobbering fresh data.

**Architecture:** Defensive persistence — protect required fields from being dropped, and prevent stale browser state from overwriting pipeline data.

---

## Problem 1: Gatekeeper Drops deviceDimensions + keyboard

**What happens:** The gatekeeper re-runs and writes a new manifest.json. But it doesn't include `deviceDimensions` or `keyboard` because:
1. The gatekeeper SOUL tells it to add these fields, but the agent doesn't always follow through
2. When the pipeline runner promotes the gatekeeper's manifest to `.pipeline/{id}/manifest.json`, it overwrites the previous manifest that had these fields

**Impact:** Editor loads without device dimensions → wrong canvas size → controls in wrong positions. Keyboard disappears.

**Fix approach:** Defensive merge in the pipeline runner. When promoting the gatekeeper manifest, carry forward `deviceDimensions` and `keyboard` from the previous manifest if the gatekeeper didn't include them. These fields are physical facts about the hardware — they never change between gatekeeper runs.

### Task 1: Pipeline runner preserves deviceDimensions + keyboard on manifest promotion

**Files:**
- Modify: `scripts/pipeline-runner.ts` — find where gatekeeper manifest is promoted to pipeline root

**Changes:**
- Before overwriting `manifest.json`, read the existing one
- If the new manifest is missing `deviceDimensions` but the old one has it, carry it forward
- Same for `keyboard`
- Log a warning when carrying forward (so we know the gatekeeper missed it)

### Task 2: Add deviceDimensions to manifest completeness validator

**Files:**
- Modify: `src/lib/pipeline/checkpoint-validators.ts`

**Changes:**
- In `validateManifestCompleteness` or `validateGatekeeperManifest`, add a warning (not failure) when `deviceDimensions` is missing
- The validator already has a -1.0 deduction for missing deviceDimensions — keep it but also log explicitly

---

## Problem 2: Auto-Save Clobbers Fresh Pipeline Data

**What happens:**
1. Pipeline produces a fresh manifest with correct data
2. User opens the editor — it loads the fresh manifest via API
3. But the editor still has the OLD Zustand state in memory from a previous session
4. The auto-save hook fires within 500ms and writes the stale state to `manifest-editor.json`
5. Next API call returns the stale `manifest-editor.json` (which has `_source: editor`), overriding the fresh pipeline data

**Impact:** Every fix we make to the manifest gets overwritten by the browser's stale state. We had to delete `manifest-editor.json` repeatedly this session and race against the auto-save.

**Fix approach:** The auto-save should only save AFTER the editor has loaded fresh data. Not on mount, not on the initial state hydration — only after the user makes an actual edit.

### Task 3: Auto-save only after user interaction

**Files:**
- Modify: `src/components/panel-editor/hooks/useAutoSave.ts`

**Changes:**
- Add a `hasUserEdited` flag (starts false)
- Set it to true on the first actual user action (move, resize, select, property change)
- Auto-save only fires when `hasUserEdited` is true
- This prevents the initial load from triggering a save of stale state

### Task 4: Manifest API detects stale editor manifest

**Files:**
- Modify: `src/app/api/pipeline/[deviceId]/manifest/route.ts`

**Changes:**
- When serving `manifest-editor.json`, compare its timestamp to `manifest.json`
- If `manifest.json` is NEWER than `manifest-editor.json`, the editor state is stale
- In that case, delete `manifest-editor.json` and serve `manifest.json` instead
- Log: "Editor manifest is stale (pipeline manifest is newer), serving fresh pipeline data"

### Task 5: Editor saves a version/timestamp to detect staleness

**Files:**
- Modify: `src/components/panel-editor/hooks/useAutoSave.ts`
- Modify: `src/components/panel-editor/PanelEditor.tsx`

**Changes:**
- When loading manifest from API, store the pipeline manifest's `updatedAt` or a hash
- When auto-saving, include this version marker
- On next load, if the version marker doesn't match the current pipeline manifest, discard the editor state

---

---

## Medium Priority — Pipeline File Architecture Cleanup

### Task 6: Layout Engine uses paths() helper instead of hardcoded paths

**Files:**
- Modify: `scripts/pipeline-runner.ts` — `doPhase0LayoutEngine` function

**Changes:**
- Replace `path.join('.pipeline', deviceId, 'templates.json')` with `paths().templates`
- Replace `path.join('.pipeline', deviceId, 'manifest.json')` with `paths().manifest`
- Replace worktree variants with `paths().wtManifest`, `paths().wtTemplates`

### Task 7: Gatekeeper manifest search includes main repo fallback

**Files:**
- Modify: `scripts/pipeline-runner.ts` — gatekeeper post-inspection

**Changes:**
- Add `gkPaths.manifest` (main repo `.pipeline/{id}/manifest.json`) as fourth fallback in `gkManifestSources` array

### Task 8: Manual Extractor resume uses merge strategy

**Files:**
- Modify: `scripts/pipeline-runner.ts` — `copyAgentOutput` function

**Changes:**
- When copying agent output directory, only overwrite files that were modified in the current run
- Check file modification times: if worktree file is older than main repo file, skip it
- Prevents completed sieve buckets from being overwritten on resume

### Task 9: Move extractorSealed path to pipeline root

**Files:**
- Modify: `src/lib/pipeline/paths.ts`
- Modify: `scripts/pipeline-runner.ts` — coverage auditor phase

**Changes:**
- Change `extractorSealed` from `.pipeline/{id}/agents/.extractor-sealed` to `.pipeline/{id}/.extractor-sealed`
- Avoids confusion with agent directory scans

### Task 10: renderDualColumn handles nested container structures

**Files:**
- Modify: `scripts/panel-codegen.ts` — `renderDualColumn` function

**Changes:**
- When `containerAssignment['left-column']` or `['right-column']` is an Object (not Array), recursively extract control IDs from nested subzones
- Each subzone has `{ controls: string[], direction: 'row'|'column' }` structure
- Render nested controls with appropriate flex direction

**Impact:** Fixes 12 missing controls in CDJ-3000 section-based mode (HOT_CUE pads + TEMPO controls)

---

## High Priority — Reliable Visual Enrichment from Gatekeeper

### Task 11: Make gatekeeper reliably produce visual enrichment

The gatekeeper already produces visual enrichment (shape, surfaceColor, buttonStyle, LED data, deviceDimensions, keyboard) — the CDJ-3000 manifest came out with circle shapes, green/orange colors, LED data. But it does this **inconsistently**. Some runs include full visual data, some don't.

**Decision:** Keep visual enrichment IN the gatekeeper rather than adding a separate visual extractor phase. Rationale:
- The gatekeeper already reads the manual and photos — it has all the info needed
- Adding a separate agent adds another handoff point (which is exactly the kind of bug we spent this session fixing)
- One agent, one pass = cheaper, faster, fewer failure modes
- The visual extractor SOUL (`.claude/agents/visual-extractor.md`) stays as a reference for what fields to extract, and as a fallback if the gatekeeper approach fails

**Files:**
- Modify: `.claude/agents/gatekeeper.md` — add REQUIRED visual enrichment section
- Modify: `src/lib/pipeline/checkpoint-validators.ts` — validator rejects manifests missing visual fields

**Gatekeeper SOUL changes:**
1. Add a "VISUAL ENRICHMENT (REQUIRED)" section with all fields from the visual extractor SOUL:
   - `shape` (circle/rectangle/square) — check hardware photo for transport buttons, pads, knobs
   - `sizeClass` (xs/sm/md/lg/xl) — relative to section median
   - `surfaceColor` — from manual color references + hardware photo (CUE=amber, PLAY=green, etc.)
   - `buttonStyle` (flat-key/transport/rubber/raised) — from physical button type
   - `labelDisplay` (on-button/above/below/icon-only/hidden) — from Part Names diagram
   - `icon` — standard icon keys for transport buttons (play, pause, etc.)
   - `hasLed`, `ledColor`, `ledBehavior`, `ledPosition` — from manual "lights up" descriptions
   - `interactionType` (momentary/toggle/hold/rotary/slide) — from manual functional descriptions
   - `pairedWith` (symmetric) — for paired controls (search ◀◀/▶▶, beat jump ◀/▶)
   - `groupLabels` — standalone labels spanning multiple controls
   - `deviceDimensions` — from manual specs page (REQUIRED, already in SOUL)
   - `keyboard` — from manual specs page (REQUIRED, already in SOUL)
2. Mark these fields as REQUIRED in the manifest schema example
3. Add: "The manifest completeness validator will REJECT manifests where >20% of controls are missing shape, sizeClass, or labelDisplay. Extract these from the manual Part Names pages and hardware photos."

**Validator changes:**
- In `validateManifestCompleteness` or `validateGatekeeperManifest`:
  - Count controls missing `shape` — if >20% missing, deduct 2.0
  - Count controls missing `sizeClass` — if >20% missing, deduct 1.0
  - Count controls missing `labelDisplay` — if >20% missing, deduct 1.0
  - Count controls missing `surfaceColor` on transport/performance buttons — deduct 0.5 per missing
  - This ensures the gatekeeper can't pass validation without visual enrichment

---

## Dependency Order

```
Task 1 (Pipeline runner preserves fields) — independent
Task 2 (Validator warning) — independent
Task 3 (Auto-save after interaction) — independent
Task 4 (API staleness detection) — independent
Task 5 (Version marker) — depends on Task 3 + 4
Task 6 (Layout Engine paths) — independent
Task 7 (Gatekeeper manifest fallback) — independent
Task 8 (Extractor resume merge) — independent
Task 9 (extractorSealed path) — independent
Task 10 (renderDualColumn) — independent
Task 11 (Visual extractor enablement) — independent but HIGH PRIORITY
```

Tasks 1-4, 6-11 are all independent. Task 5 builds on 3+4. Task 11 is high priority — it ensures every instrument gets consistent visual enrichment. Tasks 12-14 are UX improvements for the contractor experience.

---

## Editor UX Improvements

### Task 12: Full-screen editor canvas

The editor currently splits the screen between layers panel (left), canvas (center ~60%), and properties panel (right). The contractor needs a full-screen canvas to see the entire instrument at once — especially for wide synths like the Fantom-06.

**Changes:**
- Layers panel: collapsible overlay, hidden by default. Toggle via button or keyboard shortcut (L)
- Properties panel: collapsible overlay on right, only appears when a control is selected
- Toolbar: compact floating bar at top
- Canvas: takes 100% of viewport when panels are collapsed
- Panels float over the canvas (absolute/fixed positioning) instead of being flex siblings

**Files:**
- Modify: `src/components/panel-editor/PanelEditor.tsx` — layout restructure
- Modify: `src/components/panel-editor/LayersPanel.tsx` — add collapse state
- Modify: `src/components/panel-editor/PropertiesPanel/index.tsx` — auto-hide when nothing selected
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — compact mode

### Task 13: Section boundaries are non-constraining

Document and reinforce that section bounding boxes are decorative only in flat mode. The contractor can move any control anywhere — sections don't constrain positioning.

**Changes:**
- Remove any drag constraints that keep controls inside their section boundaries
- Section frames in the editor should be semi-transparent backgrounds, not opaque containers
- Controls can be dragged freely across section boundaries
- Sections auto-resize to fit their children (already partially implemented)
- Add a tooltip: "Sections are visual groups only — drag controls anywhere"

**Files:**
- Modify: `src/components/panel-editor/SectionFrame.tsx` — ensure no containment constraints
- Modify: `src/components/panel-editor/ControlNode.tsx` — verify free drag across sections

### Task 14: Contractor onboarding tutorial with tooltips

First-time walkthrough that guides the contractor through the editor. Runs once on first visit, can be re-triggered from a help button.

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
- Use `react-joyride` or a lightweight custom tooltip stepper
- Store "tutorial completed" in localStorage per device or globally
- Help button (?) in toolbar to replay the tutorial

**Files:**
- Create: `src/components/panel-editor/OnboardingTour.tsx`
- Modify: `src/components/panel-editor/PanelEditor.tsx` — render tour on first load
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — add help button

### Task 15: Show instrument name in editor

The editor doesn't indicate which instrument is being edited. The contractor opens the page and sees "Miyagi Pipeline Control" with no device context.

**Changes:**
- Display manufacturer + device name in the editor toolbar (e.g., "Pioneer DJ — CDJ-3000")
- Read from editor store (manufacturer, deviceName — already populated from manifest)

**Files:**
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — add device name display
