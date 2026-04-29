# Plan: Label Alignment + Mini Sections

## Status: FINAL — reviewed with UI/UX, frontend design, and component architecture skills

## Related Plans
- Themes/skins: `docs/plans/2026-04-27-themes-skins-design.md`
- Pre-tutorial blockers: `docs/plans/2026-04-26-pre-tutorial-blockers.md`

---

## Feature 1: On-Button Label Alignment + Color

**Priority: MEDIUM**

### Context
Buttons currently center all on-button text. Pads hardcode to bottom-right. No way to position label text at specific locations within the button face or control text color. CDJ-3000 has buttons with different text colors (BEAT SYNC = white, MASTER = amber, KEY SYNC = blue).

### Data Model
Add to `ControlDef` in `manifestSlice.ts`:
```typescript
labelAlign?: 'center' | 'top-left' | 'top-center' | 'top-right'
           | 'middle-left' | 'middle-right'
           | 'bottom-left' | 'bottom-center' | 'bottom-right';
labelColor?: string;  // hex color for on-button text
```
- Default `labelAlign`: `'center'` for buttons, `'bottom-right'` for pads (preserves current behavior)
- Default `labelColor`: `undefined` (uses current hardcoded gray-200)

### Properties Panel (inside LabelEditor.tsx)
When `labelPosition === 'on-button'` (except dual-label LEDs), show:
1. **3x3 dot picker** — 9 clickable dots in a 28x28px square grid, inline in LabelEditor (not a separate component). Active dot = blue-500. Same inline pattern as the rotation selector (4 buttons in a row).
2. **Color input** — 6 preset swatches + hex text input. No eyedropper, no full color picker.

Preset swatches:
- White `#e5e5e5`
- Light gray `#9ca3af`
- Amber `#f59e0b`
- Cyan `#22d3ee`
- Green `#22c55e`
- Red `#ef4444`

### Rendering
PanelButton and PadButton map `labelAlign` to CSS:
- `center` → `flex items-center justify-center` (current)
- `top-left` → `absolute top-1 left-1.5`
- `bottom-right` → `absolute bottom-1.5 right-2`
- etc.

`labelColor` overrides text color via inline `style={{ color: labelColor }}`.

**IMPORTANT:** Add `overflow: hidden` + `text-overflow: ellipsis` to on-button label span when `labelAlign !== 'center'` to prevent Containment Veto violations on narrow buttons.

Must work in both ControlNode (editor) and PanelRenderer (production).

### Files to Modify
- `src/components/panel-editor/store/manifestSlice.ts` — add `labelAlign`, `labelColor` to ControlDef
- `src/components/controls/PanelButton.tsx` — accept + render `labelAlign`, `labelColor`
- `src/components/controls/PadButton.tsx` — accept + render `labelAlign`, `labelColor`
- `src/components/panel-editor/ControlNode.tsx` — pass props
- `src/components/controls/PanelRenderer.tsx` — pass props + render
- `src/components/panel-editor/PropertiesPanel/LabelEditor.tsx` — 3x3 picker + color swatches (conditional on `on-button`)
- `src/components/panel-editor/PanCanvas.tsx` — include in storeToManifest
- `src/types/manifest.ts` — add to ManifestControl

---

## Feature 2: Mini Sections (Visual Control Containers)

**Priority: HIGH**

### Context
Real hardware has recessed/beveled containers grouping related controls (e.g., CDJ-3000's BEAT SYNC / MASTER / KEY SYNC cluster). Not full sections — visual grouping elements. Currently no way to represent this. Groups are logical (multi-select behavior) but invisible in production.

### Data Model
```typescript
interface ControlContainer {
  id: string;
  controlIds: string[];           // informational — no behavioral coupling
  style: 'recessed' | 'raised' | 'outlined' | 'filled';
  x: number; y: number; w: number; h: number;
  borderRadius?: number;          // default 4
  label?: string;                 // optional small text
}
```
Store as `controlContainers` on manifest state (alongside `controlGroups`).

### Key Design Decisions (from review)

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Creation method | **Two ways:** (1) Select 2+ controls → right-click → "Create Container" (auto-sizes to selection + 8px padding). (2) Right-click empty canvas → "Add Container" (creates default-sized empty container at click position). | Both are needed — sometimes contractor wants to lay out the box shape first from the reference photo, then drag controls into it. |
| Relationship to groups | **Fully independent** | Groups = behavioral (move together). Containers = visual (rendered box). Can coexist. |
| Positioning | **Absolute canvas coordinates** | Controls don't position relative to container. Same model as sections. |
| Auto-resize | **No** — offer "Fit to Contents" as explicit action | Contractor sets bounds intentionally. Auto-resize destroys that. |
| Z-index layer | **z=2 to z=4** | Above section backgrounds (z=1), below controls (z=5+). **NOT z=150** (that would hide controls). |
| Opacity field | **Removed** | Overengineered. Use semi-transparent hex in style presets if needed. |
| 4th preset | **`filled`** added | Flat colored rectangle, no bevel. Real hardware has both beveled and flat separations. |

### Style Presets
- **Recessed:** `background: rgba(0,0,0,0.15)`, `boxShadow: inset 0 2px 4px rgba(0,0,0,0.3)`, `borderRadius: 4px`, `border: 1px solid rgba(255,255,255,0.06)`
- **Raised:** `background: rgba(255,255,255,0.03)`, `boxShadow: 0 2px 6px rgba(0,0,0,0.3)`, `borderRadius: 4px`, `border: 1px solid rgba(255,255,255,0.08)`
- **Outlined:** `background: transparent`, `border: 1px solid rgba(255,255,255,0.12)`, `borderRadius: 4px`
- **Filled:** `background: rgba(0,0,0,0.1)`, `borderRadius: 4px`, no shadow, no border

### Editor Flow
**From controls:** Contractor selects 2+ controls → right-click → "Create Container" → auto-sizes to bounding box + 8px padding

**From empty canvas:** Right-click on empty space → "Add Container" → default 120x80 container at click position → contractor drags/resizes to match reference photo

**Both paths then:**
- Container is draggable/resizable independently of controls
- Properties panel shows: style preset (4 pills), optional label, border radius
- Delete via right-click or Properties panel (doesn't delete controls inside)
- `controlIds` is informational — populated automatically based on which controls are visually inside the container bounds

### Production Rendering (PanelRenderer)
Containers render as styled `div`s at z=2-4 (between section backgrounds and controls).

### Layers Panel
Containers appear in section's expanded view with a solid-rect icon (distinct from Group's dashed-rect). Click selects on canvas.

### Undo/Redo
Add `containers` to `ManifestSnapshot` in `historySlice.ts`. Every container mutation calls `pushSnapshot()` before mutating. Existing history mechanism handles it automatically.

### Files to Modify
- `src/components/panel-editor/store/manifestSlice.ts` — ControlContainer type, state, CRUD actions
- `src/components/panel-editor/store/historySlice.ts` — include in snapshots
- `src/components/panel-editor/PanCanvas.tsx` — render containers between sections and controls
- `src/components/panel-editor/ContainerNode.tsx` (new) — draggable/resizable in editor
- `src/components/controls/PanelRenderer.tsx` — render in production
- `src/components/panel-editor/ContextMenu.tsx` — "Create Container" item
- `src/components/panel-editor/PropertiesPanel/index.tsx` — container properties (style pills, label, radius)
- `src/components/panel-editor/LayersPanel.tsx` — show containers
- `src/components/panel-editor/hooks/useAutoSave.ts` — include in auto-save
- `src/types/manifest.ts` — add ControlContainer to manifest types

---

## Critical Fix: Export Route Whitelist

**Priority: CRITICAL** — pre-existing bug

### Problem
`export-manifest/route.ts` has a hardcoded 16-field whitelist (lines 65-69) that misses newer fields. Also, section export (line 52) drops `frameMode` — sections set to `header-only` or `hidden` revert to `full` after export.

### Fix: Control Fields
Add to the whitelist array at line 65:
```
'ledStyle', 'labelFontSize', 'zOrder', 'ledBehavior', 'labelAlign', 'labelColor'
```

### Fix: Section `frameMode`
Add `frameMode` to the section export at line 52:
```typescript
editorSections: (sectionList as any[]).map((s: any) => ({
  id: s.id,
  headerLabel: s.headerLabel ?? undefined,
  frameMode: s.frameMode,  // ADD THIS
  hidden: s.hidden,        // ADD THIS (legacy compat)
  x: s.x, y: s.y, w: s.w, h: s.h,
})),
```

### Fix: Include containers in export
Add `containers` array to the exported manifest object.

### File
`src/app/api/pipeline/[deviceId]/export-manifest/route.ts`

---

## Quick Fix: ledBlink Type

**Priority: LOW** — future-only, enables tutorial blinking later

Add to `ButtonState` in `src/types/panel.ts`:
```typescript
ledBlink?: boolean;  // FUTURE: CSS blink animation, not wired yet
```

This is **inert** until:
1. PanelRenderer passes `ledBlink` to control renderer
2. PanelButton/PanelRenderer adds CSS `@keyframes` blink animation
3. Tutorials set `ledBlink: true` in panelState

Document clearly that the field does nothing until render path is built.

---

## Help Drawer Updates (EditorHelpDrawer.tsx)

**REQUIRED:** The contractor needs documentation for every new feature. Update all three tabs.

### Guide Tab

**Add to "Properties Panel" section:**
- **Label Alignment** — When a control's label is set to "on-button", a 3x3 dot grid appears. Click any dot to position the label text within the button face: top-left, top-center, top-right, center (default), bottom-right, etc. Useful for pads where labels sit in corners.
- **Label Color** — Pick from 6 preset colors (white, gray, amber, cyan, green, red) or enter a custom hex value. Changes the on-button text color. Use this to match the real hardware's silk-screen printing colors.

**Add new "Containers" section:**
- **What containers are** — Visual boxes that group related controls, like the recessed rectangles on real hardware that hold button clusters. Containers are purely visual — they don't affect control behavior or grouping.
- **Creating a container** — Select 2+ controls and right-click → "Create Container". Or right-click on empty canvas → "Add Container" to create an empty one and resize it manually.
- **Container styles** — Four presets: Recessed (dark inset, like CDJ-3000 sync cluster), Raised (slight elevation), Outlined (thin border only), Filled (flat colored background).
- **Editing containers** — Click a container to select it. Properties panel shows style selector, optional label, and border radius. Drag to reposition, drag corners to resize.
- **Deleting containers** — Right-click → Delete, or use the Properties panel. Deleting a container does NOT delete the controls inside it.
- **Containers vs Groups** — Groups (Cmd+G) make controls move together. Containers add a visual box. They are independent — you can have a group without a container, a container without a group, or both on the same controls.

### Shortcuts Tab

No new keyboard shortcuts for containers (right-click only).

### Workflow Tab

**Add step after "Group related controls":**
- **Add visual containers** — If the reference photo shows controls inside a recessed or beveled rectangle, select those controls and right-click → "Create Container". Choose "Recessed" for dark inset boxes (most common on DJ hardware) or "Raised" for elevated sections. Adjust the container size to match the photo.

### File
`src/components/panel-editor/EditorHelpDrawer.tsx`

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Container at z=150 hides controls | CRITICAL | Use z=2-4 instead |
| `frameMode` dropped on export | CRITICAL | Add to section export whitelist |
| Non-center label overflows narrow button | MEDIUM | Add `overflow: hidden` + `text-overflow: ellipsis` |
| `labelAlign` in manifest but not rendered in PanelRenderer | MEDIUM | Wire into PanelRenderer.tsx render path |
| `ledBlink` mistaken for working feature | LOW | Add comment marking as future-only |

---

## Verification

1. Select button → set labelAlign to top-left → text moves to top-left corner
2. Set labelColor to amber → text color changes on canvas + preview
3. Select 3 controls → right-click → "Create Container" → beveled box appears
4. Change container style to raised/outlined/filled → visual changes
5. Export panel → verify `labelAlign`, `labelColor`, `ledStyle`, `frameMode` present in output JSON
6. Sections with `header-only` frameMode survive export correctly
7. Container renders in production PanelRenderer at correct z-layer (below controls)
8. Undo/redo works for container create/delete/move/resize
