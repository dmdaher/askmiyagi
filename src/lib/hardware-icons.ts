import React from 'react';

export const HARDWARE_ICONS: Record<string, string> = {
  'play': '▶',
  'pause': '❚❚',
  'play-pause': '▶/❚❚',
  'stop': '■',
  'record': '●',
  'fast-forward': '▶▶',
  'rewind': '◀◀',
  'skip-forward': '▶▶|',
  'skip-backward': '|◀◀',
  'arrow-up': '▲',
  'arrow-down': '▼',
  'arrow-left': '◀',
  'arrow-right': '▶',
  'triangle-up': '△',
  'triangle-down': '▽',
  'triangle-left': '◁',
  'triangle-right': '▷',
  'plus': '+',
  'minus': '−',
  'eject': '⏏',
  'search-skip': '⏭',
  'loop-redo': '↺',
  'sync-lock': '⟳',
  'settings-gear': '⚙',
};

// SVG icon components for shapes that can't be represented with unicode.
// All use 24x24 viewBox, stroke=currentColor, no fill, strokeWidth=2.
//
// pointerEvents: 'all' overrides the SVG default `visiblePainted` so clicks
// register anywhere in the icon's bounding rect — not just on the painted
// stroke. Without this, sparse icons (e.g., sawtooth-cycle = 3 line segments
// with a large empty triangular interior) were not draggable in the editor:
// clicks in the empty interior fell THROUGH the SVG and missed the parent
// drag-handle span. Bug-7 (2026-05-08).
const svgIcon = (d: string) => React.createElement('svg', {
  viewBox: '0 0 24 24', width: '100%', height: '100%',
  style: { display: 'block', pointerEvents: 'all' },
}, React.createElement('path', {
  d, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
}));

export const HARDWARE_ICON_SVGS: Record<string, React.ReactNode> = {
  // ── Waveform shapes (synths: DeepMind-12, Minimoog) ──
  'sine-wave': svgIcon('M2 12 C4 6, 8 6, 10 12 S16 18, 18 12 S22 6, 22 12'),
  'square-wave': svgIcon('M2 16 L2 8 L8 8 L8 16 L14 16 L14 8 L20 8 L20 16 L22 16'),
  'triangle-wave': svgIcon('M2 16 L6 8 L12 16 L18 8 L22 16'),
  'sawtooth-wave': svgIcon('M2 16 L10 8 L10 16 L18 8 L18 16 L22 12'),
  'sawtooth-cycle': svgIcon('M3 18 L20 6 L20 18'),
  'pulse-wave': svgIcon('M2 16 L2 8 L5 8 L5 16 L14 16 L14 8 L17 8 L17 16 L22 16'),
  'sample-hold': svgIcon('M2 14 L6 14 L6 9 L10 9 L10 16 L14 16 L14 11 L18 11 L18 14 L22 14'),
  'sample-glide': svgIcon('M2 14 L6 14 L8 9 L10 9 L12 16 L14 16 L16 11 L18 11 L20 14 L22 14'),
  'noise': svgIcon('M2 12 L4 9 L5 15 L7 7 L8 14 L10 10 L11 16 L13 8 L14 13 L16 11 L17 15 L19 9 L20 14 L22 12'),

  // ── DJ symbols (CDJ-3000, DDJ-FLX4, XDJ, DJS-1000) ──
  'cue': React.createElement('svg', {
    viewBox: '0 0 24 24', width: '100%', height: '100%', style: { display: 'block' },
  }, [
    React.createElement('circle', { key: 'c', cx: 12, cy: 12, r: 8, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }),
    React.createElement('path', { key: 'p', d: 'M12 4 A8 8 0 0 1 12 20', fill: 'currentColor', stroke: 'none' }),
  ]),
  'vinyl-mode': React.createElement('svg', {
    viewBox: '0 0 24 24', width: '100%', height: '100%', style: { display: 'block' },
  }, [
    React.createElement('circle', { key: 'o', cx: 12, cy: 12, r: 9, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
    React.createElement('circle', { key: 'm', cx: 12, cy: 12, r: 5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
    React.createElement('circle', { key: 'i', cx: 12, cy: 12, r: 1.5, fill: 'currentColor', stroke: 'none' }),
  ]),
  'loop-in': svgIcon('M5 12 A7 7 0 0 1 19 12 M19 12 L15 9 M19 12 L15 15'),
  'loop-out': svgIcon('M19 12 A7 7 0 0 1 5 12 M5 12 L9 9 M5 12 L9 15'),
  'beat-sync': React.createElement('svg', {
    viewBox: '0 0 24 24', width: '100%', height: '100%', style: { display: 'block' },
  }, [
    React.createElement('path', { key: 'a', d: 'M4 8 A8 8 0 0 1 20 8', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
    React.createElement('path', { key: 'b', d: 'M20 16 A8 8 0 0 1 4 16', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
    React.createElement('path', { key: 'c', d: 'M20 8 L17 5 M20 8 L17 11', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    React.createElement('path', { key: 'd', d: 'M4 16 L7 13 M4 16 L7 19', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
  ]),
  'slip': svgIcon('M2 12 C5 8, 7 16, 10 12 S15 8, 18 12 S21 16, 22 12'),
  'quantize': React.createElement('svg', {
    viewBox: '0 0 24 24', width: '100%', height: '100%', style: { display: 'block' },
  }, [
    React.createElement('rect', { key: 'r', x: 4, y: 4, width: 16, height: 16, rx: 2, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
    React.createElement('line', { key: 'h1', x1: 4, y1: 9.3, x2: 20, y2: 9.3, stroke: 'currentColor', strokeWidth: 1 }),
    React.createElement('line', { key: 'h2', x1: 4, y1: 14.7, x2: 20, y2: 14.7, stroke: 'currentColor', strokeWidth: 1 }),
    React.createElement('line', { key: 'v1', x1: 9.3, y1: 4, x2: 9.3, y2: 20, stroke: 'currentColor', strokeWidth: 1 }),
    React.createElement('line', { key: 'v2', x1: 14.7, y1: 4, x2: 14.7, y2: 20, stroke: 'currentColor', strokeWidth: 1 }),
  ]),
};

/** Check if an icon key has an SVG version */
export function hasIconSvg(key: string): boolean {
  return key in HARDWARE_ICON_SVGS;
}

/** Get all icon keys organized by category for picker UI */
export const ICON_CATEGORIES = [
  { label: 'Waveforms', keys: ['sine-wave', 'square-wave', 'triangle-wave', 'sawtooth-wave', 'sawtooth-cycle', 'pulse-wave', 'sample-hold', 'sample-glide', 'noise'] },
  { label: 'DJ', keys: ['cue', 'vinyl-mode', 'loop-in', 'loop-out', 'beat-sync', 'slip', 'quantize'] },
  { label: 'Transport', keys: ['play', 'pause', 'play-pause', 'stop', 'record', 'fast-forward', 'rewind', 'skip-forward', 'skip-backward', 'eject'] },
  { label: 'Arrows', keys: ['arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'triangle-up', 'triangle-down', 'triangle-left', 'triangle-right'] },
  { label: 'Other', keys: ['plus', 'minus', 'search-skip', 'loop-redo', 'sync-lock', 'settings-gear'] },
];
