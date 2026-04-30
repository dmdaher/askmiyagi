# Plan: Edge Rulers + Pipeline Reset Button

---

## Feature 1: Edge Rulers

### Context
The contractor needs visual rulers along the top and left edges of the editor canvas to see pixel coordinates and verify control alignment. Like Photoshop/Figma rulers — permanent numbered tick marks showing position.

### Layout
CSS grid inside EditorWorkspace — rulers sit OUTSIDE the zoom/pan transform:
```
┌──────────────┬──────────────────────────────────┐
│  20×20       │  HorizontalRuler (flex-1, 20px)  │
│  corner      │                                  │
├──────────────┼──────────────────────────────────┤
│ VerticalRuler│  PanCanvas scroll container       │
│ (20px wide)  │  (with transform: translate+scale)│
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

Canvas shifts right 20px and down 20px — no effect on persisted coordinates (canvas-space).

### Dimensions
| Property | Value | Reasoning |
|----------|-------|-----------|
| Ruler thickness | 20px | Fits 9px text + 10px ticks + 1px border |
| Major tick height | 10px | 50% of ruler thickness |
| Minor tick height | 5px | 25% |
| Mid tick height | 7px | 35% — at 50% of major interval |
| Min screen spacing between labels | 60px | Prevents label collision |

### Adaptive Tick Density
```
Base intervals (canvas-space): [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]

For each candidate interval I:
  screenSpacing = I * zoom
  if screenSpacing >= 60 → use this I as major interval

Minor ticks: 4 subdivisions between major ticks
Exception: if major interval is 5 or 50, use 5 subdivisions
```

Examples:
- zoom=0.5: major=200px canvas → 100px screen, 4 minor ticks at 40px canvas
- zoom=1.0: major=100px → 100px screen, 4 minor ticks at 20px canvas
- zoom=2.0: major=50px → 100px screen, 4 minor ticks at 10px canvas
- zoom=4.0: major=20px → 80px screen, 4 minor ticks at 4px canvas

Label format: plain integers ("100" not "100px").

### Visual Design (Dark Theme)
| Element | Style |
|---------|-------|
| Ruler background | `#0d0d1a` (matches toolbar/sidebar) |
| Canvas boundary | 1px `rgba(255,255,255,0.08)` border |
| Corner square | `#0a0a14` (dead zone, no interaction) |
| Major tick | `rgba(255,255,255,0.35)`, 1px wide |
| Minor tick | `rgba(255,255,255,0.15)`, 1px wide |
| Mid tick | `rgba(255,255,255,0.22)`, 1px wide |
| Label text | `rgba(255,255,255,0.45)`, 9px, monospace |
| Selection marker | `rgba(59,130,246,0.9)` (blue-500) |
| Selection span | `rgba(59,130,246,0.08)` fill between edges |

### Selected Control Marker
When control(s) selected, show on both rulers:
1. **Leading edge line**: 1px solid at X/Y position, blue-500 at 90% opacity
2. **Trailing edge line**: 1px solid at X+W/Y+H, blue-500 at 50% opacity
3. **Span highlight**: rect between lines, blue-500 at 8% opacity fill

For multi-select: show bounding box of all selected (not per-control markers).

Coordinates:
```
rulerLeadingX = x * zoom + panX
rulerTrailingX = (x + w * controlScale) * zoom + panX
```
Clamped to `[0, rulerLength]`.

### Interaction
- `pointer-events: none` — rulers don't intercept canvas clicks
- No drag-to-create-guide (deferred — too complex for contractor profile)
- Marker follows control position in real-time during drag

### Rendering: SVG
- Same pattern as existing GridOverlay.tsx
- Single `<svg>` with `<line>` and `<text>` children
- ~50-100 lines + 10-30 labels per ruler at any zoom
- Re-renders on zoom/pan change — well within React budget
- `React.memo` with comparator on `[zoom, pan, selectionBounds]` if needed

### Toggle
- Shortcut: `R` (available, matches G/P/L/T pattern)
- Default: off (opt-in)
- Independent from grid toggle
- Toolbar button next to Grid toggle

### Component API
```typescript
// src/components/panel-editor/Ruler.tsx
interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number;              // screen pixels
  zoom: number;
  pan: number;                 // panX or panY
  selectionMin?: number;       // canvas-space leading edge
  selectionMax?: number;       // canvas-space trailing edge
  thickness?: number;          // default 20
}
```
Pure function component — no store coupling. EditorWorkspace subscribes and passes props.

### Files to Modify
| File | Change |
|------|--------|
| `src/components/panel-editor/Ruler.tsx` (new) | SVG ruler component |
| `src/components/panel-editor/store/canvasSlice.ts` | Add `showRulers`, `toggleRulers` |
| `src/components/panel-editor/EditorWorkspace.tsx` | CSS grid layout, render rulers |
| `src/components/panel-editor/EditorToolbar.tsx` | Ruler toggle button |
| `src/components/panel-editor/hooks/useEditorKeyboard.ts` | `R` shortcut |
| `src/components/panel-editor/EditorHelpDrawer.tsx` | Document rulers |

### Caveats
- Side-by-side photo mode: rulers only on editor canvas half, not photo half
- Canvas area shifts right/down by 20px — verify no layout breaks with Layers/Properties panels

---

## Feature 2: Pipeline Reset Button (Admin UI)

### Context
The admin can't reset a pipeline back to the editor phase from the UI. The API exists (`POST /api/pipeline/{deviceId}/recover` with `action: 'reset-failed'`) but there's no button in the admin dashboard. The Minimoog pipeline went past the editor and needs resetting.

### Design
"Reset to Editor" button on the pipeline detail page (`/admin/[deviceId]`):
1. Only visible when pipeline is NOT `pending` or `completed`
2. Amber/warning color (not red — it's a reset, not a delete)
3. Confirm dialog: "Reset pipeline back to editor phase? The pipeline will pause at the layout engine stage so you can send to contractor."
4. Calls `POST /api/pipeline/{deviceId}/recover` with `{ action: 'reset-failed' }`
5. Pipeline resets to `paused` at layout engine phase
6. Page refreshes to show updated state

### Placement
In the pipeline detail header area, next to existing action buttons (Start, Restart, etc.).

### Files to Modify
| File | Change |
|------|--------|
| `src/components/admin/PipelineDetail.tsx` | Add reset button with confirm dialog |
| `src/app/admin/[deviceId]/page.tsx` | Wire API call if not in PipelineDetail |

No API changes — endpoint already exists and works.

### Verification
1. Pipeline past editor → "Reset to Editor" button visible
2. Click → confirm dialog
3. Confirm → API succeeds → status changes to paused
4. Page refreshes → shows paused at layout engine
5. Admin clicks "Send to Contractor" → works

---

## Status
Both features planned, not implemented. Pick up in a future session.

**To continue:** "Read `docs/plans/2026-04-29-ruler-and-pipeline-reset.md` and implement the ruler feature first, then the pipeline reset button."
