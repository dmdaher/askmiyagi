import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';
import type { EditorLabel } from '../historySlice';

/**
 * Phase 8 — linked-label snap-grid parity.
 *
 * Background: `moveControl` translates linked labels by the same delta
 * as the control, then rounds. Pre-fix the rounding was integer-pixel
 * only (`Math.round(l.x + dx)`), so labels could land off-grid even
 * when the control snapped cleanly. Fix routes the rounding through
 * the editor's `snapGrid` value (1, 2, 4, 8, 16, 32).
 *
 * Invariant locked in by these tests: after any `moveControl(id, dx, dy)`
 * where the control has a linked label, the label's resulting x and y
 * are divisible by `snapGrid`.
 */

const SNAP_VALUES = [1, 2, 4, 8, 16, 32] as const;

function setupControlWithLinkedLabel(snap: 1 | 2 | 4 | 8 | 16 | 32, labelX = 0, labelY = 0) {
  useEditorStore.setState({
    snapGrid: snap,
    controls: {
      'c1': {
        id: 'c1', type: 'knob', label: 'C1',
        x: 100, y: 100, w: 40, h: 40,
        sectionId: 's1',
        zOrder: 0,
      } as any,
    },
    sections: {
      's1': { id: 's1', headerLabel: 'S1', x: 0, y: 0, w: 800, h: 600, childIds: ['c1'] } as any,
    },
    editorLabels: [{ id: 'lbl1', text: 'C1', x: labelX, y: labelY, w: 30, fontSize: 8, align: 'center', controlId: 'c1' }],
  } as any);
}

describe('Phase 8 — moveControl snaps linked labels to snapGrid', () => {
  beforeEach(() => {
    useEditorStore.setState({ controls: {}, sections: {}, editorLabels: [] } as any);
  });

  for (const snap of SNAP_VALUES) {
    it(`snapGrid=${snap}: linked label x/y always divisible by ${snap} after moveControl`, () => {
      setupControlWithLinkedLabel(snap, 105, 95); // intentionally off-grid initial label position
      useEditorStore.getState().moveControl('c1', snap, snap);
      const lbl = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')!;
      expect(lbl.x % snap).toBe(0);
      expect(lbl.y % snap).toBe(0);
    });
  }

  it('snapGrid=4: moving by 8px puts label at multiple-of-4 position even if initial was at 105,95', () => {
    setupControlWithLinkedLabel(4, 105, 95);
    useEditorStore.getState().moveControl('c1', 8, 8);
    // Initial 105 → +8 → 113 → round(113/4)*4 = round(28.25)*4 = 28*4 = 112
    // Initial 95 → +8 → 103 → round(103/4)*4 = round(25.75)*4 = 26*4 = 104
    const lbl = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')!;
    expect(lbl.x).toBe(112);
    expect(lbl.y).toBe(104);
  });

  it('snapGrid=1: behaves like integer rounding (the previous behavior)', () => {
    setupControlWithLinkedLabel(1, 105, 95);
    useEditorStore.getState().moveControl('c1', 1, 1);
    const lbl = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')!;
    expect(lbl.x).toBe(106);
    expect(lbl.y).toBe(96);
  });

  it('non-linked labels (controlId == null) are unaffected by moveControl', () => {
    useEditorStore.setState({
      snapGrid: 4,
      controls: { 'c1': { id: 'c1', type: 'knob', label: 'C1', x: 100, y: 100, w: 40, h: 40, sectionId: 's1', zOrder: 0 } as any },
      sections: { 's1': { id: 's1', headerLabel: 'S1', x: 0, y: 0, w: 800, h: 600, childIds: ['c1'] } as any },
      editorLabels: [
        { id: 'standalone', text: 'free', x: 200, y: 200, w: 30, fontSize: 8, align: 'center' }, // no controlId
        { id: 'linked', text: 'C1', x: 105, y: 95, w: 30, fontSize: 8, align: 'center', controlId: 'c1' },
      ],
    } as any);
    useEditorStore.getState().moveControl('c1', 8, 8);
    const standalone = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'standalone')!;
    const linked = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'linked')!;
    expect(standalone.x).toBe(200); // untouched
    expect(standalone.y).toBe(200);
    expect(linked.x % 4).toBe(0);   // snapped
    expect(linked.y % 4).toBe(0);
  });

  it('locked control does not move; linked label also stays put', () => {
    useEditorStore.setState({
      snapGrid: 4,
      controls: { 'c1': { id: 'c1', type: 'knob', label: 'C1', x: 100, y: 100, w: 40, h: 40, sectionId: 's1', zOrder: 0, locked: true } as any },
      sections: { 's1': { id: 's1', headerLabel: 'S1', x: 0, y: 0, w: 800, h: 600, childIds: ['c1'] } as any },
      editorLabels: [{ id: 'lbl1', text: 'C1', x: 105, y: 95, w: 30, fontSize: 8, align: 'center', controlId: 'c1' }],
    } as any);
    useEditorStore.getState().moveControl('c1', 8, 8);
    const ctrl = useEditorStore.getState().controls['c1'];
    const lbl = useEditorStore.getState().editorLabels.find((l: EditorLabel) => l.id === 'lbl1')!;
    expect(ctrl.x).toBe(100); // didn't move
    expect(lbl.x).toBe(105);   // didn't move either
  });
});
