# Alignment & Distribution Tools — Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Figma/Sketch-style alignment and distribution tools for selected controls. Select 2+ controls, click align/distribute, only those controls move. Replaces "Clean Up" as the primary positioning tool.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## Tools

| Tool | Icon | What it does | Keyboard |
|------|------|-------------|----------|
| Align Left | `⫷` | All selected snap to leftmost x | — |
| Align Center H | `⫿` | All selected snap to average centerX | Shift+H |
| Align Right | `⫸` | All selected snap to rightmost right edge | — |
| Align Top | `⊤` | All selected snap to topmost y | — |
| Align Middle V | `⊞` | All selected snap to average centerY | Shift+V |
| Align Bottom | `⊥` | All selected snap to bottommost bottom edge | — |
| Distribute H | `⫼H` | Equal horizontal gaps between selected | Cmd+Shift+H |
| Distribute V | `⫼V` | Equal vertical gaps between selected | Cmd+Shift+V |

---

## UI Locations (3 places)

### 1. Properties Panel (primary — visible when 2+ controls selected)

**File:** `src/components/panel-editor/PropertiesPanel/index.tsx`

Insert after geometry fields (x/y/w/h), before "Match Sizes" button. Only visible when `selectedControls.length >= 2`.

```
┌─ PROPERTIES ──────────────────┐
│ 3 Controls Selected           │
│ x: Mixed  y: Mixed            │
│ w: 42     h: 28               │
│                                │
│ ── ALIGN ──────────────────── │
│ [⫷] [⫿] [⫸]  [⊤] [⊞] [⊥]  │
│ [Distribute H] [Distribute V] │
│                                │
│ [Match Sizes]                  │
└────────────────────────────────┘
```

6 alignment buttons in a 2×3 grid (left/center/right on top, top/middle/bottom below). Then Distribute H and V as two wider buttons.

### 2. Context Menu (secondary — right-click on multi-selection)

**File:** `src/components/panel-editor/ContextMenu.tsx`

Add "Align" submenu when 2+ controls selected:
```
Duplicate       Cmd+D
Delete          Del
Lock
─────────────
Align Left
Align Center
Align Right
Align Top
Align Middle
Align Bottom
─────────────
Distribute Horizontally
Distribute Vertically
```

### 3. Keyboard Shortcuts

**File:** `src/components/panel-editor/hooks/useEditorKeyboard.ts`

- `Shift+H` — Align Center H (most common alignment)
- `Shift+V` — Align Middle V
- `Cmd+Shift+H` — Distribute Horizontally
- `Cmd+Shift+V` — Distribute Vertically

---

## Store Actions

**File:** `src/components/panel-editor/store/manifestSlice.ts`

### alignControls

```typescript
alignControls: (alignment: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
```

Implementation:
```typescript
alignControls: (alignment) => {
  const { selectedIds, controls } = get();
  if (selectedIds.length < 2) return;

  const selected = selectedIds.map(id => controls[id]).filter(Boolean);

  let targetValue: number;
  switch (alignment) {
    case 'left':
      targetValue = Math.min(...selected.map(c => c.x));
      break;
    case 'center-x': {
      const centers = selected.map(c => c.x + c.w / 2);
      targetValue = centers.reduce((a, b) => a + b, 0) / centers.length;
      break;
    }
    case 'right':
      targetValue = Math.max(...selected.map(c => c.x + c.w));
      break;
    case 'top':
      targetValue = Math.min(...selected.map(c => c.y));
      break;
    case 'center-y': {
      const centers = selected.map(c => c.y + c.h / 2);
      targetValue = centers.reduce((a, b) => a + b, 0) / centers.length;
      break;
    }
    case 'bottom':
      targetValue = Math.max(...selected.map(c => c.y + c.h));
      break;
  }

  set((s) => {
    const updated = { ...s.controls };
    for (const id of selectedIds) {
      const ctrl = updated[id];
      if (!ctrl || ctrl.locked) continue;
      switch (alignment) {
        case 'left': updated[id] = { ...ctrl, x: targetValue }; break;
        case 'center-x': updated[id] = { ...ctrl, x: targetValue - ctrl.w / 2 }; break;
        case 'right': updated[id] = { ...ctrl, x: targetValue - ctrl.w }; break;
        case 'top': updated[id] = { ...ctrl, y: targetValue }; break;
        case 'center-y': updated[id] = { ...ctrl, y: targetValue - ctrl.h / 2 }; break;
        case 'bottom': updated[id] = { ...ctrl, y: targetValue - ctrl.h }; break;
      }
    }
    return { controls: updated };
  });
};
```

### distributeControls

```typescript
distributeControls: (axis: 'horizontal' | 'vertical') => void;
```

Implementation:
```typescript
distributeControls: (axis) => {
  const { selectedIds, controls } = get();
  if (selectedIds.length < 3) return; // Need 3+ to distribute

  const selected = selectedIds
    .map(id => controls[id])
    .filter(Boolean)
    .filter(c => !c.locked);

  if (axis === 'horizontal') {
    selected.sort((a, b) => a.x - b.x);
    const first = selected[0];
    const last = selected[selected.length - 1];
    const totalSpace = (last.x + last.w) - first.x;
    const totalContent = selected.reduce((sum, c) => sum + c.w, 0);
    const gap = (totalSpace - totalContent) / (selected.length - 1);

    let pos = first.x;
    set((s) => {
      const updated = { ...s.controls };
      for (const ctrl of selected) {
        updated[ctrl.id] = { ...ctrl, x: Math.round(pos) };
        pos += ctrl.w + gap;
      }
      return { controls: updated };
    });
  } else {
    selected.sort((a, b) => a.y - b.y);
    const first = selected[0];
    const last = selected[selected.length - 1];
    const totalSpace = (last.y + last.h) - first.y;
    const totalContent = selected.reduce((sum, c) => sum + c.h, 0);
    const gap = (totalSpace - totalContent) / (selected.length - 1);

    let pos = first.y;
    set((s) => {
      const updated = { ...s.controls };
      for (const ctrl of selected) {
        updated[ctrl.id] = { ...ctrl, y: Math.round(pos) };
        pos += ctrl.h + gap;
      }
      return { controls: updated };
    });
  }
};
```

---

## Implementation Order

1. **Add store actions** — `alignControls` + `distributeControls` to manifestSlice
2. **Properties Panel UI** — alignment button grid in MultiControlProperties
3. **Keyboard shortcuts** — Shift+H/V, Cmd+Shift+H/V in useEditorKeyboard
4. **Context menu** — alignment submenu in ContextMenu
5. **Playwright test** — multi-select 3 knobs, align, verify positions

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/panel-editor/store/manifestSlice.ts` | Add `alignControls` + `distributeControls` actions |
| `src/components/panel-editor/PropertiesPanel/index.tsx` | Add alignment button grid to MultiControlProperties |
| `src/components/panel-editor/hooks/useEditorKeyboard.ts` | Add Shift+H/V, Cmd+Shift+H/V shortcuts |
| `src/components/panel-editor/ContextMenu.tsx` | Add Align/Distribute submenu |

## Files NOT Changed

- `manifestSlice.ts` control/section data model — no new fields
- `historySlice.ts` — existing pushSnapshot pattern used
- `useAutoSave.ts` — no changes (controls changes auto-save as usual)
- `PanelEditor.tsx` — no changes
- `EditorToolbar.tsx` — no changes (tools live in PropertiesPanel + context menu)

---

## Interaction with Clean Up

Clean Up (Gap=0) remains as a conservative "align rows" tool. The new alignment tools are the primary positioning workflow:

1. Select 6 zone knobs
2. Click **Align Top** → all snap to same Y
3. Click **Distribute H** → equal horizontal gaps
4. Done — no guessing, no surprises

Clean Up can be kept for quick row-snapping or removed entirely in favor of these tools.

---

## Control Grouping (Cmd+G)

Simplified grouping — no layout presets, no modals, no auto-arrange. Just "these controls move together."

### Behavior

| Action | Shortcut | What happens |
|--------|----------|-------------|
| Group | Cmd+G | Selected controls become a group |
| Ungroup | Cmd+Shift+G | Dissolves the group, controls stay in place |
| Click grouped control | Click | All group members get selected |
| Drag grouped control | Drag | All group members move together |

### Data Model

Already prepared in undo stack prep — `controlGroups` field exists in store, snapshots, auto-save, and restore path.

```typescript
// In manifestSlice state (already declared as unknown[]):
controlGroups: ControlGroup[]

interface ControlGroup {
  id: string;
  controlIds: string[];
}
```

### Store Actions

**File:** `src/components/panel-editor/store/manifestSlice.ts`

```typescript
createGroup: () => void;
// Takes selectedIds, creates { id: 'group-N', controlIds: [...selectedIds] }
// Requires 2+ selected controls
// A control can only be in one group

ungroupControls: () => void;
// Finds any group containing any of the selectedIds
// Dissolves that group, removes from controlGroups array
// Controls keep their positions
```

### Auto-Select Group Members

**File:** `src/components/panel-editor/ControlNode.tsx`

When a control is clicked and it belongs to a group, auto-select all group members:

```typescript
const handleClick = useCallback((e: React.MouseEvent) => {
  const store = useEditorStore.getState();
  // Find if this control is in a group
  const group = store.controlGroups.find(
    (g: any) => g.controlIds?.includes(controlId)
  );

  if (group && !e.shiftKey) {
    // Select all group members
    store.setSelectedIds(group.controlIds);
  } else if (e.shiftKey) {
    store.toggleSelected(controlId);
  } else {
    store.setSelectedIds([controlId]);
  }
}, [controlId]);
```

### Group-Aware Drag

**File:** `src/components/panel-editor/ControlNode.tsx`

When dragging a grouped control, move all group members:

```typescript
const handleDragStop = useCallback((...) => {
  const store = useEditorStore.getState();
  const group = store.controlGroups.find(
    (g: any) => g.controlIds?.includes(controlId)
  );

  pushSnapshot();
  if (group) {
    // Move all group members by the same delta
    for (const id of group.controlIds) {
      if (id !== controlId) {
        store.moveControl(id, dx, dy);
      }
    }
  }
  moveControl(controlId, dx, dy);
}, [...]);
```

### Keyboard Shortcuts

**File:** `src/components/panel-editor/hooks/useEditorKeyboard.ts`

```typescript
// Cmd+G: Group selected
if (isMod && e.key === 'g') {
  e.preventDefault();
  store.pushSnapshot();
  store.createGroup();
  return;
}

// Cmd+Shift+G: Ungroup
if (isMod && e.shiftKey && e.key === 'g') {
  e.preventDefault();
  store.pushSnapshot();
  store.ungroupControls();
  return;
}
```

### Context Menu

**File:** `src/components/panel-editor/ContextMenu.tsx`

Add to menu when 2+ selected:
```
Group           Cmd+G
Ungroup         Cmd+Shift+G
```

### Visual Indicator (nice-to-have)

Thin dashed border around grouped controls so the contractor can see which controls are grouped. Rendered as an overlay in EditorWorkspace, not inside ControlNode (avoids coupling).

---

## Combined Workflow

1. Select 6 zone knobs
2. **Cmd+G** → grouped
3. Click any knob → all 6 selected
4. **Align Top** → all snap to same Y
5. **Distribute H** → equal horizontal gaps
6. Drag to reposition the whole row
7. **Cmd+Shift+G** → ungroup when done

---

## Updated Implementation Order

1. **Store actions** — `alignControls`, `distributeControls`, `createGroup`, `ungroupControls`
2. **Group click/drag** — auto-select + group-move in ControlNode
3. **Properties Panel** — alignment buttons + Group/Ungroup buttons
4. **Keyboard shortcuts** — Shift+H/V, Cmd+Shift+H/V, Cmd+G, Cmd+Shift+G
5. **Context menu** — alignment + group/ungroup
6. **Playwright test** — group 3 knobs, align, distribute, ungroup

## Updated Files Changed

| File | Change |
|------|--------|
| `src/components/panel-editor/store/manifestSlice.ts` | Add `alignControls`, `distributeControls`, `createGroup`, `ungroupControls` |
| `src/components/panel-editor/ControlNode.tsx` | Auto-select group members on click, group-move on drag |
| `src/components/panel-editor/PropertiesPanel/index.tsx` | Alignment buttons + Group/Ungroup in multi-select view |
| `src/components/panel-editor/hooks/useEditorKeyboard.ts` | Shortcuts: Shift+H/V, Cmd+Shift+H/V, Cmd+G, Cmd+Shift+G |
| `src/components/panel-editor/ContextMenu.tsx` | Group/Ungroup + alignment menu items |
