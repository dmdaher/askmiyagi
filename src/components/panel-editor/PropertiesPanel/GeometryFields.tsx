'use client';

import { useCallback } from 'react';

interface GeometryFieldsProps {
  x: number;
  y: number;
  w: number;
  h: number;
  step: number;
  /** When true, display "Mixed" placeholder (multi-select differing values) */
  xMixed?: boolean;
  yMixed?: boolean;
  wMixed?: boolean;
  hMixed?: boolean;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
  onWChange: (value: number) => void;
  onHChange: (value: number) => void;
}

function NumField({
  label,
  value,
  step,
  mixed,
  onChange,
  title,
}: {
  label: string;
  value: number;
  step: number;
  mixed?: boolean;
  onChange: (v: number) => void;
  title: string;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num)) {
        onChange(num);
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-0.5" title={title}>
      <label className="text-[10px] text-gray-500">{label}</label>
      <input
        type="number"
        value={mixed ? '' : Math.round(value)}
        placeholder={mixed ? 'Mixed' : '0'}
        step={step}
        onChange={handleChange}
        className="h-7 w-full rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500 placeholder:text-gray-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  );
}

export default function GeometryFields({
  x,
  y,
  w,
  h,
  step,
  xMixed,
  yMixed,
  wMixed,
  hMixed,
  onXChange,
  onYChange,
  onWChange,
  onHChange,
}: GeometryFieldsProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wide text-gray-500">
        Position
      </label>
      <div className="grid grid-cols-2 gap-2">
        <NumField
          label="X"
          value={x}
          step={step}
          mixed={xMixed}
          onChange={onXChange}
          title="Horizontal position (px)"
        />
        <NumField
          label="Y"
          value={y}
          step={step}
          mixed={yMixed}
          onChange={onYChange}
          title="Vertical position (px)"
        />
        <NumField
          label="W"
          value={w}
          step={step}
          mixed={wMixed}
          onChange={onWChange}
          title="Width (px)"
        />
        <NumField
          label="H"
          value={h}
          step={step}
          mixed={hMixed}
          onChange={onHChange}
          title="Height (px)"
        />
      </div>
    </div>
  );
}
