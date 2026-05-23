'use client';

/**
 * Scale Contents modal — opened from EditorToolbar's ⤢ Scale button.
 *
 * Distinct from the W/H Canvas inputs (which only resize the canvas).
 * This modal scales positions and sizes of every control, section, label,
 * container, and guide RELATIVE TO THE ORIGINAL LAYOUT (Layout-Base
 * Memory). 100% always returns to exact original — repeated 70%/150%/50%
 * cycles never accumulate rounding drift.
 *
 * The toolbar's `-` (×0.8) and `+` (×1.25) shortcuts route through the
 * same drift-free path internally.
 *
 * Linked input behavior:
 *   - Typing in the % field updates W and H below
 *   - Typing in W or H updates % and the OTHER dim (preserves aspect)
 *   - Last-typed value reseeds the others
 *
 * Min/max validation: 10% to 500% (protects against extreme inputs that
 * would crater positions to (0,0) or push past sane canvas bounds).
 *
 * Cmd+Z is trapped while open so undo doesn't fire unexpectedly during
 * input editing.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from './store';
import type { EditorLabel } from './store/historySlice';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MIN_PERCENT = 10;
const MAX_PERCENT = 500;

export default function ScaleContentsModal({ open, onClose }: Props) {
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const controls = useEditorStore((s) => s.controls);
  const sections = useEditorStore((s) => s.sections);
  const editorLabels = useEditorStore((s) => s.editorLabels) as EditorLabel[];
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const scaleFromBase = useEditorStore((s) => s.scaleFromBase);
  const scaleCumulativeFactor = useEditorStore((s) => s.scaleCumulativeFactor);

  // Current state expressed as % of original layout. When no scale base is
  // captured (cumulativeFactor === 1.0), we're already at 100% of "current"
  // which is also the future base. The number we display is the absolute
  // factor: 1.5 → 150%.
  const currentPercent = Math.round(scaleCumulativeFactor * 100);

  // All three inputs are strings during editing so the user can clear and
  // retype. They commit to numbers only on Apply.
  const [percentStr, setPercentStr] = useState(String(currentPercent));
  const [widthStr, setWidthStr] = useState(String(canvasWidth));
  const [heightStr, setHeightStr] = useState(String(canvasHeight));

  // Reset fields when modal opens (or canvas dimensions change between opens).
  // Initial value reflects current scale (e.g. "150" if at 150% of original).
  useEffect(() => {
    if (open) {
      setPercentStr(String(currentPercent));
      setWidthStr(String(canvasWidth));
      setHeightStr(String(canvasHeight));
    }
  }, [open, canvasWidth, canvasHeight, currentPercent]);

  // Trap Cmd+Z / Ctrl+Z while modal is open so undo doesn't fire unexpectedly.
  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, onClose]);

  // Counts derived live from store for the preview text
  const counts = useMemo(() => {
    const visibleLabels = editorLabels.filter(l => !l.hidden);
    return {
      controls: Object.keys(controls).length,
      sections: Object.keys(sections).length,
      labels: visibleLabels.length,
    };
  }, [controls, sections, editorLabels]);

  // ── Input handlers ────────────────────────────────────────────────────────

  const setFromPercent = useCallback((rawPct: string) => {
    setPercentStr(rawPct);
    const pct = parseFloat(rawPct);
    if (isNaN(pct) || pct <= 0) return;
    const factor = pct / 100;
    setWidthStr(String(Math.round(canvasWidth * factor)));
    setHeightStr(String(Math.round(canvasHeight * factor)));
  }, [canvasWidth, canvasHeight]);

  const setFromWidth = useCallback((rawW: string) => {
    setWidthStr(rawW);
    const w = parseFloat(rawW);
    if (isNaN(w) || w <= 0 || canvasWidth <= 0) return;
    const factor = w / canvasWidth;
    setPercentStr(String(Math.round(factor * 100)));
    setHeightStr(String(Math.round(canvasHeight * factor)));
  }, [canvasWidth, canvasHeight]);

  const setFromHeight = useCallback((rawH: string) => {
    setHeightStr(rawH);
    const h = parseFloat(rawH);
    if (isNaN(h) || h <= 0 || canvasHeight <= 0) return;
    const factor = h / canvasHeight;
    setPercentStr(String(Math.round(factor * 100)));
    setWidthStr(String(Math.round(canvasWidth * factor)));
  }, [canvasWidth, canvasHeight]);

  // ── Validation + apply ────────────────────────────────────────────────────
  //
  // Semantics: `pct` is the target % OF ORIGINAL LAYOUT, not relative to
  // current. Typing 100 always returns to exact original (drift-free).
  // No-op when typed value matches current cumulative factor.

  const pct = parseFloat(percentStr);
  const targetFactor = pct / 100;
  const validInput = !isNaN(targetFactor) && targetFactor > 0 && pct >= MIN_PERCENT && pct <= MAX_PERCENT;
  const isNoOp = validInput && Math.abs(targetFactor - scaleCumulativeFactor) < 0.0001;
  const validFactor = validInput && !isNoOp;

  const validationMsg = useMemo(() => {
    if (isNaN(pct) || pct <= 0) return 'Enter a positive number';
    if (pct < MIN_PERCENT) return `Minimum ${MIN_PERCENT}%`;
    if (pct > MAX_PERCENT) return `Maximum ${MAX_PERCENT}%`;
    if (isNoOp) return `Already at ${currentPercent}% — adjust to scale`;
    return null;
  }, [pct, isNoOp, currentPercent]);

  const handleApply = useCallback(() => {
    if (!validFactor) return;
    pushSnapshot();
    scaleFromBase(targetFactor);
    onClose();
  }, [validFactor, targetFactor, pushSnapshot, scaleFromBase, onClose]);

  const handleReset = useCallback(() => {
    if (Math.abs(scaleCumulativeFactor - 1.0) < 0.0001) {
      onClose();
      return;
    }
    pushSnapshot();
    scaleFromBase(1.0);
    onClose();
  }, [scaleCumulativeFactor, pushSnapshot, scaleFromBase, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-700 bg-[#111122] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-200 mb-1">Scale Contents</h3>
        <p className="text-xs text-gray-500 mb-2">
          Scales every control, section, label, container, and guide relative to the original layout.
          100% always returns to exact original — repeated cycles never accumulate drift.
        </p>
        <p className="text-[11px] text-gray-400 mb-4">
          Currently at <strong className="text-gray-200">{currentPercent}%</strong> of original.
        </p>

        {/* Percent input */}
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-gray-400 mb-1">Scale to (% of original)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={percentStr}
              onChange={(e) => setFromPercent(e.target.value)}
              autoFocus
              min={MIN_PERCENT}
              max={MAX_PERCENT}
              className="w-24 h-8 rounded border border-gray-700 bg-gray-900 px-2 text-sm text-gray-200 text-right outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">Or scale to:</p>

        {/* W/H inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Width</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={widthStr}
                onChange={(e) => setFromWidth(e.target.value)}
                className="flex-1 h-8 rounded border border-gray-700 bg-gray-900 px-2 text-sm text-gray-200 text-right outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Height</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={heightStr}
                onChange={(e) => setFromHeight(e.target.value)}
                className="flex-1 h-8 rounded border border-gray-700 bg-gray-900 px-2 text-sm text-gray-200 text-right outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </div>
        </div>

        {/* Preview text */}
        <div className="rounded border border-gray-800 bg-gray-900/50 px-3 py-2 mb-4">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Multiplies positions and sizes of <strong className="text-gray-300">{counts.controls}</strong> control{counts.controls === 1 ? '' : 's'},{' '}
            <strong className="text-gray-300">{counts.sections}</strong> section{counts.sections === 1 ? '' : 's'}, and{' '}
            <strong className="text-gray-300">{counts.labels}</strong> label{counts.labels === 1 ? '' : 's'}.
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Visual zoom unchanged. Cmd+Z reverts.
          </p>
        </div>

        {validationMsg && (
          <p className="text-[11px] text-amber-400 mb-3">{validationMsg}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleReset}
            disabled={Math.abs(scaleCumulativeFactor - 1.0) < 0.0001}
            className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Restore exact original layout"
          >
            Reset to original
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded px-3 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!validFactor}
              className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Scale
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
