/**
 * Geometry helpers — math used by hit-testing, selection, and
 * rotation-aware bounding box computations in the panel editor.
 *
 * Added in EP6-C (universal rotation, 2026-05-22): the editor's
 * selection sites (Alt+Click cycle, rubber-band drag) historically
 * compared axis-aligned bboxes only. For rotated controls, the
 * un-rotated bbox doesn't match the visible footprint — so the math
 * misses or catches the wrong controls. `rotateAABB()` produces the
 * AABB that ENCLOSES the visible footprint of a rotated rect, which
 * is what hit-test math wants.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Compute the axis-aligned bounding box that encloses the 4 corners
 * of `rect` after rotation by `angleDeg` degrees around `center`.
 *
 * - `angleDeg` 0 (or undefined / falsy) → returns the input rect unchanged
 *   so callers don't need to special-case
 * - `center` defaults to the rect's own center (which is how the editor
 *   applies CSS rotation via `transformOrigin: center`)
 *
 * Examples:
 * - rotateAABB({x:0,y:0,w:10,h:10}, 0)        → {x:0,y:0,w:10,h:10}
 * - rotateAABB({x:0,y:0,w:10,h:10}, 90)       → {x:0,y:0,w:10,h:10}   (square unchanged)
 * - rotateAABB({x:0,y:0,w:10,h:10}, 45)       → ~{x:-2.07,y:-2.07,w:14.14,h:14.14}
 * - rotateAABB({x:0,y:0,w:20,h:10}, 90)       → {x:5,y:-5,w:10,h:20}  (rotated rectangle's AABB)
 */
export function rotateAABB(rect: Rect, angleDeg: number, center?: Point): Rect {
  if (!angleDeg) return rect;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = center?.x ?? rect.x + rect.w / 2;
  const cy = center?.y ?? rect.y + rect.h / 2;
  const corners: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
  const rotated = corners.map((p) => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
  }));
  const xs = rotated.map((p) => p.x);
  const ys = rotated.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Axis-aligned rectangle intersection test. Returns true if `a` and `b`
 * overlap (touching edges don't count as overlap). To test rotated
 * rects, pass the output of `rotateAABB()` as the input.
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
