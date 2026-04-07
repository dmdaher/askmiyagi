# Editor Hardware Patterns — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add missing hardware patterns to the visual layout editor so it can accurately represent real instruments.

**Architecture:** Extend ControlDef with new fields, add rendering logic to ControlNode, add UI controls to PropertiesPanel.

---

## Task 1: Hidden Labels + Icon Mode

**Problem:** Transport buttons (PLAY/PAUSE, SEARCH, BEAT JUMP) show text labels but should show icons (►/II, ◄◄, ►►). Labels need a "hidden" option.

**Changes:**
- `ControlDef.labelPosition` — add `'hidden'` to the union type
- `ControlDef.iconMode` — new optional boolean. When true, renders the label text as a large centered symbol instead of small text.
- `withLabel()` in ControlNode — return just the component when `hidden`
- PanelButton rendering — when `iconMode` is true, render label text at 16-20px centered in the button face
- PropertiesPanel LabelEditor — add "Hidden" option to position dropdown
- PropertiesPanel — add "Icon Mode" toggle for buttons (shows label as large icon symbol)

**Example:** PLAY/PAUSE button with `labelPosition: 'hidden'` and `iconMode: true` renders as a button with a large "►/II" symbol centered on its face.

---

## Task 2: Group Labels (Standalone Text Elements)

**Problem:** Many controls share a single label (CUE/LOOP CALL above two arrow buttons, HOT CUE above 8 pads, BEAT JUMP above two arrows).

**Approach:** Add a new element type — `GroupLabel` — that exists on the canvas as a standalone draggable text element, not attached to any control.

**Changes:**
- New type `GroupLabelDef` in manifestSlice:
  ```ts
  interface GroupLabelDef {
    id: string;
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    sectionId: string;
    fontSize: number;     // default 10
    textAlign: 'left' | 'center' | 'right';
  }
  ```
- `ManifestSlice.groupLabels: Record<string, GroupLabelDef>` — new state
- New component `GroupLabelNode.tsx` — draggable/resizable text element on canvas (uses Rnd like ControlNode)
- Render in SectionFrame alongside ControlNodes
- PropertiesPanel — when a group label is selected, show text, font size, alignment
- EditorToolbar or right-click menu — "Add Group Label" action
- LayersPanel — show group labels under each section (with a text icon)
- Auto-save includes groupLabels

**Example:** "CUE/LOOP CALL" as a GroupLabel positioned above the ◄ and ► buttons, spanning their combined width.

---

## Task 3: Button Colors

**Problem:** CUE is orange, PLAY/PAUSE is green, HOT CUE pads are multicolor. All buttons currently render gray.

**Changes:**
- `ControlDef.color` — new optional string (hex color). When set, applied as button background or accent.
- ControlNode button rendering — pass color to PanelButton as a style override or render a colored button directly for circle/colored buttons
- ControlNode pad rendering — pass color to PadButton
- PropertiesPanel — color picker (simple preset palette: gray, green, orange, red, blue, yellow, white) for buttons and pads

**Presets for CDJ-3000:**
- CUE → `#f59e0b` (amber)
- PLAY/PAUSE → `#22c55e` (green)
- HOT CUE pads → each pad can have its own color

---

## Task 4: LED Color Property

**Problem:** All LEDs render as green. SOURCE indicator should be multi-color, TEMPO RESET is a different color.

**Changes:**
- `ControlDef.ledColor` — new optional string (hex color). Defaults to `#22c55e` (green).
- ControlNode LED rendering — use `control.ledColor` instead of hardcoded green
- ControlNode dual-label LED — use `control.ledColor` for the active dot
- PropertiesPanel — color picker for LED controls

---

## Task 5: Silkscreen Text / Panel Decorations

**Problem:** Real hardware has printed text on the panel surface — "rekordbox" logo, "Pioneer DJ", section dividers.

**Changes:** Same GroupLabelDef from Task 2 can handle this — just add it at the root canvas level (no sectionId required, or a special "panel" section). Style options: color, font weight, opacity for subtle silkscreen look.

---

## Implementation Order

1. Hidden labels + icon mode (unblocks transport buttons)
2. Group labels (unblocks CUE/LOOP CALL, BEAT JUMP, HOT CUE labels)
3. Button colors (visual accuracy)
4. LED colors (visual accuracy)
5. Silkscreen text (polish)

## Branch

Work on: `feature/pipeline-architecture-upgrade` (targets `test`)
