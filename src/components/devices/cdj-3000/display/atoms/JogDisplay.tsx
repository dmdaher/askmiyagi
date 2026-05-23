'use client';

import React from 'react';
import theme from '../device-theme.json';

const jt = theme.jogDisplay;

interface JogDisplayProps {
  /** Album artwork URL or null */
  artworkUrl?: string | null;
  /** Artist name */
  artist?: string;
  /** Track title */
  title?: string;
  /** Playback position 0-360 degrees */
  rotationDeg?: number;
  /** Vinyl mode active */
  vinylMode?: boolean;
  /** Slip mode active */
  slipMode?: boolean;
  /** Beat Sync active */
  beatSync?: boolean;
  /** Is sync master */
  isMaster?: boolean;
  /** Cue/loop/hot cue point indicator positions */
  cuePoints?: number[];
}

/**
 * Circular jog display that sits in the center of the jog wheel.
 * Matches manual page 26: shows artwork, indicators, and playhead.
 */
export default function JogDisplay({
  artist = 'ARTIST NAME',
  title = 'TRACK TITLE',
  rotationDeg = 0,
  vinylMode = true,
  slipMode = false,
  beatSync = false,
  isMaster = false,
  cuePoints = [],
}: JogDisplayProps) {
  const size = jt.diameter;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.65;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: jt.backgroundColor,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <circle cx={cx} cy={cy} r={outerR} fill={jt.backgroundColor} />

        {/* Ring color (red/magenta gradient) */}
        <defs>
          <radialGradient id="jogRing" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" />
            <stop offset="90%" stopColor={`${jt.ringColor}60`} />
            <stop offset="95%" stopColor={`${jt.ringColor}30`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={outerR} fill="url(#jogRing)" />

        {/* Cue point dots around the ring */}
        {cuePoints.map((deg, i) => {
          const angle = (deg - 90) * (Math.PI / 180);
          const dotR = outerR * 0.88;
          const dotX = cx + Math.cos(angle) * dotR;
          const dotY = cy + Math.sin(angle) * dotR;
          return (
            <circle
              key={`cue-${i}`}
              cx={dotX}
              cy={dotY}
              r={2}
              fill={jt.cuePointColor}
            />
          );
        })}

        {/* Inner circle (artwork area) */}
        <circle cx={cx} cy={cy} r={innerR} fill={jt.artworkBg} />

        {/* Artwork placeholder gradient */}
        <defs>
          <linearGradient id="artGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a1020" />
            <stop offset="50%" stopColor="#1a2040" />
            <stop offset="100%" stopColor="#102030" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={innerR - 2} fill="url(#artGrad)" />

        {/* Track info text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill={jt.textColor}
          fontSize={jt.fontSize.artist}
          fontFamily="sans-serif"
          opacity={0.7}
        >
          {artist}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill={jt.textColor}
          fontSize={jt.fontSize.title}
          fontWeight={600}
          fontFamily="sans-serif"
        >
          {title}
        </text>

        {/* Playhead indicator (rotating line from center) */}
        <line
          x1={cx}
          y1={cy - innerR + 8}
          x2={cx}
          y2={cy - outerR + 4}
          stroke={jt.playheadColor}
          strokeWidth={2}
          transform={`rotate(${rotationDeg}, ${cx}, ${cy})`}
        />

        {/* Mode indicator: SLIP (top left) */}
        {slipMode && (
          <text
            x={cx - outerR * 0.5}
            y={cy - outerR * 0.6}
            fill={jt.slipColor}
            fontSize={jt.fontSize.indicator}
            fontWeight={700}
            fontFamily="sans-serif"
          >
            SLIP
          </text>
        )}

        {/* Mode label (top center) */}
        <text
          x={cx}
          y={16}
          textAnchor="middle"
          fill={jt.modeTextColor}
          fontSize={jt.fontSize.indicator}
          fontFamily="sans-serif"
        >
          MODE
        </text>

        {/* VINYL indicator (top right) */}
        {vinylMode && (
          <text
            x={cx + outerR * 0.3}
            y={cy - outerR * 0.6}
            fill={jt.vinylColor}
            fontSize={jt.fontSize.indicator}
            fontWeight={700}
            fontFamily="sans-serif"
          >
            VINYL
          </text>
        )}

        {/* SYNC indicator (bottom left) */}
        {beatSync && (
          <>
            <text
              x={cx - outerR * 0.5}
              y={cy + outerR * 0.7}
              fill={jt.syncColor}
              fontSize={jt.fontSize.indicator}
              fontWeight={700}
              fontFamily="sans-serif"
            >
              SYNC
            </text>
            <text
              x={cx - outerR * 0.45}
              y={cy + outerR * 0.82}
              fill={jt.syncColor}
              fontSize={7}
              fontFamily="sans-serif"
            >
              BEAT SYNC
            </text>
          </>
        )}

        {/* MASTER indicator (bottom right) */}
        {isMaster && (
          <text
            x={cx + outerR * 0.2}
            y={cy + outerR * 0.7}
            fill={jt.masterColor}
            fontSize={jt.fontSize.indicator}
            fontWeight={700}
            fontFamily="sans-serif"
          >
            MASTER
          </text>
        )}
      </svg>
    </div>
  );
}
