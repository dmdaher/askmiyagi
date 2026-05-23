/**
 * Pure overlap-detection math for the editor's keyboard banner.
 *
 * The editor warns the contractor when controls visually intersect the
 * keyboard rectangle. The math needs `controlScale` applied to width/height
 * because controls render shrunk by that factor (a stored 100×100 pad on a
 * panel at controlScale=0.3 visually renders 30×30, and the overlap test
 * must compare what's VISIBLE, not what's stored).
 *
 * History: a previous version of this logic lived inline inside
 * KeyboardSection.tsx and forgot to apply controlScale. On fantom-06
 * (controlScale=0.3, 61-key keyboard with leftPercent+widthPercent>100%),
 * it falsely reported 5 control overlaps the contractor couldn't see.
 */

export interface OverlapInputControl {
  id: string;
  label?: string | null;
  x: number;
  y: number;
  /** Stored width — multiplied by controlScale to get visible width. */
  w: number;
  /** Stored height — multiplied by controlScale to get visible height. */
  h: number;
}

export interface OverlapInputKeyboard {
  /** Left edge of keyboard in canvas px. */
  left: number;
  /** Top edge of keyboard in canvas px. */
  top: number;
  /** Right edge of keyboard in canvas px (may extend past canvas — caller may clamp). */
  right: number;
  /** Bottom edge of keyboard in canvas px. */
  bottom: number;
}

export interface OverlapEntry {
  id: string;
  label: string;
  /** How deep into the keyboard the control extends (px). Always ≥ 0. */
  overlapPx: number;
}

export interface OverlapResult {
  overlaps: OverlapEntry[];
  /** Lowest bottom edge across all controls — used for gap-above-keyboard warning. */
  lowestControlBottom: number;
}

/**
 * Compute which controls visually intersect the keyboard rectangle.
 *
 * @param controls   Dict (or array) of controls from the editor store.
 * @param keyboard   Keyboard bounds in canvas pixel coordinates.
 * @param controlScale  The editor's `controlScale` (typically 0.3 for hi-res
 *                      panels, 1 for unscaled). Applied to control w/h ONLY —
 *                      position is unscaled.
 * @param warnPx     Small tolerance to skip 1-2 px boundary noise (default 4).
 */
export function computeKeyboardOverlaps(
  controls: Record<string, OverlapInputControl> | OverlapInputControl[],
  keyboard: OverlapInputKeyboard,
  controlScale: number,
  warnPx = 4,
): OverlapResult {
  const list = Array.isArray(controls) ? controls : Object.values(controls);
  const overlaps: OverlapEntry[] = [];
  let lowestControlBottom = 0;

  for (const c of list) {
    if (!c) continue;
    const cTop = c.y;
    const cBottom = cTop + c.h * controlScale;
    if (cBottom > lowestControlBottom) lowestControlBottom = cBottom;

    const yOverlapsKeyboard =
      cBottom > keyboard.top + warnPx &&
      cTop < keyboard.bottom - warnPx;
    if (!yOverlapsKeyboard) continue;

    const cLeft = c.x;
    const cRight = cLeft + c.w * controlScale;
    const xOverlaps = cRight > keyboard.left && cLeft < keyboard.right;
    if (!xOverlaps) continue;

    const overlapPx =
      Math.min(cBottom, keyboard.bottom) - Math.max(cTop, keyboard.top);
    overlaps.push({ id: c.id, label: c.label || c.id, overlapPx });
  }

  overlaps.sort((a, b) => b.overlapPx - a.overlapPx);
  return { overlaps, lowestControlBottom };
}
