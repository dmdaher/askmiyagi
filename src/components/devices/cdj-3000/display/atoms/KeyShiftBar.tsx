'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface KeyShiftBarProps {
  /** Current key string (e.g., "Am") */
  currentKey?: string;
  /** Shift amount in semitones */
  shiftAmount?: number;
  /** Target key after shift */
  targetKey?: string;
}

/**
 * Key shift bar displayed at the bottom of the waveform screen when
 * KEY SHIFT tab is active. Matches manual page 70.
 * Shows: [target key left] [-] [current key + shift] [||] [+] [target key right]
 */
export default function KeyShiftBar({
  currentKey = 'Am',
  shiftAmount = 2,
  targetKey = 'Bbm',
}: KeyShiftBarProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-3 py-2"
      style={{
        backgroundColor: t.backgroundColor,
        borderTop: `1px solid ${t.borderColor}`,
      }}
    >
      {/* Left target key */}
      <span
        style={{
          color: t.categoryText,
          fontSize: 11,
          fontFamily: t.fontFamily,
        }}
      >
        {targetKey || 'Abm'}
      </span>

      {/* Minus button */}
      <div
        className="flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          backgroundColor: t.tabInactiveBg,
          borderRadius: 2,
          border: `1px solid ${t.borderColor}`,
          color: t.textColor,
          fontSize: 14,
        }}
      >
        -
      </div>

      {/* Current key + shift display */}
      <div
        className="flex items-center justify-center gap-1 px-3 py-1 rounded"
        style={{
          backgroundColor: t.headerBg,
          border: `1px solid ${t.accentColor}40`,
          minWidth: 80,
        }}
      >
        <span
          style={{
            color: t.textColor,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: t.fontFamily,
          }}
        >
          {currentKey}
        </span>
        <span
          style={{
            color: shiftAmount > 0 ? t.tempoGreen : shiftAmount < 0 ? t.cueRed : t.categoryText,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: t.fontMono,
          }}
        >
          {shiftAmount > 0 ? `+${shiftAmount}` : shiftAmount}
        </span>
      </div>

      {/* Reset divider */}
      <div
        className="flex items-center justify-center"
        style={{
          color: t.categoryText,
          fontSize: 8,
        }}
      >
        <span
          className="px-1 py-0.5 rounded"
          style={{
            border: `1px solid ${t.borderColor}`,
            fontSize: 7,
            fontWeight: 600,
          }}
        >
          RESET
        </span>
      </div>

      {/* Plus button */}
      <div
        className="flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          backgroundColor: t.tabInactiveBg,
          borderRadius: 2,
          border: `1px solid ${t.borderColor}`,
          color: t.textColor,
          fontSize: 14,
        }}
      >
        +
      </div>

      {/* Right target key */}
      <span
        style={{
          color: t.categoryText,
          fontSize: 11,
          fontFamily: t.fontFamily,
        }}
      >
        {targetKey || 'Bbm'}
      </span>
    </div>
  );
}
