import { describe, it, expect } from 'vitest';
import { groupVersions, formatDayLabel, relativeTime, relativeTimeRange } from '../groupVersions';
import type { Version } from '../groupVersions';

const NOW = new Date('2026-05-14T12:00:00Z');

function v(ts: string, source?: Version['source'], isCurrent = false): Version {
  return {
    filename: source ? `${source}-${ts}.json` : `${ts}.json`,
    timestamp: ts,
    sizeBytes: 1000,
    isCurrent,
    source,
  };
}

describe('groupVersions', () => {
  it('returns empty array for no input', () => {
    expect(groupVersions([], NOW)).toEqual([]);
  });

  it('shows current entry at top with no day separator before it', () => {
    const result = groupVersions([v('2026-05-14T11:59:00Z', undefined, true)], NOW);
    expect(result[0]).toEqual({ type: 'current', entry: expect.objectContaining({ isCurrent: true }) });
  });

  it('coalesces 3 close autosaves into one group', () => {
    const versions = [
      v('2026-05-14T11:55:00Z', 'autosave'),
      v('2026-05-14T11:52:00Z', 'autosave'),
      v('2026-05-14T11:50:00Z', 'autosave'),
    ];
    const result = groupVersions(versions, NOW);
    // [day-separator: Today, autosave-group with 3 entries]
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: 'day-separator', dayLabel: 'Today' });
    expect(result[1]).toMatchObject({
      type: 'autosave-group',
      entries: expect.arrayContaining([versions[0], versions[1], versions[2]]),
    });
  });

  it('breaks a group when a discrete entry appears', () => {
    const versions = [
      v('2026-05-14T11:58:00Z', 'autosave'),
      v('2026-05-14T11:55:00Z', 'manual'),
      v('2026-05-14T11:52:00Z', 'autosave'),
    ];
    const result = groupVersions(versions, NOW);
    // [day-sep, autosave-group(1), discrete(manual), autosave-group(1)]
    expect(result).toHaveLength(4);
    expect(result[1]).toMatchObject({ type: 'autosave-group' });
    expect(result[2]).toMatchObject({ type: 'discrete', source: 'manual' });
    expect(result[3]).toMatchObject({ type: 'autosave-group' });
  });

  it('splits group when gap exceeds COALESCE_GAP_MS (10 min)', () => {
    const versions = [
      v('2026-05-14T11:55:00Z', 'autosave'),
      v('2026-05-14T11:40:00Z', 'autosave'), // 15 min gap
      v('2026-05-14T11:38:00Z', 'autosave'),
    ];
    const result = groupVersions(versions, NOW);
    // [day-sep, autosave-group(1), autosave-group(2)]
    expect(result).toHaveLength(3);
    expect(result[1]).toMatchObject({ type: 'autosave-group', entries: [versions[0]] });
    expect(result[2]).toMatchObject({ type: 'autosave-group', entries: [versions[1], versions[2]] });
  });

  it('inserts day separators between calendar days', () => {
    const versions = [
      v('2026-05-14T11:50:00Z', 'autosave'),  // Today
      v('2026-05-13T22:00:00Z', 'autosave'),  // Yesterday
      v('2026-05-11T10:00:00Z', 'manual'),    // Older
    ];
    const result = groupVersions(versions, NOW);
    expect(result.map(r => r.type)).toEqual([
      'day-separator',  // Today
      'autosave-group',
      'day-separator',  // Yesterday
      'autosave-group',
      'day-separator',  // May 11
      'discrete',
    ]);
  });

  it('legacy backup without source defaults to autosave', () => {
    const versions = [v('2026-05-14T11:55:00Z', undefined)];
    const result = groupVersions(versions, NOW);
    expect(result[1].type).toBe('autosave-group');
  });

  it('day separator breaks an in-progress group', () => {
    // Use noon UTC times so local-day boundaries are unambiguous regardless of tz
    const versions = [
      v('2026-05-14T12:00:00Z', 'autosave'), // Today
      v('2026-05-13T12:05:00Z', 'autosave'), // Yesterday — different calendar day in any tz
    ];
    const result = groupVersions(versions, NOW);
    // Even though both are autosave, day boundary breaks the group
    expect(result.map(r => r.type)).toEqual([
      'day-separator',
      'autosave-group',
      'day-separator',
      'autosave-group',
    ]);
  });

  it('all four source types appear as discrete entries', () => {
    const versions = [
      v('2026-05-14T11:58:00Z', 'send'),
      v('2026-05-14T11:55:00Z', 'submit'),
      v('2026-05-14T11:52:00Z', 'manual'),
      v('2026-05-14T11:50:00Z', 'restore'),
    ];
    const result = groupVersions(versions, NOW);
    const discretes = result.filter(r => r.type === 'discrete');
    expect(discretes).toHaveLength(4);
    expect(discretes.map(d => 'source' in d ? d.source : null)).toEqual(['send', 'submit', 'manual', 'restore']);
  });
});

describe('formatDayLabel', () => {
  it('labels today as "Today"', () => {
    expect(formatDayLabel('2026-05-14T08:00:00Z', NOW)).toBe('Today');
  });
  it('labels yesterday as "Yesterday"', () => {
    expect(formatDayLabel('2026-05-13T22:00:00Z', NOW)).toBe('Yesterday');
  });
  it('labels older days with month + day', () => {
    expect(formatDayLabel('2026-05-11T22:00:00Z', NOW)).toMatch(/May\s*11/);
  });
});

describe('relativeTime', () => {
  it('< 1 min ago = Just now', () => {
    expect(relativeTime('2026-05-14T11:59:40Z', NOW)).toBe('Just now');
  });
  it('5 min ago', () => {
    expect(relativeTime('2026-05-14T11:55:00Z', NOW)).toBe('5m ago');
  });
  it('2 hr ago', () => {
    expect(relativeTime('2026-05-14T10:00:00Z', NOW)).toBe('2h ago');
  });
  it('3 days ago', () => {
    expect(relativeTime('2026-05-11T12:00:00Z', NOW)).toBe('3d ago');
  });
});

describe('relativeTimeRange', () => {
  it('same value collapses to single', () => {
    expect(relativeTimeRange('2026-05-14T11:59:30Z', '2026-05-14T11:59:40Z', NOW)).toBe('Just now');
  });
  it('different values show range newest – oldest', () => {
    expect(relativeTimeRange('2026-05-14T11:40:00Z', '2026-05-14T11:55:00Z', NOW)).toBe('5m ago – 20m ago');
  });
});
