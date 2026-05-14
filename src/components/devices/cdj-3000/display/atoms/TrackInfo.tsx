'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface TrackInfoProps {
  /** Device icon type */
  deviceType?: 'USB' | 'SD' | 'LINK';
  /** Track title */
  title?: string;
  /** Track artist */
  artist?: string;
  /** Track duration string */
  duration?: string;
  /** Track BPM */
  bpm?: number;
  /** Musical key */
  musicalKey?: string;
  /** Track info icon (rekordbox analyzed) */
  analyzed?: boolean;
}

export default function TrackInfo({
  deviceType = 'USB',
  title = 'Track Title',
  artist,
  duration,
  bpm,
  musicalKey,
  analyzed = true,
}: TrackInfoProps) {
  const deviceColors: Record<string, string> = {
    USB: t.accentColor,
    SD: '#ff8800',
    LINK: '#44cc44',
  };

  return (
    <div
      className="flex items-center gap-2 px-2 py-1"
      style={{
        backgroundColor: t.headerBg,
        borderBottom: `1px solid ${t.borderColor}`,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Device icon */}
      <div
        className="flex items-center justify-center rounded"
        style={{
          backgroundColor: deviceColors[deviceType] || t.accentColor,
          width: 20,
          height: 20,
          fontSize: 7,
          fontWeight: 700,
          color: '#000',
        }}
      >
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
          {deviceType === 'USB' ? (
            <path
              d="M6 1v4M4 3h4M3 5v4a2 2 0 002 2h2a2 2 0 002-2V5H3z"
              stroke="#000"
              strokeWidth={1.2}
            />
          ) : deviceType === 'SD' ? (
            <rect x={2} y={1} width={8} height={10} rx={1} stroke="#000" strokeWidth={1.2} />
          ) : (
            <path d="M2 6h8M6 2v8" stroke="#000" strokeWidth={1.2} />
          )}
        </svg>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {analyzed && (
            <span style={{ color: t.accentColor, fontSize: 10 }}>&#9835;</span>
          )}
          <span
            className="truncate"
            style={{
              color: t.textColor,
              fontSize: t.fontSize.trackInfo,
              fontWeight: 500,
            }}
          >
            {title}
          </span>
        </div>
        {(artist || duration || bpm || musicalKey) && (
          <div className="flex items-center gap-2" style={{ fontSize: 9, color: t.categoryText }}>
            {duration && <span>{duration}</span>}
            {bpm && <span>{bpm.toFixed(1)}</span>}
            {musicalKey && <span>{musicalKey}</span>}
            {analyzed && (
              <span style={{ color: t.categoryText, fontSize: 8 }}>&#9432;</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
