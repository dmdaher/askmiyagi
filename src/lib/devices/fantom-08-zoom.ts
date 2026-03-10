import { fantom08Layout } from '@/data/panelLayouts/fantom-08';
import { PANEL_NATURAL_WIDTH, PANEL_NATURAL_HEIGHT } from './fantom-08-constants';
import type { DeviceZoomConfig } from '@/lib/panelZoom';

/**
 * Section regions as percentage coordinates (0-100) within the Fantom-08 panel.
 * Each entry maps a panel section ID to its approximate center position.
 */
const sectionRegions: Record<string, { x: number; y: number }> = {
  controller:      { x: 3,  y: 50 },
  zone:            { x: 22, y: 50 },
  display:         { x: 42, y: 40 },
  scene:           { x: 42, y: 40 },
  common:          { x: 55, y: 50 },
  'synth-mode':    { x: 72, y: 30 },
  sequencer:       { x: 72, y: 70 },
  pad:             { x: 88, y: 30 },
  'tone-category': { x: 80, y: 85 },
  keyboard:        { x: 50, y: 95 },
};

/** Build a map of controlId → sectionId from the panel layout */
const controlSectionMap: Record<string, string> = {};
for (const section of fantom08Layout.sections) {
  for (const control of section.controls) {
    controlSectionMap[control.id] = section.id;
  }
}

export const fantom08ZoomConfig: DeviceZoomConfig = {
  sectionRegions,
  controlSectionMap,
  panelWidth: PANEL_NATURAL_WIDTH,
  panelHeight: PANEL_NATURAL_HEIGHT,
};
