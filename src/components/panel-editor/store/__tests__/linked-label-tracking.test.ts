import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';

/**
 * PR-B: linked labels track their control during scaleSelectedControls
 * and resizeControl, while preserving any user-customized offset.
 *
 * Approach: proportional scaling around the control's anchor.
 *   - scaleSelectedControls: control center is anchor (matches the
 *     center-preserving control-scale at manifestSlice.ts:1383)
 *   - resizeControl: control top-left is anchor (matches Rnd's
 *     onResizeStop anchor after the move-leg)
 *
 * Standalone labels (controlId === null) MUST be untouched.
 * scaleFromBase (the canvas-wide Scale Contents path) is UNCHANGED —
 * regression test below verifies it still works correctly when chained
 * after a scaleSelectedControls call.
 */

function resetStore() {
  useEditorStore.setState({
    controls: {
      pad1: { id: 'pad1', x: 100, y: 100, w: 40, h: 40, sectionId: 's', label: 'P1', type: 'pad', labelPosition: 'above', labelFontSize: 10, locked: false },
      pad2: { id: 'pad2', x: 200, y: 100, w: 40, h: 40, sectionId: 's', label: 'P2', type: 'pad', labelPosition: 'above', labelFontSize: 10, locked: false },
      tiny: { id: 'tiny', x: 300, y: 100, w: 0, h: 40, sectionId: 's', label: 'TINY', type: 'button', labelPosition: 'above', locked: false },
    },
    editorLabels: [
      // Linked to pad1 — canonical above-anchor (centered on control, 10px above)
      { id: 'lbl1', controlId: 'pad1', text: 'PAD ONE', x: 100, y: 84, w: 40, fontSize: 12, align: 'center' },
      // Linked to pad2 — user customized: dragged 5px left of canonical
      { id: 'lbl2', controlId: 'pad2', text: 'PAD TWO', x: 195, y: 84, w: 40, fontSize: 12, align: 'center' },
      // Standalone (no controlId) — section header that must NOT scale
      { id: 'header', controlId: null as unknown as string, text: 'SECTION', x: 0, y: 0, w: 100, fontSize: 14, align: 'left' },
      // Linked to tiny — exercises zero-dimension guard
      { id: 'lbl3', controlId: 'tiny', text: 'T', x: 300, y: 90, w: 20, fontSize: 10, align: 'center' },
    ],
    sections: {
      s: { id: 's', headerLabel: 'S', archetype: 'grid', x: 0, y: 0, w: 400, h: 300, childIds: [] },
    },
    selection: [],
    lockedIds: [],
  });
}

describe('PR-B: scaleSelectedControls scales linked labels proportionally', () => {
  beforeEach(resetStore);

  it('scales label x/y/w/fontSize when its control is in selection', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    const lbl = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    // pad1 center stays at (120, 120). Label was at (100, 84) — offset (-20, -36) from center.
    // After factor 0.5, offset becomes (-10, -18) → label at (110, 102).
    expect(lbl.x).toBe(110);
    expect(lbl.y).toBe(102);
    expect(lbl.w).toBe(20); // 40 * 0.5
    expect(lbl.fontSize).toBe(6); // 12 * 0.5
  });

  it('preserves user-customized offset (label not at canonical anchor)', () => {
    useEditorStore.getState().setSelectedIds(['pad2']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    const lbl = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl2')!;
    // pad2 center stays at (220, 120). Label was at (195, 84) — offset (-25, -36).
    // 5px to the left of canonical (210). After factor 0.5: offset (-12.5, -18) → (207.5, 102) → rounded (208, 102).
    // The 2.5px-left-of-canonical (210) survives proportionally (was 5px-left at factor 1).
    expect(lbl.x).toBe(208);
    expect(lbl.y).toBe(102);
  });

  it('does NOT touch labels whose controlId is NOT in selection', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    const lbl2 = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl2')!;
    // pad2 not selected → its label untouched
    expect(lbl2.x).toBe(195);
    expect(lbl2.y).toBe(84);
    expect(lbl2.w).toBe(40);
    expect(lbl2.fontSize).toBe(12);
  });

  it('does NOT touch standalone labels (controlId === null)', () => {
    useEditorStore.getState().setSelectedIds(['pad1', 'pad2']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    const header = useEditorStore.getState().editorLabels.find((l) => l.id === 'header')!;
    expect(header.x).toBe(0);
    expect(header.y).toBe(0);
    expect(header.w).toBe(100);
    expect(header.fontSize).toBe(14);
  });

  it('scales multiple selected controls + their labels independently', () => {
    useEditorStore.getState().setSelectedIds(['pad1', 'pad2']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    const lbl1 = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    const lbl2 = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl2')!;
    // Both labels scaled around their respective control centers
    expect(lbl1.fontSize).toBe(6);
    expect(lbl2.fontSize).toBe(6);
  });

  it('clamps fontSize to minimum 4 on extreme shrink', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.1);
    const lbl = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    expect(lbl.fontSize).toBe(4);
  });

  it('preserves undefined label.w (no explicit width stored)', () => {
    useEditorStore.setState((s) => ({
      editorLabels: s.editorLabels.map((l) =>
        l.id === 'lbl1' ? { ...l, w: undefined } : l,
      ),
    }));
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    const lbl = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    expect(lbl.w).toBeUndefined();
  });
});

describe('PR-B: resizeControl scales linked labels proportionally', () => {
  beforeEach(resetStore);

  it('scales linked label around control top-left when Rnd handle resizes', () => {
    // pad1 starts at (100, 100, 40, 40). Resize to (60, 60).
    // sx = sy = 60/40 = 1.5.
    // Label lbl1 at (100, 84): dx = 0, dy = -16.
    // After scale: x = 100 + 0*1.5 = 100, y = 100 + (-16)*1.5 = 76.
    // w: 40 * 1.5 = 60. fontSize: 12 * min(1.5,1.5) = 18.
    useEditorStore.getState().resizeControl('pad1', 60, 60);
    const lbl = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    expect(lbl.x).toBe(100);
    expect(lbl.y).toBe(76);
    expect(lbl.w).toBe(60);
    expect(lbl.fontSize).toBe(18);
  });

  it('uses min(sx, sy) for fontSize to avoid stretched-text on non-uniform resize', () => {
    // Width 2× but height same → fontScale = min(2, 1) = 1 → fontSize unchanged.
    useEditorStore.getState().resizeControl('pad1', 80, 40);
    const lbl = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    expect(lbl.fontSize).toBe(12);
    expect(lbl.w).toBe(80); // width scales 2×
  });

  it('does NOT touch labels of other controls', () => {
    useEditorStore.getState().resizeControl('pad1', 60, 60);
    const lbl2 = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl2')!;
    expect(lbl2.x).toBe(195);
    expect(lbl2.y).toBe(84);
    expect(lbl2.fontSize).toBe(12);
  });

  it('handles zero-dimension control without NaN', () => {
    // tiny has w=0, h=40. resize to (40, 80). sx defaults to 1 when ctrl.w === 0.
    useEditorStore.getState().resizeControl('tiny', 40, 80);
    const lbl = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl3')!;
    expect(Number.isFinite(lbl.x)).toBe(true);
    expect(Number.isFinite(lbl.y)).toBe(true);
    expect(Number.isFinite(lbl.fontSize)).toBe(true);
  });
});

describe('PR-B regression: scaleFromBase still works correctly after scaleSelectedControls', () => {
  beforeEach(resetStore);

  it('Scale Contents (scaleFromBase) does not compound drift after Scale Selected', () => {
    // Sequence: select pad1, shrink 75%, then canvas-scale 110%.
    // Expectation: label still tracks pad1 correctly (no compounding drift).
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.75);
    const afterPad1 = useEditorStore.getState().controls.pad1;
    const afterLbl1 = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    // Now Scale Contents 110% — scaleFromBase captures CURRENT state as base.
    useEditorStore.getState().scaleFromBase(1.10);
    const finalPad1 = useEditorStore.getState().controls.pad1;
    const finalLbl1 = useEditorStore.getState().editorLabels.find((l) => l.id === 'lbl1')!;
    // Both control and label scaled by same factor 1.10 → their relative offset
    // (from before this canvas-scale op) is preserved.
    const dxBefore = afterLbl1.x - (afterPad1.x + afterPad1.w / 2);
    const dyBefore = afterLbl1.y - (afterPad1.y + afterPad1.h / 2);
    const dxAfter = finalLbl1.x - (finalPad1.x + finalPad1.w / 2);
    const dyAfter = finalLbl1.y - (finalPad1.y + finalPad1.h / 2);
    // Both offsets should scale by 1.10 (within 1px rounding tolerance).
    expect(Math.abs(dxAfter - dxBefore * 1.10)).toBeLessThanOrEqual(1);
    expect(Math.abs(dyAfter - dyBefore * 1.10)).toBeLessThanOrEqual(1);
  });

  it('clearScaleBase is called on scaleSelectedControls (regression invariant)', () => {
    // scaleSelectedControls calls clearScaleBase first — ensures any stale base
    // from a prior scaleFromBase session is dropped, preventing compounding.
    useEditorStore.getState().scaleFromBase(1.20); // captures initial base
    expect(useEditorStore.getState().scaleBase).not.toBeNull();
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.75);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });
});
