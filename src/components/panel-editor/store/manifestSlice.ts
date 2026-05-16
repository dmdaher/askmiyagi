import { StateCreator } from 'zustand';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';
import { computeLabelPosition } from '@/lib/label-position';
import type { EditorLabel, ControlGroup, PolishBanner } from './historySlice';
import type { SelectableId } from './selection-types';
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
  resizeLocked?: boolean; // Size locked — can move but can't resize
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
  ledOn?: boolean;       // default state: true = lit at rest, false/undefined = off (dim)
  ledBehavior?: LEDBehavior;
  ledPosition?: LEDPosition;
  ledVariant?: LEDVariant;
  ledStyle?: 'integrated' | 'dot';  // integrated = button face glows, dot = separate LED dot above

  // Interaction Model (enriched fields)
  interactionType?: InteractionType;
  secondaryFunction?: string | null;
  positions?: number;
  positionLabels?: string[];
  encoderHasPush?: boolean;
  orientation?: 'vertical' | 'horizontal';

  // Z-ordering (editor-only)
  zOrder?: number;  // Persistent z-order — higher values render on top

  // Relationships (enriched fields)
  pairedWith?: string | null;
  sharedLabel?: string | null;
  groupId?: string | null;
  nestedIn?: string | null;
  labelFontSize?: number;  // px, defaults based on sizeClass
  labelAlign?: string;     // on-button position: 'center' | 'top-left' | ... | 'bottom-right'
  labelColor?: string;     // hex color for on-button text
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
  hidden?: boolean; // Legacy — use frameMode instead
  frameMode?: SectionFrameMode;
  /**
   * Show the dark banner strip behind the title text (only relevant when
   * frameMode is 'full' or 'header-only'). When false, title text shows
   * without the polished darker background — useful when the contractor
   * wants a cleaner look or the section background already provides
   * enough visual grouping.
   * Defaults to `true` (current behavior). Per-section color
   * customization of the banner is queued under the themes/skins plan
   * (docs/plans/2026-04-27-themes-skins-design.md).
   */
  showTitleBanner?: boolean;
}

/**
 * How a section's chrome renders:
 *   - 'full'         — frame box + header strip with title
 *   - 'header-only'  — title floating above an invisible box
 *   - 'body-only'    — frame box visible, header strip hidden (no title)
 *   - 'hidden'       — entire section chrome invisible (controls still render)
 *
 * Backward-compatible: existing manifests use 'full' | 'header-only' | 'hidden';
 * 'body-only' is additive and falls back to 'full' rendering if a legacy
 * consumer doesn't recognize it.
 */
export type SectionFrameMode = 'full' | 'header-only' | 'body-only' | 'hidden';

export type ContainerStyle = 'recessed' | 'raised' | 'outlined' | 'filled';

export interface ControlContainer {
  id: string;
  controlIds: string[];
  style: ContainerStyle;
  x: number;
  y: number;
  w: number;
  h: number;
  borderRadius?: number;
  label?: string;
}


/** Backwards-compatible frame mode reader */
export function getFrameMode(section: SectionDef): SectionFrameMode {
  if (section.frameMode) return section.frameMode;
  if (section.hidden) return 'hidden';
  return 'full';
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
  controlContainers: ControlContainer[];
  polishBanners: PolishBanner[];
  selectedBannerId: string | null;
  selectedIds: string[];
  lockedIds: string[];
  keyboard: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number; aspectLockMode?: 'auto' | 'manual' } | null;
  _manifestVersion: string | null;
  // Timestamp from the server when this manifest was last saved. Used for conflict detection.
  _loadedAt: string | null;
  // hasUserEdited is set ONLY by UI event handlers (pointer/keyboard),
  // never by store mutations. Prevents programmatic state changes from triggering auto-save.
  hasUserEdited: boolean;
  focusedSectionId: string | null;
  hoveredGroupId: string | null;
  selectedLabelId: string | null;

  /**
   * Unified Figma-style selection. Prefixed-ID array (e.g. `'control:cutoff'`,
   * `'label:lbl-12'`). MS1: additive — coexists with selectedIds/selectedLabelId
   * etc., not yet read by any consumer. Subsequent commits wire it into
   * DragSelectRect, click handlers, and keyboard shortcuts.
   *
   * See `selection-types.ts` for helpers (formatSelectableId,
   * parseSelectableId, selectionOfType, etc.).
   */
  selection: SelectableId[];

  // Actions
  loadFromManifest: (manifest: MasterManifestInput) => void;
  moveControl: (id: string, dx: number, dy: number) => void;
  resizeControl: (id: string, w: number, h: number) => void;
  moveSection: (id: string, dx: number, dy: number) => void;
  resizeSection: (id: string, w: number, h: number) => void;
  setSectionPosition: (id: string, x: number, y: number) => void;
  setSectionLabel: (id: string, label: string | null) => void;
  updateSection: (id: string, updates: Partial<SectionDef>) => void;
  moveSelectedControls: (dx: number, dy: number) => void;
  updateControlProp: (ids: string[], field: string, value: unknown) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  toggleLock: (id: string) => void;
  setLockMode: (ids: string[], mode: 'unlocked' | 'size-locked' | 'fully-locked') => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  /**
   * Replace the unified selection set. Phase 2 wires this to also sync
   * legacy fields (selectedLabelId, selectedBannerId) so existing
   * consumers don't break.
   */
  setSelection: (selection: SelectableId[]) => void;
  /**
   * Add entries to the unified selection (idempotent: duplicates ignored).
   * Use for shift-click semantics. Syncs legacy fields automatically.
   */
  addToSelection: (ids: SelectableId[]) => void;
  /**
   * Remove entries from the unified selection (no-op if not present).
   * Use for shift-click on already-selected items.
   */
  removeFromSelection: (ids: SelectableId[]) => void;
  /**
   * Toggle a single entry in the unified selection. Convenience for the
   * common shift-click case.
   */
  toggleSelection: (id: SelectableId) => void;
  /** Clear the unified selection (and all legacy slots in sync). */
  clearSelection: () => void;

  /**
   * Move every entity in the unified `selection` by the same (dx, dy).
   * Entity-agnostic: dispatches to the appropriate per-type mover
   * (`moveControl`, `moveLabel`, `moveSection`, `movePolishBanner`)
   * based on each entry's type prefix. Used by:
   *   - Rnd drag on a selected control when multiple entities are
   *     selected (drags all of them in lockstep)
   *   - LabelLayer drag handler when multiple labels are selected
   *   - Arrow-key nudge in useEditorKeyboard
   *
   * Sections and containers participate too. Locked controls are
   * skipped by their own movers (moveControl returns early on locked).
   */
  moveSelection: (dx: number, dy: number) => void;

  /**
   * Delete every entity in the unified `selection`. Cross-type:
   * controls go through `deleteSelected` (which handles cross-
   * reference cleanup — section.childIds, controlGroups, linked
   * labels), labels go through `deleteLabel`, banners through
   * `deletePolishBanner`. Sections are NOT deleted by this path —
   * section deletion has more complex child-handling and stays on
   * its own explicit action. Clears `selection` after.
   */
  deleteSelection: () => void;
  setFocusedSection: (id: string | null) => void;
  addControl: (sectionId: string, type: string, label: string) => void;
  setAllLabelFontSize: (size: number | undefined) => void;
  resetAllSizes: () => void;
  scaleCanvas: (factor: number) => void;
  /**
   * Drift-free scaling. `absoluteFactor` is relative to the captured base
   * layout (1.0 = at base, 0.5 = half base, 2.0 = double base). On first
   * call, captures current state as base. All entity positions/sizes are
   * computed via `base × absoluteFactor` with a single round per coord —
   * never compounding rounding errors across cycles.
   *
   * Scope: controls, sections, editorLabels, controlContainers, guides,
   * canvasWidth/canvasHeight. Keyboard auto-follows via percent-based
   * fields. Group labels and alignment anchors have no positional fields.
   */
  scaleFromBase: (absoluteFactor: number) => void;
  setCanvasSize: (w: number, h: number) => void;
  moveLabel: (labelId: string, dx: number, dy: number) => void;
  updateLabel: (labelId: string, updates: Partial<EditorLabel>) => void;
  deleteLabel: (labelId: string) => void;
  addStandaloneLabel: (x: number, y: number, text?: string) => string;
  // Polish banner actions
  addPolishBanner: () => string;
  updatePolishBanner: (id: string, updates: Partial<PolishBanner>) => void;
  deletePolishBanner: (id: string) => void;
  movePolishBanner: (id: string, dx: number, dy: number) => void;
  resizePolishBanner: (id: string, x: number, y: number, w: number, h: number) => void;
  setSelectedBanner: (id: string | null) => void;
  /**
   * For a standalone label (controlId === null), set sectionId by computing
   * findNearestSection from the label's center. Returns true if a section
   * was found, false if the label is a linked label OR sits outside every
   * section. Caller is responsible for pushSnapshot before invoking.
   */
  assignLabelToNearestSection: (labelId: string) => boolean;
  initLabelsFromControls: () => void;
  setLabelPosition: (ids: string[], position: ControlDef['labelPosition']) => void;
  alignControls: (mode: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
  distributeControls: (axis: 'horizontal' | 'vertical') => void;
  distributeWithGap: (axis: 'horizontal' | 'vertical', gap: number) => void;
  alignColumns: () => void;
  alignRows: () => void;
  normalizeLabelSpacing: () => void;
  createGroup: (name: string) => void;
  ungroupControls: () => void;
  setHoveredGroup: (id: string | null) => void;
  /**
   * Select a label.
   *
   * Default (additive=false): mutually exclusive with control/banner
   * selection — clears `selectedIds` and `selectedBannerId`.
   *
   * additive=true: preserves existing `selectedIds` so a contractor can
   * shift-click a label after selecting controls (Figma-style cross-type
   * multi-select). Symmetric with `toggleSelected` on controls, which
   * already preserves `selectedLabelId`.
   *
   * Passing `null` always just clears the label selection (no additive
   * variant needed — clearing IS the safe default).
   */
  setSelectedLabel: (id: string | null, opts?: { additive?: boolean }) => void;
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  addContainer: (x: number, y: number, w: number, h: number, controlIds?: string[]) => string;
  updateContainer: (id: string, updates: Partial<ControlContainer>) => void;
  deleteContainer: (id: string) => void;
  moveContainer: (id: string, dx: number, dy: number) => void;
  resizeContainer: (id: string, w: number, h: number) => void;

  /**
   * Atomically reassign a control to a different section (or to no section).
   * Updates `controls[id].sectionId`, removes id from old `section.childIds`,
   * adds id to new `section.childIds` — all in one store mutation.
   *
   * This is the CANONICAL way to mutate the section ↔ control link. Any
   * future code that needs to change a control's sectionId must use this
   * action; touching one side without the other risks mutual disagreement
   * (the post-editor validator catches dangling pointers but not mutual
   * disagreement when both targets exist but disagree).
   *
   * `newSectionId === null` or '' detaches the control from any section.
   * No-ops if controlId doesn't exist. No-ops if newSectionId is non-empty
   * but doesn't exist (caller should validate; we don't write inconsistent
   * state). Idempotent: calling with the current sectionId leaves state
   * byte-identical.
   */
  setControlSection: (controlId: string, newSectionId: string | null) => void;
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
 * Find the section whose bounding box contains the given canvas point.
 * Returns the section id, or undefined if the point falls outside every section.
 *
 * Used to assign a sectionId to standalone labels at creation and after drag.
 * For overlapping sections (rare), returns the first match (insertion order).
 */
function findNearestSection(
  x: number,
  y: number,
  sections: Record<string, SectionDef>,
): string | undefined {
  for (const id in sections) {
    const s = sections[id];
    if (!s) continue;
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
      return id;
    }
  }
  return undefined;
}

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
    const movedY = Math.round(l.y + dy);

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
// slice when deviceDimensions are present, and access scale-base helpers
// for drift-free scaling.

import type { ScaleBase } from './canvasSlice';

interface CanvasFields {
  canvasWidth: number;
  canvasHeight: number;
  guides: { id: string; orientation: 'horizontal' | 'vertical'; position: number }[];
  scaleBase: ScaleBase | null;
  scaleCumulativeFactor: number;
  /** Snap-grid (1|2|4|8|16|32). Exposed to manifestSlice so moveLabel /
   *  moveControl can snap label positions to the grid — see Phase 8 fix
   *  for the linked-label drift bug at snapGrid=1. Source-of-truth in
   *  canvasSlice; this is the read-only surface via the composed store. */
  snapGrid: number;
  setScaleBase: (base: ScaleBase | null) => void;
  setScaleCumulativeFactor: (factor: number) => void;
  clearScaleBase: () => void;
  /** Snapshot the current manifest state into undo history. Lives in
   *  historySlice; exposed here so cross-slice actions (Phase 4
   *  moveSelection, deleteSelection) can batch one snapshot before
   *  multi-entity mutations. */
  pushSnapshot: () => void;
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
  controlContainers: [],
  polishBanners: [],
  selectedBannerId: null,
  selectedIds: [],
  lockedIds: [],
  keyboard: null,
  _manifestVersion: null,
  _loadedAt: null,
  hasUserEdited: false,
  focusedSectionId: null,
  hoveredGroupId: null,
  selectedLabelId: null,
  selection: [],

  // ── Actions ─────────────────────────────────────────────────────────────

  loadFromManifest: (manifest) => {
    get().clearScaleBase();
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
    const manifestAny = manifest as MasterManifest & { keyboard?: { keys: number; startNote: string; panelHeightPercent: number; leftPercent?: number; widthPercent?: number; aspectLockMode?: 'auto' | 'manual' } };
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
      // Defensive restore of editor-only extras when present in payload
      // (e.g., when a saved/restored editor state lands on this code path).
      // For raw gatekeeper manifests these are absent → defaults to []/etc.
      controlGroups: (manifestAny as any).controlGroups ?? [],
      controlContainers: (manifestAny as any).controlContainers ?? [],
      polishBanners: (manifestAny as any).polishBanners ?? [],
      editorLabels: (manifestAny as any).editorLabels ?? [],
      _manifestVersion: computeManifestVersion(manifest),
      hasUserEdited: false,
      focusedSectionId: null,
      ...canvasSizeUpdate,
    });
  },

  moveControl: (id, dx, dy) => {
    get().clearScaleBase();
    const ctrl = get().controls[id];
    if (!ctrl || ctrl.locked) return;
    // Snap linked-label follow to the editor's snap-grid (matches the rule
    // applied by Rnd.dragGrid on controls and by LabelLayer's standalone
    // drag handler). The previous implementation used integer rounding
    // only (Math.round(l.x + dx)), which let labels drift off-grid as
    // soon as controls moved. See Phase 8 of the selection refactor plan
    // and the user-reported bug at snapGrid=1.
    const snap = get().snapGrid;
    set((s) => ({
      controls: {
        ...s.controls,
        [id]: { ...ctrl, x: ctrl.x + dx, y: ctrl.y + dy },
      },
      editorLabels: (s.editorLabels as EditorLabel[]).map(l =>
        l.controlId === id
          ? { ...l, x: Math.round((l.x + dx) / snap) * snap, y: Math.round((l.y + dy) / snap) * snap }
          : l
      ),
    }));
  },

  resizeControl: (id, w, h) => {
    get().clearScaleBase();
    const ctrl = get().controls[id];
    if (!ctrl || ctrl.locked || ctrl.resizeLocked) return;
    set((s) => ({
      controls: {
        ...s.controls,
        [id]: { ...ctrl, w: Math.max(8, w), h: Math.max(8, h) },
      },
    }));
  },

  moveSection: (id, dx, dy) => {
    get().clearScaleBase();
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

    // Move labels with this section. Two paths:
    //   1. Linked labels: follow their control if the control is in this section
    //   2. Standalone labels: follow the section if their sectionId matches
    //      (closes Tier 2 drift bug — standalone labels with sectionId stayed
    //      put when their section moved, leaving them visually orphaned)
    const updatedLabels = (get().editorLabels as EditorLabel[]).map((l) => {
      const followsControl = l.controlId && childSet.has(l.controlId);
      const followsSection = !l.controlId && l.sectionId === id;
      return (followsControl || followsSection)
        ? { ...l, x: Math.round(l.x + dx), y: Math.round(l.y + dy) }
        : l;
    });

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
    get().clearScaleBase();
    const section = get().sections[id];
    if (!section) return;
    set((s) => ({
      sections: {
        ...s.sections,
        [id]: { ...section, w: Math.max(24, w), h: Math.max(24, h) },
      },
    }));
  },

  setSectionPosition: (id, x, y) => {
    get().clearScaleBase();
    const section = get().sections[id];
    if (!section) return;
    set((s) => ({
      sections: {
        ...s.sections,
        [id]: { ...section, x, y },
      },
    }));
  },

  setSectionLabel: (id, label) => {
    const section = get().sections[id];
    if (!section) return;
    set((s) => ({
      sections: {
        ...s.sections,
        [id]: { ...section, headerLabel: label },
      },
    }));
  },

  updateSection: (id, updates) => {
    get().clearScaleBase();
    const section = get().sections[id];
    if (!section) return;
    // Sync hidden boolean with frameMode for backwards compatibility
    if (updates.frameMode) {
      updates.hidden = updates.frameMode === 'hidden' ? true : undefined;
    }
    set((s) => ({
      sections: {
        ...s.sections,
        [id]: { ...section, ...updates },
      },
    }));
  },

  moveSelectedControls: (dx, dy) => {
    get().clearScaleBase();
    const { selectedIds, lockedIds, controls } = get();
    const lockedSet = new Set(lockedIds);
    const updated = { ...controls };
    const movedIds = new Set<string>();

    for (const id of selectedIds) {
      if (lockedSet.has(id)) continue;
      const ctrl = updated[id];
      if (ctrl) {
        updated[id] = { ...ctrl, x: ctrl.x + dx, y: ctrl.y + dy };
        movedIds.add(id);
      }
    }

    if (movedIds.size === 0) return;

    // Move linked labels with the controls
    const updatedLabels = (get().editorLabels as EditorLabel[]).map((l) =>
      l.controlId && movedIds.has(l.controlId)
        ? { ...l, x: Math.round(l.x + dx), y: Math.round(l.y + dy) }
        : l,
    );

    set({ controls: updated, editorLabels: updatedLabels });
  },

  updateControlProp: (ids, field, value) => {
    get().clearScaleBase();
    const controls = { ...get().controls };
    for (const id of ids) {
      const ctrl = controls[id];
      if (ctrl) {
        controls[id] = { ...ctrl, [field]: value };
      }
    }
    // Sync control fields → linked editorLabel fields
    if (field === 'labelFontSize') {
      const idSet = new Set(ids);
      const updatedLabels = (get().editorLabels as EditorLabel[]).map((l) =>
        l.controlId && idSet.has(l.controlId)
          ? { ...l, fontSize: value as number }
          : l,
      );
      set({ controls, editorLabels: updatedLabels });
    } else if (field === 'label') {
      // Sync label text to linked editorLabel so position changes show current text
      const idSet = new Set(ids);
      const updatedLabels = (get().editorLabels as EditorLabel[]).map((l) =>
        l.controlId && idSet.has(l.controlId)
          ? { ...l, text: value as string }
          : l,
      );
      set({ controls, editorLabels: updatedLabels });
    } else {
      set({ controls });
    }
  },

  duplicateSelected: () => {
    get().clearScaleBase();
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
        zOrder: (original.zOrder ?? 0) + 1,
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
    get().clearScaleBase();
    const { selectedIds, controls, sections } = get();
    if (selectedIds.length === 0) return;

    // Skip fully locked controls — they can't be deleted
    const deletable = selectedIds.filter(id => !controls[id]?.locked);
    if (deletable.length === 0) return;

    const deleteSet = new Set(deletable);
    const updatedControls = { ...controls };
    const updatedSections = { ...sections };

    for (const id of deletable) {
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

    // Clean up containers — remove deleted IDs and dissolve empty containers.
    // Without this, a deleted control's id stays in controlContainers.controlIds
    // forever (caught by post-editor validator as CONTAINER_ORPHAN, but better
    // to prevent at source).
    const updatedContainers = get().controlContainers
      .map(c => ({ ...c, controlIds: c.controlIds.filter(id => !deleteSet.has(id)) }))
      .filter(c => c.controlIds.length >= 1);

    set({
      controls: updatedControls,
      sections: updatedSections,
      selectedIds: [],
      lockedIds,
      editorLabels: updatedLabels,
      controlGroups: updatedGroups,
      controlContainers: updatedContainers,
    });
  },

  toggleLock: (id) => {
    const { lockedIds, controls } = get();
    const ctrl = controls[id];
    if (!ctrl) return;

    // Cycle: unlocked → size-locked → fully-locked → unlocked
    if (!ctrl.locked && !ctrl.resizeLocked) {
      // Unlocked → Size Locked
      set({
        controls: { ...controls, [id]: { ...ctrl, resizeLocked: true } },
      });
    } else if (ctrl.resizeLocked && !ctrl.locked) {
      // Size Locked → Fully Locked
      set({
        lockedIds: [...lockedIds.filter(lid => lid !== id), id],
        controls: { ...controls, [id]: { ...ctrl, locked: true, resizeLocked: false } },
      });
    } else {
      // Fully Locked → Unlocked
      set({
        lockedIds: lockedIds.filter((lid) => lid !== id),
        controls: { ...controls, [id]: { ...ctrl, locked: false, resizeLocked: false } },
      });
    }
  },

  setLockMode: (ids, mode) => {
    const { controls, lockedIds } = get();
    const updated = { ...controls };
    let newLockedIds = [...lockedIds];

    for (const id of ids) {
      const ctrl = updated[id];
      if (!ctrl) continue;
      switch (mode) {
        case 'unlocked':
          updated[id] = { ...ctrl, locked: false, resizeLocked: false };
          newLockedIds = newLockedIds.filter(lid => lid !== id);
          break;
        case 'size-locked':
          updated[id] = { ...ctrl, locked: false, resizeLocked: true };
          newLockedIds = newLockedIds.filter(lid => lid !== id);
          break;
        case 'fully-locked':
          updated[id] = { ...ctrl, locked: true, resizeLocked: false };
          if (!newLockedIds.includes(id)) newLockedIds.push(id);
          break;
      }
    }

    set({ controls: updated, lockedIds: newLockedIds });
  },

  setSelectedIds: (ids) => set({
    selectedIds: ids,
    selectedLabelId: ids.length > 0 ? null : get().selectedLabelId,
    selectedBannerId: ids.length > 0 ? null : get().selectedBannerId,
    // Phase 2+3 sync: setSelectedIds is the REPLACE path used by every
    // entity's plain-click handler (controls, sections, etc.). Clear the
    // unified `selection` array so previously-selected labels/banners
    // deselect when the user clicks a different entity. Without this,
    // LabelLayer's outline check (selection.includes('label:id')) keeps
    // the label outlined forever — the user-reported bug.
    selection: [],
  }),

  /**
   * Replace the unified selection set + sync legacy fields.
   *
   * Sync rules (so existing PropertiesPanel / LayersPanel / drag /
   * Properties forms keep working unchanged):
   *  - selectedIds = control entries only
   *  - selectedLabelId = first label entry if exactly one label is in
   *    the selection; null when 0 or 2+ labels selected (multi-label is
   *    a new state legacy fields can't represent — that's the whole
   *    point of Phase 2)
   *  - selectedBannerId = banner entry if any
   *
   * Consumers reading the legacy fields see the single-select case
   * unchanged. Multi-label and mixed selections only show up to
   * consumers that read the new `selection` array directly.
   */
  setSelection: (selection) => {
    const controlIds: string[] = [];
    const labelIds: string[] = [];
    let bannerId: string | null = null;
    for (const sid of selection) {
      const colon = sid.indexOf(':');
      if (colon <= 0) continue;
      const type = sid.slice(0, colon);
      const id = sid.slice(colon + 1);
      if (type === 'control' || type === 'section') controlIds.push(id);
      else if (type === 'label') labelIds.push(id);
      else if (type === 'banner') bannerId = id;
    }
    set({
      selection,
      selectedIds: controlIds,
      selectedLabelId: labelIds.length === 1 ? labelIds[0] : null,
      selectedBannerId: bannerId,
    });
  },

  /**
   * Add to the unified selection. Idempotent — duplicates ignored.
   *
   * Critical: this does NOT go through `setSelection` (which has REPLACE
   * semantics — it derives legacy fields purely from the new selection
   * array). Instead, addToSelection PRESERVES existing legacy state and
   * only adds the new entries' effects.
   *
   * Why: when the user has selectedIds=[ctrl1] (set via the legacy
   * setSelectedIds path, with NO control entries in `selection`), then
   * shift-clicks a label, naive setSelection(['label:l1']) would see
   * "selection has no controls" and CLEAR selectedIds, deselecting the
   * control. That's the user-reported bug. The fix is to add the label
   * to `selection` AND to selectedLabelId, without touching selectedIds.
   */
  addToSelection: (ids) => {
    const current = get().selection;
    const existingSet = new Set(current);
    const nextSelection = [...current];
    for (const sid of ids) {
      if (!existingSet.has(sid)) {
        nextSelection.push(sid);
        existingSet.add(sid);
      }
    }
    // Sync legacy fields ADDITIVELY (preserve, never strip)
    const { selectedIds, selectedLabelId, selectedBannerId } = get();
    let nextSelectedIds = selectedIds;
    let nextSelectedLabelId = selectedLabelId;
    let nextSelectedBannerId = selectedBannerId;
    for (const sid of ids) {
      const colon = sid.indexOf(':');
      if (colon <= 0) continue;
      const type = sid.slice(0, colon);
      const id = sid.slice(colon + 1);
      if (type === 'control' || type === 'section') {
        if (!nextSelectedIds.includes(id)) nextSelectedIds = [...nextSelectedIds, id];
      } else if (type === 'label') {
        // Multi-label is a NEW state legacy can't represent. If selection
        // now contains exactly one label, set selectedLabelId to it;
        // otherwise null. The label-count check uses the new selection
        // (after this add), not the legacy field.
        const labelCount = nextSelection.filter((s) => s.startsWith('label:')).length;
        nextSelectedLabelId = labelCount === 1
          ? nextSelection.find((s) => s.startsWith('label:'))!.slice('label:'.length)
          : null;
      } else if (type === 'banner') {
        nextSelectedBannerId = id;
      }
    }
    set({
      selection: nextSelection,
      selectedIds: nextSelectedIds,
      selectedLabelId: nextSelectedLabelId,
      selectedBannerId: nextSelectedBannerId,
    });
  },

  /**
   * Remove entries from the unified selection. Mirrors addToSelection's
   * additive semantics: only strips the legacy field state that the
   * removed entry contributed; doesn't touch unrelated legacy state.
   */
  removeFromSelection: (ids) => {
    const toRemove = new Set(ids);
    const nextSelection = get().selection.filter((sid) => !toRemove.has(sid));
    // Compute legacy fields from the remaining unified selection state,
    // but only for the types being removed. Other legacy fields
    // (controls touched only via legacy setSelectedIds) stay intact.
    let { selectedIds, selectedLabelId, selectedBannerId } = get();
    for (const sid of ids) {
      const colon = sid.indexOf(':');
      if (colon <= 0) continue;
      const type = sid.slice(0, colon);
      const id = sid.slice(colon + 1);
      if (type === 'control' || type === 'section') {
        selectedIds = selectedIds.filter((cid) => cid !== id);
      } else if (type === 'label') {
        // After removal: if 0 or 2+ labels remain in unified selection,
        // selectedLabelId is null. If exactly 1, it's that one.
        const remainingLabels = nextSelection.filter((s) => s.startsWith('label:'));
        selectedLabelId = remainingLabels.length === 1
          ? remainingLabels[0].slice('label:'.length)
          : null;
      } else if (type === 'banner') {
        selectedBannerId = null;
      }
    }
    set({ selection: nextSelection, selectedIds, selectedLabelId, selectedBannerId });
  },

  /** Toggle one entry — adds if absent, removes if present. */
  toggleSelection: (id) => {
    const current = get().selection;
    if (current.includes(id)) {
      get().removeFromSelection([id]);
    } else {
      get().addToSelection([id]);
    }
  },

  /** Clear unified selection + all legacy single-slots. */
  clearSelection: () => {
    set({
      selection: [],
      selectedIds: [],
      selectedLabelId: null,
      selectedBannerId: null,
    });
  },

  /**
   * Phase 4 — entity-agnostic move. Dispatches to per-type movers by
   * prefix. Order is type-deterministic but the visual result is
   * order-independent because each mover applies the same dx/dy.
   *
   * Locked controls are short-circuited inside `moveControl`. Sections
   * also move (their children stay put in world coordinates per
   * existing `moveSection` semantics — that's the section behavior
   * users expect).
   */
  moveSelection: (dx, dy) => {
    const sel = get().selection;
    if (sel.length === 0) return;
    // Capture one snapshot for the whole group move so undo restores
    // pre-move state in one step (not N steps, one per entity).
    get().pushSnapshot();

    // Pre-compute: which CONTROL ids are in selection. Linked labels
    // whose parent is in this set should NOT be moved separately —
    // moveControl's linked-label follow already carries them. Without
    // this guard, the linked label gets moved TWICE per moveSelection
    // call (once via moveControl, once via moveLabel) and drifts 2x as
    // fast as the rest of the selection. Caught by Phase 4 e2e
    // scenario [1] (mixed control + linked-label + standalone).
    const controlIdsInSel = new Set<string>();
    for (const sid of sel) {
      if (sid.startsWith('control:')) {
        controlIdsInSel.add(sid.slice('control:'.length));
      }
    }
    const labels = get().editorLabels as EditorLabel[];

    for (const sid of sel) {
      const colon = sid.indexOf(':');
      if (colon <= 0) continue;
      const type = sid.slice(0, colon);
      const id = sid.slice(colon + 1);
      switch (type) {
        case 'control':
          get().moveControl(id, dx, dy);
          break;
        case 'label': {
          const lbl = labels.find((l) => l.id === id);
          if (lbl?.controlId && controlIdsInSel.has(lbl.controlId)) {
            // Parent control is also in selection — skip; moveControl
            // already moved this linked label.
            continue;
          }
          get().moveLabel(id, dx, dy);
          break;
        }
        case 'section':
          get().moveSection(id, dx, dy);
          break;
        case 'banner':
          get().movePolishBanner(id, dx, dy);
          break;
        // container, groupLabel: not yet wired — out of scope for Phase 4
      }
    }
  },

  /**
   * Phase 4 — entity-agnostic delete. Controls go through the existing
   * `deleteSelected` (which handles `section.childIds`, `controlGroups`
   * member cleanup, linked-label cascade). Labels and banners use
   * their own per-type delete actions. Selection is cleared after.
   *
   * Sections are intentionally excluded: section deletion needs an
   * explicit user confirmation + child-controls-handling decision
   * (move to parent? delete with section?). Keep that on its own
   * action.
   */
  deleteSelection: () => {
    const sel = get().selection;
    if (sel.length === 0) return;
    // One snapshot for the whole batch — undo restores everything.
    get().pushSnapshot();

    const labelIds: string[] = [];
    const bannerIds: string[] = [];
    for (const sid of sel) {
      const colon = sid.indexOf(':');
      if (colon <= 0) continue;
      const type = sid.slice(0, colon);
      const id = sid.slice(colon + 1);
      if (type === 'label') labelIds.push(id);
      else if (type === 'banner') bannerIds.push(id);
      // controls are handled by deleteSelected via the synced selectedIds
    }

    // Delete labels first (so linked-label cleanup in deleteSelected
    // doesn't double-delete the same id).
    for (const lid of labelIds) get().deleteLabel(lid);
    for (const bid of bannerIds) get().deletePolishBanner(bid);

    // deleteSelected reads selectedIds (controls + sections in legacy
    // bag); our selection-sync already populated it. The existing
    // implementation handles cross-reference cleanup for controls and
    // skips fully-locked ones.
    if (get().selectedIds.length > 0) {
      get().deleteSelected();
    }

    get().clearSelection();
  },

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
    get().clearScaleBase();
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
    get().clearScaleBase();
    set((s) => {
      // Update control.labelFontSize (metadata used by computeLabelPosition)
      const updatedControls: Record<string, ControlDef> = {};
      for (const [id, ctrl] of Object.entries(s.controls)) {
        updatedControls[id] = { ...ctrl, labelFontSize: size };
      }

      // Update EditorLabel.fontSize (what actually renders).
      // When size is undefined ("Auto"), fall back to each control's default
      // sizing based on sizeClass or type.
      const updatedLabels = (s.editorLabels as EditorLabel[]).map((l) => {
        if (size !== undefined) {
          return { ...l, fontSize: size };
        }
        // "Auto" — compute default from linked control's sizeClass
        if (l.controlId) {
          const ctrl = updatedControls[l.controlId];
          if (ctrl) {
            const defaultSize = ctrl.sizeClass === 'xl' ? 11
              : ctrl.sizeClass === 'lg' ? 10
              : ctrl.sizeClass === 'sm' ? 7
              : 8;
            return { ...l, fontSize: defaultSize };
          }
        }
        return { ...l, fontSize: 8 };
      });

      return { controls: updatedControls, editorLabels: updatedLabels };
    });
  },

  resetAllSizes: () => {
    get().clearScaleBase();
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

  /**
   * Backward-compat shim: relative scale (multiplies CURRENT layout by
   * factor). Used by the toolbar's ⤢ shrink/grow buttons. Internally
   * delegates to scaleFromBase by combining with the current cumulative
   * factor — so all scaling routes through the drift-free path.
   *
   * Example: at 1.5× base, scaleCanvas(0.8) → scaleFromBase(1.2).
   */
  scaleCanvas: (relativeFactor) => {
    if (relativeFactor === 1 || relativeFactor <= 0) return;
    const s = get();
    const newAbsolute = s.scaleCumulativeFactor * relativeFactor;
    s.scaleFromBase(newAbsolute);
  },

  /**
   * Drift-free absolute scaling — single source of truth for all scaling.
   *
   * Captures the current layout as `scaleBase` on first call. All subsequent
   * scale operations compute positions as `base × absoluteFactor` with one
   * round per coordinate, so cumulative rounding error never compounds:
   * scaleFromBase(0.5) then scaleFromBase(1.0) returns to EXACT original.
   *
   * Any non-scale layout edit (drag, resize, add, delete, canvas resize)
   * clears scaleBase via clearScaleBase, so the next scale captures fresh.
   */
  scaleFromBase: (absoluteFactor) => {
    if (absoluteFactor <= 0) return;

    const state = get();

    // Step 1: ensure base is captured. First scale call snapshots current state.
    let base: ScaleBase | null = state.scaleBase;
    if (!base) {
      const ctrls: ScaleBase['controls'] = {};
      for (const [id, c] of Object.entries(state.controls)) {
        ctrls[id] = { x: c.x, y: c.y, w: c.w, h: c.h, labelFontSize: c.labelFontSize };
      }
      const secs: ScaleBase['sections'] = {};
      for (const [id, sec] of Object.entries(state.sections)) {
        secs[id] = { x: sec.x, y: sec.y, w: sec.w, h: sec.h };
      }
      base = {
        controls: ctrls,
        sections: secs,
        labels: (state.editorLabels as EditorLabel[]).map((l) => ({
          id: l.id, x: l.x, y: l.y, w: l.w, fontSize: l.fontSize,
        })),
        containers: state.controlContainers.map((c) => ({
          id: c.id, x: c.x, y: c.y, w: c.w, h: c.h, borderRadius: c.borderRadius,
        })),
        guides: state.guides.map((g) => ({ id: g.id, position: g.position })),
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
      };
      state.setScaleBase(base);
    }

    // Step 2: compute new state from base × absoluteFactor.
    // ONE round per coord. Linked label drift solved automatically — both
    // label and its linked control scale from their respective base values.
    const f = absoluteFactor;

    const updatedControls: Record<string, ControlDef> = {};
    for (const [id, ctrl] of Object.entries(state.controls)) {
      const baseCtrl = base.controls[id];
      if (!baseCtrl) {
        // Control added after base capture (shouldn't happen — adds clear base — but defensive)
        updatedControls[id] = ctrl;
        continue;
      }
      updatedControls[id] = {
        ...ctrl,
        x: Math.round(baseCtrl.x * f),
        y: Math.round(baseCtrl.y * f),
        w: Math.max(8, Math.round(baseCtrl.w * f)),
        h: Math.max(8, Math.round(baseCtrl.h * f)),
        labelFontSize: baseCtrl.labelFontSize != null
          ? Math.max(4, Math.round(baseCtrl.labelFontSize * f))
          : ctrl.labelFontSize,
      };
    }

    const updatedSections: Record<string, SectionDef> = {};
    for (const [id, sec] of Object.entries(state.sections)) {
      const baseSec = base.sections[id];
      if (!baseSec) {
        updatedSections[id] = sec;
        continue;
      }
      updatedSections[id] = {
        ...sec,
        x: Math.round(baseSec.x * f),
        y: Math.round(baseSec.y * f),
        w: Math.max(8, Math.round(baseSec.w * f)),
        h: Math.max(8, Math.round(baseSec.h * f)),
      };
    }

    const baseLabelsById = new Map(base.labels.map((l) => [l.id, l]));
    const updatedLabels: EditorLabel[] = (state.editorLabels as EditorLabel[]).map((l) => {
      const baseLabel = baseLabelsById.get(l.id);
      if (!baseLabel) return l;
      return {
        ...l,
        x: Math.round(baseLabel.x * f),
        y: Math.round(baseLabel.y * f),
        w: baseLabel.w != null ? Math.max(8, Math.round(baseLabel.w * f)) : l.w,
        fontSize: Math.max(4, Math.round(baseLabel.fontSize * f)),
      };
    });

    const baseContainersById = new Map(base.containers.map((c) => [c.id, c]));
    const updatedContainers: ControlContainer[] = state.controlContainers.map((c) => {
      const baseC = baseContainersById.get(c.id);
      if (!baseC) return c;
      return {
        ...c,
        x: Math.round(baseC.x * f),
        y: Math.round(baseC.y * f),
        w: Math.max(8, Math.round(baseC.w * f)),
        h: Math.max(8, Math.round(baseC.h * f)),
        borderRadius: baseC.borderRadius != null
          ? Math.max(0, Math.round(baseC.borderRadius * f))
          : c.borderRadius,
      };
    });

    const baseGuidesById = new Map(base.guides.map((g) => [g.id, g]));
    const updatedGuides = state.guides.map((g) => {
      const baseG = baseGuidesById.get(g.id);
      if (!baseG) return g;
      return { ...g, position: Math.round(baseG.position * f) };
    });

    // Step 3: apply atomically. (set works on combined slice state — guides
    // and canvas dims live in canvasSlice but are accessible via combined set.)
    set({
      controls: updatedControls,
      sections: updatedSections,
      editorLabels: updatedLabels,
      controlContainers: updatedContainers,
      guides: updatedGuides,
      canvasWidth: Math.max(400, Math.round(base.canvasWidth * f)),
      canvasHeight: Math.max(300, Math.round(base.canvasHeight * f)),
    });

    // Step 4: track cumulative factor (for the modal's "currently at N%" UI
    // and for relative-shrink toolbar buttons).
    state.setScaleCumulativeFactor(f);
  },

  /**
   * Resize the canvas without scaling its contents. Sections, controls, and
   * labels keep their absolute positions. Empty space appears at the right /
   * bottom when growing; controls past the new edge stay in state and remain
   * selectable from the Layers panel sidebar (PanCanvas allows overflow).
   *
   * Distinct from scaleCanvas (which multiplies all positions by a factor).
   * Caller is responsible for pushSnapshot before invoking.
   */
  setCanvasSize: (w, h) => {
    get().clearScaleBase();
    set({
      canvasWidth: Math.round(w),
      canvasHeight: Math.round(h),
    });
  },

  moveLabel: (labelId, dx, dy) => {
    get().clearScaleBase();
    // Snap final position to snapGrid — NOT just the delta. The drag
    // handler in LabelLayer already snaps the delta, but if the label
    // started off-grid (e.g., from computeLabelPosition rounding to
    // integer when it created the label), only snapping the delta
    // perpetuates the off-grid offset forever. Snapping the final
    // position realigns to the grid on every move — same logic as
    // Phase 8 applied to linked-label follow in moveControl.
    const sections = get().sections;
    const snap = get().snapGrid;
    set((s) => ({
      editorLabels: (s.editorLabels as EditorLabel[]).map(l => {
        if (l.id !== labelId) return l;
        const nx = Math.round((l.x + dx) / snap) * snap;
        const ny = Math.round((l.y + dy) / snap) * snap;
        // Linked labels keep their (unused) sectionId untouched —
        // they derive section from their control, not from this field.
        if (l.controlId) return { ...l, x: nx, y: ny };
        // Standalone labels: recompute sectionId from new center.
        // Use w/2 if width is set, otherwise treat (x, y) as the anchor.
        const cx = nx + Math.round((l.w ?? 0) / 2);
        const cy = ny;
        const newSectionId = findNearestSection(cx, cy, sections);
        return { ...l, x: nx, y: ny, sectionId: newSectionId };
      }),
    }));
  },

  updateLabel: (labelId, updates) => {
    get().clearScaleBase();
    set((s) => ({
      editorLabels: (s.editorLabels as EditorLabel[]).map(l =>
        l.id === labelId ? { ...l, ...updates } : l
      ),
    }));
  },

  assignLabelToNearestSection: (labelId) => {
    get().clearScaleBase();
    const label = (get().editorLabels as EditorLabel[]).find(l => l.id === labelId);
    // Only standalone labels can be assigned this way. Linked labels derive
    // section from their control and don't store sectionId.
    if (!label || label.controlId) return false;
    const sections = get().sections;
    const cx = label.x + Math.round((label.w ?? 0) / 2);
    const cy = label.y;
    const newSectionId = findNearestSection(cx, cy, sections);
    if (!newSectionId) return false;
    set((s) => ({
      editorLabels: (s.editorLabels as EditorLabel[]).map(l =>
        l.id === labelId ? { ...l, sectionId: newSectionId } : l
      ),
    }));
    return true;
  },

  deleteLabel: (labelId) => {
    get().clearScaleBase();
    set((s) => ({
      editorLabels: (s.editorLabels as EditorLabel[]).filter(l => l.id !== labelId),
    }));
  },

  // ─── Polish Banner actions ─────────────────────────────────────────────
  // Banner is purely cosmetic: no controls, no panel state, no tutorial refs.
  // Selecting a banner is mutually exclusive with control/label selection.
  addPolishBanner: () => {
    get().clearScaleBase();
    const id = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const canvasWidth = get().canvasWidth ?? 2680;
    const newBanner: PolishBanner = {
      id,
      x: 0,
      y: 0,
      w: canvasWidth,
      h: 70,
      text: '',
      // Defaults match SectionContainer header styling — translucent black bg
      // + muted gray text (#666 = section header's color). Gives the banner
      // the same refined "carved into the panel" feel as section headers,
      // while keeping banner's distinctive size (70 tall × full width).
      // Contractor can override via Properties (color pickers + opacity slider).
      textColor: '#666666',
      backgroundColor: '#000000',
      backgroundOpacity: 0.15,    // matches rgba(0,0,0,0.15) on SectionContainer header
      borderRadius: 8,            // matches SectionContainer's rounded-lg
      fontSize: 16,
      align: 'center',
      verticalAlign: 'center',
      // No explicit zIndex on creation — DOM order puts the banner behind
      // controls (rendered earlier in JSX tree). Contractor can override via
      // Properties panel if they want banner ON TOP for a specific layout.
      locked: false,
    };
    set((s) => ({
      polishBanners: [...s.polishBanners, newBanner],
      selectedBannerId: id,
      selectedIds: [],
      selectedLabelId: null,
    }));
    return id;
  },

  updatePolishBanner: (id, updates) => {
    set((s) => ({
      polishBanners: s.polishBanners.map((b) => b.id === id ? { ...b, ...updates } : b),
    }));
  },

  deletePolishBanner: (id) => {
    get().clearScaleBase();
    set((s) => ({
      polishBanners: s.polishBanners.filter((b) => b.id !== id),
      selectedBannerId: s.selectedBannerId === id ? null : s.selectedBannerId,
    }));
  },

  movePolishBanner: (id, dx, dy) => {
    get().clearScaleBase();
    set((s) => ({
      polishBanners: s.polishBanners.map((b) => b.id === id
        ? { ...b, x: Math.round(b.x + dx), y: Math.round(b.y + dy) }
        : b,
      ),
    }));
  },

  resizePolishBanner: (id, x, y, w, h) => {
    get().clearScaleBase();
    set((s) => ({
      polishBanners: s.polishBanners.map((b) => b.id === id
        ? { ...b, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
        : b,
      ),
    }));
  },

  setSelectedBanner: (id) => {
    set((s) => ({
      selectedBannerId: id,
      // Clear other selections so Properties panel routes cleanly
      selectedIds: id ? [] : s.selectedIds,
      selectedLabelId: id ? null : s.selectedLabelId,
      // Phase 2+3: also clear unified `selection` so visual outlines on
      // labels/controls deselect when the banner takes focus.
      selection: id ? [`banner:${id}` as SelectableId] : s.selection.filter((sid) => !sid.startsWith('banner:')),
    }));
  },

  addStandaloneLabel: (x, y, text = 'Label') => {
    get().clearScaleBase();
    // Suffix with a random nonce so two rapid calls (e.g., in tests) don't
    // collide on Date.now() and end up sharing an id.
    const id = `label-standalone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sections = get().sections;
    const w = 60;
    // Use the label's center for section detection so a click near the edge
    // of a section's bounding box still resolves to that section.
    const sectionId = findNearestSection(Math.round(x) + Math.round(w / 2), Math.round(y), sections);
    const newLabel: EditorLabel = {
      id,
      controlId: null,
      sectionId,  // undefined if the click landed outside every section
      text,
      x: Math.round(x),
      y: Math.round(y),
      w,
      fontSize: 8,
      align: 'center',
    };
    set((s) => ({
      editorLabels: [...(s.editorLabels as EditorLabel[]), newLabel],
      selectedLabelId: id,
      selectedIds: [],
    }));
    return id;
  },

  alignControls: (mode) => {
    get().clearScaleBase();
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
    get().clearScaleBase();
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
    get().clearScaleBase();
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
    get().clearScaleBase();
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
    get().clearScaleBase();
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
    get().clearScaleBase();
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

  setSelectedLabel: (id, opts) => {
    // Default: label selection is mutually exclusive with control/banner.
    // additive: preserve existing controls so cross-type multi-select works
    // (shift-clicking a label after picking controls — symmetric with
    // toggleSelected on the control side).
    if (id !== null) {
      if (opts?.additive) {
        // Additive: keep existing selectedIds; add this label to the
        // unified selection without clearing anything else.
        const sid = `label:${id}` as SelectableId;
        const next = get().selection.includes(sid) ? get().selection : [...get().selection, sid];
        set({ selectedLabelId: id, selectedBannerId: null, selection: next });
      } else {
        // Replace: clear everything else (selectedIds, banner, unified
        // selection) and select just this label.
        set({
          selectedLabelId: id,
          selectedIds: [],
          selectedBannerId: null,
          selection: [`label:${id}` as SelectableId],
        });
      }
    } else {
      // Deselect the label slot. Also drop label entries from the unified
      // selection so a programmatic setSelectedLabel(null) cleanly clears
      // the visual outline driven by `selection.includes('label:...')`.
      set({
        selectedLabelId: null,
        selection: get().selection.filter((sid) => !sid.startsWith('label:')),
      });
    }
  },

  bringToFront: () => {
    const { selectedIds, controls } = get();
    if (selectedIds.length === 0) return;
    const allOrders = Object.values(controls).map(c => c.zOrder ?? 0);
    const maxOrder = allOrders.length > 0 ? Math.max(...allOrders) : 0;
    const updated = { ...controls };
    for (const id of selectedIds) {
      const ctrl = updated[id];
      if (ctrl) updated[id] = { ...ctrl, zOrder: maxOrder + 1 };
    }
    set({ controls: updated });
  },

  sendToBack: () => {
    const { selectedIds, controls } = get();
    if (selectedIds.length === 0) return;
    const allOrders = Object.values(controls).map(c => c.zOrder ?? 0);
    const minOrder = allOrders.length > 0 ? Math.min(...allOrders) : 0;
    const updated = { ...controls };
    for (const id of selectedIds) {
      const ctrl = updated[id];
      if (ctrl) updated[id] = { ...ctrl, zOrder: Math.max(0, minOrder - 1) };
    }
    set({ controls: updated });
  },

  bringForward: () => {
    const { selectedIds, controls } = get();
    if (selectedIds.length === 0) return;
    const updated = { ...controls };
    for (const id of selectedIds) {
      const ctrl = updated[id];
      if (ctrl) updated[id] = { ...ctrl, zOrder: (ctrl.zOrder ?? 0) + 1 };
    }
    set({ controls: updated });
  },

  sendBackward: () => {
    const { selectedIds, controls } = get();
    if (selectedIds.length === 0) return;
    const updated = { ...controls };
    for (const id of selectedIds) {
      const ctrl = updated[id];
      if (ctrl) updated[id] = { ...ctrl, zOrder: Math.max(0, (ctrl.zOrder ?? 0) - 1) };
    }
    set({ controls: updated });
  },

  // ── Container CRUD ──────────────────────────────────────────────────────

  addContainer: (x, y, w, h, controlIds = []) => {
    get().clearScaleBase();
    const id = `container-${Date.now()}`;
    const container: ControlContainer = {
      id, controlIds, style: 'recessed',
      x, y, w, h, borderRadius: 4,
    };
    set({ controlContainers: [...get().controlContainers, container] });
    return id;
  },

  updateContainer: (id, updates) => {
    get().clearScaleBase();
    set({
      controlContainers: get().controlContainers.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  },

  deleteContainer: (id) => {
    get().clearScaleBase();
    set({ controlContainers: get().controlContainers.filter(c => c.id !== id) });
  },

  moveContainer: (id, dx, dy) => {
    get().clearScaleBase();
    set({
      controlContainers: get().controlContainers.map(c =>
        c.id === id ? { ...c, x: c.x + dx, y: c.y + dy } : c
      ),
    });
  },

  resizeContainer: (id, w, h) => {
    get().clearScaleBase();
    set({
      controlContainers: get().controlContainers.map(c =>
        c.id === id ? { ...c, w: Math.max(20, w), h: Math.max(20, h) } : c
      ),
    });
  },

  setControlSection: (controlId, newSectionId) => {
    const state = get();
    const ctrl = state.controls[controlId];
    if (!ctrl) return;

    // Normalize: treat null and '' as "no section"
    const target = newSectionId && newSectionId !== '' ? newSectionId : '';
    const current = ctrl.sectionId ?? '';

    // Validate target exists if non-empty — refuse to write dangling refs
    if (target !== '' && !state.sections[target]) return;

    // Idempotent: nothing to do if already there
    if (current === target) return;

    const updatedSections = { ...state.sections };

    // Remove from old section
    if (current && updatedSections[current]) {
      updatedSections[current] = {
        ...updatedSections[current],
        childIds: updatedSections[current].childIds.filter(id => id !== controlId),
      };
    }

    // Add to new section (filter-then-append guarantees no duplicates)
    if (target && updatedSections[target]) {
      const childIds = updatedSections[target].childIds.filter(id => id !== controlId);
      updatedSections[target] = {
        ...updatedSections[target],
        childIds: [...childIds, controlId],
      };
    }

    set({
      controls: { ...state.controls, [controlId]: { ...ctrl, sectionId: target } },
      sections: updatedSections,
    });
  },

  initLabelsFromControls: () => {
    get().clearScaleBase();
    const { controls, editorLabels } = get();
    const controlScale = (get() as any).controlScale ?? 1;

    // Helper: compute label position for a control
    const computePos = (ctrl: ControlDef) => {
      const pos = ctrl.labelPosition;
      if (pos === 'on-button' || pos === 'hidden') return null;
      if (!ctrl.label) return null;
      const visW = ctrl.w * controlScale;
      const visH = ctrl.h * controlScale;
      const fontSize = ctrl.labelFontSize
        ?? (ctrl.sizeClass === 'xl' ? 11 : ctrl.sizeClass === 'lg' ? 10 : ctrl.sizeClass === 'sm' ? 7 : 8);
      return computeLabelPosition(
        ctrl.x, ctrl.y, visW, visH,
        pos, ctrl.label, fontSize, ctrl.secondaryLabel,
      );
    };

    const existing = editorLabels as EditorLabel[];

    // Pass 1: Auto-repair labels with non-integer positions.
    // These are artifacts from old percentage-based math — any label with
    // fractional x/y that's linked to a valid control gets regenerated.
    // User-positioned labels always have integer positions (our mutations round).
    let repaired = 0;
    const repairedLabels = existing.map((l) => {
      const xIsInt = typeof l.x === 'number' && l.x === Math.trunc(l.x);
      const yIsInt = typeof l.y === 'number' && l.y === Math.trunc(l.y);
      if (xIsInt && yIsInt) return l;
      if (!l.controlId || !controls[l.controlId]) return l;
      const lp = computePos(controls[l.controlId]);
      if (!lp) return l;
      repaired++;
      return { ...l, x: lp.x, y: lp.y, w: lp.w, align: lp.align, fontSize: lp.fontSize };
    });

    // Pass 2: Backfill — create EditorLabels for controls that don't have one yet.
    const existingControlIds = new Set(
      repairedLabels.filter((l) => l.controlId).map((l) => l.controlId),
    );

    const newLabels: EditorLabel[] = [];
    for (const ctrl of Object.values(controls)) {
      if (existingControlIds.has(ctrl.id)) continue;
      const lp = computePos(ctrl);
      if (!lp) continue;
      newLabels.push({
        id: `label-${ctrl.id}`,
        controlId: ctrl.id,
        text: ctrl.label,
        icon: ctrl.icon ?? undefined,
        x: lp.x,
        y: lp.y,
        w: lp.w,
        fontSize: lp.fontSize,
        align: lp.align,
      });
    }

    if (repaired > 0 || newLabels.length > 0) {
      set({ editorLabels: [...repairedLabels, ...newLabels] });
    }
  },

  setLabelPosition: (ids, position) => {
    get().clearScaleBase();
    const { controls, editorLabels } = get();
    const controlScale = (get() as any).controlScale ?? 1;
    const idSet = new Set(ids);
    const updatedControls = { ...controls };
    let updatedLabels = editorLabels as EditorLabel[];

    for (const id of ids) {
      const ctrl = updatedControls[id];
      if (!ctrl) continue;
      // Update the control's labelPosition
      updatedControls[id] = { ...ctrl, labelPosition: position };
    }

    if (position === 'hidden' || position === 'on-button') {
      // SOFT HIDE — mark labels as hidden but preserve position/text.
      // User can toggle back to 'above'/'below' to reveal at stored position.
      updatedLabels = updatedLabels.map((l) =>
        l.controlId && idSet.has(l.controlId) ? { ...l, hidden: true } : l,
      );
    } else {
      // Compute fresh position for each linked label (or create if missing).
      // Also unhide any previously-hidden label.
      const existingByCtrlId = new Map<string, EditorLabel>();
      for (const l of updatedLabels) {
        if (l.controlId) existingByCtrlId.set(l.controlId, l);
      }

      const newLabels: EditorLabel[] = [];
      const updateMap = new Map<string, EditorLabel>();

      for (const id of ids) {
        const ctrl = updatedControls[id];
        if (!ctrl || (!ctrl.label && !ctrl.icon)) continue;
        const visW = ctrl.w * controlScale;
        const visH = ctrl.h * controlScale;
        const fontSize = ctrl.labelFontSize
          ?? (ctrl.sizeClass === 'xl' ? 11 : ctrl.sizeClass === 'lg' ? 10 : ctrl.sizeClass === 'sm' ? 7 : 8);
        // Use label text for sizing, or a placeholder for icon-only controls
        const labelForPosition = ctrl.label || (ctrl.icon ? '\u2B24' : '');
        const lp = computeLabelPosition(
          ctrl.x, ctrl.y, visW, visH,
          position, labelForPosition, fontSize, ctrl.secondaryLabel,
        );
        if (!lp) continue;

        const existing = existingByCtrlId.get(id);
        if (existing) {
          // Always sync text + icon from control. Unhide. Recompute position if wasn't hidden.
          updateMap.set(existing.id, existing.hidden
            ? { ...existing, hidden: false, text: ctrl.label, icon: ctrl.icon ?? existing.icon }
            : {
                ...existing,
                hidden: false,
                text: ctrl.label,
                icon: ctrl.icon ?? existing.icon,
                x: lp.x,
                y: lp.y,
                w: lp.w,
                align: lp.align,
                fontSize: lp.fontSize,
              });
        } else {
          newLabels.push({
            id: `label-${id}`,
            controlId: id,
            text: ctrl.label,
            icon: ctrl.icon ?? undefined,
            x: lp.x,
            y: lp.y,
            w: lp.w,
            fontSize: lp.fontSize,
            align: lp.align,
          });
        }
      }

      updatedLabels = [
        ...updatedLabels.map((l) => updateMap.get(l.id) ?? l),
        ...newLabels,
      ];
    }

    set({ controls: updatedControls, editorLabels: updatedLabels });
  },
});
