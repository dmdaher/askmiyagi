# Panel Codegen + Visual Layout Editor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Replace LLM-based Panel Builder with a deterministic codegen script + Figma-like visual editor for contractor panel corrections.

**Architecture:** Codegen reads manifest.json + templates.json → generates React components. Visual editor renders real control components with drag/resize via react-rnd, Zustand state management, auto-save to manifest. Separate route from existing admin editor.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Tailwind 4 / Zustand 5 / react-rnd / framer-motion 12

---

## Task 1: Panel Codegen — Core Script

**Files:**
- Create: `scripts/panel-codegen.ts`

**Reference files:**
- `scripts/layout-engine.ts` (types: MasterManifest, TemplateSpec, SubZone, LayoutArchetype, subZoneControls, subZoneDirection)
- `.pipeline/cdj-3000/manifest.json` (12 sections, 61 controls)
- `.pipeline/cdj-3000/templates.json` (12 template specs)
- `src/components/devices/fantom-08/sections/ZoneSection.tsx` (section pattern)
- `src/components/devices/fantom-08/FantomPanel.tsx` (root panel pattern)
- `src/types/panel.ts` (PanelState, ButtonState types)
- `src/lib/deviceRegistry.ts` (registry format)

**Step 1: Create the codegen script with CLI, manifest loading, and section file generation**

The script must:
1. Parse CLI args: `<device-id>` required, `--dry-run` optional, `--panel-width N` / `--panel-height N` optional
2. Load `manifest.json` and `templates.json` from `.pipeline/{deviceId}/`
3. For each section in the manifest, generate a section component file
4. Generate the root panel component
5. Generate the constants file
6. Update deviceRegistry.ts

**Control type → component mapping** (hard-coded in the script):
```ts
const CONTROL_MAP: Record<string, { component: string; import: string }> = {
  button:    { component: 'PanelButton', import: '@/components/controls/PanelButton' },
  knob:      { component: 'Knob',        import: '@/components/controls/Knob' },
  fader:     { component: 'Slider',      import: '@/components/controls/Slider' },
  slider:    { component: 'Slider',      import: '@/components/controls/Slider' },
  led:       { component: 'LEDIndicator', import: '@/components/controls/LEDIndicator' },
  indicator: { component: 'LEDIndicator', import: '@/components/controls/LEDIndicator' },
  wheel:     { component: 'Wheel',       import: '@/components/controls/Wheel' },
  pad:       { component: 'PadButton',   import: '@/components/controls/PadButton' },
  encoder:   { component: 'ValueDial',   import: '@/components/controls/ValueDial' },
  switch:    { component: 'Lever',       import: '@/components/controls/Lever' },
  lever:     { component: 'Lever',       import: '@/components/controls/Lever' },
  screen:    { component: 'div',         import: '' },
  display:   { component: 'div',         import: '' },
};
```

**Section generation by archetype:**
- `single-row` → `<div className="flex flex-row items-center gap-1">` with controls in order
- `single-column` → `<div className="flex flex-col items-center gap-1">` with controls stacked
- `grid-NxM` → `<div className="grid" style={{ gridTemplateColumns: 'repeat(N, 1fr)' }}>` using manifest gridCols
- `stacked-rows` → `<div className="flex flex-col gap-1">` with `<div className="flex flex-row gap-1">` per row from containerAssignment
- `cluster-above-anchor` → `<div className="flex flex-col">` with cluster div (heightSplits.cluster) + anchor div (heightSplits.anchor)
- `cluster-below-anchor` → same but anchor on top, cluster below
- `anchor-layout` → `<div className="flex flex-col">` with secondary controls then anchor
- `dual-column` → `<div className="grid grid-cols-2 gap-1">`

For nested SubZones (e.g., tempo section's `anchor: { slider: [...], reset: [...] }`):
- Use `subZoneControls()` and `subZoneDirection()` from layout-engine.ts
- Parent container: `flex flex-row`
- Each sub-zone: `flex` with `flex-direction` from SubZone.direction

**Each section file anatomy:**
```tsx
'use client';

import PanelButton from '@/components/controls/PanelButton';
// ... other needed imports based on control types in this section

import { PanelState } from '@/types/panel';

interface {SectionPascal}SectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function {SectionPascal}Section({
  panelState,
  highlightedControls,
  onButtonClick,
}: {SectionPascal}SectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <div data-section-id="{sectionId}" className="...archetype layout classes...">
      {/* controls rendered here based on archetype */}
    </div>
  );
}
```

**Each control renders like:**
```tsx
// button
<PanelButton
  id="source-btn"
  label="SOURCE"
  active={getState('source-btn').active}
  highlighted={isHighlighted('source-btn')}
  onClick={() => onButtonClick?.('source-btn')}
/>

// knob
<Knob
  id="jog-adjust-knob"
  label="JOG ADJUST"
  value={getState('jog-adjust-knob').value ?? 64}
  highlighted={isHighlighted('jog-adjust-knob')}
/>

// led
<LEDIndicator
  id="source-indicator"
  on={getState('source-indicator').ledOn ?? false}
  color={getState('source-indicator').ledColor}
  highlighted={isHighlighted('source-indicator')}
/>

// fader/slider
<Slider
  id="tempo-slider"
  label="TEMPO"
  value={getState('tempo-slider').value ?? 64}
  highlighted={isHighlighted('tempo-slider')}
/>

// wheel
<Wheel
  id="jog-wheel"
  label="Jog wheel"
  highlighted={isHighlighted('jog-wheel')}
/>

// pad
<PadButton
  id="hot-cue-a"
  label="A"
  active={getState('hot-cue-a').active}
  highlighted={isHighlighted('hot-cue-a')}
  onClick={() => onButtonClick?.('hot-cue-a')}
/>

// encoder
<ValueDial
  id="rotary-selector"
  label="Rotary selector"
  highlighted={isHighlighted('rotary-selector')}
/>

// switch/lever
<Lever
  id="direction-lever"
  label="FWD/REV"
  highlighted={isHighlighted('direction-lever')}
/>

// screen/display → placeholder div
<div
  data-control-id="touch-display"
  className="bg-gray-900 rounded border border-gray-700 flex items-center justify-center text-xs text-gray-500"
  style={{ minHeight: 120, minWidth: 200 }}
>
  Touch Display
</div>
```

**Root panel component anatomy:**
```tsx
'use client';

import { PanelState } from '@/types/panel';
import BrowseBarSection from './sections/BrowseBarSection';
// ... all section imports

interface CDJ3000PanelProps {
  panelState: PanelState;
  displayState?: any;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function CDJ3000Panel({
  panelState,
  highlightedControls,
  onButtonClick,
}: CDJ3000PanelProps) {
  return (
    <div
      className="relative"
      style={{
        width: panelWidth,
        height: panelHeight,
        backgroundColor: '#1a1a1a',
      }}
    >
      {/* Each section positioned absolutely using panelBoundingBox */}
      <div style={{ position: 'absolute', left: '12%', top: '0%', width: '68%', height: '4%' }}>
        <BrowseBarSection
          panelState={panelState}
          highlightedControls={highlightedControls}
          onButtonClick={onButtonClick}
        />
      </div>
      {/* ... repeat for all 12 sections */}
    </div>
  );
}
```

**Constants file anatomy:**
```ts
export const CDJ3000_PANEL = {
  width: 1200,   // from --panel-width or default
  height: 800,   // from --panel-height or default
  deviceId: 'cdj-3000',
  deviceName: 'CDJ-3000',
  manufacturer: 'Pioneer DJ',
};

export const CDJ3000_CONTROLS = {
  'source-btn': { type: 'button', section: 'browse-bar', label: 'SOURCE' },
  // ... all 61 controls
} as const;
```

**Step 2: Run codegen against CDJ-3000**

```bash
npx tsx scripts/panel-codegen.ts cdj-3000
```

Expected: 12 section files + 1 panel file + 1 constants file created, device registry updated.

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

**Step 4: Verify build**

```bash
npm run build
```

Expected: successful build.

**Step 5: Commit**

```bash
git add scripts/panel-codegen.ts src/components/devices/cdj-3000/ src/lib/devices/cdj-3000-constants.ts src/lib/deviceRegistry.ts
git commit -m "feat: deterministic panel codegen — generates React components from manifest"
```

---

## Task 2: Install Editor Dependencies

**Step 1: Install react-rnd**

```bash
npm install react-rnd
```

**Step 2: Verify install**

```bash
npm ls react-rnd
```

Expected: react-rnd in dependency tree.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add react-rnd for visual layout editor drag/resize"
```

---

## Task 3: Editor Zustand Store

**Files:**
- Create: `src/components/panel-editor/store/index.ts`
- Create: `src/components/panel-editor/store/canvasSlice.ts`
- Create: `src/components/panel-editor/store/manifestSlice.ts`
- Create: `src/components/panel-editor/store/historySlice.ts`

**Reference files:**
- `src/store/pipelineStore.ts` (existing Zustand pattern)
- `.pipeline/cdj-3000/manifest.json` (manifest structure)

**Step 1: Create canvasSlice**

State: `zoom` (default 1), `panX` (default 0), `panY` (default 0), `snapGrid` (4|8|16|32, default 8), `showGrid` (boolean), `showPhoto` (boolean), `photoOpacity` (0-1, default 0.3).

Actions: `setZoom`, `setPan`, `setSnapGrid`, `toggleGrid`, `togglePhoto`, `setPhotoOpacity`.

**Step 2: Create manifestSlice**

Flat data model — controls stored as `Record<controlId, ControlDef>`, sections as `Record<sectionId, SectionDef>`:

```ts
interface ControlDef {
  id: string;
  label: string;
  type: string;
  x: number; y: number; w: number; h: number;
  sectionId: string;
  labelPosition: 'above' | 'below' | 'left' | 'right' | 'on-button';
  locked: boolean;
  secondaryLabel?: string;
}

interface SectionDef {
  id: string;
  headerLabel: string | null;
  archetype: string;
  x: number; y: number; w: number; h: number;
  childIds: string[];
}
```

State: `sections`, `controls`, `selectedIds: Set<string>`, `lockedIds: Set<string>`, `deviceId: string`.

Actions: `loadFromManifest(manifest)` (converts MasterManifest → flat model), `moveControl(id, dx, dy)`, `resizeControl(id, w, h)`, `moveSection(id, dx, dy)`, `resizeSection(id, w, h)`, `moveSelectedControls(dx, dy)`, `updateControlProp(ids, field, value)`, `duplicateSelected()`, `deleteSelected()`, `toggleLock(id)`, `setSelectedIds(ids)`, `toggleSelected(id)`, `addControl(sectionId, type, label)`.

**Step 3: Create historySlice**

State: `past: ManifestSnapshot[]`, `future: ManifestSnapshot[]`.

Actions: `pushSnapshot()` (deep clones current sections/controls to past, clears future, caps at 100), `undo()`, `redo()`.

**Step 4: Create composed store**

```ts
import { create } from 'zustand';
// Compose slices into one store using Zustand slice pattern
```

**Step 5: Verify build**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/components/panel-editor/store/
git commit -m "feat: editor Zustand store — canvas, manifest, and history slices"
```

---

## Task 4: Editor Route + Shell Component

**Files:**
- Create: `src/app/admin/pipeline/[deviceId]/editor/page.tsx`
- Create: `src/components/panel-editor/PanelEditor.tsx`
- Create: `src/components/panel-editor/EditorToolbar.tsx`

**Reference files:**
- `src/app/admin/pipeline/[deviceId]/page.tsx` (existing route pattern)
- `src/app/admin/layout.tsx` (admin layout)

**Step 1: Create the route page**

Uses `useParams()` to get deviceId. Fetches manifest from `/api/pipeline/{deviceId}/manifest`. Passes to `<PanelEditor>`.

**Step 2: Create PanelEditor shell**

Layout: toolbar on top, workspace (canvas) in the center, properties panel on the right (288px).

```tsx
<div className="flex flex-col h-screen bg-[#0d0d1a]">
  <EditorToolbar />
  <div className="flex flex-1 overflow-hidden">
    <EditorWorkspace />      {/* flex-1 */}
    <PropertiesPanel />       {/* w-72 */}
  </div>
</div>
```

**Step 3: Create EditorToolbar**

Snap preset selector (dropdown: 4/8/16/32), zoom controls (+/-/reset), undo/redo buttons, grid toggle (G), photo toggle (P). All wired to canvasSlice.

**Step 4: Verify route loads**

```bash
npm run dev
# Navigate to /admin/pipeline/cdj-3000/editor
```

Expected: Empty editor shell with toolbar renders without errors.

**Step 5: Commit**

```bash
git add src/app/admin/pipeline/\[deviceId\]/editor/ src/components/panel-editor/PanelEditor.tsx src/components/panel-editor/EditorToolbar.tsx
git commit -m "feat: editor route and shell — toolbar, workspace, properties panel layout"
```

---

## Task 5: Canvas with Zoom/Pan

**Files:**
- Create: `src/components/panel-editor/EditorWorkspace.tsx`
- Create: `src/components/panel-editor/PanCanvas.tsx`
- Create: `src/components/panel-editor/hooks/useZoomPan.ts`

**Step 1: Create useZoomPan hook**

Handles:
- `onWheel` → zoom toward cursor position (min 0.1, max 5)
- `onPointerDown/Move/Up` on empty canvas → pan
- All coordinate math divides by zoom before writing to store

**Step 2: Create EditorWorkspace**

`overflow: hidden` container. Attaches zoom/pan events. Renders `<PanCanvas>` inside.

**Step 3: Create PanCanvas**

Applies CSS transform: `scale(zoom) translate(panX, panY)` with `transform-origin: 0 0`. Renders section frames + controls inside.

Initially, render sections as colored rectangles using panelBoundingBox coordinates from the manifest to verify positioning.

**Step 4: Verify zoom/pan works**

```bash
npm run dev
# Navigate to /admin/pipeline/cdj-3000/editor
# Scroll to zoom, drag to pan, see colored section rectangles
```

**Step 5: Commit**

```bash
git add src/components/panel-editor/EditorWorkspace.tsx src/components/panel-editor/PanCanvas.tsx src/components/panel-editor/hooks/useZoomPan.ts
git commit -m "feat: editor canvas with zoom/pan and section bounding box preview"
```

---

## Task 6: SectionFrame + ControlNode with Real Components

**Files:**
- Create: `src/components/panel-editor/SectionFrame.tsx`
- Create: `src/components/panel-editor/ControlNode.tsx`

**Reference files:**
- `src/components/controls/PanelButton.tsx` (props interface)
- `src/components/controls/Knob.tsx` (props interface)
- `src/components/controls/Slider.tsx` (props interface)
- All other control components

**Step 1: Create SectionFrame**

Wraps each section in `<Rnd>` (from react-rnd):
- Position from `section.x, section.y` (canvas coordinates)
- Size from `section.w, section.h`
- `dragGrid={[snapGrid, snapGrid]}`
- `resizeGrid={[snapGrid, snapGrid]}`
- On drag: dispatch `moveSection(id, dx/zoom, dy/zoom)` — divide by zoom!
- On resize: dispatch `resizeSection(id, w/zoom, h/zoom)`
- Visual: border on hover, section label, drag handle

**Step 2: Create ControlNode**

Wraps each control in `<Rnd>`:
- Position from `control.x, control.y` (absolute canvas coords)
- Bounded within parent section rect
- `dragGrid={[snapGrid, snapGrid]}`
- On drag: dispatch `moveControl(id, dx/zoom, dy/zoom)`
- Renders the REAL control component based on `control.type`:

```tsx
function renderControl(control: ControlDef) {
  const props = {
    id: control.id,
    label: control.label,
    highlighted: selectedIds.has(control.id),
  };

  switch (control.type) {
    case 'button': return <PanelButton {...props} />;
    case 'knob':   return <Knob {...props} />;
    case 'fader':
    case 'slider': return <Slider {...props} />;
    case 'led':
    case 'indicator': return <LEDIndicator {...props} />;
    case 'wheel':  return <Wheel {...props} />;
    case 'pad':    return <PadButton {...props} />;
    case 'encoder': return <ValueDial {...props} />;
    case 'switch':
    case 'lever':  return <Lever {...props} />;
    case 'screen':
    case 'display': return <div className="bg-gray-900 rounded border border-gray-700 flex items-center justify-center text-xs text-gray-500">{control.label}</div>;
    default: return <div>Unknown: {control.type}</div>;
  }
}
```

**Step 3: Wire into PanCanvas**

Map over sections → render SectionFrame for each. Within each SectionFrame, map over childIds → render ControlNode.

**Step 4: Verify real controls render and are draggable**

```bash
npm run dev
# Navigate to editor, see real Knobs/Buttons/Sliders
# Drag controls and sections, observe snap behavior
```

**Step 5: Commit**

```bash
git add src/components/panel-editor/SectionFrame.tsx src/components/panel-editor/ControlNode.tsx src/components/panel-editor/PanCanvas.tsx
git commit -m "feat: draggable section frames and control nodes with real components"
```

---

## Task 7: Properties Panel

**Files:**
- Create: `src/components/panel-editor/PropertiesPanel/index.tsx`
- Create: `src/components/panel-editor/PropertiesPanel/ControlTypeSelector.tsx`
- Create: `src/components/panel-editor/PropertiesPanel/LabelEditor.tsx`
- Create: `src/components/panel-editor/PropertiesPanel/GeometryFields.tsx`

**Step 1: Create PropertiesPanel index**

Right sidebar (w-72). Subscribes to `selectedIds` from store. Shows:
- Nothing selected → "Select a control or section"
- Single control → full property fields
- Multi-select → shared fields only, "Mixed" for differing values
- Section selected → section properties (archetype, size, position)

Clean, dark theme. Tooltips on all fields.

**Step 2: Create ControlTypeSelector**

Dropdown that shows **rendered thumbnails** of each control component, not just text names. Uses a small grid of mini-rendered components (PanelButton, Knob, Slider, etc.) as visual options. On select → `updateControlProp(selectedIds, 'type', newType)`.

**Step 3: Create LabelEditor**

- Text input for label
- Dropdown for labelPosition (above/below/left/right/on-button)
- "Add label" button when no label exists
- Secondary label field (optional)

**Step 4: Create GeometryFields**

- x, y, width, height number inputs
- Updates on change → `updateControlProp` or `resizeControl`

**Step 5: Verify properties panel updates controls**

```bash
npm run dev
# Click a control, see properties panel populate
# Change type, label, position — see control update on canvas
```

**Step 6: Commit**

```bash
git add src/components/panel-editor/PropertiesPanel/
git commit -m "feat: properties panel — type selector with visual glossary, label editor, geometry"
```

---

## Task 8: Grid Overlay + Photo Overlay

**Files:**
- Create: `src/components/panel-editor/GridOverlay.tsx`
- Create: `src/components/panel-editor/PhotoOverlay.tsx`

**Step 1: Create GridOverlay**

SVG-based grid that matches the current `snapGrid` setting. Renders as a pattern of lines at the snap interval. Toggled by `showGrid` from canvasSlice.

**Step 2: Create PhotoOverlay**

Fetches hardware photo from `/api/pipeline/{deviceId}/photos`. Renders as `<img>` behind the canvas content with `opacity` from `photoOpacity`. Toggleable via `showPhoto`.

**Step 3: Wire into PanCanvas**

GridOverlay and PhotoOverlay render inside PanCanvas, behind SectionFrames.

**Step 4: Verify**

```bash
npm run dev
# Toggle grid (G key), see grid lines
# Toggle photo (P key), see hardware photo, adjust opacity
```

**Step 5: Commit**

```bash
git add src/components/panel-editor/GridOverlay.tsx src/components/panel-editor/PhotoOverlay.tsx
git commit -m "feat: grid overlay with snap-matching lines + photo overlay with opacity"
```

---

## Task 9: Multi-Select + Lock + Inline Label Editing

**Files:**
- Create: `src/components/panel-editor/DragSelectRect.tsx`
- Modify: `src/components/panel-editor/ControlNode.tsx` (add lock icon, inline editing)

**Step 1: Create DragSelectRect**

Rubber-band selection on empty canvas area:
- `pointerdown` on canvas background starts the rect
- `pointermove` draws the rect
- `pointerup` computes intersecting controls, sets `selectedIds`
- Shift-click on a control dispatches `toggleSelected(id)`

**Step 2: Add lock functionality to ControlNode**

Locked controls show a lock icon overlay and reject drag events. Lock/unlock via `toggleLock(id)` action.

**Step 3: Add inline label editing to ControlNode**

Double-click on a control enters edit mode (component-local state). Renders an `<input>` overlay. On blur/Enter → `updateControlProp([id], 'label', value)`.

**Step 4: Add multi-select drag**

When dragging a selected control, all other selected (non-locked) controls move by the same delta.

**Step 5: Verify**

```bash
npm run dev
# Drag-select multiple controls, move them together
# Lock a control, verify it doesn't move
# Double-click a label, edit it inline
```

**Step 6: Commit**

```bash
git add src/components/panel-editor/DragSelectRect.tsx src/components/panel-editor/ControlNode.tsx
git commit -m "feat: multi-select, control locking, and inline label editing"
```

---

## Task 10: Keyboard Shortcuts + Context Menu

**Files:**
- Create: `src/components/panel-editor/hooks/useEditorKeyboard.ts`
- Create: `src/components/panel-editor/ContextMenu.tsx`

**Step 1: Create useEditorKeyboard hook**

Attaches to `document` keydown. Checks `document.activeElement` — suppresses when focus is in inline label input.

Shortcuts:
- `Cmd+Z` → undo
- `Cmd+Shift+Z` → redo
- `Backspace` / `Delete` → deleteSelected
- `Cmd+D` → duplicateSelected
- `Cmd+=` / `Cmd+-` → zoom in/out
- `G` → toggleGrid
- `P` → togglePhoto

**Step 2: Create ContextMenu**

Portal-rendered at root. Opens on right-click of a ControlNode. Menu items: Duplicate, Delete, Lock/Unlock, Change Type (submenu with visual glossary).

**Step 3: Wire into PanelEditor**

Mount `useEditorKeyboard` at PanelEditor level. ContextMenu at PanelEditor level (portal).

**Step 4: Verify**

```bash
npm run dev
# Cmd+Z undoes, Backspace deletes, G toggles grid
# Right-click a control, see context menu, click Duplicate
```

**Step 5: Commit**

```bash
git add src/components/panel-editor/hooks/useEditorKeyboard.ts src/components/panel-editor/ContextMenu.tsx src/components/panel-editor/PanelEditor.tsx
git commit -m "feat: keyboard shortcuts and right-click context menu"
```

---

## Task 11: Auto-Save + Undo Persistence

**Files:**
- Create: `src/components/panel-editor/hooks/useAutoSave.ts`
- Modify: `src/components/panel-editor/store/historySlice.ts` (persistence)

**Reference files:**
- `src/app/api/pipeline/[deviceId]/manifest/route.ts` (needs PUT handler if not exists)

**Step 1: Create useAutoSave hook**

Zustand subscriber (not a React effect) watches manifestSlice for changes. Debounces 800ms. Calls `PUT /api/pipeline/{deviceId}/manifest` with the current manifest state converted back to MasterManifest format.

**Step 2: Add PUT handler to manifest API route**

If the manifest route only has GET, add PUT to write the updated manifest back to `.pipeline/{deviceId}/manifest.json`.

**Step 3: Add undo persistence to historySlice**

On every `pushSnapshot()`, also write the undo stack to `.pipeline/{deviceId}/edit-history.json` (debounced separately, 2s).

On store init (`loadFromManifest`), attempt to load edit-history.json and restore the `past` array.

**Step 4: Verify**

```bash
npm run dev
# Edit a control position, wait 800ms, verify manifest.json updated
# Refresh browser, verify edits persisted
# Cmd+Z after refresh, verify undo works across sessions
```

**Step 5: Commit**

```bash
git add src/components/panel-editor/hooks/useAutoSave.ts src/components/panel-editor/store/historySlice.ts src/app/api/pipeline/\[deviceId\]/manifest/
git commit -m "feat: auto-save to manifest + persistent undo history"
```

---

## Task 12: Codegen Validation Step

**Files:**
- Modify: `src/components/panel-editor/PanelEditor.tsx` (add Approve button + preview mode)

**Step 1: Add "Approve & Build" button to toolbar**

When clicked:
1. Saves current manifest (force, not debounced)
2. Calls codegen API endpoint or runs codegen script
3. Switches editor to read-only preview mode showing the GENERATED panel component

**Step 2: Add read-only preview mode**

Renders the generated panel component (dynamically imported from `src/components/devices/{deviceId}/`) side-by-side or full-screen. No drag handles, no properties panel. Just the final output.

**Step 3: Add "Looks Good" / "Back to Editor" buttons**

"Looks Good" → marks pipeline phase complete. "Back to Editor" → returns to edit mode.

**Step 4: Verify**

```bash
npm run dev
# Make edits, click "Approve & Build"
# See generated panel render in preview mode
# Click "Back to Editor" to return, or "Looks Good" to finalize
```

**Step 5: Commit**

```bash
git add src/components/panel-editor/PanelEditor.tsx
git commit -m "feat: codegen validation — approve, build, preview generated panel"
```

---

## Task 13: Polish + Tooltips

**Files:**
- Modify: various editor components

**Step 1: Add tooltips to all toolbar buttons**

Show keyboard shortcut alongside the action name (e.g., "Toggle Grid (G)").

**Step 2: Improve visual glossary thumbnails**

Render actual mini components in the type selector at 50% scale. Add labels below each thumbnail.

**Step 3: Polish properties panel**

Clean spacing, consistent input styles, subtle section dividers, proper dark theme colors.

**Step 4: Add cursor changes**

- Default → arrow
- Over control → move cursor
- Over resize handle → resize cursors (nwse, nesw, etc.)
- Over empty canvas → grab cursor (for pan)

**Step 5: Verify all UX feels smooth**

```bash
npm run dev
# Full workflow: load editor, drag controls, edit labels, change types, approve
```

**Step 6: Commit**

```bash
git add src/components/panel-editor/
git commit -m "polish: tooltips, cursor changes, visual glossary, properties panel refinements"
```

---

## Task 14: Integration Test — Full CDJ-3000 Flow

**Step 1: Run the full flow**

```bash
# 1. Generate initial panel from manifest
npx tsx scripts/panel-codegen.ts cdj-3000

# 2. Verify build
npm run build

# 3. Start dev server
npm run dev

# 4. Open editor at /admin/pipeline/cdj-3000/editor
# 5. Verify all 61 controls render as real components
# 6. Drag some controls, verify snap works
# 7. Edit labels inline
# 8. Change a control type
# 9. Toggle photo overlay
# 10. Close browser, reopen — verify edits persisted
# 11. Click "Approve & Build" — verify generated panel matches
```

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: panel codegen + visual layout editor — complete implementation"
```

---

## Summary — File Map

| File | Status | Task |
|---|---|---|
| `scripts/panel-codegen.ts` | CREATE | 1 |
| `src/components/devices/cdj-3000/*.tsx` | GENERATED | 1 |
| `src/lib/devices/cdj-3000-constants.ts` | GENERATED | 1 |
| `src/lib/deviceRegistry.ts` | MODIFY | 1 |
| `src/components/panel-editor/store/canvasSlice.ts` | CREATE | 3 |
| `src/components/panel-editor/store/manifestSlice.ts` | CREATE | 3 |
| `src/components/panel-editor/store/historySlice.ts` | CREATE | 3 |
| `src/components/panel-editor/store/index.ts` | CREATE | 3 |
| `src/app/admin/pipeline/[deviceId]/editor/page.tsx` | CREATE | 4 |
| `src/components/panel-editor/PanelEditor.tsx` | CREATE | 4 |
| `src/components/panel-editor/EditorToolbar.tsx` | CREATE | 4 |
| `src/components/panel-editor/EditorWorkspace.tsx` | CREATE | 5 |
| `src/components/panel-editor/PanCanvas.tsx` | CREATE | 5 |
| `src/components/panel-editor/hooks/useZoomPan.ts` | CREATE | 5 |
| `src/components/panel-editor/SectionFrame.tsx` | CREATE | 6 |
| `src/components/panel-editor/ControlNode.tsx` | CREATE | 6 |
| `src/components/panel-editor/PropertiesPanel/index.tsx` | CREATE | 7 |
| `src/components/panel-editor/PropertiesPanel/ControlTypeSelector.tsx` | CREATE | 7 |
| `src/components/panel-editor/PropertiesPanel/LabelEditor.tsx` | CREATE | 7 |
| `src/components/panel-editor/PropertiesPanel/GeometryFields.tsx` | CREATE | 7 |
| `src/components/panel-editor/GridOverlay.tsx` | CREATE | 8 |
| `src/components/panel-editor/PhotoOverlay.tsx` | CREATE | 8 |
| `src/components/panel-editor/DragSelectRect.tsx` | CREATE | 9 |
| `src/components/panel-editor/hooks/useEditorKeyboard.ts` | CREATE | 10 |
| `src/components/panel-editor/ContextMenu.tsx` | CREATE | 10 |
| `src/components/panel-editor/hooks/useAutoSave.ts` | CREATE | 11 |

## Branch

Work on: `feature/pipeline-architecture-upgrade` (targets `test`)
