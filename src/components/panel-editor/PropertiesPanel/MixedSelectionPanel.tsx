'use client';

import React, { useMemo } from 'react';
import { useEditorStore } from '../store';
import type { SelectableId } from '../store/selection-types';

/**
 * Phase 5 — properties panel for mixed-type selections.
 * Phase 7 — adds Align + Distribute buttons with auto-anchor logic.
 *
 * Triggered when the unified `selection` array contains entries of
 * 2+ distinct types (e.g., 1 control + 1 label), OR when 2+ standalone
 * labels are selected (the multi-label-only case that previously fell
 * through to "Unknown selection").
 *
 * Align/Distribute rules:
 *   - Default (no modifier): controls in selection anchor the alignment.
 *     Labels move to match controls' edge; controls stay put.
 *   - Shift+Click: bbox mode (Figma-style). Controls might move.
 *   - Linked labels always skipped (owned by parent control).
 *   - Distribute always operates on standalone labels only.
 */

type EntityCount = {
  controls: number;
  sections: number;
  /** Standalone labels (deletable + alignable). */
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

const alignBtnClass =
  'flex h-7 items-center justify-center rounded border border-gray-800 bg-gray-900 px-1 text-gray-300 hover:bg-gray-800 hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-[10px]';

export default function MixedSelectionPanel() {
  const selection = useEditorStore((s) => s.selection);
  const editorLabels = useEditorStore((s) => s.editorLabels) as Array<{
    id: string;
    controlId?: string | null;
  }>;
  const deleteSelection = useEditorStore((s) => s.deleteSelection);
  const alignSelection = useEditorStore((s) => s.alignSelection);
  const distributeSelection = useEditorStore((s) => s.distributeSelection);

  const counts = useMemo(() => tally(selection, editorLabels), [selection, editorLabels]);
  const total = selection.length;
  const breakdown = formatBreakdown(counts);
  const deletableCount = counts.standaloneLabels + counts.banners;
  const protectedCount = total - deletableCount;

  // Phase 7 — what can align/distribute?
  // Align needs 2+ alignable entities total (controls + standalone labels).
  // Auto-anchor active when controls present alongside standalone labels.
  const alignableCount = counts.controls + counts.standaloneLabels;
  const canAlign = alignableCount >= 2;
  const hasAnchorControls = counts.controls > 0 && counts.standaloneLabels > 0;
  const canDistribute = counts.standaloneLabels >= 3;
  const linkedSkipped = counts.linkedLabels;

  const handleAlign = (
    mode: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom',
  ) => (e: React.MouseEvent) => {
    // Phase 7 — Shift+Click forces bbox mode (Figma-style), overriding
    // the auto-anchor. Default is anchor='auto' which means controls
    // anchor when present, bbox otherwise.
    const anchor = e.shiftKey ? 'bbox' : 'auto';
    alignSelection(mode, { anchor });
  };

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

      {/* Phase 7 — anchor hint surfaces when controls are present alongside
          standalone labels. Tells the contractor what the align buttons
          will actually do (which would otherwise be invisible behavior). */}
      {hasAnchorControls && (
        <div
          className="rounded border border-blue-900/40 bg-blue-950/30 px-2 py-1.5 text-[10px] text-blue-200"
          data-testid="mixed-selection-anchor-hint"
        >
          Aligning labels to selected control{counts.controls > 1 ? 's' : ''}.{' '}
          <span className="text-blue-400/70">Shift+click for bbox.</span>
        </div>
      )}

      {/* Phase 7 — align buttons */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Align
        </div>
        <div className="grid grid-cols-3 gap-1 mb-2" data-testid="mixed-selection-align-row1">
          <button
            type="button"
            className={alignBtnClass}
            onClick={handleAlign('left')}
            disabled={!canAlign}
            title="Align left edges (hold Shift for bbox mode)"
            data-testid="align-left"
          >
            ⊢
          </button>
          <button
            type="button"
            className={alignBtnClass}
            onClick={handleAlign('center-x')}
            disabled={!canAlign}
            title="Align horizontal centers"
            data-testid="align-center-x"
          >
            ↔
          </button>
          <button
            type="button"
            className={alignBtnClass}
            onClick={handleAlign('right')}
            disabled={!canAlign}
            title="Align right edges"
            data-testid="align-right"
          >
            ⊣
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1" data-testid="mixed-selection-align-row2">
          <button
            type="button"
            className={alignBtnClass}
            onClick={handleAlign('top')}
            disabled={!canAlign}
            title="Align top edges"
            data-testid="align-top"
          >
            ⊤
          </button>
          <button
            type="button"
            className={alignBtnClass}
            onClick={handleAlign('center-y')}
            disabled={!canAlign}
            title="Align vertical centers"
            data-testid="align-center-y"
          >
            ↕
          </button>
          <button
            type="button"
            className={alignBtnClass}
            onClick={handleAlign('bottom')}
            disabled={!canAlign}
            title="Align bottom edges"
            data-testid="align-bottom"
          >
            ⊥
          </button>
        </div>
        {linkedSkipped > 0 && (
          <div
            className="mt-2 text-[10px] text-gray-500"
            data-testid="mixed-selection-linked-skipped"
          >
            {linkedSkipped} linked label{linkedSkipped > 1 ? 's' : ''} skipped — they follow their control.
          </div>
        )}
      </div>

      {/* Phase 7 — distribute buttons */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Distribute (standalone labels)
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            className={alignBtnClass}
            onClick={() => distributeSelection('horizontal')}
            disabled={!canDistribute}
            title={canDistribute ? 'Equal horizontal gaps' : 'Need 3+ standalone labels'}
            data-testid="distribute-horizontal"
          >
            ↔ Horizontal
          </button>
          <button
            type="button"
            className={alignBtnClass}
            onClick={() => distributeSelection('vertical')}
            disabled={!canDistribute}
            title={canDistribute ? 'Equal vertical gaps' : 'Need 3+ standalone labels'}
            data-testid="distribute-vertical"
          >
            ↕ Vertical
          </button>
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
          Tip: drag any selected item to move all together.
        </div>
      </div>
    </div>
  );
}
