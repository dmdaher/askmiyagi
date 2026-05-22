'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from './store';
import { selectedControlIds } from './store/selection-types';

/**
 * "Scale Selected ▾" — contractor productivity dropdown that pairs
 * with Select Controls ▾. Once a selection exists (typically "all pads"
 * or "all knobs"), one click applies a factor to every eligible
 * control: w' = w * factor, h' = h * factor, x'/y' shifted so the
 * center stays put. labelFontSize is scaled proportionally + clamped
 * to 6px min. Locked + screen/display controls are skipped.
 *
 * Closes on outside-click and on every preset/custom apply.
 * Disabled when nothing is selected (tooltip points to Select ▾).
 */

interface Preset {
  factor: number;
  label: string;
  arrow: '⇣' | '⇡';
}

const PRESETS: Preset[] = [
  { factor: 0.5, label: 'Shrink to 50%', arrow: '⇣' },
  { factor: 0.75, label: 'Shrink to 75%', arrow: '⇣' },
  { factor: 0.9, label: 'Shrink to 90%', arrow: '⇣' },
  { factor: 1.1, label: 'Grow to 110%', arrow: '⇡' },
  { factor: 1.25, label: 'Grow to 125%', arrow: '⇡' },
];

export default function ScaleDropdown() {
  const selection = useEditorStore((s) => s.selection);
  const scaleSelectedControls = useEditorStore((s) => s.scaleSelectedControls);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);

  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCount = selectedControlIds(selection).length;
  const disabled = selectedCount === 0;

  // Outside-click close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Auto-dismiss toast after 3s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const applyFactor = (factor: number) => {
    pushSnapshot();
    const result = scaleSelectedControls(factor);
    // Build a concise toast: "Scaled 12 to 75% (3 skipped)"
    const pct = Math.round(factor * 100);
    const parts: string[] = [`Scaled ${result.eligible} control${result.eligible === 1 ? '' : 's'} to ${pct}%`];
    if (result.skipped > 0) parts.push(`${result.skipped} skipped (locked / fixed-aspect)`);
    if (result.sizeClamped > 0) parts.push(`${result.sizeClamped} hit min size`);
    if (result.fontClamped > 0) parts.push(`${result.fontClamped} hit min font`);
    setToast(parts.join(' · '));
    setOpen(false);
    setCustomValue('');
  };

  const applyCustom = () => {
    // Accept "75" (treated as percent) or "0.75" (treated as raw factor)
    const trimmed = customValue.trim();
    const num = parseFloat(trimmed);
    if (!Number.isFinite(num) || num <= 0) {
      setToast('Invalid scale value (use 10–500%, e.g., 75)');
      return;
    }
    const factor = num > 5 ? num / 100 : num;
    if (factor < 0.1 || factor > 5) {
      setToast('Scale must be 10%–500%');
      return;
    }
    applyFactor(factor);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`flex h-7 w-[78px] flex-col items-center justify-center rounded px-1 text-[10px] font-medium leading-tight transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
          open
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100 border border-gray-700'
        }`}
        title={
          disabled
            ? 'Select controls first (use Select Controls ▾ or Cmd+A)'
            : `Scale ${selectedCount} selected control${selectedCount === 1 ? '' : 's'}`
        }
      >
        <span>Scale</span>
        <span>{disabled ? 'Selected ▾' : `(${selectedCount}) ▾`}</span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full mt-1 z-[1000] min-w-[260px] rounded border border-gray-700 bg-[#15151f] shadow-lg py-1">
          {PRESETS.map((p) => (
            <button
              key={p.factor}
              onClick={() => applyFactor(p.factor)}
              className="w-full flex items-center gap-3 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-blue-500/10 hover:text-blue-200"
              title={`Scale all selected to ${Math.round(p.factor * 100)}% (center-preserved)`}
            >
              <span className="text-blue-400 font-mono w-3 text-center">{p.arrow}</span>
              <span>{p.label}</span>
            </button>
          ))}

          <div className="my-1 h-px bg-gray-800" />

          {/* Custom percent */}
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="text-[11px] text-gray-400 w-12">Custom:</span>
            <input
              type="number"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCustom();
                if (e.key === 'Escape') {
                  setCustomValue('');
                  setOpen(false);
                }
              }}
              placeholder="75"
              min={10}
              max={500}
              className="h-6 w-16 rounded border border-gray-700 bg-gray-900 px-1.5 text-[11px] text-gray-200 outline-none focus:border-blue-500"
              autoFocus={false}
            />
            <span className="text-[10px] text-gray-500">%</span>
            <button
              onClick={applyCustom}
              disabled={customValue.trim() === ''}
              className="h-6 rounded border border-blue-500/40 bg-blue-500/10 px-2 text-[10px] text-blue-300 hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>

          {/* Helper text */}
          <div className="px-3 py-1 text-[9px] text-gray-600 leading-relaxed">
            W/H scaled · positions stay centered · canvas size unchanged · undo restores in one step
          </div>
        </div>
      )}

      {/* Floating toast */}
      {toast && (
        <div className="absolute left-0 top-full mt-1 z-[1001] min-w-[260px] rounded border border-blue-500/30 bg-[#1a1a28] px-3 py-1.5 text-[10px] text-blue-200 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
