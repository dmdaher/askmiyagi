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

type Ctrl = { x: number; y: number; w: number; h: number; rotation?: number };

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

  describe('rotated controls (rotation handling — bug fix v2)', () => {
    it('square rotated 90° has same AABB (no change)', () => {
      const c: Ctrl = { x: 100, y: 100, w: 80, h: 80, rotation: 90 };
      // Square rotation is a no-op for AABB
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(false);
    });

    it('wide rectangle rotated 90° becomes tall — flagged if extends past bottom', () => {
      // 200×50 placed near bottom: unrotated fits, rotated (50×200) overflows
      const c: Ctrl = { x: 100, y: 1000, w: 200, h: 50, rotation: 90 };
      // Unrotated bbox: x=100, y=1000, w=200, h=50 → bot=1050 (inside)
      // Rotated 90°: w=50, h=200, center=(200,1025) → new bbox y=925, bot=1125 (inside)
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(false);
    });

    it('wide rectangle rotated 90° AT THE BOTTOM extends past canvas — correctly flagged', () => {
      // 200×50 placed where rotation pushes bottom past canvas
      const c: Ctrl = { x: 100, y: 1100, w: 200, h: 50, rotation: 90 };
      // Unrotated bbox: bot=1150 (exactly flush) → would pass raw check
      // Rotated 90°: center=(200, 1125), new bbox y=1025, h=200 → bot=1225 → 75 past
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(true);
    });

    it('XDJ-RR crossfader: rotation=90, controlScale=0.65 — visible AABB inside canvas (regression)', () => {
      // Real crossfader data from XDJ-RR manifest (with rotation)
      const c: Ctrl = { x: 826, y: 1031, w: 246, h: 123, rotation: 90 };
      // Unrotated raw: bot=1154 (flagged false-positive without scale)
      // Scaled unrotated: bot = 1031 + 80 = 1111 (inside with scale-only fix)
      // Rotated 90° + scaled: w=80, h=160, center=(906, 1071.5), new bbox y=991.5, bot=1151.5
      // → just barely past canvas (~1.5px). True overflow when rotation is honored.
      // This test verifies the validator correctly catches the 1.5px overflow.
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(true);
    });

    it('XDJ-RR crossfader nudged up 2px: rotation + scale → inside (the FIX user can apply)', () => {
      // Same crossfader but at y=1029 instead of y=1031
      const c: Ctrl = { x: 826, y: 1029, w: 246, h: 123, rotation: 90 };
      // Rotated + scaled bot ≈ 1149.5 → inside 1150
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(false);
    });

    it('rotation=270 (XDJ-RR mic-selector) behaves same as 90 for AABB', () => {
      // mic-selector: 98×62, rotation=270, controlScale=0.65
      // Scaled: 63.7 × 40.3. Rotated 270°: same AABB as 90° (40.3 × 63.7)
      const c: Ctrl = { x: 100, y: 100, w: 98, h: 62, rotation: 270 };
      expect(isControlOutOfBounds(c, 1800, 1150, 0.65)).toBe(false);
    });

    it('rotation=0 / undefined is treated as no rotation', () => {
      const c: Ctrl = { x: 100, y: 100, w: 80, h: 80 };
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(false);
      const c0: Ctrl = { ...c, rotation: 0 };
      expect(isControlOutOfBounds(c0, 1800, 1150, 1)).toBe(false);
    });

    it('non-square rotated 45° expands AABB by sqrt(2) — caught when near canvas edge', () => {
      // 100×100 (square) rotated 45° → AABB becomes 141×141 (sqrt(2) * side)
      // Placed where rotated AABB exits canvas
      const c: Ctrl = { x: 1700, y: 100, w: 100, h: 100, rotation: 45 };
      // Unrotated bbox: right=1800 (exactly flush — inside)
      // Rotated 45°: center=(1750, 150), AABB becomes 141×141, x=1679.5 → right=1820.5
      expect(isControlOutOfBounds(c, 1800, 1150, 1)).toBe(true);
    });
  });
});
