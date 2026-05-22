/**
 * Unit tests for the LED style pure function. Covers 5 styles × 3 states
 * + the integrated→face alias + the empty-result paths (hasLed=false,
 * no ledColor, dot style).
 *
 * Critical regression guard: the OFF state must return a non-null
 * containerStyle for face / label-backlit / edge-glow. Previously the
 * code returned `undefined` for OFF, making LED-capable buttons
 * indistinguishable from non-LED buttons.
 */
import { describe, expect, it } from 'vitest';
import { getLedStyleObject, ledRenderStateFromOn } from '../ledStyles';

describe('ledRenderStateFromOn', () => {
  it('true → on', () => expect(ledRenderStateFromOn(true)).toBe('on'));
  it('false → off', () => expect(ledRenderStateFromOn(false)).toBe('off'));
  it('undefined → editor', () => expect(ledRenderStateFromOn(undefined)).toBe('editor'));
});

describe('getLedStyleObject — empty results', () => {
  it('hasLed=false returns empty', () => {
    const r = getLedStyleObject('face', true, '#22c55e', false);
    expect(r.containerStyle).toBeNull();
    expect(r.labelStyle).toBeNull();
    expect(r.suppressDotIndicator).toBe(false);
  });
  it('no ledColor returns empty', () => {
    const r = getLedStyleObject('face', true, undefined, true);
    expect(r.containerStyle).toBeNull();
  });
  it('no ledStyle returns empty', () => {
    const r = getLedStyleObject(undefined, true, '#22c55e', true);
    expect(r.containerStyle).toBeNull();
  });
  it('dot style returns empty container (caller handles dot element)', () => {
    const r = getLedStyleObject('dot', true, '#22c55e', true);
    expect(r.containerStyle).toBeNull();
    expect(r.suppressDotIndicator).toBe(false);
  });
});

describe('getLedStyleObject — alias: integrated === face', () => {
  it('integrated renders same as face', () => {
    const integ = getLedStyleObject('integrated', true, '#22c55e', true);
    const face = getLedStyleObject('face', true, '#22c55e', true);
    expect(integ.containerStyle).toEqual(face.containerStyle);
  });
});

describe('getLedStyleObject — face style', () => {
  const color = '#22c55e';

  it('ON: bright glow + green border + box-shadow', () => {
    const r = getLedStyleObject('face', true, color, true);
    expect(r.containerStyle).toBeTruthy();
    expect(r.containerStyle!.background).toContain('radial-gradient');
    expect(r.containerStyle!.background).toContain(color);
    expect(r.containerStyle!.border).toBe(`1px solid ${color}`);
    expect(r.containerStyle!.boxShadow).toContain(color);
    expect(r.suppressDotIndicator).toBe(true);
  });

  it('OFF: dark face + subtle border (CRITICAL regression guard — was undefined before)', () => {
    const r = getLedStyleObject('face', false, color, true);
    expect(r.containerStyle).not.toBeNull();
    expect(r.containerStyle!.backgroundColor).toBe('#1a1a1e');
    expect(r.containerStyle!.border).toBe(`1px solid ${color}40`);
    expect(r.suppressDotIndicator).toBe(true);
  });

  it('EDITOR: more visible baseline than off (thicker border)', () => {
    const r = getLedStyleObject('face', undefined, color, true);
    expect(r.containerStyle).not.toBeNull();
    expect(r.containerStyle!.border).toBe(`2px solid ${color}40`);
  });
});

describe('getLedStyleObject — label-backlit style', () => {
  const color = '#3b82f6';

  it('ON: face dark + label glows in color with text-shadow', () => {
    const r = getLedStyleObject('label-backlit', true, color, true);
    expect(r.containerStyle!.backgroundColor).toBe('#1a1a1e');
    expect(r.labelStyle).not.toBeNull();
    expect(r.labelStyle!.color).toBe(color);
    expect(r.labelStyle!.textShadow).toContain(color);
  });

  it('OFF: label dimmed (still readable, no glow)', () => {
    const r = getLedStyleObject('label-backlit', false, color, true);
    expect(r.labelStyle!.color).toBe(`${color}80`);
    expect(r.labelStyle!.textShadow).toBeUndefined();
  });

  it('EDITOR: label even more dimmed (60% alpha)', () => {
    const r = getLedStyleObject('label-backlit', undefined, color, true);
    expect(r.labelStyle!.color).toBe(`${color}60`);
  });
});

describe('getLedStyleObject — edge-glow style', () => {
  const color = '#ec4899';

  it('ON: thick glowing border + face dark', () => {
    const r = getLedStyleObject('edge-glow', true, color, true);
    expect(r.containerStyle!.border).toBe(`3px solid ${color}`);
    expect(r.containerStyle!.backgroundColor).toBe('#1a1a1e');
    expect(r.containerStyle!.boxShadow).toContain(color);
  });

  it('OFF: 1px subtle border', () => {
    const r = getLedStyleObject('edge-glow', false, color, true);
    expect(r.containerStyle!.border).toBe(`1px solid ${color}40`);
  });

  it('EDITOR: 2px medium border (between OFF and ON)', () => {
    const r = getLedStyleObject('edge-glow', undefined, color, true);
    expect(r.containerStyle!.border).toBe(`2px solid ${color}60`);
  });
});

describe('getLedStyleObject — all styles suppress dot indicator (only `dot` keeps it)', () => {
  const styles = ['face', 'integrated', 'label-backlit', 'edge-glow'] as const;
  for (const s of styles) {
    it(`${s} → suppressDotIndicator=true`, () => {
      const r = getLedStyleObject(s, true, '#22c55e', true);
      expect(r.suppressDotIndicator).toBe(true);
    });
  }
  it('dot → suppressDotIndicator=false', () => {
    const r = getLedStyleObject('dot', true, '#22c55e', true);
    expect(r.suppressDotIndicator).toBe(false);
  });
});
