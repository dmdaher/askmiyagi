import { StateCreator } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SnapGrid = 4 | 8 | 16 | 32;

export interface CanvasSlice {
  // State
  zoom: number;
  panX: number;
  panY: number;
  snapGrid: SnapGrid;
  showGrid: boolean;
  showPhoto: boolean;
  photoOpacity: number;
  canvasWidth: number;
  canvasHeight: number;
  photoOffsetX: number;
  photoOffsetY: number;
  photoScale: number;

  // Actions
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  setSnapGrid: (g: SnapGrid) => void;
  toggleGrid: () => void;
  togglePhoto: () => void;
  setPhotoOpacity: (o: number) => void;
  setCanvasSize: (w: number, h: number) => void;
  setPhotoOffset: (x: number, y: number) => void;
  setPhotoScale: (s: number) => void;
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
  snapGrid: 8,
  showGrid: true,
  showPhoto: false,
  photoOpacity: 0.3,
  canvasWidth: 1200,
  canvasHeight: 1650,
  photoOffsetX: 0,
  photoOffsetY: 0,
  photoScale: 1,

  // Actions
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(5, z)) }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  setSnapGrid: (g) => set({ snapGrid: g }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  togglePhoto: () => set((s) => ({ showPhoto: !s.showPhoto })),

  setPhotoOpacity: (o) => set({ photoOpacity: Math.max(0, Math.min(1, o)) }),

  setCanvasSize: (w, h) => set({ canvasWidth: Math.max(400, w), canvasHeight: Math.max(300, h) }),

  setPhotoOffset: (x, y) => set({ photoOffsetX: x, photoOffsetY: y }),

  setPhotoScale: (s) => set({ photoScale: Math.max(0.1, Math.min(5, s)) }),
});
