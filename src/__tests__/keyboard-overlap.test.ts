import { describe, it, expect } from 'vitest';
import { computeKeyboardOverlaps } from '@/lib/keyboard-overlap';

describe('computeKeyboardOverlaps', () => {
  // Fantom-06 setup that previously produced phantom overlaps.
  // canvas 1875×564, controlScale=0.3, keyboard at panelHeightPercent=57.3.
  const fantomKeyboard = { left: 1333.125, top: 323.172, right: 2420.625, bottom: 564 };

  it('does NOT flag pads whose visible rect is above the keyboard (controlScale=0.3)', () => {
    // pad-13: stored 100×100 at (1654, 256). Visible 30×30 → bottom 286.
    // Keyboard top is 323 → no visible overlap.
    const result = computeKeyboardOverlaps(
      { 'pad-13': { id: 'pad-13', label: '13', x: 1654, y: 256, w: 100, h: 100 } },
      fantomKeyboard,
      0.3,
    );
    expect(result.overlaps).toHaveLength(0);
  });

  it('WOULD have flagged the same pad without controlScale (regression of the original bug)', () => {
    // Same pad, but if controlScale isn't applied (uses raw stored 100×100 → bottom 356).
    // Keyboard top is 323 → false-positive overlap.
    const result = computeKeyboardOverlaps(
      { 'pad-13': { id: 'pad-13', label: '13', x: 1654, y: 256, w: 100, h: 100 } },
      fantomKeyboard,
      1, // scale=1 ⇒ raw dims, reproduces old behavior
    );
    expect(result.overlaps.length).toBeGreaterThan(0);
  });

  it('flags a control that visually IS overlapping (positioned inside keyboard rect)', () => {
    // Synthetic: control at (1500, 400) sized 100×100 stored → 100×100 visible at scale=1.
    // Lands inside the keyboard rect entirely. Should be flagged.
    const result = computeKeyboardOverlaps(
      { 'real-overlap': { id: 'real-overlap', label: 'OOPS', x: 1500, y: 400, w: 100, h: 100 } },
      fantomKeyboard,
      1,
    );
    expect(result.overlaps).toHaveLength(1);
    expect(result.overlaps[0].id).toBe('real-overlap');
    expect(result.overlaps[0].overlapPx).toBeGreaterThan(50);
  });

  it('returns empty when no controls are provided', () => {
    const result = computeKeyboardOverlaps({}, fantomKeyboard, 0.3);
    expect(result.overlaps).toEqual([]);
    expect(result.lowestControlBottom).toBe(0);
  });

  it('sorts overlaps by depth, deepest first', () => {
    const result = computeKeyboardOverlaps(
      {
        shallow: { id: 'shallow', label: 'A', x: 1400, y: 320, w: 50, h: 20 }, // 17px deep
        deep:    { id: 'deep',    label: 'B', x: 1400, y: 300, w: 50, h: 200 }, // ~177px
        medium:  { id: 'medium',  label: 'C', x: 1400, y: 300, w: 50, h: 80 }, // ~57px
      },
      fantomKeyboard,
      1,
    );
    expect(result.overlaps.map(o => o.id)).toEqual(['deep', 'medium', 'shallow']);
  });

  it('does not flag controls entirely above the keyboard', () => {
    const result = computeKeyboardOverlaps(
      { up: { id: 'up', label: 'X', x: 1500, y: 50, w: 100, h: 100 } }, // bottom=150, kb top=323
      fantomKeyboard,
      1,
    );
    expect(result.overlaps).toHaveLength(0);
  });

  it('does not flag controls entirely below the keyboard (regression of older Y-bound bug)', () => {
    const result = computeKeyboardOverlaps(
      { down: { id: 'down', label: 'X', x: 1500, y: 600, w: 100, h: 100 } }, // top=600, kb bottom=564
      fantomKeyboard,
      1,
    );
    expect(result.overlaps).toHaveLength(0);
  });

  it('does not flag controls outside the keyboard X range', () => {
    const result = computeKeyboardOverlaps(
      { left: { id: 'left', label: 'X', x: 0, y: 400, w: 100, h: 100 } }, // x ∈ [0, 100], kb starts at 1333
      fantomKeyboard,
      1,
    );
    expect(result.overlaps).toHaveLength(0);
  });

  it('tracks lowestControlBottom across all controls (scaled)', () => {
    const result = computeKeyboardOverlaps(
      {
        a: { id: 'a', label: 'A', x: 0, y: 100, w: 100, h: 100 }, // bottom = 100 + 0.3*100 = 130
        b: { id: 'b', label: 'B', x: 0, y: 200, w: 100, h: 100 }, // bottom = 200 + 30 = 230
        c: { id: 'c', label: 'C', x: 0, y: 50,  w: 100, h: 100 }, // bottom = 80
      },
      fantomKeyboard,
      0.3,
    );
    expect(result.lowestControlBottom).toBe(230);
  });
});
