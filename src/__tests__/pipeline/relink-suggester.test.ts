import { describe, it, expect } from 'vitest';
import { suggestRelinks } from '../../lib/pipeline/relink-suggester';

describe('suggestRelinks', () => {
  const lfoControls = [
    { id: 'lfo1-edit', x: 100, y: 100, w: 30, h: 30 },
    { id: 'lfo1-sine', x: 200, y: 100, w: 30, h: 30 },
    { id: 'lfo1-square', x: 230, y: 100, w: 30, h: 30 },
    { id: 'lfo1-triangle', x: 260, y: 100, w: 30, h: 30 },
    { id: 'lfo1-rate', x: 300, y: 100, w: 50, h: 50 },
    { id: 'lfo2-sine', x: 400, y: 200, w: 30, h: 30 },
    { id: 'arp-rate', x: 50, y: 50, w: 50, h: 50 },
    { id: 'cutoff', x: 600, y: 200, w: 50, h: 50 },
  ];

  it('suggests lfo1 controls for an lfo1 orphan', () => {
    const r = suggestRelinks('lfo1-waveform-leds', lfoControls);
    expect(r.hasViableSuggestion).toBe(true);
    expect(r.candidates.length).toBeGreaterThan(0);
    // All top candidates should be lfo1-prefixed
    for (const c of r.candidates) {
      expect(c.controlId.startsWith('lfo1-')).toBe(true);
    }
  });

  it('handles plurals (voices → voice via fuzzy token match)', () => {
    const voiceControls = [
      { id: 'voice-1', x: 100, y: 100 },
      { id: 'voice-2', x: 130, y: 100 },
      { id: 'voice-12', x: 200, y: 100 },
      { id: 'arp-rate', x: 50, y: 50 },
    ];
    const r = suggestRelinks('voices-leds', voiceControls);
    expect(r.hasViableSuggestion).toBe(true);
    expect(r.candidates.some((c) => c.controlId.startsWith('voice-'))).toBe(true);
    // No voice candidate should rank below arp-rate
    const voiceCandidates = r.candidates.filter((c) => c.controlId.startsWith('voice-'));
    const otherCandidates = r.candidates.filter((c) => !c.controlId.startsWith('voice-'));
    for (const v of voiceCandidates) {
      for (const o of otherCandidates) {
        expect(v.confidence).toBeGreaterThanOrEqual(o.confidence);
      }
    }
  });

  it('returns no candidates when nothing relates', () => {
    const r = suggestRelinks('completely-unrelated-id', [
      { id: 'arp-rate' },
      { id: 'cutoff' },
    ]);
    expect(r.hasViableSuggestion).toBe(false);
    expect(r.candidates).toHaveLength(0);
  });

  it('uses position proximity as a tiebreaker', () => {
    const controls = [
      { id: 'lfo1-sine', x: 100, y: 100, w: 30, h: 30 },
      { id: 'lfo1-square', x: 500, y: 500, w: 30, h: 30 },
    ];
    // Label is near lfo1-sine
    const labelNearSine = { x: 105, y: 105, w: 60, h: 12 };
    const r = suggestRelinks('lfo1-waveform-leds', controls, labelNearSine);
    expect(r.candidates[0].controlId).toBe('lfo1-sine');
    expect(r.candidates[0].reasons.positionProximity).toBeGreaterThan(r.candidates[1].reasons.positionProximity);
  });

  it('filters noise tokens (led, btn) from the comparison', () => {
    // "led" appears in both — without noise filter, it'd boost every match
    const controls = [
      { id: 'btn-foo' },
      { id: 'btn-bar' },
      { id: 'arp-rate' },
    ];
    // No tokens overlap once "btn"/"led" are filtered → no viable suggestion
    const r = suggestRelinks('led-something-unrelated', controls);
    expect(r.candidates.filter((c) => c.confidence > 0.5)).toHaveLength(0);
  });

  it('explanation cites which tokens are shared', () => {
    const r = suggestRelinks('lfo1-waveform-leds', [{ id: 'lfo1-sine' }]);
    expect(r.candidates[0].explanation).toContain('lfo1');
  });

  it('caps at MAX_CANDIDATES (5)', () => {
    const manyMatches = Array.from({ length: 20 }, (_, i) => ({ id: `lfo1-thing-${i}` }));
    const r = suggestRelinks('lfo1-waveform-leds', manyMatches);
    expect(r.candidates.length).toBeLessThanOrEqual(5);
  });

  it('handles empty controls list gracefully', () => {
    const r = suggestRelinks('anything', []);
    expect(r.hasViableSuggestion).toBe(false);
    expect(r.candidates).toHaveLength(0);
  });
});
