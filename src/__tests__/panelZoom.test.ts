import { describe, it, expect } from 'vitest';
import { getZoomTarget, computeZoomTransform } from '@/lib/panelZoom';
import { fantom08ZoomConfig } from '@/lib/devices/fantom-08-zoom';

const { panelWidth, panelHeight } = fantom08ZoomConfig;

describe('getZoomTarget', () => {
  it('returns null for empty array', () => {
    expect(getZoomTarget([], fantom08ZoomConfig)).toBeNull();
  });

  it('returns section center for a single zone control', () => {
    const result = getZoomTarget(['zone-1'], fantom08ZoomConfig);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(22); // zone section x
    expect(result!.y).toBe(50); // zone section y
    expect(result!.sectionKey).toBe('zone');
  });

  it('returns section center for a pad control', () => {
    const result = getZoomTarget(['pad-1'], fantom08ZoomConfig);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(88); // pad section x
    expect(result!.y).toBe(30); // pad section y
    expect(result!.sectionKey).toBe('pad');
  });

  it('returns centroid for controls across 2 sections', () => {
    // zone (22, 50) + common (55, 50) → centroid (38.5, 50)
    const result = getZoomTarget(['zone-1', 'menu'], fantom08ZoomConfig);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(38.5);
    expect(result!.y).toBe(50);
    expect(result!.sectionKey).toBe('common|zone');
  });

  it('returns centroid for controls across 3 sections', () => {
    // zone (22, 50) + common (55, 50) + pad (88, 30) → centroid (55, 43.33...)
    const result = getZoomTarget(['zone-1', 'menu', 'pad-1'], fantom08ZoomConfig);
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(55, 0);
    expect(result!.y).toBeCloseTo(43.3, 0);
    expect(result!.sectionKey).toBe('common|pad|zone');
  });

  it('returns null for controls across 4+ sections', () => {
    const result = getZoomTarget(['zone-1', 'menu', 'pad-1', 'wheel-1'], fantom08ZoomConfig);
    expect(result).toBeNull();
  });

  it('handles display special case', () => {
    const result = getZoomTarget(['display'], fantom08ZoomConfig);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(42); // display section x
    expect(result!.y).toBe(40); // display section y
    expect(result!.sectionKey).toBe('display');
  });

  it('handles lcd-display special case', () => {
    const result = getZoomTarget(['lcd-display'], fantom08ZoomConfig);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(42);
    expect(result!.y).toBe(40);
    expect(result!.sectionKey).toBe('display');
  });

  it('returns null for unknown control IDs', () => {
    const result = getZoomTarget(['nonexistent-control', 'also-fake'], fantom08ZoomConfig);
    expect(result).toBeNull();
  });

  it('deduplicates section points in centroid', () => {
    // Two controls in the same section should produce the section center, not double-count
    const single = getZoomTarget(['zone-1'], fantom08ZoomConfig);
    const double = getZoomTarget(['zone-1', 'zone-2'], fantom08ZoomConfig);
    expect(single).toEqual(double);
  });
});

describe('computeZoomTransform', () => {
  it('returns scale 0 for zero container size', () => {
    const result = computeZoomTransform(null, 0, 0, panelWidth, panelHeight);
    expect(result.scale).toBe(0);
  });

  it('base state (no target): scale = containerWidth/panelWidth, centered vertically', () => {
    const cw = 1200;
    const ch = 800;
    const result = computeZoomTransform(null, cw, ch, panelWidth, panelHeight);
    const expectedScale = cw / panelWidth;
    expect(result.scale).toBeCloseTo(expectedScale, 6);
    expect(result.x).toBe(0);
    // Vertical centering: (ch - PANEL_HEIGHT * scale) / 2
    const expectedY = (ch - panelHeight * expectedScale) / 2;
    expect(result.y).toBeCloseTo(expectedY, 4);
  });

  it('zoomed state: target centered, clamped to edges', () => {
    const cw = 1200;
    const ch = 800;
    const target = { x: 50, y: 50, sectionKey: 'display' };
    const result = computeZoomTransform(target, cw, ch, panelWidth, panelHeight);
    // Zoomed scale should be > base scale
    const baseScale = cw / panelWidth;
    expect(result.scale).toBeGreaterThan(baseScale);
    expect(result.scale).toBeLessThanOrEqual(0.8);
  });

  it('edge clamping: far-right target (pads) does not create left gap', () => {
    const cw = 1200;
    const ch = 800;
    const target = { x: 88, y: 30, sectionKey: 'pad' };
    const result = computeZoomTransform(target, cw, ch, panelWidth, panelHeight);
    // X should be >= containerWidth - panelWidth * scale (minX)
    const minX = cw - panelWidth * result.scale;
    expect(result.x).toBeGreaterThanOrEqual(minX - 0.001);
    // X should be <= 0
    expect(result.x).toBeLessThanOrEqual(0.001);
  });

  it('edge clamping: far-left target (controller) does not create right gap', () => {
    const cw = 1200;
    const ch = 800;
    const target = { x: 3, y: 50, sectionKey: 'controller' };
    const result = computeZoomTransform(target, cw, ch, panelWidth, panelHeight);
    // X clamped to max 0 (no right gap)
    expect(result.x).toBeLessThanOrEqual(0.001);
    // With a far-left target, X should be 0 (clamped at left edge)
    expect(result.x).toBe(0);
  });

  it('dynamic cap — small screen (1366px): zoomedScale = 0.8', () => {
    const cw = 1366;
    const ch = 768;
    const target = { x: 50, y: 50, sectionKey: 'display' };
    const result = computeZoomTransform(target, cw, ch, panelWidth, panelHeight);
    const baseScale = cw / panelWidth; // ~0.5117
    // baseScale * 1.6 = ~0.819, min(0.819, 0.8) = 0.8, max(0.5117, 0.8) = 0.8
    expect(result.scale).toBeCloseTo(0.8, 2);
    expect(result.scale).toBeGreaterThan(baseScale);
  });

  it('dynamic cap — large screen (2560px): zoomedScale = max(baseScale, 0.8) = baseScale', () => {
    const cw = 2560;
    const ch = 1440;
    const target = { x: 50, y: 50, sectionKey: 'display' };
    const result = computeZoomTransform(target, cw, ch, panelWidth, panelHeight);
    const baseScale = cw / panelWidth; // ~0.948
    // baseScale * 1.6 = ~1.517, min(1.517, 0.8) = 0.8, max(0.948, 0.8) = 0.948
    expect(result.scale).toBeCloseTo(baseScale, 4);
  });

  it('very large screen (2800px+): baseScale >= 1.0', () => {
    const cw = 2800;
    const ch = 1500;
    const result = computeZoomTransform(null, cw, ch, panelWidth, panelHeight);
    const baseScale = cw / panelWidth; // 2800/2700 ≈ 1.037
    expect(result.scale).toBeCloseTo(baseScale, 4);
    // When zoomed on a very large screen
    const target = { x: 50, y: 50, sectionKey: 'display' };
    const zoomed = computeZoomTransform(target, cw, ch, panelWidth, panelHeight);
    // baseScale > 1 so max(baseScale, ...) = baseScale
    expect(zoomed.scale).toBeCloseTo(baseScale, 4);
  });
});
