import { describe, it, expect } from 'vitest';
import {
  computeControlScaleFromControls,
  computeControlScaleFromDeviceDims,
  __PHASE_10_CONSTANTS,
} from '../control-scale';

type Sample = { type: string; w: number; h: number };

function knobs(count: number, w: number): Sample[] {
  return Array.from({ length: count }, () => ({ type: 'knob', w, h: w }));
}
function buttons(count: number, w: number): Sample[] {
  return Array.from({ length: count }, () => ({ type: 'button', w, h: w }));
}

// Synthetic fixtures based on REAL median bbox widths measured from each
// device's manifest-editor.json on 2026-05-16.
function fixture(medianW: number, count = 10): Sample[] {
  const half = Math.floor(count / 2);
  return [...knobs(half, medianW), ...buttons(count - half, medianW)];
}

describe('computeControlScaleFromControls — calibrated to 7 known instruments', () => {
  it('fantom-06 (real median 108px) → 0.37', () => {
    expect(computeControlScaleFromControls(fixture(108))).toBe(0.37);
  });

  it('cdj-3000 (real median 44px) → 0.91', () => {
    expect(computeControlScaleFromControls(fixture(44))).toBe(0.91);
  });

  it('deepmind-12 (real median 40px) → 1.0 (already on target)', () => {
    expect(computeControlScaleFromControls(fixture(40))).toBe(__PHASE_10_CONSTANTS.MAX_SCALE);
  });

  it('dj-xdj-rr (real median 62px) → 0.65 (the Phase 10.1 fix target)', () => {
    expect(computeControlScaleFromControls(fixture(62))).toBe(0.65);
  });

  it('dj-xdj-rx3 (real median 48px) → 0.83', () => {
    expect(computeControlScaleFromControls(fixture(48))).toBe(0.83);
  });

  it('minimoog (real median 28px) → clamps to 1.0', () => {
    expect(computeControlScaleFromControls(fixture(28))).toBe(__PHASE_10_CONSTANTS.MAX_SCALE);
  });

  it('alphatheta-cdj3000x (real median ~111px) → 0.36', () => {
    expect(computeControlScaleFromControls(fixture(111))).toBe(0.36);
  });
});

describe('computeControlScaleFromControls — guard rails', () => {
  it('returns null when controls array is null', () => {
    expect(computeControlScaleFromControls(null)).toBeNull();
  });

  it('returns null when controls array is undefined', () => {
    expect(computeControlScaleFromControls(undefined)).toBeNull();
  });

  it('returns null when controls array is empty', () => {
    expect(computeControlScaleFromControls([])).toBeNull();
  });

  it('returns null when fewer than 3 button/knob samples', () => {
    expect(computeControlScaleFromControls(knobs(2, 40))).toBeNull();
  });

  it('ignores non-button/knob types when counting samples', () => {
    const sample = [
      { type: 'led', w: 10, h: 10 },
      { type: 'led', w: 10, h: 10 },
      { type: 'led', w: 10, h: 10 },
      { type: 'knob', w: 40, h: 40 },
      { type: 'button', w: 40, h: 40 },
    ];
    expect(computeControlScaleFromControls(sample)).toBeNull();
  });

  it('skips zero-width controls when sampling', () => {
    const sample = [
      { type: 'knob', w: 0, h: 0 },
      { type: 'knob', w: 0, h: 0 },
      { type: 'knob', w: 40, h: 40 },
      { type: 'knob', w: 40, h: 40 },
      { type: 'knob', w: 40, h: 40 },
    ];
    expect(computeControlScaleFromControls(sample)).toBe(1.0);
  });
});

describe('computeControlScaleFromControls — bounds and rounding', () => {
  it('clamps at MIN_SCALE (0.15) for huge controls', () => {
    expect(computeControlScaleFromControls(knobs(10, 500))).toBe(__PHASE_10_CONSTANTS.MIN_SCALE);
  });

  it('clamps at MAX_SCALE (1.0) for tiny controls', () => {
    expect(computeControlScaleFromControls(knobs(10, 5))).toBe(__PHASE_10_CONSTANTS.MAX_SCALE);
  });

  it('returns value rounded to 2 decimal places', () => {
    const scale = computeControlScaleFromControls(knobs(10, 73));
    expect(scale).not.toBeNull();
    const decimals = scale!.toString().includes('.')
      ? scale!.toString().split('.')[1].length
      : 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});

describe('computeControlScaleFromDeviceDims — deprecated, no-op', () => {
  it('always returns null (so any stale caller no-ops the auto-fit)', () => {
    expect(
      computeControlScaleFromDeviceDims({ widthMm: 997, depthMm: 300 }, 1875),
    ).toBeNull();
    expect(computeControlScaleFromDeviceDims(null, null)).toBeNull();
  });
});
