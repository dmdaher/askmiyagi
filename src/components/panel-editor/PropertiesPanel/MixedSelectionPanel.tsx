'use client';

import React, { useMemo } from 'react';
import { useEditorStore } from '../store';
import type { SelectableId } from '../store/selection-types';

/**
 * Phase 5 — properties panel for mixed-type selections.
 *
 * Triggered when the unified `selection` array contains entries of
 * 2+ distinct types (e.g., 1 control + 1 label, or 2 controls + a
 * polish banner). Existing single-type forms (`SingleControlProperties`,
 * `MultiControlProperties`, `LabelProperties`, etc.) handle their own
 * homogeneous cases.
 *
 * This panel shows a count breakdown so the contractor can confirm
 * what's currently grouped, plus the universally-applicable actions
 * (currently just Delete — Align/Distribute land in Phase 7). The
 * Delete button respects the control-protection policy: it deletes
 * only standalone labels and polish banners; controls and linked
 * labels are preserved.
 */

type EntityCount = {
  controls: number;
  sections: number;
  /** Standalone labels (deletable). */
  standaloneLabels: number;
  /** Linked labels (protected — bound to their parent control). */
  linkedLabels: number;
  banners: number;
  containers: number;
};

function tally(
  selection: readonly SelectableId[],
  labels: ReadonlyArray<{ id: string; controlId?: string | null }>,
): EntityCount {
  const counts: EntityCount = {
    controls: 0,
    sections: 0,
    standaloneLabels: 0,
    linkedLabels: 0,
    banners: 0,
    containers: 0,
  };
  const labelById = new Map(labels.map((l) => [l.id, l]));
  for (const sid of selection) {
    const colon = sid.indexOf(':');
    if (colon <= 0) continue;
    const type = sid.slice(0, colon);
    const id = sid.slice(colon + 1);
    switch (type) {
      case 'control':
        counts.controls++;
        break;
      case 'section':
        counts.sections++;
        break;
      case 'label': {
        const lbl = labelById.get(id);
        if (lbl?.controlId) counts.linkedLabels++;
        else counts.standaloneLabels++;
        break;
      }
      case 'banner':
        counts.banners++;
        break;
      case 'container':
        counts.containers++;
        break;
    }
  }
  return counts;
}

function formatBreakdown(c: EntityCount): string {
  const parts: string[] = [];
  if (c.controls > 0) parts.push(`${c.controls} control${c.controls > 1 ? 's' : ''}`);
  if (c.sections > 0) parts.push(`${c.sections} section${c.sections > 1 ? 's' : ''}`);
  const totalLabels = c.standaloneLabels + c.linkedLabels;
  if (totalLabels > 0) {
    if (c.linkedLabels > 0 && c.standaloneLabels > 0) {
      parts.push(`${totalLabels} labels (${c.linkedLabels} linked)`);
    } else if (c.linkedLabels > 0) {
      parts.push(`${c.linkedLabels} linked label${c.linkedLabels > 1 ? 's' : ''}`);
    } else {
      parts.push(`${c.standaloneLabels} label${c.standaloneLabels > 1 ? 's' : ''}`);
    }
  }
  if (c.banners > 0) parts.push(`${c.banners} banner${c.banners > 1 ? 's' : ''}`);
  if (c.containers > 0) parts.push(`${c.containers} container${c.containers > 1 ? 's' : ''}`);
  return parts.join(', ');
}

export default function MixedSelectionPanel() {
  const selection = useEditorStore((s) => s.selection);
  const editorLabels = useEditorStore((s) => s.editorLabels) as Array<{
    id: string;
    controlId?: string | null;
  }>;
  const deleteSelection = useEditorStore((s) => s.deleteSelection);

  const counts = useMemo(() => tally(selection, editorLabels), [selection, editorLabels]);
  const total = selection.length;
  const breakdown = formatBreakdown(counts);
  const deletableCount = counts.standaloneLabels + counts.banners;
  const protectedCount = total - deletableCount;

  return (
    <div className="space-y-3" data-testid="mixed-selection-panel">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Mixed Selection
        </div>
        <div className="text-sm text-gray-200">{total} selected</div>
        <div className="text-xs text-gray-400 mt-1" data-testid="mixed-selection-breakdown">
          {breakdown}
        </div>
      </div>

      <div className="border-t border-gray-800 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Actions
        </div>
        {deletableCount > 0 ? (
          <button
            type="button"
            onClick={() => deleteSelection()}
            className="w-full rounded bg-red-900/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-900/60"
            data-testid="mixed-selection-delete"
          >
            Delete {deletableCount}{' '}
            {deletableCount === 1 ? 'item' : 'items'}
            {protectedCount > 0 && (
              <span className="ml-1 text-[10px] text-red-400/70">
                ({protectedCount} protected)
              </span>
            )}
          </button>
        ) : (
          <div className="text-[11px] text-gray-500">
            No deletable items. Controls and linked labels are protected.
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 pt-3">
        <div className="text-[10px] text-gray-500 leading-relaxed">
          Tip: drag any selected item to move all together. Align and
          distribute land in a future update.
        </div>
      </div>
    </div>
  );
}
