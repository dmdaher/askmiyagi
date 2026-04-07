'use client';

import { useCallback } from 'react';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import LEDIndicator from '@/components/controls/LEDIndicator';
import Wheel from '@/components/controls/Wheel';
import PadButton from '@/components/controls/PadButton';
import ValueDial from '@/components/controls/ValueDial';
import Lever from '@/components/controls/Lever';

const CONTROL_TYPES = [
  'button',
  'knob',
  'slider',
  'led',
  'wheel',
  'pad',
  'encoder',
  'lever',
  'screen',
] as const;

type ControlType = (typeof CONTROL_TYPES)[number];

/** Render a small static thumbnail of each control type */
function TypeThumbnail({ type }: { type: ControlType }) {
  const wrapClass =
    'flex items-center justify-center w-full h-full pointer-events-none';

  switch (type) {
    case 'button':
      return (
        <div className={wrapClass} style={{ transform: 'scale(0.6)' }}>
          <PanelButton id="thumb-btn" label="BTN" size="sm" />
        </div>
      );
    case 'knob':
      return (
        <div className={wrapClass} style={{ transform: 'scale(0.55)' }}>
          <Knob id="thumb-knob" label="" size="sm" />
        </div>
      );
    case 'slider':
      return (
        <div className={wrapClass} style={{ transform: 'scale(0.45)' }}>
          <Slider id="thumb-slider" label="" trackHeight={48} trackWidth={8} />
        </div>
      );
    case 'led':
      return (
        <div className={wrapClass}>
          <div
            className="rounded-full"
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#22c55e',
              border: '2px solid #166534',
            }}
          />
        </div>
      );
    case 'wheel':
      return (
        <div className={wrapClass} style={{ transform: 'scale(0.35)' }}>
          <Wheel id="thumb-wheel" label="" width={80} height={80} />
        </div>
      );
    case 'pad':
      return (
        <div className={wrapClass} style={{ transform: 'scale(0.55)' }}>
          <PadButton id="thumb-pad" label="PAD" width={36} height={36} />
        </div>
      );
    case 'encoder':
      return (
        <div className={wrapClass} style={{ transform: 'scale(0.5)' }}>
          <ValueDial id="thumb-enc" size="sm" />
        </div>
      );
    case 'lever':
      return (
        <div className={wrapClass} style={{ transform: 'scale(0.45)' }}>
          <Lever id="thumb-lever" label="" scale={0.7} />
        </div>
      );
    case 'screen':
      return (
        <div className={wrapClass}>
          <div className="h-5 w-8 rounded border border-gray-600 bg-gray-900 text-[6px] text-gray-500 flex items-center justify-center">
            LCD
          </div>
        </div>
      );
    default:
      return null;
  }
}

interface ControlTypeSelectorProps {
  currentType: string;
  onChange: (type: string) => void;
}

export default function ControlTypeSelector({
  currentType,
  onChange,
}: ControlTypeSelectorProps) {
  const handleSelect = useCallback(
    (type: string) => {
      if (type !== currentType) {
        onChange(type);
      }
    },
    [currentType, onChange],
  );

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wide text-gray-500">
        Type
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {CONTROL_TYPES.map((type) => (
          <div
            key={type}
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(type)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(type); }}
            className={`flex flex-col items-center gap-0.5 rounded border p-1.5 transition-colors cursor-pointer ${
              currentType === type
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
            }`}
            title={type}
          >
            <div className="flex h-12 w-full items-center justify-center overflow-hidden">
              <TypeThumbnail type={type} />
            </div>
            <span className="text-[9px] capitalize text-gray-400">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
