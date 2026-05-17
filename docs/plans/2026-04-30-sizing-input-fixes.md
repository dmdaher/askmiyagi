# Plan: Dual-Label Sizing + Input Backspace + Icon Scaling

## Status: SAVED — needs deep planning with impact analysis before implementing

---

## Issue 1: Dual-Label Indicator Renders Larger Than W/H

**Problem:** VINYL/CDJ indicator visually larger than JOG MODE button even with same W/H dimensions.

**Root cause (4 rendering paths, all affected):**
- `Math.max(visW, 48)` forces minimum 48px width (ControlNode + PanelRenderer, button + led branches)
- No height constraint — dual-label content grows based on padding (`py-1 px-2` per row = ~39px total for 30px control)
- `overflow-visible` on ControlNode inner div lets content exceed bounding box

**Files affected:** 
- `src/components/panel-editor/ControlNode.tsx` — 2 dual-label branches (button + led case)
- `src/components/controls/PanelRenderer.tsx` — 2 dual-label branches (button + led case)

**Proposed fix:** Remove `Math.max(visW, 48)`, use actual `visW`/`visH`, add `flex-1` on rows, reduce padding.

**Impact analysis needed:**
- Does removing the 48px minimum break dual-labels on controls that are actually narrow?
- Does constraining height clip the LED dots or text?
- Does reducing font from 8px to 7px affect readability?
- Does this interact with the `labelFontSize` slider?
- Does `truncate` on text affect dual-label editing (top/bottom inputs)?

---

## Issue 2: Geometry Input Fields Can't Backspace Last Digit

**Problem:** X/Y/W/H number inputs commit on every keystroke via `onChange`. When backspacing to a single digit and deleting it, the empty string parses to NaN, which gets rejected, and the controlled `value` prop resets the display.

**Root cause:** `GeometryFields.tsx` `NumField` component uses `parseFloat(e.target.value)` on every change and calls `onChange(num)` immediately. No local state buffering.

**Proposed fix:** Same pattern as `GapInput` — local string state, commit on blur/Enter, sync from props when not focused.

**Impact analysis needed:**
- Does delayed commit affect undo/redo? (Currently pushSnapshot is called by the parent before onChange)
- Does the step prop (arrow key increment) still work with local state?
- Does this affect multi-select geometry fields (xMixed, yMixed, etc.)?
- Does container position fields (ContainerProperties) use the same component? (Yes — it uses inline inputs, but same pattern applies)

---

## Issue 3: Circle Button Icons Don't Scale With Button Size

**Problem:** Icons on circle buttons (▶, ▶▶, ◀◀) have a fixed 14px font size that doesn't shrink when the button diameter decreases. Icons wrap onto multiple lines on small buttons.

**Root cause:** `fontSize: control.labelFontSize ?? (isIcon ? 14 : 8)` — hardcoded 14px default for icons. Plus `w-full` + `overflowWrap: 'break-word'` causes icon characters to wrap.

**Proposed fix:** Scale icon font to 35% of diameter (`Math.max(Math.round(diameter * 0.35), 8)`), use `whitespace-nowrap` for icons, remove `w-full` for icons only.

**Already committed:** This fix is in commit `bb6edc6` and was NOT reverted. Only the dual-label and geometry fixes were reverted.

**Impact analysis needed:**
- Does the 35% scaling look right across different button sizes (20px to 80px diameter)?
- Does `whitespace-nowrap` cut off multi-character icons on very small buttons?
- Does this interact with `labelFontSize` slider? (Yes — slider overrides the default, so scaling only applies when no manual override)
- Does PanelRenderer match? (Yes — same fix was applied there)

---

## Next Steps

When picking this up:
1. Do a deep impact analysis on all three issues using subagents
2. Review all rendering paths that could be affected (label centering, overflow, color)
3. Verify the icon scaling fix (already committed) is working correctly
4. Plan the dual-label and geometry fixes with the full context
5. Implement and test

**To continue:** "Read `docs/plans/2026-04-30-sizing-input-fixes.md` and do a deep impact analysis before implementing"

---

## Issue 4: Label Position Unstable After Drag

**Status:** Reported 2026-05-16 (user-flagged, in conjunction with reviewing Issue 3 area). Not yet investigated.

**Problem:** Label positioning works most of the time, but sometimes after dragging a label and then choosing a position from the labelAlign picker (the 9-position grid in PropertiesPanel), the new position doesn't apply correctly. Re-selecting the same position option fixes it — so the picker IS working, the first application of it after a drag is the problematic state.

**Reproduction (suspected):**
1. Select a control (or its linked label)
2. Drag the label to a new location — this writes x/y directly
3. In Properties, click a labelAlign option (e.g., "below center")
4. Sometimes the label stays in the dragged spot OR snaps to a wrong corner
5. Click the same labelAlign option again — now it applies correctly

**Hypotheses (need verification):**
- **State staleness:** the labelAlign-to-position computation reads cached x/y from before the drag committed. First click computes from stale state, second click sees the now-current state.
- **Drag commit timing:** `moveLabel` / `updateControlProp` mutations may not flush before the labelAlign click handler reads state. React 19 batching or Zustand setState ordering.
- **labelAlign vs explicit x/y precedence:** after a drag sets explicit position, the renderer prefers the explicit value over the align-derived value, but the picker click may not clear the explicit x/y override on first click.
- **Linked vs standalone labels:** behavior may differ — `EditorLabel.controlId` controls the dependency on the parent control's position. Linked labels recompute on parent move; standalone labels don't. The drag may put a linked label into an "overridden" state that needs clearing.

**Investigation plan:**
1. Capture the exact repro with Playwright (drag → click align → screenshot; click align again → screenshot).
2. Log the store state at each step: `controls[id]`, `editorLabels[i].x/y/align/controlId`, and any `labelOverride` flag.
3. Check `computeLabelPosition()` / `setLabelAlign()` action — does it clear the explicit x/y when align is chosen?
4. Check if the bug repros on both linked and standalone labels.
5. Confirm whether `pushSnapshot()` is called once or twice per drag (could explain the "second click works" pattern if first click is consumed by a stale snapshot).

**Files to inspect:**
- `src/components/panel-editor/store/manifestSlice.ts` — `moveLabel`, `setLabelAlign`, `updateControlProp` for `labelAlign`
- `src/components/panel-editor/PropertiesPanel/index.tsx` — labelAlign picker click handler
- `src/components/panel-editor/LabelLayer.tsx` — drag commit path
- `src/lib/labelPosition.ts` (if exists) — the compute function

**Impact analysis needed before fix:**
- Does always-clear-x/y-on-align break standalone labels that legitimately have free-form positions?
- Does this affect undo/redo? (Is the "wrong first state" landing in a snapshot?)
- Drift CI impact: any position change must be tested via `drift:verify`.
