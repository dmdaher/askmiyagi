/**
 * Tests for `isControlOutOfBounds` — the helper used by LayersPanel to
 * decide whether to show the red "outside canvas" badge.
 *
 * Background: prior to 2026-05-29, the bounds check used raw `control.w/h`,
 * ignoring `controlScale`. This produced false positives for any device
 * with `controlScale < 1` (e.g., XDJ-RR uses 0.65). A jog dial with stored
 * w=508 visually rendered at 508 × 0.65 = 330 px wide, but the validator
 * compared the raw 508 against canvasWidth — flagging controls the user
 * could clearly see inside the canvas.
 *
 * This regression test pins the scaled behavior so the bug class doesn't
 * recur on future canvas-bounds work.
 */
import { describe, it, expect } from 'vitest';
import { isControlOutOfBounds } from '../LayersPanel';

type Ctrl = { x: number; y: number; w: number; h: number };

describe('isControlOutOfBounds', () => {
  describe('controlScale = 1 (no scaling — legacy behavior preserved)', () => {
    it('returns false for a control fully inside canvas', () => {
      const c: Ctrl = { x: 100, y: 100, w: 200, h: 200 };
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(false);
    });

    it('returns true when right edge exceeds canvasWidth', () => {
      const c: Ctrl = { x: 1700, y: 100, w: 200, h: 200 };
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(true);
    });

    it('returns true when bottom edge exceeds canvasHeight', () => {
      const c: Ctrl = { x: 100, y: 1000, w: 200, h: 200 };
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(true);
    });

    it('returns true when x is negative (past left edge)', () => {
      const c: Ctrl = { x: -10, y: 100, w: 50, h: 50 };
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(true);
    });

    it('returns true when y is negative (past top edge)', () => {
      const c: Ctrl = { x: 100, y: -10, w: 50, h: 50 };
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(true);
    });

    it('exactly-flush right edge (x+w === canvasWidth) is INSIDE', () => {
      const c: Ctrl = { x: 1700, y: 100, w: 100, h: 100 };
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(false);
    });
  });

  describe('controlScale < 1 (XDJ-RR regression — bug fix)', () => {
    it('jog-dial that LOOKED out of bounds (raw 1832 > 1800) is correctly INSIDE when scaled', () => {
      // Real r-jog-dial values from XDJ-RR manifest 2026-05-29
      const c: Ctrl = { x: 1324, y: 478, w: 508, h: 629 };
      // Raw right edge: 1324 + 508 = 1832 → would FALSE-POSITIVE outside
      // Scaled right edge: 1324 + (508 × 0.65) = 1324 + 330 = 1654 → INSIDE
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(false);
    });

    it('r-master 6px over RAW is INSIDE when scaled by 0.65', () => {
      const c: Ctrl = { x: 1744, y: 580, w: 62, h: 62 };
      // Raw right: 1744 + 62 = 1806 → false positive
      // Scaled: 1744 + 40.3 = 1784.3 → inside
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(false);
    });

    it('crossfader 4px over RAW bottom is INSIDE when scaled', () => {
      const c: Ctrl = { x: 826, y: 1031, w: 246, h: 123 };
      // Raw bottom: 1031 + 123 = 1154 → false positive
      // Scaled bottom: 1031 + 80 = 1111 → inside
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(false);
    });

    it('truly out-of-bounds control (even scaled) is still flagged', () => {
      // A pad staged below the canvas by 100+ px (visually past canvas)
      const c: Ctrl = { x: 100, y: 1182, w: 76, h: 76 };
      // Scaled bottom: 1182 + 49 = 1231 → STILL 81px past 1150 → flagged correctly
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(true);
    });

    it('control with negative x is flagged regardless of scale', () => {
      const c: Ctrl = { x: -5, y: 100, w: 100, h: 100 };
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(true);
    });
  });

  describe('boundary edges with scale', () => {
    it('exactly-flush scaled right edge is INSIDE', () => {
      // x + w*scale === canvasWidth exactly
      const c: Ctrl = { x: 1500, y: 100, w: 461.5384615384615, h: 100 };
      // 1500 + (461.5384615384615 × 0.65) ≈ 1500 + 300 = 1800 exactly
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(false);
    });

    it('1px past scaled right edge IS flagged', () => {
      const c: Ctrl = { x: 1500, y: 100, w: 465, h: 100 };
      // 1500 + (465 × 0.65) = 1500 + 302.25 = 1802.25 → past 1800
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(true);
    });
  });

  describe('sub-pixel coordinates (drag math drift)', () => {
    it('handles sub-pixel positions without false positives', () => {
      const c: Ctrl = {
        x: 1324.0008544921875,  // real coord from XDJ-RR manifest
        y: 478.00018310546875,
        w: 508,
        h: 629,
      };
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(false);
    });
  });
});
