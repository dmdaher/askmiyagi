# Keyboard Section Editor UX

**Goal:** Contractor can position, resize, and adjust the keyboard directly in the editor by dragging — no number inputs, no properties panel, no code. The keyboard behaves as a special draggable/resizable section.

---

## Current State

- Keyboard renders as a non-editable overlay in PanCanvas
- Position controlled by `leftPercent` and `widthPercent` in the keyboard config
- `panelHeightPercent` controls the panel/keyboard boundary
- Contractor can only adjust via number inputs in the properties panel (when nothing selected)
- No drag, no resize, no visual handles

## Design

### The Keyboard as a Special Section

The keyboard appears in the editor as a **draggable, resizable element** below the panel controls. It has:

1. **Full drag (horizontal + vertical)** — grab the keyboard and drag it anywhere. Updates `leftPercent` and `panelHeightPercent`. The contractor decides where the keyboard sits — not locked to any axis.
2. **Horizontal resize** — drag left or right edge to widen/narrow. Updates `leftPercent` and `widthPercent`.
3. **Visual boundary line** — a dashed horizontal line at the top edge of the keyboard showing where the panel/keyboard split is. Informational only, not a constraint.
4. **No vertical lock** — the keyboard can be dragged up (overlapping controls if needed) or down (leaving space). The contractor decides the right position by looking at the hardware photo overlay.

### Interaction Details

**Full drag:**
- Grab anywhere on the keyboard body and drag freely (both axes)
- Updates `leftPercent` (horizontal) and `panelHeightPercent` (vertical — where the keyboard top edge sits)
- Snaps to grid (same snap as controls)
- Clamp: left 0-50%, top 20-90% of canvas height
- The contractor positions the keyboard by dragging it until it matches the hardware photo

**Horizontal resize:**
- Handles on left and right edges of the keyboard
- Drag left edge → changes `leftPercent` and `widthPercent`
- Drag right edge → changes only `widthPercent`
- Minimum width: 50% of canvas (prevents tiny keyboards)
- Keys re-render at the new width (they're flex-based, so they auto-adjust)

**Why no vertical lock:**
- The `panelHeightPercent: 35` from the manifest is the gatekeeper's estimate. It's often wrong (as seen in the Fantom-06 where controls overlap the keyboard). The contractor needs to drag the keyboard down until it clears all controls, matching the real hardware proportions from the photo overlay.

**Visual design:**
- Keyboard section has a subtle border/highlight when hovered
- Drag handles visible on hover (same style as SectionFrame resize handles)
- Boundary line: dashed, semi-transparent, with label "Panel ↕ Keyboard"
- Keyboard keys render inside the section with correct aspect ratio

### Implementation

**Component: `KeyboardSection.tsx`**
- New component in `src/components/panel-editor/`
- Uses `react-rnd` (same as SectionFrame and ControlNode)
- Position: absolute, below all control sections
- Size: computed from `keyboard.leftPercent`, `keyboard.widthPercent`, `keyboard.panelHeightPercent`

**Props from store:**
```tsx
const keyboard = useEditorStore((s) => s.keyboard);
```

**Drag handlers:**
```tsx
onDragStop: (e, d) => {
  // Only allow horizontal movement
  const newLeftPct = (d.x / canvasWidth) * 100;
  updateKeyboard({ leftPercent: clamp(newLeftPct, 0, 50) });
}

onResizeStop: (e, dir, ref, delta, pos) => {
  // Compute new leftPercent and widthPercent from the resized rect
  const newLeftPct = (pos.x / canvasWidth) * 100;
  const newWidthPct = (parseInt(ref.style.width) / canvasWidth) * 100;
  updateKeyboard({ leftPercent: newLeftPct, widthPercent: newWidthPct });
}
```

**Boundary drag:**
- A separate handle element at the top edge of the keyboard
- On drag, updates `panelHeightPercent`
- This is the most impactful interaction — changing where the boundary is changes how much vertical space controls have

**Store action:**
```tsx
updateKeyboard: (updates: Partial<KeyboardConfig>) => {
  const current = get().keyboard;
  if (!current) return;
  set({ keyboard: { ...current, ...updates } });
}
```

**Auto-save:**
- Keyboard changes trigger `hasUserEdited` (via pushSnapshot before update)
- Auto-save includes keyboard config in the manifest-editor.json

### Files to Create/Modify

- Create: `src/components/panel-editor/KeyboardSection.tsx` — new draggable/resizable keyboard component
- Modify: `src/components/panel-editor/PanCanvas.tsx` — replace the current keyboard overlay div with `<KeyboardSection>`
- Modify: `src/components/panel-editor/store/manifestSlice.ts` — add `updateKeyboard` action
- Modify: `src/components/panel-editor/PropertiesPanel/index.tsx` — remove the keyboard number inputs from EmptyStatePanel (replaced by direct drag)

### What Stays the Same

- Keyboard component (`src/components/controls/Keyboard.tsx`) — unchanged, renders keys
- PanelShell keyboard rendering — unchanged, uses the same keyboard config
- Codegen keyboard prop — unchanged
- Manifest keyboard field format — unchanged (keys, startNote, panelHeightPercent, leftPercent, widthPercent)

### Edge Cases

- Instrument with no keyboard (CDJ-3000): no KeyboardSection rendered
- Contractor drags keyboard completely off-screen: clamp to valid range
- Contractor makes keyboard too narrow: minimum 50% width
- Contractor drags boundary to extreme: clamp to 20-80%
- Controls overlap keyboard area: allowed (contractor's choice), but visual warning line shows the boundary
