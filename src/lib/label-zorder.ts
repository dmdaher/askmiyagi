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
const LINKED_ABOVE_OFFSET = 1; // sits just above its linked control

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
