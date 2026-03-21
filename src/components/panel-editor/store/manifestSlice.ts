import { StateCreator } from 'zustand';
import type {
  ManifestControl,
  ManifestSection,
  MasterManifest,
  SubZone,
  AlignmentAnchor,
  DensityTargets,
  GroupLabel,
  ButtonShape,
  SizeClass,
  ButtonStyle,
  LabelDisplay,
  LEDBehavior,
  LEDPosition,
  LEDVariant,
  InteractionType,
} from '@/types/manifest';

// Re-export MasterManifest as MasterManifestInput for backward compatibility
export type MasterManifestInput = MasterManifest;

// ─── Constants ──────────────────────────────────────────────────────────────

/** Canvas base size for converting manifest % to px coordinates.
 *  Bounding boxes in the manifest are 0-100% normalized.
 *  These values define the pixel space and the panel's aspect ratio. */
export const CANVAS_BASE_W = 1200;
export const CANVAS_BASE_H = 1650;

/** Default pixel dimensions per control type */
const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  button:  { w: 64,  h: 40  },
  knob:    { w: 64,  h: 64  },
  slider:  { w: 40,  h: 160 },
  fader:   { w: 40,  h: 160 },
  led:     { w: 24,  h: 24  },
  wheel:   { w: 160, h: 160 },
  pad:     { w: 64,  h: 64  },
  encoder: { w: 64,  h: 64  },
  lever:   { w: 32,  h: 64  },
  switch:  { w: 32,  h: 64  },
  screen:  { w: 200, h: 120 },
  port:    { w: 48,  h: 32  },
  slot:    { w: 64,  h: 16  },
};

/** sizeClass → pixel dimension overrides */
const SIZE_CLASS_DIMS: Record<string, { w: number; h: number }> = {
  xs: { w: 24, h: 24 },
  sm: { w: 48, h: 36 },
  md: { w: 64, h: 48 },
  lg: { w: 96, h: 72 },
  xl: { w: 160, h: 120 },
};

/** Weight multiplier for proportional space allocation */
const SIZE_CLASS_WEIGHT: Record<string, number> = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2.5,
  xl: 4,
};

// ─── Editor data model (flat maps) ──────────────────────────────────────────

export interface ControlDef {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sectionId: string;
  labelPosition: 'above' | 'below' | 'left' | 'right' | 'on-button' | 'hidden';
  locked: boolean;
  secondaryLabel?: string;
  spatialNeighbors?: {
    above: string | null;
    below: string | null;
    left: string | null;
    right: string | null;
  };
  functionalGroup?: string;
  containerAssignment?: Record<string, unknown>;
  heightSplits?: Record<string, number>;
  gridCols?: number;
  gridRows?: number;
  widthPercent?: number;
  complexity?: string;

  // Visual Appearance (enriched fields)
  shape?: ButtonShape;
  sizeClass?: SizeClass;
  surfaceColor?: string | null;
  buttonStyle?: ButtonStyle;

  // Label Rendering (enriched fields)
  labelDisplay?: LabelDisplay;
  icon?: string | null;
  primaryLabel?: string;

  // LED Properties (enriched fields)
  hasLed?: boolean;
  ledColor?: string | null;
  ledBehavior?: LEDBehavior;
  ledPosition?: LEDPosition;
  ledVariant?: LEDVariant;

  // Interaction Model (enriched fields)
  interactionType?: InteractionType;
  secondaryFunction?: string | null;
  positions?: number;
  positionLabels?: string[];
  encoderHasPush?: boolean;
  orientation?: 'vertical' | 'horizontal';

  // Relationships (enriched fields)
  pairedWith?: string | null;
  sharedLabel?: string | null;
  groupId?: string | null;
  nestedIn?: string | null;
  labelFontSize?: number;  // px, defaults based on sizeClass
}

export interface SectionDef {
  id: string;
  headerLabel: string | null;
  archetype: string;
  x: number;
  y: number;
  w: number;
  h: number;
  childIds: string[];
  containerAssignment?: Record<string, unknown>;
  heightSplits?: Record<string, number>;
  gridCols?: number;
  gridRows?: number;
  widthPercent?: number;
  complexity?: string;
}

// ─── Slice interface ────────────────────────────────────────────────────────

export interface ManifestSlice {
  // State
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  layoutType: string;
  densityTargets?: DensityTargets;
  sharedElements: unknown[];
  alignmentAnchors: AlignmentAnchor[];
  groupLabels: GroupLabel[];
  sections: Record<string, SectionDef>;
  controls: Record<string, ControlDef>;
  selectedIds: string[];
  lockedIds: string[];
  focusedSectionId: string | null;

  // Actions
  loadFromManifest: (manifest: MasterManifestInput) => void;
  moveControl: (id: string, dx: number, dy: number) => void;
  resizeControl: (id: string, w: number, h: number) => void;
  moveSection: (id: string, dx: number, dy: number) => void;
  resizeSection: (id: string, w: number, h: number) => void;
  moveSelectedControls: (dx: number, dy: number) => void;
  updateControlProp: (ids: string[], field: string, value: unknown) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  toggleLock: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  setFocusedSection: (id: string | null) => void;
  addControl: (sectionId: string, type: string, label: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function defaultLabelPosition(type: string): ControlDef['labelPosition'] {
  if (type === 'pad') return 'on-button';
  if (type === 'button') return 'above';
  if (type === 'led') return 'right';
  return 'below';
}

/** Map manifest LabelDisplay to editor labelPosition.
 *  'icon-only' maps to 'hidden' since the label rendering is handled
 *  via the separate labelDisplay field in ControlDef. */
function mapLabelDisplay(ld?: LabelDisplay): ControlDef['labelPosition'] | undefined {
  if (!ld) return undefined;
  if (ld === 'icon-only') return 'hidden';
  return ld;
}

function defaultSize(type: string, sizeClass?: SizeClass): { w: number; h: number } {
  if (sizeClass && SIZE_CLASS_DIMS[sizeClass]) {
    return SIZE_CLASS_DIMS[sizeClass];
  }
  return DEFAULT_SIZES[type] ?? { w: 48, h: 32 };
}

let addCounter = 0;

// ─── Combined state shape for cross-slice access ──────────────────────────
// The manifest slice needs to write canvasWidth/canvasHeight from the canvas
// slice when deviceDimensions are present.

interface CanvasFields {
  canvasWidth: number;
  canvasHeight: number;
}

// ─── Slice Creator ──────────────────────────────────────────────────────────

export const createManifestSlice: StateCreator<
  ManifestSlice & CanvasFields,
  [],
  [],
  ManifestSlice
> = (set, get) => ({
  // Default state
  deviceId: '',
  deviceName: '',
  manufacturer: '',
  layoutType: '',
  densityTargets: undefined,
  sharedElements: [],
  alignmentAnchors: [],
  groupLabels: [],
  sections: {},
  controls: {},
  selectedIds: [],
  lockedIds: [],
  focusedSectionId: null,

  // ── Actions ─────────────────────────────────────────────────────────────

  loadFromManifest: (manifest) => {
    const sections: Record<string, SectionDef> = {};
    const controls: Record<string, ControlDef> = {};

    // Build a lookup of manifest controls by ID
    const mcById = new Map<string, ManifestControl>();
    for (const mc of manifest.controls) {
      mcById.set(mc.id, mc);
    }

    for (const ms of manifest.sections) {
      // Convert panelBoundingBox % to pixel coordinates
      const bbox = ms.panelBoundingBox ?? { x: 0, y: 0, w: 20, h: 20 };
      const sectionX = (bbox.x / 100) * CANVAS_BASE_W;
      const sectionY = (bbox.y / 100) * CANVAS_BASE_H;
      const sectionW = (bbox.w / 100) * CANVAS_BASE_W;
      const sectionH = (bbox.h / 100) * CANVAS_BASE_H;

      sections[ms.id] = {
        id: ms.id,
        headerLabel: ms.headerLabel,
        archetype: ms.archetype,
        x: sectionX,
        y: sectionY,
        w: sectionW,
        h: sectionH,
        childIds: [...ms.controls],
        containerAssignment: ms.containerAssignment as Record<string, unknown> | undefined,
        heightSplits: ms.heightSplits as Record<string, number> | undefined,
        gridCols: ms.gridCols,
        gridRows: ms.gridRows,
        widthPercent: ms.widthPercent,
        complexity: ms.complexity,
      };

      // ── Archetype-aware control placement ──────────────────────────────
      const padding = 8;
      const headerOffset = ms.headerLabel ? 16 : 0;
      const MIN_CONTROL_H = 28;
      const MIN_CONTROL_W = 28;

      // Calculate minimum section height needed to fit controls
      const controlCount = ms.controls.length;
      const archetype = ms.archetype;
      let neededRows = 1;
      if (archetype === 'single-column') {
        neededRows = controlCount;
      } else if (archetype === 'single-row') {
        neededRows = 1;
      } else if (archetype.startsWith('grid') || archetype === 'dual-column') {
        const cols = archetype === 'dual-column' ? 2 : (ms.gridCols ?? 2);
        neededRows = Math.ceil(controlCount / cols);
      } else if (archetype === 'stacked-rows' && ms.containerAssignment) {
        neededRows = Object.keys(ms.containerAssignment).length;
      } else {
        neededRows = Math.ceil(Math.sqrt(controlCount));
      }
      const minNeededH = neededRows * (MIN_CONTROL_H + 4) + padding * 2 + headerOffset;
      // Expand section if too small
      if (sectionH < minNeededH) {
        sections[ms.id].h = minNeededH;
      }
      const finalSectionH = Math.max(sectionH, minNeededH);

      const availW = sections[ms.id].w - padding * 2;
      const availH = finalSectionH - padding * 2 - headerOffset;
      const startX = sectionX + padding;
      const startY = sectionY + padding + headerOffset;

      const placeControl = (
        controlId: string,
        cx: number,
        cy: number,
        maxW?: number,
        maxH?: number,
      ) => {
        const mc = mcById.get(controlId);
        if (!mc) return;
        const size = defaultSize(mc.type, mc.sizeClass);
        // Scale controls to fill their cell: use the larger of default size or 80% of cell
        // This prevents tiny controls in large sections (e.g., 160px jog wheel in 660px section)
        const targetW = maxW ? Math.max(size.w, (maxW - 4) * 0.8) : size.w;
        const targetH = maxH ? Math.max(size.h, (maxH - 4) * 0.8) : size.h;
        // But don't exceed the cell
        const fitW = Math.max(MIN_CONTROL_W, maxW ? Math.min(targetW, maxW - 4) : targetW);
        const fitH = Math.max(MIN_CONTROL_H, maxH ? Math.min(targetH, maxH - 4) : targetH);
        controls[controlId] = {
          id: controlId,
          label: mc.verbatimLabel,
          type: mc.type,
          x: cx,
          y: cy,
          w: fitW,
          h: fitH,
          sectionId: ms.id,
          labelPosition: mapLabelDisplay(mc.labelDisplay) ?? defaultLabelPosition(mc.type),
          locked: false,
          spatialNeighbors: mc.spatialNeighbors,
          functionalGroup: mc.functionalGroup,

          // Enriched fields — visual appearance
          shape: mc.shape,
          sizeClass: mc.sizeClass,
          surfaceColor: mc.surfaceColor,
          buttonStyle: mc.buttonStyle,

          // Enriched fields — label rendering
          labelDisplay: mc.labelDisplay,
          icon: mc.icon,
          primaryLabel: mc.primaryLabel,
          secondaryLabel: mc.secondaryLabel ?? undefined,

          // Enriched fields — LED properties
          hasLed: mc.hasLed,
          ledColor: mc.ledColor,
          ledBehavior: mc.ledBehavior,
          ledPosition: mc.ledPosition,
          ledVariant: mc.ledVariant,

          // Enriched fields — interaction model
          interactionType: mc.interactionType,
          secondaryFunction: mc.secondaryFunction,
          positions: mc.positions,
          positionLabels: mc.positionLabels,
          encoderHasPush: mc.encoderHasPush,
          orientation: mc.orientation,

          // Enriched fields — relationships
          pairedWith: mc.pairedWith,
          sharedLabel: mc.sharedLabel,
          groupId: mc.groupId,
          nestedIn: mc.nestedIn,
        };
      };

      const placeRow = (ids: string[], rowX: number, rowY: number, rowW: number, rowH: number) => {
        // Allocate width proportionally by sizeClass weight
        const weights = ids.map(id => {
          const mc = mcById.get(id);
          return SIZE_CLASS_WEIGHT[mc?.sizeClass ?? 'md'] ?? 1.5;
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let currentX = rowX;
        ids.forEach((id, i) => {
          const cellW = (weights[i] / totalWeight) * rowW;
          placeControl(id, currentX, rowY, cellW, rowH);
          currentX += cellW;
        });
      };

      const placeColumn = (ids: string[], colX: number, colY: number, colW: number, colH: number) => {
        // Allocate height proportionally by sizeClass weight
        const weights = ids.map(id => {
          const mc = mcById.get(id);
          return SIZE_CLASS_WEIGHT[mc?.sizeClass ?? 'md'] ?? 1.5;
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let currentY = colY;
        ids.forEach((id, i) => {
          const cellH = (weights[i] / totalWeight) * colH;
          placeControl(id, colX, currentY, colW, cellH);
          currentY += cellH;
        });
      };

      const placeGrid = (ids: string[], gx: number, gy: number, gw: number, gh: number, cols: number, explicitRows?: number) => {
        const rows = explicitRows ?? Math.ceil(ids.length / cols);
        const cellW = gw / cols;
        const cellH = gh / rows;
        ids.forEach((id, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          placeControl(id, gx + col * cellW, gy + row * cellH, cellW, cellH);
        });
      };


      if (archetype === 'single-row') {
        // All controls in one horizontal row
        placeRow(ms.controls, startX, startY, availW, availH);

      } else if (archetype === 'single-column') {
        // All controls stacked vertically
        placeColumn(ms.controls, startX, startY, availW, availH);

      } else if (archetype.startsWith('grid') || archetype === 'dual-column') {
        // grid-NxM or dual-column
        const cols = archetype === 'dual-column' ? 2 : (ms.gridCols ?? 2);
        placeGrid(ms.controls, startX, startY, availW, availH, cols, ms.gridRows);

      } else if (archetype === 'stacked-rows' && ms.containerAssignment) {
        // Each container row is a horizontal flex row, stacked vertically
        const rowEntries = Object.entries(ms.containerAssignment).sort(([a], [b]) => a.localeCompare(b));
        const rowCount = rowEntries.length;
        const rowH = availH / rowCount;
        rowEntries.forEach(([, ids], rowIdx) => {
          let rowIds: string[];
          if (Array.isArray(ids)) {
            rowIds = ids;
          } else if (ids && typeof ids === 'object') {
            // Nested sub-zone object — extract controls
            const nested = ids as Record<string, SubZone>;
            rowIds = [];
            Object.values(nested).forEach((sz) => {
              if (Array.isArray(sz)) {
                rowIds.push(...sz);
              } else if (sz && typeof sz === 'object' && 'controls' in sz) {
                rowIds.push(...(sz as { controls: string[] }).controls);
              }
            });
          } else {
            rowIds = [];
          }
          placeRow(rowIds, startX, startY + rowIdx * rowH, availW, rowH);
        });

      } else if (
        (archetype === 'cluster-above-anchor' || archetype === 'cluster-below-anchor') &&
        ms.containerAssignment
      ) {
        const splits = ms.heightSplits ?? { cluster: 0.5, anchor: 0.45, gap: 0.05 };
        const cols = ms.gridCols ?? 2;
        const clusterH = availH * splits.cluster;
        const anchorH = availH * splits.anchor;
        const gapH = availH * (splits.gap ?? 0.05);

        const clusterIds = ms.containerAssignment.cluster;
        const anchorValue = ms.containerAssignment.anchor;

        // Place anchor controls — handle nested sub-zones as side-by-side columns
        const placeAnchor = (ax: number, ay: number, aw: number, ah: number) => {
          if (Array.isArray(anchorValue)) {
            placeRow(anchorValue, ax, ay, aw, ah);
          } else if (anchorValue && typeof anchorValue === 'object') {
            // Nested sub-zones (e.g. { slider: [...], reset: [...] })
            // Place each sub-zone in its own column, side by side
            const subZoneEntries = Object.entries(anchorValue);
            const colW = aw / subZoneEntries.length;
            subZoneEntries.forEach(([, sz], colIdx) => {
              let ids: string[];
              let direction: 'row' | 'column' = 'column';
              if (Array.isArray(sz)) {
                ids = sz;
              } else if (sz && typeof sz === 'object' && 'controls' in sz) {
                const typed = sz as { controls: string[]; direction?: 'row' | 'column' };
                ids = typed.controls;
                direction = typed.direction ?? 'column';
              } else {
                return;
              }
              const colX = ax + colIdx * colW;
              if (direction === 'row') {
                placeRow(ids, colX, ay, colW, ah);
              } else {
                placeColumn(ids, colX, ay, colW, ah);
              }
            });
          }
        };

        if (archetype === 'cluster-above-anchor') {
          // Cluster on top, anchor on bottom
          if (Array.isArray(clusterIds)) {
            placeGrid(clusterIds, startX, startY, availW, clusterH, cols, ms.gridRows);
          }
          placeAnchor(startX, startY + clusterH + gapH, availW, anchorH);
        } else {
          // Anchor on top, cluster on bottom
          placeAnchor(startX, startY, availW, anchorH);
          if (Array.isArray(clusterIds)) {
            placeGrid(clusterIds, startX, startY + anchorH + gapH, availW, clusterH, cols, ms.gridRows);
          }
        }

      } else if (archetype === 'anchor-layout' && ms.containerAssignment) {
        // Secondary controls then anchor
        const anchorIds = ms.containerAssignment.anchor;
        const secondaryIds = ms.containerAssignment.secondary ?? ms.containerAssignment.cluster;
        const secondaryH = availH * 0.4;
        const anchorH = availH * 0.55;
        if (Array.isArray(secondaryIds)) {
          placeRow(secondaryIds, startX, startY, availW, secondaryH);
        }
        if (Array.isArray(anchorIds)) {
          placeColumn(anchorIds, startX, startY + secondaryH + availH * 0.05, availW, anchorH);
        }

      } else {
        // Fallback: generic grid (for any unrecognized archetype)
        const fallbackCols = Math.ceil(Math.sqrt(ms.controls.length));
        placeGrid(ms.controls, startX, startY, availW, availH, fallbackCols);
      }
    }

    // Compute canvas size from device dimensions if available
    const canvasSizeUpdate: Record<string, number> = {};
    if (manifest.deviceDimensions) {
      const { widthMm, depthMm } = manifest.deviceDimensions;
      if (widthMm > 0 && depthMm > 0) {
        const aspect = widthMm / depthMm;
        canvasSizeUpdate.canvasWidth = CANVAS_BASE_W;
        canvasSizeUpdate.canvasHeight = Math.round(CANVAS_BASE_W / aspect);
      }
    }

    // ── Auto-shrink sections to tightly wrap their controls ───────────
    const sectionPadding = 8;
    for (const [sId, sec] of Object.entries(sections)) {
      const childControls = sec.childIds
        .map(cid => controls[cid])
        .filter(Boolean);
      if (childControls.length === 0) continue;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const c of childControls) {
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.x + c.w > maxX) maxX = c.x + c.w;
        if (c.y + c.h > maxY) maxY = c.y + c.h;
      }

      // Shrink section to fit controls with padding
      const headerH = sec.headerLabel ? 16 : 0;
      sections[sId] = {
        ...sec,
        x: minX - sectionPadding,
        y: minY - sectionPadding - headerH,
        w: (maxX - minX) + sectionPadding * 2,
        h: (maxY - minY) + sectionPadding * 2 + headerH,
      };
    }

    set({
      deviceId: manifest.deviceId,
      deviceName: manifest.deviceName,
      manufacturer: manifest.manufacturer,
      layoutType: manifest.layoutType,
      densityTargets: manifest.densityTargets,
      sharedElements: manifest.sharedElements ?? [],
      alignmentAnchors: manifest.alignmentAnchors ?? [],
      groupLabels: manifest.groupLabels ?? [],
      sections,
      controls,
      selectedIds: [],
      lockedIds: [],
      focusedSectionId: null,
      ...canvasSizeUpdate,
    });
  },

  moveControl: (id, dx, dy) => {
    const ctrl = get().controls[id];
    if (!ctrl || ctrl.locked) return;
    set((s) => ({
      controls: {
        ...s.controls,
        [id]: { ...ctrl, x: ctrl.x + dx, y: ctrl.y + dy },
      },
    }));
  },

  resizeControl: (id, w, h) => {
    const ctrl = get().controls[id];
    if (!ctrl || ctrl.locked) return;
    set((s) => ({
      controls: {
        ...s.controls,
        [id]: { ...ctrl, w: Math.max(8, w), h: Math.max(8, h) },
      },
    }));
  },

  moveSection: (id, dx, dy) => {
    const section = get().sections[id];
    if (!section) return;
    const controls = { ...get().controls };

    // Move section + all child controls
    for (const childId of section.childIds) {
      const child = controls[childId];
      if (child && !child.locked) {
        controls[childId] = { ...child, x: child.x + dx, y: child.y + dy };
      }
    }

    set({
      sections: {
        ...get().sections,
        [id]: { ...section, x: section.x + dx, y: section.y + dy },
      },
      controls,
    });
  },

  resizeSection: (id, w, h) => {
    const section = get().sections[id];
    if (!section) return;
    set((s) => ({
      sections: {
        ...s.sections,
        [id]: { ...section, w: Math.max(24, w), h: Math.max(24, h) },
      },
    }));
  },

  moveSelectedControls: (dx, dy) => {
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const updated = { ...controls };
    let changed = false;

    for (const id of selectedIds) {
      if (lockedSet.has(id)) continue;
      const ctrl = updated[id];
      if (ctrl) {
        updated[id] = { ...ctrl, x: ctrl.x + dx, y: ctrl.y + dy };
        changed = true;
      }
    }

    if (changed) {
      set({ controls: updated });
    }
  },

  updateControlProp: (ids, field, value) => {
    const controls = { ...get().controls };
    for (const id of ids) {
      const ctrl = controls[id];
      if (ctrl) {
        controls[id] = { ...ctrl, [field]: value };
      }
    }
    set({ controls });
  },

  duplicateSelected: () => {
    const { selectedIds, controls, sections } = get();
    if (selectedIds.length === 0) return;

    const updatedControls = { ...controls };
    const updatedSections = { ...sections };
    const newIds: string[] = [];

    for (const id of selectedIds) {
      const original = controls[id];
      if (!original) continue;

      const copyId = `${id}-copy`;
      const copy: ControlDef = {
        ...original,
        id: copyId,
        x: original.x + 16,
        y: original.y + 16,
        locked: false,
      };
      updatedControls[copyId] = copy;
      newIds.push(copyId);

      // Add to parent section's childIds
      const section = updatedSections[original.sectionId];
      if (section) {
        updatedSections[original.sectionId] = {
          ...section,
          childIds: [...section.childIds, copyId],
        };
      }
    }

    set({
      controls: updatedControls,
      sections: updatedSections,
      selectedIds: newIds,
    });
  },

  deleteSelected: () => {
    const { selectedIds, controls, sections } = get();
    if (selectedIds.length === 0) return;

    const deleteSet = new Set(selectedIds);
    const updatedControls = { ...controls };
    const updatedSections = { ...sections };

    for (const id of selectedIds) {
      const ctrl = updatedControls[id];
      if (!ctrl) continue;

      // Remove from parent section's childIds
      const section = updatedSections[ctrl.sectionId];
      if (section) {
        updatedSections[ctrl.sectionId] = {
          ...section,
          childIds: section.childIds.filter((cid) => !deleteSet.has(cid)),
        };
      }

      delete updatedControls[id];
    }

    // Also remove from lockedIds
    const lockedIds = get().lockedIds.filter((lid) => !deleteSet.has(lid));

    set({
      controls: updatedControls,
      sections: updatedSections,
      selectedIds: [],
      lockedIds,
    });
  },

  toggleLock: (id) => {
    const { lockedIds, controls } = get();
    const isLocked = lockedIds.includes(id);
    const ctrl = controls[id];
    if (!ctrl) return;

    set({
      lockedIds: isLocked
        ? lockedIds.filter((lid) => lid !== id)
        : [...lockedIds, id],
      controls: {
        ...controls,
        [id]: { ...ctrl, locked: !isLocked },
      },
    });
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelected: (id) => {
    const { selectedIds } = get();
    const idx = selectedIds.indexOf(id);
    if (idx >= 0) {
      set({ selectedIds: selectedIds.filter((sid) => sid !== id) });
    } else {
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  setFocusedSection: (id) => set({ focusedSectionId: id }),

  addControl: (sectionId, type, label) => {
    const section = get().sections[sectionId];
    if (!section) return;

    addCounter++;
    const id = `${sectionId}-new-${addCounter}`;
    const size = defaultSize(type);

    const newControl: ControlDef = {
      id,
      label,
      type,
      x: section.x + section.w / 2 - size.w / 2,
      y: section.y + section.h / 2 - size.h / 2,
      w: size.w,
      h: size.h,
      sectionId,
      labelPosition: defaultLabelPosition(type),
      locked: false,
    };

    set((s) => ({
      controls: { ...s.controls, [id]: newControl },
      sections: {
        ...s.sections,
        [sectionId]: {
          ...section,
          childIds: [...section.childIds, id],
        },
      },
    }));
  },
});
