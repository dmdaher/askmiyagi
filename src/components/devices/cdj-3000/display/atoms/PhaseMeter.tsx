'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface PhaseMeterProps {
  /** Phase offset in beats, -4 to +4 */
  offset?: number;
  /** Whether this meter is in waveform/phase meter display mode */
  variant?: 'bar' | 'dots';
}

/**
 * Phase meter that shows bar/beat offset from sync master.
 * Displayed at position 10 on the waveform screen (manual page 21).
 */
export default function PhaseMeter({ offset = 0, variant = 'bar' }: PhaseMeterProps) {
  const totalSegments = 32;
  const centerIndex = totalSegments / 2;
  const offsetSegments = Math.round((offset / 4) * (totalSegments / 2));

  return (
    <div
      className="flex items-center gap-0"
      style={{ height: 6 }}
    >
      {Array.from({ length: totalSegments }).map((_, i) => {
        const isCenter = i === centerIndex;
        const isFilled =
          offsetSegments >= 0
            ? i >= centerIndex && i < centerIndex + offsetSegments
            : i >= centerIndex + offsetSegments && i < centerIndex;

        return (
          <div
            key={i}
            style={{
              width: 3,
              height: variant === 'dots' ? 3 : 5,
              backgroundColor: isCenter
                ? '#fff'
                : isFilled
                ? t.accentColor
                : `${t.categoryText}40`,
              borderRadius: variant === 'dots' ? '50%' : 0,
              marginRight: 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
