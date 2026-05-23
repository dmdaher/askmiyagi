# Panel Editor — High-Fidelity Visual Editor Spec

## Overview
A new "Panel" tab in the admin pipeline UI that renders instrument controls as realistic-looking components and allows direct manipulation. Reads from the same manifest as the Layout tab but renders with visual fidelity instead of wireframes.

## Two editors, one manifest
- **Layout tab** (existing): wireframe blueprint editor — colored boxes, structure-focused, great for understanding archetype/container/zone relationships
- **Panel tab** (new): high-fidelity visual editor — realistic knobs, faders, buttons, LEDs. Looks like the actual instrument. Edit by direct manipulation.

Both read/write the same `manifest.json`. Changes in either tab reflect in the other.

## Visual Rendering

### Control components by type
| Type | Rendering |
|------|-----------|
| button | Rounded rectangle, silkscreen label, press state indicator |
| knob | Circular with indicator line, label below |
| fader/slider | Vertical/horizontal track with slider cap, label |
| encoder | Circular with detent marks, label |
| led | Small circle with glow effect, color from manifest |
| screen | Rounded rectangle with dark fill, "display" text |
| wheel | Large circle (jog wheel), ring illumination |
| pad | Square with rounded corners, backlit color |
| switch | Toggle lever, position indicator |

### Panel surface
- Dark matte background (#1a1a1a) simulating hardware surface
- Section boundaries as subtle lines
- Silkscreen text labels at correct positions
- Panel dimensions from panelBoundingBox data

## Photo Reference (same as Layout tab)
- **Overlay mode**: hardware photo at adjustable opacity behind the rendered panel
- **Side-by-side mode**: photo on left (fixed 40%), panel on right
- **Section highlight**: hover/click a control → highlight on photo at panelCentroid
- **Per-control highlight**: red dot on photo at exact control position from blueprint

## Direct Manipulation

### Click to select
- Click any control → selects it, properties panel opens on right
- Selected control shows resize handles and blue outline
- Click empty space → deselect

### Drag to move
- Drag a control within its section → reorders in the control list
- Drag a control between sections → reassigns to new section
- Drag between containers (cluster/anchor) → updates containerAssignment
- Snap to grid (5% increments) for precise alignment

### Drag to resize sections
- Section edges have resize handles
- Dragging edge updates panelBoundingBox.w or .h
- Adjacent sections adjust proportionally

### Context menu (right-click)
- Move to → list of sections/containers
- Change type → button/knob/fader/led/etc.
- Split container → creates left/right sub-zones
- Delete control
- Duplicate control

## Properties Panel (right sidebar)
Same as Layout tab but with additions:
- **Visual properties**: size (sm/md/lg), color, LED color, label position (above/on/below)
- **All Layout tab controls**: archetype, width, height, position, grid rows/cols, height splits, container zones, direction toggles, reorder arrows
- **Control-specific**: for faders — orientation (vertical/horizontal), travel range. For knobs — rotation range. For LEDs — color, on/off state.

## Toolbar
- Undo / Redo (keyboard: Cmd+Z / Cmd+Shift+Z)
- Zoom (scroll or slider, 50%-200%)
- Pan (spacebar + drag)
- Toggle grid overlay
- Toggle photo overlay / side-by-side
- Show/hide section boundaries
- Show/hide control labels
- "Re-generate Templates" button
- "Save Manifest" button
- Review progress (8/13 sections reviewed)

## Keyboard shortcuts
- Delete/Backspace: delete selected control
- Cmd+Z: undo
- Cmd+Shift+Z: redo
- Arrow keys: nudge selected control by 1%
- Shift+Arrow: nudge by 5%
- Tab: select next control
- Escape: deselect

## Technical approach
- Single React component: `PanelEditor.tsx`
- Renders on a `<canvas>` or using positioned `<div>` elements
- Reads manifest from `/api/pipeline/{deviceId}/manifest`
- Reads blueprint from `/api/pipeline/{deviceId}/blueprint` (for panelCentroid)
- Reads photos from `/api/pipeline/{deviceId}/photos`
- Writes back to manifest on save
- Re-runs Layout Engine on "Re-generate Templates"

## Relationship to Panel Builder (Phase 1)
- The Panel Editor renders a GENERIC panel from the manifest — no agent-generated code needed
- The Panel Builder (Phase 1) generates the PRODUCTION React components (JSX/Tailwind)
- The Panel Editor is for review and correction BEFORE the Panel Builder runs
- After Phase 1, the Panel Editor could optionally render the actual agent-generated components instead of the generic renderer

## Priority order for implementation
1. Realistic control rendering (type → visual component)
2. Click to select + properties panel
3. Photo overlay/side-by-side (reuse from Layout tab)
4. Section highlight on photo
5. Drag to reorder within section
6. Drag between containers
7. Undo/redo
8. Keyboard shortcuts
9. Context menu
10. Drag to resize sections
11. Canvas zoom/pan
