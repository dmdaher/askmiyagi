export const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Device panel dimensions — single source of truth for all devices
export const PANEL_DIMENSIONS: Record<string, { width: number; height: number }> = {
  'fantom-08': { width: 2700, height: 580 },
  // New devices add their entry here
};

// Re-export Fantom-08 specific constants for backwards compatibility
export {
  FANTOM_KEY_COUNT,
  FANTOM_LOWEST_NOTE,
  FANTOM_HIGHEST_NOTE,
  ZONE_COLORS,
  DISPLAY_COLORS,
  ZONE_COLOR_MAP,
} from './devices/fantom-08-constants';

export const PANEL_COLORS = {
  background: '#1a1a1a',
  surface: '#2a2a2a',
  buttonFace: '#3a3a3a',
  buttonActive: '#5a5a5a',
  text: '#cccccc',
  ledOff: '#333333',
  ledOn: '#00ff44',
  ledRed: '#ff2222',
  ledOrange: '#ff8800',
  highlight: '#00aaff',
  knobMetal: '#888888',
  sliderTrack: '#222222',
  sliderThumb: '#666666',
} as const;

export const TUTORIAL_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'basics', label: 'Basics', icon: '📘' },
  { id: 'zones-splits', label: 'Zones & Splits', icon: '🎹' },
  { id: 'sound-design', label: 'Sound Design', icon: '🎛️' },
  { id: 'effects', label: 'Effects', icon: '✨' },
  { id: 'midi', label: 'MIDI', icon: '🔌' },
  { id: 'performance', label: 'Performance', icon: '🎤' },
  { id: 'sequencer', label: 'Sequencer', icon: '🎵' },
  { id: 'sampling', label: 'Sampling', icon: '🎙️' },
  { id: 'mixing', label: 'Mixing', icon: '🎚️' },
  { id: 'performance-pads', label: 'Performance Pads', icon: '🥁' },
  { id: 'looping', label: 'Looping', icon: '🔁' },
  { id: 'advanced', label: 'Advanced', icon: '⚡' },
  { id: 'synthesis', label: 'Synthesis', icon: '🔊' },
  { id: 'modulation', label: 'Modulation', icon: '〰️' },
  { id: 'presets', label: 'Presets', icon: '💾' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  basics: 'Basics',
  'zones-splits': 'Zones & Splits',
  'sound-design': 'Sound Design',
  effects: 'Effects',
  midi: 'MIDI',
  performance: 'Performance',
  sequencer: 'Sequencer',
  sampling: 'Sampling',
  mixing: 'Mixing',
  'performance-pads': 'Performance Pads',
  looping: 'Looping',
  advanced: 'Advanced',
  synthesis: 'Synthesis',
  modulation: 'Modulation',
  presets: 'Presets',
};

export const CATEGORY_PROGRESSION = [
  'basics',
  'zones-splits',
  'sound-design',
  'effects',
  'performance',
  'sequencer',
  'sampling',
  'midi',
  'mixing',
  'performance-pads',
  'looping',
  'advanced',
  'synthesis',
  'modulation',
  'presets',
] as const;

export const DIFFICULTY_COLORS: Record<string, { dot: string }> = {
  beginner: { dot: '#10B981' },
  intermediate: { dot: '#F59E0B' },
  advanced: { dot: '#EF4444' },
};

