import { StateCreator } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SnapGrid = 1 | 2 | 4 | 8 | 16 | 32;

/**
 * Pre-scale layout snapshot — the "original" positions captured the first
 * time scaleFromBase runs in a session. All subsequent scale ops compute
 * positions as base × cumulativeFactor with a SINGLE round per coordinate,
 * never compounding rounding errors across cycles.
 *
 * Cleared automatically by any non-scale layout edit (drag, resize, add,
 * delete, canvas resize). Next scaleFromBase captures fresh.
 *
 * Lives entirely in canvasSlice (transient editor state). Never written to
 * the manifest, never sent to the contractor's Blob, never reaches the
 * pipeline or production renderer. Reload → null.
 */
export interface ScaleBase {
  controls: Record<string, { x: number; y: number; w: number; h: number; labelFontSize?: number }>;
  sections: Record<string, { x: number; y: number; w: number; h: number }>;
  labels: Array<{ id: string; x: number; y: number; w?: number; fontSize: number }>;
  containers: Array<{ id: string; x: number; y: number; w: number; h: number; borderRadius?: number }>;
  guides: Array<{ id: string; position: number }>;
  canvasWidth: number;
  canvasHeight: number;
}

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
  /** When true, frameMode='hidden' sections render as a faint ghost
   *  frame in the editor (so contractor can reach + change them). When
   *  false, hidden sections are fully suppressed from the editor view
   *  too — use the Layers panel to re-select them. Defaults to true. */
  showHiddenSections: boolean;
  /** EP3b: when true, every control with `hasLed: true` renders as if
   *  `ledOn: true` so the contractor can visually verify all 5 LED
   *  styles (especially label-backlit and edge-glow whose ON-state glow
   *  is otherwise only visible during tutorials). Off by default.
   *  Session-only — not persisted to manifest. */
  testLedsActive: boolean;
  controlScale: number; // 0.3-1.0 — visual scale for controls in editor (positioning mode)
  photoMode: 'overlay' | 'side-by-side';
  photoOpacity: number;
  canvasWidth: number;
  canvasHeight: number;
  /**
   * Phase 10 — physical dimensions of the real hardware (mm). Originally
   * provided by the gatekeeper LLM (reads "Dimensions: 997mm × 300mm"
   * from the device manual). Persisted in the editor manifest so
   * `auto-fit controlScale` can compute a sensible default without
   * having to re-read the raw `manifest.json`.
   *
   * Optional — older instruments or those without dimensions in the
   * manual leave this undefined. Auto-fit becomes a no-op for them.
   */
  deviceDimensions: { widthMm: number; depthMm: number } | null;
  photoOffsetX: number;
  photoOffsetY: number;
  photoScale: number;
  cleanupGap: number;  // target gap in px for Clean Up (0 = auto/average)
  panelScale: number;  // 0.5-2.0 — scales entire generated panel proportionally
  previewMode: boolean;  // clean panel view — hides edit chrome

  /**
   * Transient: ID of the most recently created container.
   * ContainerNode reads this to render a brief "flash" animation on creation
   * so the contractor can see where the new container landed. Cleared after
   * ~2.5 seconds via setTimeout in `flashContainerCreated`.
   */
  recentlyCreatedContainerId: string | null;
  /**
   * Transient: ID of the most recently created standalone label. Same flash
   * pattern as recentlyCreatedContainerId — LabelLayer reads this and applies
   * a brief outline so the contractor can see where the new label landed.
   * Cleared after ~2.5 seconds via setTimeout in `flashLabelCreated`.
   */
  recentlyCreatedLabelId: string | null;
  showRulers: boolean;
  guides: { id: string; orientation: 'horizontal' | 'vertical'; position: number }[];

  /**
   * Layout-base memory for drift-free scaling. Set on first scaleFromBase
   * call in a session. Cleared by any position-mutating action via
   * `clearScaleBase`. See ScaleBase typedef for invariants.
   */
  scaleBase: ScaleBase | null;
  /** 1.0 = at base layout. 2.0 = scaled to 2× base. Tracks the factor of the current rendered state relative to scaleBase. */
  scaleCumulativeFactor: number;

  // Actions
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  setSnapGrid: (g: SnapGrid) => void;
  toggleGrid: () => void;
  toggleHiddenSections: () => void;
  toggleTestLeds: () => void;
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
  setPreviewMode: (on: boolean) => void;

  /** Mark a container as just-created → triggers flash animation. */
  flashContainerCreated: (containerId: string) => void;
  /** Mark a label as just-created → triggers flash animation in LabelLayer. */
  flashLabelCreated: (labelId: string) => void;

  /** Set the scale base snapshot directly (called by scaleFromBase). */
  setScaleBase: (base: ScaleBase | null) => void;
  /** Set the cumulative factor (called by scaleFromBase). */
  setScaleCumulativeFactor: (factor: number) => void;
  /**
   * Clear the scale base. Called by every position-mutating action so the
   * next scale captures a fresh base from the user's current layout.
   * No-op when base is already null (cheap to call unconditionally).
   */
  clearScaleBase: () => void;

  toggleRulers: () => void;
  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  moveGuide: (id: string, position: number) => void;
  deleteGuide: (id: string) => void;
  clearGuides: () => void;
}

// ─── Slice Creator ──────────────────────────────────────────────────────────

export const createCanvasSlice: StateCreator<
  CanvasSlice,
  [],
  [],
  CanvasSlice
> = (set, get) => ({
  // Default state
  zoom: 1,
  panX: 0,
  panY: 0,
  snapGrid: 4,
  showGrid: true,
  showHiddenSections: true,
  testLedsActive: false,
  showPhoto: false,
  showLayers: false, // Start collapsed for maximum canvas space
  showLabels: true, // Labels visible by default
  controlScale: 1.0, // Full size by default; contractor scales down for positioning
  photoMode: 'side-by-side' as const,
  photoOpacity: 0.3,
  canvasWidth: 1200,
  canvasHeight: 1650,
  deviceDimensions: null, // populated by loadFromManifest when present
  photoOffsetX: 0,
  photoOffsetY: 0,
  photoScale: 1,
  cleanupGap: 8,   // 8px default gap for Clean Up
  panelScale: 1.0, // 100% default panel scale
  previewMode: false,
  recentlyCreatedContainerId: null,
  recentlyCreatedLabelId: null,
  showRulers: false,
  guides: [],
  scaleBase: null,
  scaleCumulativeFactor: 1.0,

  // Actions
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(5, z)) }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  setSnapGrid: (g) => set({ snapGrid: g }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleHiddenSections: () => set((s) => ({ showHiddenSections: !s.showHiddenSections })),
  toggleTestLeds: () => set((s) => ({ testLedsActive: !s.testLedsActive })),
  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  setControlScale: (s) => set({ controlScale: Math.max(0.2, Math.min(2, s)) }),

  togglePhoto: () => set((s) => ({ showPhoto: !s.showPhoto })),

  setPhotoMode: (mode) => set({ photoMode: mode }),

  setPhotoOpacity: (o) => set({ photoOpacity: Math.max(0, Math.min(1, o)) }),

  setCanvasSize: (w, h) => set({ canvasWidth: Math.max(400, w), canvasHeight: Math.max(300, h) }),

  setPhotoOffset: (x, y) => set({ photoOffsetX: x, photoOffsetY: y }),

  setPhotoScale: (s) => set({ photoScale: Math.max(0.1, Math.min(5, s)) }),

  setCleanupGap: (gap) => set({ cleanupGap: Math.max(0, Math.min(32, gap)) }),

  setPanelScale: (s) => set({ panelScale: Math.max(0.5, Math.min(2, s)) }),

  setPreviewMode: (on) => set({ previewMode: on }),

  flashContainerCreated: (containerId) => {
    set({ recentlyCreatedContainerId: containerId });
    // Clear after the flash animation finishes (matches CSS duration in ContainerNode).
    setTimeout(() => {
      if (get().recentlyCreatedContainerId === containerId) {
        set({ recentlyCreatedContainerId: null });
      }
    }, 2500);
  },

  flashLabelCreated: (labelId) => {
    set({ recentlyCreatedLabelId: labelId });
    setTimeout(() => {
      if (get().recentlyCreatedLabelId === labelId) {
        set({ recentlyCreatedLabelId: null });
      }
    }, 2500);
  },

  setScaleBase: (base) => set({ scaleBase: base }),
  setScaleCumulativeFactor: (factor) => set({ scaleCumulativeFactor: factor }),
  clearScaleBase: () => {
    if (get().scaleBase !== null) {
      set({ scaleBase: null, scaleCumulativeFactor: 1.0 });
    }
  },

  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  addGuide: (orientation, position) => set((s) => ({
    guides: [...s.guides, { id: `guide-${Date.now()}`, orientation, position }],
  })),
  moveGuide: (id, position) => set((s) => ({
    guides: s.guides.map(g => g.id === id ? { ...g, position } : g),
  })),
  deleteGuide: (id) => set((s) => ({
    guides: s.guides.filter(g => g.id !== id),
  })),
  clearGuides: () => set({ guides: [] }),
});
