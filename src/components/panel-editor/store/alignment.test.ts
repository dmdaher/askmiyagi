import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './index';

function resetStore() {
  useEditorStore.setState({
    controls: {
      a: { id: 'a', x: 10, y: 20, w: 40, h: 30, sectionId: 's1', label: 'A', type: 'button', labelPosition: 'above', locked: false },
      b: { id: 'b', x: 100, y: 50, w: 40, h: 30, sectionId: 's1', label: 'B', type: 'button', labelPosition: 'above', locked: false },
      c: { id: 'c', x: 60, y: 80, w: 40, h: 30, sectionId: 's1', label: 'C', type: 'button', labelPosition: 'above', locked: false },
      locked: { id: 'locked', x: 200, y: 200, w: 40, h: 30, sectionId: 's1', label: 'L', type: 'button', labelPosition: 'above', locked: true },
    },
    selectedIds: ['a', 'b', 'c'],
    lockedIds: ['locked'],
    controlGroups: [],
  } as any);
}

// ─── alignControls ──────────────────────────────────────────────────────────

describe('alignControls', () => {
  beforeEach(resetStore);

  it('aligns left (all x = min x)', () => {
    useEditorStore.getState().alignControls('left');
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(10);
    expect(controls.b.x).toBe(10);
    expect(controls.c.x).toBe(10);
  });

  it('aligns right (all right edges = max right edge)', () => {
    // right edges: a=50, b=140, c=100 → max=140
    useEditorStore.getState().alignControls('right');
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(100); // 140 - 40
    expect(controls.b.x).toBe(100); // 140 - 40
    expect(controls.c.x).toBe(100); // 140 - 40
  });

  it('aligns center-x (all center-x = avg center-x)', () => {
    // centers: a=30, b=120, c=80 → avg=76.67
    useEditorStore.getState().alignControls('center-x');
    const { controls } = useEditorStore.getState();
    const avgCx = Math.round((30 + 120 + 80) / 3);
    expect(controls.a.x).toBe(avgCx - 20);
    expect(controls.b.x).toBe(avgCx - 20);
    expect(controls.c.x).toBe(avgCx - 20);
  });

  it('aligns top (all y = min y)', () => {
    useEditorStore.getState().alignControls('top');
    const { controls } = useEditorStore.getState();
    expect(controls.a.y).toBe(20);
    expect(controls.b.y).toBe(20);
    expect(controls.c.y).toBe(20);
  });

  it('aligns bottom (all bottom edges = max bottom edge)', () => {
    // bottom edges: a=50, b=80, c=110 → max=110
    useEditorStore.getState().alignControls('bottom');
    const { controls } = useEditorStore.getState();
    expect(controls.a.y).toBe(80);  // 110 - 30
    expect(controls.b.y).toBe(80);  // 110 - 30
    expect(controls.c.y).toBe(80);  // 110 - 30
  });

  it('aligns center-y (all center-y = avg center-y)', () => {
    // centers: a=35, b=65, c=95 → avg=65
    useEditorStore.getState().alignControls('center-y');
    const { controls } = useEditorStore.getState();
    const avgCy = Math.round((35 + 65 + 95) / 3);
    expect(controls.a.y).toBe(avgCy - 15);
    expect(controls.b.y).toBe(avgCy - 15);
    expect(controls.c.y).toBe(avgCy - 15);
  });

  it('skips locked controls', () => {
    useEditorStore.setState({ selectedIds: ['a', 'b', 'c', 'locked'] });
    useEditorStore.getState().alignControls('left');
    const { controls } = useEditorStore.getState();
    // a, b, c aligned; locked unchanged
    expect(controls.a.x).toBe(10);
    expect(controls.b.x).toBe(10);
    expect(controls.c.x).toBe(10);
    expect(controls.locked.x).toBe(200);
  });

  it('no-ops with < 2 selected', () => {
    useEditorStore.setState({ selectedIds: ['a'] });
    useEditorStore.getState().alignControls('left');
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(10); // unchanged
  });

  it('centers linked labels on their controls after alignment', () => {
    useEditorStore.setState({
      editorLabels: [
        { id: 'la', controlId: 'a', text: 'Label A', x: 5, y: 10, w: 40, fontSize: 8, align: 'left' },
        { id: 'lb', controlId: 'b', text: 'Label B', x: 90, y: 40, w: 40, fontSize: 8, align: 'left' },
        { id: 'ls', controlId: null, text: 'Standalone', x: 200, y: 200, w: 60, fontSize: 8, align: 'center' },
      ],
      controlScale: 1,
    } as any);

    useEditorStore.getState().alignControls('left');
    const { editorLabels } = useEditorStore.getState();

    const la = (editorLabels as any[]).find((l: any) => l.id === 'la');
    const lb = (editorLabels as any[]).find((l: any) => l.id === 'lb');
    const ls = (editorLabels as any[]).find((l: any) => l.id === 'ls');

    // X centered: all controls at x=10, w=40 → center=30, labelW=60 → x=0
    expect(la.align).toBe('center');
    expect(la.w).toBe(60);
    expect(la.x).toBe(0);
    expect(lb.x).toBe(0);

    // Standalone unchanged
    expect(ls.x).toBe(200);
  });

  it('snaps label Y positions when controls form a horizontal row', () => {
    // 3 controls in a horizontal row (same Y, different X)
    useEditorStore.setState({
      controls: {
        a: { id: 'a', x: 10, y: 100, w: 40, h: 30, sectionId: 's1', label: 'A', type: 'button', labelPosition: 'above', locked: false },
        b: { id: 'b', x: 100, y: 102, w: 40, h: 30, sectionId: 's1', label: 'B', type: 'button', labelPosition: 'above', locked: false },
        c: { id: 'c', x: 200, y: 98, w: 40, h: 30, sectionId: 's1', label: 'C', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['a', 'b', 'c'],
      lockedIds: [],
      editorLabels: [
        { id: 'la', controlId: 'a', text: 'ZONE 1', x: 5, y: 85, w: 40, fontSize: 8, align: 'center' },
        { id: 'lb', controlId: 'b', text: 'ZONE 2', x: 90, y: 92, w: 40, fontSize: 8, align: 'center' },
        { id: 'lc', controlId: 'c', text: 'ZONE 3', x: 195, y: 88, w: 40, fontSize: 8, align: 'center' },
      ],
      controlScale: 1,
    } as any);

    useEditorStore.getState().alignControls('top');
    const { editorLabels } = useEditorStore.getState();
    const la = (editorLabels as any[]).find((l: any) => l.id === 'la');
    const lb = (editorLabels as any[]).find((l: any) => l.id === 'lb');
    const lc = (editorLabels as any[]).find((l: any) => l.id === 'lc');

    // Controls form a horizontal row (Y spread = 4, avg H = 30, 4 < 15) → Y-snap applies
    // All labels were above their controls → snap to min Y = 85
    expect(la.y).toBe(85);
    expect(lb.y).toBe(85);
    expect(lc.y).toBe(85);
  });

  it('does NOT snap label Y when controls form a vertical column', () => {
    // 3 controls stacked vertically (same X, different Y) — user's actual use case
    useEditorStore.setState({
      controls: {
        a: { id: 'a', x: 100, y: 10, w: 40, h: 30, sectionId: 's1', label: 'A', type: 'button', labelPosition: 'above', locked: false },
        b: { id: 'b', x: 105, y: 50, w: 40, h: 30, sectionId: 's1', label: 'B', type: 'button', labelPosition: 'above', locked: false },
        c: { id: 'c', x: 95, y: 90, w: 40, h: 30, sectionId: 's1', label: 'C', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['a', 'b', 'c'],
      lockedIds: [],
      editorLabels: [
        { id: 'la', controlId: 'a', text: 'CTRL', x: 95, y: 0, w: 40, fontSize: 8, align: 'center' },
        { id: 'lb', controlId: 'b', text: 'ASSIGN', x: 100, y: 40, w: 40, fontSize: 8, align: 'center' },
        { id: 'lc', controlId: 'c', text: 'ZONE SEL', x: 90, y: 80, w: 40, fontSize: 8, align: 'center' },
      ],
      controlScale: 1,
    } as any);

    useEditorStore.getState().alignControls('center-x'); // align horizontal centers
    const { editorLabels } = useEditorStore.getState();
    const la = (editorLabels as any[]).find((l: any) => l.id === 'la');
    const lb = (editorLabels as any[]).find((l: any) => l.id === 'lb');
    const lc = (editorLabels as any[]).find((l: any) => l.id === 'lc');

    // Controls form a vertical column (Y spread = 80, X spread = 10, avg H = 30)
    // 80 > 15 AND 10 < 80 → NOT a horizontal row → Y-snap SKIPPED
    // Each label should keep its own Y position
    expect(la.y).toBe(0);
    expect(lb.y).toBe(40);
    expect(lc.y).toBe(80);
  });
});

// ─── distributeWithGap ──────────────────────────────────────────────────────

describe('distributeWithGap', () => {
  beforeEach(resetStore);

  it('distributes horizontally with exact gap from leftmost anchor', () => {
    // a(x=10,w=40), c(x=60,w=40), b(x=100,w=40)
    useEditorStore.getState().distributeWithGap('horizontal', 10);
    const { controls } = useEditorStore.getState();
    // sorted: a(10), c(60), b(100) → a stays at 10
    expect(controls.a.x).toBe(10);   // anchor
    expect(controls.c.x).toBe(60);   // 10 + 40 + 10
    expect(controls.b.x).toBe(110);  // 60 + 40 + 10
  });

  it('distributes vertically with exact gap from topmost anchor', () => {
    useEditorStore.getState().distributeWithGap('vertical', 5);
    const { controls } = useEditorStore.getState();
    // sorted by y: a(20), b(50), c(80) → a stays at 20
    expect(controls.a.y).toBe(20);   // anchor
    expect(controls.b.y).toBe(55);   // 20 + 30 + 5
    expect(controls.c.y).toBe(90);   // 55 + 30 + 5
  });

  it('works with 2 controls', () => {
    useEditorStore.setState({ selectedIds: ['a', 'b'] } as any);
    useEditorStore.getState().distributeWithGap('horizontal', 20);
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(10);   // anchor
    expect(controls.b.x).toBe(70);   // 10 + 40 + 20
  });

  it('works with zero gap', () => {
    useEditorStore.getState().distributeWithGap('horizontal', 0);
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(10);
    expect(controls.c.x).toBe(50);   // 10 + 40 + 0
    expect(controls.b.x).toBe(90);   // 50 + 40 + 0
  });

  it('skips locked controls', () => {
    useEditorStore.setState({ selectedIds: ['a', 'locked'] } as any);
    useEditorStore.getState().distributeWithGap('horizontal', 10);
    expect(useEditorStore.getState().controls.locked.x).toBe(200); // unchanged
  });
});

// ─── alignColumns ────────────────────────────────────────────────────────────

describe('alignColumns', () => {
  it('snaps second row to first row column centers', () => {
    // Row 1: 3 knobs (w=100) at y=100 with gap 20 → centers at 50, 170, 290
    // Row 2: 3 buttons (w=80) at y=200, slightly offset in X
    useEditorStore.setState({
      controls: {
        k1: { id: 'k1', x: 0, y: 100, w: 100, h: 50, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        k2: { id: 'k2', x: 120, y: 100, w: 100, h: 50, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        k3: { id: 'k3', x: 240, y: 100, w: 100, h: 50, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        b1: { id: 'b1', x: 5, y: 200, w: 80, h: 40, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        b2: { id: 'b2', x: 130, y: 200, w: 80, h: 40, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        b3: { id: 'b3', x: 250, y: 200, w: 80, h: 40, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['k1', 'k2', 'k3', 'b1', 'b2', 'b3'],
      lockedIds: [],
      editorLabels: [],
    } as any);

    useEditorStore.getState().alignColumns();
    const { controls } = useEditorStore.getState();

    // Knobs stay (reference row). Centers at: 50, 170, 290
    expect(controls.k1.x).toBe(0);
    expect(controls.k2.x).toBe(120);
    expect(controls.k3.x).toBe(240);

    // Buttons snap so centers align with knob centers.
    // button w=80, so center=50 means x=10, center=170 means x=130, center=290 means x=250
    expect(controls.b1.x).toBe(10);  // center 50 - 40 = 10
    expect(controls.b2.x).toBe(130); // center 170 - 40 = 130
    expect(controls.b3.x).toBe(250); // center 290 - 40 = 250
  });

  it('handles 3 rows (all follow first row)', () => {
    useEditorStore.setState({
      controls: {
        r1a: { id: 'r1a', x: 0, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        r1b: { id: 'r1b', x: 100, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        r2a: { id: 'r2a', x: 10, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        r2b: { id: 'r2b', x: 105, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        r3a: { id: 'r3a', x: 20, y: 200, w: 50, h: 30, sectionId: 's1', label: '', type: 'slider', labelPosition: 'above', locked: false },
        r3b: { id: 'r3b', x: 110, y: 200, w: 50, h: 30, sectionId: 's1', label: '', type: 'slider', labelPosition: 'above', locked: false },
      },
      selectedIds: ['r1a', 'r1b', 'r2a', 'r2b', 'r3a', 'r3b'],
      lockedIds: [],
      editorLabels: [],
    } as any);

    useEditorStore.getState().alignColumns();
    const { controls } = useEditorStore.getState();

    // Row 1 stays (reference). Centers: 25, 125
    // All subsequent rows snap to x=0 and x=100 (since all have w=50)
    expect(controls.r1a.x).toBe(0);
    expect(controls.r1b.x).toBe(100);
    expect(controls.r2a.x).toBe(0);
    expect(controls.r2b.x).toBe(100);
    expect(controls.r3a.x).toBe(0);
    expect(controls.r3b.x).toBe(100);
  });

  it('no-ops when only 1 row detected', () => {
    useEditorStore.setState({
      controls: {
        a: { id: 'a', x: 0, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        b: { id: 'b', x: 100, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        c: { id: 'c', x: 200, y: 105, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
      },
      selectedIds: ['a', 'b', 'c'],
      lockedIds: [],
      editorLabels: [],
    } as any);

    useEditorStore.getState().alignColumns();
    const { controls } = useEditorStore.getState();
    // All unchanged
    expect(controls.a.x).toBe(0);
    expect(controls.b.x).toBe(100);
    expect(controls.c.x).toBe(200);
  });

  it('pairs by index when rows have different item counts', () => {
    useEditorStore.setState({
      controls: {
        k1: { id: 'k1', x: 0, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        k2: { id: 'k2', x: 100, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        k3: { id: 'k3', x: 200, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        b1: { id: 'b1', x: 5, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        b2: { id: 'b2', x: 105, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['k1', 'k2', 'k3', 'b1', 'b2'],
      lockedIds: [],
      editorLabels: [],
    } as any);

    useEditorStore.getState().alignColumns();
    const { controls } = useEditorStore.getState();
    // Row 1 (knobs) stays. Row 2 (buttons) has 2 items → snap to first 2 columns
    expect(controls.b1.x).toBe(0);   // center 25 - 25 = 0
    expect(controls.b2.x).toBe(100); // center 125 - 25 = 100
  });

  it('skips locked controls', () => {
    useEditorStore.setState({
      controls: {
        k1: { id: 'k1', x: 0, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        k2: { id: 'k2', x: 100, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'knob', labelPosition: 'above', locked: false },
        b1: { id: 'b1', x: 5, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: true },
        b2: { id: 'b2', x: 105, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['k1', 'k2', 'b1', 'b2'],
      lockedIds: ['b1'],
      editorLabels: [],
    } as any);

    useEditorStore.getState().alignColumns();
    const { controls } = useEditorStore.getState();
    // b1 is locked, stays at 5. b2 snaps to column 1 (center 25 - 25 = 0)
    expect(controls.b1.x).toBe(5); // unchanged
    expect(controls.b2.x).toBe(0); // snapped to first column
  });
});

// ─── alignRows ───────────────────────────────────────────────────────────────

describe('alignRows', () => {
  it('snaps second column to first column row centers', () => {
    // Column 1 (leftmost): 3 buttons at y=10, y=100, y=200 (rows)
    // Column 2: 3 buttons slightly offset in Y
    useEditorStore.setState({
      controls: {
        c1r1: { id: 'c1r1', x: 0, y: 10, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        c1r2: { id: 'c1r2', x: 0, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        c1r3: { id: 'c1r3', x: 0, y: 200, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        c2r1: { id: 'c2r1', x: 100, y: 15, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        c2r2: { id: 'c2r2', x: 100, y: 105, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        c2r3: { id: 'c2r3', x: 100, y: 195, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['c1r1', 'c1r2', 'c1r3', 'c2r1', 'c2r2', 'c2r3'],
      lockedIds: [],
      editorLabels: [],
    } as any);

    useEditorStore.getState().alignRows();
    const { controls } = useEditorStore.getState();

    // Column 1 stays (reference). Row centers: 25, 115, 215
    expect(controls.c1r1.y).toBe(10);
    expect(controls.c1r2.y).toBe(100);
    expect(controls.c1r3.y).toBe(200);

    // Column 2 snaps to match row centers (button h=30 → y = center - 15)
    expect(controls.c2r1.y).toBe(10);  // center 25 - 15
    expect(controls.c2r2.y).toBe(100); // center 115 - 15
    expect(controls.c2r3.y).toBe(200); // center 215 - 15
  });

  it('no-ops when only 1 column detected', () => {
    useEditorStore.setState({
      controls: {
        a: { id: 'a', x: 100, y: 0, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        b: { id: 'b', x: 105, y: 50, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
        c: { id: 'c', x: 95, y: 100, w: 50, h: 30, sectionId: 's1', label: '', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['a', 'b', 'c'],
      lockedIds: [],
      editorLabels: [],
    } as any);

    useEditorStore.getState().alignRows();
    const { controls } = useEditorStore.getState();
    // All in one column → no changes
    expect(controls.a.y).toBe(0);
    expect(controls.b.y).toBe(50);
    expect(controls.c.y).toBe(100);
  });
});

// ─── distributeControls ─────────────────────────────────────────────────────

describe('distributeControls', () => {
  beforeEach(resetStore);

  it('distributes horizontally with equal edge-to-edge gaps', () => {
    // sorted by x: a(x=10,w=40), c(x=60,w=40), b(x=100,w=40)
    // total span from left edge of first to right edge of last: 10 to 140 = 130
    // total control widths: 40+40+40 = 120
    // total gap space: 130 - 120 = 10; gap = 10 / (3-1) = 5
    // a stays at 10, c moves to 10+40+5=55, b stays at 100 (last anchor)
    useEditorStore.getState().distributeControls('horizontal');
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(10);  // first anchor
    expect(controls.c.x).toBe(55);  // 10 + 40 + 5
    expect(controls.b.x).toBe(100); // last anchor
  });

  it('distributes vertically with equal edge-to-edge gaps', () => {
    // sorted by y: a(y=20,h=30), b(y=50,h=30), c(y=80,h=30)
    // total span: 20 to 110 = 90
    // total control heights: 30+30+30 = 90
    // gap = (90 - 90) / 2 = 0 → controls already evenly distributed
    useEditorStore.getState().distributeControls('vertical');
    const { controls } = useEditorStore.getState();
    expect(controls.a.y).toBe(20);
    expect(controls.b.y).toBe(50);
    expect(controls.c.y).toBe(80);
  });

  it('no-ops with < 3 selected (need anchors + interior)', () => {
    useEditorStore.setState({ selectedIds: ['a', 'b'] });
    useEditorStore.getState().distributeControls('horizontal');
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(10);
    expect(controls.b.x).toBe(100);
  });
});

// ─── createGroup ────────────────────────────────────────────────────────────

describe('createGroup', () => {
  beforeEach(resetStore);

  it('creates a named group from selectedIds', () => {
    useEditorStore.getState().createGroup('Test Group');
    const { controlGroups } = useEditorStore.getState();
    expect(controlGroups).toHaveLength(1);
    expect(controlGroups[0].name).toBe('Test Group');
    expect(controlGroups[0].controlIds).toEqual(['a', 'b', 'c']);
    expect(controlGroups[0].id).toBeTruthy();
  });

  it('removes controls from old groups when re-grouped', () => {
    // Create first group with a, b, c
    useEditorStore.getState().createGroup('Group 1');
    // Select a and b, group them separately
    useEditorStore.setState({ selectedIds: ['a', 'b'] });
    useEditorStore.getState().createGroup('Group 2');
    const { controlGroups } = useEditorStore.getState();
    // Group 1 should only have c left — but since c alone < 2, group 1 dissolves
    // Only Group 2 should remain
    expect(controlGroups).toHaveLength(1);
    expect(controlGroups[0].name).toBe('Group 2');
    expect(controlGroups[0].controlIds).toEqual(['a', 'b']);
  });

  it('dissolves groups that drop below 2 members', () => {
    // Create group with a, b
    useEditorStore.setState({ selectedIds: ['a', 'b'] });
    useEditorStore.getState().createGroup('Small Group');
    expect(useEditorStore.getState().controlGroups).toHaveLength(1);
    // Now re-group a with c — b is alone, Small Group dissolves
    useEditorStore.setState({ selectedIds: ['a', 'c'] });
    useEditorStore.getState().createGroup('New Group');
    const { controlGroups } = useEditorStore.getState();
    expect(controlGroups).toHaveLength(1);
    expect(controlGroups[0].name).toBe('New Group');
  });

  it('no-ops with < 2 selected', () => {
    useEditorStore.setState({ selectedIds: ['a'] });
    useEditorStore.getState().createGroup('Solo');
    expect(useEditorStore.getState().controlGroups).toHaveLength(0);
  });
});

// ─── ungroupControls ────────────────────────────────────────────────────────

describe('ungroupControls', () => {
  beforeEach(resetStore);

  it('dissolves group containing any selected control', () => {
    useEditorStore.getState().createGroup('Doomed Group');
    expect(useEditorStore.getState().controlGroups).toHaveLength(1);
    // Select just one member
    useEditorStore.setState({ selectedIds: ['a'] });
    useEditorStore.getState().ungroupControls();
    expect(useEditorStore.getState().controlGroups).toHaveLength(0);
  });

  it('preserves control positions after ungrouping', () => {
    useEditorStore.getState().createGroup('Group');
    const before = { ...useEditorStore.getState().controls };
    useEditorStore.setState({ selectedIds: ['b'] });
    useEditorStore.getState().ungroupControls();
    const after = useEditorStore.getState().controls;
    expect(after.a.x).toBe(before.a.x);
    expect(after.a.y).toBe(before.a.y);
    expect(after.b.x).toBe(before.b.x);
    expect(after.b.y).toBe(before.b.y);
    expect(after.c.x).toBe(before.c.x);
    expect(after.c.y).toBe(before.c.y);
  });
});

// ─── deleteSelected group cleanup ──────────────────────────────────────────

describe('deleteSelected cleans up controlGroups', () => {
  beforeEach(() => {
    resetStore();
    // Add sections so deleteSelected can find childIds
    useEditorStore.setState({
      sections: {
        s1: { id: 's1', x: 0, y: 0, w: 500, h: 500, archetype: 'single-row', childIds: ['a', 'b', 'c', 'locked'], headerLabel: 'S1' },
      },
    } as any);
  });

  it('removes deleted controls from groups', () => {
    useEditorStore.getState().createGroup('TestGroup');
    const group = useEditorStore.getState().controlGroups[0];
    expect(group.controlIds).toContain('a');

    // Delete control 'a'
    useEditorStore.setState({ selectedIds: ['a'] });
    useEditorStore.getState().deleteSelected();

    const groups = useEditorStore.getState().controlGroups;
    // Group should still exist with b and c
    expect(groups).toHaveLength(1);
    expect(groups[0].controlIds).not.toContain('a');
    expect(groups[0].controlIds).toContain('b');
    expect(groups[0].controlIds).toContain('c');
  });

  it('dissolves group when it drops below 2 members after delete', () => {
    // Create group with just a and b
    useEditorStore.setState({ selectedIds: ['a', 'b'] });
    useEditorStore.getState().createGroup('SmallGroup');
    expect(useEditorStore.getState().controlGroups).toHaveLength(1);

    // Delete both — group should dissolve
    useEditorStore.setState({ selectedIds: ['a', 'b'] });
    useEditorStore.getState().deleteSelected();
    expect(useEditorStore.getState().controlGroups).toHaveLength(0);
  });
});
