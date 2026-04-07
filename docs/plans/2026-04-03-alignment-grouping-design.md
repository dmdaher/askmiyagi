# Alignment, Distribution & Grouping Tools — Design

> **Date:** 2026-04-03
> **Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)
> **Validated:** Playwright z-layer tests (e2e/z-layer-verify.ts), codebase audit, Figma UX research

---

## Overview

Figma-style alignment, distribution, and grouping tools for the panel editor. Select 2+ controls, align/distribute them. Group controls into named sub-sections (e.g., "Zone Knobs") that select/move/resize together.

---

## 1. Control Groups — Data Model

```typescript
interface ControlGroup {
  id: string;           // 'group-1', 'group-2', etc.
  name: string;         // 'Zone Knobs', 'Hot Cue Buttons'
  controlIds: string[]; // member control IDs
}
```

**Infrastructure already in place:**
- `controlGroups: unknown[]` in store (manifestSlice.ts:254)
- Cloned in snapshots (historySlice.ts:59–62)
- Restored on undo/redo (historySlice.ts:121, 143)
- Persisted in auto-save payload (useAutoSave.ts:86)

---

## 2. Grouping Behavior (Figma-style)

| Action | Trigger | What happens |
|--------|---------|-------------|
| Create group | Cmd+G with 2+ selected | Creates group, prompts name |
| Ungroup | Cmd+Shift+G with group selected | Dissolves group, controls stay in place |
| Click grouped control | Single click | Selects entire group (all members) |
| Deep-select individual | Double-click on grouped control | Selects just that control |
| Cmd+click | On grouped control | Deep-select (bypasses group) |
| Drag grouped control | Drag any member | All group members move together |

---

## 3. Alignment Tools (8 Operations)

Reference = bounding box of selection (Figma convention).

| Tool | Algorithm | Min selection |
|------|-----------|--------------|
| Align Left | All x → min(x) | 2 |
| Align Center H | All centerX → avg(centerX) | 2 |
| Align Right | All rightEdge → max(rightEdge) | 2 |
| Align Top | All y → min(y) | 2 |
| Align Middle V | All centerY → avg(centerY) | 2 |
| Align Bottom | All bottomEdge → max(bottomEdge) | 2 |
| Distribute H | Equal edge-to-edge gaps, outermost anchored | 3 |
| Distribute V | Equal edge-to-edge gaps, outermost anchored | 3 |

All operations skip locked controls. All push undo snapshot before mutating.

---

## 4. Properties Panel — Multi-Select UI

**Location:** After Match Sizes in `PropertiesPanel/index.tsx` (after line 510)

No section headers — use existing `h-px bg-gray-800` divider pattern.

### Alignment Strip

Two axis groups in one container with a vertical divider:

```
[←] [↔] [→] │ [↑] [↕] [↓]
```

- SVG icons (12×12 viewport, 1–1.5px strokes) — NOT Unicode
- Container: `flex items-center rounded border border-gray-700 bg-gray-900/60 overflow-hidden`
- Each button: `flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors`
- Axis divider: `w-px h-5 bg-gray-700 flex-shrink-0`

### Distribute Buttons

Below alignment strip as a flex pair:

```
[── Distribute H ──] [── Distribute V ──]
```

- Container: `flex gap-1.5`
- Each button: `flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors`

### Group Buttons

Bottom of multi-select properties:

```
[── Group ⌘G ──] [── Ungroup ⌘⇧G ──]
```

- Same styling as distribute
- Ungroup: `opacity-30 cursor-not-allowed` when no group in selection

---

## 5. Layers Panel — Groups Inside Sections

```
▼ BROWSE (12)              ← section (existing)
  ├─ source-btn
  └─ browse-btn
▼ TEMPO (6)
  ▼ ◈ Tempo Buttons (3)   ← group node (violet, nested in section)
    ├─ tempo-range-btn
    ├─ master-tempo-btn
    └─ tempo-reset-btn
  └─ tempo-slider
```

### Group Node Styling

- Indented inside section (same level as controls)
- SVG icon in `text-violet-400` (12×12)
- Name + count: `text-[10px] text-gray-300` + `text-[9px] text-gray-500`
- Click → selects all member controls on canvas + shows overlay
- Hover → faint violet outline on canvas
- Expand/collapse chevron for member list

### Implementation

`SectionItem` in `LayersPanel.tsx` reads `controlGroups` from store, clusters grouped controls under group nodes.

---

## 6. Group Overlay on Canvas (GroupOverlay.tsx)

New component rendered in `PanCanvas.tsx` between sections and LabelLayer.

### Three States

| State | Border | Fill | Badge | pointer-events |
|-------|--------|------|-------|---------------|
| Idle | none | none | none | none |
| Hover (layers) | `1px solid rgba(147,130,246,0.2)` | none | none | none |
| Selected | `1px dashed rgba(147,130,246,0.5)` | none | yes | none (badge: auto) |

### Badge (Top-Left Inside Bounds)

```tsx
<div className="absolute top-1 left-1 flex items-center gap-0.5 rounded
  bg-gray-900/90 border border-violet-500/30 px-1 py-0.5"
  style={{ pointerEvents: 'auto', zIndex: 75 }}>
  <span className="text-[8px] text-violet-400 font-medium">{group.name}</span>
  <span className="text-[8px] text-gray-600">×{count}</span>
</div>
```

### Bounding Box

4px padding outside outermost member edges. Compute from member control positions.

**Key rule:** Group outline is ALWAYS `pointer-events: none`. Only the badge at z=75 is clickable. Controls at z=50 are never blocked.

---

## 7. Z-Layer Stack (Playwright-Validated)

```
z=0     Photo overlay (pe:none)
z=0     Drag select rect
z=1     Grid (pe:none)
z=2–N   Sections (by area, smallest on top)
z=5     Controls (ungrouped)
z=10    Controls (grouped)
z=20    Group outline idle/hover (pe:none)
z=30    Keyboard
z=40    Section focused
z=50    Controls selected
z=55    Section selected
z=70    Group outline selected (pe:none — visual only)
z=75    Group badge selected (pe:auto — tiny click target)
z=150   LabelLayer wrapper (stacking context, pe:none)
  ↳60   Labels normal (pe:auto on text span)
  ↳100  Labels selected
  ↳200  Labels dragging
z=200   GroupLabelNode (pipeline labels)
z=9999  Context menu
```

**Validated:** z=20 and z=70 confirmed empty via Playwright `elementFromPoint` scan.

---

## 8. Context Menu (Flat, No Submenus)

When 2+ controls selected:

```
Duplicate          ⌘D
Delete             Del
Lock
─────────────────────────
Align Left
Align Center H     ⇧H
Align Right
Align Top
Align Middle V     ⇧V
Align Bottom
─────────────────────────
Distribute H       ⌘⇧H
Distribute V       ⌘⇧V
─────────────────────────
Group              ⌘G
Ungroup            ⌘⇧G
```

When 1 control selected: existing menu only (Duplicate, Delete, Lock).

Shortcut text: `text-gray-600 text-[9px]`, right-aligned.

---

## 9. Keyboard Shortcuts

| Shortcut | Action | Available? |
|----------|--------|-----------|
| Shift+H | Align Center H | ✅ Free |
| Shift+V | Align Middle V | ✅ Free |
| Cmd+Shift+H | Distribute H | ✅ Free |
| Cmd+Shift+V | Distribute V | ✅ Free |
| Cmd+G | Group selected | ✅ Free |
| Cmd+Shift+G | Ungroup | ✅ Free |

---

## 10. Store Actions

```typescript
// manifestSlice.ts — new actions

alignControls: (mode: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
// Moves selected non-locked controls to align edges/centers with selection bounding box

distributeControls: (axis: 'horizontal' | 'vertical') => void;
// Equal edge-to-edge gaps. Outermost controls anchored. Requires 3+ selected.

createGroup: (name: string) => void;
// Creates ControlGroup from selectedIds. A control can only be in one group.

ungroupControls: () => void;
// Finds any group containing any selectedId, dissolves it. Controls keep positions.
```

All skip locked controls. Caller must call `pushSnapshot()` before mutation.

---

## 11. Interaction Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Position animation on align | **No** | Fights react-rnd drag state; instant snap is clearer |
| Toast/notification | **No** | Precision tool; Cmd+Z is the feedback loop |
| Flash on aligned controls | **Optional** — skip for MVP | Can add 400ms ring flash later if user testing shows confusion |
| Group name prompt | **Inline input** in properties panel | No modal dialog — type name, press Enter |
| Alignment reference | **Selection bounding box** | Figma convention; extreme item is anchor |
| Distribution algorithm | **Equal edge-to-edge gaps** | Not center-to-center; matches Figma |

---

## 12. Files Changed

| File | Change |
|------|--------|
| `store/manifestSlice.ts` | `alignControls`, `distributeControls`, `createGroup`, `ungroupControls` actions |
| `ControlNode.tsx` | Group-aware click (single→group, double→individual, cmd→deep), group drag |
| `PropertiesPanel/index.tsx` | Alignment strip, distribute buttons, group buttons |
| `hooks/useEditorKeyboard.ts` | 6 new shortcuts |
| `ContextMenu.tsx` | Multi-select awareness, flat alignment + group items |
| `LayersPanel.tsx` | Group nodes nested inside sections, hover preview |
| `PanCanvas.tsx` | Render GroupOverlay between sections and LabelLayer |
| **NEW** `GroupOverlay.tsx` | Bounding box overlay + badge per group |
| **NEW** `icons/alignment.tsx` | 8 SVG alignment icons (12×12) |

## Files NOT Changed

| File | Why |
|------|-----|
| `historySlice.ts` | Already handles controlGroups in snapshots |
| `useAutoSave.ts` | Already persists controlGroups |
| `canvasSlice.ts` | No changes needed |
| `LabelLayer.tsx` | Separate stacking context, unaffected |
| `GroupLabelNode.tsx` | Pipeline labels — separate concept from user groups |

---

## 13. Edge Cases

| Case | Handling |
|------|---------|
| Align with locked controls in selection | Skip locked controls, align only unlocked |
| Distribute with 2 controls | No-op (need 3+) |
| Group with 1 control | No-op (need 2+) |
| Control already in another group | Remove from old group, add to new |
| Delete grouped control | Remove from group's controlIds; dissolve group if < 2 remain |
| Undo group creation | controlGroups restored from snapshot |
| Group members across sections | Allowed — group is a selection overlay, not ownership |
| Align labels | Not in scope — labels have their own C-key centering |
