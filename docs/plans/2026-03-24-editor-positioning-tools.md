# Editor Positioning Tools Plan

**Goal:** Make it easy for the contractor to position controls on the hardware photo by scaling controls down to match photo proportions, with tools for efficient multi-control editing.

---

## Feature 1: Global Control Scale Slider

Controls in the editor are rendered at full component size (e.g., 80x48px buttons) but the same buttons in the hardware photo are 20x15px at the photo's resolution. Controls are 3-4x bigger than what they cover, making precise positioning against the photo impossible.

**Solution:** A "Control Scale" slider in the toolbar (0-100%, default 100%).

- **Positioning mode (30-50%):** Controls shrink to match the photo proportions. The contractor aligns them to the photo.
- **Preview mode (100%):** Controls render at full size to see how the final panel will look.
- The scale slider changes the visual rendering size of controls in the editor ONLY. It does NOT change the stored w/h values in the manifest. Codegen always uses the original sizes.
- The Keyboard component should also be affected by this scale slider.

**Implementation:**
- Add `controlScale: number` (0-1) to canvasSlice store (default: 1.0)
- Add slider to EditorToolbar: "Scale: [----====] 50%"
- ControlNode renders at `width * controlScale`, `height * controlScale`
- Control positions (x, y) stay the same — only size changes
- react-rnd `size` prop uses scaled dimensions; drag/resize handlers convert back to unscaled

**Keyboard shortcut:** `[` to decrease scale by 10%, `]` to increase by 10%

---

## Feature 2: Individual Control Resize

The contractor should be able to resize any individual control by dragging its corner handles.

**Current state:** `enableResizing={!isLocked}` exists in ControlNode but may not be fully functional. The resize handles might be too small or the `onResizeStop` handler might not persist.

**What to verify/fix:**
- Resize handles are visible (blue dots at corners) when a control is selected
- Dragging a handle updates the control's w/h in the store
- Resize persists (auto-save captures the new size)
- Minimum size constraints (don't shrink below 16x16px)

---

## Feature 3: Drag-Select Rectangle (verify existing)

**Current state:** `DragSelectRect.tsx` exists in the editor. Verify it works:
- Draw a rectangle on the canvas to select all controls within it
- Selected controls highlighted with blue outline
- Can then drag the group

**What to verify:**
- Rectangle selection actually selects controls (not just draws a visual rect)
- Works when controls are in different sections
- Works with the control scale slider (if controls are scaled down)

---

## Feature 4: Multi-Select Move (verify existing)

**Current state:** `moveSelectedControls` exists in manifestSlice.ts and ControlNode checks `isMultiSelected` for group drag.

**What to verify:**
- Shift+click adds controls to selection
- Dragging any control in a multi-selection moves ALL selected controls
- Relative positions maintained during group drag
- Works across sections (controls from different sections can be selected and moved together)

---

## Feature 5: Control Opacity in Positioning Mode

When controls are scaled down and overlaid on the photo, they should be semi-transparent so the photo shows through.

**Implementation:**
- When `controlScale < 1.0`, apply `opacity: 0.7` to controls
- When a control is selected, bring its opacity to 1.0 (so you can see what you're editing)
- When `controlScale === 1.0` (full size), all controls are fully opaque

---

## Feature 6: Align Tools (future — not for immediate implementation)

Select multiple controls, click alignment buttons:
- Align left edges
- Align top edges
- Align right edges
- Align bottom edges
- Distribute horizontally (equal spacing)
- Distribute vertically (equal spacing)

These would go in the toolbar or a floating tools panel. Defer until the basic positioning workflow is solid.

---

## Implementation Order

1. **Verify existing features** (resize, drag-select, multi-select move) — fix what's broken
2. **Global control scale slider** — the biggest impact feature
3. **Control opacity in positioning mode** — small addition tied to the scale slider
4. **Align tools** — defer to later

---

## What This Does NOT Change

- Manifest stored values (w/h) — scale is visual only in editor
- Codegen output — always uses original sizes
- Generated panel — always renders at full component size
- Photo overlay — already exists, just works better when controls are scaled down
