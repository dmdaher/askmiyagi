# Design: Panel Codegen + Visual Layout Editor

## Overview

Two tightly coupled pieces that replace the LLM-based Panel Builder (Phase 1):

1. **Panel Codegen** (`scripts/panel-codegen.ts`) — deterministic script that reads manifest + templates → generates production React components
2. **Visual Layout Editor** — Figma-like editor where contractors position real control components on a canvas, with changes auto-saved back to the manifest

Together they form the panel build loop:

```
Pipeline Phase 0 (AI) → manifest.json + templates.json
    ↓
Codegen runs → generates initial React components
    ↓
Visual Layout Editor renders real components in editable state
    ↓
Contractor edits (drag, resize, label, type changes)
    ↓
Auto-saves to manifest.json
    ↓
"Approve" → codegen re-runs → generates final .tsx files
    ↓
Contractor reviews generated panel (read-only validation)
    ↓
Matches? → Done. Doesn't match? → codegen bug, fix it.
```

The read-only validation step exists to catch codegen bugs during early use. Once codegen is proven faithful, this step can be removed.

---

## Part 1: Panel Codegen

### What it does

Deterministic script — no AI, no interpretation. Reads pipeline output, generates React components mechanically.

### Input

- `.pipeline/{deviceId}/manifest.json` — control inventory, sections, archetypes, spatial data
- `.pipeline/{deviceId}/templates.json` — CSS architecture per section from Layout Engine

### Output

```
src/components/devices/{deviceId}/
├── {DeviceName}Panel.tsx              (root panel component)
├── sections/{SectionId}Section.tsx     (per section, e.g. 13 for CDJ-3000)
src/lib/devices/{deviceId}-constants.ts (panel dimensions, control IDs)
src/lib/deviceRegistry.ts              (append new device entry)
```

### Control type → component mapping

| Manifest type     | Component      | Import from                          |
|-------------------|----------------|--------------------------------------|
| button            | PanelButton    | @/components/controls/PanelButton    |
| knob              | Knob           | @/components/controls/Knob           |
| fader, slider     | Slider         | @/components/controls/Slider         |
| led, indicator    | LEDIndicator   | @/components/controls/LEDIndicator   |
| wheel             | Wheel          | @/components/controls/Wheel          |
| pad               | PadButton      | @/components/controls/PadButton      |
| encoder           | ValueDial      | @/components/controls/ValueDial      |
| switch, lever     | Lever          | @/components/controls/Lever          |
| screen, display   | div            | (placeholder)                        |
| Unknown           | **Hard error** | Script exits with error              |

### Archetype → JSX structure

| Archetype              | JSX structure                                                              |
|------------------------|----------------------------------------------------------------------------|
| single-row             | `flex flex-row` with controls in order                                     |
| single-column          | `flex flex-col` with controls stacked                                      |
| grid-NxM               | CSS grid with `grid-template-columns: repeat(N, 1fr)`                     |
| cluster-above-anchor   | flex-col: grid cluster (top, heightSplits.cluster%) + anchor (bottom)      |
| cluster-below-anchor   | flex-col: anchor (top) + grid cluster (bottom)                             |
| anchor-layout          | flex-col: secondary controls + anchor element                              |
| dual-column            | grid 2 columns                                                            |
| stacked-rows           | flex-col of flex-row divs                                                  |

Nested SubZones: parent container uses `flex flex-row`, each sub-zone uses direction from `SubZone.direction`.

### Root panel component

- Absolute positioning using `panelBoundingBox` (x, y, w, h as %)
- Panel canvas with computed width/height from bounding box extents
- Dark background (#1a1a1a)
- Each section wrapped in positioned div
- Passes `panelState`, `highlightedControls`, `onButtonClick` to all sections

### Section components

Each section file follows the established pattern:
- Props: `panelState`, `highlightedControls`, `onButtonClick`
- Helper: `getState(id)`, `isHighlighted(id)`
- Layout from template archetype → JSX div structure
- Real control components rendered with correct props

### CLI

```bash
npx tsx scripts/panel-codegen.ts <device-id> [--dry-run] [--panel-width N] [--panel-height N]
```

### Verification

1. Run codegen against CDJ-3000 manifest/templates
2. `npx tsc --noEmit` — zero errors
3. `npm run build` — builds successfully
4. Dev server → navigate to CDJ-3000 panel → renders all sections
5. All 61 controls visible with correct component types

---

## Part 2: Visual Layout Editor

### Design philosophy

**Industrial-precision tool.** The editor is for contractors who position hardware controls against a reference photo. The aesthetic is utilitarian and precise — dark interface, high contrast, minimal chrome. Every pixel of UI serves the task. Think Figma's canvas editor, not a dashboard.

The editor renders **real control components** (actual Knobs, Sliders, Buttons from the component library) — not wireframe boxes. The contractor sees exactly what the final panel will look like while editing.

### Route

New tab in the admin panel, separate from the existing structural editor:

```
/admin/pipeline/{deviceId}/editor    → Visual Layout Editor (contractor-facing)
/admin/pipeline/{deviceId}           → Existing detail page (developer-facing, unchanged)
```

Both share the same manifest data and API endpoints. Two views of the same data. If the visual editor proves itself, the old editor can be removed.

### Core capabilities

**Canvas interaction:**
- Drag controls to reposition (real React components, not boxes)
- Resize controls and sections via drag handles
- Grid snap with adjustable presets (4px, 8px, 16px, 32px)
- Zoom via scroll wheel (zoom toward cursor position)
- Pan via drag on empty canvas area
- Multi-select via shift-click or rubber-band drag selection
- Move multiple selected controls together

**Section-level editing:**
- Drag to reposition entire sections (all children move with them)
- Resize section boundaries
- Sections have visible border/handles on hover

**Control-level editing:**
- Drag to reposition within section bounds
- Resize via handles
- Lock/unlock to prevent accidental moves
- Change control type via visual glossary dropdown (thumbnails of each component, not just names)
- Inline label editing (double-click label text to edit)
- Add new controls via visual glossary picker
- Duplicate controls (right-click or Cmd+D)
- Delete controls (Backspace or right-click)

**Labels:**
- Inline double-click editing for quick text fixes
- Properties panel for label position (above / below / left / right / on-button)
- Add labels where none exist
- Add secondary labels (e.g., dual-mode labels like "VINYL" above + "CDJ" below)

**Properties panel (right sidebar):**
- Appears when a control or section is selected
- Clean, minimal design with tooltips for non-obvious fields
- Shows: label text, label position, control type (visual glossary), size (w/h), spacing/gap
- Multi-select: shows shared values, "Mixed" for differing values
- Redesigned from scratch for contractor UX — not the current admin panel style

**Photo reference:**
- Hardware photo overlay with adjustable opacity slider
- Toggle photo on/off (keyboard shortcut: P)
- Photo displayed behind the editable controls for alignment comparison

**Keyboard shortcuts:**
- `Cmd+Z` / `Cmd+Shift+Z` — undo / redo
- `Backspace` / `Delete` — delete selected
- `Cmd+D` — duplicate selected
- `Cmd+/Cmd-` — zoom in/out
- `G` — toggle grid
- `P` — toggle photo overlay
- Tooltips show keyboard shortcuts alongside actions

**Right-click context menu:**
- Duplicate, delete, lock/unlock, change type
- Rendered via portal to avoid z-index issues

**Persistence:**
- Auto-save: every edit writes back to `.pipeline/{deviceId}/manifest.json` (debounced 800ms)
- Undo history: unlimited, persisted to `.pipeline/{deviceId}/edit-history.json`
- Contractor can close browser and reopen — work is never lost

### Component architecture

```
src/components/panel-editor/
├── PanelEditor.tsx              # root orchestrator, mounts keyboard hook
├── EditorToolbar.tsx            # snap presets, zoom, undo/redo, toggles
├── EditorWorkspace.tsx          # overflow:hidden, zoom/pan event capture
├── PanCanvas.tsx                # CSS transform: scale(zoom) translate(panX, panY)
├── PhotoOverlay.tsx             # hardware reference photo with opacity
├── GridOverlay.tsx              # visual grid lines matching snap preset
├── DragSelectRect.tsx           # rubber-band multi-select
├── SectionFrame.tsx             # react-rnd wrapper for sections (drag + resize)
├── ControlNode.tsx              # react-rnd wrapper for controls (drag + resize)
├── ContextMenu.tsx              # right-click menu (portal)
├── PropertiesPanel/
│   ├── index.tsx                # layout + selection routing
│   ├── ControlTypeSelector.tsx  # visual glossary with rendered thumbnails
│   ├── LabelEditor.tsx          # text + position fields
│   └── GeometryFields.tsx       # x, y, width, height
├── store/
│   ├── index.ts                 # composed Zustand store
│   ├── canvasSlice.ts           # zoom, pan, grid, photo state
│   ├── manifestSlice.ts         # sections, controls, selection, locks
│   └── historySlice.ts          # undo/redo snapshots
└── hooks/
    ├── useEditorKeyboard.ts     # global keyboard shortcuts
    ├── useAutoSave.ts           # debounced manifest persistence
    └── useZoomPan.ts            # scroll-to-zoom + drag-to-pan
```

### Key technical decisions

| Decision | Choice | Reason |
|---|---|---|
| Drag/resize library | `react-rnd` | Built-in resize + grid snap (`dragGrid`) + bounds constraints in one package |
| State management | Zustand with slices | Cross-component subscriptions without re-render cascade on 60+ controls |
| Control positions | Absolute canvas coordinates | Multi-select delta math stays trivial; avoids nested transform bugs |
| Coordinate system | Single canvas space | Mouse events from react-rnd divided by zoom before writing to store |
| Undo stack storage | `.pipeline/{deviceId}/edit-history.json` | Persists across browser sessions |
| Auto-save target | Server manifest only | Undo stack separate; server only needs current state |
| Context menu | Portal at root | No z-index battles with canvas elements |
| Inline edit state | Component-local (not store) | Ephemeral display state, no undo implications |
| Separate route | `/admin/pipeline/{deviceId}/editor` | Clean separation from existing editor; different users, different UX |

### Controls data model

Controls stored as a **flat map by ID** (not nested under sections). Sections store an array of child IDs. This makes multi-select operations, undo snapshots, and property updates O(1) lookups.

```ts
// In manifestSlice
sections: Record<sectionId, {
  id: string;
  archetype: string;
  x: number; y: number; w: number; h: number;
  childIds: string[];
  // ...other manifest fields
}>

controls: Record<controlId, {
  id: string;
  label: string;
  type: ControlType;
  x: number; y: number; w: number; h: number;
  sectionId: string;
  labelPosition: 'above' | 'below' | 'left' | 'right' | 'on-button';
  locked: boolean;
  // ...other manifest fields
}>

selectedIds: Set<string>
lockedIds: Set<string>
```

### Zoom & pan

`EditorWorkspace` captures scroll + pointer events with `overflow: hidden`. `PanCanvas` applies:

```css
transform: scale(var(--zoom)) translate(var(--panX), var(--panY));
transform-origin: 0 0;
```

Scroll-to-zoom recalculates pan to zoom toward cursor position. All manifest positions are in canvas space (1x zoom). Mouse events from react-rnd callbacks must be divided by current zoom before writing to store.

### Auto-save + undo interaction

- Before any mutating action: snapshot current manifest state → push to undo stack
- Mutate manifest state
- Zustand subscriber detects change → debounce 800ms → `PUT /api/pipeline/{deviceId}/manifest`
- Undo pops from past stack, pushes current to future stack, restores snapshot
- Auto-save fires after undo too — manifest always reflects current state
- Undo stack persisted independently to edit-history.json (max 100 entries)

---

## Deferred (not in v1)

- **Smart alignment guides** — snap-to-neighbor edges/centers (Figma feature). Grid snap is sufficient for v1.
- **Theme system** — `data-theme="pioneer-dj"` etc. One device doesn't need themes.
- **Parameter ranges** — min/max for knobs/faders. Codegen uses defaults (0-127).
- **Framer-motion animations** — generate plain divs first, add motion.div as polish.
- **Drag-and-drop between sections** — controls stay within their section for v1.
- **Progress/change indicators** — subtle dots on modified controls. Rely on undo for now.

---

## Implementation order

1. **Panel codegen script** — generates components from existing manifest/templates
2. **Editor store** — Zustand slices (canvas, manifest, history)
3. **Editor canvas** — zoom/pan/grid, section frames, control nodes with real components
4. **Drag/resize** — react-rnd integration with grid snap
5. **Properties panel** — side panel with type selector, label editor, geometry fields
6. **Interaction features** — multi-select, lock, right-click menu, keyboard shortcuts
7. **Persistence** — auto-save, undo history to disk
8. **Photo overlay** — reference photo with opacity control
9. **Validation step** — read-only generated panel preview for codegen verification
10. **Polish** — tooltips, visual glossary thumbnails, UX refinements

## Branch

Work on: `feature/pipeline-architecture-upgrade` (targets `test`)
