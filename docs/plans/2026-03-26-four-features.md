# Four Features Plan — Rotation, Issue Reporting, Tutorial, Tests

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Four features to improve editor usability and code quality.

---

## Feature 1: Control Rotation (90° increments)

**Why:** Pitch bend wheels, levers, and some controls need rotation to match hardware orientation.

**Files:**
- Modify: `src/components/panel-editor/store/manifestSlice.ts` — add `rotation?: number` to ControlDef
- Modify: `src/components/panel-editor/ControlNode.tsx` — apply CSS `transform: rotate()` on inner content div (chain with existing scale transform)
- Modify: `src/components/panel-editor/PropertiesPanel/index.tsx` — add rotation toggle (4 buttons: 0°, 90°, 180°, 270°)
- Modify: `scripts/panel-codegen.ts` — `renderControl()` applies rotation style in generated code
- Test: `scripts/__tests__/panel-codegen.test.ts` — verify rotation CSS generation

**Key details:**
- `transformOrigin: 'center'` — rotate around center, not top-left
- Chain with scale: `transform: scale(${controlScale}) rotate(${rotation}deg)`
- Auto-save includes rotation (ControlDef is already fully serialized)
- Default: 0 (no rotation, no transform)

**Complexity:** ~150 LOC, no dependencies

---

## Feature 2: Editor Issue Reporting

**Why:** Contractor finds a missing button or wrong type — needs to flag it without touching code.

**Files:**
- Create: `src/components/panel-editor/IssueReportModal.tsx` — modal with issue type dropdown + description
- Create: `src/app/api/pipeline/[deviceId]/issues/route.ts` — GET (list) + POST (create)
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — add "Report Issue" button (flag icon)
- Data: `.pipeline/{deviceId}/issues.json` — append-only JSON array
- Modify: `.gitignore` — DON'T ignore issues.json (should be committed)

**Issue schema:**
```json
{
  "id": "issue-1",
  "type": "missing-control | wrong-type | wrong-data | other",
  "description": "TEMPO RESET button missing, page 47",
  "controlId": null,
  "createdAt": "2026-03-26T...",
  "status": "open"
}
```

**Key details:**
- Atomic file writes (write to .tmp, rename)
- Validation: type required, description required (min 10 chars)
- Admin overview shows issue count badge

**Complexity:** ~400 LOC, no dependencies

---

## Feature 3: Interactive Onboarding Tutorial

**Why:** New contractor opens editor cold — needs guided walkthrough.

**Files:**
- Install: `npm install react-joyride`
- Create: `src/components/panel-editor/EditorTutorial.tsx` — Joyride wrapper with step definitions
- Modify: `src/components/panel-editor/PanelEditor.tsx` — mount tutorial, check localStorage
- Modify: `src/components/panel-editor/EditorToolbar.tsx` — add "?" help button to replay
- Modify: `src/components/panel-editor/store/canvasSlice.ts` — add `showTutorial` state

**Steps (from tutorial content doc):**
1. Canvas — "Controls are pre-loaded. Drag them to position."
2. Photo — "Toggle photo overlay to see real hardware."
3. Scale — "Shrink controls with Scale slider for precise alignment."
4. Grid — "Snap to grid for consistent spacing."
5. Layers — "Press L to see section/control hierarchy."
6. Properties — "Click a control to edit type, label, shape, color."
7. Keyboard — "Drag the keyboard section to position keys."
8. Approve — "Click Approve & Build when done."

**Key details:**
- Use `data-tutorial` attributes on targets (not class names — survives refactors)
- localStorage: `editor-tutorial-${deviceId}` = "completed"
- Dark theme styling to match editor
- "?" button in toolbar replays tutorial

**Complexity:** ~250 LOC, 1 new npm package

---

## Feature 4: Test Suite

**Why:** Every session we find bugs that tests would catch. Manifest round-trip, control counts, codegen output.

**Files to create:**
1. `src/components/panel-editor/store/__tests__/loadFromManifest.test.ts` — manifest → editor round-trip
   - All controls load (count matches manifest)
   - Nested containerAssignment extracts all IDs
   - Canvas height computed from deviceDimensions
   - Keyboard field propagates

2. `scripts/__tests__/panel-codegen.test.ts` — expand existing
   - Rotation CSS generation
   - Keyboard prop formatting (no triple braces)
   - Circle button uses PanelButton not inline JSX
   - deviceDimensions → correct panel height

3. `src/lib/pipeline/__tests__/manifest-version.test.ts` — version marker
   - Same controls, same hash
   - Different controls, different hash
   - Different shapes, different hash (catches visual property changes)

4. `e2e/smoke.test.ts` — Playwright E2E
   - Dashboard loads
   - Editor loads with correct control count per instrument
   - Preview loads without errors
   - Keyboard visible on keyboard instruments

**Key details:**
- Use vitest for unit tests (already configured)
- Use Playwright for E2E (already installed)
- Test data: use actual CDJ-3000 and Fantom-06 manifests from `.pipeline/`
- Run before every commit: `npx vitest run && npx tsc --noEmit`

**Complexity:** ~900 LOC of tests, no dependencies

---

## Execution Order

```
1. Control Rotation (simplest, self-contained)
2. Test Suite foundation (enables testing for remaining features)
3. Editor Issue Reporting (mid-complexity, real user value)
4. Onboarding Tutorial (polish, depends on stable UI)
```

E2E smoke test after each feature.
