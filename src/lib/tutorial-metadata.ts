/**
 * Tutorial metadata helpers — pure, no side effects.
 *
 * Currently: surface "Recently added" tutorials so users can see which
 * lessons were added in response to a coverage audit. The `addedDate` field
 * on `Tutorial` is the source of truth (optional ISO YYYY-MM-DD string);
 * tutorials without the field are simply excluded from the recent list.
 */

import type { Tutorial } from '@/types/tutorial';

/**
 * Number of days a tutorial is considered "new" by default. 14 days lines up
 * with one sprint and feels recent enough that users notice but not so long
 * that the badge becomes background noise.
 */
export const DEFAULT_RECENT_WINDOW_DAYS = 14;

/**
 * Return tutorials added within the last `sinceDays` days, sorted newest
 * first. Tutorials without `addedDate` are excluded.
 *
 * @param tutorials list to filter (already scoped to a device usually)
 * @param sinceDays inclusive window — a tutorial added exactly `sinceDays`
 *                  days ago still qualifies
 * @param now       override for tests; defaults to Date.now()
 */
export function getRecentlyAddedTutorials(
  tutorials: readonly Tutorial[],
  sinceDays: number = DEFAULT_RECENT_WINDOW_DAYS,
  now: number = Date.now(),
): Tutorial[] {
  const cutoff = now - sinceDays * 24 * 60 * 60 * 1000;
  const withDates = tutorials.filter((t) => {
    if (!t.addedDate) return false;
    const ts = Date.parse(t.addedDate);
    if (Number.isNaN(ts)) return false;
    return ts >= cutoff;
  });
  return withDates.sort((a, b) => {
    const ta = Date.parse(a.addedDate as string);
    const tb = Date.parse(b.addedDate as string);
    return tb - ta;
  });
}

/**
 * Is this tutorial "new" — added within the recent window? Used by
 * TutorialCard to decide whether to render the New badge.
 */
export function isRecentlyAdded(
  tutorial: Tutorial,
  sinceDays: number = DEFAULT_RECENT_WINDOW_DAYS,
  now: number = Date.now(),
): boolean {
  if (!tutorial.addedDate) return false;
  const ts = Date.parse(tutorial.addedDate);
  if (Number.isNaN(ts)) return false;
  const cutoff = now - sinceDays * 24 * 60 * 60 * 1000;
  return ts >= cutoff;
}
