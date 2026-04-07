# Inference Engine Spacing Fix — Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Fix the inference engine and codegen so controls in a row (like zone knobs) get equal spacing without overlapping.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## Problem Statement

Two bugs compound to create overlapping controls:

### Bug 1: `equalizeSpacing` skips overlapping controls

**File:** `src/lib/layout-inference.ts` — `equalizeSpacing()` (line ~774)

The function computes gaps between adjacent controls. When controls overlap (negative gaps), the average gap is negative, and the `avgGap >= 0` guard causes the function to skip entirely. It does nothing.

**Real data from fantom-06 zone section (8 knobs):**
```
knob-1 → knob-2: -22.0px (overlapping)
knob-2 → knob-3: -10.8px (overlapping)
knob-3 → knob-4: -26.3px (overlapping)
...all gaps are negative
```

The equalizer should REDISTRIBUTE overlapping controls with positive equal gaps, not skip them.

### Bug 2: Codegen/cleanup increases control sizes, causing new overlaps

When "Approve & Build" or "Generate" runs, control sizes get enlarged somewhere in the pipeline. The contractor's custom sizes (e.g., 48x48 knobs) end up at larger dimensions, causing controls that were properly spaced to start overlapping.

**Likely culprits (investigate in order):**
1. `scripts/panel-codegen.ts` — may apply `DEFAULT_SIZES` or `SIZE_CLASS_DIMS` during generation, ignoring the contractor's editor sizes
2. The inferred layout API (`/api/pipeline/{deviceId}/inferred-layout`) — may transform sizes
3. The cleanup-then-codegen flow in `handleInferenceGenerate` — may lose size data between steps

**Key rule:** Contractor's w/h from manifest-editor.json are sacred. No step in the Approve & Build → Codegen pipeline should override them.

---

## Fix Plan

### Task 1: Fix `equalizeSpacing` to handle overlapping controls

**File:** `src/lib/layout-inference.ts`

Current logic:
```typescript
if (allSimilar && avgGap >= 0) {
  // redistribute with equal gaps
}
```

Fix: When `avgGap < 0` (overlapping), calculate the total span needed and redistribute with a minimum positive gap.

```typescript
if (allSimilar && avgGap >= 0) {
  // Current path: equalize similar gaps
  const roundedGap = Math.round(avgGap);
  // ... redistribute
} else if (avgGap < 0) {
  // NEW: overlapping controls — redistribute with minimum spacing
  // Total content width = sum of all control widths
  // Available space = last control end - first control start
  // If not enough space, use a minimum gap (e.g., 4px)
  const totalContentWidth = group.reduce((sum, c) => sum + c[sizeKey], 0);
  const availableWidth = group[group.length - 1][centerKey] + group[group.length - 1][sizeKey] - group[0][centerKey];
  const neededWidth = totalContentWidth + (group.length - 1) * MIN_GAP;

  if (availableWidth >= neededWidth) {
    // Enough room — distribute evenly
    const gap = (availableWidth - totalContentWidth) / (group.length - 1);
    // redistribute...
  } else {
    // Not enough room — expand from first control's position using MIN_GAP
    let pos = group[0][centerKey];
    for (const ctrl of group) {
      ctrl[centerKey] = pos;
      pos += ctrl[sizeKey] + MIN_GAP;
    }
  }
}
```

Add constant: `const MIN_GAP = 4;` (minimum pixels between controls)

### Task 2: Trace and fix size inflation in codegen pipeline

**Investigation steps:**
1. Read `scripts/panel-codegen.ts` — search for `DEFAULT_SIZES`, `SIZE_CLASS_DIMS`, `defaultSize`, any `w =` or `h =` assignments
2. Read `/api/pipeline/{deviceId}/inferred-layout/route.ts` — check if sizes are transformed
3. Read `/api/pipeline/{deviceId}/codegen/route.ts` — check if sizes are overridden before codegen
4. Compare: dump control sizes from manifest-editor.json vs what codegen receives vs what the generated panel renders

**Expected fix:** Codegen must read w/h from the editor manifest and use them as-is. Any fallback to DEFAULT_SIZES should only apply when editor w/h is missing.

### Task 3: Add guard — codegen must never enlarge contractor sizes

In `scripts/panel-codegen.ts`, add a rule: if a control has editor-provided dimensions (w/h from manifest-editor.json), those dimensions are used verbatim. Default sizes are ONLY for controls missing dimensions entirely.

### Task 4: Verify with fantom-06 zone knobs

After fixes:
1. Load fantom-06 editor
2. Position 8 zone knobs in a row with roughly equal spacing
3. Click "Approve & Build"
4. Verify: knobs should be equally spaced, NO overlapping, sizes unchanged
5. Click "Generate"
6. Verify: generated panel has same sizes and spacing as editor

---

## Already Fixed (This Session)

- `normalizeSizes` removed from `cleanupGeometry` — was averaging control sizes back to defaults
- `GAP_TOLERANCE` loosened from 6px to 15px + 40% proportional fallback
- `controlScale` and `zoom` now persist across refresh
- 10-backup limit removed (append-only)

## Key Files

- `src/lib/layout-inference.ts` — `equalizeSpacing()`, `cleanupGeometry()`
- `scripts/panel-codegen.ts` — panel generation from manifest
- `src/components/panel-editor/PanelEditor.tsx` — Approve & Build flow
- `src/components/panel-editor/store/manifestSlice.ts` — `DEFAULT_SIZES`, `SIZE_CLASS_DIMS`
- `.pipeline/fantom-06/manifest-editor.json` — test data with overlapping knobs
