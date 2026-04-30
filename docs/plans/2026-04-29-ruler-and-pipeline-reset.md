# Plan: Edge Rulers + Pipeline Reset Button

## Feature 1: Edge Rulers

### Context
The contractor needs visual rulers along the top and left edges of the editor canvas to see pixel coordinates and verify control alignment. Like Photoshop/Illustrator rulers — permanent numbered tick marks showing position.

### Design
- **Top ruler**: horizontal, spans canvas width, shows X coordinates
- **Left ruler**: vertical, spans canvas height, shows Y coordinates
- Both show tick marks at regular intervals (every 50px or 100px depending on zoom)
- Tick marks labeled with canvas-space coordinates (not screen pixels)
- Rulers stay at 1:1 screen scale — they don't zoom with the canvas
- Toggle visibility with a toolbar button or keyboard shortcut

### DOM Placement
Rulers render OUTSIDE the PanCanvas zoom/pan transform, as siblings at the EditorWorkspace level:
```
EditorWorkspace container (relative)
  ├── Top ruler div (absolute, top: 0, height: ~20px)
  ├── Left ruler div (absolute, left: 0, width: ~20px)
  └── <div overflow-auto>
      └── PanCanvas (with transform: translate + scale)
```

### State
- Read `zoom`, `panX`, `panY` from canvas store
- Tick at canvas position X appears at screen position `X * zoom + panX`
- Labels show canvas coordinates (what the contractor cares about)
- Optionally highlight the snap grid interval on rulers

### Interaction
- Rulers are `pointer-events: none` — don't intercept canvas clicks
- When a control is selected, show a highlight marker on the rulers at the control's X/Y position
- When dragging, the marker follows in real-time

### Toggle
- Keyboard shortcut: `R` (not taken) or add to toolbar next to Grid toggle
- Store: add `showRulers: boolean` to canvasSlice

### Visual Style
- Background: slightly darker than canvas (`#0a0a14`)
- Tick marks: thin lines in `rgba(255,255,255,0.15)`
- Labels: `text-[8px] text-gray-600` at major intervals
- Selected control marker: blue line matching selection outline color

### Files to Modify
- `src/components/panel-editor/store/canvasSlice.ts` — add `showRulers` state + toggle
- `src/components/panel-editor/EditorWorkspace.tsx` — render ruler divs outside PanCanvas
- `src/components/panel-editor/RulerOverlay.tsx` (new) — ruler rendering component
- `src/components/panel-editor/EditorToolbar.tsx` — ruler toggle button
- `src/components/panel-editor/hooks/useEditorKeyboard.ts` — `R` shortcut
- `src/components/panel-editor/EditorHelpDrawer.tsx` — document rulers

---

## Feature 2: Pipeline Reset Button (Admin UI)

### Context
The admin can't reset a pipeline back to the editor phase from the UI. The API exists (`POST /api/pipeline/{deviceId}/recover` with `action: 'reset-failed'`) but there's no button in the admin dashboard. The Minimoog pipeline went past the editor and needs to be reset.

### Design
Add a "Reset to Editor" button on the pipeline detail page (`/admin/[deviceId]`). When clicked:
1. Confirm dialog: "Reset pipeline back to editor phase? This will pause the pipeline at the layout engine stage."
2. Call `POST /api/pipeline/{deviceId}/recover` with `{ action: 'reset-failed' }`
3. Pipeline state resets to `paused` at layout engine phase
4. Admin can then click "Send to Contractor" to push to Blob

### Where in the UI
- Pipeline detail page (`src/app/admin/[deviceId]/page.tsx`)
- In the header area next to existing action buttons
- Only show when pipeline status is NOT `pending` or `completed`
- Red/amber warning color to indicate it's a reset action

### Files to Modify
- `src/components/admin/PipelineDetail.tsx` — add reset button
- `src/app/admin/[deviceId]/page.tsx` — wire the API call
- No API changes needed — the endpoint already exists

### Verification
1. Pipeline is past editor phase → "Reset to Editor" button visible
2. Click button → confirm dialog appears
3. Confirm → API call succeeds → pipeline status changes to paused
4. Pipeline detail page refreshes → shows paused at layout engine
5. Admin can now click "Send to Contractor"

---

## Status
Both features planned, not implemented. Pick up in a future session.
