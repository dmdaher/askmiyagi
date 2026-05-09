import { describe, it, expect } from 'vitest';
import {
  computeKeyboardLayout,
  computeTotalWhiteKeys,
  KEY_ASPECT,
} from '../keyboard-layout';

describe('computeTotalWhiteKeys', () => {
  it('returns 29 white keys for a 49-key C2 keyboard (C2 through C6 inclusive)', () => {
    expect(computeTotalWhiteKeys(49, 'C2')).toBe(29);
  });
  it('returns 36 white keys for a 61-key C2 keyboard', () => {
    expect(computeTotalWhiteKeys(61, 'C2')).toBe(36);
  });
  it('returns 52 white keys for an 88-key A0 keyboard', () => {
    expect(computeTotalWhiteKeys(88, 'A0')).toBe(52);
  });
  it('handles invalid input', () => {
    expect(computeTotalWhiteKeys(0, 'C2')).toBe(0);
    expect(computeTotalWhiteKeys(-1, 'C2')).toBe(0);
  });
});

describe('computeKeyboardLayout', () => {
  it('locks aspect at 6.6 when canvas has room', () => {
    // Canvas tall enough that desired keyboard height fits comfortably
    const layout = computeKeyboardLayout({
      canvasWidth: 1500,
      canvasHeight: 1500,
      widthPercent: 100,
      keys: 49,
      startNote: 'C2',
    });
    const whiteKeyWidth = layout.keyboardWidth / layout.totalWhiteKeys;
    const aspect = layout.keyboardHeight / whiteKeyWidth;
    expect(layout.isAspectLocked).toBe(true);
    expect(aspect).toBeCloseTo(KEY_ASPECT, 1);
  });

  it('clamps and reports unlocked when canvas is too short', () => {
    // 2680 wide × 699 tall — actual deepmind-12 today.
    // Desired keyboard height = 2680/29 × 6.6 = 610 px
    // Canvas-height cap (45%) = 699 × 0.45 = 314.6 px → clamped here
    const layout = computeKeyboardLayout({
      canvasWidth: 2680,
      canvasHeight: 699,
      widthPercent: 100,
      keys: 49,
      startNote: 'C2',
    });
    expect(layout.isAspectLocked).toBe(false);
    // Keyboard height clamped to 45% of canvas height
    expect(layout.keyboardHeight).toBeCloseTo(699 * 0.45, 1);
    // Desired should be larger than clamp (proves clamp engaged)
    expect(layout.desiredHeight).toBeGreaterThan(layout.keyboardHeight);
  });

  it('halves keyboard size when widthPercent is 50', () => {
    const full = computeKeyboardLayout({
      canvasWidth: 1500,
      canvasHeight: 1500,
      widthPercent: 100,
      keys: 49,
      startNote: 'C2',
    });
    const half = computeKeyboardLayout({
      canvasWidth: 1500,
      canvasHeight: 1500,
      widthPercent: 50,
      keys: 49,
      startNote: 'C2',
    });
    expect(half.keyboardWidth).toBeCloseTo(full.keyboardWidth / 2, 1);
    expect(half.keyboardHeight).toBeCloseTo(full.keyboardHeight / 2, 1);
    // Aspect preserved
    const halfWhiteKeyWidth = half.keyboardWidth / half.totalWhiteKeys;
    expect(half.keyboardHeight / halfWhiteKeyWidth).toBeCloseTo(KEY_ASPECT, 1);
  });

  it('returns sane defaults for invalid input', () => {
    const layout = computeKeyboardLayout({
      canvasWidth: 0,
      canvasHeight: 1000,
      widthPercent: 100,
      keys: 49,
      startNote: 'C2',
    });
    expect(layout.keyboardWidth).toBe(0);
    expect(layout.keyboardHeight).toBe(0);
    expect(layout.desiredHeight).toBe(0);
  });

  it('computes panelHeightPercent consistently with keyboardHeight', () => {
    const layout = computeKeyboardLayout({
      canvasWidth: 2680,
      canvasHeight: 1218,
      widthPercent: 73,
      keys: 49,
      startNote: 'C2',
    });
    // Sanity: panelHeightPercent + keyboardHeight/canvasHeight × 100 = 100
    const totalPercent = layout.panelHeightPercent + (layout.keyboardHeight / 1218) * 100;
    expect(totalPercent).toBeCloseTo(100, 1);
  });

  it('confirms the saved-plan 62% claim falls out automatically at correct canvas dims', () => {
    // The saved plan said panelHeightPercent: 62 was the target for DeepMind-12.
    // With canvas matching real instrument proportions (~840mm × 382mm = 2.2 ratio)
    // and widthPercent ≈ 73 (real keyboard is ~73% of instrument width), the
    // computed panelHeightPercent should land near 62.
    const layout = computeKeyboardLayout({
      canvasWidth: 2680,
      canvasHeight: 1218, // 2.2 ratio approximation
      widthPercent: 73,
      keys: 49,
      startNote: 'C2',
    });
    // Allow a few percentage points of tolerance for rounding.
    expect(layout.panelHeightPercent).toBeGreaterThan(55);
    expect(layout.panelHeightPercent).toBeLessThan(70);
    expect(layout.isAspectLocked).toBe(true);
  });
});

// computeAutoFitTarget tests removed alongside the function (2026-05-08).
// Editor reverted to free-form keyboard sizing; auto-fit is gone.
