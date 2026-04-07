# Undo Stack Management Strategy

> **For Claude:** Reference this before implementing any feature that adds new editor state fields.

**Goal:** Define how the undo stack scales as new features (standalone labels, control groups, version history) are added, without breaking existing undo/redo behavior.

---

## Current State

**ManifestSnapshot captures:**
- `sections: Record<string, SectionDef>` — all section positions/properties
- `controls: Record<string, ControlDef>` — all control positions/properties
- `canvasWidth?: number`
- `canvasHeight?: number`
- `keyboard?: object | null`

**NOT in snapshot (intentional):**
- `zoom`, `panX`, `panY`, `controlScale` — view state, not content
- `selectedIds`, `lockedIds`, `focusedSectionId` — UI state
- `cleanupGap`, `panelScale` — settings, not layout content

---

## Rule: When to Add a Field to ManifestSnapshot

Add a field to the snapshot if ALL of these are true:
1. The field represents **user-created content** (not a setting or preference)
2. The field is **modified by user actions** that call `pushSnapshot()`
3. Losing the field on undo would cause **visible data loss** (a label disappears, a group dissolves)

Do NOT add:
- Settings (cleanupGap, panelScale, zoom) — these are preferences, not content
- Metadata (deviceId, manufacturer) — never changes during editing
- UI state (selectedIds, showGrid) — transient

---

## Fields to Add Per Feature

### Feature 4: Standalone Labels
```typescript
// Add to ManifestSnapshot:
editorLabels?: EditorLabel[]

// Add to cloneSnapshot:
editorLabels: snapshot.editorLabels?.map(l => ({ ...l })) ?? []

// Add to ManifestFields:
editorLabels: EditorLabel[]

// Add to pushSnapshot, undo, redo:
const { ..., editorLabels } = get();
// Include in snapshot creation and restoration
```

### Feature 5: Control Groups
```typescript
// Add to ManifestSnapshot:
controlGroups?: ControlGroup[]

// Add to cloneSnapshot:
controlGroups: snapshot.controlGroups?.map(g => ({
  ...g, controlIds: [...g.controlIds]
})) ?? []

// Add to ManifestFields:
controlGroups: ControlGroup[]

// Add to pushSnapshot, undo, redo:
const { ..., controlGroups } = get();
```

---

## cloneSnapshot Refactoring

Current: manual field-by-field cloning. As fields grow, refactor to:

```typescript
function cloneSnapshot(snapshot: ManifestSnapshot): ManifestSnapshot {
  const cloneRecord = <T extends Record<string, unknown>>(
    record: Record<string, T> | undefined,
    clone: (item: T) => T,
  ): Record<string, T> => {
    if (!record) return {};
    const result: Record<string, T> = {};
    for (const [k, v] of Object.entries(record)) {
      result[k] = clone(v);
    }
    return result;
  };

  return {
    sections: cloneRecord(snapshot.sections, s => ({ ...s, childIds: [...s.childIds] })),
    controls: cloneRecord(snapshot.controls, c => ({ ...c })),
    editorLabels: snapshot.editorLabels?.map(l => ({ ...l })) ?? [],
    controlGroups: snapshot.controlGroups?.map(g => ({
      ...g, controlIds: [...g.controlIds],
    })) ?? [],
    canvasWidth: snapshot.canvasWidth,
    canvasHeight: snapshot.canvasHeight,
    keyboard: snapshot.keyboard ? { ...snapshot.keyboard } : undefined,
  };
}
```

Do NOT use `structuredClone` — the data is flat/shallow, manual cloning is faster and explicit.

---

## Version Restore + Undo Stack

**Approach: Undoable restore (Option B)**

When the user restores a version from the History dropdown:
1. `pushSnapshot()` — save current state to undo stack
2. Load restored data via `setState`
3. Clear `future: []` — redo is invalid after a version jump
4. Set `hasUserEdited: false` — prevent auto-save race condition

This means Cmd+Z after a restore **undoes the restore itself** — user goes back to what they had before. Intuitive and safe.

---

## localStorage Quota

| Scenario | Snapshot size | 50 snapshots | Safe? |
|---|---|---|---|
| Current (sections + controls) | ~19 KB | ~950 KB | Yes |
| + editorLabels (20 labels) | ~20 KB | ~1 MB | Yes |
| + controlGroups (5 groups) | ~21 KB | ~1.05 MB | Yes |
| localStorage limit | — | 5-10 MB | — |

**Keep MAX_PERSISTED_UNDO = 50.** No reduction needed.

---

## useAutoSave Updates Per Feature

For EVERY new field added to the store that represents user content:

1. **Change guard** — add `state.newField === prevState.newField` to the skip check
2. **PUT body** — include `newField` in the JSON.stringify payload
3. **Restore path** — include `newField: data.newField ?? defaultValue` in PanelEditor setState

This is a mechanical 3-line update per feature. The pattern is established.

---

## Checklist: Adding a New Undoable Field

Use this checklist when implementing any feature that adds user-editable state:

- [ ] Add field to `ManifestSnapshot` interface in `historySlice.ts`
- [ ] Add cloning logic in `cloneSnapshot()`
- [ ] Add field to `ManifestFields` interface
- [ ] Read field in `pushSnapshot()`, `undo()`, `redo()`
- [ ] Restore field in undo/redo `set()` calls
- [ ] Add to `useAutoSave.ts` change guard
- [ ] Add to `useAutoSave.ts` PUT body
- [ ] Add to `PanelEditor.tsx` restore path (load from disk)
- [ ] Add default value for backward compatibility (`?? []` or `?? null`)
- [ ] Test: create → undo → redo → refresh → verify persistence
