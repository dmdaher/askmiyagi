'use client';

import { useCallback } from 'react';
import type { ControlDef } from '../store';

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
  /** When true, the fields show "Mixed" placeholder (multi-select with differing values) */
  labelMixed?: boolean;
  positionMixed?: boolean;
  secondaryMixed?: boolean;
  onLabelChange: (value: string) => void;
  onPositionChange: (value: ControlDef['labelPosition']) => void;
  onSecondaryLabelChange: (value: string) => void;
  onFontSizeChange?: (value: number) => void;
}

export default function LabelEditor({
  label,
  labelPosition,
  secondaryLabel,
  labelFontSize,
  labelMixed,
  positionMixed,
  secondaryMixed,
  onLabelChange,
  onPositionChange,
  onSecondaryLabelChange,
  onFontSizeChange,
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
          placeholder={labelMixed ? 'Mixed' : 'Label text'}
          onChange={handleLabelChange}
          className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
        />
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
              max={20}
              value={labelFontSize ?? 8}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-gray-500 w-6">{labelFontSize ?? 8}px</span>
          </div>
        </div>
      )}

      {/* Secondary label */}
      {showSecondary ? (
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500">Secondary</label>
          <input
            type="text"
            value={secondaryMixed ? '' : (secondaryLabel ?? '')}
            placeholder={secondaryMixed ? 'Mixed' : 'Secondary label'}
            onChange={handleSecondaryChange}
            className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600"
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
