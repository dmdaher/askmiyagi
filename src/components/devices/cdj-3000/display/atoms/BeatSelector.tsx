'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface BeatSelectorProps {
  /** Available beat values */
  values: string[];
  /** Currently selected value */
  selectedValue?: string;
  /** Whether the left/right pair shows opposite directions (beat jump uses arrows) */
  variant?: 'loop' | 'jump';
}

/**
 * Row of touchable beat-value buttons shown at the bottom of the waveform screen
 * when BEAT LOOP or BEAT JUMP tab is active. Matches manual pages 55 and 62.
 */
export default function BeatSelector({
  values = ['1/4', '1/2', '1', '2', '4', '8', '16', '32'],
  selectedValue = '16',
  variant = 'loop',
}: BeatSelectorProps) {
  return (
    <div
      className="flex items-center gap-0.5 px-1 py-1"
      style={{
        backgroundColor: t.backgroundColor,
        borderTop: `1px solid ${t.borderColor}`,
      }}
    >
      {values.map((val) => {
        const isSelected = val === selectedValue;
        return (
          <div
            key={val}
            className="flex items-center justify-center flex-1"
            style={{
              backgroundColor: isSelected ? t.tabActiveBg : t.tabInactiveBg,
              color: isSelected ? '#fff' : t.categoryText,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: t.fontMono,
              padding: '4px 2px',
              borderRadius: 2,
              minWidth: 28,
            }}
          >
            {val}
          </div>
        );
      })}
      {/* Half/double buttons */}
      <div className="flex gap-0.5 ml-1">
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: t.tabInactiveBg,
            color: t.categoryText,
            fontSize: 10,
            width: 22,
            height: 22,
            borderRadius: 2,
            border: `1px solid ${t.borderColor}`,
          }}
        >
          {variant === 'loop' ? (
            <svg width={10} height={10} viewBox="0 0 10 10">
              <rect x={1} y={1} width={8} height={8} rx={1} stroke={t.categoryText} strokeWidth={0.8} fill="none" />
              <line x1={5} y1={1} x2={5} y2={9} stroke={t.categoryText} strokeWidth={0.8} />
            </svg>
          ) : (
            <span>&#9664;</span>
          )}
        </div>
        <div
          className="flex items-center justify-center"
          style={{
            backgroundColor: t.tabInactiveBg,
            color: t.categoryText,
            fontSize: 10,
            width: 22,
            height: 22,
            borderRadius: 2,
            border: `1px solid ${t.borderColor}`,
          }}
        >
          {variant === 'loop' ? (
            <svg width={10} height={10} viewBox="0 0 10 10">
              <rect x={1} y={1} width={4} height={8} rx={1} stroke={t.categoryText} strokeWidth={0.8} fill="none" />
              <rect x={5} y={1} width={4} height={8} rx={1} stroke={t.categoryText} strokeWidth={0.8} fill="none" />
            </svg>
          ) : (
            <span>&#9654;</span>
          )}
        </div>
      </div>
    </div>
  );
}
