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

/**
 * highlight-label-mismatch heuristic (Way 2): when a step's instruction
 * mentions ALL-CAPS words and the highlighted control's label also has
 * ALL-CAPS words but none intersect, flag as WARN. Catches author bugs
 * where the wrong button got highlighted for the intent.
 *
 * Catches: "Press the NOISE button" highlighting a control labeled "SWEEP"
 * Misses: lowercase instructions, paraphrased ("third button"), synonyms
 */
describe('verifyCumulativeState — highlight-label-mismatch (heuristic)', () => {
  const labeledManifest = {
    controls: [
      { id: 'scfx_btn_1', type: 'button', label: 'SPACE' },
      { id: 'scfx_btn_2', type: 'button', label: 'DUB ECHO' },
      { id: 'scfx_btn_3', type: 'button', label: 'SWEEP' },
      { id: 'scfx_btn_4', type: 'button', label: 'NOISE' },
      { id: 'scfx_parameter_knob', type: 'knob', label: 'PARAMETER' },
      // Lower-case + short labels — caps extraction should ignore
      { id: 'play', type: 'button', label: 'Play' },
      { id: 'fx', type: 'button', label: 'FX' }, // 2-char caps — below threshold
    ],
  };

  it('PASS: instruction caps match highlighted control label caps', () => {
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Press the NOISE button to activate the filter',
        highlightControls: ['scfx_btn_4'], // label "NOISE"
      }],
    }, labeledManifest);
    const mismatch = r.violations.filter((v) => v.kind === 'highlight-label-mismatch');
    expect(mismatch).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('WARN: instruction mentions NOISE but highlights a button labeled SWEEP', () => {
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Press the NOISE button to activate the filter',
        highlightControls: ['scfx_btn_3'], // label "SWEEP"
      }],
    }, labeledManifest);
    const mismatch = r.violations.filter((v) => v.kind === 'highlight-label-mismatch');
    expect(mismatch).toHaveLength(1);
    expect(mismatch[0].severity).toBe('warn');
    expect(mismatch[0].controlId).toBe('scfx_btn_3');
    expect(mismatch[0].message).toContain('NOISE');
    expect(mismatch[0].message).toContain('SWEEP');
    // Warning-severity issues do not fail the run.
    expect(r.ok).toBe(true);
  });

  it('still WARNs even when ID is vague (validator checks LABEL not ID)', () => {
    // scfx_btn_3 is a vague ID but its LABEL is "SWEEP". Instruction says NOISE.
    // The validator catches this regardless of whether the ID is semantic or vague,
    // because it cross-references the manifest LABEL, not the ID itself.
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Press NOISE',
        highlightControls: ['scfx_btn_3'],
      }],
    }, labeledManifest);
    expect(r.violations.filter((v) => v.kind === 'highlight-label-mismatch')).toHaveLength(1);
  });

  it('SKIP: instruction has no all-caps words (low-signal — heuristic stays silent)', () => {
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Press the third button to enable the effect',
        highlightControls: ['scfx_btn_3'], // label "SWEEP"
      }],
    }, labeledManifest);
    // No instruction caps → heuristic doesn't fire, no warning either way
    expect(r.violations.filter((v) => v.kind === 'highlight-label-mismatch')).toEqual([]);
  });

  it('SKIP: control label has no all-caps words', () => {
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Press the PLAY button',
        highlightControls: ['play'], // label "Play" — no all-caps
      }],
    }, labeledManifest);
    expect(r.violations.filter((v) => v.kind === 'highlight-label-mismatch')).toEqual([]);
  });

  it('SKIP: caps too short (≥3 char threshold avoids false positives on initialisms)', () => {
    // "DJ" and "FX" are 2 chars, won't be extracted as control-name candidates.
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Use the DJ FX',
        highlightControls: ['fx'], // label "FX"
      }],
    }, labeledManifest);
    expect(r.violations.filter((v) => v.kind === 'highlight-label-mismatch')).toEqual([]);
  });

  it('PASS: multiple caps in instruction, at least one matches', () => {
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'After NOISE finishes, press SWEEP to layer effects',
        highlightControls: ['scfx_btn_3'], // label "SWEEP" — matches one of the caps
      }],
    }, labeledManifest);
    expect(r.violations.filter((v) => v.kind === 'highlight-label-mismatch')).toEqual([]);
  });

  it('PASS: multi-word label, one word matches instruction', () => {
    // Label "DUB ECHO" has caps ["DUB", "ECHO"]. Instruction says "ECHO".
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Activate the ECHO effect',
        highlightControls: ['scfx_btn_2'], // label "DUB ECHO"
      }],
    }, labeledManifest);
    expect(r.violations.filter((v) => v.kind === 'highlight-label-mismatch')).toEqual([]);
  });

  it('WARNs even when other violations exist on same step', () => {
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Press the NOISE button',
        highlightControls: ['scfx_btn_3', 'GHOST'], // SWEEP + nonexistent
      }],
    }, labeledManifest);
    const kinds = r.violations.map((v) => v.kind).sort();
    expect(kinds).toContain('highlight-label-mismatch');
    expect(kinds).toContain('highlight-not-in-manifest');
    // highlight-not-in-manifest is FAIL severity → overall ok=false
    expect(r.ok).toBe(false);
  });

  it('handles missing instruction field gracefully', () => {
    const r = verifyCumulativeState({
      steps: [{
        highlightControls: ['scfx_btn_3'], // no instruction field at all
      }],
    }, labeledManifest);
    expect(r.violations.filter((v) => v.kind === 'highlight-label-mismatch')).toEqual([]);
  });

  it('does not flag step that highlights no controls', () => {
    const r = verifyCumulativeState({
      steps: [{
        instruction: 'Press the NOISE button',
        highlightControls: [], // empty
      }],
    }, labeledManifest);
    expect(r.violations).toEqual([]);
  });
});
