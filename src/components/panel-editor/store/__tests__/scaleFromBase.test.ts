/**
 * Unit tests for drift-free scaling (scaleFromBase + Layout-Base Memory).
 *
 * These tests prove:
 *   1. Repeated scale ops never accumulate rounding drift — returning to
 *      100% of original gives EXACT original positions
 *   2. Linked label offsets stay correct across cycles
 *   3. Containers, guides, sections all scale congruently with controls
 *   4. Every position-mutating action clears scaleBase (regression coverage)
 *   5. Undo/redo carries scaleBase + factor atomically
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';
import type { ControlDef, SectionDef, ControlContainer } from '../manifestSlice';
import type { EditorLabel } from '../historySlice';

// ─── Test fixtures ─────────────────────────────────────────────────────────

function makeControl(id: string, x: number, y: number, w = 64, h = 64): ControlDef {
  return {
    id,
    label: id,
    type: 'knob',
    x,
    y,
    w,
    h,
    sectionId: 'sec-1',
    labelPosition: 'below',
    locked: false,
  };
}

function makeSection(id: string, x: number, y: number, w: number, h: number): SectionDef {
  return {
    id,
    headerLabel: id,
    archetype: 'uniform-row',
    x,
    y,
    w,
    h,
    childIds: [],
  };
}

function makeLabel(id: string, controlId: string | null, x: number, y: number, fontSize = 12): EditorLabel {
  return { id, controlId, text: id, x, y, fontSize, align: 'center' };
}

function makeContainer(id: string, x: number, y: number, w: number, h: number): ControlContainer {
  return { id, controlIds: [], style: 'recessed', x, y, w, h, borderRadius: 4 };
}

// Reset the store to a known fixture before every test.
function seedStore() {
  const ctrlA = makeControl('ctrl-a', 101, 203, 64, 64);
  const ctrlB = makeControl('ctrl-b', 305, 99, 32, 32);
  const ctrlC = makeControl('ctrl-c', 17, 511, 96, 24);

  useEditorStore.setState({
    controls: { 'ctrl-a': ctrlA, 'ctrl-b': ctrlB, 'ctrl-c': ctrlC },
    sections: {
      'sec-1': makeSection('sec-1', 50, 100, 800, 400),
      'sec-2': makeSection('sec-2', 0, 600, 1000, 200),
    },
    editorLabels: [
      makeLabel('lbl-a', 'ctrl-a', 109, 271, 12),  // linked, +8/+68 offset
      makeLabel('lbl-free', null, 700, 700, 11),    // standalone
    ],
    controlContainers: [
      makeContainer('cont-1', 75, 125, 200, 100),
    ],
    guides: [
      { id: 'g-h', orientation: 'horizontal', position: 250 },
      { id: 'g-v', orientation: 'vertical', position: 600 },
    ],
    canvasWidth: 1000,
    canvasHeight: 800,
    selectedIds: [],
    lockedIds: [],
    keyboard: null,
    past: [],
    future: [],
    scaleBase: null,
    scaleCumulativeFactor: 1.0,
  } as any);
}

function snapshotPositions() {
  const s = useEditorStore.getState();
  return {
    controls: Object.fromEntries(
      Object.entries(s.controls).map(([id, c]) => [id, { x: c.x, y: c.y, w: c.w, h: c.h }]),
    ),
    sections: Object.fromEntries(
      Object.entries(s.sections).map(([id, sec]) => [id, { x: sec.x, y: sec.y, w: sec.w, h: sec.h }]),
    ),
    labels: (s.editorLabels as EditorLabel[]).map((l) => ({ id: l.id, x: l.x, y: l.y, fontSize: l.fontSize })),
    containers: s.controlContainers.map((c) => ({ id: c.id, x: c.x, y: c.y, w: c.w, h: c.h })),
    guides: s.guides.map((g) => ({ id: g.id, position: g.position })),
    canvasWidth: s.canvasWidth,
    canvasHeight: s.canvasHeight,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('scaleFromBase — drift-free scaling', () => {
  beforeEach(() => {
    seedStore();
  });

  it('captures base on first call and applies factor exactly', () => {
    const before = snapshotPositions();
    useEditorStore.getState().scaleFromBase(0.5);
    const s = useEditorStore.getState();

    expect(s.scaleCumulativeFactor).toBe(0.5);
    expect(s.scaleBase).not.toBeNull();
    expect(s.controls['ctrl-a'].x).toBe(Math.round(before.controls['ctrl-a'].x * 0.5));
    expect(s.controls['ctrl-a'].y).toBe(Math.round(before.controls['ctrl-a'].y * 0.5));
  });

  it('PURE RECOVERY: 0.5 then 1.0 returns to EXACT original (no drift)', () => {
    const before = snapshotPositions();

    useEditorStore.getState().scaleFromBase(0.5);
    useEditorStore.getState().scaleFromBase(1.0);

    const after = snapshotPositions();
    expect(after).toEqual(before);
  });

  it('MULTI-CYCLE: messy factor sequence returns to EXACT original at 100%', () => {
    const before = snapshotPositions();

    // Sequence the original scaleCanvas would have drifted on
    useEditorStore.getState().scaleFromBase(0.7);
    useEditorStore.getState().scaleFromBase(1.45);
    useEditorStore.getState().scaleFromBase(0.4);
    useEditorStore.getState().scaleFromBase(2.0);
    useEditorStore.getState().scaleFromBase(0.73);
    useEditorStore.getState().scaleFromBase(1.0);

    const after = snapshotPositions();
    expect(after).toEqual(before);
  });

  it('SINGLE ROUND: max error per coord per op is ≤ 0.5px from base × factor', () => {
    const before = snapshotPositions();
    const factor = 0.737;
    useEditorStore.getState().scaleFromBase(factor);
    const after = snapshotPositions();

    for (const id of Object.keys(before.controls)) {
      const expectedX = before.controls[id].x * factor;
      const expectedY = before.controls[id].y * factor;
      expect(Math.abs(after.controls[id].x - expectedX)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(after.controls[id].y - expectedY)).toBeLessThanOrEqual(0.5);
    }
  });

  it('LINKED LABEL OFFSETS preserved across multi-cycle scale', () => {
    const before = snapshotPositions();
    const lblBefore = before.labels.find((l) => l.id === 'lbl-a')!;
    const ctrlBefore = before.controls['ctrl-a'];
    const offsetX = lblBefore.x - ctrlBefore.x;
    const offsetY = lblBefore.y - ctrlBefore.y;

    useEditorStore.getState().scaleFromBase(0.7);
    useEditorStore.getState().scaleFromBase(1.45);
    useEditorStore.getState().scaleFromBase(1.0);

    const after = snapshotPositions();
    const lblAfter = after.labels.find((l) => l.id === 'lbl-a')!;
    expect(lblAfter.x - after.controls['ctrl-a'].x).toBe(offsetX);
    expect(lblAfter.y - after.controls['ctrl-a'].y).toBe(offsetY);
  });

  it('CONTAINERS scale congruently with controls (containers/controls stay aligned)', () => {
    const before = snapshotPositions();
    useEditorStore.getState().scaleFromBase(0.5);
    const after = snapshotPositions();

    expect(after.containers[0].x).toBe(Math.round(before.containers[0].x * 0.5));
    expect(after.containers[0].y).toBe(Math.round(before.containers[0].y * 0.5));
    expect(after.containers[0].w).toBe(Math.round(before.containers[0].w * 0.5));
    expect(after.containers[0].h).toBe(Math.round(before.containers[0].h * 0.5));
  });

  it('GUIDES scale with positions', () => {
    const before = snapshotPositions();
    useEditorStore.getState().scaleFromBase(2.0);
    const after = snapshotPositions();

    expect(after.guides[0].position).toBe(before.guides[0].position * 2);
    expect(after.guides[1].position).toBe(before.guides[1].position * 2);
  });

  it('CANVAS DIMS scale and snap back to original', () => {
    const before = snapshotPositions();
    useEditorStore.getState().scaleFromBase(0.6);
    useEditorStore.getState().scaleFromBase(1.0);
    const after = snapshotPositions();

    expect(after.canvasWidth).toBe(before.canvasWidth);
    expect(after.canvasHeight).toBe(before.canvasHeight);
  });

  it('NO-OP at 100% is harmless when no base captured (factor stays 1.0)', () => {
    useEditorStore.getState().scaleFromBase(1.0);
    expect(useEditorStore.getState().scaleCumulativeFactor).toBe(1.0);
  });

  it('SUBSEQUENT scale uses previously-captured base (factor tracks correctly)', () => {
    useEditorStore.getState().scaleFromBase(0.5);
    const baseAfter1 = useEditorStore.getState().scaleBase;
    useEditorStore.getState().scaleFromBase(1.5);
    const baseAfter2 = useEditorStore.getState().scaleBase;

    expect(baseAfter1).toBe(baseAfter2); // same reference — base wasn't recaptured
    expect(useEditorStore.getState().scaleCumulativeFactor).toBe(1.5);
  });
});

describe('clearScaleBase — every mutating action invalidates the base', () => {
  beforeEach(() => {
    seedStore();
    // Set scaleBase to a sentinel so we can detect clearing
    useEditorStore.getState().scaleFromBase(0.5);
    expect(useEditorStore.getState().scaleBase).not.toBeNull();
  });

  it('moveControl clears scaleBase', () => {
    useEditorStore.getState().moveControl('ctrl-a', 5, 5);
    expect(useEditorStore.getState().scaleBase).toBeNull();
    expect(useEditorStore.getState().scaleCumulativeFactor).toBe(1.0);
  });

  it('resizeControl clears scaleBase', () => {
    useEditorStore.getState().resizeControl('ctrl-a', 100, 100);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('moveSection clears scaleBase', () => {
    useEditorStore.getState().moveSection('sec-1', 10, 10);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('addStandaloneLabel clears scaleBase', () => {
    useEditorStore.getState().addStandaloneLabel(50, 50, 'New label');
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('moveLabel clears scaleBase', () => {
    useEditorStore.getState().moveLabel('lbl-free', 5, 5);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('addContainer clears scaleBase', () => {
    useEditorStore.getState().addContainer(100, 100, 50, 50);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('moveContainer clears scaleBase', () => {
    useEditorStore.getState().moveContainer('cont-1', 5, 5);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('resizeContainer clears scaleBase', () => {
    useEditorStore.getState().resizeContainer('cont-1', 300, 200);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('setCanvasSize clears scaleBase', () => {
    useEditorStore.getState().setCanvasSize(1500, 1000);
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });

  it('alignControls clears scaleBase', () => {
    useEditorStore.setState({ selectedIds: ['ctrl-a', 'ctrl-b'] });
    useEditorStore.getState().alignControls('left');
    expect(useEditorStore.getState().scaleBase).toBeNull();
  });
});

describe('scaleFromBase — preserves drag/resize between scale ops', () => {
  beforeEach(() => seedStore());

  it('drag clears base; next scale captures new base from current state', () => {
    useEditorStore.getState().scaleFromBase(0.5);
    expect(useEditorStore.getState().scaleBase).not.toBeNull();

    // User moves a control mid-scale-session
    useEditorStore.getState().moveControl('ctrl-a', 100, 100);
    expect(useEditorStore.getState().scaleBase).toBeNull();

    const movedX = useEditorStore.getState().controls['ctrl-a'].x;
    const movedY = useEditorStore.getState().controls['ctrl-a'].y;

    // Next scale captures the moved state as the new base
    useEditorStore.getState().scaleFromBase(2.0);
    expect(useEditorStore.getState().controls['ctrl-a'].x).toBe(movedX * 2);
    expect(useEditorStore.getState().controls['ctrl-a'].y).toBe(movedY * 2);

    // And returning to 100% gives the moved positions exactly
    useEditorStore.getState().scaleFromBase(1.0);
    expect(useEditorStore.getState().controls['ctrl-a'].x).toBe(movedX);
    expect(useEditorStore.getState().controls['ctrl-a'].y).toBe(movedY);
  });
});

describe('scaleCanvas — relative shim delegates to scaleFromBase drift-free', () => {
  beforeEach(() => seedStore());

  it('toolbar shrink (×0.8) followed by grow (×1.25) recovers exactly', () => {
    const before = snapshotPositions();
    useEditorStore.getState().scaleCanvas(0.8);
    useEditorStore.getState().scaleCanvas(1.25);
    const after = snapshotPositions();

    expect(after.controls['ctrl-a']).toEqual(before.controls['ctrl-a']);
    expect(after.controls['ctrl-b']).toEqual(before.controls['ctrl-b']);
    expect(after.canvasWidth).toBe(before.canvasWidth);
  });

  it('factor of 1 or non-positive is a no-op', () => {
    const before = snapshotPositions();
    useEditorStore.getState().scaleCanvas(1);
    useEditorStore.getState().scaleCanvas(0);
    useEditorStore.getState().scaleCanvas(-1);
    expect(snapshotPositions()).toEqual(before);
  });
});

describe('history snapshot — scaleBase + factor travel with undo/redo', () => {
  beforeEach(() => seedStore());

  it('undo restores scaleBase and cumulativeFactor atomically', () => {
    const beforeAny = snapshotPositions();

    // Snapshot before scaling
    useEditorStore.getState().pushSnapshot();
    useEditorStore.getState().scaleFromBase(0.5);
    expect(useEditorStore.getState().scaleCumulativeFactor).toBe(0.5);

    // Snapshot before second op
    useEditorStore.getState().pushSnapshot();
    useEditorStore.getState().scaleFromBase(1.5);
    expect(useEditorStore.getState().scaleCumulativeFactor).toBe(1.5);

    // Undo once → back to 0.5 state
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().scaleCumulativeFactor).toBe(0.5);

    // Undo again → back to original (factor=1.0, base=null)
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().scaleCumulativeFactor).toBe(1.0);
    expect(useEditorStore.getState().scaleBase).toBeNull();
    expect(snapshotPositions()).toEqual(beforeAny);
  });
});
