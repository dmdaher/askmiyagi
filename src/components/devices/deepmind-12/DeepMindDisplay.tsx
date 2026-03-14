'use client';

import { DisplayState } from '@/types/display';
import { DM_COLORS } from '@/lib/devices/deepmind-12-constants';

interface DeepMindDisplayProps {
  displayState: DisplayState;
  highlighted?: boolean;
}

export default function DeepMindDisplay({ displayState, highlighted }: DeepMindDisplayProps) {
  const programName = displayState.statusText || 'Init Program';
  const programNumber = displayState.selectedIndex ?? 1;
  const bankLetter = String.fromCharCode(65 + Math.floor((programNumber - 1) / 128));
  const patchNum = ((programNumber - 1) % 128) + 1;

  return (
    <div
      data-control-id="display"
      className="relative rounded-sm overflow-hidden"
      style={{
        width: '100%',
        aspectRatio: '1.33',
        maxHeight: 120,
        background: DM_COLORS.displayBg,
        border: `1px solid ${DM_COLORS.displayBorder}`,
        boxShadow: highlighted
          ? '0 0 12px 4px rgba(0,170,255,0.6)'
          : `inset 0 1px 4px rgba(0,0,0,0.8), 0 1px 0 ${DM_COLORS.sectionBorder}`,
        fontFamily: 'monospace',
        padding: '6px 8px',
      }}
    >
      {/* Program header */}
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: DM_COLORS.displayText, fontSize: 9, opacity: 0.7 }}>
          {bankLetter}-{String(patchNum).padStart(3, '0')}
        </span>
        <span style={{ color: DM_COLORS.displayText, fontSize: 8, opacity: 0.5 }}>
          PROG
        </span>
      </div>

      {/* Program name */}
      <div
        className="truncate font-bold tracking-wide"
        style={{ color: DM_COLORS.displayText, fontSize: 12, lineHeight: 1.2 }}
      >
        {programName}
      </div>

      {/* Mini envelope visualization */}
      <div className="mt-1.5 flex gap-2">
        {['VCA', 'VCF', 'MOD'].map((env) => (
          <div key={env} className="flex flex-col items-center">
            <svg width="28" height="18" viewBox="0 0 28 18">
              <polyline
                points="0,17 4,2 10,8 18,8 28,17"
                fill="none"
                stroke={DM_COLORS.displayText}
                strokeWidth="1"
                opacity="0.6"
              />
            </svg>
            <span style={{ color: DM_COLORS.displayText, fontSize: 6, opacity: 0.5 }}>
              {env}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
