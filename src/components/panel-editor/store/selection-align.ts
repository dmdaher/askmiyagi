/**
 * Phase 7 — entity-agnostic alignment + distribution.
 *
 * Pure functions only. Consumed by `alignSelection` / `distributeSelection`
 * store actions in manifestSlice.ts.
 *
 * Anchor-mode rule (the differentiator from Figma):
 *   - When controls are present in the selection, they anchor the alignment.
 *     Labels move to match the controls' relevant edge; controls don't move.
 *   - When the selection has no controls (pure labels, or labels + banners),
 *     bbox mode kicks in: labels align to their own collective bbox edge.
 *   - bbox mode can be explicitly forced via `opts.mode === 'bbox'` (the
 *     Shift+Align modifier). Even with controls in the selection, bbox
 *     mode treats everything uniformly.
 *
 * Linked labels are always SKIPPED — they're owned by their parent control.
 * Aligning them independently would either break the link or cascade into
 * a control move the user didn't ask for. The caller surfaces a hint
 * ("N linked skipped") in the UI when this applies.
 */

import type { SelectableId } from './selection-types';
import { selectedControlIds, selectionOfType } from './selection-types';

export type AlignMode = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';
export type AnchorMode = 'auto' | 'bbox';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AlignInput {
  selection: ReadonlyArray<SelectableId>;
  controls: Record<string, Rect & { locked?: boolean }>;
  /** Labels — must include `controlId` so we can filter linked vs standalone. */
  editorLabels: ReadonlyArray<Rect & { id: string; controlId?: string | null }>;
}

export interface AlignDryRun {
  /** Standalone labels that will move. */
  movableLabelIds: string[];
  /** Controls that will move (only non-empty in bbox mode). */
  movableControlIds: string[];
  /** Linked label ids in the selection — UI shows "N linked skipped". */
  linkedLabelIds: string[];
  /** Resolved anchor mode after `auto` resolution. */
  resolvedAnchor: AnchorMode;
  /** Target coordinate (interpretation depends on align mode). */
  target: number | null;
  /** True when anchor controls exist in selection (drives UI hint). */
  hasAnchorControls: boolean;
}

/**
 * Compute everything the align action needs without mutating state.
 * Returns a dry-run plan that the caller applies + the UI inspects to
 * show "N linked skipped" / "Aligning to control" hints.
 */
export function planAlignment(
  input: AlignInput,
  mode: AlignMode,
  opts: { anchor?: AnchorMode } = {},
): AlignDryRun {
  const { selection, controls, editorLabels } = input;

  // Partition selection by type.
  const selectedCtrlIds = selectedControlIds(selection);
  const selectedLabelIds = selectionOfType(selection, 'label');

  const labelById = new Map(editorLabels.map((l) => [l.id, l]));
  const standaloneLabelIds: string[] = [];
  const linkedLabelIds: string[] = [];
  for (const id of selectedLabelIds) {
    const lbl = labelById.get(id);
    if (!lbl) continue;
    if (lbl.controlId) linkedLabelIds.push(id);
    else standaloneLabelIds.push(id);
  }

  // Filter controls: skip locked ones (existing convention from alignControls).
  const movableSelectedCtrls = selectedCtrlIds.filter(
    (id) => controls[id] && !controls[id].locked,
  );

  // Decide anchor mode.
  const hasAnchorControls = movableSelectedCtrls.length > 0;
  const resolvedAnchor: AnchorMode =
    opts.anchor === 'bbox' ? 'bbox' : hasAnchorControls ? 'auto' : 'bbox';

  // Compute target edge / midline.
  let target: number | null = null;
  let movableLabelIds = standaloneLabelIds;
  let movableControlIds: string[] = [];

  if (resolvedAnchor === 'auto') {
    // Controls anchor; labels follow. Controls don't move.
    const anchorRects = movableSelectedCtrls.map((id) => controls[id]);
    target = edgeFor(anchorRects, mode);
    // Standalone labels move; controls stay put.
    movableControlIds = []; // explicit
  } else {
    // Bbox: everything in selection contributes to the anchor edge.
    // Includes controls + standalone labels (NOT linked labels — those skip).
    const allRects: Rect[] = [
      ...movableSelectedCtrls.map((id) => controls[id]),
      ...standaloneLabelIds
        .map((id) => labelById.get(id))
        .filter((l): l is NonNullable<typeof l> => !!l),
    ];
    if (allRects.length < 2) {
      // Nothing meaningful to align.
      return {
        movableLabelIds: [],
        movableControlIds: [],
        linkedLabelIds,
        resolvedAnchor,
        target: null,
        hasAnchorControls,
      };
    }
    target = edgeFor(allRects, mode);
    // In bbox mode, controls might move too.
    movableControlIds = movableSelectedCtrls;
    movableLabelIds = standaloneLabelIds;
  }

  // Sanity: in auto mode, refuse to act if there are 0 standalone labels to move
  // (would be a no-op — keep controls put, labels not in selection).
  if (resolvedAnchor === 'auto' && movableLabelIds.length === 0) {
    return {
      movableLabelIds: [],
      movableControlIds: [],
      linkedLabelIds,
      resolvedAnchor,
      target: null,
      hasAnchorControls,
    };
  }

  return {
    movableLabelIds,
    movableControlIds,
    linkedLabelIds,
    resolvedAnchor,
    target,
    hasAnchorControls,
  };
}

/** Compute the target coordinate for an align mode over a set of rects. */
function edgeFor(rects: ReadonlyArray<Rect>, mode: AlignMode): number {
  if (rects.length === 0) return 0;
  switch (mode) {
    case 'left':
      return Math.min(...rects.map((r) => r.x));
    case 'right':
      return Math.max(...rects.map((r) => r.x + r.w));
    case 'center-x': {
      const sum = rects.reduce((acc, r) => acc + (r.x + r.w / 2), 0);
      return Math.round(sum / rects.length);
    }
    case 'top':
      return Math.min(...rects.map((r) => r.y));
    case 'bottom':
      return Math.max(...rects.map((r) => r.y + r.h));
    case 'center-y': {
      const sum = rects.reduce((acc, r) => acc + (r.y + r.h / 2), 0);
      return Math.round(sum / rects.length);
    }
  }
}

/** Apply an align mode to a rect, returning the new x/y. */
export function applyAlignToRect(
  rect: Rect,
  mode: AlignMode,
  target: number,
): { x: number; y: number } {
  switch (mode) {
    case 'left':
      return { x: target, y: rect.y };
    case 'right':
      return { x: target - rect.w, y: rect.y };
    case 'center-x':
      return { x: Math.round(target - rect.w / 2), y: rect.y };
    case 'top':
      return { x: rect.x, y: target };
    case 'bottom':
      return { x: rect.x, y: target - rect.h };
    case 'center-y':
      return { x: rect.x, y: Math.round(target - rect.h / 2) };
  }
}

// ─── Distribution ──────────────────────────────────────────────────────────

export interface DistributeInput {
  selection: ReadonlyArray<SelectableId>;
  editorLabels: ReadonlyArray<Rect & { id: string; controlId?: string | null }>;
}

export interface DistributePlan {
  /**
   * Final x/y for each standalone label in distribution order. Empty when
   * fewer than 3 items would distribute (Figma + every other tool only
   * activates distribute with 3+; the endpoints stay, middle ones shift).
   */
  updates: Array<{ id: string; x: number; y: number }>;
  /** Linked label ids in selection — UI shows "N linked skipped". */
  linkedLabelIds: string[];
}

/**
 * Distribute STANDALONE LABELS only. Controls + linked labels stay put.
 * Endpoints (leftmost/rightmost or topmost/bottommost) don't move; the
 * middle labels shift to create equal gaps between centers.
 */
export function planDistribution(
  input: DistributeInput,
  axis: DistributeAxis,
): DistributePlan {
  const { selection, editorLabels } = input;
  const labelById = new Map(editorLabels.map((l) => [l.id, l]));

  const standalone: Array<Rect & { id: string }> = [];
  const linkedLabelIds: string[] = [];
  for (const sid of selection) {
    if (!sid.startsWith('label:')) continue;
    const id = sid.slice('label:'.length);
    const lbl = labelById.get(id);
    if (!lbl) continue;
    if (lbl.controlId) {
      linkedLabelIds.push(id);
    } else {
      standalone.push({ id, x: lbl.x, y: lbl.y, w: lbl.w, h: lbl.h });
    }
  }

  if (standalone.length < 3) {
    return { updates: [], linkedLabelIds };
  }

  // Sort by axis position.
  const sorted = [...standalone].sort((a, b) =>
    axis === 'horizontal' ? a.x - b.x : a.y - b.y,
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan = axis === 'horizontal' ? last.x - first.x : last.y - first.y;
  const step = totalSpan / (sorted.length - 1);

  const updates: Array<{ id: string; x: number; y: number }> = [];
  for (let i = 1; i < sorted.length - 1; i++) {
    const r = sorted[i];
    if (axis === 'horizontal') {
      updates.push({ id: r.id, x: Math.round(first.x + step * i), y: r.y });
    } else {
      updates.push({ id: r.id, x: r.x, y: Math.round(first.y + step * i) });
    }
  }
  // Endpoints don't change but we report them as no-ops for tests that
  // want to assert the full result. Skip if no change.
  return { updates, linkedLabelIds };
}
