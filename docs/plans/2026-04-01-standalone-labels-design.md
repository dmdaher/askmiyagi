# Standalone Labels — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Labels become stored pixel positions — same approach that fixed component positioning. Editor labels and generated panel labels are pixel-identical because the codegen reads stored values directly.

**Branch:** `feature/pipeline-architecture-upgrade`

---

## Data Model

```typescript
interface EditorLabel {
  id: string;                          // "label-pan-level"
  controlId: string | null;            // linked control ID, or null for standalone
  text: string;                        // "MASTER\nVOLUME"
  x: number;                          // absolute pixel position
  y: number;
  fontSize: number;                    // px
  align: 'left' | 'center' | 'right';
}
```

- **Linked** (`controlId: "pan-level"`) — moves with control, deleted with control
- **Standalone** (`controlId: null`) — free text, fully independent
- No w/h — labels auto-size from text (whitespace-nowrap, no wrapping)
- Stored in `editorLabels[]` in the editor store (already in undo + auto-save)

## Linking Behavior

- When control moves by (dx, dy), all labels with matching controlId move by same delta
- When control is deleted, linked labels are deleted
- When control is duplicated, linked labels are duplicated with offset
- Labels can be dragged independently (overrides the auto-computed position)
- Scale slider scales label x/y/fontSize proportionally with controls

## Editor Rendering

- **Remove** renderFloatingLabel from ControlNode — controls render without labels
- **New** LabelLayer component renders ALL labels as a flat overlay on EditorWorkspace
- Click label → select (shows in Properties panel)
- Drag label → move independently (stores new x/y)
- Double-click → inline text editing (Shift+Enter for new lines)
- Delete → removes from editorLabels
- Labels visible/hidden via the Labels toggle (existing)

## Codegen

- **Remove** old renderFloatingLabel from panel-codegen.ts
- **Remove** _labelPos computation from codegen/route.ts
- **Add** simple loop over editorLabels that renders each at stored position:

```tsx
// Generated panel:
<div className="absolute pointer-events-none"
  style={{ left: label.x, top: label.y, fontSize: label.fontSize, textAlign: label.align }}>
  MASTER<br />VOLUME
</div>
```

Zero computation. Pixel-identical to editor.

## Migration

On first load when editorLabels is empty:
1. For each control with visible label (not on-button, not hidden)
2. Compute default position using computeLabelPosition() ONE TIME
3. Store as EditorLabel in editorLabels[]
4. Auto-save — never recomputed

computeLabelPosition() stays as a utility for this one-time initialization only.

## Label Sizing

- Individual: select control → Properties panel → adjust label fontSize
- Group: select multiple → set all label sizes
- Global: "Sz" dropdown in toolbar (already exists)
- Scale slider: fontSize scales proportionally

## Files Changed

| File | Change |
|------|--------|
| `src/components/panel-editor/store/historySlice.ts` | Replace EditorLabel placeholder type |
| `src/components/panel-editor/store/manifestSlice.ts` | Add label management actions |
| `src/components/panel-editor/ControlNode.tsx` | Remove renderFloatingLabel |
| `src/components/panel-editor/LabelLayer.tsx` | NEW — renders all labels |
| `src/components/panel-editor/EditorWorkspace.tsx` | Mount LabelLayer |
| `scripts/panel-codegen.ts` | Remove renderFloatingLabel, add editorLabels loop |
| `src/app/api/pipeline/[deviceId]/codegen/route.ts` | Remove _labelPos computation |
| `src/lib/label-position.ts` | Keep as migration utility only |

## Files NOT Changed

- useAutoSave.ts — editorLabels already in PUT body
- historySlice.ts — editorLabels already in snapshots (just update the type)
- PanelShell.tsx — no changes
- Fantom-08 — hand-built, no editorLabels
