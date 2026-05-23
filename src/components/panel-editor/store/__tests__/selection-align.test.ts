import { describe, it, expect } from 'vitest';
import type { SelectableId } from '../selection-types';
import {
  planAlignment,
  applyAlignToRect,
  planDistribution,
  type AlignInput,
  type DistributeInput,
} from '../selection-align';

/**
 * Phase 7 — alignment + distribution invariants.
 *
 * Covers the full decision table:
 *   - Pure standalone labels → bbox mode
 *   - 1 control + N labels → auto-anchor (labels align to control)
 *   - N controls + M labels → auto-anchor (labels align to controls' bbox)
 *   - Linked labels in selection → skipped, surfaced via linkedLabelIds
 *   - Explicit bbox mode (Shift+Align) → ignores anchor, treats uniformly
 *   - Only linked labels selected → no-op
 *   - Distribute: standalone only, 3+ required
 */

function ctrl(id: string, x: number, y: number, w = 40, h = 30, locked = false) {
  return { [id]: { x, y, w, h, locked } } as const;
}

function lbl(
  id: string,
  x: number,
  y: number,
  w = 50,
  h = 12,
  controlId: string | null = null,
) {
  return { id, x, y, w, h, controlId };
}

describe('planAlignment — anchor mode (auto)', () => {
  it('1 control + 2 standalone labels: labels align to control top, control stays', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'label:l1', 'label:l2'] as SelectableId[],
      controls: ctrl('c1', 100, 50),
      editorLabels: [lbl('l1', 80, 200), lbl('l2', 160, 220)],
    };
    const plan = planAlignment(input, 'top');
    expect(plan.resolvedAnchor).toBe('auto');
    expect(plan.target).toBe(50); // control's top
    expect(plan.movableLabelIds).toEqual(['l1', 'l2']);
    expect(plan.movableControlIds).toEqual([]); // control doesn't move
    expect(plan.hasAnchorControls).toBe(true);
  });

  it('N controls + M labels: labels align to controls bbox top', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'control:c2', 'label:l1'] as SelectableId[],
      controls: { ...ctrl('c1', 100, 50)['c1' as never], ...ctrl('c2', 200, 70) } as any,
      editorLabels: [lbl('l1', 100, 200)],
    };
    // Need to flatten controls properly
    input.controls = { c1: { x: 100, y: 50, w: 40, h: 30 }, c2: { x: 200, y: 70, w: 40, h: 30 } };
    const plan = planAlignment(input, 'top');
    expect(plan.resolvedAnchor).toBe('auto');
    expect(plan.target).toBe(50); // min(50, 70) = c1's top
    expect(plan.movableLabelIds).toEqual(['l1']);
    expect(plan.movableControlIds).toEqual([]);
  });

  it('align center-x: label center matches control center, control stays put', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'label:l1'] as SelectableId[],
      controls: { c1: { x: 100, y: 50, w: 40, h: 30 } },
      editorLabels: [lbl('l1', 0, 100, 60, 12)],
    };
    const plan = planAlignment(input, 'center-x');
    expect(plan.target).toBe(120); // 100 + 40/2 = center of c1
    expect(plan.movableLabelIds).toEqual(['l1']);

    const lblRect = { x: 0, y: 100, w: 60, h: 12 };
    const after = applyAlignToRect(lblRect, 'center-x', plan.target!);
    expect(after.x).toBe(90); // 120 - 60/2 = 90, label centers on 120
    expect(after.y).toBe(100); // y unchanged
  });
});

describe('planAlignment — bbox mode (pure labels)', () => {
  it('only standalone labels: bbox mode kicks in automatically', () => {
    const input: AlignInput = {
      selection: ['label:l1', 'label:l2', 'label:l3'] as SelectableId[],
      controls: {},
      editorLabels: [lbl('l1', 0, 50), lbl('l2', 100, 30), lbl('l3', 200, 70)],
    };
    const plan = planAlignment(input, 'top');
    expect(plan.resolvedAnchor).toBe('bbox');
    expect(plan.target).toBe(30); // topmost = l2
    expect(plan.movableLabelIds).toEqual(['l1', 'l2', 'l3']);
    expect(plan.hasAnchorControls).toBe(false);
  });
});

describe('planAlignment — explicit bbox mode (Shift+Align)', () => {
  it('control + labels with anchor=bbox: treats all uniformly', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'label:l1', 'label:l2'] as SelectableId[],
      controls: { c1: { x: 100, y: 50, w: 40, h: 30 } },
      editorLabels: [lbl('l1', 0, 100), lbl('l2', 200, 80)],
    };
    const plan = planAlignment(input, 'top', { anchor: 'bbox' });
    expect(plan.resolvedAnchor).toBe('bbox');
    expect(plan.target).toBe(50); // bbox top = control's top
    // In bbox mode, control MIGHT move; standalone labels also move.
    expect(plan.movableControlIds).toEqual(['c1']);
    expect(plan.movableLabelIds).toEqual(['l1', 'l2']);
  });
});

describe('planAlignment — linked labels anchor but never move', () => {
  it('linked label in selection: anchors the alignment but is not moved', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'label:linked', 'label:standalone'] as SelectableId[],
      controls: { c1: { x: 100, y: 50, w: 40, h: 30 } },
      editorLabels: [
        // Linked label at y=200 — should anchor (control top is 50, linked top is 200)
        lbl('linked', 200, 200, 50, 12, 'someOtherCtrl'),
        lbl('standalone', 0, 100, 50, 12, null),
      ],
    };
    const plan = planAlignment(input, 'top');
    expect(plan.linkedLabelIds).toEqual(['linked']);
    expect(plan.movableLabelIds).toEqual(['standalone']);
    // Anchor edge = min(control.y=50, linked.y=200) = 50 (control wins for top)
    expect(plan.target).toBe(50);
  });

  it('only linked labels selected → linked labels anchor; standalone has nothing to align', () => {
    const input: AlignInput = {
      selection: ['label:linkedA', 'label:linkedB'] as SelectableId[],
      controls: {},
      editorLabels: [
        lbl('linkedA', 0, 50, 50, 12, 'c1'),
        lbl('linkedB', 100, 70, 50, 12, 'c2'),
      ],
    };
    const plan = planAlignment(input, 'top');
    expect(plan.movableLabelIds).toEqual([]); // no standalone to move
    expect(plan.linkedLabelIds).toEqual(['linkedA', 'linkedB']);
    // resolvedAnchor is 'auto' (linked labels DO act as anchors now), target
    // resolves to topmost linked (y=50) but no movables.
    expect(plan.resolvedAnchor).toBe('auto');
  });

  it('1 linked label + 2 standalone: standalone align to linked label (user-asked behavior)', () => {
    const input: AlignInput = {
      selection: ['label:linked', 'label:a', 'label:b'] as SelectableId[],
      controls: {},
      editorLabels: [
        lbl('linked', 100, 200, 50, 12, 'c1'),  // anchor
        lbl('a', 0, 50, 50, 12, null),           // will move
        lbl('b', 200, 80, 50, 12, null),         // will move
      ],
    };
    const plan = planAlignment(input, 'top');
    expect(plan.target).toBe(200); // linked label's y = anchor target
    expect(plan.movableLabelIds).toEqual(['a', 'b']);
    expect(plan.movableControlIds).toEqual([]);
  });
});

describe('planAlignment — controlScale (visible vs bbox)', () => {
  it('controlScale=0.3: align-bottom uses VISIBLE rect (control.h * 0.3), not bbox', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'label:l1'] as SelectableId[],
      controls: { c1: { x: 100, y: 50, w: 100, h: 300 } }, // tall bbox
      editorLabels: [lbl('l1', 0, 500, 50, 12)],
      controlScale: 0.3,
    };
    const plan = planAlignment(input, 'bottom');
    // visible bottom = 50 + 300*0.3 = 50 + 90 = 140 (NOT 50 + 300 = 350)
    expect(plan.target).toBe(140);
  });

  it('controlScale=1 (default): align-bottom uses full bbox', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'label:l1'] as SelectableId[],
      controls: { c1: { x: 100, y: 50, w: 100, h: 300 } },
      editorLabels: [lbl('l1', 0, 500, 50, 12)],
      // no controlScale → defaults to 1
    };
    const plan = planAlignment(input, 'bottom');
    expect(plan.target).toBe(350); // 50 + 300
  });

  it('controlScale=0.3: align-right uses visible width', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'label:l1'] as SelectableId[],
      controls: { c1: { x: 100, y: 50, w: 200, h: 50 } },
      editorLabels: [lbl('l1', 0, 50)],
      controlScale: 0.3,
    };
    const plan = planAlignment(input, 'right');
    expect(plan.target).toBe(160); // 100 + 200*0.3 = 160
  });
});

describe('planAlignment — edge cases', () => {
  it('1 control + 0 standalone labels = no-op (nothing to align)', () => {
    const input: AlignInput = {
      selection: ['control:c1'] as SelectableId[],
      controls: { c1: { x: 100, y: 50, w: 40, h: 30 } },
      editorLabels: [],
    };
    const plan = planAlignment(input, 'top');
    expect(plan.movableLabelIds).toEqual([]);
    expect(plan.target).toBeNull();
  });

  it('locked controls are excluded from anchor computation', () => {
    const input: AlignInput = {
      selection: ['control:c1', 'control:c2', 'label:l1'] as SelectableId[],
      controls: {
        c1: { x: 100, y: 50, w: 40, h: 30, locked: true }, // locked → ignored
        c2: { x: 200, y: 70, w: 40, h: 30 },
      },
      editorLabels: [lbl('l1', 0, 200)],
    };
    const plan = planAlignment(input, 'top');
    expect(plan.target).toBe(70); // c2 alone (c1 locked)
    expect(plan.movableLabelIds).toEqual(['l1']);
  });
});

describe('applyAlignToRect', () => {
  const rect = { x: 50, y: 100, w: 40, h: 30 };

  it('left: rect.x = target, y unchanged', () => {
    expect(applyAlignToRect(rect, 'left', 200)).toEqual({ x: 200, y: 100 });
  });

  it('right: rect.x = target - rect.w', () => {
    expect(applyAlignToRect(rect, 'right', 200)).toEqual({ x: 160, y: 100 });
  });

  it('center-x: rect.x = target - rect.w/2', () => {
    expect(applyAlignToRect(rect, 'center-x', 200)).toEqual({ x: 180, y: 100 });
  });

  it('top: rect.y = target, x unchanged', () => {
    expect(applyAlignToRect(rect, 'top', 50)).toEqual({ x: 50, y: 50 });
  });

  it('bottom: rect.y = target - rect.h', () => {
    expect(applyAlignToRect(rect, 'bottom', 200)).toEqual({ x: 50, y: 170 });
  });

  it('center-y: rect.y = target - rect.h/2', () => {
    expect(applyAlignToRect(rect, 'center-y', 100)).toEqual({ x: 50, y: 85 });
  });
});

describe('planDistribution', () => {
  it('3 standalone labels horizontal: endpoints stay, middle one centers', () => {
    const input: DistributeInput = {
      selection: ['label:a', 'label:b', 'label:c'] as SelectableId[],
      editorLabels: [
        lbl('a', 0, 50),
        lbl('b', 70, 50), // currently off-center
        lbl('c', 100, 50),
      ],
    };
    const plan = planDistribution(input, 'horizontal');
    expect(plan.updates).toHaveLength(1); // only middle one moves
    expect(plan.updates[0].id).toBe('b');
    expect(plan.updates[0].x).toBe(50); // midpoint between 0 and 100
  });

  it('4 labels horizontal: 2 middle ones distribute at 1/3 and 2/3', () => {
    const input: DistributeInput = {
      selection: ['label:a', 'label:b', 'label:c', 'label:d'] as SelectableId[],
      editorLabels: [
        lbl('a', 0, 50),
        lbl('b', 25, 50),
        lbl('c', 80, 50),
        lbl('d', 300, 50),
      ],
    };
    const plan = planDistribution(input, 'horizontal');
    expect(plan.updates).toHaveLength(2);
    // a stays at 0, d stays at 300, step = 100
    expect(plan.updates.find((u) => u.id === 'b')?.x).toBe(100);
    expect(plan.updates.find((u) => u.id === 'c')?.x).toBe(200);
  });

  it('3 standalone labels vertical: middle one centers vertically', () => {
    const input: DistributeInput = {
      selection: ['label:a', 'label:b', 'label:c'] as SelectableId[],
      editorLabels: [
        lbl('a', 50, 0),
        lbl('b', 50, 30),
        lbl('c', 50, 100),
      ],
    };
    const plan = planDistribution(input, 'vertical');
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].y).toBe(50);
  });

  it('linked labels are skipped from distribution', () => {
    const input: DistributeInput = {
      selection: ['label:a', 'label:linked', 'label:c'] as SelectableId[],
      editorLabels: [
        lbl('a', 0, 50),
        lbl('linked', 50, 50, 50, 12, 'someCtrl'),
        lbl('c', 100, 50),
      ],
    };
    const plan = planDistribution(input, 'horizontal');
    // Only 2 standalone — needs 3+ → no updates
    expect(plan.updates).toEqual([]);
    expect(plan.linkedLabelIds).toEqual(['linked']);
  });

  it('fewer than 3 standalone labels: no-op', () => {
    const input: DistributeInput = {
      selection: ['label:a', 'label:b'] as SelectableId[],
      editorLabels: [lbl('a', 0, 50), lbl('b', 100, 50)],
    };
    const plan = planDistribution(input, 'horizontal');
    expect(plan.updates).toEqual([]);
  });
});
