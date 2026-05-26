'use client';

import { useCallback } from 'react';
import type { ControlDef } from '../store';
import ColorPickerRow from './ColorPickerRow';

const LABEL_POSITIONS: ControlDef['labelPosition'][] = [
  'above',
  'below',
  'left',
  'right',
  'on-button',
  'hidden',
];

interface LabelEditorProps {
  label: string;
  labelPosition: ControlDef['labelPosition'];
  secondaryLabel: string | undefined;
  labelFontSize?: number;
  /** When true, renders two separate inputs for top/bottom dual-label LED */
  isDualLabel?: boolean;
  /** When true, renders three separate inputs for top/middle/bottom triple-label LED */
  isTripleLabel?: boolean;
  /** Optional explicit tertiary label (middle row of triple-label). */
  tertiaryLabel?: string;
  /** Callback when middle-row text changes (triple-label only). */
  onTertiaryLabelChange?: (value: string) => void;
  /** When true, the fields show "Mixed" placeholder (multi-select with differing values) */
  labelMixed?: boolean;
  positionMixed?: boolean;
  secondaryMixed?: boolean;
  /** When true (multi-select), labelColor differs across selected items.
   *  Picker renders with no preset highlighted + a "(mixed)" caption. */
  colorMixed?: boolean;
  /** Count of distinct values when labelMixed is true (for warning label) */
  labelDistinctCount?: number;
  secondaryDistinctCount?: number;
  labelAlign?: string;
  labelColor?: string;
  onLabelChange: (value: string) => void;
  onPositionChange: (value: ControlDef['labelPosition']) => void;
  onSecondaryLabelChange: (value: string) => void;
  onFontSizeChange?: (value: number) => void;
  onAlignChange?: (value: string) => void;
  onColorChange?: (value: string) => void;
}

const ALIGN_POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
] as const;

// Color preset palette + the visual row are owned by ColorPickerRow.
// Imported below so both LabelEditor and LabelProperties (standalone
// labels) render an identical picker UX.

export default function LabelEditor({
  label,
  labelPosition,
  secondaryLabel,
  labelFontSize,
  isDualLabel,
  isTripleLabel,
  tertiaryLabel,
  onTertiaryLabelChange,
  labelAlign,
  labelColor,
  labelMixed,
  positionMixed,
  secondaryMixed,
  colorMixed,
  labelDistinctCount,
  secondaryDistinctCount,
  onLabelChange,
  onPositionChange,
  onSecondaryLabelChange,
  onFontSizeChange,
  onAlignChange,
  onColorChange,
}: LabelEditorProps) {
  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onLabelChange(e.target.value);
    },
    [onLabelChange],
  );

  const handlePositionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onPositionChange(e.target.value as ControlDef['labelPosition']);
    },
    [onPositionChange],
  );

  const handleSecondaryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSecondaryLabelChange(e.target.value);
    },
    [onSecondaryLabelChange],
  );

  const showSecondary = secondaryLabel !== undefined || secondaryMixed;

  // Triple-label mode: three separate inputs for top/middle/bottom of triple-label LED
  // (e.g. CDJ-3000 DIRECTION_INDICATOR: SLIP REV / FWD / REV)
  if (isTripleLabel) {
    const parts = label.split(/[\/\n]/);
    const topValue = parts[0] ?? '';
    const middleValue = tertiaryLabel ?? parts[1] ?? '';
    const bottomValue = parts[2] ?? secondaryLabel ?? '';
    const stripSep = (v: string) => v.replace(/[\/\n]/g, '');
    const rebuildLabel = (t: string, m: string, b: string) => `${t}/${m}/${b}`;

    return (
      <div className="space-y-2" data-testid="label-editor-triple">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Triple Label
        </label>
        <div className="space-y-1.5">
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-600">Top</label>
            <input
              type="text"
              value={topValue}
              placeholder="e.g. SLIP REV"
              onChange={(e) => onLabelChange(rebuildLabel(stripSep(e.target.value), middleValue, bottomValue))}
              className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
              data-testid="triple-label-top"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-600">Middle</label>
            <input
              type="text"
              value={middleValue}
              placeholder="e.g. FWD"
              onChange={(e) => {
                const v = stripSep(e.target.value);
                onLabelChange(rebuildLabel(topValue, v, bottomValue));
                onTertiaryLabelChange?.(v);
              }}
              className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
              data-testid="triple-label-middle"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-600">Bottom</label>
            <input
              type="text"
              value={bottomValue}
              placeholder="e.g. REV"
              onChange={(e) => {
                const v = stripSep(e.target.value);
                onLabelChange(rebuildLabel(topValue, middleValue, v));
                onSecondaryLabelChange(v);
              }}
              className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
              data-testid="triple-label-bottom"
            />
          </div>
        </div>
        {onFontSizeChange && (
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={6}
                max={40}
                value={labelFontSize ?? 8}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500 w-6">{labelFontSize ?? 8}px</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dual-label mode: two separate inputs for top/bottom of dual-label LED
  if (isDualLabel) {
    const parts = label.split(/[\/\n]/);
    const topValue = parts[0] ?? '';
    const bottomValue = parts[1] ?? '';
    const stripSlash = (v: string) => v.replace(/\//g, '');

    return (
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">
          Dual Label
        </label>
        <div className="space-y-1.5">
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-600">Top</label>
            <input
              type="text"
              value={topValue}
              placeholder="e.g. VINYL"
              onChange={(e) => onLabelChange(`${stripSlash(e.target.value)}/${bottomValue}`)}
              className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
            />
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-600">Bottom</label>
            <input
              type="text"
              value={bottomValue}
              placeholder="e.g. CDJ"
              onChange={(e) => onLabelChange(`${topValue}/${stripSlash(e.target.value)}`)}
              className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
            />
          </div>
        </div>
        {/* Font size */}
        {onFontSizeChange && (
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={6}
                max={40}
                value={labelFontSize ?? 8}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-gray-500 w-6">{labelFontSize ?? 8}px</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wide text-gray-500">
        Label
      </label>

      {/* Primary label */}
      <div className="space-y-1">
        <input
          type="text"
          value={labelMixed ? '' : label}
          placeholder={labelMixed
            ? `Mixed${labelDistinctCount && labelDistinctCount > 1 ? ` (${labelDistinctCount} different)` : ''}`
            : 'Label text'}
          onChange={handleLabelChange}
          className={`h-7 w-full rounded border bg-gray-900 px-2 text-xs text-gray-300 outline-none placeholder:text-gray-600 transition-colors ${
            labelMixed
              ? 'border-amber-600/40 focus:border-amber-500'
              : 'border-gray-700 focus:border-blue-500'
          }`}
        />
        {labelMixed && labelDistinctCount && labelDistinctCount > 1 && (
          <p className="text-[9px] text-amber-500/70 leading-tight">
            Typing here overwrites all {labelDistinctCount} different labels.
          </p>
        )}
      </div>

      {/* Label position dropdown */}
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500">Position</label>
        <select
          value={positionMixed ? '' : labelPosition}
          onChange={handlePositionChange}
          className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500"
        >
          {positionMixed && (
            <option value="" disabled>
              Mixed
            </option>
          )}
          {LABEL_POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      {/* Font size */}
      {onFontSizeChange && (
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500">Size</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={6}
              max={40}
              value={labelFontSize ?? 8}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-gray-500 w-6">{labelFontSize ?? 8}px</span>
          </div>
        </div>
      )}

      {/* On-button alignment grid + color (only when on-button) */}
      {labelPosition === 'on-button' && onAlignChange && (
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-500">Alignment</label>
          <div className="inline-grid grid-cols-3 gap-1 p-1 rounded border border-gray-700 bg-gray-900">
            {ALIGN_POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => onAlignChange(pos)}
                className="flex h-2 w-2 items-center justify-center"
                title={pos}
              >
                <div className={`rounded-full transition-colors ${
                  (labelAlign ?? 'center') === pos
                    ? 'w-2 h-2 bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]'
                    : 'w-1.5 h-1.5 bg-gray-600 hover:bg-gray-400'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shared color picker. Caller decides where the value writes —
          control.labelColor for on-button rendering, or the linked
          editorLabel.color for external positions (handled in PropertiesPanel
          index.tsx for single-control case). */}
      {onColorChange && (
        <ColorPickerRow value={labelColor} mixed={colorMixed} onChange={onColorChange} />
      )}

      {/* Secondary label */}
      {showSecondary ? (
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500">Secondary</label>
          <input
            type="text"
            value={secondaryMixed ? '' : (secondaryLabel ?? '')}
            placeholder={secondaryMixed
              ? `Mixed${secondaryDistinctCount && secondaryDistinctCount > 1 ? ` (${secondaryDistinctCount} different)` : ''}`
              : 'Secondary label'}
            onChange={handleSecondaryChange}
            className={`h-7 w-full rounded border bg-gray-900 px-2 text-xs text-gray-300 outline-none placeholder:text-gray-600 transition-colors ${
              secondaryMixed
                ? 'border-amber-600/40 focus:border-amber-500'
                : 'border-gray-700 focus:border-blue-500'
            }`}
          />
        </div>
      ) : (
        <button
          onClick={() => onSecondaryLabelChange('')}
          className="flex h-6 items-center rounded px-2 text-[10px] text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
        >
          + Add Secondary Label
        </button>
      )}
    </div>
  );
}
