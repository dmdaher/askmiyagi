/**
 * Tiny relative-time formatter — returns a human-readable string like
 * "5 minutes ago", "2 hours ago", "3 days ago".
 *
 * Inline replacement for `date-fns` formatDistanceToNow to avoid pulling
 * in the dep just for one helper.
 */
export function formatTimeAgo(input: Date | string | null | undefined): string {
  if (!input) return 'unknown';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return 'unknown';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return 'just now'; // future-dated (clock skew)
  if (seconds < 60) return 'less than a minute ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/** True if the date was within the last `hoursWindow` hours (default 24). */
export function isRecent(input: Date | string | null | undefined, hoursWindow = 24): boolean {
  if (!input) return false;
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return false;
  const ageMs = Date.now() - date.getTime();
  return ageMs >= 0 && ageMs < hoursWindow * 60 * 60 * 1000;
}
