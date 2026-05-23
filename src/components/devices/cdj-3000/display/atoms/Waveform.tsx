'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface WaveformProps {
  /** 'overall' = full track, 'enlarged' = zoomed waveform section */
  variant: 'overall' | 'enlarged';
  /** Playback progress 0-1 */
  progress?: number;
  /** Current position as time string */
  currentTime?: string;
  /** Total duration as time string */
  totalTime?: string;
  /** Loop in/out positions as 0-1 fractions */
  loopIn?: number;
  loopOut?: number;
  /** Hot cue positions as 0-1 fractions with optional colors */
  hotCues?: { position: number; color: string; label: string }[];
  /** Cue point position 0-1 */
  cuePoint?: number;
  /** Beat countdown text (e.g., "06.0") */
  beatCountdown?: string;
  /** Waveform color mode */
  colorMode?: 'BLUE' | 'RGB' | '3 BAND';
  /** Current position display mode: CENTER or LEFT */
  currentPosition?: 'CENTER' | 'LEFT';
  /** Zoom level label */
  zoomLevel?: string;
  /** Grid adjust mode active */
  gridAdjust?: boolean;
}

function generateWaveformBars(
  count: number,
  colorMode: string,
  variant: string
): { height: number; color: string }[] {
  const bars: { height: number; color: string }[] = [];
  for (let i = 0; i < count; i++) {
    const phase = i / count;
    // Generate pseudo-random but deterministic heights
    const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const noise = seed - Math.floor(seed);
    // Create a natural-looking amplitude envelope
    const envelope = Math.sin(phase * Math.PI * 4) * 0.5 + 0.5;
    const height = Math.max(0.05, envelope * noise);

    let color: string;
    if (colorMode === 'RGB') {
      const hue = (phase * 360 + noise * 60) % 360;
      color = `hsl(${hue}, 80%, 55%)`;
    } else if (colorMode === '3 BAND') {
      if (noise < 0.33) color = t.cueRed;
      else if (noise < 0.66) color = t.tempoGreen;
      else color = t.waveformBlue;
    } else {
      // BLUE mode
      const brightness = variant === 'enlarged' ? 0.6 + height * 0.4 : 0.4 + height * 0.6;
      color = `rgba(51, 136, 255, ${brightness})`;
    }

    bars.push({ height, color });
  }
  return bars;
}

export default function Waveform({
  variant,
  progress = 0.3,
  loopIn,
  loopOut,
  hotCues = [],
  cuePoint,
  beatCountdown,
  colorMode = 'BLUE',
  currentPosition = 'CENTER',
  zoomLevel,
  gridAdjust = false,
}: WaveformProps) {
  const isOverall = variant === 'overall';
  const barCount = isOverall ? 200 : 120;
  const height = isOverall ? 24 : 80;
  const bars = generateWaveformBars(barCount, colorMode, variant);

  const playheadX = currentPosition === 'CENTER'
    ? barCount / 2
    : Math.floor(barCount * 0.2);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Beat countdown (enlarged waveform only) */}
      {!isOverall && beatCountdown && (
        <div
          className="absolute top-0 left-1 z-10"
          style={{ color: t.textColor, fontSize: 9, fontFamily: t.fontMono }}
        >
          {beatCountdown}<span style={{ fontSize: 7 }}>M</span>
        </div>
      )}

      {/* Zoom/Grid indicator (enlarged waveform only) */}
      {!isOverall && (
        <div
          className="absolute bottom-0 right-1 z-10"
          style={{ color: t.categoryText, fontSize: 8, fontFamily: t.fontMono }}
        >
          {gridAdjust ? 'GRID' : 'ZOOM'}{zoomLevel ? ` ${zoomLevel}` : ''}
        </div>
      )}

      {/* SVG waveform */}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${barCount} ${height}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {/* Dark background */}
        <rect width={barCount} height={height} fill={t.backgroundColor} />

        {/* Beat grid lines */}
        {!isOverall &&
          Array.from({ length: Math.floor(barCount / 8) }).map((_, i) => (
            <line
              key={`grid-${i}`}
              x1={i * 8}
              y1={0}
              x2={i * 8}
              y2={height}
              stroke={t.borderColor}
              strokeWidth={0.5}
            />
          ))}

        {/* Numbered beat markers for enlarged view */}
        {!isOverall &&
          [4, 8, 16, 32].map((beat) => {
            const x = (beat / 32) * barCount;
            return (
              <text
                key={`beat-${beat}`}
                x={x}
                y={height - 2}
                fill={t.categoryText}
                fontSize={6}
                textAnchor="middle"
                fontFamily={t.fontMono}
              >
                {beat}
              </text>
            );
          })}

        {/* Loop region */}
        {loopIn !== undefined && loopOut !== undefined && (
          <rect
            x={loopIn * barCount}
            y={0}
            width={(loopOut - loopIn) * barCount}
            height={height}
            fill={`${t.loopOrange}15`}
          />
        )}

        {/* Waveform bars (mirrored top/bottom for enlarged) */}
        {bars.map((bar, i) => {
          const barH = isOverall
            ? bar.height * height * 0.9
            : bar.height * (height / 2) * 0.85;
          const y = isOverall ? height - barH : height / 2 - barH;
          const fullH = isOverall ? barH : barH * 2;

          return (
            <rect
              key={i}
              x={i}
              y={y}
              width={0.8}
              height={fullH}
              fill={bar.color}
              opacity={isOverall && i < progress * barCount ? 0.4 : 1}
            />
          );
        })}

        {/* Cue point marker */}
        {cuePoint !== undefined && (
          <line
            x1={cuePoint * barCount}
            y1={0}
            x2={cuePoint * barCount}
            y2={height}
            stroke={t.hotCueGreen}
            strokeWidth={1}
          />
        )}

        {/* Loop markers */}
        {loopIn !== undefined && (
          <line
            x1={loopIn * barCount}
            y1={0}
            x2={loopIn * barCount}
            y2={height}
            stroke={t.loopOrange}
            strokeWidth={1.5}
          />
        )}
        {loopOut !== undefined && (
          <line
            x1={loopOut * barCount}
            y1={0}
            x2={loopOut * barCount}
            y2={height}
            stroke={t.loopOrange}
            strokeWidth={1.5}
          />
        )}

        {/* Hot cue markers */}
        {hotCues.map((cue, i) => (
          <g key={`hc-${i}`}>
            <line
              x1={cue.position * barCount}
              y1={0}
              x2={cue.position * barCount}
              y2={height}
              stroke={cue.color}
              strokeWidth={1}
            />
            <rect
              x={cue.position * barCount - 3}
              y={isOverall ? 0 : height - 8}
              width={6}
              height={6}
              fill={cue.color}
              rx={1}
            />
            <text
              x={cue.position * barCount}
              y={isOverall ? 5 : height - 3}
              fill="#000"
              fontSize={4}
              textAnchor="middle"
              fontWeight={700}
            >
              {cue.label}
            </text>
          </g>
        ))}

        {/* Playhead (red vertical line with triangle) */}
        <line
          x1={isOverall ? progress * barCount : playheadX}
          y1={0}
          x2={isOverall ? progress * barCount : playheadX}
          y2={height}
          stroke={t.playheadRed}
          strokeWidth={isOverall ? 1 : 1.5}
        />
        {!isOverall && (
          <polygon
            points={`${playheadX - 3},0 ${playheadX + 3},0 ${playheadX},4`}
            fill={t.playheadRed}
          />
        )}

        {/* Progress overlay for overall waveform (already played region) */}
        {isOverall && (
          <rect
            x={0}
            y={0}
            width={progress * barCount}
            height={height}
            fill="rgba(0,0,0,0.4)"
          />
        )}
      </svg>
    </div>
  );
}
