# Editor & Codegen Master Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Fix the full editor → inference → codegen → generated panel pipeline so contractor sizes are preserved end-to-end, spacing works on overlapping controls, and inference is optional.

**Branch:** `feature/pipeline-architecture-upgrade` (targets `test`)

---

## Priority Table

| # | Feature | Plan File | Status |
|---|---------|-----------|--------|
| **P1** | Codegen size fix (critical bug) | This file, Phase 1 | Not started |
| **P2** | Inference spacing fix (overlapping controls) | This file, Phase 2 | Not started |
| **P3** | Separate Clean Up from Approve & Build | This file, Phase 3 | Not started |
| **P4** | Version History UI | `2026-03-26-version-history-ui-design.md` | Design complete |
| **P5** | Sub-section grouping + labels | `2026-03-26-editor-label-and-section-features.md` | Design complete |

---

## Already Fixed (2026-03-26 session)

- `normalizeSizes` removed from `cleanupGeometry` — was averaging sizes to defaults
- `GAP_TOLERANCE` loosened from 6px → 15px + 40% proportional fallback
- `controlScale` and `zoom` persist across refresh
- 10-backup limit removed (append-only backups)

---

## Phase 1: Codegen Size Fix (CRITICAL)

### Root Cause

`scripts/panel-codegen.ts` has two rendering paths:

| Path | Function | Passes pxW/pxH? | Result |
|------|----------|-----------------|--------|
| Flat panel | `generateFlatPanel()` line ~1174 | YES | Controls sized correctly |
| Section-based | `renderAbsolutePositioned()` line ~943 | **NO** | Controls get hardcoded defaults |

When `renderAbsolutePositioned()` calls `renderControl()` without pixel dimensions, button sizing falls back to hardcoded `size="lg"` or `size="md"` instead of computing from the contractor's dimensions.

### Task 1.1: Pass pixel dimensions in renderAbsolutePositioned

**File:** `scripts/panel-codegen.ts`

Find `renderAbsolutePositioned()` (~line 920-966). It currently does:
```typescript
const controlJsxStr = renderControl(id, ctrl!, '            ', controlMap);
```

Fix: Compute pxW/pxH from editorPosition percentages (same as generateFlatPanel does):
```typescript
const ep = ctrl!.editorPosition;
const pxW = ep ? Math.round((ep.w / 100) * panelWidth) : undefined;
const pxH = ep ? Math.round((ep.h / 100) * panelHeight) : undefined;
const controlJsxStr = renderControl(id, ctrl!, '            ', controlMap, pxW, pxH);
```

Ensure `panelWidth` and `panelHeight` are accessible in scope (they should already be from the parent function).

### Task 1.2: Verify renderControl uses pxW/pxH correctly for all control types

**File:** `scripts/panel-codegen.ts` — `renderControl()` (~line 91-375)

Confirm these mappings work with contractor dimensions:
- **Buttons** (line ~160): `size = pxH <= 32 ? 'sm' : pxH <= 48 ? 'md' : 'lg'` — OK
- **Knobs** (line ~184): `outerSize = Math.min(pxW, pxH)` — OK
- **Sliders** (line ~229): `trackHeight = pxH - 20` — OK
- **Wheels** (line ~242): `wheelSize = Math.min(pxW, pxH)` — OK
- **Screens**: Verify sizing path exists

### Task 1.3: Regenerate affected panels

After fix, regenerate all device panels:
```bash
npx tsx scripts/panel-codegen.ts cdj-3000
npx tsx scripts/panel-codegen.ts fantom-06
```

Verify generated section files now have computed sizes instead of hardcoded.

### Task 1.4: Test — compare editor sizes vs generated panel sizes

For fantom-06 zone knobs:
1. Read manifest-editor.json → get knob w/h (e.g., 49x47)
2. Read generated section file → verify knob outerSize matches
3. Visual check in browser — knobs should be same size as in editor

---

## Phase 2: Inference Engine Spacing Fix

### Root Cause

`equalizeSpacing()` in `src/lib/layout-inference.ts` skips rows where controls overlap (negative average gap). The `avgGap >= 0` guard bails out entirely, leaving overlapping controls untouched.

**Real data (fantom-06 zone, 8 knobs):**
```
knob-1 → knob-2: -22.0px
knob-2 → knob-3: -10.8px
knob-3 → knob-4: -26.3px
...all gaps negative — equalizer does nothing
```

### Task 2.1: Add overlap redistribution to equalizeSpacing

**File:** `src/lib/layout-inference.ts`

Add constant: `const MIN_GAP = 4;`

After the existing `if (allSimilar && avgGap >= 0)` block, add an else branch:

```typescript
if (allSimilar && avgGap >= 0) {
  // Existing: equalize similar positive gaps
  const roundedGap = Math.round(avgGap);
  let currentPos = group[0][centerKey];
  for (let i = 1; i < group.length; i++) {
    currentPos = group[i - 1][centerKey] + group[i - 1][sizeKey] + roundedGap;
    group[i][centerKey] = currentPos;
  }
} else if (avgGap < 0) {
  // NEW: overlapping controls — redistribute with equal positive gaps
  const totalContent = group.reduce((sum, c) => sum + c[sizeKey], 0);
  const spanStart = group[0][centerKey];
  const spanEnd = group[group.length - 1][centerKey] + group[group.length - 1][sizeKey];
  const availableSpace = spanEnd - spanStart;

  if (availableSpace >= totalContent + (group.length - 1) * MIN_GAP) {
    // Enough room in current span — distribute evenly
    const gap = Math.round((availableSpace - totalContent) / (group.length - 1));
    let pos = spanStart;
    for (const ctrl of group) {
      ctrl[centerKey] = pos;
      pos += ctrl[sizeKey] + gap;
    }
  } else {
    // Not enough room — expand rightward from first control with MIN_GAP
    let pos = group[0][centerKey];
    for (const ctrl of group) {
      ctrl[centerKey] = pos;
      pos += ctrl[sizeKey] + MIN_GAP;
    }
  }
}
```

### Task 2.2: Test with fantom-06 zone knobs

1. Load fantom-06 editor
2. Click "Clean Up" (or Approve & Build if Phase 3 not done yet)
3. Verify: 8 zone knobs evenly spaced, no overlaps, all gaps positive and equal

---

## Phase 3: Separate Clean Up from Approve & Build

### Architecture

**Current flow (coupled):**
```
Approve & Build → cleanupGeometry() → inferLayout() → InferenceReview → Codegen
```

**New flow (decoupled):**
```
Clean Up (optional) → cleanupGeometry() → show diff → accept/reject
Approve & Build     → take positions as-is → Codegen (polish only)
```

### Task 3.1: Add "Clean Up" button to EditorToolbar

**File:** `src/components/panel-editor/EditorToolbar.tsx`

Add new prop: `onCleanUp: () => void`

Place button between the Scale slider and Grid toggle (after the divider):
```tsx
<button
  onClick={onCleanUp}
  disabled={previewMode || buildStatus === 'building'}
  className="flex h-6 items-center gap-1 rounded px-2 text-xs text-gray-500
             transition-colors hover:bg-gray-800 hover:text-gray-300"
  title="Clean Up — snap rows, equalize spacing (optional)"
>
  <span className="text-[10px]">Clean Up</span>
</button>
```

### Task 3.2: Create handleCleanUp in PanelEditor

**File:** `src/components/panel-editor/PanelEditor.tsx`

New handler that runs cleanup WITHOUT codegen:
```typescript
const handleCleanUp = useCallback(() => {
  const state = useEditorStore.getState();
  const { sections, controls, canvasWidth, canvasHeight } = state;

  // Snapshot for undo
  state.pushSnapshot();

  // Run geometry cleanup
  const cleaned = cleanupGeometry(sections, controls, canvasWidth, canvasHeight);

  // Apply cleaned positions to canvas
  const updatedControls = { ...controls };
  const updatedSections = { ...sections };
  for (const cs of cleaned.sections) {
    if (updatedSections[cs.id]) {
      updatedSections[cs.id] = { ...updatedSections[cs.id], x: cs.x, y: cs.y, w: cs.w, h: cs.h };
    }
    for (const cc of cs.controls) {
      if (updatedControls[cc.id]) {
        updatedControls[cc.id] = { ...updatedControls[cc.id], x: cc.x, y: cc.y };
        // NOTE: w/h NOT overwritten — sizes are sacred
      }
    }
  }
  useEditorStore.setState({ sections: updatedSections, controls: updatedControls });
}, []);
```

Key difference from current handleApproveAndBuild:
- Calls `pushSnapshot()` so Cmd+Z reverts the cleanup
- Does NOT show InferenceReview modal
- Does NOT trigger codegen
- Does NOT change buildStatus
- Only applies position snapping, NOT size changes

### Task 3.3: Simplify handleApproveAndBuild — remove inference

**File:** `src/components/panel-editor/PanelEditor.tsx`

Modify `handleApproveAndBuild` to skip `cleanupGeometry` and `inferLayout`:
```typescript
const handleApproveAndBuild = useCallback(async () => {
  const state = useEditorStore.getState();
  const { sections, controls, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom } = state;
  setBuildStatus('building');
  setCodegenError(null);

  try {
    // Force-save current manifest
    await fetch(`/api/pipeline/${deviceId}/manifest`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections, controls, canvasWidth, canvasHeight, _manifestVersion, controlScale, zoom }),
    });

    // Trigger codegen directly — no cleanup, no inference
    const codegenRes = await fetch(`/api/pipeline/${deviceId}/codegen`, { method: 'POST' });
    if (!codegenRes.ok) {
      const body = await codegenRes.json().catch(() => ({}));
      throw new Error(body.error ? `${body.error}: ${body.stderr || body.details || ''}` : 'Codegen failed');
    }

    setPreviewMode(true);
    setBuildStatus('idle');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setCodegenError(message);
    setBuildStatus('idle');
  }
}, [deviceId]);
```

### Task 3.4: Remove InferenceReview from Approve & Build flow

With the split, InferenceReview is no longer needed in the build flow. Options:
- **Keep it** as an optional "Advanced" view accessible from Clean Up (future)
- **Remove it** to simplify — Clean Up just applies and you Cmd+Z if unhappy

Recommendation: Remove for now. Clean Up + Cmd+Z is sufficient. The contractor can see the snapping happen in real-time and undo if wrong.

### Task 3.5: Update EditorToolbar props

**File:** `src/components/panel-editor/EditorToolbar.tsx`

Add `onCleanUp` prop, wire button. Update interface:
```typescript
interface EditorToolbarProps {
  previewMode: boolean;
  buildStatus: 'idle' | 'building' | 'approved';
  onApproveAndBuild: () => void;
  onCleanUp: () => void;        // NEW
  onReportIssue?: () => void;
}
```

### Task 3.6: Verify codegen receives contractor sizes end-to-end

After Phase 1 fix + Phase 3 simplification:
1. Edit control sizes in editor
2. Click "Approve & Build" (no cleanup runs)
3. Codegen reads manifest-editor.json → converts to percentages → passes pxW/pxH
4. Generated panel renders controls at contractor's exact sizes
5. No size inflation, no normalization, no defaults overriding custom work

---

## Phase 4: Version History UI (Design Complete)

See `docs/plans/2026-03-26-version-history-ui-design.md`

- API: `GET /api/pipeline/{deviceId}/versions` + `POST .../versions/restore`
- UI: "History" dropdown in toolbar, timestamped entries, one-click restore
- Storage: disk backups in `.pipeline/{id}/backups/` (append-only, no limit)

---

## Phase 5: Sub-Section Grouping + Labels (Design Complete)

See `docs/plans/2026-03-26-editor-label-and-section-features.md`

- Sub-section grouping: select controls → right-click → "Group" with layout picker
- Global label sizing: "Set All Labels" dropdown
- Label wrapping: multi-line labels
- Standalone labels: free text not tied to controls
- 3 critical prerequisites: historySlice, useAutoSave, restore path must support controlGroups

---

## Key Files Reference

| File | What it does | Phases |
|------|-------------|--------|
| `scripts/panel-codegen.ts` | Generates React components from manifest | P1 |
| `src/lib/layout-inference.ts` | Cleanup + spacing + archetype detection | P2 |
| `src/components/panel-editor/PanelEditor.tsx` | Editor shell, Approve & Build handler | P1, P3 |
| `src/components/panel-editor/EditorToolbar.tsx` | Toolbar buttons | P3, P4 |
| `src/components/panel-editor/InferenceReview.tsx` | Inference modal (may be removed) | P3 |
| `src/components/panel-editor/hooks/useAutoSave.ts` | Auto-save with controlScale/zoom | P4, P5 |
| `src/components/panel-editor/store/manifestSlice.ts` | Editor store, DEFAULT_SIZES | P5 |
| `src/components/panel-editor/store/historySlice.ts` | Undo/redo snapshots | P5 |
| `src/app/api/pipeline/[deviceId]/manifest/route.ts` | GET/PUT editor manifest, backups | P4 |
| `src/app/api/pipeline/[deviceId]/codegen/route.ts` | Codegen API, pixel→% conversion | P1 |
