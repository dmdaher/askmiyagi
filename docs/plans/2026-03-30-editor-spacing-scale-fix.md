# Editor Spacing, Scale & Panel Size — Complete Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Fix the full editor → codegen → generated panel pipeline so the contractor can position at reduced scale on a photo overlay, click Approve & Build, and get a correctly-spaced generated panel with no overlapping controls. Also allow proportional scaling of the entire generated panel.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## The Problem — Two Broken Paths

### Path A: Position on photo, skip Clean Up → Generated panel overlaps

1. Contractor sets Scale to 40%, overlays hardware photo
2. Places knobs precisely on top of photo knobs
3. At 40%, the visual knob is ~20px wide (CSS `transform: scale(0.4)` on a 49px container)
4. Two knobs look properly spaced at 40% — their 20px visuals have a clear gap
5. But their 49px containers OVERLAP (because the container is 2.5x wider than the visual)
6. Clicks Approve & Build (no cleanup)
7. Codegen reads container positions → generates panel at 100% → **knobs overlap**

```
Editor at 40% scale — what the contractor sees:
    ┌──────────┐         ┌──────────┐
    │  [knob]  │  10px   │  [knob]  │    ← visuals look fine
    │  49px    │  gap    │  49px    │    ← but containers overlap!
    └──────────┘         └──────────┘
        ◄─── 49px ───►◄── 49px ──►
                    ▲
              overlap zone

Generated panel at 100% — what the user sees:
    ┌──[KNOB]──┐──[KNOB]──┐               ← knobs overlap!
```

### Path B: Position on photo, use Clean Up → Spacing looks wrong at 40%

1. Same setup: 40% scale, photo overlay, precise placement
2. Clicks Clean Up → `equalizeSpacing` measures 49px container gaps (which are negative/overlapping)
3. Redistributes containers with positive gaps → knobs move away from photo positions
4. At 40% scale, the redistributed spacing looks way too spread out
5. Generated panel: actually looks perfect (containers properly spaced)
6. But the editor no longer matches the photo

### Root Cause

`controlScale` is **purely visual CSS** (`transform: scale(0.4)`). It makes controls LOOK smaller but the invisible Rnd container stays full size. All position/spacing math uses the full container size. Codegen ignores `controlScale` entirely.

---

## Complete Data Flow (Verified by Audit)

```
EDITOR (pixels, unscaled containers)
  │  User places knob at x=200, w=49 at controlScale=0.4
  │  Visual knob: 19.6px wide, centered at x=224.5
  │  Container: 49px wide at x=200
  │
  ▼
AUTO-SAVE → manifest-editor.json
  │  { x: 200, y: 50, w: 49, h: 49, controlScale: 0.4 }
  │
  ▼
CODEGEN API (pixel → percentage)
  │  editorPosition: { x: 16.7%, w: 4.1% }
  │  controlScale: 0.4 (CURRENTLY IGNORED ← the bug)
  │
  ▼
PANEL CODEGEN (percentage → pixels at panel size)
  │  panelWidth=800 → pxW = 4.1% × 800 = 33px
  │  Position: left: 16.7%
  │
  ▼
GENERATED PANEL
  │  Knob at left:16.7%, width:33px
  │  If two knobs overlap at container level → they overlap here too
```

---

## Solution: Three Parts

### Part 1: De-overlap at Codegen Time (CRITICAL)

When the contractor positions at reduced scale, their **visual centers are correct** (they match the hardware photo). The containers overlap because they're wider than the visual. The fix: **codegen adjusts positions so full-size controls don't overlap, preserving the visual centers**.

**File:** `src/app/api/pipeline/[deviceId]/codegen/route.ts`

After merging editor positions into the manifest, add a de-overlap pass:

```typescript
// Read controlScale from editor data
const controlScale = editorData.controlScale ?? 1;

// For each control, compute visual center (correct) and adjust for full-size container
if (controlScale < 1) {
  for (const control of manifest.controls) {
    const ec = editorControls[control.id];
    if (!ec) continue;

    // Visual center at the working scale = container center (transform-origin: center)
    // No position adjustment needed — centers are already correct.
    // The issue is that adjacent containers may overlap.
  }

  // De-overlap pass: for each section, find overlapping controls and push apart
  // preserving their relative center positions
  deOverlapControls(manifest.controls, canvasW, canvasH);
}
```

**New function `deOverlapControls`:**

```typescript
function deOverlapControls(controls: any[], canvasW: number, canvasH: number) {
  // Group controls by approximate Y center (same row)
  // For each row, sort by X, check for container overlaps
  // If two containers overlap, push the right one rightward by the overlap amount
  // Distribute the push evenly across the row to preserve relative positions

  const ROW_TOLERANCE = 15; // px — controls within 15px Y center are same row
  const MIN_GAP = 2; // px minimum gap between containers

  // ... group into rows, sort by x, redistribute overlaps
}
```

This is essentially the same logic as `equalizeSpacing`'s overlap branch, but run at codegen time on the manifest positions before percentage conversion.

**Why at codegen time, not in the editor?** Because the editor positions need to stay on the photo. The de-overlap only matters for the final rendered panel.

### Part 2: Scale-Aware Clean Up (Optional Tool)

When the contractor clicks Clean Up, the spacing math should account for `controlScale` so the result looks correct at the working scale.

**File:** `src/lib/layout-inference.ts`

Update `equalizeSpacing` and `cleanupGeometry` signatures:

```typescript
export function cleanupGeometry(
  sections: Record<string, SectionDef>,
  controls: Record<string, ControlDef>,
  canvasWidth: number,
  canvasHeight: number,
  controlScale?: number,
  targetGap?: number,
): GeometryCleanupResult {
```

When computing gaps, use **visual size** (w × controlScale) instead of container size:

```typescript
const effectiveScale = controlScale ?? 1.0;
// Visual edge of previous control
const prevVisualEnd = group[i-1][centerKey] + (group[i-1][sizeKey] * effectiveScale) / 2
                      + group[i-1][sizeKey] / 2;
// Actually simpler: the gap between visual edges at the center
// Since transform-origin is center, the visual occupies:
//   center ± (size × scale) / 2
// So visual gap between two controls =
//   (center2 - center1) - (size1 × scale / 2) - (size2 × scale / 2)
```

Or even simpler — use a target gap and redistribute from visual centers:

```typescript
const effectiveScale = controlScale ?? 1.0;
const baseGap = targetGap ?? Math.round(avgGap * effectiveScale);
// Redistribute using visual widths
const visualSize = (c) => c[sizeKey] * effectiveScale;
```

### Part 3: Configurable Gap Input

**File:** `src/components/panel-editor/store/canvasSlice.ts`

```typescript
cleanupGap: number;  // target gap in pixels for Clean Up (0 = auto)
setCleanupGap: (gap: number) => void;
```

Default: `cleanupGap: 8`

**File:** `src/components/panel-editor/EditorToolbar.tsx`

Small number input next to Clean Up button:

```tsx
<label className="text-[10px] uppercase tracking-wider text-gray-500">Gap</label>
<input
  type="number"
  min={0} max={32}
  value={cleanupGap}
  onChange={(e) => setCleanupGap(Number(e.target.value))}
  className="h-6 w-10 rounded border border-gray-700 bg-gray-900 px-1 text-xs text-gray-300"
  title="Gap between controls in pixels (used by Clean Up)"
/>
```

### Part 4: Panel Scale Multiplier

Allow the contractor to scale the ENTIRE generated panel proportionally.

**How it works:** The generated panel uses percentage-based positioning. Control pixel sizes are computed as `(percentage / 100) × panelWidth`. If we multiply `panelWidth` and `panelHeight`, EVERYTHING scales proportionally — positions, sizes, gaps, keyboard, all of it.

**File:** `src/components/panel-editor/store/canvasSlice.ts`

```typescript
panelScale: number;  // 0.5 - 2.0, default 1.0
setPanelScale: (s: number) => void;
```

**File:** `src/components/panel-editor/EditorToolbar.tsx`

Slider near Approve & Build:

```tsx
<label className="text-[10px] uppercase tracking-wider text-gray-500">Panel</label>
<input
  type="range"
  min={50} max={200} step={10}
  value={Math.round(panelScale * 100)}
  onChange={(e) => setPanelScale(Number(e.target.value) / 100)}
  className="h-1 w-16 cursor-pointer accent-blue-500"
  title={`Panel Scale: ${Math.round(panelScale * 100)}%`}
/>
<span className="w-8 text-center text-[10px] text-gray-400">
  {Math.round(panelScale * 100)}%
</span>
```

**File:** `src/app/api/pipeline/[deviceId]/codegen/route.ts`

Apply panel scale before running codegen:

```typescript
const panelScale = editorData.panelScale ?? 1;
const scaledPanelW = Math.round(basePanelW * panelScale);
const scaledPanelH = Math.round(basePanelH * panelScale);
// Pass to codegen script
execSync(`npx tsx scripts/panel-codegen.ts ${deviceId} --width ${scaledPanelW} --height ${scaledPanelH}`);
```

Since all positioning is percentage-based, increasing the panel dimensions makes everything proportionally bigger. A 1.2x panel scale means:
- Knobs grow from 33px to 40px
- Gaps grow from 8px to 10px
- Positions stay at same percentages (16.7% left is 16.7% left)
- The entire instrument looks 20% bigger

**File:** `src/components/panel-editor/hooks/useAutoSave.ts`

Persist `panelScale` and `cleanupGap` alongside `controlScale` and `zoom`.

**File:** `src/components/panel-editor/PanelEditor.tsx`

Restore `panelScale` and `cleanupGap` from saved data.

### Part 5: Future — End User Scale (not now)

For end users viewing the panel in the studio, a CSS `transform: scale()` wrapper around PanelShell would let them zoom in/out. No codegen change — purely frontend. Deferred for later.

---

## End-to-End Flow After Fix

```
1. Contractor overlays photo at 40% scale
2. Positions knobs precisely on hardware photo
3. (Optional) Clicks Clean Up with Gap=8 → scale-aware spacing
4. Adjusts Panel Scale slider to 120% for bigger final controls
5. Clicks Approve & Build
6. CODEGEN:
   a. Reads positions from manifest-editor.json
   b. Reads controlScale=0.4
   c. Runs de-overlap: pushes overlapping containers apart from their centers
   d. Applies panelScale=1.2 to panel dimensions (800→960, 400→480)
   e. Converts to percentages, generates panel
7. Generated panel:
   - Controls positioned at de-overlapped percentages
   - All controls 20% larger than default (panel scale 1.2x)
   - No overlaps, proper spacing
   - Proportional to the editor layout
```

---

## Files Changed

| File | What Changes |
|------|-------------|
| `src/app/api/pipeline/[deviceId]/codegen/route.ts` | De-overlap pass using controlScale; apply panelScale to dimensions |
| `src/lib/layout-inference.ts` | `equalizeSpacing` + `cleanupGeometry` accept scale + gap params |
| `src/components/panel-editor/PanelEditor.tsx` | Pass controlScale + cleanupGap to cleanup |
| `src/components/panel-editor/store/canvasSlice.ts` | Add `cleanupGap` + `panelScale` state |
| `src/components/panel-editor/EditorToolbar.tsx` | Add Gap input + Panel Scale slider |
| `src/components/panel-editor/hooks/useAutoSave.ts` | Persist cleanupGap + panelScale |

---

## Undo/Redo Impact

- **Clean Up** already pushes snapshot → fully undoable (verified by audit)
- **De-overlap** runs at codegen time, never modifies editor state → no undo impact
- **Panel Scale** is a canvas setting (like zoom) → NOT in undo snapshots, survives via auto-save
- **Cleanup Gap** is a canvas setting → same as Panel Scale

---

## What This Does NOT Change

- manifest-editor.json format (adds optional `cleanupGap`, `panelScale` fields)
- Existing editor positioning workflow
- Undo/redo behavior
- Control sizes in the editor
- Fantom-08 hand-built panel (untouched)
