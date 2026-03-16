import { describe, it, expect } from 'vitest';
import { deepmind12Tutorials } from '@/data/tutorials/deepmind-12';
import { Tutorial } from '@/types/tutorial';

// All valid control IDs for the DeepMind 12 panel
// Source: docs/plans/2026-03-15-deepmind-12-tutorials.md — Complete Control ID List
const validControlIds = [
  // PERF section
  'perf-volume',
  'perf-portamento',
  'perf-oct-down',
  'perf-oct-up',
  'perf-pitch',
  'perf-mod',
  'octave-leds',
  // ARP section
  'arp-rate',
  'arp-gate-time',
  'arp-on-off',
  'arp-tap-hold',
  'arp-chord',
  'arp-poly-chord',
  'arp-edit',
  // LFO 1
  'lfo1-rate',
  'lfo1-delay',
  'lfo1-edit',
  // LFO 2
  'lfo2-rate',
  'lfo2-delay',
  'lfo2-edit',
  // LFO waveforms (shared)
  'lfo-wave-sine',
  'lfo-wave-triangle',
  'lfo-wave-sawtooth',
  'lfo-wave-square',
  'lfo-wave-sah',
  'lfo-wave-random',
  // OSC section
  'osc-pitch-mod',
  'osc-pwm',
  'osc-tone-mod',
  'osc-pitch',
  'osc-level',
  'osc-noise',
  'osc-sync',
  'osc-square',
  'osc-sawtooth',
  'osc-edit',
  // PROG section
  'display',
  'prog-bank-up',
  'prog-nav-no',
  'prog-rotary',
  'prog-nav-yes',
  'prog-bank-down',
  'prog-data-entry',
  'prog-menu-prog',
  'prog-menu-fx',
  'prog-menu-global',
  'prog-menu-compare',
  'prog-menu-write',
  'prog-menu-mod',
  // POLY section
  'poly-unison',
  'poly-edit',
  // VCF section
  'vcf-freq',
  'vcf-res',
  'vcf-env',
  'vcf-lfo',
  'vcf-kybd',
  'vcf-2pole',
  'vcf-edit',
  'vcf-invert',
  // VCA section
  'vca-level',
  'vca-edit',
  // HPF section
  'hpf-freq',
  'hpf-boost',
  // ENV section
  'env-attack',
  'env-decay',
  'env-sustain',
  'env-release',
  'env-curve-exp',
  'env-curve-lin',
  'env-curve-rev',
  'env-vca',
  'env-vcf',
  'env-mod',
  'env-curves',
  // Voice LEDs
  'voice-led-1',
  'voice-led-2',
  'voice-led-3',
  'voice-led-4',
  'voice-led-5',
  'voice-led-6',
  'voice-led-7',
  'voice-led-8',
  'voice-led-9',
  'voice-led-10',
  'voice-led-11',
  'voice-led-12',
];

// Expected step counts per tutorial (update when tutorials change)
const expectedStepCounts: Record<string, number> = {
  'panel-overview': 12,
  'display-navigation': 7,
  'selecting-programs': 7,
  'keyboard-performance': 7,
  'oscillator-fundamentals': 8,
  'filter-fundamentals': 8,
  'envelope-shaping': 8,
  'oscillator-mixing': 8,
  'hpf-bass-boost': 6,
  'signal-path': 7,
  'arpeggiator-basics': 8,
  // Batch D — Modulation
  'lfo-basics': 7,
  'pitch-mod-wheels': 6,
  'mod-matrix': 7,
  'poly-unison': 7,
  // Batch E — Effects
  'effects-overview': 7,
  'effects-routing': 7,
  'effects-deep-dive': 7,
  // Batch F — Presets & Program Management
  'saving-programs': 8,
  'compare-fader-match': 8,
  'program-management': 8,
};

describe('DeepMind 12 tutorial collection', () => {
  it('has 21 tutorials', () => {
    expect(deepmind12Tutorials).toHaveLength(21);
  });

  it('all tutorials have unique IDs', () => {
    const ids = deepmind12Tutorials.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all tutorials target deepmind-12', () => {
    deepmind12Tutorials.forEach((t) => {
      expect(t.deviceId).toBe('deepmind-12');
    });
  });

  it('all tutorials have required metadata', () => {
    deepmind12Tutorials.forEach((t) => {
      expect(t.title).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.difficulty).toBeTruthy();
      expect(t.estimatedTime).toBeTruthy();
      expect(t.tags.length).toBeGreaterThan(0);
      expect(t.steps.length).toBeGreaterThan(0);
    });
  });
});

// Parameterized tests for each tutorial
describe.each(deepmind12Tutorials)('$id tutorial data integrity', (tutorial: Tutorial) => {
  it('has the expected number of steps', () => {
    const expected = expectedStepCounts[tutorial.id];
    if (expected !== undefined) {
      expect(tutorial.steps).toHaveLength(expected);
    }
  });

  it('has unique step IDs', () => {
    const ids = tutorial.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each step has title and instruction', () => {
    tutorial.steps.forEach((step) => {
      expect(step.title).toBeTruthy();
      expect(step.instruction).toBeTruthy();
    });
  });

  it('highlighted controls are valid control IDs', () => {
    tutorial.steps.forEach((step) => {
      step.highlightControls.forEach((controlId) => {
        expect(
          validControlIds,
          `Invalid control ID "${controlId}" in step "${step.id}" of tutorial "${tutorial.id}"`
        ).toContain(controlId);
      });
    });
  });

  it('panel state changes reference valid control IDs', () => {
    tutorial.steps.forEach((step) => {
      Object.keys(step.panelStateChanges).forEach((controlId) => {
        expect(
          validControlIds,
          `Invalid panel state control ID "${controlId}" in step "${step.id}" of tutorial "${tutorial.id}"`
        ).toContain(controlId);
      });
    });
  });

  it('tutorial ID matches expected pattern', () => {
    expect(tutorial.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('display states use valid screen types', () => {
    const validScreenTypes = [
      'home', 'zone-view', 'key-range', 'write', 'menu', 'tone-select',
      'effect', 'mixer', 'scene-edit', 'zone-edit', 'effects-edit',
      'tone-edit-zoom', 'tone-edit-pro', 'pattern', 'piano-roll', 'group',
      'song', 'rec-standby', 'microscope', 'sampling', 'sample-pad',
      'wave-edit', 'pad-mode', 'multisample-edit', 'system-settings',
      'arpeggio', 'chord-memory', 'motional-pad', 'scene-chain', 'smf-control',
      'popup', 'file-browser', 'import-wizard', 'export-wizard',
    ];
    tutorial.steps.forEach((step) => {
      if (step.displayState) {
        expect(
          validScreenTypes,
          `Invalid screenType "${step.displayState.screenType}" in step "${step.id}"`
        ).toContain(step.displayState.screenType);
      }
    });
  });
});
