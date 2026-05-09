import { describe, it, expect } from 'vitest';
import {
  computeKeyboardLayout,
  computeAutoFitTarget,
  computeTotalWhiteKeys,
  KEY_ASPECT,
  MIN_CONTROLS_PX,
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
    // Canvas-height cap (65%) = 699 × 0.65 = 454.4 px → clamped here
    const layout = computeKeyboardLayout({
      canvasWidth: 2680,
      canvasHeight: 699,
      widthPercent: 100,
      keys: 49,
      startNote: 'C2',
    });
    expect(layout.isAspectLocked).toBe(false);
    // Keyboard height clamped to 65% of canvas height
    expect(layout.keyboardHeight).toBeCloseTo(699 * 0.65, 1);
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

describe('computeAutoFitTarget', () => {
  it('preserves canvas width and grows height to fit desired keyboard', () => {
    const target = computeAutoFitTarget({
      canvasWidth: 2680,
      canvasHeight: 699,
      desiredHeight: 707,
      controlsAreaHeight: 200,
    });
    expect(target.newCanvasWidth).toBe(2680);
    // 707 + 200 = 907 (controls-preserve path)
    // 707 / 0.65 = 1087.7 (ratio-preserve path)
    // max = 1087.7 → rounds to 1088
    expect(target.newCanvasHeight).toBe(1088);
  });

  it('uses MIN_CONTROLS_PX floor when current controls area is too small', () => {
    const target = computeAutoFitTarget({
      canvasWidth: 1000,
      canvasHeight: 100,
      desiredHeight: 500,
      controlsAreaHeight: 5, // tiny
    });
    // controls-preserve: 500 + max(5, 30) = 530
    // ratio-preserve:   500 / 0.65 = 769.2
    // max = 769.2 → 769
    expect(target.newCanvasHeight).toBe(769);
  });

  it('the resulting canvasHeight makes computeKeyboardLayout aspect-locked', () => {
    // After Auto-fit, recomputing layout with the new canvas should produce
    // isAspectLocked === true. This is the round-trip invariant.
    const initial = computeKeyboardLayout({
      canvasWidth: 2680,
      canvasHeight: 400, // way too short
      widthPercent: 100,
      keys: 49,
      startNote: 'C2',
    });
    expect(initial.isAspectLocked).toBe(false);
    const target = computeAutoFitTarget({
      canvasWidth: 2680,
      canvasHeight: 400,
      desiredHeight: initial.desiredHeight,
      controlsAreaHeight: initial.controlsAreaHeight,
    });
    const recomputed = computeKeyboardLayout({
      canvasWidth: target.newCanvasWidth,
      canvasHeight: target.newCanvasHeight,
      widthPercent: 100,
      keys: 49,
      startNote: 'C2',
    });
    expect(recomputed.isAspectLocked).toBe(true);
  });
});
