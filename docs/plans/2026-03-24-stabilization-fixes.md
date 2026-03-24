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
```

Tasks 1-4, 6-10 are all independent. Task 5 builds on 3+4.
