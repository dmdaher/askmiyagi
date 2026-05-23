// Fantom-08 specific constants — keyboard range, zone colors, display colors, panel dimensions

export const FANTOM_KEY_COUNT = 88;
export const FANTOM_LOWEST_NOTE = 21; // A0
export const FANTOM_HIGHEST_NOTE = 108; // C8

export const ZONE_COLORS = {
  zone1: '#3B82F6', // blue
  zone2: '#EF4444', // red
  zone3: '#10B981', // green
  zone4: '#F59E0B', // amber
  zone5: '#8B5CF6', // purple
  zone6: '#EC4899', // pink
  zone7: '#06B6D4', // cyan
  zone8: '#F97316', // orange
} as const;

export const DISPLAY_COLORS = {
  background: '#1a1a2e',
  text: '#e0e0e0',
  highlight: '#00ff88',
  warning: '#ffaa00',
  active: '#00aaff',
  zoneActive: '#00ff88',
  zoneMuted: '#666666',
  mute: '#ff4444',
  header: '#4488cc',
  border: '#333355',
  backgroundDark: '#111122',
} as const;

export const ZONE_COLOR_MAP: Record<number, string> = {
  1: ZONE_COLORS.zone1,
  2: ZONE_COLORS.zone2,
  3: ZONE_COLORS.zone3,
  4: ZONE_COLORS.zone4,
  5: ZONE_COLORS.zone5,
  6: ZONE_COLORS.zone6,
  7: ZONE_COLORS.zone7,
  8: ZONE_COLORS.zone8,
};

// Panel design dimensions (px) — the "native" size of the Fantom 08 panel
export const PANEL_NATURAL_WIDTH = 2700;
export const PANEL_NATURAL_HEIGHT = 580;
