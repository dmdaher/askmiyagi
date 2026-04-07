# Alignment, Distribution & Grouping — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add Figma-style alignment, distribution, and control grouping to the panel editor.

**Architecture:** New store actions on `manifestSlice` for align/distribute/group operations. New `GroupOverlay` canvas component. Extended `PropertiesPanel`, `ContextMenu`, `LayersPanel`, `ControlNode`, and keyboard hooks. TDD throughout — store actions tested in Vitest, interactions tested in Playwright.

**Tech Stack:** React 19, Next.js 16, Zustand, Tailwind CSS, react-rnd, Vitest, Playwright

**Design Doc:** `docs/plans/2026-04-03-alignment-grouping-design.md`

---

## Task 1: ControlGroup Type + Store Actions (Align & Distribute)

**Files:**
- Modify: `src/components/panel-editor/store/manifestSlice.ts:151-196` (interface), `:254` (initial state), `:724-753` (after existing actions)
- Modify: `src/components/panel-editor/store/historySlice.ts:17` (type)
- Test: `src/components/panel-editor/store/alignment.test.ts` (NEW)

**Step 1: Write failing tests for alignment actions**

Create `src/components/panel-editor/store/alignment.test.ts`:

```typescript
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

describe('alignControls', () => {
  beforeEach(resetStore);

  it('aligns left — all x snap to minimum x', () => {
    useEditorStore.getState().alignControls('left');
    const { controls } = useEditorStore.getState();
    expect(controls.a.x).toBe(10);
    expect(controls.b.x).toBe(10);
    expect(controls.c.x).toBe(10);
  });

  it('aligns right — all right edges snap to maximum right edge', () => {
    useEditorStore.getState().alignControls('right');
    const { controls } = useEditorStore.getState();
    // max right edge = b.x + b.w = 100 + 40 = 140
    expect(controls.a.x).toBe(100); // 140 - 40
    expect(controls.b.x).toBe(100); // 140 - 40
    expect(controls.c.x).toBe(100); // 140 - 40
  });

  it('aligns center-x — all centers snap to average centerX', () => {
    useEditorStore.getState().alignControls('center-x');
    const { controls } = useEditorStore.getState();
    // centers: a=30, b=120, c=80 → avg = 76.67
    const avgCenter = Math.round((30 + 120 + 80) / 3);
    expect(controls.a.x).toBe(avgCenter - 20); // center - w/2
    expect(controls.b.x).toBe(avgCenter - 20);
    expect(controls.c.x).toBe(avgCenter - 20);
  });

  it('aligns top — all y snap to minimum y', () => {
    useEditorStore.getState().alignControls('top');
    const { controls } = useEditorStore.getState();
    expect(controls.a.y).toBe(20);
    expect(controls.b.y).toBe(20);
    expect(controls.c.y).toBe(20);
  });

  it('aligns bottom — all bottom edges snap to maximum bottom edge', () => {
    useEditorStore.getState().alignControls('bottom');
    const { controls } = useEditorStore.getState();
    // max bottom = c.y + c.h = 80 + 30 = 110
    expect(controls.a.y).toBe(80); // 110 - 30
    expect(controls.b.y).toBe(80);
    expect(controls.c.y).toBe(80);
  });

  it('aligns center-y — all centers snap to average centerY', () => {
    useEditorStore.getState().alignControls('center-y');
    const { controls } = useEditorStore.getState();
    // centers: a=35, b=65, c=95 → avg = 65
    expect(controls.a.y).toBe(50); // 65 - 15
    expect(controls.b.y).toBe(50);
    expect(controls.c.y).toBe(50);
  });

  it('skips locked controls', () => {
    useEditorStore.setState({ selectedIds: ['a', 'locked'] } as any);
    useEditorStore.getState().alignControls('left');
    const { controls } = useEditorStore.getState();
    expect(controls.locked.x).toBe(200); // unchanged
  });

  it('no-ops with fewer than 2 selected', () => {
    useEditorStore.setState({ selectedIds: ['a'] } as any);
    useEditorStore.getState().alignControls('left');
    expect(useEditorStore.getState().controls.a.x).toBe(10); // unchanged
  });
});

describe('distributeControls', () => {
  beforeEach(resetStore);

  it('distributes horizontally — equal edge-to-edge gaps', () => {
    useEditorStore.getState().distributeControls('horizontal');
    const { controls } = useEditorStore.getState();
    // Sorted by x: a(10), c(60), b(100)
    // Total space = (b.x + b.w) - a.x = 140 - 10 = 130
    // Total content = 40 + 40 + 40 = 120
    // Gap = (130 - 120) / 2 = 5
    expect(controls.a.x).toBe(10);  // leftmost anchored
    expect(controls.c.x).toBe(55);  // 10 + 40 + 5
    expect(controls.b.x).toBe(100); // rightmost anchored
  });

  it('distributes vertically — equal edge-to-edge gaps', () => {
    useEditorStore.getState().distributeControls('vertical');
    const { controls } = useEditorStore.getState();
    // Sorted by y: a(20), b(50), c(80)
    // Total space = (c.y + c.h) - a.y = 110 - 20 = 90
    // Total content = 30 + 30 + 30 = 90
    // Gap = (90 - 90) / 3-1 = 0
    expect(controls.a.y).toBe(20);  // topmost anchored
    expect(controls.b.y).toBe(50);  // 20 + 30 + 0
    expect(controls.c.y).toBe(80);  // bottommost anchored
  });

  it('no-ops with fewer than 3 selected', () => {
    useEditorStore.setState({ selectedIds: ['a', 'b'] } as any);
    useEditorStore.getState().distributeControls('horizontal');
    expect(useEditorStore.getState().controls.a.x).toBe(10);
    expect(useEditorStore.getState().controls.b.x).toBe(100);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/panel-editor/store/alignment.test.ts`
Expected: FAIL — `alignControls` and `distributeControls` are not defined

**Step 3: Update ControlGroup type in historySlice**

In `src/components/panel-editor/store/historySlice.ts:17`, replace:
```typescript
export type ControlGroup = Record<string, unknown> & { controlIds?: string[] };
```
with:
```typescript
export interface ControlGroup {
  id: string;
  name: string;
  controlIds: string[];
}
```

**Step 4: Add action signatures to ManifestSlice interface**

In `src/components/panel-editor/store/manifestSlice.ts`, after line 195 (`initLabelsFromControls`), add:
```typescript
  // Alignment & distribution
  alignControls: (mode: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
  distributeControls: (axis: 'horizontal' | 'vertical') => void;
  // Grouping
  createGroup: (name: string) => void;
  ungroupControls: () => void;
```

**Step 5: Update controlGroups type**

In `src/components/panel-editor/store/manifestSlice.ts:164`, change:
```typescript
  controlGroups: unknown[];     // Future: ControlGroup[] for sub-section grouping
```
to:
```typescript
  controlGroups: ControlGroup[];
```

Add the import at top of file:
```typescript
import type { ControlGroup } from './historySlice';
```

**Step 6: Implement alignControls**

In `src/components/panel-editor/store/manifestSlice.ts`, after `updateControlProp` (after line 753), add:

```typescript
  alignControls: (mode) => {
    const { selectedIds, lockedIds, controls } = get();
    const lockSet = new Set(lockedIds);
    const selected = selectedIds
      .map((id) => controls[id])
      .filter((c): c is ControlDef => !!c && !lockSet.has(c.id));
    if (selected.length < 2) return;

    let targetValue: number;
    switch (mode) {
      case 'left':
        targetValue = Math.min(...selected.map((c) => c.x));
        break;
      case 'center-x': {
        const centers = selected.map((c) => c.x + c.w / 2);
        targetValue = Math.round(centers.reduce((a, b) => a + b, 0) / centers.length);
        break;
      }
      case 'right':
        targetValue = Math.max(...selected.map((c) => c.x + c.w));
        break;
      case 'top':
        targetValue = Math.min(...selected.map((c) => c.y));
        break;
      case 'center-y': {
        const centers = selected.map((c) => c.y + c.h / 2);
        targetValue = Math.round(centers.reduce((a, b) => a + b, 0) / centers.length);
        break;
      }
      case 'bottom':
        targetValue = Math.max(...selected.map((c) => c.y + c.h));
        break;
    }

    set((s) => {
      const updated = { ...s.controls };
      for (const ctrl of selected) {
        switch (mode) {
          case 'left':    updated[ctrl.id] = { ...ctrl, x: targetValue }; break;
          case 'center-x': updated[ctrl.id] = { ...ctrl, x: targetValue - ctrl.w / 2 }; break;
          case 'right':   updated[ctrl.id] = { ...ctrl, x: targetValue - ctrl.w }; break;
          case 'top':     updated[ctrl.id] = { ...ctrl, y: targetValue }; break;
          case 'center-y': updated[ctrl.id] = { ...ctrl, y: targetValue - ctrl.h / 2 }; break;
          case 'bottom':  updated[ctrl.id] = { ...ctrl, y: targetValue - ctrl.h }; break;
        }
      }
      return { controls: updated };
    });
  },
```

**Step 7: Implement distributeControls**

Immediately after `alignControls`:

```typescript
  distributeControls: (axis) => {
    const { selectedIds, lockedIds, controls } = get();
    const lockSet = new Set(lockedIds);
    const selected = selectedIds
      .map((id) => controls[id])
      .filter((c): c is ControlDef => !!c && !lockSet.has(c.id));
    if (selected.length < 3) return;

    if (axis === 'horizontal') {
      selected.sort((a, b) => a.x - b.x);
    } else {
      selected.sort((a, b) => a.y - b.y);
    }

    const first = selected[0];
    const last = selected[selected.length - 1];

    if (axis === 'horizontal') {
      const totalSpace = (last.x + last.w) - first.x;
      const totalContent = selected.reduce((sum, c) => sum + c.w, 0);
      const gap = (totalSpace - totalContent) / (selected.length - 1);

      let pos = first.x;
      set((s) => {
        const updated = { ...s.controls };
        for (const ctrl of selected) {
          updated[ctrl.id] = { ...ctrl, x: Math.round(pos) };
          pos += ctrl.w + gap;
        }
        return { controls: updated };
      });
    } else {
      const totalSpace = (last.y + last.h) - first.y;
      const totalContent = selected.reduce((sum, c) => sum + c.h, 0);
      const gap = (totalSpace - totalContent) / (selected.length - 1);

      let pos = first.y;
      set((s) => {
        const updated = { ...s.controls };
        for (const ctrl of selected) {
          updated[ctrl.id] = { ...ctrl, y: Math.round(pos) };
          pos += ctrl.h + gap;
        }
        return { controls: updated };
      });
    }
  },
```

**Step 8: Run tests to verify they pass**

Run: `npx vitest run src/components/panel-editor/store/alignment.test.ts`
Expected: ALL PASS

**Step 9: Commit**

```bash
git add src/components/panel-editor/store/alignment.test.ts \
  src/components/panel-editor/store/manifestSlice.ts \
  src/components/panel-editor/store/historySlice.ts
git commit -m "feat: add alignControls + distributeControls store actions with tests"
```

---

## Task 2: Grouping Store Actions (createGroup + ungroupControls)

**Files:**
- Modify: `src/components/panel-editor/store/manifestSlice.ts` (add actions after distributeControls)
- Test: `src/components/panel-editor/store/alignment.test.ts` (extend)

**Step 1: Write failing tests for group actions**

Append to `alignment.test.ts`:

```typescript
describe('createGroup', () => {
  beforeEach(resetStore);

  it('creates a group from selected controls', () => {
    useEditorStore.setState({ selectedIds: ['a', 'b'] } as any);
    useEditorStore.getState().createGroup('Test Group');
    const { controlGroups } = useEditorStore.getState();
    expect(controlGroups).toHaveLength(1);
    expect(controlGroups[0].name).toBe('Test Group');
    expect(controlGroups[0].controlIds).toEqual(['a', 'b']);
    expect(controlGroups[0].id).toMatch(/^group-/);
  });

  it('removes control from old group when added to new', () => {
    useEditorStore.setState({ selectedIds: ['a', 'b'] } as any);
    useEditorStore.getState().createGroup('Group 1');
    useEditorStore.setState({ selectedIds: ['b', 'c'] } as any);
    useEditorStore.getState().createGroup('Group 2');
    const { controlGroups } = useEditorStore.getState();
    const g1 = controlGroups.find((g) => g.name === 'Group 1');
    const g2 = controlGroups.find((g) => g.name === 'Group 2');
    expect(g1?.controlIds).toEqual(['a']); // b removed
    expect(g2?.controlIds).toEqual(['b', 'c']);
  });

  it('dissolves group if it drops below 2 members', () => {
    useEditorStore.setState({ selectedIds: ['a', 'b'] } as any);
    useEditorStore.getState().createGroup('Tiny');
    // Move b to new group, leaving 'Tiny' with only a
    useEditorStore.setState({ selectedIds: ['b', 'c'] } as any);
    useEditorStore.getState().createGroup('New');
    const { controlGroups } = useEditorStore.getState();
    expect(controlGroups.find((g) => g.name === 'Tiny')).toBeUndefined();
  });

  it('no-ops with fewer than 2 selected', () => {
    useEditorStore.setState({ selectedIds: ['a'] } as any);
    useEditorStore.getState().createGroup('Solo');
    expect(useEditorStore.getState().controlGroups).toHaveLength(0);
  });
});

describe('ungroupControls', () => {
  beforeEach(() => {
    resetStore();
    useEditorStore.setState({ selectedIds: ['a', 'b'] } as any);
    useEditorStore.getState().createGroup('Test');
  });

  it('dissolves group containing any selected control', () => {
    useEditorStore.setState({ selectedIds: ['a'] } as any);
    useEditorStore.getState().ungroupControls();
    expect(useEditorStore.getState().controlGroups).toHaveLength(0);
  });

  it('preserves control positions', () => {
    const before = { ...useEditorStore.getState().controls };
    useEditorStore.setState({ selectedIds: ['a'] } as any);
    useEditorStore.getState().ungroupControls();
    const after = useEditorStore.getState().controls;
    expect(after.a.x).toBe(before.a.x);
    expect(after.a.y).toBe(before.a.y);
  });
});
```

**Step 2: Run tests — verify failures**

Run: `npx vitest run src/components/panel-editor/store/alignment.test.ts`
Expected: FAIL — `createGroup` and `ungroupControls` not defined

**Step 3: Implement createGroup and ungroupControls**

In `manifestSlice.ts`, after `distributeControls`:

```typescript
  createGroup: (name) => {
    const { selectedIds, controlGroups } = get();
    if (selectedIds.length < 2) return;

    const newId = `group-${Date.now()}`;
    const newGroupIds = new Set(selectedIds);

    // Remove these controls from any existing groups
    let updatedGroups = (controlGroups as ControlGroup[]).map((g) => ({
      ...g,
      controlIds: g.controlIds.filter((id) => !newGroupIds.has(id)),
    }));

    // Dissolve any group that dropped below 2 members
    updatedGroups = updatedGroups.filter((g) => g.controlIds.length >= 2);

    // Add the new group
    updatedGroups.push({ id: newId, name, controlIds: [...selectedIds] });

    set({ controlGroups: updatedGroups });
  },

  ungroupControls: () => {
    const { selectedIds, controlGroups } = get();
    const selSet = new Set(selectedIds);

    const updatedGroups = (controlGroups as ControlGroup[]).filter(
      (g) => !g.controlIds.some((id) => selSet.has(id)),
    );

    set({ controlGroups: updatedGroups });
  },
```

**Step 4: Run tests — verify all pass**

Run: `npx vitest run src/components/panel-editor/store/alignment.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/components/panel-editor/store/alignment.test.ts \
  src/components/panel-editor/store/manifestSlice.ts
git commit -m "feat: add createGroup + ungroupControls store actions with tests"
```

---

## Task 3: SVG Alignment Icons

**Files:**
- Create: `src/components/panel-editor/icons/alignment.tsx` (NEW)

**Step 1: Create alignment icon components**

```tsx
'use client';

/** 12×12 SVG alignment icons. 1.5px strokes for clarity at small sizes. */

const iconProps = { width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 };

export function AlignLeftIcon() {
  return (
    <svg {...iconProps}>
      <line x1="1" y1="1" x2="1" y2="11" />
      <rect x="3" y="3" width="7" height="2" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="3" y="7" width="5" height="2" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AlignCenterHIcon() {
  return (
    <svg {...iconProps}>
      <line x1="6" y1="1" x2="6" y2="11" strokeDasharray="1.5 1.5" />
      <rect x="2" y="3" width="8" height="2" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="3" y="7" width="6" height="2" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AlignRightIcon() {
  return (
    <svg {...iconProps}>
      <line x1="11" y1="1" x2="11" y2="11" />
      <rect x="2" y="3" width="7" height="2" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="4" y="7" width="5" height="2" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AlignTopIcon() {
  return (
    <svg {...iconProps}>
      <line x1="1" y1="1" x2="11" y2="1" />
      <rect x="3" y="3" width="2" height="7" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="7" y="3" width="2" height="5" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AlignMiddleVIcon() {
  return (
    <svg {...iconProps}>
      <line x1="1" y1="6" x2="11" y2="6" strokeDasharray="1.5 1.5" />
      <rect x="3" y="2" width="2" height="8" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="7" y="3" width="2" height="6" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AlignBottomIcon() {
  return (
    <svg {...iconProps}>
      <line x1="1" y1="11" x2="11" y2="11" />
      <rect x="3" y="2" width="2" height="7" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="7" y="4" width="2" height="5" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DistributeHIcon() {
  return (
    <svg {...iconProps}>
      <line x1="1" y1="1" x2="1" y2="11" />
      <line x1="11" y1="1" x2="11" y2="11" />
      <rect x="3.5" y="4" width="2" height="4" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="6.5" y="4" width="2" height="4" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DistributeVIcon() {
  return (
    <svg {...iconProps}>
      <line x1="1" y1="1" x2="11" y2="1" />
      <line x1="1" y1="11" x2="11" y2="11" />
      <rect x="4" y="3.5" width="4" height="2" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="4" y="6.5" width="4" height="2" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/panel-editor/icons/alignment.tsx
git commit -m "feat: add SVG alignment icons (12×12)"
```

---

## Task 4: Properties Panel — Alignment UI

**Files:**
- Modify: `src/components/panel-editor/PropertiesPanel/index.tsx:491-511` (after GeometryFields, around Match Sizes)

**Step 1: Add alignment buttons to MultiControlProperties**

After the Match Sizes button block (line ~510), before the closing `</div>` of `MultiControlProperties`, insert:

```tsx
      {/* ── Alignment ──────────────────────────────────────────────── */}
      {controls.length >= 2 && (
        <>
          <div className="h-px bg-gray-800" />
          <div className="flex items-center rounded border border-gray-700 bg-gray-900/60 overflow-hidden">
            <button onClick={() => { pushSnapshot(); alignControls('left'); }} className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Align Left"><AlignLeftIcon /></button>
            <button onClick={() => { pushSnapshot(); alignControls('center-x'); }} className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Align Center H (Shift+H)"><AlignCenterHIcon /></button>
            <button onClick={() => { pushSnapshot(); alignControls('right'); }} className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Align Right"><AlignRightIcon /></button>
            <div className="w-px h-5 bg-gray-700 flex-shrink-0" />
            <button onClick={() => { pushSnapshot(); alignControls('top'); }} className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Align Top"><AlignTopIcon /></button>
            <button onClick={() => { pushSnapshot(); alignControls('center-y'); }} className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Align Middle V (Shift+V)"><AlignMiddleVIcon /></button>
            <button onClick={() => { pushSnapshot(); alignControls('bottom'); }} className="flex h-7 w-9 items-center justify-center text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Align Bottom"><AlignBottomIcon /></button>
          </div>
        </>
      )}

      {/* ── Distribute ─────────────────────────────────────────────── */}
      {controls.length >= 3 && (
        <div className="flex gap-1.5">
          <button onClick={() => { pushSnapshot(); distributeControls('horizontal'); }} className="flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Distribute Horizontally (⌘⇧H)"><DistributeHIcon /><span>Distribute H</span></button>
          <button onClick={() => { pushSnapshot(); distributeControls('vertical'); }} className="flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Distribute Vertically (⌘⇧V)"><DistributeVIcon /><span>Distribute V</span></button>
        </div>
      )}

      {/* ── Group ──────────────────────────────────────────────────── */}
      {controls.length >= 2 && (
        <>
          <div className="h-px bg-gray-800" />
          <div className="flex gap-1.5">
            <button onClick={() => { pushSnapshot(); createGroup(`Group ${Date.now()}`); }} className="flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] text-gray-400 hover:bg-gray-700/60 hover:text-gray-200 transition-colors" title="Group (⌘G)"><span>Group ⌘G</span></button>
            <button onClick={() => { pushSnapshot(); ungroupControls(); }} className={`flex-1 flex h-7 items-center justify-center gap-1.5 rounded border border-gray-700 bg-gray-900/60 text-[10px] transition-colors ${hasGroupInSelection ? 'text-gray-400 hover:bg-gray-700/60 hover:text-gray-200' : 'text-gray-700 cursor-not-allowed'}`} disabled={!hasGroupInSelection} title="Ungroup (⌘⇧G)"><span>Ungroup ⌘⇧G</span></button>
          </div>
        </>
      )}
```

You'll need to add these store hooks and imports at the top of `MultiControlProperties`:

```tsx
const alignControls = useEditorStore((s) => s.alignControls);
const distributeControls = useEditorStore((s) => s.distributeControls);
const createGroup = useEditorStore((s) => s.createGroup);
const ungroupControls = useEditorStore((s) => s.ungroupControls);
const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];

const hasGroupInSelection = controlGroups.some((g) =>
  g.controlIds.some((id) => ids.includes(id))
);
```

And import the icons:
```tsx
import { AlignLeftIcon, AlignCenterHIcon, AlignRightIcon, AlignTopIcon, AlignMiddleVIcon, AlignBottomIcon, DistributeHIcon, DistributeVIcon } from '../icons/alignment';
import type { ControlGroup } from '../store/historySlice';
```

**Step 2: Visual verification**

Start dev server, open editor, select 3+ controls. Verify:
- Alignment strip appears with 6 icon buttons + divider
- Distribute buttons appear (only with 3+)
- Group/Ungroup buttons appear
- Clicking alignment button repositions controls
- Cmd+Z undoes

**Step 3: Commit**

```bash
git add src/components/panel-editor/PropertiesPanel/index.tsx
git commit -m "feat: alignment, distribute, group buttons in properties panel"
```

---

## Task 5: Keyboard Shortcuts

**Files:**
- Modify: `src/components/panel-editor/hooks/useEditorKeyboard.ts:74-120` (add before the G/P/L toggles)

**Step 1: Add shortcuts**

In `useEditorKeyboard.ts`, insert BEFORE the `// ── Toggle grid: G` block (before line 74):

```typescript
      // ── Align Center H: Shift+H (no mod key) ────────────────────────────
      if (e.shiftKey && !isMod && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        store.pushSnapshot();
        store.alignControls('center-x');
        return;
      }

      // ── Align Middle V: Shift+V (no mod key) ────────────────────────────
      if (e.shiftKey && !isMod && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        store.pushSnapshot();
        store.alignControls('center-y');
        return;
      }

      // ── Distribute H: Cmd+Shift+H ───────────────────────────────────────
      if (isMod && e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        store.pushSnapshot();
        store.distributeControls('horizontal');
        return;
      }

      // ── Distribute V: Cmd+Shift+V ───────────────────────────────────────
      if (isMod && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        store.pushSnapshot();
        store.distributeControls('vertical');
        return;
      }

      // ── Group: Cmd+G ────────────────────────────────────────────────────
      if (isMod && !e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (store.selectedIds.length >= 2) {
          store.pushSnapshot();
          store.createGroup(`Group ${Date.now()}`);
        }
        return;
      }

      // ── Ungroup: Cmd+Shift+G ────────────────────────────────────────────
      if (isMod && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        store.pushSnapshot();
        store.ungroupControls();
        return;
      }
```

**Important:** The Cmd+G/Cmd+Shift+G handlers must come BEFORE the standalone `G` handler (toggle grid). The existing `G` handler at line 75 checks `if (!isMod)` so it won't conflict, but the new Cmd+G must be checked first since it will have `isMod = true`.

**Step 2: Verify shortcuts work**

In browser: select 3 controls, press Shift+H (centers horizontally), Cmd+Z (undoes). Select 3, press Cmd+Shift+H (distributes). Select 2, press Cmd+G (groups).

**Step 3: Commit**

```bash
git add src/components/panel-editor/hooks/useEditorKeyboard.ts
git commit -m "feat: keyboard shortcuts for align, distribute, group"
```

---

## Task 6: Context Menu — Multi-Select Extension

**Files:**
- Modify: `src/components/panel-editor/ContextMenu.tsx` (full rewrite of menu items section)

**Step 1: Extend context menu for multi-select**

Replace the menu items section (lines 95–124) with alignment/group items when multi-selected. Read `selectedIds` from store at render time. Add handlers for each action. Import alignment icons.

Key changes:
- Read `selectedIds.length` from `useEditorStore.getState()` on render
- When `selectedIds.length >= 2`: show alignment items after Lock separator
- When `selectedIds.length >= 3`: show distribute items
- Always show Group/Ungroup when `>= 2`
- Each menu item calls `pushSnapshot()` then the action, then `setMenu(null)`

**Step 2: Commit**

```bash
git add src/components/panel-editor/ContextMenu.tsx
git commit -m "feat: context menu alignment and grouping items"
```

---

## Task 7: Group-Aware Click & Drag in ControlNode

**Files:**
- Modify: `src/components/panel-editor/ControlNode.tsx:661-673` (handleClick), `:619-635` (handleDragStop), `:767` (z-index)

**Step 1: Update handleClick for group selection**

Replace the current `handleClick` (lines 661–673) with group-aware logic:

```typescript
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setFocusedSection(sectionId);

      const groups = useEditorStore.getState().controlGroups as ControlGroup[];
      const group = groups.find((g) => g.controlIds.includes(controlId));

      if (e.shiftKey || e.metaKey) {
        // Modifier click: always toggle individual (deep-select)
        toggleSelected(controlId);
      } else if (group) {
        // Click on grouped control: select entire group
        setSelectedIds(group.controlIds);
      } else {
        setSelectedIds([controlId]);
      }
    },
    [controlId, sectionId, toggleSelected, setSelectedIds, setFocusedSection],
  );
```

**Step 2: Update handleDoubleClick for deep-select**

The existing `handleDoubleClick` (line 675) opens inline label editing. For grouped controls, double-click should select just this control (deep-select). Add before the label editing logic:

```typescript
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!control) return;

      const groups = useEditorStore.getState().controlGroups as ControlGroup[];
      const group = groups.find((g) => g.controlIds.includes(controlId));

      if (group && selectedIds.length > 1) {
        // Double-click on grouped control: deep-select just this one
        setSelectedIds([controlId]);
        return;
      }

      // Original behavior: open inline label editor
      setEditValue(control.label);
      // ... rest of existing code
```

**Step 3: Update z-index for grouped controls**

At line 767, change:
```typescript
zIndex: isSelected ? 50 : 1,
```
to:
```typescript
zIndex: isSelected ? 50 : isGrouped ? 10 : 5,
```

Add `isGrouped` computation near the top of the component:
```typescript
const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];
const isGrouped = controlGroups.some((g) => g.controlIds.includes(controlId));
```

**Step 4: Commit**

```bash
git add src/components/panel-editor/ControlNode.tsx
git commit -m "feat: group-aware click (group select) and double-click (deep select)"
```

---

## Task 8: GroupOverlay Component

**Files:**
- Create: `src/components/panel-editor/GroupOverlay.tsx` (NEW)
- Modify: `src/components/panel-editor/PanCanvas.tsx:56-57` (render GroupOverlay)

**Step 1: Create GroupOverlay**

```tsx
'use client';

import { useEditorStore } from './store';
import type { ControlGroup } from './store/historySlice';

export default function GroupOverlay() {
  const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];
  const controls = useEditorStore((s) => s.controls);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const controlScale = useEditorStore((s) => s.controlScale);
  const hoveredGroupId = useEditorStore((s) => (s as any).hoveredGroupId) as string | null;

  if (controlGroups.length === 0) return null;

  return (
    <>
      {controlGroups.map((group) => {
        const members = group.controlIds
          .map((id) => controls[id])
          .filter(Boolean);
        if (members.length < 2) return null;

        // Compute bounding box
        const xs = members.map((c) => c.x);
        const ys = members.map((c) => c.y);
        const rights = members.map((c) => c.x + c.w * controlScale);
        const bottoms = members.map((c) => c.y + c.h * controlScale);

        const minX = Math.min(...xs) - 4;
        const minY = Math.min(...ys) - 4;
        const maxX = Math.max(...rights) + 4;
        const maxY = Math.max(...bottoms) + 4;

        // Determine state
        const isSelected = group.controlIds.some((id) => selectedIds.includes(id)) &&
          group.controlIds.every((id) => selectedIds.includes(id));
        const isHovered = hoveredGroupId === group.id;
        const isVisible = isSelected || isHovered;

        if (!isVisible) return null;

        return (
          <div
            key={group.id}
            className="absolute"
            style={{
              left: minX,
              top: minY,
              width: maxX - minX,
              height: maxY - minY,
              border: isSelected
                ? '1px dashed rgba(147, 130, 246, 0.5)'
                : '1px solid rgba(147, 130, 246, 0.2)',
              borderRadius: 3,
              pointerEvents: 'none',
              zIndex: isSelected ? 70 : 20,
            }}
          >
            {/* Badge — only when selected */}
            {isSelected && (
              <div
                className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-gray-900/90 border border-violet-500/30 px-1 py-0.5"
                style={{ pointerEvents: 'auto', zIndex: 75 }}
              >
                <span className="text-[8px] text-violet-400 font-medium">{group.name}</span>
                <span className="text-[8px] text-gray-600">&times;{group.controlIds.length}</span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
```

**Step 2: Add hoveredGroupId to store**

In `manifestSlice.ts`, add to interface:
```typescript
hoveredGroupId: string | null;
setHoveredGroup: (id: string | null) => void;
```

Add to default state:
```typescript
hoveredGroupId: null,
```

Add action:
```typescript
setHoveredGroup: (id) => set({ hoveredGroupId: id }),
```

**Step 3: Render in PanCanvas**

In `PanCanvas.tsx`, import and render between sections and LabelLayer (after line 56):

```tsx
import GroupOverlay from './GroupOverlay';
```

```tsx
      {/* Group overlays (between sections and labels) */}
      <GroupOverlay />
```

**Step 4: Commit**

```bash
git add src/components/panel-editor/GroupOverlay.tsx \
  src/components/panel-editor/PanCanvas.tsx \
  src/components/panel-editor/store/manifestSlice.ts
git commit -m "feat: GroupOverlay component with bounding box and badge"
```

---

## Task 9: Layers Panel — Group Nodes

**Files:**
- Modify: `src/components/panel-editor/LayersPanel.tsx:61-163` (SectionItem), `:168-235` (LayersPanel)

**Step 1: Add GroupItem component**

Add a new `GroupItem` component before `SectionItem`:

```tsx
function GroupItem({ group, childIds }: { group: ControlGroup; childIds: string[] }) {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setHoveredGroup = useEditorStore((s) => s.setHoveredGroup);

  const [expanded, setExpanded] = useState(false);
  const allSelected = childIds.every((id) => selectedIds.includes(id));
  const someSelected = childIds.some((id) => selectedIds.includes(id));

  useEffect(() => {
    if (someSelected && !expanded) setExpanded(true);
  }, [someSelected, expanded]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(childIds);
  }, [childIds, setSelectedIds]);

  return (
    <div
      onMouseEnter={() => setHoveredGroup(group.id)}
      onMouseLeave={() => setHoveredGroup(null)}
    >
      <div className={`flex items-center rounded transition-colors ${
        allSelected ? 'bg-violet-600/20' : someSelected ? 'bg-violet-600/10' : 'hover:bg-white/5'
      }`}>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="flex h-7 w-5 flex-shrink-0 items-center justify-center text-gray-500 hover:text-gray-300"
        >
          <svg className={`h-2.5 w-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 12 12" fill="currentColor">
            <path d="M4 2l4 4-4 4z" />
          </svg>
        </button>
        <button
          onClick={handleClick}
          className={`flex flex-1 items-center gap-1.5 py-1 pr-2 text-left text-[10px] ${
            allSelected ? 'text-violet-300' : 'text-gray-400'
          }`}
        >
          <svg className="h-3 w-3 flex-shrink-0 text-violet-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="10" height="10" rx="2" strokeDasharray="2 1.5" />
          </svg>
          <span className="flex-1 truncate">{truncate(group.name, 16)}</span>
          <span className="flex-shrink-0 text-[9px] text-gray-500">{childIds.length}</span>
        </button>
      </div>
      {expanded && (
        <div className="ml-4 border-l border-violet-800/30 pl-0.5 py-0.5">
          {childIds.map((id) => <ControlItem key={id} controlId={id} />)}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Modify SectionItem to render groups**

In `SectionItem`, read `controlGroups` from store. In the expanded child list, cluster grouped controls under `GroupItem` nodes and render ungrouped controls flat:

Replace lines 155–161 with:
```tsx
      {expanded && (
        <div className="ml-4 border-l border-gray-800 pl-0.5 py-0.5">
          {(() => {
            const grouped = new Set<string>();
            const groupsInSection: { group: ControlGroup; ids: string[] }[] = [];
            for (const g of controlGroups) {
              const idsInSection = g.controlIds.filter((id) => childIds.includes(id));
              if (idsInSection.length >= 2) {
                groupsInSection.push({ group: g, ids: idsInSection });
                idsInSection.forEach((id) => grouped.add(id));
              }
            }
            const ungrouped = childIds.filter((id) => !grouped.has(id));

            return (
              <>
                {groupsInSection.map(({ group, ids }) => (
                  <GroupItem key={group.id} group={group} childIds={ids} />
                ))}
                {ungrouped.map((id) => (
                  <ControlItem key={id} controlId={id} />
                ))}
              </>
            );
          })()}
        </div>
      )}
```

Add to `SectionItem`'s store reads:
```typescript
const controlGroups = useEditorStore((s) => s.controlGroups) as ControlGroup[];
```
And:
```typescript
const childIds = section?.childIds ?? [];
```

Add imports:
```typescript
import type { ControlGroup } from './store/historySlice';
```

**Step 3: Update footer count**

In `LayersPanel` footer (line 230–232), add group count:
```tsx
{sortedSectionIds.length} sections · {controlGroups.length} groups
```

**Step 4: Commit**

```bash
git add src/components/panel-editor/LayersPanel.tsx
git commit -m "feat: group nodes in layers panel with hover preview"
```

---

## Task 10: Playwright E2E Verification

**Files:**
- Modify: `e2e/z-layer-verify.ts` (add alignment + grouping tests)

**Step 1: Add alignment verification tests**

Append tests that:
1. Select 3 controls via shift+click
2. Press Shift+H → verify all controls have same center-x (within 2px)
3. Cmd+Z → verify positions restored
4. Select 3 → Cmd+Shift+H → verify equal horizontal gaps
5. Select 2 → Cmd+G → verify group overlay appears
6. Click one grouped control → verify all group members selected
7. Double-click grouped control → verify only that control selected
8. z-index check: grouped controls at z=10, selected at z=50, overlay at z=70

**Step 2: Run tests**

```bash
npx tsx e2e/z-layer-verify.ts cdj-3000
```

**Step 3: Commit**

```bash
git add e2e/z-layer-verify.ts
git commit -m "test: Playwright verification for alignment, distribution, grouping"
```

**Step 4: Push**

```bash
git push origin feature/pipeline-architecture-upgrade
```
