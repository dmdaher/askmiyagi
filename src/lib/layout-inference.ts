/**
 * Layout Inference Engine — Pure function that analyzes control positions
 * within each section and infers the best archetype + parameters.
 *
 * This is used in the "Approve & Build" flow to automatically detect
 * layout patterns from the editor's spatial arrangement of controls.
 *
 * No side effects — pure input/output.
 */

import type { SectionDef, ControlDef } from '@/components/panel-editor/store/manifestSlice';

// ─── Output Types ──────────────────────────────────────────────────────────

export interface InferredSection {
  sectionId: string;
  archetype: string;
  parameters: {
    gap?: number;
    padding?: number;
    gridCols?: number;
    gridRows?: number;
    alignment?: 'start' | 'center' | 'end';
  };
  confidence: number; // 0-1
}

export interface InferenceResult {
  sections: InferredSection[];
}

// ─── Internal Types ────────────────────────────────────────────────────────

interface ControlPos {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Candidate {
  archetype: string;
  parameters: InferredSection['parameters'];
  confidence: number;
}

// ─── Tolerance Constants ───────────────────────────────────────────────────

const Y_TOLERANCE = 8;  // Controls within 8px Y are considered same row
const X_TOLERANCE = 8;  // Controls within 8px X are considered same column
const GRID_SPACING_TOLERANCE = 0.3; // 30% variance in spacing is acceptable

// ─── Helper Functions ──────────────────────────────────────────────────────

/** Group controls into clusters where values are within tolerance */
function clusterByAxis(
  positions: ControlPos[],
  axis: 'x' | 'y',
  tolerance: number,
): ControlPos[][] {
  if (positions.length === 0) return [];

  // Sort by the axis value
  const sorted = [...positions].sort((a, b) => a[axis] - b[axis]);
  const clusters: ControlPos[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const currentCluster = clusters[clusters.length - 1];
    // Compare against the mean of the current cluster for robustness
    const clusterMean =
      currentCluster.reduce((sum, c) => sum + c[axis], 0) / currentCluster.length;

    if (Math.abs(sorted[i][axis] - clusterMean) <= tolerance) {
      currentCluster.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }

  return clusters;
}

/** Compute the average gap between sorted adjacent items on an axis */
function averageGap(positions: ControlPos[], axis: 'x' | 'y'): number {
  if (positions.length < 2) return 0;
  const sorted = [...positions].sort((a, b) => a[axis] - b[axis]);
  let totalGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1][axis] + (axis === 'x' ? sorted[i - 1].w : sorted[i - 1].h);
    totalGap += Math.max(0, sorted[i][axis] - prevEnd);
  }
  return totalGap / (sorted.length - 1);
}

/** Check if spacing is roughly uniform */
function isUniformSpacing(positions: ControlPos[], axis: 'x' | 'y'): boolean {
  if (positions.length < 3) return true; // 2 or fewer always "uniform"
  const sorted = [...positions].sort((a, b) => a[axis] - b[axis]);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1][axis] + (axis === 'x' ? sorted[i - 1].w : sorted[i - 1].h);
    gaps.push(sorted[i][axis] - prevEnd);
  }
  if (gaps.length === 0) return true;
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (mean === 0) return true;
  return gaps.every(g => Math.abs(g - mean) / mean <= GRID_SPACING_TOLERANCE);
}

/** Compute the variance of a value set */
function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

/** Compute median of an array */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Pattern Detectors ─────────────────────────────────────────────────────

function detectSingleRow(positions: ControlPos[]): Candidate | null {
  if (positions.length < 1) return null;

  const yValues = positions.map(p => p.y + p.h / 2); // use center Y
  const yVar = variance(yValues);

  // All controls have similar Y center (within tolerance)
  if (Math.sqrt(yVar) > Y_TOLERANCE) return null;

  const gap = averageGap(positions, 'x');
  const uniform = isUniformSpacing(positions, 'x');

  // Determine alignment from Y positions relative to each other
  const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  const topValues = positions.map(p => p.y);
  const topVar = variance(topValues);
  let alignment: 'start' | 'center' | 'end' = 'center';
  if (Math.sqrt(topVar) < Y_TOLERANCE) alignment = 'start'; // all tops aligned

  const confidence = uniform ? 0.95 : 0.7;

  return {
    archetype: 'single-row',
    parameters: {
      gap: Math.round(gap),
      alignment,
    },
    confidence: positions.length === 1 ? 0.5 : confidence, // single control is ambiguous
  };
}

function detectSingleColumn(positions: ControlPos[]): Candidate | null {
  if (positions.length < 2) return null;

  const xValues = positions.map(p => p.x + p.w / 2); // use center X
  const xVar = variance(xValues);

  // All controls have similar X center (within tolerance)
  if (Math.sqrt(xVar) > X_TOLERANCE) return null;

  const gap = averageGap(positions, 'y');
  const uniform = isUniformSpacing(positions, 'y');

  const confidence = uniform ? 0.95 : 0.7;

  return {
    archetype: 'single-column',
    parameters: {
      gap: Math.round(gap),
      alignment: 'center',
    },
    confidence,
  };
}

function detectGrid(positions: ControlPos[]): Candidate | null {
  if (positions.length < 4) return null;

  // Cluster by Y to find rows
  const rows = clusterByAxis(positions, 'y', Y_TOLERANCE);
  if (rows.length < 2) return null;

  // Cluster by X to find columns
  const cols = clusterByAxis(positions, 'x', X_TOLERANCE);
  if (cols.length < 2) return null;

  const numRows = rows.length;
  const numCols = cols.length;

  // Check that each row has approximately the same number of controls
  const rowSizes = rows.map(r => r.length);
  const colSizes = cols.map(c => c.length);

  // All rows should have the same count (or differ by at most 1 for partial grids)
  const maxRowSize = Math.max(...rowSizes);
  const minRowSize = Math.min(...rowSizes);
  if (maxRowSize - minRowSize > 1) return null;

  // Check uniform horizontal spacing within rows
  const rowSpacingUniform = rows.every(row => isUniformSpacing(row, 'x'));
  // Check uniform vertical spacing of rows
  const rowCenters = rows.map(row => {
    const ys = row.map(p => p.y + p.h / 2);
    return ys.reduce((a, b) => a + b, 0) / ys.length;
  });

  const gap = averageGap(positions, 'x');

  let confidence = 0.85;
  if (rowSpacingUniform) confidence += 0.05;
  if (minRowSize === maxRowSize) confidence += 0.05;
  confidence = Math.min(confidence, 0.98);

  return {
    archetype: 'grid-NxM',
    parameters: {
      gridCols: numCols,
      gridRows: numRows,
      gap: Math.round(gap),
    },
    confidence,
  };
}

function detectStackedRows(positions: ControlPos[]): Candidate | null {
  if (positions.length < 3) return null;

  // Cluster by Y to find rows
  const rows = clusterByAxis(positions, 'y', Y_TOLERANCE);
  if (rows.length < 2) return null;

  // Each row should have > 1 control spread horizontally
  const validRows = rows.filter(row => row.length > 0);
  if (validRows.length < 2) return null;

  // Unlike grid, rows can have different numbers of controls
  const rowSizes = validRows.map(r => r.length);
  const maxRowSize = Math.max(...rowSizes);
  const minRowSize = Math.min(...rowSizes);

  // If all rows have the same size, grid is a better fit
  if (maxRowSize === minRowSize && validRows.length >= 2 && maxRowSize >= 2) {
    // Could be either grid or stacked-rows; stacked-rows with lower confidence
    return {
      archetype: 'stacked-rows',
      parameters: {
        gap: Math.round(averageGap(positions, 'y')),
      },
      confidence: 0.6, // grid is preferred when rows are uniform
    };
  }

  const gap = averageGap(positions, 'y');
  const confidence = validRows.length >= 2 ? 0.8 : 0.5;

  return {
    archetype: 'stacked-rows',
    parameters: {
      gap: Math.round(gap),
    },
    confidence,
  };
}

function detectTransportPair(positions: ControlPos[]): Candidate | null {
  if (positions.length !== 2) return null;

  // Both controls should be large
  const areas = positions.map(p => p.w * p.h);
  const medianArea = median(areas);

  // Both should be "large" — each area >= 1.5x some baseline
  // Since there are only 2, compare each to a baseline of 48*48 = 2304
  const largeThreshold = 2304;
  if (!areas.every(a => a >= largeThreshold)) return null;

  // Should be stacked vertically: similar X, different Y
  const xValues = positions.map(p => p.x + p.w / 2);
  const xVar = variance(xValues);
  if (Math.sqrt(xVar) > X_TOLERANCE * 2) return null;

  // Vertically separated with generous spacing
  const yValues = positions.map(p => p.y);
  const yGap = Math.abs(yValues[0] - yValues[1]);
  if (yGap < 16) return null;

  const gap = averageGap(positions, 'y');

  return {
    archetype: 'transport-pair',
    parameters: {
      gap: Math.round(gap),
      alignment: 'center',
    },
    confidence: 0.9,
  };
}

// ─── Main Inference Function ───────────────────────────────────────────────

function inferSection(
  section: SectionDef,
  controls: Record<string, ControlDef>,
): InferredSection {
  const childControls = section.childIds
    .map(id => controls[id])
    .filter((c): c is ControlDef => c !== undefined);

  if (childControls.length === 0) {
    return {
      sectionId: section.id,
      archetype: 'single-row',
      parameters: { gap: 4 },
      confidence: 0,
    };
  }

  // Build position array relative to the section
  const positions: ControlPos[] = childControls.map(c => ({
    id: c.id,
    x: c.x,
    y: c.y,
    w: c.w,
    h: c.h,
  }));

  if (positions.length === 1) {
    // Single control — default to single-row
    return {
      sectionId: section.id,
      archetype: 'single-row',
      parameters: { gap: 4 },
      confidence: 0.5,
    };
  }

  // Run all detectors
  const candidates: Candidate[] = [];

  const transportPair = detectTransportPair(positions);
  if (transportPair) candidates.push(transportPair);

  const singleRow = detectSingleRow(positions);
  if (singleRow) candidates.push(singleRow);

  const singleColumn = detectSingleColumn(positions);
  if (singleColumn) candidates.push(singleColumn);

  const grid = detectGrid(positions);
  if (grid) candidates.push(grid);

  const stackedRows = detectStackedRows(positions);
  if (stackedRows) candidates.push(stackedRows);

  // Pick the highest confidence candidate
  if (candidates.length === 0) {
    // Fallback: absolute positioning
    return {
      sectionId: section.id,
      archetype: 'absolute',
      parameters: {},
      confidence: 0,
    };
  }

  // Sort by confidence descending, prefer more specific archetypes on tie
  candidates.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) < 0.01) {
      // On tie, prefer more specific: grid > stacked-rows > single-column > single-row
      const specificity: Record<string, number> = {
        'transport-pair': 5,
        'grid-NxM': 4,
        'stacked-rows': 3,
        'single-column': 2,
        'single-row': 1,
        'absolute': 0,
      };
      return (specificity[b.archetype] ?? 0) - (specificity[a.archetype] ?? 0);
    }
    return b.confidence - a.confidence;
  });

  const best = candidates[0];

  return {
    sectionId: section.id,
    archetype: best.archetype,
    parameters: best.parameters,
    confidence: best.confidence,
  };
}

/**
 * Analyze control positions within each section and infer the best
 * archetype + parameters. Pure function — no side effects.
 */
export function inferLayout(
  sections: Record<string, SectionDef>,
  controls: Record<string, ControlDef>,
): InferenceResult {
  const result: InferredSection[] = [];

  for (const section of Object.values(sections)) {
    result.push(inferSection(section, controls));
  }

  // Sort by section ID for deterministic ordering
  result.sort((a, b) => a.sectionId.localeCompare(b.sectionId));

  return { sections: result };
}

// ─── Geometry Cleanup (Linter) ────────────────────────────────────────────

export interface CleanedControl {
  id: string;
  x: number;  // cleaned pixel X
  y: number;  // cleaned pixel Y
  w: number;  // cleaned width
  h: number;  // cleaned height
}

export interface CleanedSection {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  controls: CleanedControl[];
}

export interface GeometryCleanupResult {
  sections: CleanedSection[];
  canvasWidth: number;
  canvasHeight: number;
}

/** Snap tolerance: controls within this many pixels are considered aligned */
const SNAP_TOLERANCE = 8;

/** Size normalization tolerance: sizes within 10% are normalized to average */
const SIZE_NORM_TOLERANCE = 0.10;

/** Gap normalization tolerance: gaps within this many pixels are normalized */
const GAP_TOLERANCE = 6;

/** Edge padding snap tolerance: controls near section edge snap to consistent padding */
const EDGE_SNAP_TOLERANCE = 10;

/** Section auto-fit padding in pixels */
const SECTION_PAD = 8;

/**
 * Geometry cleanup pass — cleans up sloppy pixel positions without
 * detecting archetypes. This is the simplified "geometry linter" that
 * replaces archetype detection for the editor → preview pipeline.
 *
 * Performs:
 * - Row snapping: controls within 8px of same Y center → snap to average Y
 * - Column snapping: controls within 8px of same X center → snap to average X
 * - Size normalization: same-type controls within 10% size → normalize to average
 * - Section auto-fit: recompute section bounds to tightly wrap controls + 8px padding
 *
 * Pure function — no side effects.
 */
export function cleanupGeometry(
  sections: Record<string, SectionDef>,
  controls: Record<string, ControlDef>,
  canvasWidth: number,
  canvasHeight: number,
): GeometryCleanupResult {
  // Build a mutable copy of all controls keyed by ID
  const cleanedControls = new Map<string, CleanedControl>();
  for (const ctrl of Object.values(controls)) {
    cleanedControls.set(ctrl.id, {
      id: ctrl.id,
      x: ctrl.x,
      y: ctrl.y,
      w: ctrl.w,
      h: ctrl.h,
    });
  }

  // Process each section independently
  const cleanedSections: CleanedSection[] = [];

  for (const section of Object.values(sections)) {
    const childIds = section.childIds;
    const sectionControls = childIds
      .map(id => cleanedControls.get(id))
      .filter((c): c is CleanedControl => c !== undefined);

    if (sectionControls.length === 0) {
      cleanedSections.push({
        id: section.id,
        x: section.x,
        y: section.y,
        w: section.w,
        h: section.h,
        controls: [],
      });
      continue;
    }

    // ── Row snapping: snap Y centers within SNAP_TOLERANCE ──────────
    snapAxis(sectionControls, 'y');

    // ── Column snapping: snap X centers within SNAP_TOLERANCE ────────
    snapAxis(sectionControls, 'x');

    // ── Size normalization per type ─────────────────────────────────
    // Group by control type (looked up from the original controls record)
    const typeGroups = new Map<string, CleanedControl[]>();
    for (const cc of sectionControls) {
      const original = controls[cc.id];
      const type = original?.type ?? 'unknown';
      if (!typeGroups.has(type)) typeGroups.set(type, []);
      typeGroups.get(type)!.push(cc);
    }

    for (const group of typeGroups.values()) {
      if (group.length < 2) continue;
      normalizeSizes(group);
    }

    // ── Equal spacing: normalize gaps in rows/columns ──────────────
    equalizeSpacing(sectionControls, 'x');
    equalizeSpacing(sectionControls, 'y');

    // ── Center alignment: snap controls near section center ────────
    centerSnapControls(sectionControls, section);

    // ── Edge alignment: snap controls near section edges ──────────
    edgeSnapControls(sectionControls, section);

    // ── Section auto-fit ────────────────────────────────────────────
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of sectionControls) {
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x + c.w > maxX) maxX = c.x + c.w;
      if (c.y + c.h > maxY) maxY = c.y + c.h;
    }

    cleanedSections.push({
      id: section.id,
      x: minX - SECTION_PAD,
      y: minY - SECTION_PAD,
      w: (maxX - minX) + SECTION_PAD * 2,
      h: (maxY - minY) + SECTION_PAD * 2,
      controls: sectionControls,
    });
  }

  // Sort by section ID for deterministic output
  cleanedSections.sort((a, b) => a.id.localeCompare(b.id));

  return {
    sections: cleanedSections,
    canvasWidth,
    canvasHeight,
  };
}

/**
 * Snap control centers on the given axis. Controls whose center values
 * are within SNAP_TOLERANCE of each other get snapped to the average center,
 * then repositioned so their center lands on the average.
 */
function snapAxis(controls: CleanedControl[], axis: 'x' | 'y'): void {
  const sizeKey = axis === 'x' ? 'w' : 'h';

  // Compute centers
  const centers = controls.map(c => c[axis] + c[sizeKey] / 2);

  // Cluster centers
  const assigned = new Set<number>();
  for (let i = 0; i < controls.length; i++) {
    if (assigned.has(i)) continue;

    const cluster: number[] = [i];
    assigned.add(i);

    for (let j = i + 1; j < controls.length; j++) {
      if (assigned.has(j)) continue;
      if (Math.abs(centers[j] - centers[i]) <= SNAP_TOLERANCE) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    if (cluster.length < 2) continue;

    // Compute average center
    const avgCenter = cluster.reduce((sum, idx) => sum + centers[idx], 0) / cluster.length;

    // Reposition each control so its center is at the average
    for (const idx of cluster) {
      controls[idx][axis] = avgCenter - controls[idx][sizeKey] / 2;
    }
  }
}

/**
 * Within a group of same-type controls, if widths are within SIZE_NORM_TOLERANCE
 * of each other, normalize them all to the average. Same for heights.
 */
function normalizeSizes(group: CleanedControl[]): void {
  // Normalize widths
  const widths = group.map(c => c.w);
  const avgW = widths.reduce((a, b) => a + b, 0) / widths.length;
  const wWithinTolerance = widths.every(w => Math.abs(w - avgW) / avgW <= SIZE_NORM_TOLERANCE);
  if (wWithinTolerance && avgW > 0) {
    const roundedW = Math.round(avgW);
    for (const c of group) {
      c.w = roundedW;
    }
  }

  // Normalize heights
  const heights = group.map(c => c.h);
  const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
  const hWithinTolerance = heights.every(h => Math.abs(h - avgH) / avgH <= SIZE_NORM_TOLERANCE);
  if (hWithinTolerance && avgH > 0) {
    const roundedH = Math.round(avgH);
    for (const c of group) {
      c.h = roundedH;
    }
  }
}

/**
 * Equalize spacing: if controls are in a row (same Y) or column (same X),
 * and the gaps between them are similar, normalize to equal spacing.
 */
function equalizeSpacing(controls: CleanedControl[], axis: 'x' | 'y'): void {
  const sizeKey = axis === 'x' ? 'w' : 'h';
  const centerKey = axis;

  // Find rows/columns (controls with same center on the perpendicular axis)
  const perpAxis = axis === 'x' ? 'y' : 'x';
  const perpSize = axis === 'x' ? 'h' : 'w';

  // Group into rows/columns
  const groups: CleanedControl[][] = [];
  const assigned = new Set<string>();

  for (const ctrl of controls) {
    if (assigned.has(ctrl.id)) continue;
    const center = ctrl[perpAxis] + ctrl[perpSize] / 2;
    const group = [ctrl];
    assigned.add(ctrl.id);

    for (const other of controls) {
      if (assigned.has(other.id)) continue;
      const otherCenter = other[perpAxis] + other[perpSize] / 2;
      if (Math.abs(otherCenter - center) <= SNAP_TOLERANCE) {
        group.push(other);
        assigned.add(other.id);
      }
    }
    if (group.length >= 2) groups.push(group);
  }

  // For each row/column, equalize gaps
  for (const group of groups) {
    // Sort by position on the primary axis
    group.sort((a, b) => a[centerKey] - b[centerKey]);

    // Compute gaps between adjacent controls
    const gaps: number[] = [];
    for (let i = 1; i < group.length; i++) {
      const prevEnd = group[i - 1][centerKey] + group[i - 1][sizeKey];
      const nextStart = group[i][centerKey];
      gaps.push(nextStart - prevEnd);
    }

    if (gaps.length === 0) continue;

    // Check if gaps are similar (within GAP_TOLERANCE)
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const allSimilar = gaps.every(g => Math.abs(g - avgGap) <= GAP_TOLERANCE);

    if (allSimilar && avgGap >= 0) {
      // Normalize: redistribute controls with equal gaps
      const roundedGap = Math.round(avgGap);
      let currentPos = group[0][centerKey]; // keep first control's position
      for (let i = 1; i < group.length; i++) {
        currentPos = group[i - 1][centerKey] + group[i - 1][sizeKey] + roundedGap;
        group[i][centerKey] = currentPos;
      }
    }
  }
}

/**
 * Center alignment: if a control is nearly centered horizontally or
 * vertically within its section, snap it to exact center.
 */
function centerSnapControls(controls: CleanedControl[], section: SectionDef): void {
  const sectionCenterX = section.x + section.w / 2;
  const sectionCenterY = section.y + section.h / 2;

  for (const ctrl of controls) {
    const ctrlCenterX = ctrl.x + ctrl.w / 2;
    const ctrlCenterY = ctrl.y + ctrl.h / 2;

    // Snap to horizontal center if close
    if (Math.abs(ctrlCenterX - sectionCenterX) <= SNAP_TOLERANCE) {
      ctrl.x = sectionCenterX - ctrl.w / 2;
    }

    // Snap to vertical center if close
    if (Math.abs(ctrlCenterY - sectionCenterY) <= SNAP_TOLERANCE) {
      ctrl.y = sectionCenterY - ctrl.h / 2;
    }
  }
}

/**
 * Edge alignment: controls near section edges snap to consistent padding.
 * If multiple controls are near the left/right/top/bottom edge,
 * they all get the same padding from that edge.
 */
function edgeSnapControls(controls: CleanedControl[], section: SectionDef): void {
  // Left edge
  const nearLeft = controls.filter(c => Math.abs(c.x - section.x) <= EDGE_SNAP_TOLERANCE);
  if (nearLeft.length >= 2) {
    const avgPad = nearLeft.reduce((sum, c) => sum + (c.x - section.x), 0) / nearLeft.length;
    const pad = Math.round(avgPad);
    for (const c of nearLeft) c.x = section.x + pad;
  }

  // Top edge
  const nearTop = controls.filter(c => Math.abs(c.y - section.y) <= EDGE_SNAP_TOLERANCE);
  if (nearTop.length >= 2) {
    const avgPad = nearTop.reduce((sum, c) => sum + (c.y - section.y), 0) / nearTop.length;
    const pad = Math.round(avgPad);
    for (const c of nearTop) c.y = section.y + pad;
  }

  // Right edge
  const sectionRight = section.x + section.w;
  const nearRight = controls.filter(c => Math.abs((c.x + c.w) - sectionRight) <= EDGE_SNAP_TOLERANCE);
  if (nearRight.length >= 2) {
    const avgPad = nearRight.reduce((sum, c) => sum + (sectionRight - (c.x + c.w)), 0) / nearRight.length;
    const pad = Math.round(avgPad);
    for (const c of nearRight) c.x = sectionRight - c.w - pad;
  }

  // Bottom edge
  const sectionBottom = section.y + section.h;
  const nearBottom = controls.filter(c => Math.abs((c.y + c.h) - sectionBottom) <= EDGE_SNAP_TOLERANCE);
  if (nearBottom.length >= 2) {
    const avgPad = nearBottom.reduce((sum, c) => sum + (sectionBottom - (c.y + c.h)), 0) / nearBottom.length;
    const pad = Math.round(avgPad);
    for (const c of nearBottom) c.y = sectionBottom - c.h - pad;
  }
}
