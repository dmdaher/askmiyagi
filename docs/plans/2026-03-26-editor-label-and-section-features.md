# Editor Labels, Sections & Inference Improvements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Better label handling, contractor-created sections, and smarter inference that respects contractor decisions.

---

## Feature 1: Hide All Labels Toggle

**Why:** Labels clutter the canvas during positioning. Contractor wants to see just control shapes against the photo.

**Implementation:**
- `showLabels: boolean` in canvasSlice (default: true)
- Toolbar "Labels" toggle button + `T` keyboard shortcut
- When false: floating labels hidden, section headers hidden, group labels hidden
- On-button labels still show (they're part of the component face)

**Files:** canvasSlice.ts, ControlNode.tsx, SectionFrame.tsx, PanCanvas.tsx, EditorToolbar.tsx, useEditorKeyboard.ts

**Complexity:** ~50 LOC

---

## Feature 2: Global Label Size + Individual Override

**Why:** Smallest label (6px) is still bigger than hardware photo labels. Contractor needs to set all labels to a uniform small size, then adjust individual ones.

**Implementation:**

**Global "Set All Labels" in toolbar:**
- Dropdown: "Labels: Auto | 4px | 6px | 8px | 10px"
- Selecting a size calls `setAllLabelFontSize(size)` which updates every control's `labelFontSize` field
- "Auto" clears the override (uses sizeClass default)

**Individual override in PropertiesPanel:**
- "Label Size" dropdown per control (already partially planned)
- Options: Auto, 4px, 5px, 6px, 7px, 8px, 10px, 12px
- Stored as `labelFontSize?: number` on ControlDef

**Files:** canvasSlice.ts (global action), manifestSlice.ts (labelFontSize field + setAllLabelFontSize), EditorToolbar.tsx (dropdown), PropertiesPanel (per-control), ControlNode.tsx (use labelFontSize)

**Complexity:** ~100 LOC

---

## Feature 3: Label Text Wrapping (Multi-Line)

**Why:** "BEAT SYNC/INST.DOUBLES" renders as one long line. Hardware prints it on 2 lines. Labels should wrap to match.

**Implementation:**
- Change floating label from `whitespace-nowrap` to `whitespace-normal`
- Set `max-width` to control width (label doesn't overflow control's visual footprint)
- Add `text-center` + `text-wrap: balance` for even line breaks
- Also apply in codegen for generated panels

**Files:** ControlNode.tsx (floating label render), panel-codegen.ts (renderFloatingLabel)

**Complexity:** ~30 LOC

---

## Feature 4: Standalone Labels (Free Text)

**Why:** Hardware panels have printed text not attached to controls — "HOT CUE", "SEARCH", "TRACK SEARCH", branding, section titles. Contractor needs to create, position, and style these.

**Data model:**
```typescript
interface EditorLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;    // 4-16px
  color: string;       // default '#888'
  uppercase: boolean;  // default true
  letterSpacing: number; // 0-0.3em
}
```

**UI:**
- Toolbar "Add Label" button (or right-click canvas → "Add Label Here")
- Label renders as draggable text (Rnd component)
- Click to select → PropertiesPanel shows: text, fontSize, color, uppercase, letterSpacing
- Delete key removes
- Included in auto-save
- Codegen renders as positioned `<span>` in generated panel

**Files:** Create StandaloneLabel.tsx, modify manifestSlice.ts (editorLabels array), PanCanvas.tsx, PropertiesPanel, EditorToolbar.tsx, useAutoSave.ts, panel-codegen.ts

**Complexity:** ~300 LOC

---

## Feature 5: Create Section from Selection + Archetype

**Why:** Contractor selects multiple controls and wants to organize them — horizontal row, vertical column, grid — with proper spacing. Instead of dragging each one.

**Flow:**
1. Multi-select controls (shift+click or rubber band)
2. Toolbar button "Group Selected" or right-click → "Group as Section"
3. Modal: section name, archetype (Row | Column | Grid 2-col | Grid 3-col | Grid 4-col), gap (px)
4. Click "Apply" → controls rearrange, new section created

**Archetype arrangements:**
- **Row:** Sort by current X. Place side by side with gap.
- **Column:** Sort by current Y. Stack vertically with gap.
- **Grid NxM:** Sort by Y then X. Place in grid cells with gap. User specifies columns.

**Section bounding box:** Computed from arranged controls + padding. Controls are reassigned to the new section.

**Reversible:** Uses pushSnapshot before rearranging — Cmd+Z reverts.

**Files:** Create GroupSectionModal.tsx, modify manifestSlice.ts (groupAsSection action), ContextMenu.tsx, EditorToolbar.tsx

**Complexity:** ~350 LOC

---

## Feature 6: Inference Engine Improvements

**Why:** The inference engine during "Approve & Build" is valuable (spacing, alignment, archetype detection) but it overrides contractor decisions in two ways:

1. **Puts controls back in sections** the contractor removed them from
2. **Merges separate mini-rows** into one row when Y positions are close

### What inference should KEEP doing:
- Detect archetype (row/column/grid) from control positions
- Normalize spacing within detected groups
- Align controls to consistent grid
- Suggest section archetypes based on spatial arrangement

### What inference should STOP doing:
- Reassigning controls across sections
- Merging rows that the contractor intentionally separated

### Fix A: Respect contractor section assignments

**Before inference runs:**
1. Snapshot each control's current sectionId
2. Run inference normally (it may reassign)
3. After inference: compare new sectionIds to snapshot
4. For any control where sectionId changed: REVERT to the contractor's original sectionId
5. The inference can adjust positions/spacing within the contractor's sections, but not move controls between sections

**Implementation:**
```typescript
// In handleApproveAndBuild or handleInferenceGenerate:
const sectionSnapshot = {};
for (const [id, ctrl] of Object.entries(controls)) {
  sectionSnapshot[id] = ctrl.sectionId;
}

// ... run inference ...

// Revert section reassignments
for (const [id, originalSection] of Object.entries(sectionSnapshot)) {
  if (inferredControls[id].sectionId !== originalSection) {
    inferredControls[id].sectionId = originalSection;
  }
}
```

### Fix B: Tighter row detection threshold

**Current behavior:** Controls within ~15-20px Y tolerance are grouped as "same row."

**Problem:** On the Fantom-06, ZONE SELECT + ZONE 9-16 are 20px below the zone buttons — close enough to be merged, but the contractor placed them as a separate mini-row.

**Fix:** Reduce row detection threshold from ~15px to ~8px. This means:
- Controls within 8px Y → same row (clearly aligned)
- Controls 8-20px apart → separate rows (mini-rows respected)

**Also:** Add a minimum row gap: if the contractor placed controls at 3 distinct Y levels (Y=100, Y=120, Y=140), the inference MUST produce 3 rows, not fewer. The number of distinct Y clusters in the contractor's layout is the minimum number of rows.

**Implementation:**
- In `src/lib/layout-inference.ts` (or wherever row detection happens)
- Find the Y-clustering logic
- Reduce merge threshold
- Add "minimum rows = distinct Y clusters" constraint

**Files:**
- Modify: `src/lib/layout-inference.ts` — row detection threshold + cluster preservation
- Modify: `src/components/panel-editor/PanelEditor.tsx` — section assignment preservation in Approve & Build flow

**Complexity:** ~80 LOC

---

## Execution Order

```
1. Hide All Labels (simplest, immediate positioning value)
2. Label Wrapping (small change, fixes overflow)
3. Global Label Size (builds on label infrastructure)
4. Inference Fixes (critical for Approve & Build correctness)
5. Standalone Labels (medium complexity, useful feature)
6. Section from Selection (most complex, biggest layout impact)
```

---

## What This Does NOT Change

- Pipeline runner, agents, validators — unchanged
- Shared control components (PanelButton, Knob, etc.) — unchanged
- Manifest format — extended with optional fields, backward compatible
- Existing auto-save behavior — extended to include new data
- Codegen flat mode — still uses contractor positions as source of truth

---

## Feature 5 REVISED: Sub-Section Grouping (within existing sections)

**Why:** Contractor wants to select a set of controls within a section, group them, apply layout (row/column/grid + spacing), and then move the whole group as one unit. Not a new section — a nested group within the existing section.

**Example workflow:**
1. In the common section, select WRITE, MASTER FX, MOTIONAL PAD, DAW CTRL, MENU
2. Right-click → "Group Selected" or toolbar button
3. Choose: Row layout, 4px gap
4. Controls snap into a horizontal row with 4px spacing
5. Drag any control in the group → entire group moves together
6. Hide/shrink labels for the group
7. Position the group on the photo
8. Move to next group (e.g., cursor buttons, E1-E6 knobs)

**Data model:**
```typescript
interface ControlGroup {
  id: string;
  name: string;            // "Nav Buttons", "Function Knobs"
  controlIds: string[];    // controls in this group
  layout: 'row' | 'column' | 'grid';
  gap: number;             // spacing in px
  gridCols?: number;       // for grid layout
}
```

Store as `controlGroups: ControlGroup[]` in the editor store. Groups are nested within their parent section (all controlIds must belong to the same section).

**Behavior:**
- **Group move:** Drag any control in a group → all group members move together (same delta). Similar to multi-select move but persistent — you don't have to re-select every time.
- **Group layout:** When group is created or layout changed, controls auto-arrange with the specified spacing.
- **Ungroup:** Right-click → "Ungroup" dissolves the group. Controls keep their positions.
- **Visual indicator:** Thin colored border around grouped controls so contractor can see the grouping.

**Interaction with sections:**
- Groups live inside sections. A group cannot span multiple sections.
- Moving a section moves all its groups.
- Groups don't affect codegen — codegen uses flat positions regardless of grouping.

**Files:**
- Modify: `src/components/panel-editor/store/manifestSlice.ts` — add `controlGroups`, `createGroup`, `ungroupControls`, group-aware `moveControl`
- Create: `src/components/panel-editor/GroupControlsModal.tsx` — layout picker (row/column/grid + gap)
- Modify: `src/components/panel-editor/ControlNode.tsx` — group move behavior, visual indicator
- Modify: `src/components/panel-editor/ContextMenu.tsx` — "Group Selected" + "Ungroup"
- Modify: `src/components/panel-editor/hooks/useAutoSave.ts` — include controlGroups in save

**Complexity:** ~400 LOC

**Section creation (full) deferred** — comes after sub-section grouping is working. Would let contractor create entirely new sections from scratch, not just groups within existing sections.

---

## AUDIT FINDINGS: Mandatory Prerequisites for Sub-Section Grouping

**3 critical bugs that MUST be fixed when implementing Feature 5:**

### Critical A: historySlice must capture controlGroups for undo/redo
- `ManifestSnapshot` only has `{ sections, controls }` — no `controlGroups`
- Creating a group then undoing leaves ghost group referencing old positions
- **Fix:** Add `controlGroups: ControlGroup[]` to ManifestSnapshot, cloneSnapshot, ManifestFields, pushSnapshot, undo, redo

### Critical B: useAutoSave must watch controlGroups changes
- Change guard only checks `state.sections === prevState.sections && state.controls === prevState.controls`
- Group changes (create/dissolve/rename) don't trigger auto-save → groups lost on reload
- **Fix:** Add `state.controlGroups !== prevState.controlGroups` to the guard

### Critical C: useAutoSave must include controlGroups in save payload
- Fetch body sends `{ sections, controls, canvasWidth, canvasHeight, _manifestVersion }`
- Even if guard fires, controlGroups not in the payload → not persisted
- **Fix:** Add `controlGroups` to the fetch body
- **Also:** PanelEditor restore path must include `controlGroups: data.controlGroups ?? []` in setState

### Additional requirements:
- **Drag priority:** Group move > multi-select move > individual move. If control is in a group AND multi-selected, group wins.
- **ControlNode subscription:** Use derived selector `(s) => s.controlGroups.find(g => g.controlIds.includes(controlId))?.id ?? null` — returns stable primitive, prevents 60+ re-renders.
- **Group border:** Render as canvas-level overlay in PanCanvas (Option B), not inside SectionFrame. Simpler, avoids coupling.
- **Y_TOLERANCE already 8px:** No threshold change needed. The clustering anchor fix (already committed) addresses the drift.
- **Inference Fix A (sectionId preservation):** The current `handleApproveAndBuild` does NOT reassign sectionIds — `cleanupGeometry` only changes positions. Fix A may be future-proofing, not solving a current bug.

---

## Feature 7: Editor Version History (CRITICAL — prevents data loss)

**Why:** Contractor's positioning work was lost after Approve & Build. There's no way to go back to a previous state. Auto-save overwrites the single manifest-editor.json file. This is unacceptable — contractor confidence depends on knowing their work is never lost.

**Design:**

Every save creates a NEW version, never overwrites:
```
.pipeline/{id}/versions/
  v001.json  (initial load)
  v002.json  (first edit)
  v003.json  (auto-save after drag)
  ...
  v047.json  (pre-approval snapshot)
  v048.json  (post-approval with inference changes)
  v049.json  (current)
```

Named snapshots at key moments:
- **"pre-approval"** — saved automatically before Approve & Build runs cleanup/inference
- **"post-codegen"** — saved after codegen generates the panel
- **Auto-save versions** — numbered sequentially, capped at last 50

**UI in editor:**
- Version dropdown in toolbar: "v49 (now) | v48 post-codegen | v47 pre-approval | v46 (2 min ago) | ..."
- Click any version → editor loads that version's positions
- "Restore This Version" button makes it the current version
- Current working state is always the latest version

**Implementation:**
- `manifest-editor.json` is still the "current" file (backward compatible)
- Each save ALSO writes to `.pipeline/{id}/versions/vNNN.json`
- Version counter stored in `manifest-editor.json` as `_version: number`
- Pre-approval and post-codegen get special names in a versions index
- Auto-save writes new version (not overwrite) — debounced to avoid flooding
- Keep last 50 versions, delete oldest on overflow

**RULE: manifest-editor.json is NEVER deleted by any code path.** Not by pipeline restart, not by Playwright tests, not by codegen, not by anything. The only thing that writes to it is the auto-save hook and version restore. Backups in versions/ are append-only.

**Files:**
- Modify: `src/components/panel-editor/hooks/useAutoSave.ts` — write versions on save
- Create: `src/app/api/pipeline/[deviceId]/versions/route.ts` — GET (list versions), POST (restore version)
- Create: `src/components/panel-editor/VersionDropdown.tsx` — version selector in toolbar
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — add version dropdown
- Modify: `src/components/panel-editor/PanelEditor.tsx` — pre-approval version snapshot

**Complexity:** ~400 LOC
**Priority:** HIGH — implement before giving contractor access
