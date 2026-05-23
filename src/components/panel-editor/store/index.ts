'use client';

import { create } from 'zustand';
import { createCanvasSlice, type CanvasSlice } from './canvasSlice';
import { createManifestSlice, type ManifestSlice } from './manifestSlice';
import { createHistorySlice, type HistorySlice } from './historySlice';

// ─── Composed Store ─────────────────────────────────────────────────────────

export type EditorStore = CanvasSlice & ManifestSlice & HistorySlice;

export const useEditorStore = create<EditorStore>()((...a) => ({
  ...createCanvasSlice(...a),
  ...createManifestSlice(...a),
  ...createHistorySlice(...a),
}));

// Expose store on window in dev/test only — used by Playwright regression
// scripts (e.g., e2e/regression-layers-panel-many-labels.ts) to inject
// fixtures and inspect state. Stripped from production builds.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { useEditorStore: typeof useEditorStore }).useEditorStore = useEditorStore;
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export type { CanvasSlice, SnapGrid } from './canvasSlice';
export type {
  ManifestSlice,
  ControlDef,
  SectionDef,
  ControlContainer,
  MasterManifestInput,
} from './manifestSlice';
export { CANVAS_BASE_W, CANVAS_BASE_H } from './manifestSlice';
export type { HistorySlice, ManifestSnapshot, EditorLabel } from './historySlice';

// Shared manifest types (canonical source of truth)
export type {
  ManifestControl,
  ManifestSection,
  MasterManifest,
  ControlType,
  LayoutArchetype,
  SubZone,
  AlignmentAnchor,
  DensityTargets,
  ButtonShape,
  SizeClass,
  ButtonStyle,
  LabelDisplay,
  LEDBehavior,
  LEDPosition,
  LEDVariant,
  InteractionType,
  DeviceDimensions,
  GroupLabel,
} from '@/types/manifest';
