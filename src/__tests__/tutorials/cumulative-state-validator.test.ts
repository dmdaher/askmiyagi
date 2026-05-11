import { describe, it, expect } from 'vitest';
import { validateCumulativeState } from '../../lib/tutorial/cumulative-state-validator';
import type { Tutorial } from '../../types/tutorial';

function makeTutorial(overrides: Partial<Tutorial> = {}): Tutorial {
  return {
    id: 'test-tut',
    deviceId: 'test-dev',
    title: 'Test',
    description: 'Test tutorial',
    category: 'Getting Started',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    tags: [],
    steps: [],
    ...overrides,
  };
}

const manifestIds = new Set(['arp', 'lfo', 'split', 'zone-1', 'zone-2', 'cutoff']);

describe('validateCumulativeState', () => {
  describe('clean cases', () => {
    it('returns zero issues for a tutorial with no steps', () => {
      const t = makeTutorial({ steps: [] });
      const result = validateCumulativeState(t, manifestIds);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });

    it('returns zero issues for a healthy tutorial', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Step 1', instruction: '',
            highlightControls: ['arp'],
            panelStateChanges: { arp: { active: true, ledOn: true } },
          },
          {
            id: 's2', title: 'Step 2', instruction: '',
            highlightControls: ['lfo'],
            panelStateChanges: { lfo: { active: true, ledOn: true } },
          },
          {
            // final step: reset everything
            id: 's3', title: 'Reset', instruction: '',
            highlightControls: ['arp'],
            panelStateChanges: { arp: { active: false, ledOn: false }, lfo: { active: false, ledOn: false } },
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      expect(result.errorCount).toBe(0);
      // Allow info-level "leftover LED" to be 0 since we reset
      expect(result.issues.filter((i) => i.code === 'LEFTOVER_LED_AT_END')).toHaveLength(0);
    });
  });

  describe('CHANGE_REFERENCES_MISSING_CONTROL', () => {
    it('flags panelStateChanges referencing a missing control id', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Step 1', instruction: '',
            highlightControls: [],
            panelStateChanges: { 'ghost-control': { active: true } },
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      const issue = result.issues.find((i) => i.code === 'CHANGE_REFERENCES_MISSING_CONTROL');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
      expect(issue?.controlId).toBe('ghost-control');
    });
  });

  describe('HIGHLIGHT_REFERENCES_MISSING_CONTROL', () => {
    it('flags highlightControls referencing a missing id', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Step 1', instruction: '',
            highlightControls: ['ghost-control'],
            panelStateChanges: {},
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      const issue = result.issues.find((i) => i.code === 'HIGHLIGHT_REFERENCES_MISSING_CONTROL');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('error');
    });

    it('allows the synthetic "display" target', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Step 1', instruction: '',
            highlightControls: ['display'],
            panelStateChanges: {},
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      expect(result.issues.filter((i) => i.code === 'HIGHLIGHT_REFERENCES_MISSING_CONTROL')).toHaveLength(0);
    });
  });

  describe('narrative-only steps', () => {
    it('does NOT flag empty-state steps (e.g., Welcome / Tour Complete)', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Welcome to the Fantom', instruction: 'Read this intro...',
            highlightControls: [],
            panelStateChanges: {},
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      // Narrative bookends are valid; only error-level issues should ever appear here
      expect(result.errorCount).toBe(0);
    });
  });

  describe('EXCESSIVE_FLIPS', () => {
    it('flags a control that toggles active state more than maxFlips times', () => {
      // 5 flips: on, off, on, off, on, off (last->second-to-last = flip)
      const flipSteps = [];
      let active = true;
      for (let i = 0; i < 7; i++) {
        flipSteps.push({
          id: `s${i}`, title: `Flip ${i}`, instruction: '',
          highlightControls: [],
          panelStateChanges: { arp: { active } },
        });
        active = !active;
      }
      const t = makeTutorial({ steps: flipSteps });
      const result = validateCumulativeState(t, manifestIds, { maxFlipsPerControl: 4 });
      const issue = result.issues.find((i) => i.code === 'EXCESSIVE_FLIPS');
      expect(issue).toBeDefined();
      expect(issue?.controlId).toBe('arp');
      expect(issue?.severity).toBe('warning');
    });

    it('does NOT flag normal toggle patterns', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'On', instruction: '',
            highlightControls: ['arp'],
            panelStateChanges: { arp: { active: true } },
          },
          {
            id: 's2', title: 'Off', instruction: '',
            highlightControls: ['arp'],
            panelStateChanges: { arp: { active: false } },
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      expect(result.issues.filter((i) => i.code === 'EXCESSIVE_FLIPS')).toHaveLength(0);
    });
  });

  describe('LEFTOVER_LED_AT_END', () => {
    it('flags LEDs still on at the end of a tutorial', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Light up', instruction: '',
            highlightControls: ['arp'],
            panelStateChanges: { arp: { active: true, ledOn: true } },
          },
          {
            id: 's2', title: 'Done', instruction: '',
            highlightControls: [],
            panelStateChanges: { arp: { active: false } }, // forgot to turn LED off
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      const issue = result.issues.find((i) => i.code === 'LEFTOVER_LED_AT_END');
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe('info');
      expect(issue?.controlId).toBe('arp');
    });

    it('respects ledLeftoverAllowlist', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Light up', instruction: '',
            highlightControls: ['arp'],
            panelStateChanges: { arp: { active: true, ledOn: true } },
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds, {
        ledLeftoverAllowlist: new Set(['arp']),
      });
      expect(result.issues.filter((i) => i.code === 'LEFTOVER_LED_AT_END')).toHaveLength(0);
    });
  });

  describe('error count tally', () => {
    it('accumulates multiple errors across steps', () => {
      const t = makeTutorial({
        steps: [
          {
            id: 's1', title: 'Bad ref', instruction: '',
            highlightControls: ['ghost-1'],
            panelStateChanges: { 'ghost-2': { active: true } },
          },
        ],
      });
      const result = validateCumulativeState(t, manifestIds);
      expect(result.errorCount).toBe(2); // one HIGHLIGHT + one CHANGE
    });
  });
});
