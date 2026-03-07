import { describe, it, expect } from 'vitest';
import { buildTutorialIndex, getTutorialIndex } from '@/lib/assistant/tutorialIndex';
import { fantom08Tutorials } from '@/data/tutorials/fantom-08';

describe('tutorialIndex', () => {
  const index = buildTutorialIndex(fantom08Tutorials);

  it('indexes all tutorials', () => {
    expect(index.length).toBe(fantom08Tutorials.length);
  });

  it('each summary has required fields', () => {
    for (const summary of index) {
      expect(summary.tutorialId).toBeTruthy();
      expect(summary.deviceId).toBeTruthy();
      expect(summary.title).toBeTruthy();
      expect(summary.searchableText.length).toBeGreaterThan(0);
      expect(summary.stepCount).toBeGreaterThan(0);
      expect(summary.topics.length).toBeGreaterThan(0);
    }
  });

  it('searchableText contains step instructions', () => {
    const splitTutorial = index.find(s => s.tutorialId === 'split-keyboard-zones');
    expect(splitTutorial).toBeDefined();
    expect(splitTutorial!.searchableText).toContain('split');
    expect(splitTutorial!.searchableText).toContain('zone');
  });

  it('controlsReferenced extracts control IDs from steps', () => {
    const splitTutorial = index.find(s => s.tutorialId === 'split-keyboard-zones');
    expect(splitTutorial).toBeDefined();
    expect(splitTutorial!.controlsReferenced).toContain('split');
  });

  it('getTutorialIndex returns cached singleton', () => {
    const a = getTutorialIndex('fantom-08');
    const b = getTutorialIndex('fantom-08');
    expect(a).toBe(b);
  });
});
