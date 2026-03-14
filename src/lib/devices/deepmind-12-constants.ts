// Behringer DeepMind 12 — panel constants
// Derived from the official manual (822 × 103 mm physical dimensions, 49 keys)

export const DM_PANEL_WIDTH = 2200;
export const DM_PANEL_HEIGHT = 580;
export const DM_CONTROL_SURFACE_HEIGHT = 340;
export const DM_KEYBOARD_HEIGHT = 210;
export const DM_VOICES_HEIGHT = 22;
export const DM_PERF_WIDTH = 110;

// 49 keys: C2 to C6
export const DM_KEY_COUNT = 49;
export const DM_LOWEST_NOTE = 36; // C2
export const DM_HIGHEST_NOTE = 84; // C6

// Color palette — matches DeepMind 12 hardware aesthetic
export const DM_COLORS = {
  panelBg: '#0a0a0a',
  sectionBg: '#111111',
  sectionBorder: '#1e1e1e',
  sectionShadow: 'rgba(0,0,0,0.6)',
  headerBg: '#1a1a1a',
  headerText: '#e0e0e0',
  labelText: '#999999',
  ledOrange: '#ff8800',
  ledGreen: '#00cc44',
  ledRed: '#ff2222',
  ledOff: '#1a1a1a',
  displayBg: '#001a0d',
  displayText: '#00ddaa',
  displayBorder: '#003322',
  brandText: '#888888',
  subtitleText: '#555555',
  voicesLabelText: '#666666',
  wheelBg: '#1a1a1a',
  wheelThumb: '#444444',
} as const;

// Section flex ratios — derived from hardware front panel proportions
// These are relative values used with flex-grow
export const SECTION_FLEX = {
  arp: 8,
  lfo1: 6.5,
  lfo2: 6.5,
  osc: 14,
  prog: 22,
  poly: 4,
  vcf: 13,
  vca: 3.5,
  hpf: 3.5,
  env: 12,
} as const;

// Slider dimensions
export const SLIDER_TRACK_HEIGHT = 150;
export const SLIDER_TRACK_HEIGHT_ENV = 170;
export const SLIDER_TRACK_HEIGHT_PERF = 100;
export const SLIDER_TRACK_WIDTH = 14;

// LFO waveform types
export const LFO_WAVEFORMS = [
  { id: 'sine', path: 'M0,8 Q4,0 8,8 Q12,16 16,8' },
  { id: 'triangle', path: 'M0,16 L4,0 L8,16 L12,0 L16,16' },
  { id: 'sawtooth', path: 'M0,16 L8,0 L8,16 L16,0' },
  { id: 'square', path: 'M0,16 L0,0 L8,0 L8,16 L16,16 L16,0' },
  { id: 'sah', path: 'M0,12 L4,12 L4,4 L8,4 L8,14 L12,14 L12,2 L16,2' },
  { id: 'random', path: 'M0,10 Q2,4 4,8 Q6,14 8,6 Q10,2 12,10 Q14,16 16,4' },
] as const;

// Envelope curve shapes (exponential, linear, reverse)
export const ENV_CURVES = [
  { id: 'exp', label: 'EXP', path: 'M0,16 Q16,14 16,0' },
  { id: 'lin', label: 'LIN', path: 'M0,16 L16,0' },
  { id: 'rev', label: 'REV', path: 'M0,16 Q0,2 16,0' },
] as const;
