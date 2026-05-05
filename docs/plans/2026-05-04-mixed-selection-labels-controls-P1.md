# P1 — Mixed Selection: Standalone Labels + Controls

> **Priority:** P1
> **Date:** 2026-05-04
> **Status:** SAVED — awaits scope confirmation before implementation
> **Tier:** B3 in `~/.claude/plans/nested-coalescing-squid.md`
> **Prerequisite SHIPPED:** A1 (moveSection drift fix) merged in PR #92 — closes the only active drift bug. PM7 gating (Shift+click on linked labels) is the remaining drift mitigation this plan must implement.

## Context

Today, selecting a label deselects controls and vice versa. User expects Figma-like behavior where any combination of canvas objects can be selected together. Investigated and confirmed: **standalone labels** should behave like Figma TEXT nodes (first-class, multi-selectable with controls), but **linked labels** must stay attached to their control because of the ownership model (auto-generated from `control.label`, follow on move).

User's framing: keep it lightweight; don't overengineer; the editor works today.

---

## TL;DR

| Decision | Detail |
|---|---|
| Scope | Standalone labels only. Linked labels untouched. |
| New state | `selectedLabelIds: string[]` (plural) — for standalones |
| Existing `selectedLabelId` (singular) | Keep — used by Properties panel single-label view |
| Shift+click on standalone label | Adds to `selectedLabelIds`, does NOT clear `selectedIds` |
| Plain click | Replaces both — single-target click is "fresh selection" |
| Drag with mixed selection | Controls + standalone labels move by same delta |
| Wrap in Container | bbox includes both |
| Delete | Removes both |
| Group | Controls only (silent skip on labels) |
| Align / Distribute | Controls only (defer mixed-mode) |
| Properties panel mixed selection | Shows first-selected item's properties (defer common-fields view) |

**Estimated scope:** ~80–100 LOC across 5 files.

---

## Why labels are separate today (and why standalones shouldn't be)

Two label types with different ownership:

| Type | Has `controlId`? | Owned by | Follows control on move? | Should multi-select with controls? |
|---|---|---|---|---|
| **Linked label** | yes | its control | yes (existing `moveSelectedControls`) | **No** — ownership model |
| **Standalone label** | null | nothing | no | **Yes** — Figma-like text node |

In Figma, every canvas object is a uniform "node" — text, frames, components. Our linked labels have no Figma analog (closest is a Component property, but even those are selectable as nodes). Standalone labels are conceptually identical to Figma TEXT.

**Linked labels staying separate is correct.** Making them independently selectable would create drift: select a linked label → move the control → label's selection state points to a label whose position is now stale. The current pattern (linked labels follow their control via `moveSelectedControls`) is the right design.

**Standalone labels should join control selection.** That's the gap.

---

## Brainstorm — three approaches considered

### Approach 1: Unified selection (one array, polymorphic)
Put standalone label IDs directly into `selectedIds`. IDs are unique, so no prefix needed.

| Pro | Con |
|---|---|
| Truly minimal | Every consumer of `selectedIds` becomes implicitly polymorphic |
| One array, no sync | Easy to forget a filter site → label leaks into controls-only op |
| Most code "just works" | TypeScript can't help you (`selectedIds: string[]` hides the difference) |

**Verdict: rejected.** Implicit polymorphism is a bug factory.

### Approach 2: Parallel array (recommended) — `selectedLabelIds: string[]`
Standalone labels live in their own selection array. Controls stay in `selectedIds`. Operations that should accept both iterate over both.

| Pro | Con |
|---|---|
| Explicit — field name tells you what's in it | Two arrays to keep in sync |
| Type-safe | Slightly more LOC |
| Linked labels untouched | Need a single clear-selection helper |

**Verdict: recommended.** Best balance of clarity and simplicity.

### Approach 3: Status quo + escape hatch
Keep selection mutually exclusive. Add ONE right-click action "Wrap selected controls + this label in a container."

| Pro | Con |
|---|---|
| Zero state changes | Doesn't solve the general "click resets" problem |
| Smallest possible change | Niche, hard to discover |

**Verdict: rejected.** Misses the user's actual concern.

---

## Pre-mortem — Approach 2, six months from now

> **Why the user asked for this section:** "Do a premortem as well though because it broke and i want to know why!"

### PM1 — Drag forgets labels
**Failure:** User selects a control + a standalone label, drags the control. Control moves; label stays put. User reports "drag is broken."

**Root cause:** `moveSelectedControls` operates on `selectedIds` only. Standalone labels in `selectedLabelIds` need the same delta applied.

**Mitigation:** Extend the drag handler to iterate over `selectedLabelIds` and call `moveLabel(labelId, dx, dy)` for each, OR refactor into a single `moveSelectedItems` helper. **The single-helper approach is cleaner — one place to update if a third selectable type is added in the future.**

### PM2 — Clear-selection only clears one array
**Failure:** User clicks empty canvas. `setSelectedIds([])` runs, clearing controls. Standalone labels stay highlighted. User confused — thought clicking empty space was "deselect all."

**Root cause:** Many places call `setSelectedIds([])` to clear (canvas click, escape key, post-action). Each call site that wants "clear everything" needs to also clear `selectedLabelIds`.

**Mitigation:** Introduce `clearAllSelection()` helper that does both. Audit current `setSelectedIds([])` call sites and replace with `clearAllSelection()` where the intent is "clear all." This is the single biggest source of bugs in this feature — easy to miss a site.

### PM3 — Properties panel breaks on mixed selection
**Failure:** User selects 2 controls + 1 standalone label. Properties panel shows what? Crashes? Empty? React errors? Single-control fields?

**Root cause:** Properties panel is built around homogeneous selection: 1 control / N controls / 1 label. Mixed has no defined render path.

**Mitigation:** For Tier 1, show the first-selected item's properties (whichever was clicked first). Document the limitation in code: `// TODO: mixed-selection common-fields view`. If user complaints surface, build the common view in a follow-up.

### PM4 — Rubber-band misses labels
**Failure:** Drag a selection box over a region with controls and standalone labels. Only controls get selected.

**Root cause:** Rubber-band logic in `PanCanvas.tsx` iterates `Object.values(controls)` only.

**Mitigation:** Extend rubber-band to also iterate `editorLabels.filter(l => !l.controlId && !l.hidden)`. Bbox-test using label.x, label.y, label.w (default 60 if undefined), label.fontSize+4. This is small (~10 LOC) but worth catching here so the feature feels consistent.

### PM5 — Group silently excludes labels
**Failure:** User has 2 controls + 1 standalone label selected, hits Cmd+G. A group is created with just the controls; the label stays ungrouped. User thinks group failed.

**Root cause:** `createGroup` filters to control IDs only (correct — `controlGroups` shape doesn't have a labelIds field).

**Mitigation:** Two options:
- **(a)** Show a small inline toast or status: "Group: 2 controls grouped (1 label excluded)."
- **(b)** Disable the Group menu item when only labels are selected (mixed: enable, with the toast).

**Recommendation:** option (a). Don't disable; just inform.

### PM6 — LayersPanel highlight broken
**Failure:** LabelRow's selection highlight uses `selectedLabelId === label.id` (singular). With `selectedLabelIds` plural, only the most-recently-selected label shows highlight.

**Root cause:** Easy to forget the comparison change.

**Mitigation:** LabelRow swap: `selectedLabelIds.includes(label.id)`. Add a test that asserts plural selection highlights all selected rows.

### PM7 — Linked label leak into selectedLabelIds
**Failure:** User Shift+clicks a linked label (visually indistinguishable from standalone in some cases). Linked label gets into `selectedLabelIds`. Drag tries to move it independently of its control. Visual drift.

**Root cause:** The Shift+click handler doesn't gate on `label.controlId === null`.

**Mitigation:** In LabelLayer's onMouseDown / onClick path, check `label.controlId !== null` and silently no-op (or instead select the linked control). The latter is more useful UX: "Shift+click linked label" = "Shift+select its control."

### PM8 — Cmd+Z doesn't restore selection
**Failure:** User makes a change, undoes. After undo, `selectedLabelIds` is wrong (out of sync with the restored state).

**Root cause:** `pushSnapshot` likely doesn't include selection state.

**Investigation needed:** Confirm the current snapshot shape. If selection IS in snapshots, add `selectedLabelIds`. If NOT, leave as-is — selection is session-only.

### PM9 — Auto-save payload bloat
**Failure:** `selectedLabelIds` accidentally gets into the auto-save payload. Blob storage gets per-session selection state.

**Root cause:** The save payload is derived from store state. If we add `selectedLabelIds` to the slice without explicit exclusion, it might roundtrip.

**Investigation needed:** Check `useAutoSave.ts` — does it pick selected fields explicitly, or pass everything? If explicit, we're fine (only add the fields we want). If `...state`, we need to exclude.

### PM10 — Existing single-select code paths break
**Failure:** Code that uses `selectedLabelId` (singular) to render the Properties panel or compute "is this row highlighted" stops matching when the user uses the new plural pattern.

**Root cause:** We're keeping `selectedLabelId` for compat but adding `selectedLabelIds`. Some code might check the singular when it should check the plural.

**Mitigation:** When `selectedLabelIds.length === 1`, also set `selectedLabelId` to that ID. Backward compat preserved. Document this rule clearly.

---

## Recommended scope — Approach 2, "do half"

**MUST-DO (80% of the value):**
1. New `selectedLabelIds: string[]` in manifestSlice state
2. Shift+click on standalone label adds to `selectedLabelIds` without clearing `selectedIds`
3. Single `clearAllSelection()` helper, audit call sites
4. Drag handler moves standalone labels by same delta as controls (`moveSelectedItems` helper)
5. Delete handles both arrays
6. Wrap in Container bbox includes standalone labels
7. LabelRow + LabelLayer use `selectedLabelIds.includes(...)` for highlight
8. Mirror `selectedLabelId` to first item of `selectedLabelIds` for compat (PM10)

**SKIP / DEFER:**
- Properties panel mixed-selection common-fields view — show first-selected for now
- Rubber-band including labels — small follow-up, ship as PM4 mitigation if visible friction
- Group on mixed — silent skip + tiny inline note (PM5 mitigation)
- Align / Distribute on labels — defer
- Linked label changes — out of scope

---

## Files touched (estimated)

| File | Change | LOC |
|---|---|---|
| `src/components/panel-editor/store/manifestSlice.ts` | Add `selectedLabelIds: string[]`, `clearAllSelection`, `moveSelectedItems`, extend `deleteSelected`, extend `handleWrapInContainer` | ~40 |
| `src/components/panel-editor/LabelLayer.tsx` | Shift+click multi-select on standalone labels, gate on `controlId === null`, use plural for highlight | ~25 |
| `src/components/panel-editor/LayersPanel.tsx` | LabelRow swaps `selectedLabelId === label.id` → `selectedLabelIds.includes(label.id)` | ~5 |
| `src/components/panel-editor/PanCanvas.tsx` | Audit `setSelectedIds([])` sites, replace with `clearAllSelection()` where appropriate | ~10 |
| `src/components/panel-editor/ContextMenu.tsx` | Pass mixed selection to `handleWrapInContainer` (already centralized via store action) | ~5 |
| `src/components/panel-editor/PropertiesPanel/index.tsx` | Mixed-selection fallback (show first selected) — minimal, just don't crash | ~10 |

**Total: ~95 LOC, 6 files.** Backward compatible (single-select still works through `selectedLabelId`).

---

## Verification (Playwright + manual)

1. Click control A → only A selected, no labels
2. Shift+click standalone label X → A + X both selected (visible on canvas + Layers panel)
3. Cmd+drag from canvas → drag both A and X to new position; both move by same delta
4. Right-click → context menu shows "Wrap in Container" — invoke; container bbox includes both
5. Delete (Backspace) → both gone
6. Click empty canvas → both deselect (clearAllSelection)
7. Click linked label Y → Y selected (singular), A and X cleared
8. Shift+click linked label Y when standalone X was selected → Y replaces selection (linked labels don't multi-select)
9. Cmd+G with mixed selection (control + standalone label) → group created with control only; toast shows "1 label excluded"
10. Undo (Cmd+Z) → returns to pre-action state
11. Auto-save fires; payload doesn't bloat with selection state

---

## Open questions

1. **Do you want rubber-band to pick up standalone labels?** If yes, ~10 LOC in PanCanvas. Recommend **yes** for consistency.
2. **Group with mixed selection — toast or silent?** Recommend toast.
3. **Properties panel for mixed selection — first-selected or common-fields view?** Recommend first-selected for v1; revisit if friction.
4. **Should linked labels respond differently to Shift+click?** Options: (a) silently no-op, (b) Shift+click linked label = Shift+select its control. Recommend (b) as more useful UX.
5. **Where to anchor moves of multi-selected items?** Currently move-controls uses the dragged control as anchor. With mixed selection, anchor on whatever the user grabbed (control or label). Probably fine without special handling.

---

## Why this is "lightweight"

What we're NOT doing:
- Not refactoring the entire selection model (Figma-style unified node tree) — kept arrays separate
- Not touching linked labels — ownership model preserved
- Not building a common-properties view for mixed selection — defer
- Not changing the production manifest schema — no `editorLabels` shape changes
- Not changing the pipeline, tutorials, agents, or any production runtime code
- Not introducing a new domain concept ("Selection" as its own type) — extend existing state

What we ARE doing:
- One new state field (`selectedLabelIds`)
- One new helper (`clearAllSelection`)
- One refactored helper (`moveSelectedItems` from existing `moveSelectedControls`)
- Targeted edits to 5–6 files
- Surface the existing `findNearestSection` and `assignLabelToNearestSection` already shipped in Tier 2

The discipline is to do less than the obvious "complete" implementation and ship the 80% that solves the stated friction. Defer the rest until it's actually causing friction.

---

## Status

**Awaiting:** scope confirmation from user. Open questions in section above need answers before implementation begins.

**Branch strategy:** new `feature/mixed-label-control-selection` off `test` (assuming current `feature/layers-panel-fixes` PR has merged by then).

**Estimated effort:** 1 focused session (2–4 hours) including Playwright verification.
