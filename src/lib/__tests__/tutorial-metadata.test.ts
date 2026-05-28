import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RECENT_WINDOW_DAYS,
  getRecentlyAddedTutorials,
  isRecentlyAdded,
} from '../tutorial-metadata';
import type { Tutorial } from '@/types/tutorial';

const NOW = Date.parse('2026-06-01T00:00:00Z'); // fixed "now" for deterministic tests

function makeTutorial(id: string, addedDate?: string): Tutorial {
  return {
    id,
    deviceId: 'test',
    title: `Tutorial ${id}`,
    description: '',
    category: 'general',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    steps: [],
    tags: [],
    ...(addedDate ? { addedDate } : {}),
  };
}

describe('getRecentlyAddedTutorials', () => {
  it('returns tutorials added in the last N days, newest first', () => {
    const tutorials = [
      makeTutorial('a', '2026-05-30'), // 2 days ago
      makeTutorial('b', '2026-05-20'), // 12 days ago
      makeTutorial('c', '2026-05-15'), // 17 days ago — outside 14d window
      makeTutorial('d', '2026-05-25'), // 7 days ago
      makeTutorial('e'),               // no date — excluded
    ];
    const recent = getRecentlyAddedTutorials(tutorials, 14, NOW);
    expect(recent.map((t) => t.id)).toEqual(['a', 'd', 'b']);
  });

  it('uses default window of 14 days when not specified', () => {
    expect(DEFAULT_RECENT_WINDOW_DAYS).toBe(14);
    const tutorials = [makeTutorial('a', '2026-05-30')]; // 2 days ago
    const recent = getRecentlyAddedTutorials(tutorials, undefined, NOW);
    expect(recent).toHaveLength(1);
  });

  it('boundary: tutorial added EXACTLY at the window edge is included', () => {
    // 14 days ago to the millisecond
    const fourteenDaysAgo = new Date(NOW - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD
    const tutorials = [makeTutorial('edge', fourteenDaysAgo)];
    const recent = getRecentlyAddedTutorials(tutorials, 14, NOW);
    expect(recent.map((t) => t.id)).toEqual(['edge']);
  });

  it('excludes tutorials without addedDate', () => {
    const tutorials = [makeTutorial('a'), makeTutorial('b')];
    expect(getRecentlyAddedTutorials(tutorials, 14, NOW)).toEqual([]);
  });

  it('handles invalid addedDate strings gracefully (excluded, no throw)', () => {
    const tutorials = [
      makeTutorial('a', 'not-a-date'),
      makeTutorial('b', ''),
      makeTutorial('c', '2026-05-30'),
    ];
    const recent = getRecentlyAddedTutorials(tutorials, 14, NOW);
    expect(recent.map((t) => t.id)).toEqual(['c']);
  });

  it('returns empty array when input is empty', () => {
    expect(getRecentlyAddedTutorials([], 14, NOW)).toEqual([]);
  });

  it('supports custom sinceDays (1-day window)', () => {
    const tutorials = [
      makeTutorial('today', '2026-06-01'),
      makeTutorial('yesterday', '2026-05-31'),
      makeTutorial('two-days', '2026-05-30'),
    ];
    const recent = getRecentlyAddedTutorials(tutorials, 1, NOW);
    expect(recent.map((t) => t.id)).toEqual(['today', 'yesterday']);
  });
});

describe('isRecentlyAdded', () => {
  it('returns true for a tutorial within the window', () => {
    expect(isRecentlyAdded(makeTutorial('a', '2026-05-30'), 14, NOW)).toBe(true);
  });

  it('returns false for a tutorial older than the window', () => {
    expect(isRecentlyAdded(makeTutorial('a', '2026-05-01'), 14, NOW)).toBe(false);
  });

  it('returns false when addedDate is absent', () => {
    expect(isRecentlyAdded(makeTutorial('a'), 14, NOW)).toBe(false);
  });

  it('returns false when addedDate is invalid', () => {
    expect(isRecentlyAdded(makeTutorial('a', 'bogus'), 14, NOW)).toBe(false);
  });
});
