# Editor Spacing & Scale Fix — Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Fix the visual mismatch between how controls look in the editor vs the generated panel, and give the contractor direct control over spacing.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## The Problem — Explained Simply

### What the contractor sees

The editor has a **Scale slider** (30%-100%). When the contractor drags it to 50%, every knob, button, and slider visually shrinks to half size on the canvas. This lets them see the photo underneath and position controls precisely on top of the hardware image.

But here's the catch: **the invisible box around each control stays full size.**

Think of it like this: each control sits inside a picture frame. The Scale slider shrinks the picture inside the frame, but the frame itself stays the same size. The controls are positioned and spaced based on their frames, not their pictures.

### What happens during Clean Up

When the contractor clicks "Clean Up", the `equalizeSpacing` function measures the distance between frames (not pictures) and makes all distances equal. At 100% scale, frames and pictures are the same size, so everything looks right. But at 50% scale:

```
Scale = 100% (frame = picture)

[KNOB]--8px--[KNOB]--8px--[KNOB]    ← Looks correct
|frame|      |frame|      |frame|


Scale = 50% (frame bigger than picture)

[  knob  ]--8px--[  knob  ]--8px--[  knob  ]    ← Frames are 8px apart
|  frame  |      |  frame  |      |  frame  |

What the contractor actually sees:

  knob          knob          knob               ← Knobs look far apart!
|__frame__|    |__frame__|    |__frame__|         ← Because frames have
                                                     empty space around
                                                     the small knob
```

The 8px gap between frames is correct — but visually the knobs have ~30px of empty space between them because the knob graphic only fills half its frame.

### Why the generated panel looks perfect

The generated panel doesn't use the Scale slider at all. It renders every control at 100% size using the exact same positions from the editor. Since there's no scaling, frames = pictures, and the 8px gaps look like 8px gaps. Perfect spacing.

### The core issue

**The editor at reduced scale is not WYSIWYG.** What the contractor sees while positioning is not what the final panel looks like. This makes it impossible to judge spacing quality in the editor.

---

## Solution

### Part 1: Scale-Aware Clean Up

When `equalizeSpacing` runs, it should account for `controlScale`. If the contractor is working at 50% scale, a "visual gap of 8px" requires a frame gap of `8 / 0.5 = 16px`.

**File:** `src/lib/layout-inference.ts`

Change `equalizeSpacing` to accept an optional `controlScale` parameter:

```typescript
function equalizeSpacing(
  controls: CleanedControl[],
  axis: 'x' | 'y',
  targetGap?: number,       // NEW: explicit gap in pixels (overrides average)
  controlScale?: number,    // NEW: current editor scale (default 1.0)
): void {
```

When redistributing, scale the gap:
```typescript
const effectiveScale = controlScale ?? 1.0;
// If we have a target gap, use it. Otherwise use the averaged gap.
const baseGap = targetGap ?? Math.round(avgGap);
// Scale the gap so it looks correct at the current zoom level:
// At scale 0.5, we need 2x the frame gap to get the same visual gap.
const adjustedGap = Math.round(baseGap / effectiveScale);
```

**File:** `src/components/panel-editor/PanelEditor.tsx`

Pass `controlScale` from the store to `cleanupGeometry`:
```typescript
const handleCleanUp = useCallback(() => {
  const state = useEditorStore.getState();
  const { sections, controls, canvasWidth, canvasHeight, controlScale } = state;
  state.pushSnapshot();
  const cleaned = cleanupGeometry(sections, controls, canvasWidth, canvasHeight, controlScale);
  // ... apply cleaned positions
}, []);
```

**File:** `src/lib/layout-inference.ts`

Update `cleanupGeometry` signature:
```typescript
export function cleanupGeometry(
  sections: Record<string, SectionDef>,
  controls: Record<string, ControlDef>,
  canvasWidth: number,
  canvasHeight: number,
  controlScale?: number,    // NEW
): GeometryCleanupResult {
```

Thread `controlScale` to `equalizeSpacing` calls:
```typescript
equalizeSpacing(sectionControls, 'x', undefined, controlScale);
equalizeSpacing(sectionControls, 'y', undefined, controlScale);
```

### Part 2: Configurable Gap

Add a "Gap" input to the toolbar so the contractor can set an exact pixel spacing.

**File:** `src/components/panel-editor/store/canvasSlice.ts`

Add to state:
```typescript
cleanupGap: number;  // target gap in pixels for Clean Up (0 = auto/average)
setCleanupGap: (gap: number) => void;
```

Default: `cleanupGap: 8`

**File:** `src/components/panel-editor/EditorToolbar.tsx`

Add a small number input next to the Clean Up button:
```tsx
<label className="text-[10px] uppercase tracking-wider text-gray-500">Gap</label>
<input
  type="number"
  min={0}
  max={32}
  value={cleanupGap}
  onChange={(e) => setCleanupGap(Number(e.target.value))}
  className="h-6 w-10 rounded border border-gray-700 bg-gray-900 px-1 text-xs text-gray-300"
  title="Gap between controls in pixels (used by Clean Up)"
/>
```

**File:** `src/components/panel-editor/PanelEditor.tsx`

Pass `cleanupGap` to cleanup:
```typescript
const { cleanupGap, controlScale } = state;
const cleaned = cleanupGeometry(sections, controls, canvasWidth, canvasHeight, controlScale, cleanupGap);
```

Thread to `equalizeSpacing`:
```typescript
equalizeSpacing(sectionControls, 'x', cleanupGap > 0 ? cleanupGap : undefined, controlScale);
equalizeSpacing(sectionControls, 'y', cleanupGap > 0 ? cleanupGap : undefined, controlScale);
```

### Part 3: Save Gap Setting

The `cleanupGap` should persist like `controlScale` and `zoom`:

**File:** `src/components/panel-editor/hooks/useAutoSave.ts`

Add `cleanupGap` to:
- The change detection guard
- The PUT body
- The canvas change bypass

**File:** `src/components/panel-editor/PanelEditor.tsx`

Restore `cleanupGap` from saved data in the load path.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/lib/layout-inference.ts` | `equalizeSpacing` + `cleanupGeometry` accept scale + gap params |
| `src/components/panel-editor/PanelEditor.tsx` | Pass controlScale + cleanupGap to cleanup |
| `src/components/panel-editor/store/canvasSlice.ts` | Add `cleanupGap` state + action |
| `src/components/panel-editor/EditorToolbar.tsx` | Add Gap input next to Clean Up button |
| `src/components/panel-editor/hooks/useAutoSave.ts` | Persist cleanupGap |

---

## How It Works After the Fix

1. Contractor sets Scale to 50% to overlay on photo
2. Contractor sets Gap to 8px
3. Contractor rough-positions 6 knobs in a row
4. Clicks **Clean Up**
5. Engine computes: "8px visual gap at 50% scale = 16px frame gap"
6. Redistributes knobs with 16px between frames
7. **Knobs visually appear 8px apart** — matches what the generated panel will look like
8. Contractor clicks **Approve & Build** → generated panel has identical spacing

---

## What This Does NOT Change

- Generated panel rendering (already correct)
- manifest-editor.json format (just adds optional `cleanupGap` field)
- Undo/redo behavior (Clean Up already pushes snapshot)
- Control sizes (never modified by cleanup)
