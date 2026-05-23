/**
 * Unit tests for PR-K's tutorial-level patch path.
 *
 * Covers applyTutorialPatchOp + applyTutorialFixPatch dispatch behavior.
 * Filesystem round-trips for applyTutorialFixPatch are validated via the
 * e2e suite (which uses a real .pipeline tree).
 */
import { describe, expect, it } from 'vitest';
import { applyTutorialPatchOp } from '../agent-fix-runner';

const mkTutorial = () => ({
  id: 'test-tut',
  steps: [
    { id: 'step-1', title: 'Step 1', instruction: 'Do A' },
    { id: 'step-2', title: 'Step 2', instruction: 'Do B' },
    { id: 'step-3', title: 'Step 3', instruction: 'Do C' },
  ],
});

describe('applyTutorialPatchOp — /steps/<idx> whole-step ops', () => {
  it('replaces whole step at index', () => {
    const t = mkTutorial();
    applyTutorialPatchOp(t, {
      op: 'replace',
      path: '/steps/1',
      value: { id: 'new-step-2', title: 'New 2', instruction: 'Updated' },
    });
    expect(t.steps[1]).toEqual({ id: 'new-step-2', title: 'New 2', instruction: 'Updated' });
    expect(t.steps[0].id).toBe('step-1');
    expect(t.steps[2].id).toBe('step-3');
  });

  it('inserts a step at index, shifting others', () => {
    const t = mkTutorial();
    applyTutorialPatchOp(t, {
      op: 'add',
      path: '/steps/1',
      value: { id: 'inserted', title: 'Inserted', instruction: 'New step' },
    });
    expect(t.steps).toHaveLength(4);
    expect(t.steps[0].id).toBe('step-1');
    expect(t.steps[1].id).toBe('inserted');
    expect(t.steps[2].id).toBe('step-2');
    expect(t.steps[3].id).toBe('step-3');
  });

  it('appends with /steps/-', () => {
    const t = mkTutorial();
    applyTutorialPatchOp(t, {
      op: 'add',
      path: '/steps/-',
      value: { id: 'appended', title: 'Appended', instruction: 'Last' },
    });
    expect(t.steps).toHaveLength(4);
    expect(t.steps[3].id).toBe('appended');
  });

  it('removes a step at index', () => {
    const t = mkTutorial();
    applyTutorialPatchOp(t, { op: 'remove', path: '/steps/1' });
    expect(t.steps).toHaveLength(2);
    expect(t.steps[0].id).toBe('step-1');
    expect(t.steps[1].id).toBe('step-3');
  });

  it('rejects out-of-bounds replace', () => {
    const t = mkTutorial();
    expect(() => applyTutorialPatchOp(t, { op: 'replace', path: '/steps/99', value: { id: 'x' } }))
      .toThrow(/invalid \/steps index/);
  });

  it('rejects out-of-bounds remove', () => {
    const t = mkTutorial();
    expect(() => applyTutorialPatchOp(t, { op: 'remove', path: '/steps/99' }))
      .toThrow(/invalid \/steps index/);
  });

  it('rejects non-/steps path', () => {
    const t = mkTutorial();
    expect(() => applyTutorialPatchOp(t, { op: 'replace', path: '/title', value: 'X' }))
      .toThrow(/non-\/steps path/);
  });

  it('rejects depth > 2', () => {
    const t = mkTutorial();
    expect(() => applyTutorialPatchOp(t, { op: 'replace', path: '/steps/0/instruction', value: 'X' }))
      .toThrow(/unsupported tutorial-level path depth/);
  });

  it('rejects append with op=replace', () => {
    const t = mkTutorial();
    expect(() => applyTutorialPatchOp(t, { op: 'replace', path: '/steps/-', value: { id: 'x' } }))
      .toThrow(/append \(-\) only valid with op=add/);
  });

  it('rejects unsupported op', () => {
    const t = mkTutorial();
    expect(() => applyTutorialPatchOp(t, { op: 'move' as 'replace', path: '/steps/0', value: { id: 'x' } }))
      .toThrow(/unsupported op/);
  });

  it('handles insert at exact length (append via index)', () => {
    const t = mkTutorial();
    applyTutorialPatchOp(t, {
      op: 'add',
      path: '/steps/3', // length is 3, so this is equivalent to append
      value: { id: 'at-end' },
    });
    expect(t.steps).toHaveLength(4);
    expect(t.steps[3].id).toBe('at-end');
  });

  it('reorder pattern: remove then insert preserves step contents', () => {
    const t = mkTutorial();
    const step2 = { ...t.steps[1] };
    applyTutorialPatchOp(t, { op: 'remove', path: '/steps/1' });
    applyTutorialPatchOp(t, { op: 'add', path: '/steps/0', value: step2 });
    expect(t.steps.map((s) => s.id)).toEqual(['step-2', 'step-1', 'step-3']);
  });
});
