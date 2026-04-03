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
