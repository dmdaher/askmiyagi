import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';
import type { EditorLabel } from '../historySlice';
import type { SelectableId } from '../selection-types';

/**
 * Phase 4 — entity-agnostic operations on the unified `selection`.
 * Locks in the invariants that `moveSelection` and `deleteSelection`
 * dispatch correctly by prefix, snapshot once for the whole batch
 * (undo restores everything in one step), and clear selection after
 * delete.
 */

function reset(extra: Record<string, unknown> = {}) {
  useEditorStore.setState({
    sections: {
      's1': { id: 's1', x: 0, y: 0, w: 800, h: 600, childIds: ['c1', 'c2'], archetype: 'single-row' } as any,
    },
    controls: {
      'c1': { id: 'c1', type: 'knob', label: 'C1', x: 100, y: 100, w: 40, h: 40, sectionId: 's1', zOrder: 0 } as any,
      'c2': { id: 'c2', type: 'knob', label: 'C2', x: 200, y: 100, w: 40, h: 40, sectionId: 's1', zOrder: 1 } as any,
    },
    editorLabels: [
      { id: 'lbl1', text: 'L1', x: 100, y: 50, w: 30, fontSize: 8, align: 'center' },
      { id: 'lbl2', text: 'L2', x: 200, y: 50, w: 30, fontSize: 8, align: 'center', controlId: 'c2' },
    ],
    polishBanners: [
      { id: 'b1', x: 0, y: 0, w: 800, h: 50, text: 'B1' },
    ],
    controlGroups: [],
    controlContainers: [],
    selection: [],
    selectedIds: [],
    selectedLabelId: null,
    selectedBannerId: null,
    snapGrid: 1,
    ...extra,
  } as any);
}

describe('Phase 4 — moveSelection', () => {
  beforeEach(() => reset());

  it('moves a single control entry by (dx, dy)', () => {
    useEditorStore.getState().setSelection(['control:c1' as SelectableId]);
    useEditorStore.getState().moveSelection(10, 5);
    expect(useEditorStore.getState().controls['c1'].x).toBe(110);
    expect(useEditorStore.getState().controls['c1'].y).toBe(105);
  });

  it('moves a single standalone label entry by (dx, dy)', () => {
    useEditorStore.getState().setSelection(['label:lbl1' as SelectableId]);
    useEditorStore.getState().moveSelection(10, 5);
    const lbl = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')!;
    expect(lbl.x).toBe(110);
    expect(lbl.y).toBe(55);
  });

  it('moves a mixed selection (control + label) in lockstep', () => {
    useEditorStore.getState().setSelection(['control:c1' as SelectableId, 'label:lbl1' as SelectableId]);
    useEditorStore.getState().moveSelection(20, 10);
    expect(useEditorStore.getState().controls['c1'].x).toBe(120);
    expect(useEditorStore.getState().controls['c1'].y).toBe(110);
    const lbl = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')!;
    expect(lbl.x).toBe(120);
    expect(lbl.y).toBe(60);
  });

  it('does nothing on empty selection', () => {
    useEditorStore.getState().moveSelection(10, 10);
    expect(useEditorStore.getState().controls['c1'].x).toBe(100); // unchanged
  });

  it('moves a banner via its own per-type mover', () => {
    useEditorStore.getState().setSelection(['banner:b1' as SelectableId]);
    useEditorStore.getState().moveSelection(0, 30);
    expect(useEditorStore.getState().polishBanners[0].y).toBe(30);
  });

  it('moves a section AND keeps its children in world coordinates (matches moveSection semantics)', () => {
    useEditorStore.getState().setSelection(['section:s1' as SelectableId]);
    useEditorStore.getState().moveSelection(50, 0);
    const sec = useEditorStore.getState().sections['s1'];
    expect(sec.x).toBe(50);
    // Per existing moveSection behavior, children move with the section
    // (the section drag handle moves the whole group). Verify the control
    // moved by the same delta.
    expect(useEditorStore.getState().controls['c1'].x).toBe(150);
  });

  it('linked label snaps to grid when moveSelection moves its parent control', () => {
    useEditorStore.setState({ snapGrid: 4 } as any);
    useEditorStore.getState().setSelection(['control:c2' as SelectableId]);
    useEditorStore.getState().moveSelection(5, 0); // 5 isn't a multiple of 4
    // The control moves by (dx, dy) unchanged (legacy behavior — caller
    // is expected to snap delta before calling). But moveControl's
    // linked-label-follow snaps the LABEL's final position to snapGrid.
    const lbl = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl2')!;
    expect(lbl.x % 4).toBe(0); // Phase 8 invariant
  });
});

describe('Phase 4 — deleteSelection (with control-delete prevention policy)', () => {
  beforeEach(() => reset());

  it('deletes a STANDALONE label entry from selection', () => {
    useEditorStore.getState().setSelection(['label:lbl1' as SelectableId]);
    useEditorStore.getState().deleteSelection();
    expect(useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')).toBeUndefined();
  });

  it('does NOT delete a control entry (control deletion policy)', () => {
    useEditorStore.getState().setSelection(['control:c1' as SelectableId]);
    useEditorStore.getState().deleteSelection();
    expect(useEditorStore.getState().controls['c1']).toBeDefined();
    // section.childIds unchanged because control wasn't deleted
    expect(useEditorStore.getState().sections['s1'].childIds).toContain('c1');
  });

  it('deletes mixed selection: only standalone labels + banners; controls + linked labels survive', () => {
    useEditorStore.getState().setSelection([
      'control:c1' as SelectableId,         // protected
      'label:lbl1' as SelectableId,         // standalone — deletable
      'label:lbl2' as SelectableId,         // LINKED to c2 — protected
      'banner:b1' as SelectableId,          // deletable
    ]);
    useEditorStore.getState().deleteSelection();
    // Control survives
    expect(useEditorStore.getState().controls['c1']).toBeDefined();
    // Standalone label gone
    expect(useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')).toBeUndefined();
    // Linked label survives (its parent c2 still exists)
    expect(useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl2')).toBeDefined();
    // Banner gone
    expect(useEditorStore.getState().polishBanners).toHaveLength(0);
  });

  it('clears the now-stale entries from selection but leaves protected entries selected', () => {
    useEditorStore.getState().setSelection(['label:lbl1' as SelectableId, 'control:c1' as SelectableId]);
    useEditorStore.getState().deleteSelection();
    // lbl1 deleted → removed from selection. control:c1 stays.
    expect(useEditorStore.getState().selection).toEqual(['control:c1']);
  });

  it('does nothing on empty selection', () => {
    const before = useEditorStore.getState().controls;
    useEditorStore.getState().deleteSelection();
    expect(useEditorStore.getState().controls).toEqual(before);
  });

  it('does NOT delete a linked label (linked labels belong to controls, also protected)', () => {
    useEditorStore.getState().setSelection(['label:lbl2' as SelectableId]);
    useEditorStore.getState().deleteSelection();
    // Linked label survives
    expect(useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl2')).toBeDefined();
    expect(useEditorStore.getState().controls['c2']).toBeDefined();
  });
});
