import { describe, it, expect } from 'vitest';
import { rotateAABB, rectsOverlap, type Rect } from '../geometry';

const close = (a: number, b: number, eps = 0.01) => Math.abs(a - b) < eps;

describe('rotateAABB', () => {
  const square: Rect = { x: 0, y: 0, w: 10, h: 10 };
  const wide: Rect = { x: 0, y: 0, w: 20, h: 10 };

  it('returns input unchanged when angle is 0', () => {
    expect(rotateAABB(square, 0)).toEqual(square);
  });

  it('returns input unchanged when angle is falsy (undefined)', () => {
    expect(rotateAABB(square, undefined as unknown as number)).toEqual(square);
  });

  it('square at 90deg around own center returns same bbox', () => {
    const out = rotateAABB(square, 90);
    expect(close(out.x, 0)).toBe(true);
    expect(close(out.y, 0)).toBe(true);
    expect(close(out.w, 10)).toBe(true);
    expect(close(out.h, 10)).toBe(true);
  });

  it('square at 45deg expands AABB to sqrt(2)*side', () => {
    const out = rotateAABB(square, 45);
    const expectedSide = 10 * Math.sqrt(2);
    expect(close(out.w, expectedSide)).toBe(true);
    expect(close(out.h, expectedSide)).toBe(true);
    // center preserved at (5,5); AABB center should also be (5,5)
    expect(close(out.x + out.w / 2, 5)).toBe(true);
    expect(close(out.y + out.h / 2, 5)).toBe(true);
  });

  it('wide rect at 90deg becomes tall (w↔h swap)', () => {
    const out = rotateAABB(wide, 90);
    expect(close(out.w, 10)).toBe(true);
    expect(close(out.h, 20)).toBe(true);
    // center of original is (10, 5); rotated AABB center same
    expect(close(out.x + out.w / 2, 10)).toBe(true);
    expect(close(out.y + out.h / 2, 5)).toBe(true);
  });

  it('270deg is equivalent to -90deg (same AABB)', () => {
    const a = rotateAABB(wide, 270);
    const b = rotateAABB(wide, -90);
    expect(close(a.x, b.x)).toBe(true);
    expect(close(a.y, b.y)).toBe(true);
    expect(close(a.w, b.w)).toBe(true);
    expect(close(a.h, b.h)).toBe(true);
  });

  it('180deg keeps same dimensions, center preserved', () => {
    const out = rotateAABB(wide, 180);
    expect(close(out.w, 20)).toBe(true);
    expect(close(out.h, 10)).toBe(true);
    expect(close(out.x, 0)).toBe(true);
    expect(close(out.y, 0)).toBe(true);
  });

  it('respects custom center (rotation pivots around given point)', () => {
    // 10x10 square at (10,10), rotated 90deg around origin (0,0)
    // Corners (10,10), (20,10), (20,20), (10,20) rotate to (-10,10), (-10,20), (-20,20), (-20,10)
    // AABB: x=-20, y=10, w=10, h=10
    const out = rotateAABB({ x: 10, y: 10, w: 10, h: 10 }, 90, { x: 0, y: 0 });
    expect(close(out.x, -20)).toBe(true);
    expect(close(out.y, 10)).toBe(true);
    expect(close(out.w, 10)).toBe(true);
    expect(close(out.h, 10)).toBe(true);
  });
});

describe('rectsOverlap', () => {
  it('returns true for clearly overlapping rects', () => {
    expect(rectsOverlap(
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 5, y: 5, w: 10, h: 10 },
    )).toBe(true);
  });

  it('returns false for disjoint rects', () => {
    expect(rectsOverlap(
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 20, y: 20, w: 10, h: 10 },
    )).toBe(false);
  });

  it('returns false when rects only touch at edges (open interval)', () => {
    expect(rectsOverlap(
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 10, y: 0, w: 10, h: 10 },
    )).toBe(false);
  });

  it('returns true for fully contained rect', () => {
    expect(rectsOverlap(
      { x: 0, y: 0, w: 100, h: 100 },
      { x: 25, y: 25, w: 10, h: 10 },
    )).toBe(true);
  });

  it('chains correctly with rotateAABB for rotated-rect overlap test', () => {
    // Two 10x10 squares: one at (0,0), one at (15,0). Disjoint when axis-aligned.
    // Rotate the second 45deg → its AABB expands to ~14.14x14.14, centered at (20,5).
    // The expanded AABB extends from x≈12.93, y≈-2.07 to x≈27.07, y≈12.07.
    // Now overlap with the first (0,0,10,10): 0 < 27 && 10 > 12.93 → 10 > 12.93 false.
    // Still disjoint. Move the rotated rect to (12, 0) → AABB centered at (17, 5), spans (~9.93, -2.07) to (~24.07, 12.07). 0 < 24 && 10 > 9.93 → TRUE.
    const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
    const b: Rect = { x: 12, y: 0, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(false); // pre-rotation disjoint
    const bRotated = rotateAABB(b, 45);
    expect(rectsOverlap(a, bRotated)).toBe(true); // rotated AABB extends back into A
  });
});
