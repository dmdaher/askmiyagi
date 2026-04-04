import { StateCreator } from 'zustand';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';
import { computeLabelPosition } from '@/lib/label-position';
import type { EditorLabel, ControlGroup } from './historySlice';
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
  rotation?: number; // 0, 90, 180, 270 degrees
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
  editorLabels: EditorLabel[];
  controlGroups: ControlGroup[];
  selectedIds: string[];
  lockedIds: string[];
  keyboard: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number } | null;
  _manifestVersion: string | null;
  // hasUserEdited is set ONLY by UI event handlers (pointer/keyboard),
  // never by store mutations. Prevents programmatic state changes from triggering auto-save.
  hasUserEdited: boolean;
  focusedSectionId: string | null;
  hoveredGroupId: string | null;

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
  setAllLabelFontSize: (size: number | undefined) => void;
  resetAllSizes: () => void;
  scaleCanvas: (factor: number) => void;
  moveLabel: (labelId: string, dx: number, dy: number) => void;
  updateLabel: (labelId: string, updates: Partial<EditorLabel>) => void;
  deleteLabel: (labelId: string) => void;
  initLabelsFromControls: () => void;
  alignControls: (mode: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
  distributeControls: (axis: 'horizontal' | 'vertical') => void;
  distributeWithGap: (axis: 'horizontal' | 'vertical', gap: number) => void;
  alignColumns: () => void;
  alignRows: () => void;
  normalizeLabelSpacing: () => void;
  createGroup: (name: string) => void;
  ungroupControls: () => void;
  setHoveredGroup: (id: string | null) => void;
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

/**
 * Re-center and align labels linked to the given controls.
 * Pass 1: centers labels on their control's X axis (always).
 * Pass 2: IF controls form a horizontal row (similar Y values), snaps labels
 *         above them to the same Y and below them to the same Y.
 *         For vertical columns of controls, Y-snapping is SKIPPED — each
 *         label stays at its own offset from its control.
 */
function alignLinkedLabels(
  labels: EditorLabel[],
  oldControls: Record<string, ControlDef>,
  newControls: Record<string, ControlDef>,
  controlIds: string[],
  controlScale: number,
): EditorLabel[] {
  const idSet = new Set(controlIds);

  // Pass 1: move each label by the same delta as its control (preserves offset),
  // then re-center X on the control's new center (keeps labels visually centered).
  let result = labels.map((l) => {
    if (!l.controlId || !idSet.has(l.controlId)) return l;
    const oldCtrl = oldControls[l.controlId];
    const newCtrl = newControls[l.controlId];
    if (!oldCtrl || !newCtrl) return l;

    // Move label by same delta as control — preserves Y offset
    const dy = newCtrl.y - oldCtrl.y;
    const movedY = l.y + dy;

    // Re-center X on the control (keeps label centered horizontally)
    const ctrlVisW = newCtrl.w * controlScale;
    const ctrlCenterX = newCtrl.x + ctrlVisW / 2;
    const labelW = Math.max(ctrlVisW, 60);
    return {
      ...l,
      x: Math.round(ctrlCenterX - labelW / 2),
      y: movedY,
      w: Math.round(labelW),
      align: 'center' as const,
    };
  });

  // Pass 2: If controls form a horizontal row (all aligned on Y), snap labels
  // to shared Y rows (top and bottom). Skipped for vertical columns — each
  // label keeps its preserved offset from Pass 1.
  const affectedCtrls = controlIds.map((id) => newControls[id]).filter(Boolean);
  if (affectedCtrls.length < 2) return result;

  const ys = affectedCtrls.map((c) => c.y);
  const xs = affectedCtrls.map((c) => c.x);
  const ySpread = Math.max(...ys) - Math.min(...ys);
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const avgH = affectedCtrls.reduce((acc, c) => acc + c.h, 0) / affectedCtrls.length;

  const isHorizontalRow = ySpread < avgH / 2 && xSpread > ySpread;
  if (!isHorizontalRow) return result;

  // Snap labels to shared Y rows (above and below)
  const affected = result.filter((l) => l.controlId && idSet.has(l.controlId));
  const above: EditorLabel[] = [];
  const below: EditorLabel[] = [];
  for (const l of affected) {
    const ctrl = newControls[l.controlId!];
    if (!ctrl) continue;
    const ctrlVisH = ctrl.h * controlScale;
    const ctrlCenterY = ctrl.y + ctrlVisH / 2;
    if (l.y < ctrlCenterY) above.push(l);
    else below.push(l);
  }

  if (above.length >= 2) {
    const targetY = Math.min(...above.map((l) => l.y));
    const aboveIds = new Set(above.map((l) => l.id));
    result = result.map((l) => aboveIds.has(l.id) ? { ...l, y: targetY } : l);
  }
  if (below.length >= 2) {
    const targetY = Math.max(...below.map((l) => l.y));
    const belowIds = new Set(below.map((l) => l.id));
    result = result.map((l) => belowIds.has(l.id) ? { ...l, y: targetY } : l);
  }

  return result;
}

/**
 * Cluster controls into rows by Y position.
 * Two controls are in the same row if their Y centers are within `tolerance` px.
 * Returns rows sorted top-to-bottom.
 */
export function clusterControlsIntoRows(
  controls: ControlDef[],
  tolerance = 20,
): ControlDef[][] {
  return clusterByAxis(controls, 'y', tolerance);
}

/**
 * Cluster controls into columns by X position.
 * Two controls are in the same column if their X centers are within `tolerance` px.
 * Returns columns sorted left-to-right.
 */
export function clusterControlsIntoColumns(
  controls: ControlDef[],
  tolerance = 20,
): ControlDef[][] {
  return clusterByAxis(controls, 'x', tolerance);
}

function clusterByAxis(
  controls: ControlDef[],
  axis: 'x' | 'y',
  tolerance: number,
): ControlDef[][] {
  if (controls.length === 0) return [];
  const sizeKey = axis === 'y' ? 'h' : 'w';
  const perpAxis = axis === 'y' ? 'x' : 'y';
  const getCenter = (c: ControlDef) => c[axis] + c[sizeKey] / 2;
  const sorted = [...controls].sort((a, b) => getCenter(a) - getCenter(b));
  const clusters: ControlDef[][] = [];
  for (const c of sorted) {
    const center = getCenter(c);
    const targetCluster = clusters.find((cluster) => {
      const clusterCenter = cluster.reduce((acc, rc) => acc + getCenter(rc), 0) / cluster.length;
      return Math.abs(center - clusterCenter) <= tolerance;
    });
    if (targetCluster) {
      targetCluster.push(c);
    } else {
      clusters.push([c]);
    }
  }
  // Sort each cluster along the perpendicular axis
  clusters.forEach((cluster) => cluster.sort((a, b) => a[perpAxis] - b[perpAxis]));
  return clusters;
}

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
  editorLabels: [],
  controlGroups: [],
  selectedIds: [],
  lockedIds: [],
  keyboard: null,
  _manifestVersion: null,
  hasUserEdited: false,
  focusedSectionId: null,
  hoveredGroupId: null,

  // ── Actions ─────────────────────────────────────────────────────────────

  loadFromManifest: (manifest) => {
    const sections: Record<string, SectionDef> = {};
    const controls: Record<string, ControlDef> = {};

    // Compute actual canvas height from device dimensions BEFORE placing controls.
    // Without this, controls are placed in 1650px of vertical space even when the
    // device is a wide synth (e.g., Fantom-06: 997mm x 300mm → 1200 x 361px).
    let effectiveCanvasW = CANVAS_BASE_W;
    let effectiveCanvasH = CANVAS_BASE_H;
    if (manifest.deviceDimensions) {
      const { widthMm, depthMm } = manifest.deviceDimensions;
      if (widthMm > 0 && depthMm > 0) {
        effectiveCanvasW = CANVAS_BASE_W;
        effectiveCanvasH = Math.round(CANVAS_BASE_W / (widthMm / depthMm));
      }
    }

    // When keyboard exists, sections only occupy the top panel area
    let panelAreaH = effectiveCanvasH;
    const manifestAny = manifest as MasterManifest & { keyboard?: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number } };
    if (manifestAny.keyboard && manifestAny.keyboard.panelHeightPercent) {
      panelAreaH = Math.round(effectiveCanvasH * (manifestAny.keyboard.panelHeightPercent / 100));
    }

    // Build a lookup of manifest controls by ID
    const mcById = new Map<string, ManifestControl>();
    for (const mc of manifest.controls) {
      mcById.set(mc.id, mc);
    }

    for (const ms of manifest.sections) {
      // Convert panelBoundingBox % to pixel coordinates using actual canvas dimensions
      const bbox = ms.panelBoundingBox ?? { x: 0, y: 0, w: 20, h: 20 };
      const sectionX = (bbox.x / 100) * effectiveCanvasW;
      const sectionY = (bbox.y / 100) * panelAreaH;
      const sectionW = (bbox.w / 100) * effectiveCanvasW;
      const sectionH = (bbox.h / 100) * panelAreaH;

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
        // Anchor-layout may have many container keys (left-column, anchor, function-knobs, etc.)
        // Extract ALL control IDs from all container values (flat arrays or nested subzones)
        const allContainerIds: string[] = [];
        for (const value of Object.values(ms.containerAssignment)) {
          if (Array.isArray(value)) {
            allContainerIds.push(...value);
          } else if (value && typeof value === 'object') {
            // Recursively extract from nested subzones
            const extractIds = (obj: Record<string, unknown>): string[] => {
              const ids: string[] = [];
              for (const v of Object.values(obj)) {
                if (Array.isArray(v)) {
                  ids.push(...(v as string[]));
                } else if (v && typeof v === 'object' && 'controls' in (v as Record<string, unknown>)) {
                  ids.push(...((v as { controls: string[] }).controls));
                } else if (v && typeof v === 'object') {
                  ids.push(...extractIds(v as Record<string, unknown>));
                }
              }
              return ids;
            };
            allContainerIds.push(...extractIds(value as Record<string, unknown>));
          }
        }

        // Use all extracted IDs, or fall back to section controls list
        const idsToPlace = allContainerIds.length > 0 ? allContainerIds : ms.controls;

        // Place anchor (display) in top portion, everything else below in a grid
        const anchorIds = ms.containerAssignment.anchor;
        const nonAnchorIds = idsToPlace.filter(id => !Array.isArray(anchorIds) || !anchorIds.includes(id));
        const anchorH = availH * 0.4;
        const restH = availH * 0.55;

        if (Array.isArray(anchorIds)) {
          placeRow(anchorIds, startX, startY, availW, anchorH);
        }
        const cols = Math.ceil(Math.sqrt(nonAnchorIds.length));
        placeGrid(nonAnchorIds, startX, startY + anchorH + availH * 0.05, availW, restH, cols);

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
      keyboard: manifestAny.keyboard ?? null,
      _manifestVersion: computeManifestVersion(manifest),
      hasUserEdited: false,
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
      // Move linked labels with the control
      editorLabels: (s.editorLabels as EditorLabel[]).map(l =>
        l.controlId === id ? { ...l, x: l.x + dx, y: l.y + dy } : l
      ),
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
    const childSet = new Set(section.childIds);

    // Move section + all child controls
    for (const childId of section.childIds) {
      const child = controls[childId];
      if (child && !child.locked) {
        controls[childId] = { ...child, x: child.x + dx, y: child.y + dy };
      }
    }

    // Move linked labels for any child control that was moved
    const updatedLabels = (get().editorLabels as EditorLabel[]).map((l) =>
      l.controlId && childSet.has(l.controlId)
        ? { ...l, x: l.x + dx, y: l.y + dy }
        : l
    );

    set({
      sections: {
        ...get().sections,
        [id]: { ...section, x: section.x + dx, y: section.y + dy },
      },
      controls,
      editorLabels: updatedLabels,
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

    // Delete linked labels for deleted controls
    const updatedLabels = (get().editorLabels as EditorLabel[]).filter(
      l => !l.controlId || !deleteSet.has(l.controlId)
    );

    // Clean up groups — remove deleted IDs and dissolve groups under 2 members
    const updatedGroups = (get().controlGroups as ControlGroup[])
      .map(g => ({ ...g, controlIds: g.controlIds.filter(id => !deleteSet.has(id)) }))
      .filter(g => g.controlIds.length >= 2);

    set({
      controls: updatedControls,
      sections: updatedSections,
      selectedIds: [],
      lockedIds,
      editorLabels: updatedLabels,
      controlGroups: updatedGroups,
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

  setAllLabelFontSize: (size) => {
    set((s) => {
      const updated: Record<string, ControlDef> = {};
      for (const [id, ctrl] of Object.entries(s.controls)) {
        updated[id] = { ...ctrl, labelFontSize: size };
      }
      return { controls: updated };
    });
  },

  resetAllSizes: () => {
    set((s) => {
      const updated: Record<string, ControlDef> = {};
      for (const [id, ctrl] of Object.entries(s.controls)) {
        // Use sizeClass from pipeline when available, fall back to type defaults
        const sizeClassDef = ctrl.sizeClass ? SIZE_CLASS_DIMS[ctrl.sizeClass] : undefined;
        const def = sizeClassDef ?? DEFAULT_SIZES[ctrl.type] ?? { w: 48, h: 32 };
        updated[id] = { ...ctrl, w: def.w, h: def.h };
      }
      return { controls: updated };
    });
  },

  scaleCanvas: (factor) => {
    set((s) => {
      // Scale all control positions and sizes
      const updatedControls: Record<string, ControlDef> = {};
      for (const [id, ctrl] of Object.entries(s.controls)) {
        updatedControls[id] = {
          ...ctrl,
          x: Math.round(ctrl.x * factor),
          y: Math.round(ctrl.y * factor),
          w: Math.round(ctrl.w * factor),
          h: Math.round(ctrl.h * factor),
        };
      }

      // Scale all section positions and sizes
      const updatedSections: Record<string, SectionDef> = {};
      for (const [id, sec] of Object.entries(s.sections)) {
        updatedSections[id] = {
          ...sec,
          x: Math.round(sec.x * factor),
          y: Math.round(sec.y * factor),
          w: Math.round(sec.w * factor),
          h: Math.round(sec.h * factor),
        };
      }

      // Scale all label positions, widths, and font sizes
      const updatedLabels = (s.editorLabels as EditorLabel[]).map(l => ({
        ...l,
        x: Math.round(l.x * factor),
        y: Math.round(l.y * factor),
        w: l.w != null ? Math.round(l.w * factor) : l.w,
        fontSize: Math.max(Math.round(l.fontSize * factor), 4),
      }));

      return {
        controls: updatedControls,
        sections: updatedSections,
        editorLabels: updatedLabels,
        canvasWidth: Math.round(s.canvasWidth * factor),
        canvasHeight: Math.round(s.canvasHeight * factor),
      };
    });
  },

  moveLabel: (labelId, dx, dy) => {
    set((s) => ({
      editorLabels: (s.editorLabels as EditorLabel[]).map(l =>
        l.id === labelId ? { ...l, x: l.x + dx, y: l.y + dy } : l
      ),
    }));
  },

  updateLabel: (labelId, updates) => {
    set((s) => ({
      editorLabels: (s.editorLabels as EditorLabel[]).map(l =>
        l.id === labelId ? { ...l, ...updates } : l
      ),
    }));
  },

  deleteLabel: (labelId) => {
    set((s) => ({
      editorLabels: (s.editorLabels as EditorLabel[]).filter(l => l.id !== labelId),
    }));
  },

  alignControls: (mode) => {
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const movable = selectedIds.filter(id => controls[id] && !lockedSet.has(id));
    if (movable.length < 2) return;

    const ctrls = movable.map(id => controls[id]);

    let target: number;
    switch (mode) {
      case 'left':
        target = Math.min(...ctrls.map(c => c.x));
        break;
      case 'right':
        target = Math.max(...ctrls.map(c => c.x + c.w));
        break;
      case 'center-x': {
        const sum = ctrls.reduce((acc, c) => acc + (c.x + c.w / 2), 0);
        target = Math.round(sum / ctrls.length);
        break;
      }
      case 'top':
        target = Math.min(...ctrls.map(c => c.y));
        break;
      case 'bottom':
        target = Math.max(...ctrls.map(c => c.y + c.h));
        break;
      case 'center-y': {
        const sum = ctrls.reduce((acc, c) => acc + (c.y + c.h / 2), 0);
        target = Math.round(sum / ctrls.length);
        break;
      }
    }

    const updated = { ...controls };
    for (const id of movable) {
      const c = updated[id];
      switch (mode) {
        case 'left':
          updated[id] = { ...c, x: target };
          break;
        case 'right':
          updated[id] = { ...c, x: target - c.w };
          break;
        case 'center-x':
          updated[id] = { ...c, x: Math.round(target - c.w / 2) };
          break;
        case 'top':
          updated[id] = { ...c, y: target };
          break;
        case 'bottom':
          updated[id] = { ...c, y: target - c.h };
          break;
        case 'center-y':
          updated[id] = { ...c, y: Math.round(target - c.h / 2) };
          break;
      }
    }
    const controlScale = (get() as any).controlScale ?? 1;
    const updatedLabels = alignLinkedLabels(
      get().editorLabels as EditorLabel[], controls, updated, movable, controlScale,
    );
    set({ controls: updated, editorLabels: updatedLabels });
  },

  distributeControls: (axis) => {
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const movable = selectedIds.filter(id => controls[id] && !lockedSet.has(id));
    if (movable.length < 3) return;

    const isH = axis === 'horizontal';
    // Sort by position on the given axis
    const sorted = [...movable].sort((a, b) => {
      const ca = controls[a];
      const cb = controls[b];
      return isH ? ca.x - cb.x : ca.y - cb.y;
    });

    const first = controls[sorted[0]];
    const last = controls[sorted[sorted.length - 1]];

    // Total span from leading edge of first to trailing edge of last
    const totalSpan = isH
      ? (last.x + last.w) - first.x
      : (last.y + last.h) - first.y;

    // Sum of all control sizes along the axis
    const totalSize = sorted.reduce((acc, id) => {
      const c = controls[id];
      return acc + (isH ? c.w : c.h);
    }, 0);

    const gap = (totalSpan - totalSize) / (sorted.length - 1);
    const updated = { ...controls };

    let cursor = isH ? first.x : first.y;
    for (let i = 0; i < sorted.length; i++) {
      const id = sorted[i];
      const c = updated[id];
      if (i === 0) {
        // First anchor stays
        cursor += isH ? c.w + gap : c.h + gap;
        continue;
      }
      if (i === sorted.length - 1) {
        // Last anchor stays
        break;
      }
      if (isH) {
        updated[id] = { ...c, x: Math.round(cursor) };
      } else {
        updated[id] = { ...c, y: Math.round(cursor) };
      }
      cursor += (isH ? c.w : c.h) + gap;
    }
    const controlScale = (get() as any).controlScale ?? 1;
    const updatedLabels = alignLinkedLabels(
      get().editorLabels as EditorLabel[], controls, updated, sorted, controlScale,
    );
    set({ controls: updated, editorLabels: updatedLabels });
  },

  distributeWithGap: (axis, gap) => {
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const movable = selectedIds.filter(id => controls[id] && !lockedSet.has(id));
    if (movable.length < 2) return;

    const isH = axis === 'horizontal';
    const sorted = [...movable].sort((a, b) => {
      const ca = controls[a];
      const cb = controls[b];
      return isH ? ca.x - cb.x : ca.y - cb.y;
    });

    const updated = { ...controls };
    let cursor = isH ? controls[sorted[0]].x : controls[sorted[0]].y;

    for (let i = 0; i < sorted.length; i++) {
      const id = sorted[i];
      const c = updated[id];
      if (isH) {
        updated[id] = { ...c, x: Math.round(cursor) };
        cursor += c.w + gap;
      } else {
        updated[id] = { ...c, y: Math.round(cursor) };
        cursor += c.h + gap;
      }
    }

    const controlScale = (get() as any).controlScale ?? 1;
    const updatedLabels = alignLinkedLabels(
      get().editorLabels as EditorLabel[], controls, updated, sorted, controlScale,
    );
    set({ controls: updated, editorLabels: updatedLabels });
  },

  alignColumns: () => {
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const movable = selectedIds
      .map((id) => controls[id])
      .filter((c): c is ControlDef => !!c && !lockedSet.has(c.id));
    if (movable.length < 2) return;

    // Cluster selected controls into rows by Y position
    const rows = clusterControlsIntoRows(movable, 20);
    if (rows.length < 2) return; // Need at least 2 rows

    // Reference row = topmost row, using its center-X positions as columns
    const referenceRow = rows[0];
    const columnCenterXs = referenceRow.map((c) => c.x + c.w / 2);

    // For each other row, pair items by index (sorted left-to-right) and snap
    // each item's center-X to the matching column's center-X
    const updated = { ...controls };
    const movedIds: string[] = [];
    for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      const pairCount = Math.min(row.length, columnCenterXs.length);
      for (let i = 0; i < pairCount; i++) {
        const item = row[i];
        const targetCenterX = columnCenterXs[i];
        const newX = Math.round(targetCenterX - item.w / 2);
        updated[item.id] = { ...item, x: newX };
        movedIds.push(item.id);
      }
    }

    // Re-center linked labels on the moved controls
    const controlScale = (get() as any).controlScale ?? 1;
    const updatedLabels = alignLinkedLabels(
      get().editorLabels as EditorLabel[], controls, updated, movedIds, controlScale,
    );
    set({ controls: updated, editorLabels: updatedLabels });
  },

  alignRows: () => {
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const movable = selectedIds
      .map((id) => controls[id])
      .filter((c): c is ControlDef => !!c && !lockedSet.has(c.id));
    if (movable.length < 2) return;

    // Cluster into columns by X position
    const columns = clusterControlsIntoColumns(movable, 20);
    if (columns.length < 2) return; // Need at least 2 columns

    // Reference column = leftmost, using its center-Y positions as rows
    const referenceCol = columns[0];
    const rowCenterYs = referenceCol.map((c) => c.y + c.h / 2);

    // For each other column, pair items by index (sorted top-to-bottom) and snap
    // each item's center-Y to the matching row's center-Y
    const updated = { ...controls };
    const movedIds: string[] = [];
    for (let colIdx = 1; colIdx < columns.length; colIdx++) {
      const col = columns[colIdx];
      const pairCount = Math.min(col.length, rowCenterYs.length);
      for (let i = 0; i < pairCount; i++) {
        const item = col[i];
        const targetCenterY = rowCenterYs[i];
        const newY = Math.round(targetCenterY - item.h / 2);
        updated[item.id] = { ...item, y: newY };
        movedIds.push(item.id);
      }
    }

    const controlScale = (get() as any).controlScale ?? 1;
    const updatedLabels = alignLinkedLabels(
      get().editorLabels as EditorLabel[], controls, updated, movedIds, controlScale,
    );
    set({ controls: updated, editorLabels: updatedLabels });
  },

  normalizeLabelSpacing: () => {
    const { selectedIds, controls, editorLabels } = get();
    const labels = editorLabels as EditorLabel[];
    const controlScale = (get() as any).controlScale ?? 1;
    const selectedSet = new Set(selectedIds);

    // Find all linked labels whose controls are in the selection
    const linkedLabels = labels.filter(
      (l) => l.controlId && selectedSet.has(l.controlId) && controls[l.controlId],
    );
    if (linkedLabels.length < 2) return;

    // For each label, compute: position (above/below), line count, and current distance.
    // Line height estimate: fontSize * 1.2 per line (standard text line-height).
    type LabelInfo = {
      id: string;
      position: 'above' | 'below';
      lineCount: number;
      distance: number;
      control: ControlDef;
      label: EditorLabel;
    };
    const infos: LabelInfo[] = [];
    for (const l of linkedLabels) {
      const ctrl = controls[l.controlId!];
      const ctrlVisH = ctrl.h * controlScale;
      const ctrlTop = ctrl.y;
      const ctrlBottom = ctrl.y + ctrlVisH;
      const ctrlCenterY = ctrl.y + ctrlVisH / 2;

      const lineCount = l.text.split('\n').length;
      const labelHeight = l.fontSize * lineCount * 1.2;
      const labelTop = l.y;
      const labelBottom = l.y + labelHeight;

      // Determine position by comparing label center to control center
      const labelCenterY = l.y + labelHeight / 2;
      const isAbove = labelCenterY < ctrlCenterY;
      const distance = isAbove
        ? ctrlTop - labelBottom  // gap from label's bottom to control's top
        : labelTop - ctrlBottom; // gap from label's top to control's bottom
      infos.push({
        id: l.id,
        position: isAbove ? 'above' : 'below',
        lineCount,
        distance,
        control: ctrl,
        label: l,
      });
    }

    // Group by (position, lineCount) — each group gets the tightest distance
    const groupKey = (i: LabelInfo) => `${i.position}-${i.lineCount}`;
    const groups = new Map<string, LabelInfo[]>();
    for (const info of infos) {
      const key = groupKey(info);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(info);
    }

    // For each group with 2+ labels, find min distance and snap all to it
    const updatedLabels: Record<string, EditorLabel> = {};
    for (const [, group] of groups) {
      if (group.length < 2) continue;
      const targetDistance = Math.min(...group.map((i) => i.distance));
      for (const info of group) {
        const labelHeight = info.label.fontSize * info.lineCount * 1.2;
        const newY = info.position === 'above'
          ? info.control.y - targetDistance - labelHeight
          : info.control.y + info.control.h * controlScale + targetDistance;
        updatedLabels[info.id] = { ...info.label, y: Math.round(newY) };
      }
    }

    if (Object.keys(updatedLabels).length === 0) return;
    set({
      editorLabels: labels.map((l) => updatedLabels[l.id] ?? l),
    });
  },

  createGroup: (name) => {
    const { selectedIds, controlGroups } = get();
    if (selectedIds.length < 2) return;

    const selectedSet = new Set(selectedIds);

    // Remove selected controls from any existing groups
    let updated = (controlGroups as ControlGroup[]).map(g => ({
      ...g,
      controlIds: g.controlIds.filter(id => !selectedSet.has(id)),
    }));

    // Dissolve groups that dropped below 2 members
    updated = updated.filter(g => g.controlIds.length >= 2);

    // Create new group
    const newGroup: ControlGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      controlIds: [...selectedIds],
    };

    set({ controlGroups: [...updated, newGroup] });
  },

  ungroupControls: () => {
    const { selectedIds, controlGroups } = get();
    const selectedSet = new Set(selectedIds);

    // Remove any group that contains any selected control
    const updated = (controlGroups as ControlGroup[]).filter(
      g => !g.controlIds.some(id => selectedSet.has(id))
    );

    set({ controlGroups: updated });
  },

  setHoveredGroup: (id) => set({ hoveredGroupId: id }),

  initLabelsFromControls: () => {
    const { controls, editorLabels } = get();
    const controlScale = (get() as any).controlScale ?? 1;
    // Only initialize if no labels exist yet (migration)
    if ((editorLabels as EditorLabel[]).length > 0) return;

    // computeLabelPosition imported at top of file
    const labels: EditorLabel[] = [];

    for (const ctrl of Object.values(controls)) {
      const pos = ctrl.labelPosition;
      if (pos === 'on-button' || pos === 'hidden') continue;
      if (!ctrl.label) continue;

      const visW = ctrl.w * controlScale;
      const visH = ctrl.h * controlScale;
      const fontSize = ctrl.labelFontSize
        ?? (ctrl.sizeClass === 'xl' ? 11 : ctrl.sizeClass === 'lg' ? 10 : ctrl.sizeClass === 'sm' ? 7 : 8);

      const lp = computeLabelPosition(
        ctrl.x, ctrl.y, visW, visH,
        pos, ctrl.label, fontSize, ctrl.secondaryLabel,
      );
      if (!lp) continue;

      labels.push({
        id: `label-${ctrl.id}`,
        controlId: ctrl.id,
        text: ctrl.label,
        x: lp.x,
        y: lp.y,
        fontSize: lp.fontSize,
        align: lp.align,
      });
    }

    set({ editorLabels: labels });
  },
});
