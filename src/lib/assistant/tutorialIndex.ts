import { Tutorial } from '@/types/tutorial';
import { TutorialSummary } from '@/types/assistant';
import { fantom08Tutorials } from '@/data/tutorials/fantom-08';

export function buildTutorialIndex(tutorials: Tutorial[]): TutorialSummary[] {
  return tutorials.map((t) => {
    const allText: string[] = [t.title, t.description, ...t.tags];
    const topicsSet = new Set<string>();
    const controlsSet = new Set<string>();
    const screensSet = new Set<string>();

    for (const step of t.steps) {
      allText.push(step.title, step.instruction);
      if (step.details) allText.push(step.details);
      if (step.tipText) allText.push(step.tipText);

      topicsSet.add(step.title.toLowerCase());

      for (const ctrl of step.highlightControls) {
        controlsSet.add(ctrl);
      }

      if (step.displayState?.screenType) {
        screensSet.add(step.displayState.screenType);
      }
    }

    return {
      tutorialId: t.id,
      deviceId: t.deviceId,
      title: t.title,
      description: t.description,
      category: t.category,
      difficulty: t.difficulty,
      estimatedTime: t.estimatedTime,
      tags: t.tags,
      stepCount: t.steps.length,
      searchableText: allText.join(' ').toLowerCase(),
      topics: Array.from(topicsSet),
      controlsReferenced: Array.from(controlsSet),
      screensReferenced: Array.from(screensSet),
    };
  });
}

const indexCache = new Map<string, TutorialSummary[]>();

export function getTutorialIndex(deviceId: string): TutorialSummary[] {
  if (indexCache.has(deviceId)) return indexCache.get(deviceId)!;

  let tutorials: Tutorial[];
  switch (deviceId) {
    case 'fantom-08':
      tutorials = fantom08Tutorials;
      break;
    default:
      tutorials = [];
  }

  const index = buildTutorialIndex(tutorials);
  indexCache.set(deviceId, index);
  return index;
}
