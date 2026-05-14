'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface TrackListRowProps {
  index: number;
  title: string;
  artist?: string;
  bpm?: number;
  musicalKey?: string;
  isSelected?: boolean;
  isPlaying?: boolean;
  hasPreview?: boolean;
}

/**
 * Single track row in the browse/search/playlist/tag list screens.
 * Matches the track list layout from manual page 19.
 */
export default function TrackListRow({
  index,
  title,
  artist,
  bpm,
  musicalKey,
  isSelected = false,
  isPlaying = false,
  hasPreview = false,
}: TrackListRowProps) {
  return (
    <div
      className="flex items-center px-2 py-1 gap-2"
      style={{
        backgroundColor: isSelected
          ? t.trackListRowSelected
          : index % 2 === 0
          ? t.trackListRowEven
          : t.trackListRowOdd,
        borderLeft: isSelected ? `2px solid ${t.accentColor}` : '2px solid transparent',
        fontFamily: t.fontFamily,
      }}
    >
      {/* Row number */}
      <span
        style={{
          color: t.categoryText,
          fontSize: 9,
          fontFamily: t.fontMono,
          minWidth: 20,
          textAlign: 'right',
        }}
      >
        {String(index + 1).padStart(3, '0')}
      </span>

      {/* Playing indicator */}
      <span style={{ color: isPlaying ? t.accentColor : 'transparent', fontSize: 8 }}>
        &#9654;
      </span>

      {/* Preview waveform placeholder */}
      {hasPreview && (
        <div
          style={{
            width: 30,
            height: 14,
            backgroundColor: `${t.waveformBlue}20`,
            borderRadius: 1,
          }}
        >
          <svg width={30} height={14} viewBox="0 0 30 14">
            {Array.from({ length: 15 }).map((_, i) => {
              const h = Math.sin(i * 0.8) * 5 + 3;
              return (
                <rect
                  key={i}
                  x={i * 2}
                  y={7 - h / 2}
                  width={1.5}
                  height={h}
                  fill={t.waveformBlue}
                  opacity={0.6}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* Track title */}
      <span
        className="flex-1 truncate"
        style={{
          color: isSelected ? '#fff' : t.textColor,
          fontSize: t.fontSize.label,
          fontWeight: isSelected ? 600 : 400,
        }}
      >
        {title}
      </span>

      {/* Artist */}
      {artist && (
        <span
          className="truncate"
          style={{
            color: t.categoryText,
            fontSize: t.fontSize.label,
            maxWidth: 100,
          }}
        >
          {artist}
        </span>
      )}

      {/* BPM */}
      {bpm && (
        <span
          style={{
            color: t.textColor,
            fontSize: t.fontSize.label,
            fontFamily: t.fontMono,
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {bpm.toFixed(1)}
        </span>
      )}

      {/* Key */}
      {musicalKey && (
        <span
          style={{
            color: t.categoryText,
            fontSize: t.fontSize.label,
            minWidth: 18,
            textAlign: 'right',
          }}
        >
          {musicalKey}
        </span>
      )}
    </div>
  );
}
