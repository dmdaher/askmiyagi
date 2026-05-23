/**
 * Figma-style coalescing for the version-history dropdown.
 *
 * Why: contractor saw "Just now × 5" because every autosave (1.5s debounce)
 * created a discrete entry. After the throttle fix backups are throttled to
 * 1 per minute, but a busy session still produces ~60 autosaves/hour. Flat
 * list = visual noise. Figma / Google Docs / Notion all show MEANINGFUL
 * milestones at the top level and collapse continuous edits into a group.
 *
 * Algorithm:
 *   - Sort newest-first
 *   - Walk entries; consecutive autosaves whose gap < COALESCE_GAP_MS join
 *     into a single group
 *   - Any non-autosave entry (manual / submit / send / restore) breaks the
 *     group — it's a deliberate milestone the user wants to see clearly
 *   - Day separators inserted between entries on different calendar days
 */

export type BackupSource = 'autosave' | 'manual' | 'submit' | 'send' | 'restore';

export interface Version {
  filename: string;
  timestamp: string;
  sizeBytes: number;
  isCurrent: boolean;
  source?: BackupSource;
}

export type GroupedEntry =
  | { type: 'current'; entry: Version }
  | { type: 'discrete'; source: Exclude<BackupSource, 'autosave'>; entry: Version }
  | {
      type: 'autosave-group';
      firstTimestamp: string; // oldest in the group
      lastTimestamp: string;  // newest in the group
      entries: Version[];     // newest-first
    }
  | { type: 'day-separator'; dayLabel: string };

const COALESCE_GAP_MS = 10 * 60 * 1000; // 10 minutes — adjacent autosaves merge

/**
 * Format a date as "Today", "Yesterday", or "May 11".
 * Used for day separator labels.
 */
export function formatDayLabel(timestamp: string, now: Date = new Date()): string {
  const d = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dayStart.getTime() === today.getTime()) return 'Today';
  if (dayStart.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Group versions by Figma-style coalescing rules.
 *
 * Returns a flat list with day separators inserted between entries on different
 * calendar days. The first entry is always the 'current' marker if present.
 */
export function groupVersions(versions: Version[], now: Date = new Date()): GroupedEntry[] {
  // Separate "current" from historical entries
  const current = versions.find(v => v.isCurrent);
  const history = versions.filter(v => !v.isCurrent);

  // Sort historical entries newest-first
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const result: GroupedEntry[] = [];
  if (current) {
    result.push({ type: 'current', entry: current });
  }

  let activeGroup: Extract<GroupedEntry, { type: 'autosave-group' }> | null = null;
  let lastDayLabel: string | null = null;

  for (const v of sorted) {
    const source: BackupSource = v.source ?? 'autosave';
    const dayLabel = formatDayLabel(v.timestamp, now);

    // Insert day separator when crossing a day boundary
    if (dayLabel !== lastDayLabel) {
      // Flush any active group before inserting separator
      activeGroup = null;
      result.push({ type: 'day-separator', dayLabel });
      lastDayLabel = dayLabel;
    }

    if (source === 'autosave') {
      // Try to extend the current group
      if (activeGroup) {
        const lastTime = new Date(activeGroup.lastTimestamp).getTime();
        const thisTime = new Date(v.timestamp).getTime();
        // entries are newest-first, so lastTimestamp >= thisTime
        const gapMs = lastTime - thisTime;
        if (gapMs < COALESCE_GAP_MS) {
          activeGroup.entries.push(v);
          activeGroup.firstTimestamp = v.timestamp; // oldest moves earlier
          continue;
        }
      }
      // Start a new group
      activeGroup = {
        type: 'autosave-group',
        firstTimestamp: v.timestamp,
        lastTimestamp: v.timestamp,
        entries: [v],
      };
      result.push(activeGroup);
    } else {
      // Discrete entry — breaks any active group
      activeGroup = null;
      result.push({ type: 'discrete', source, entry: v });
    }
  }

  return result;
}

/**
 * Format a relative time like "Just now", "5m ago", "2h ago", "3d ago".
 */
export function relativeTime(timestamp: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format a time range like "5m–17m ago" for a group spanning multiple times.
 * If start and end resolve to the same string, returns the single value.
 */
export function relativeTimeRange(firstTimestamp: string, lastTimestamp: string, now: Date = new Date()): string {
  const newest = relativeTime(lastTimestamp, now);
  const oldest = relativeTime(firstTimestamp, now);
  if (newest === oldest) return newest;
  return `${newest} – ${oldest}`;
}
