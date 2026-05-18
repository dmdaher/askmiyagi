/**
 * Shared label z-order computation — used by both the editor (LabelLayer)
 * and the preview (PanelRenderer).
 *
 * The architecture (from PR #140):
 *   Sections    < z=1+
 *   Keyboard    = 50
 *   Standalone label   (default) = 150
 *   Linked label       (default) = 200 + linkedControl.zOrder + 1
 *   Controls    = 200 + control.zOrder
 *
 * A LINKED label is one whose `controlId` references a real control on the
 * panel. It "rides with" its control's z-order: when the contractor brings
 * the control to front via the zOrder gesture, the label comes with it.
 * Without this rule, labels are stuck at z=150 and any overlapping control
 * (z=200+) hides them — the user-visible regression PR #140 inadvertently
 * introduced when it locked labels at a fixed z to fix the
 * keyboard-above-circle problem.
 *
 * A STANDALONE label is one without a `controlId` — section group labels,
 * info chips, etc. These stay at z=150 (below controls), matching the
 * intended layer model.
 *
 * The editor adds extra state-driven boost (selected / dragging) so the
 * interactive label stays visible above its neighbors during direct
 * manipulation. The preview omits these boosts (no selection or dragging
 * in preview mode).
 */

export interface LabelZInputs {
  /** The label's optional `controlId` (set if linked to a control). */
  controlId?: string | null;
  /**
   * Lookup function: given a controlId, return the control's `zOrder`
   * (0 if unset). Returns `null` if the control no longer exists (e.g.,
   * the contractor deleted the control but the label still references it).
   * Callers pass this in because controls live in different shapes per
   * mode (editor: Record<string, ControlDef>; preview: ManifestControl[]).
   */
  controlZOrder: (id: string) => number | null;
  /** Editor-only — true if this label is being actively dragged. */
  dragging?: boolean;
  /** Editor-only — true if this label is in the current selection. */
  selected?: boolean;
}

const STANDALONE_BASE = 150;
const LINKED_BASE = 200; // matches PanelRenderer's `200 + ctrl.zOrder` for controls
/**
 * Linked label sits at the SAME z as its linked control (offset 0).
 *
 * Why 0 and not a positive offset:
 *   PR-2.6 tried offset=1, then PR-2.6.1 bumped to 100. Both broken in
 *   different ways:
 *     - offset=1 lets another control with zOrder=+1 vs the linked
 *       control wedge between the control and its label (e.g., S2 at
 *       zOrder=1 wedges between TRANSPOSE at zOrder=0 and TRANSPOSE's
 *       label at z=201).
 *     - offset=100 lets the "wedge gap" be wider (zOrder=1..99 wedges
 *       in), AND prevents "Bring to Front" from ever lifting a control
 *       above another control's label (would need zOrder ≥ 100).
 *
 *   offset=0 solves both:
 *     - Control and its label tied at same z → nothing can be "between"
 *       them by definition. Wedging is mathematically impossible.
 *     - DOM order resolves the tie: PanelRenderer renders controls in
 *       the controls loop, then labels in the labels loop AFTER. Labels
 *       (last-rendered) win at tied z, so the label IS visible above
 *       its own control at default zOrder.
 *     - "Bring to Front" on a control: control.z = 200 + N, that control
 *       now reliably above another control's label (which is at 200 +
 *       lowerOrder, < 200 + N). ✓
 *     - "Send to Back" on a control: control.z = 200 + (-N), its own
 *       linked label (also at 200 - N) rides with it. ✓
 *
 *   The editor's `dragging` (+50) and `selected` (+10) boosts still
 *   apply per-label as transient state — wedging during drag/select is
 *   accepted as a cosmetic edge case (drag is rare; wedge needs specific
 *   zOrder match). Preview has no drag/select, so preview is fully
 *   wedge-proof.
 */
const LINKED_ABOVE_OFFSET = 0;

const SELECTED_BOOST = 10;
const DRAGGING_BOOST = 50;

/**
 * Compute the absolute z-index for a label.
 *
 * - Standalone: 150 + state boost
 * - Linked + control exists: `LINKED_BASE + control.zOrder + 1` + state boost
 * - Linked but control missing: falls back to standalone (label is orphaned
 *   data; render it at the standalone layer until cleanup happens).
 */
export function computeLabelZ(inputs: LabelZInputs): number {
  const { controlId, controlZOrder, dragging, selected } = inputs;

  let base = STANDALONE_BASE;
  if (controlId) {
    const z = controlZOrder(controlId);
    if (z !== null) {
      base = LINKED_BASE + z + LINKED_ABOVE_OFFSET;
    }
    // else: orphan label, fall back to STANDALONE_BASE
  }

  let boost = 0;
  if (dragging) boost = DRAGGING_BOOST;
  else if (selected) boost = SELECTED_BOOST;

  return base + boost;
}
