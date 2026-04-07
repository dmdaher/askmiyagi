# Editor Overlap + Codegen Sync — Implementation Plan

**Date:** 2026-04-04
**Branch:** `feature/pipeline-architecture-upgrade`
**Context:** Panel editor contractor workflow. Current device under test: Fantom-06.

---

## Problem Statement

Two interrelated issues surfaced while editing the Fantom-06 panel:

1. **Click-blocking between overlapping sections.** When two sections overlap geometrically in the editor canvas, controls in the underlying section become unclickable. The control underneath is trapped in its parent section's stacking context, which is painted below the overlapping section's entire rectangle — including the overlapping section's empty body. This is whack-a-mole: adjusting one section's bounds shifts which controls are blocked next. Observed: cursor-up blocked by Scene CTRL; after resizing, Scene-select + scene buttons blocked by adjacent section.

2. **Editor state not propagating to generated panel (codegen).** Values the contractor adjusts in the editor (keyboard position/width, section boxes) get saved to `manifest-editor.json` but are not merged into `manifest.json` before codegen runs. The generated `FANTOM06Panel.tsx` reflects stale values — e.g., keyboard at 55%/5%/93% in generated vs 51.8%/9.5%/90.3% in editor. Section boxes aren't rendered at all in the generated panel because `editorSections` field isn't populated on the manifest.

---

## Root Causes

### Issue 1 — Stacking context trap

Architecture places `ControlNode` DOM elements as **children** of their `SectionFrame`'s Rnd wrapper. Each section Rnd has `style.zIndex` set, creating its own stacking context. A control's internal z-index (5/10/50) only orders elements **within** its section's stacking context. A neighbor section with a higher z-index paints its ENTIRE stacking context (including its empty body) above the underlying section's context — controls inside can never escape.

Sections sort by area (largest → smallest) and get z-index = index + 1. Smaller sections therefore always paint above larger neighbors. Where geometry overlaps, the smaller one blocks clicks.

Attempted patch (`pointer-events: none` on section body) was reverted because:
- Canvas wrapper's `cursor-grab` class bled through, showing pan cursor over section body
- Kept clicks clickable but behaviorally confusing
- Doesn't fix the architectural problem — still a patch

### Issue 2 — Editor → manifest merge gap

`src/app/api/pipeline/[deviceId]/codegen/route.ts` merges editor data into `manifest.json` before running codegen. The merge handles:
- `editorPosition` per control ✓
- Editor control overrides (shape, color, label, etc.) ✓
- `editorLabels` (standalone label positions) ✓

But does NOT merge:
- **`editorData.keyboard`** → `manifest.keyboard` (keyboard stays at stale pipeline-output values)
- **`editorData.sections`** → `manifest.editorSections` (added in a recent commit but the last codegen run predates it, so manifest on disk lacks the field)

`scripts/panel-codegen.ts` reads `manifest.keyboard` and `manifest.editorSections`. If they're stale/missing, the generated panel is wrong.

---

## Solution Design

### Fix 1 — Flat control layer (architectural)

Move `ControlNode` rendering out of `SectionFrame` into a new flat `ControlLayer` component that's a sibling of sections on the canvas.

**DOM structure (before):**
```
<PanCanvas>
  <SectionFrame>
    <ControlNode>  ← child
    <ControlNode>
  <SectionFrame>
    <ControlNode>
  <LabelLayer>
```

**DOM structure (after):**
```
<PanCanvas>
  <SectionFrame>  ← visual box + banner only
  <SectionFrame>
  <ControlLayer>  ← all controls, flat
    <ControlNode>
    <ControlNode>
    <ControlNode>
  <LabelLayer>
```

**Key changes:**
- `SectionFrame` stops rendering `section.childIds.map(...)`. Section body becomes decorative-only (border + background + hover effect).
- `SectionFrame` onClick removed entirely. Only banner has onClick for selection.
- New `ControlLayer` component iterates `Object.values(controls)` and renders each `ControlNode` with absolute world-space positioning.
- `manifestSlice.moveSection` already translates child control x/y via the store — verify this still works when children aren't DOM-nested (it mutates store state, which is the source of truth either way, so should be fine).
- Section z-index continues to matter for visual layering of their boxes. Controls sit above all sections at a fixed z (e.g., `ControlLayer` z=40).

**Banner drag preserved:** `dragHandleClassName="section-drag-handle"` on the Rnd continues to work. Banner remains clickable and grabbable. Resize handles work as-is.

**Cursor bug gone:** no `pointer-events: none` on sections, so the canvas wrapper's `cursor-grab` doesn't bleed through.

**Z-layer model (new):**
| Layer | z-index |
|---|---|
| Canvas bg, PhotoOverlay | 0 |
| GridOverlay, DragSelectRect | 0–1 |
| SectionFrame (unfocused) | 1–13 |
| KeyboardSection | 15 |
| GroupOverlay (hover/selected) | 20 / 70 |
| SectionFrame (selected) | 100 |
| **ControlLayer (new)** | **40** |
| ControlNode inside (selected) | 50 |
| ControlNode (dragging) | 60 |
| LabelLayer | 150 |
| Label (dragging) | 200 |
| ContextMenu | 9999 |

ControlLayer at 40 sits above all unselected sections and keyboard, and below selected section (100), dragging controls (60), and labels (150). This is the desired order: controls always interactable, sections can be selected on top when explicitly chosen.

### Fix 2 — Editor keyboard + sections propagation

In `src/app/api/pipeline/[deviceId]/codegen/route.ts`, add after the existing `editorLabels` passthrough:

```typescript
// Merge editor's keyboard state into manifest so generated panel matches
if (editorData.keyboard) {
  (manifest as any).keyboard = {
    ...((manifest as any).keyboard ?? {}),
    ...editorData.keyboard,
  };
}
```

`editorSections` is already wired — it just needs a fresh codegen run after this change to populate the manifest correctly.

---

## Execution Checklist

### Phase A: Quick wins (data flow fix)
1. Add keyboard merge to codegen route (5 lines)
2. Re-run codegen for fantom-06
3. Verify in browser: generated panel keyboard matches editor (51.8/9.5/90.3), section boxes visible
4. Commit "fix: propagate editor keyboard + section boxes to generated panel"

### Phase B: Flat control layer refactor
1. Write `ControlLayer.tsx` — iterates `useEditorStore(s => Object.values(s.controls))`, renders `ControlNode` for each. Filters out `nestedIn` children (rendered by their parent).
2. Remove `ControlNode` rendering from `SectionFrame.tsx` (delete `section.childIds.map(...)` block).
3. Remove `onClick` from `SectionFrame`'s Rnd wrapper. Keep banner onClick only.
4. Add `<ControlLayer />` to `PanCanvas.tsx` between sections and LabelLayer.
5. Verify `ControlNode` doesn't rely on `sectionId` prop for rendering logic (only for store lookups — should be fine since controls have `parentSectionId` in their data).
6. Run Playwright smoke test: click each control type, drag a section, verify children move, click overlapping sections' underlying controls.
7. Commit "refactor: flat control layer — controls always clickable through sections"

### Phase C: Remaining queue items (independent)
- **Label icons** (task #15) — extend `EditorLabel` with optional `icon` field, render in `LabelLayer` + codegen.
- **Side-by-side scroll unzoom** (task #16) — isolate wheel handler so horizontal scroll over photo panel doesn't trigger canvas zoom.

---

## Non-Goals

- Not touching Fantom-08 panel (that's a separate codebase and not currently under test).
- Not reworking section z-index sort order (area-based sort stays — it's only cosmetic once controls are in a flat layer).
- Not changing the editor's save/autosave flow.
- Not touching the pipeline runner or upstream agents.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Flat-layer refactor breaks section-drag-with-children | `moveSection` already updates child control x/y via store mutation; DOM re-renders reflect new positions. Verify with Playwright. |
| ControlNode relies on DOM parent for positioning | ControlNode uses absolute positioning with world-space `x/y` from store. Parent is irrelevant for layout. |
| Labels break because they're linked to controls | Labels use `controlId` and render with absolute world-space coords. Independent of DOM hierarchy. |
| Codegen keyboard merge overwrites gatekeeper keyboard | Spread operator preserves gatekeeper defaults for any fields editor doesn't touch. |

---

## Queue Summary (post-plan)

| # | Task | Phase |
|---|---|---|
| 14 | Fix keyboard stretching (codegen data flow) | A |
| 13 | Verify section boxes in generated panel | A (same codegen run) |
| 18 | Flat control layer refactor | B |
| 15 | Label icons (up/down triangles) | C |
| 16 | Horizontal scroll unzoom side-by-side photo | C |
