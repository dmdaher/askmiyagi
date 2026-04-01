import { StateCreator } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SnapGrid = 1 | 2 | 4 | 8 | 16 | 32;

export interface CanvasSlice {
  // State
  zoom: number;
  panX: number;
  panY: number;
  snapGrid: SnapGrid;
  showGrid: boolean;
  showPhoto: boolean;
  showLayers: boolean;
  showLabels: boolean;
  controlScale: number; // 0.3-1.0 — visual scale for controls in editor (positioning mode)
  photoMode: 'overlay' | 'side-by-side';
  photoOpacity: number;
  canvasWidth: number;
  canvasHeight: number;
  photoOffsetX: number;
  photoOffsetY: number;
  photoScale: number;
  cleanupGap: number;  // target gap in px for Clean Up (0 = auto/average)
  panelScale: number;  // 0.5-2.0 — scales entire generated panel proportionally

  // Actions
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  setSnapGrid: (g: SnapGrid) => void;
  toggleGrid: () => void;
  togglePhoto: () => void;
  toggleLayers: () => void;
  toggleLabels: () => void;
  setControlScale: (s: number) => void;
  setPhotoMode: (mode: 'overlay' | 'side-by-side') => void;
  setPhotoOpacity: (o: number) => void;
  setCanvasSize: (w: number, h: number) => void;
  setPhotoOffset: (x: number, y: number) => void;
  setPhotoScale: (s: number) => void;
  setCleanupGap: (gap: number) => void;
  setPanelScale: (s: number) => void;
}

// ─── Slice Creator ──────────────────────────────────────────────────────────

export const createCanvasSlice: StateCreator<
  CanvasSlice,
  [],
  [],
  CanvasSlice
> = (set) => ({
  // Default state
  zoom: 1,
  panX: 0,
  panY: 0,
  snapGrid: 4,
  showGrid: true,
  showPhoto: false,
  showLayers: false, // Start collapsed for maximum canvas space
  showLabels: true, // Labels visible by default
  controlScale: 1.0, // Full size by default; contractor scales down for positioning
  photoMode: 'side-by-side' as const,
  photoOpacity: 0.3,
  canvasWidth: 1200,
  canvasHeight: 1650,
  photoOffsetX: 0,
  photoOffsetY: 0,
  photoScale: 1,
  cleanupGap: 8,   // 8px default gap for Clean Up
  panelScale: 1.0, // 100% default panel scale

  // Actions
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(5, z)) }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  setSnapGrid: (g) => set({ snapGrid: g }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  setControlScale: (s) => set({ controlScale: Math.max(0.3, Math.min(1, s)) }),

  togglePhoto: () => set((s) => ({ showPhoto: !s.showPhoto })),

  setPhotoMode: (mode) => set({ photoMode: mode }),

  setPhotoOpacity: (o) => set({ photoOpacity: Math.max(0, Math.min(1, o)) }),

  setCanvasSize: (w, h) => set({ canvasWidth: Math.max(400, w), canvasHeight: Math.max(300, h) }),

  setPhotoOffset: (x, y) => set({ photoOffsetX: x, photoOffsetY: y }),

  setPhotoScale: (s) => set({ photoScale: Math.max(0.1, Math.min(5, s)) }),

  setCleanupGap: (gap) => set({ cleanupGap: Math.max(0, Math.min(32, gap)) }),

  setPanelScale: (s) => set({ panelScale: Math.max(0.5, Math.min(2, s)) }),
});
