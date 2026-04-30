'use client';

import React from 'react';

const RULER_THICKNESS = 20;
const MIN_LABEL_SPACING = 60; // screen pixels between labeled ticks
const BASE_INTERVALS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number;
  zoom: number;
  pan: number;
  selectionMin?: number;
  selectionMax?: number;
}

function computeMajorInterval(zoom: number): number {
  for (const interval of BASE_INTERVALS) {
    if (interval * zoom >= MIN_LABEL_SPACING) return interval;
  }
  return 1000;
}

const Ruler = React.memo(function Ruler({
  orientation,
  length,
  zoom,
  pan,
  selectionMin,
  selectionMax,
}: RulerProps) {
  const isH = orientation === 'horizontal';
  const majorInterval = computeMajorInterval(zoom);
  const minorCount = (majorInterval === 5 || majorInterval === 50) ? 5 : 4;
  const minorInterval = majorInterval / minorCount;

  // Canvas range visible in this ruler
  const canvasStart = -pan / zoom;
  const canvasEnd = (length - pan) / zoom;

  // Start from a round number before the visible range
  const firstTick = Math.floor(canvasStart / minorInterval) * minorInterval;
  const lastTick = Math.ceil(canvasEnd / minorInterval) * minorInterval;

  const ticks: React.ReactNode[] = [];

  for (let canvasPos = firstTick; canvasPos <= lastTick; canvasPos += minorInterval) {
    const screenPos = canvasPos * zoom + pan;
    if (screenPos < -10 || screenPos > length + 10) continue;

    const isMajor = Math.abs(canvasPos % majorInterval) < 0.01;
    const isMid = !isMajor && Math.abs(canvasPos % (majorInterval / 2)) < 0.01;

    const tickH = isMajor ? 10 : isMid ? 7 : 5;
    const tickColor = isMajor
      ? 'rgba(255,255,255,0.35)'
      : isMid
        ? 'rgba(255,255,255,0.22)'
        : 'rgba(255,255,255,0.15)';

    if (isH) {
      ticks.push(
        <line
          key={`t${canvasPos}`}
          x1={screenPos} y1={RULER_THICKNESS - tickH}
          x2={screenPos} y2={RULER_THICKNESS}
          stroke={tickColor} strokeWidth={1}
        />
      );
      if (isMajor) {
        ticks.push(
          <text
            key={`l${canvasPos}`}
            x={screenPos + 2} y={RULER_THICKNESS - tickH - 1}
            fill="rgba(255,255,255,0.45)"
            fontSize={9}
            fontFamily="'SF Mono', 'Fira Code', monospace"
          >
            {Math.round(canvasPos)}
          </text>
        );
      }
    } else {
      ticks.push(
        <line
          key={`t${canvasPos}`}
          x1={RULER_THICKNESS - tickH} y1={screenPos}
          x2={RULER_THICKNESS} y2={screenPos}
          stroke={tickColor} strokeWidth={1}
        />
      );
      if (isMajor) {
        ticks.push(
          <text
            key={`l${canvasPos}`}
            x={2} y={screenPos - 2}
            fill="rgba(255,255,255,0.45)"
            fontSize={9}
            fontFamily="'SF Mono', 'Fira Code', monospace"
            transform={`rotate(-90, 2, ${screenPos - 2})`}
          >
            {Math.round(canvasPos)}
          </text>
        );
      }
    }
  }

  // Selection markers
  if (selectionMin != null && selectionMax != null) {
    const minScreen = selectionMin * zoom + pan;
    const maxScreen = selectionMax * zoom + pan;
    const clampedMin = Math.max(0, Math.min(length, minScreen));
    const clampedMax = Math.max(0, Math.min(length, maxScreen));

    if (isH) {
      ticks.push(
        <rect key="sel-span" x={clampedMin} y={0} width={clampedMax - clampedMin} height={RULER_THICKNESS}
          fill="rgba(59,130,246,0.08)" />,
        <line key="sel-min" x1={clampedMin} y1={0} x2={clampedMin} y2={RULER_THICKNESS}
          stroke="rgba(59,130,246,0.9)" strokeWidth={1} />,
        <line key="sel-max" x1={clampedMax} y1={0} x2={clampedMax} y2={RULER_THICKNESS}
          stroke="rgba(59,130,246,0.5)" strokeWidth={1} />,
      );
    } else {
      ticks.push(
        <rect key="sel-span" x={0} y={clampedMin} width={RULER_THICKNESS} height={clampedMax - clampedMin}
          fill="rgba(59,130,246,0.08)" />,
        <line key="sel-min" x1={0} y1={clampedMin} x2={RULER_THICKNESS} y2={clampedMin}
          stroke="rgba(59,130,246,0.9)" strokeWidth={1} />,
        <line key="sel-max" x1={0} y1={clampedMax} x2={RULER_THICKNESS} y2={clampedMax}
          stroke="rgba(59,130,246,0.5)" strokeWidth={1} />,
      );
    }
  }

  // Border on canvas side
  const borderLine = isH
    ? <line x1={0} y1={RULER_THICKNESS} x2={length} y2={RULER_THICKNESS} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    : <line x1={RULER_THICKNESS} y1={0} x2={RULER_THICKNESS} y2={length} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;

  return (
    <svg
      width={isH ? length : RULER_THICKNESS}
      height={isH ? RULER_THICKNESS : length}
      style={{ display: 'block', pointerEvents: 'none', backgroundColor: '#0d0d1a' }}
    >
      {borderLine}
      {ticks}
    </svg>
  );
});

export default Ruler;
export { RULER_THICKNESS };
