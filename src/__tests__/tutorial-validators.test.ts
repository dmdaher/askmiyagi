/**
 * Unit tests for the tutorial-review pause-phase validator orchestrator.
 *
 * Covers aggregation, severity tier surfacing, and option pass-through.
 * The per-tutorial validator (validateCumulativeState) is tested at
 * src/__tests__/tutorials/cumulative-state-validator.test.ts.
 * The loadValidControlIds helper is tested at src/__tests__/loadValidControlIds.test.ts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Tutorial } from '@/types/tutorial';

// ──────────────────────────────────────────────────────────────────────────
// validateGeneratedTutorials — orchestrator behavior
// ──────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/tutorial/loadValidControlIds', async () => {
  const actual = await vi.importActual<typeof import('@/lib/tutorial/loadValidControlIds')>(
    '@/lib/tutorial/loadValidControlIds',
  );
  return {
    ...actual,
    loadValidControlIds: vi.fn(),
    loadTutorials: vi.fn(),
  };
});

import { validateGeneratedTutorials } from '@/lib/pipeline/tutorial-validators';
import {
  loadValidControlIds as mockedLoadValidControlIds,
  loadTutorials as mockedLoadTutorials,
} from '@/lib/tutorial/loadValidControlIds';

function makeStep(overrides: Partial<Tutorial['steps'][number]> = {}): Tutorial['steps'][number] {
  return {
    id: 'step-x',
    title: 'Step',
    instruction: '',
    highlightControls: [],
    panelStateChanges: {},
    ...overrides,
  };
}

function makeTutorial(id: string, steps: Tutorial['steps']): Tutorial {
  return {
    id,
    deviceId: 'fixture-device',
    title: `Tutorial ${id}`,
    description: '',
    category: 'test',
    difficulty: 'beginner',
    estimatedTime: '1 min',
    steps,
    tags: [],
  };
}

describe('validateGeneratedTutorials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when no manifest source exists', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(null);
    await expect(validateGeneratedTutorials('missing-device')).rejects.toThrow(/no manifest found/);
  });

  it('returns zero issues for a clean tutorial', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set(['c1']));
    vi.mocked(mockedLoadTutorials).mockResolvedValue([
      makeTutorial('clean', [
        makeStep({ id: 's1', highlightControls: ['c1'], panelStateChanges: { c1: { active: true } } }),
        makeStep({ id: 's2', panelStateChanges: { c1: { active: false } } }),
      ]),
    ]);

    const summary = await validateGeneratedTutorials('fixture-device');

    expect(summary.totalErrors).toBe(0);
    expect(summary.totalWarnings).toBe(0);
    expect(summary.totalTutorials).toBe(1);
    expect(summary.totalSteps).toBe(2);
    expect(summary.byTutorial.clean.errors).toBe(0);
    expect(summary.byTutorial.clean.title).toBe('Tutorial clean');
    expect(summary.byTutorial.clean.stepCount).toBe(2);
  });

  it('detects HIGHLIGHT_REFERENCES_MISSING_CONTROL as an error', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set(['c1']));
    vi.mocked(mockedLoadTutorials).mockResolvedValue([
      makeTutorial('bad-highlight', [
        makeStep({ id: 's1', highlightControls: ['c1', 'does-not-exist'] }),
      ]),
    ]);

    const summary = await validateGeneratedTutorials('fixture-device');

    expect(summary.totalErrors).toBe(1);
    const issue = summary.issues.find(i => i.code === 'HIGHLIGHT_REFERENCES_MISSING_CONTROL');
    expect(issue).toBeDefined();
    expect(issue?.controlId).toBe('does-not-exist');
    expect(issue?.tutorialId).toBe('bad-highlight');
    expect(issue?.stepIndex).toBe(0);
  });

  it('detects CHANGE_REFERENCES_MISSING_CONTROL as an error', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set(['c1']));
    vi.mocked(mockedLoadTutorials).mockResolvedValue([
      makeTutorial('bad-change', [
        makeStep({ id: 's1', panelStateChanges: { 'phantom-control': { active: true } } }),
      ]),
    ]);

    const summary = await validateGeneratedTutorials('fixture-device');

    expect(summary.totalErrors).toBe(1);
    expect(summary.issues[0].code).toBe('CHANGE_REFERENCES_MISSING_CONTROL');
    expect(summary.issues[0].controlId).toBe('phantom-control');
  });

  it('detects EXCESSIVE_FLIPS as a warning', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set(['c1']));
    // Toggle active state 5 times — exceeds default max of 4
    const flipSteps = [];
    for (let i = 0; i < 6; i++) {
      flipSteps.push(makeStep({
        id: `s${i}`,
        panelStateChanges: { c1: { active: i % 2 === 0 } },
      }));
    }
    vi.mocked(mockedLoadTutorials).mockResolvedValue([makeTutorial('flippy', flipSteps)]);

    const summary = await validateGeneratedTutorials('fixture-device');

    expect(summary.totalWarnings).toBe(1);
    const issue = summary.issues.find(i => i.code === 'EXCESSIVE_FLIPS');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('warning');
    expect(issue?.stepIndex).toBeUndefined(); // tutorial-wide → no specific step
  });

  it('detects LEFTOVER_LED_AT_END as info', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set(['c1']));
    vi.mocked(mockedLoadTutorials).mockResolvedValue([
      makeTutorial('led-leftover', [
        makeStep({ id: 's1', panelStateChanges: { c1: { active: false, ledOn: true } } }),
        makeStep({ id: 's2', instruction: 'done' }),
      ]),
    ]);

    const summary = await validateGeneratedTutorials('fixture-device');

    expect(summary.totalInfos).toBe(1);
    expect(summary.issues[0].code).toBe('LEFTOVER_LED_AT_END');
    expect(summary.issues[0].severity).toBe('info');
  });

  it('aggregates counts correctly across multiple tutorials', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set(['c1']));
    vi.mocked(mockedLoadTutorials).mockResolvedValue([
      makeTutorial('a', [makeStep({ id: 's1', highlightControls: ['missing'] })]),
      makeTutorial('b', [
        makeStep({ id: 's1', highlightControls: ['c1'] }),
        makeStep({ id: 's2', highlightControls: ['missing'] }),
      ]),
      makeTutorial('c', [makeStep({ id: 's1', highlightControls: ['c1'] })]),
    ]);

    const summary = await validateGeneratedTutorials('fixture-device');

    expect(summary.totalTutorials).toBe(3);
    expect(summary.totalSteps).toBe(4);
    expect(summary.totalErrors).toBe(2);
    expect(summary.byTutorial.a.errors).toBe(1);
    expect(summary.byTutorial.b.errors).toBe(1);
    expect(summary.byTutorial.c.errors).toBe(0);
  });

  it('passes preferPipelineManifest through to the loader', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set());
    vi.mocked(mockedLoadTutorials).mockResolvedValue([]);

    await validateGeneratedTutorials('any-device', { preferPipelineManifest: true });

    expect(mockedLoadValidControlIds).toHaveBeenCalledWith('any-device', {
      preferPipelineManifest: true,
    });
  });

  it('produces an ISO timestamp in generatedAt', async () => {
    vi.mocked(mockedLoadValidControlIds).mockResolvedValue(new Set());
    vi.mocked(mockedLoadTutorials).mockResolvedValue([]);

    const summary = await validateGeneratedTutorials('any-device');

    expect(summary.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
