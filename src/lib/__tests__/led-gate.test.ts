import { describe, it, expect } from 'vitest';
import { panelButtonHasLed } from '../led-gate';

/**
 * Exhaustive truth table for panelButtonHasLed.
 * This helper is the SINGLE coordination point between ControlNode (editor)
 * and PanelRenderer (preview) for the PanelButton `hasLed` prop. A regression
 * here would re-introduce the drift:ci failure mode caught at PR #155.
 */

describe('panelButtonHasLed', () => {
  it('returns false when hasLed is false/undefined', () => {
    expect(panelButtonHasLed({ hasLed: false })).toBe(false);
    expect(panelButtonHasLed({})).toBe(false);
    expect(panelButtonHasLed({ hasLed: false, ledStyle: 'face' })).toBe(false);
    expect(panelButtonHasLed({ hasLed: false, ledPosition: 'inside' })).toBe(false);
  });

  it('returns true for ledPosition=inside regardless of ledStyle', () => {
    expect(panelButtonHasLed({ hasLed: true, ledPosition: 'inside' })).toBe(true);
    expect(panelButtonHasLed({ hasLed: true, ledPosition: 'inside', ledStyle: 'dot' })).toBe(true);
    expect(panelButtonHasLed({ hasLed: true, ledPosition: 'inside', ledStyle: 'face' })).toBe(true);
    expect(panelButtonHasLed({ hasLed: true, ledPosition: 'inside', ledStyle: 'label-backlit' })).toBe(true);
  });

  it('returns true for non-dot ledStyles (face / label-backlit / edge-glow / integrated)', () => {
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'face' })).toBe(true);
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'label-backlit' })).toBe(true);
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'edge-glow' })).toBe(true);
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'integrated' })).toBe(true);
  });

  it('returns false for ledStyle=dot with ledPosition !== inside (external dot wins)', () => {
    // This is the load-bearing case — if it returned true, PanelButton's
    // internal dot would render IN ADDITION to the external dot above,
    // producing the "2 dots on QUANTIZE" bug that surfaced at PR #155.
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'dot' })).toBe(false);
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'dot', ledPosition: 'above' })).toBe(false);
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'dot', ledPosition: 'below' })).toBe(false);
    expect(panelButtonHasLed({ hasLed: true, ledStyle: 'dot', ledPosition: 'ring' })).toBe(false);
  });

  it('returns false for unspecified ledStyle (default = dot) when ledPosition !== inside', () => {
    expect(panelButtonHasLed({ hasLed: true })).toBe(false);
    expect(panelButtonHasLed({ hasLed: true, ledPosition: 'above' })).toBe(false);
  });

  it('matrix check — every (hasLed × ledPosition × ledStyle) combination', () => {
    const styles = [undefined, 'dot', 'face', 'label-backlit', 'edge-glow', 'integrated'];
    const positions = [undefined, 'above', 'below', 'inside', 'ring', 'left', 'right'];
    const hasLeds = [undefined, false, true];

    for (const hasLed of hasLeds) {
      for (const ledPosition of positions) {
        for (const ledStyle of styles) {
          const result = panelButtonHasLed({ hasLed, ledPosition, ledStyle });
          // Document expected result derivation:
          //   - !hasLed → false
          //   - ledPosition === 'inside' → true
          //   - ledStyle is non-dot, non-undefined → true
          //   - else → false
          const expected =
            !hasLed ? false
            : ledPosition === 'inside' ? true
            : (ledStyle && ledStyle !== 'dot') ? true
            : false;
          expect(result, `hasLed=${hasLed} pos=${ledPosition} style=${ledStyle}`).toBe(expected);
        }
      }
    }
  });
});
