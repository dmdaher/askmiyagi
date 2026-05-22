'use client';

/**
 * CanvasScaleModal — canvas-only proportional scale dialog.
 *
 * Visually echoes the editor's ScaleContentsModal but is intentionally
 * SEPARATE: editor's modal is 278 LOC coupled to scaleFromBase /
 * scaleCumulativeFactor / pushSnapshot and MUTATES the manifest. This
 * modal is session-only: it sets the canvas's CSS-transform scale and
 * never touches manifest data.
 *
 * UX:
 *   - Percent input (10–500%, default = current scale)
 *   - Preset buttons: 50 / 75 / 100 / 125 / 150
 *   - Apply / Cancel
 *   - Enter applies, Esc cancels
 *   - Cmd+Z is trapped while open so the canvas's other keyboard
 *     shortcuts don't fire mid-edit
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  currentScale: number;
  onApply: (scale: number) => void;
  onClose: () => void;
}

const MIN_PCT = 10;
const MAX_PCT = 500;
const PRESETS = [50, 75, 100, 125, 150];

export default function CanvasScaleModal({ open, currentScale, onApply, onClose }: Props) {
  const [percentStr, setPercentStr] = useState(String(Math.round(currentScale * 100)));
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setPercentStr(String(Math.round(currentScale * 100)));
  }, [open, currentScale]);

  // Trap Esc/Enter and block other shortcuts while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'Enter') {
        // Only commit if focus isn't on a preset button (that has its own action)
        const ae = document.activeElement as HTMLElement | null;
        if (ae?.tagName !== 'BUTTON') { e.preventDefault(); commit(); }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        // Trap so canvas-level undo (if any) doesn't fire mid-edit
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const commit = () => {
    const n = Number(percentStr);
    if (!Number.isFinite(n)) { onClose(); return; }
    const clamped = Math.max(MIN_PCT, Math.min(MAX_PCT, n));
    onApply(clamped / 100);
    onClose();
  };

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={onClose}
      data-testid="canvas-scale-modal-backdrop"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-gray-700 bg-[#111122] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="canvas-scale-modal"
      >
        <h3 className="text-sm font-semibold text-gray-200 mb-1">Scale Canvas</h3>
        <p className="text-[11px] text-gray-500 mb-3">
          Visually scales the panel for review. Does not modify the manifest.
        </p>

        {/* Presets */}
        <div className="flex items-center gap-1 mb-3" data-testid="canvas-scale-modal-presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPercentStr(String(p))}
              data-testid={`canvas-scale-preset-${p}`}
              className={[
                'flex-1 h-7 rounded text-[11px] border transition-colors cursor-pointer',
                Number(percentStr) === p
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-gray-700 text-gray-300 hover:bg-gray-800',
              ].join(' ')}
            >
              {p}%
            </button>
          ))}
        </div>

        {/* Percent input */}
        <label className="block text-[10px] uppercase text-gray-500 mb-1">
          Custom percentage ({MIN_PCT}–{MAX_PCT}%)
        </label>
        <input
          type="number"
          min={MIN_PCT}
          max={MAX_PCT}
          step={1}
          value={percentStr}
          onChange={(e) => setPercentStr(e.target.value)}
          data-testid="canvas-scale-modal-input"
          autoFocus
          className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-cyan-500"
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            data-testid="canvas-scale-modal-cancel"
            className="text-xs px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commit}
            data-testid="canvas-scale-modal-apply"
            className="text-xs px-3 py-1.5 rounded font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
