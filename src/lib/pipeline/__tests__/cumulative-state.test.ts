/**
 * Unit tests for PR-L's cumulative-state verifier.
 */
import { describe, expect, it } from 'vitest';
import {
  verifyCumulativeState,
  violationsToQaResults,
  type Violation,
} from '../cumulative-state';

const baseManifest = {
  controls: [
    { id: 'PLAY_PAUSE', type: 'button' },
    { id: 'CUE', type: 'button' },
    { id: 'TEMPO', type: 'knob' },
    { id: 'LED_INDICATOR', type: 'led' },
    { id: 'JOG_WHEEL', type: 'wheel' },
  ],
};

describe('verifyCumulativeState — happy path', () => {
  it('returns ok=true with no violations for a clean tutorial', () => {
    const r = verifyCumulativeState({
      steps: [
        { highlightControls: ['PLAY_PAUSE'], panelStateChanges: { PLAY_PAUSE: { active: true } } },
        { highlightControls: ['CUE'], panelStateChanges: { CUE: { ledOn: true } } },
      ],
    }, baseManifest);
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it('returns ok=true for a step with no panelStateChanges', () => {
    const r = verifyCumulativeState({
      steps: [{ highlightControls: ['PLAY_PAUSE'] }],
    }, baseManifest);
    expect(r.ok).toBe(true);
  });

  it('returns an empty result for a tutorial with no steps', () => {
    const r = verifyCumulativeState({ steps: [] }, baseManifest);
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });
});

describe('verifyCumulativeState — highlight-not-in-manifest', () => {
  it('flags a step that highlights a control not in manifest', () => {
    const r = verifyCumulativeState({
      steps: [{ highlightControls: ['GHOST_CTRL'] }],
    }, baseManifest);
    expect(r.ok).toBe(false);
    expect(r.violations).toHaveLength(1);
    expect(r.violations[0].kind).toBe('highlight-not-in-manifest');
    expect(r.violations[0].controlId).toBe('GHOST_CTRL');
    expect(r.violations[0].severity).toBe('fail');
  });

  it('reports stepIndex 1-indexed (matches canvas UI)', () => {
    const r = verifyCumulativeState({
      steps: [
        { highlightControls: ['PLAY_PAUSE'] }, // ok
        { highlightControls: ['GHOST_CTRL'] }, // bad — step 2
      ],
    }, baseManifest);
    expect(r.violations[0].stepIndex).toBe(2);
  });
});

describe('verifyCumulativeState — unknown-control in panelStateChanges', () => {
  it('flags panelStateChanges that references missing control', () => {
    const r = verifyCumulativeState({
      steps: [{ panelStateChanges: { GHOST_CTRL: { active: true } } }],
    }, baseManifest);
    expect(r.ok).toBe(false);
    expect(r.violations[0].kind).toBe('unknown-control');
    expect(r.violations[0].controlId).toBe('GHOST_CTRL');
  });
});

describe('verifyCumulativeState — led-on-non-led', () => {
  it('warns when ledOn:true is set on a non-LED-capable control', () => {
    const r = verifyCumulativeState({
      steps: [{ panelStateChanges: { TEMPO: { ledOn: true } } }],
    }, baseManifest);
    // Severity is `warn`, not `fail` — ok=true still
    expect(r.ok).toBe(true);
    expect(r.violations[0].kind).toBe('led-on-non-led');
    expect(r.violations[0].severity).toBe('warn');
  });

  it('does NOT flag ledOn:true on a button or LED type', () => {
    const r = verifyCumulativeState({
      steps: [
        { panelStateChanges: { PLAY_PAUSE: { ledOn: true } } },
        { panelStateChanges: { LED_INDICATOR: { ledOn: true } } },
      ],
    }, baseManifest);
    expect(r.violations.filter((v) => v.kind === 'led-on-non-led')).toHaveLength(0);
  });

  it('does NOT flag ledOn:false on any control', () => {
    const r = verifyCumulativeState({
      steps: [{ panelStateChanges: { TEMPO: { ledOn: false } } }],
    }, baseManifest);
    expect(r.violations.filter((v) => v.kind === 'led-on-non-led')).toHaveLength(0);
  });

  it('respects explicit hasLed:true override on a non-button control', () => {
    const manifest = {
      controls: [...baseManifest.controls, { id: 'SPECIAL_KNOB', type: 'knob', hasLed: true }],
    };
    const r = verifyCumulativeState({
      steps: [{ panelStateChanges: { SPECIAL_KNOB: { ledOn: true } } }],
    }, manifest);
    expect(r.violations.filter((v) => v.kind === 'led-on-non-led')).toHaveLength(0);
  });
});

describe('verifyCumulativeState — unknown-display-screen', () => {
  it('flags unknown displayState.screenType as info-severity', () => {
    const r = verifyCumulativeState({
      steps: [{ displayState: { screenType: 'fake-screen' } }],
    }, baseManifest);
    expect(r.ok).toBe(true); // info doesn't fail
    expect(r.violations[0].kind).toBe('unknown-display-screen');
    expect(r.violations[0].severity).toBe('info');
  });

  it('accepts a known screenType silently', () => {
    const r = verifyCumulativeState({
      steps: [{ displayState: { screenType: 'home' } }],
    }, baseManifest);
    expect(r.violations.filter((v) => v.kind === 'unknown-display-screen')).toHaveLength(0);
  });
});

describe('verifyCumulativeState — expectedState tracking', () => {
  it('computes per-step running state', () => {
    const r = verifyCumulativeState({
      steps: [
        { panelStateChanges: { PLAY_PAUSE: { active: true } } },
        { panelStateChanges: { CUE: { ledOn: true } } },
      ],
    }, baseManifest);
    expect(r.expectedState?.get(1)?.PLAY_PAUSE).toEqual({ active: true });
    expect(r.expectedState?.get(2)?.PLAY_PAUSE).toEqual({ active: true });
    expect(r.expectedState?.get(2)?.CUE).toEqual({ ledOn: true });
  });
});

describe('violationsToQaResults', () => {
  it('returns empty for empty input', () => {
    expect(violationsToQaResults([])).toEqual([]);
  });

  it('groups violations by kind', () => {
    const violations: Violation[] = [
      { kind: 'highlight-not-in-manifest', stepIndex: 1, controlId: 'X', message: 'a', severity: 'fail' },
      { kind: 'highlight-not-in-manifest', stepIndex: 2, controlId: 'Y', message: 'b', severity: 'fail' },
      { kind: 'led-on-non-led', stepIndex: 3, controlId: 'Z', message: 'c', severity: 'warn' },
    ];
    const r = violationsToQaResults(violations);
    expect(r).toHaveLength(2); // 2 unique kinds
    const highlightFinding = r.find((x) => x.name.includes('highlight-not-in-manifest'));
    expect(highlightFinding?.name).toContain('2 cases');
    expect(highlightFinding?.severity).toBe('fail');
  });

  it('singular case label', () => {
    const r = violationsToQaResults([
      { kind: 'led-on-non-led', stepIndex: 1, controlId: 'X', message: 'a', severity: 'warn' },
    ]);
    expect(r[0].name).toContain('1 case)');
  });
});
