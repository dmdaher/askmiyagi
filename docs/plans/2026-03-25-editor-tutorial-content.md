# Editor Tutorial Content — Complete Feature Reference

> This document catalogs every feature, shortcut, and interaction available in the panel editor. Use this as the source of truth for the onboarding tutorial (Task 14) and contractor documentation.

---

## Canvas Navigation

| Action | How | Notes |
|---|---|---|
| Zoom in | `Cmd/Ctrl + =` or toolbar `+` button | Up to 500% |
| Zoom out | `Cmd/Ctrl + -` or toolbar `-` button | Down to 10% |
| Reset zoom | Toolbar "Reset" button | Returns to 100% |
| Pan canvas | Scroll / trackpad drag on empty canvas area | Moves the viewport |

---

## Control Interactions

| Action | How | Notes |
|---|---|---|
| Select control | Click on it | Blue outline appears, properties panel shows |
| Multi-select (additive) | Shift + click | Adds to current selection |
| Multi-select (rectangle) | Click + drag on empty canvas | Rubber band selection |
| Deselect all | Click empty canvas area or press `Escape` | Clears selection |
| Move control | Drag selected control | Snaps to grid |
| Move multiple | Select multiple, then drag any one | All move together maintaining relative positions |
| Resize control | Drag corner handles (blue dots) when selected | Changes container size, component stays fixed (use sizeClass for component size) |
| Delete control | Select, then `Backspace` or `Delete` | Removes from canvas |
| Duplicate control | Select, then `Cmd/Ctrl + D` | Creates copy offset from original |
| Lock control | Right-click → Lock (or toggle in properties) | Prevents accidental moves |

---

## Section Interactions

| Action | How | Notes |
|---|---|---|
| Move section | Grab the section drag handle (header bar with ⋮⋮ icon and section name) | Moves section + all child controls together |
| Resize section | Drag section edge handles | Changes section bounding box |
| Select section | Click the drag handle | Section highlights, shows section properties |

**Important:** Sections are visual groups only — controls can be dragged freely across section boundaries. Sections don't constrain positioning.

---

## Keyboard (Instruments with keys)

| Action | How | Notes |
|---|---|---|
| Move keyboard | Drag the keyboard anywhere | Both horizontal and vertical |
| Resize width | Drag left or right edge of keyboard | Widens or narrows |
| Resize height | Drag top or bottom edge | Makes keys taller or shorter |
| Adjust via inputs | Properties panel → Keyboard section (when nothing selected) | Left offset % and Width % |

---

## Control Scale (Positioning Mode)

| Action | How | Notes |
|---|---|---|
| Scale controls down | Toolbar "Scale" slider (30-100%) | Shrinks all controls for photo alignment |
| Scale up to full size | Slide to 100% | See actual panel proportions |
| Quick decrease | `[` key | -10% per press |
| Quick increase | `]` key | +10% per press |

**Workflow:** Scale down to ~40% → turn on Photo overlay → position controls to match the photo → scale back to 100% to verify proportions.

---

## Photo Overlay

| Action | How | Notes |
|---|---|---|
| Toggle photo | `P` key or toolbar "Photo" button | Shows/hides hardware reference photo |
| Adjust opacity | Toolbar opacity slider (when photo is on) | Make photo more/less visible |
| Photo mode | Toolbar dropdown: Overlay or Side-by-side | Overlay puts photo under controls, side-by-side shows it next to canvas |

---

## Panels

| Action | How | Notes |
|---|---|---|
| Toggle layers panel | `L` key or click the arrow on collapsed panel | Shows/hides section + control hierarchy |
| Toggle properties panel | Click collapse arrow on panel header | Shows/hides when a control is selected |
| Expand section in layers | Click triangle next to section name | Shows child controls |
| Click control in layers | Selects it on canvas and scrolls to it | Works both ways — selecting on canvas highlights in layers |

---

## Grid

| Action | How | Notes |
|---|---|---|
| Toggle grid | `G` key or toolbar "Grid" button | Shows/hides alignment grid |
| Change grid size | Toolbar "Snap" dropdown (4px, 8px, 16px, 32px) | Controls snap to this grid when dragged |

---

## Undo / Redo

| Action | How | Notes |
|---|---|---|
| Undo | `Cmd/Ctrl + Z` | Reverts last action |
| Redo | `Cmd/Ctrl + Shift + Z` | Reapplies undone action |
| Undo via toolbar | "Undo" button | Same as shortcut |
| Redo via toolbar | "Redo" button | Same as shortcut |

Undo history is saved to localStorage — survives page refreshes for the same instrument.

---

## Properties Panel (when a control is selected)

| Property | What it does | Options |
|---|---|---|
| Type | Control type | button, knob, slider, pad, encoder, wheel, led, port, screen, display |
| Label | Display text | Free text |
| Label Position | Where label appears | above, below, on-button, icon-only, hidden |
| Shape | Visual shape | rectangle, circle, square |
| Size Class | Component size | xs, sm, md, lg, xl |
| Surface Color | Accent/ring color | Hex color picker |
| Button Style | Physical style | flat-key, transport, rubber, raised |
| Has LED | Shows LED indicator | Toggle |
| LED Color | LED color | Hex color picker |
| Position (x, y) | Pixel coordinates on canvas | Number inputs |
| Size (w, h) | Container dimensions | Number inputs |

---

## Approve & Build Flow

| Step | What happens |
|---|---|
| 1. Click "Approve & Build" | Saves current positions, runs geometry cleanup (snap alignment) |
| 2. Inference Review modal | Shows detected section archetypes with override options |
| 3. Click "Generate" | Triggers codegen — generates production React panel from positions |
| 4. Preview mode | Shows the generated panel in the editor |
| 5. "Looks Good" | Marks panel as approved, registers in device registry |
| 6. "Back to Editor" | Returns to editing if not satisfied |

---

## Keyboard Shortcuts Reference

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + D` | Duplicate selected |
| `Cmd/Ctrl + =` | Zoom in |
| `Cmd/Ctrl + -` | Zoom out |
| `Backspace` / `Delete` | Delete selected |
| `Escape` | Deselect all |
| `G` | Toggle grid |
| `P` | Toggle photo overlay |
| `L` | Toggle layers panel |
| `[` | Decrease control scale 10% |
| `]` | Increase control scale 10% |

---

## Auto-Save Behavior

- Editor auto-saves to `manifest-editor.json` after every user interaction (debounced 800ms)
- Only saves after actual user edits (drag, resize, property change) — not on initial load
- Includes canvas dimensions and manifest version for staleness detection
- Undo history saved to localStorage (persists across refreshes)

---

## What the Contractor Should Know

1. **Use the Photo overlay** — toggle with `P`, scale controls down with `[` to match photo proportions
2. **Sections are just visual groups** — drag controls anywhere, ignore section boundaries
3. **Use sizeClass for component size** — don't try to resize individual buttons, change sizeClass in properties (xs/sm/md/lg/xl)
4. **Scale slider for positioning** — shrink to 30-40% for precise placement on the photo, back to 100% to check proportions
5. **Save is automatic** — your work is saved as you edit, no manual save needed
6. **Keyboard for quick navigation** — `L` layers, `P` photo, `G` grid, `[`/`]` scale
7. **Approve & Build when done** — generates the final panel from your positions
