import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';

/**
 * EP8: scaleSelectedControls — bulk factor scaling for the "Scale
 * Selected ▾" dropdown. Per-control:
 *   - w' = w * factor (min 8)
 *   - h' = h * factor (min 8)
 *   - x', y' so center stays put
 *   - labelFontSize * factor (min 6) if present
 * Skipped: locked + resizeLocked + screen/display.
 */

function resetStore() {
  useEditorStore.setState({
    controls: {
      pad1: { id: 'pad1', x: 10, y: 10, w: 40, h: 40, sectionId: 's', label: 'P1', type: 'pad', labelPosition: 'above', labelFontSize: 10, locked: false },
      pad2: { id: 'pad2', x: 100, y: 10, w: 40, h: 40, sectionId: 's', label: 'P2', type: 'pad', labelPosition: 'above', labelFontSize: 10, locked: false },
      knob1: { id: 'knob1', x: 0, y: 100, w: 30, h: 30, sectionId: 's', label: 'K1', type: 'knob', labelPosition: 'above', labelFontSize: 8, locked: false },
      screen1: { id: 'screen1', x: 0, y: 200, w: 200, h: 80, sectionId: 's', label: 'D1', type: 'screen', labelPosition: 'above', locked: false },
      lockedKnob: { id: 'lockedKnob', x: 200, y: 100, w: 30, h: 30, sectionId: 's', label: 'LK', type: 'knob', labelPosition: 'above', locked: true },
      tinyButton: { id: 'tinyButton', x: 300, y: 0, w: 12, h: 12, sectionId: 's', label: 'TB', type: 'button', labelPosition: 'above', locked: false },
    },
    sections: {
      s: { id: 's', headerLabel: 'S', archetype: 'grid', x: 0, y: 0, w: 400, h: 300, childIds: [] },
    },
    selection: [],
    lockedIds: [],
  });
}

describe('scaleSelectedControls', () => {
  beforeEach(resetStore);

  it('no-op when no controls selected', () => {
    const result = useEditorStore.getState().scaleSelectedControls(0.5);
    expect(result.eligible).toBe(0);
    expect(useEditorStore.getState().controls.pad1.w).toBe(40);
  });

  it('no-op when factor is exactly 1', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    const result = useEditorStore.getState().scaleSelectedControls(1);
    expect(result.eligible).toBe(0);
    expect(useEditorStore.getState().controls.pad1.w).toBe(40);
  });

  it('scales w and h by the factor', () => {
    useEditorStore.getState().setSelectedIds(['pad1', 'pad2']);
    useEditorStore.getState().scaleSelectedControls(0.75);
    const p1 = useEditorStore.getState().controls.pad1;
    expect(p1.w).toBeCloseTo(30, 3); // 40 * 0.75
    expect(p1.h).toBeCloseTo(30, 3);
    const p2 = useEditorStore.getState().controls.pad2;
    expect(p2.w).toBeCloseTo(30, 3);
    expect(p2.h).toBeCloseTo(30, 3);
  });

  it('preserves center (x and y shift to keep midpoint constant)', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    const before = useEditorStore.getState().controls.pad1;
    const centerBefore = { x: before.x + before.w / 2, y: before.y + before.h / 2 };
    useEditorStore.getState().scaleSelectedControls(0.5);
    const after = useEditorStore.getState().controls.pad1;
    const centerAfter = { x: after.x + after.w / 2, y: after.y + after.h / 2 };
    expect(centerAfter.x).toBeCloseTo(centerBefore.x, 3);
    expect(centerAfter.y).toBeCloseTo(centerBefore.y, 3);
  });

  it('scales labelFontSize proportionally', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.75); // 10 * 0.75 = 7.5 (no clamp)
    expect(useEditorStore.getState().controls.pad1.labelFontSize).toBeCloseTo(7.5, 3);
  });

  it('clamps labelFontSize to 6px minimum', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.4); // 10 * 0.4 = 4 → clamp 6
    expect(useEditorStore.getState().controls.pad1.labelFontSize).toBe(6);
  });

  it('clamps size to 8px minimum', () => {
    useEditorStore.getState().setSelectedIds(['tinyButton']); // 12x12
    useEditorStore.getState().scaleSelectedControls(0.5); // → 6x6 → clamp 8
    expect(useEditorStore.getState().controls.tinyButton.w).toBe(8);
    expect(useEditorStore.getState().controls.tinyButton.h).toBe(8);
  });

  it('skips screens (fixed-aspect display content)', () => {
    useEditorStore.getState().setSelectedIds(['screen1', 'pad1']);
    const result = useEditorStore.getState().scaleSelectedControls(0.5);
    expect(result.skipped).toBe(1);
    expect(result.eligible).toBe(1);
    expect(useEditorStore.getState().controls.screen1.w).toBe(200); // unchanged
    expect(useEditorStore.getState().controls.pad1.w).toBeCloseTo(20, 3);
  });

  it('skips locked controls', () => {
    useEditorStore.getState().setSelectedIds(['lockedKnob', 'knob1']);
    const result = useEditorStore.getState().scaleSelectedControls(0.5);
    expect(result.skipped).toBe(1);
    expect(result.eligible).toBe(1);
    expect(useEditorStore.getState().controls.lockedKnob.w).toBe(30); // unchanged
    expect(useEditorStore.getState().controls.knob1.w).toBe(15);
  });

  it('reports counts for toast use', () => {
    useEditorStore.getState().setSelectedIds(['pad1', 'pad2', 'screen1', 'lockedKnob', 'tinyButton']);
    const result = useEditorStore.getState().scaleSelectedControls(0.4); // 10*0.4=4 (font clamp), 12*0.4=4.8 (size clamp on tinyButton)
    expect(result.eligible).toBe(3); // pad1, pad2, tinyButton (screen + locked skipped)
    expect(result.skipped).toBe(2); // screen1, lockedKnob
    expect(result.sizeClamped).toBe(1); // tinyButton
    expect(result.fontClamped).toBe(2); // pad1, pad2 had labelFontSize 10
  });

  it('grows controls (factor > 1)', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(1.25);
    expect(useEditorStore.getState().controls.pad1.w).toBeCloseTo(50, 3);
    expect(useEditorStore.getState().controls.pad1.h).toBeCloseTo(50, 3);
  });

  it('does not touch unselected controls', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    expect(useEditorStore.getState().controls.knob1.w).toBe(30); // knob1 not selected
    expect(useEditorStore.getState().controls.pad2.w).toBe(40);
  });

  it('factor < 1 and factor > 1 are both supported (idempotent direction)', () => {
    useEditorStore.getState().setSelectedIds(['pad1']);
    useEditorStore.getState().scaleSelectedControls(0.5);
    expect(useEditorStore.getState().controls.pad1.w).toBeCloseTo(20, 3);
    useEditorStore.getState().scaleSelectedControls(2);
    expect(useEditorStore.getState().controls.pad1.w).toBeCloseTo(40, 3);
  });
});
