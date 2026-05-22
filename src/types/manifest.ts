/**
 * Shared Manifest Schema — Single Source of Truth
 *
 * This file defines the canonical types for the Master Manifest produced
 * by the Gatekeeper and consumed by both:
 *   - scripts/layout-engine.ts (deterministic template generator)
 *   - src/components/panel-editor/store/manifestSlice.ts (editor store)
 *
 * Any new manifest fields should be added HERE, not in the consumers.
 */

// ─── Control Types ──────────────────────────────────────────────────────────

export type ControlType =
  | 'button' | 'knob' | 'slider' | 'fader' | 'switch' | 'lever'
  | 'led' | 'screen' | 'encoder' | 'wheel' | 'pad'
  | 'port' | 'slot';

export type LayoutArchetype =
  | 'grid-NxM'
  | 'single-column'
  | 'single-row'
  | 'anchor-layout'
  | 'cluster-above-anchor'
  | 'cluster-below-anchor'
  | 'dual-column'
  | 'stacked-rows'
  | 'transport-pair';

export type ButtonShape = 'rectangle' | 'circle' | 'pill' | 'square';
export type SizeClass = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonStyle = 'raised' | 'flat-key' | 'rubber' | 'transport';
export type LabelDisplay = 'on-button' | 'above' | 'below' | 'left' | 'right' | 'icon-only' | 'hidden';
export type LEDBehavior = 'steady' | 'blink-on-activity' | 'dynamic-color';
export type LEDPosition = 'above' | 'below' | 'inside' | 'ring';
export type LEDVariant = 'dot' | 'dual-label' | 'bar';
/**
 * LED rendering styles. Renderer treats `integrated` and `face` as the same
 * (face is the preferred name; integrated kept for backwards-compat with
 * existing gatekeeper data on cdj-3000, fantom-06, dj-djs-1000, etc.).
 *
 * - `dot`           — small separate indicator above/beside the button
 * - `face`          — whole button face glows uniformly (preferred name)
 * - `integrated`    — alias for `face` (legacy gatekeeper output)
 * - `label-backlit` — only the label/text glows through; button face stays dark
 * - `edge-glow`     — only the border/edge lights up;
 *                     auto-renders as RING on circle-shaped buttons
 */
export type LEDStyle = 'dot' | 'face' | 'integrated' | 'label-backlit' | 'edge-glow';
export type InteractionType = 'momentary' | 'toggle' | 'hold' | 'rotary' | 'slide' | 'touch';

export type SubZone = string[] | { controls: string[]; direction: 'row' | 'column' };

// ─── Manifest Control ───────────────────────────────────────────────────────

export interface ManifestControl {
  // Identity (Gatekeeper)
  id: string;
  verbatimLabel: string;
  type: ControlType;
  section: string;
  functionalGroup: string;
  spatialNeighbors: {
    above: string | null;
    below: string | null;
    left: string | null;
    right: string | null;
  };

  // Visual Appearance (Visual Extractor)
  shape?: ButtonShape;
  sizeClass?: SizeClass;
  surfaceColor?: string | null;
  buttonStyle?: ButtonStyle;

  // Label Rendering (Visual Extractor)
  labelDisplay?: LabelDisplay;
  icon?: string | null;
  primaryLabel?: string;
  secondaryLabel?: string | null;

  // LED Properties (Visual Extractor)
  hasLed?: boolean;
  ledColor?: string | null;
  ledBehavior?: LEDBehavior;
  ledPosition?: LEDPosition;
  ledVariant?: LEDVariant;
  ledStyle?: LEDStyle;  // integrated = button face glows, dot = separate LED indicator

  // Label Appearance
  labelAlign?: string;   // on-button position: 'center' | 'top-left' | ... | 'bottom-right'
  labelColor?: string;   // hex color for on-button text

  // Interaction Model (Visual Extractor)
  interactionType?: InteractionType;
  secondaryFunction?: string | null;
  positions?: number;
  positionLabels?: string[];
  encoderHasPush?: boolean;
  orientation?: 'vertical' | 'horizontal';

  // Relationships (Visual Extractor)
  pairedWith?: string | null;
  sharedLabel?: string | null;
  groupId?: string | null;
  nestedIn?: string | null;
}

// ─── Manifest Section ───────────────────────────────────────────────────────

export interface ManifestSection {
  id: string;
  headerLabel: string | null;
  archetype: LayoutArchetype | string;  // string fallback for unknown archetypes
  panelBoundingBox?: { x: number; y: number; w: number; h: number };
  gridRows?: number;
  gridCols?: number;
  controls: string[];
  containerAssignment?: Record<string, string[] | Record<string, SubZone>>;
  heightSplits?: { cluster: number; anchor: number; gap: number };
  widthPercent?: number;
  complexity?: string;
}

// ─── Alignment Anchor ───────────────────────────────────────────────────────

export interface AlignmentAnchor {
  sourceId: string;
  targetId: string;
  axis: 'x' | 'y';
  tolerancePx: number;
}

// ─── Device Dimensions ──────────────────────────────────────────────────────

export interface DeviceDimensions {
  widthMm: number;
  depthMm: number;
}

// ─── Group Label ────────────────────────────────────────────────────────────

export interface GroupLabel {
  id: string;
  text: string;
  controlIds: string[];
  position: 'above' | 'below';
}

// ─── Density Targets ────────────────────────────────────────────────────────

export interface DensityTargets {
  vertical: string;
  horizontal: string;
  horizontalDeadSpaceMax: number;
}

// ─── Master Manifest ────────────────────────────────────────────────────────

export interface MasterManifest {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  layoutType: 'uniform-row' | 'grid' | 'asymmetric' | string;
  densityTargets?: DensityTargets;
  deviceDimensions?: DeviceDimensions;
  sections: ManifestSection[];
  controls: ManifestControl[];
  sharedElements?: unknown[];
  alignmentAnchors?: AlignmentAnchor[];
  groupLabels?: GroupLabel[];
}

// ─── SubZone Helpers ────────────────────────────────────────────────────────

export function subZoneControls(sz: SubZone): string[] {
  return Array.isArray(sz) ? sz : sz.controls;
}

export function subZoneDirection(sz: SubZone): 'row' | 'column' {
  return Array.isArray(sz) ? 'column' : sz.direction;
}
