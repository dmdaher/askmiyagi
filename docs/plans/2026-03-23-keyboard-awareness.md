# Keyboard Awareness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Pipeline-generated instruments with keyboards render the keyboard at the bottom, controls in the panel area above, with correct proportions matching real hardware.

**Architecture:** Add `keyboard` field to manifest schema. Create shared `Keyboard` component from Fantom-08's implementation. Update gatekeeper SOUL with keyboard detection + layout quality rules. Update codegen and editor to respect keyboard/panel split. Re-run Fantom-06 gatekeeper.

**Tech Stack:** React, Framer Motion, TypeScript, existing noteHelpers + keyboard types

---

## Task 1: Create Shared Keyboard Component

**Files:**
- Create: `src/components/controls/Keyboard.tsx`
- Create: `src/components/controls/__tests__/Keyboard.test.tsx`
- Reference: `src/components/devices/fantom-08/Keyboard.tsx` (source to adapt from)
- Reference: `src/types/keyboard.ts` (ZoneConfig interface)
- Reference: `src/lib/noteHelpers.ts` (generateKeyboardNotes, noteInZone, midiNoteToName)

**What it does:** A shared keyboard component that works for any key count (25, 37, 49, 61, 76, 88). Adapted from Fantom-08's Keyboard.tsx with configurable key range. Fantom-08 stays untouched.

**Step 1: Write the failing test**

```tsx
// src/components/controls/__tests__/Keyboard.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Keyboard from '../Keyboard';

describe('Keyboard', () => {
  it('renders white and black keys', () => {
    const { container } = render(<Keyboard keys={61} startNote="C2" />);
    // 61-key keyboard has 36 white keys and 25 black keys
    const whiteKeys = container.querySelectorAll('[data-key-type="white"]');
    const blackKeys = container.querySelectorAll('[data-key-type="black"]');
    expect(whiteKeys.length).toBeGreaterThan(0);
    expect(blackKeys.length).toBeGreaterThan(0);
    expect(whiteKeys.length + blackKeys.length).toBe(61);
  });

  it('renders correct key count for 25-key keyboard', () => {
    const { container } = render(<Keyboard keys={25} startNote="C3" />);
    const allKeys = container.querySelectorAll('[data-key-type]');
    expect(allKeys.length).toBe(25);
  });

  it('renders with zone coloring', () => {
    const zones = [
      { zoneNumber: 1, color: '#ff0000', lowNote: 36, highNote: 60, label: 'Zone 1' },
    ];
    const { container } = render(<Keyboard keys={61} startNote="C2" zones={zones} />);
    expect(container.firstChild).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/controls/__tests__/Keyboard.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the component**

Adapt from `src/components/devices/fantom-08/Keyboard.tsx`:
- Add `keys` and `startNote` props (instead of hardcoded 88-key range)
- Convert `startNote` string (e.g., "C2") to MIDI number using `noteNameToMidi` from noteHelpers
- Calculate `highestNote = lowestNote + keys - 1`
- Pass `lowestNote, highestNote` to `generateKeyboardNotes()`
- Add `data-key-type="white"` / `data-key-type="black"` attributes for testing
- Keep all existing visual treatments (gradients, shadows, zone coloring, C note labels)
- Keep `highlightedKeys` prop

Interface:
```tsx
interface KeyboardProps {
  keys: number;        // 25, 37, 49, 61, 76, 88
  startNote: string;   // e.g., "C2"
  zones?: ZoneConfig[];
  highlightedKeys?: number[];
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/controls/__tests__/Keyboard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/controls/Keyboard.tsx src/components/controls/__tests__/Keyboard.test.tsx
git commit -m "checkpoint: shared Keyboard component with configurable key count"
```

---

## Task 2: Update PanelShell to Support Keyboard

**Files:**
- Modify: `src/components/controls/PanelShell.tsx`
- Modify: `src/components/controls/__tests__/PanelShell.test.tsx`

**What it does:** PanelShell accepts an optional `keyboard` prop. When present, it renders the shared Keyboard component at the bottom of the panel, and wraps the panel content (controls) in a container that only occupies the top portion (`panelHeightPercent`).

**Step 1: Write the failing test**

Add to existing PanelShell tests:

```tsx
it('renders keyboard when keyboard prop is provided', () => {
  render(
    <PanelShell
      manufacturer="Roland"
      deviceName="FANTOM-06"
      width={1200}
      height={361}
      keyboard={{ keys: 61, startNote: 'C2', panelHeightPercent: 35 }}
    >
      <div data-testid="controls">Controls</div>
    </PanelShell>
  );
  // Keyboard should render keys
  const keys = document.querySelectorAll('[data-key-type]');
  expect(keys.length).toBe(61);
});

it('does not render keyboard when keyboard prop is null', () => {
  render(
    <PanelShell manufacturer="Pioneer" deviceName="CDJ-3000" width={1200} height={1470}>
      <div />
    </PanelShell>
  );
  const keys = document.querySelectorAll('[data-key-type]');
  expect(keys.length).toBe(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/controls/__tests__/PanelShell.test.tsx`
Expected: FAIL — keyboard prop not accepted / no keys rendered

**Step 3: Modify PanelShell**

Add optional `keyboard` prop to PanelShellProps:
```tsx
keyboard?: {
  keys: number;
  startNote: string;
  panelHeightPercent: number;
} | null;
```

When `keyboard` is provided:
- Panel content (children) goes in a `div` with `height: {panelHeightPercent}%`
- Keyboard renders below in a `div` with `height: {100 - panelHeightPercent}%`

When `keyboard` is null/undefined:
- Children fill the full space (current behavior, no change)

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/controls/__tests__/PanelShell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/controls/PanelShell.tsx src/components/controls/__tests__/PanelShell.test.tsx
git commit -m "checkpoint: PanelShell renders keyboard when keyboard prop provided"
```

---

## Task 3: Update Codegen to Render Keyboard

**Files:**
- Modify: `scripts/panel-codegen.ts`

**What it does:** When the manifest has a `keyboard` field, codegen passes it to `<PanelShell>` as a prop. The keyboard renders automatically via PanelShell.

**Step 1: Identify changes**

In `generateFlatPanel()` and `generateSectionBasedPanel()`:
- Read `manifest.keyboard` field
- If present, pass `keyboard` prop to `<PanelShell>`
- Add `Keyboard` to imports (PanelShell imports it internally, but constants file may reference it)

The PanelShell JSX changes from:
```tsx
<PanelShell manufacturer={...} deviceName={...} width={...} height={...}>
```
to:
```tsx
<PanelShell manufacturer={...} deviceName={...} width={...} height={...} keyboard={${keyboardProp}}>
```

Where `keyboardProp` is either the manifest's keyboard object or `null`.

**Step 2: Make the changes**

In both `generateFlatPanel` and `generateSectionBasedPanel`:
```tsx
const keyboardProp = manifest.keyboard
  ? `{{ keys: ${manifest.keyboard.keys}, startNote: '${manifest.keyboard.startNote}', panelHeightPercent: ${manifest.keyboard.panelHeightPercent} }}`
  : 'null';
```

Add `keyboard={${keyboardProp}}` to the PanelShell JSX.

**Step 3: Verify codegen produces valid TSX**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Commit**

```bash
git add scripts/panel-codegen.ts
git commit -m "checkpoint: codegen passes keyboard prop to PanelShell"
```

---

## Task 4: Update Editor to Respect Keyboard/Panel Split

**Files:**
- Modify: `src/components/panel-editor/store/manifestSlice.ts`
- Modify: `src/components/panel-editor/PanelEditor.tsx`

**What it does:** When manifest has `keyboard`, the editor:
- Places controls only in the panel area (top `panelHeightPercent`)
- Renders a non-editable keyboard at the bottom of the canvas

**Step 1: Modify `loadFromManifest`**

In `manifestSlice.ts`, when `manifest.keyboard` is present:
- `effectiveCanvasH` becomes `effectiveCanvasH * (keyboard.panelHeightPercent / 100)` for section placement
- Section bounding box y-coordinates scale within the panel area only
- Store `keyboard` field in the editor state for rendering

**Step 2: Modify editor canvas rendering**

In `PanelEditor.tsx` or `PanCanvas.tsx`:
- If keyboard data exists in state, render `<Keyboard>` at the bottom of the canvas
- Keyboard is read-only (not draggable, not selectable)
- Canvas total height stays the same (full instrument)

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Commit**

```bash
git add src/components/panel-editor/store/manifestSlice.ts src/components/panel-editor/PanelEditor.tsx
git commit -m "checkpoint: editor places controls in panel area, renders keyboard below"
```

---

## Task 5: Update Gatekeeper SOUL with Keyboard + Layout Rules

**Files:**
- Modify: `.claude/agents/gatekeeper.md`

**What it does:** Adds five new rules to the gatekeeper agent instructions.

**Changes to make:**

Add to the "REQUIRED top-level fields" section:

```markdown
- `keyboard`: `{ keys, startNote, type, panelHeightPercent }` or `null`
  - Read the manual's specs/dimensions page — it always lists key count and range
  - If the instrument has keys: set `keys` (25/37/49/61/76/88), `startNote` (e.g., "C2"), `type: "standard"`, and `panelHeightPercent` (estimate from hardware photo — typically 30-40% for synths)
  - If no keyboard (DJ equipment, drum machines, effects): set `keyboard: null`
  - **CRITICAL:** When keyboard is present, ALL section panelBoundingBox y-values must be within 0 to panelHeightPercent. Controls do NOT go in the keyboard area.
```

Add new section "LAYOUT QUALITY RULES":

```markdown
### LAYOUT QUALITY RULES (MANDATORY)

1. **No overlapping bounding boxes:** Every section's panelBoundingBox must be exclusive — no section's rectangle may overlap another's. If two sections share x-space, they must be at different y-positions (stacked), not overlapping.

2. **Grid detection for pads:** When the manual shows a pad grid (e.g., 4 rows × 4 columns = 16 pads), specify the archetype as `grid-4x4` with `gridRows: 4, gridCols: 4`. Do NOT flatten a 4×4 grid into `single-row` or `cluster-above-anchor`. Look at the hardware photo — if pads form a square, it's a grid.

3. **Spanning sections:** Some controls span across the bottom of multiple sections (e.g., tone category buttons). Give these their own section with a bounding box that reflects their actual position — a thin, wide rectangle at the bottom of the panel area.

4. **Keyboard area constraint:** When `keyboard` is set, all panelBoundingBox values must have `y + h <= panelHeightPercent`. No controls in the keyboard zone.
```

Add keyboard example to the manifest JSON example:

```json
"keyboard": {
  "keys": 61,
  "startNote": "C2",
  "type": "standard",
  "panelHeightPercent": 35
}
```

**Step 1: Apply all changes to gatekeeper.md**

**Step 2: Commit**

```bash
git add .claude/agents/gatekeeper.md
git commit -m "checkpoint: gatekeeper SOUL — keyboard detection + layout quality rules"
```

---

## Task 6: Update Diagram Parser SOUL for Keyboard Boundary

**Files:**
- Modify: `.claude/agents/diagram-parser.md`

**What it does:** Tells the diagram parser to identify the keyboard boundary in hardware photos and report what percentage of the instrument is control panel vs keyboard.

**Changes to make:**

Add to the extraction steps:

```markdown
#### Step 7: Keyboard Boundary Detection
If the instrument has a keyboard visible in the photo:
- Identify the horizontal boundary between the control panel and the keyboard
- Report `panelHeightPercent`: the percentage of total instrument height that is control panel (above the keyboard)
- Typical values: 30-40% for full-size synths, higher for mini-keys or compact controllers
- Include in the spatial-blueprint output as a top-level field

If no keyboard is visible: report `panelHeightPercent: 100` (full instrument is controls)
```

**Step 1: Apply changes to diagram-parser.md**

**Step 2: Commit**

```bash
git add .claude/agents/diagram-parser.md
git commit -m "checkpoint: diagram parser SOUL — keyboard boundary detection"
```

---

## Task 7: Add Manifest Validator for Keyboard Field

**Files:**
- Modify: `src/lib/pipeline/checkpoint-validators.ts`

**What it does:** The manifest completeness validator checks for the keyboard field and validates that section bounding boxes respect the panel height constraint.

**Step 1: Add validation**

In `validateManifestCompleteness()` or `validateGatekeeperManifest()`:

```typescript
// Check keyboard field
if (manifest.keyboard) {
  const kb = manifest.keyboard;
  if (!kb.keys || !kb.startNote || !kb.panelHeightPercent) {
    errors.push('keyboard field missing required sub-fields: keys, startNote, panelHeightPercent');
    score -= 1.0;
  }
  // Validate sections don't extend into keyboard area
  const maxY = kb.panelHeightPercent;
  for (const section of manifest.sections) {
    const bb = section.panelBoundingBox;
    if (bb && (bb.y + bb.h) > maxY + 2) { // 2% tolerance
      errors.push(`Section "${section.id}" extends below panel area (y+h=${bb.y + bb.h}% > ${maxY}%)`);
      score -= 0.5;
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/pipeline/checkpoint-validators.ts
git commit -m "checkpoint: manifest validator checks keyboard field + panel height constraint"
```

---

## Task 8: Reset Fantom-06 Pipeline and Re-run Gatekeeper

**Files:** No code changes — pipeline operation only

**What it does:** Reset the Fantom-06 pipeline back to the gatekeeper phase so it re-runs with the improved SOUL.

**Step 1: Reset pipeline state**

```bash
# Reset Fantom-06 to gatekeeper phase
curl -X POST http://localhost:3000/api/pipeline/fantom-06/recover \
  -H 'Content-Type: application/json' \
  -d '{"action": "reset-failed"}'
```

Or manually edit `.pipeline/fantom-06/state.json`:
- Set `currentPhase` to `phase-0-gatekeeper`
- Set `status` to `paused`
- Clear phases after preflight

**Step 2: Start pipeline**

```bash
curl -X POST http://localhost:3000/api/pipeline/fantom-06/start
```

**Step 3: Monitor and verify**

Watch the admin panel at `http://localhost:3000/admin/fantom-06` for:
- Gatekeeper produces manifest with `keyboard` field
- Section bounding boxes don't overlap
- Pad section has `grid-4x4` archetype
- All sections within `panelHeightPercent` y-range

**Step 4: Open editor and verify visual layout**

```bash
# Take screenshot
npx tsx -e "..." # Playwright screenshot
```

Verify: controls in top 35%, keyboard at bottom, no overlapping sections.

---

## Task 9: Visual Verification + Push

**Files:** None modified — verification only

**Step 1: Run all tests**

```bash
npx vitest run
```
Expected: all pass

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: clean

**Step 3: Take Playwright screenshots**

Screenshot both editors (Fantom-06, CDJ-3000) to verify:
- Fantom-06: controls in panel area, keyboard at bottom, correct proportions
- CDJ-3000: no keyboard, controls use full height (unchanged)

**Step 4: Push all checkpoint commits**

```bash
git push origin feature/pipeline-architecture-upgrade
```

---

## Dependency Order

```
Task 1 (Shared Keyboard) ──→ Task 2 (PanelShell keyboard) ──→ Task 3 (Codegen)
                                                               ↓
Task 5 (Gatekeeper SOUL) ──→ Task 7 (Validator) ──→ Task 8 (Re-run Fantom-06)
Task 6 (Parser SOUL) ──────↗                        ↓
                                                Task 4 (Editor) ──→ Task 9 (Verify)
```

Tasks 1, 5, 6 are independent — can run in parallel.
Task 2 depends on 1.
Task 3 depends on 2.
Task 4 depends on 1.
Task 7 depends on 5.
Task 8 depends on 5, 6, 7.
Task 9 depends on all others.
