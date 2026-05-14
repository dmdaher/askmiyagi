'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { isHosted } from '@/lib/env';
import {
  groupVersions,
  relativeTime,
  relativeTimeRange,
  type Version,
  type GroupedEntry,
  type BackupSource,
} from './version-history/groupVersions';

const PAGE_SIZE = 50;

/**
 * Picks the version API base for this device.
 *
 * - Hosted contractor mode → /api/hosted/panels/<id>/history
 *   GET lists Blob backups; POST { filename: <blob-url> } restores.
 * - Local admin/sandbox mode → /api/pipeline/<id>/versions
 *   GET lists filesystem backups; POST /versions/restore { filename } restores.
 *
 * Both endpoints return the same shape ({ versions, total }) and accept the
 * same restore payload ({ filename }), so this dropdown is mode-agnostic.
 */
function getVersionEndpoints(deviceId: string) {
  const useHosted = isHosted || deviceId.startsWith('sandbox-');
  if (useHosted) {
    return {
      list: `/api/hosted/panels/${deviceId}/history`,
      restore: `/api/hosted/panels/${deviceId}/history`,
    };
  }
  return {
    list: `/api/pipeline/${deviceId}/versions`,
    restore: `/api/pipeline/${deviceId}/versions/restore`,
  };
}

/**
 * Source → visual treatment for discrete entries.
 *
 * Manual / Submit / Send / Restore each get a distinct accent color +
 * label so the contractor can scan history at a glance.
 */
const SOURCE_PRESENTATION: Record<
  Exclude<BackupSource, 'autosave'>,
  { label: string; chipClass: string; iconClass: string }
> = {
  manual: {
    label: 'Saved',
    chipClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    iconClass: 'text-amber-400',
  },
  submit: {
    label: 'Submitted for review',
    chipClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    iconClass: 'text-emerald-400',
  },
  send: {
    // From contractor's perspective: this snapshot is YOUR work just before
    // the admin sent a fresh manifest that overwrote it. Restoring this entry
    // brings back your pre-overwrite state.
    label: 'Before admin update',
    chipClass: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    iconClass: 'text-blue-400',
  },
  restore: {
    label: 'Pre-restore snapshot',
    chipClass: 'bg-gray-500/15 text-gray-300 border border-gray-500/30',
    iconClass: 'text-gray-400',
  },
};

export default function VersionHistoryDropdown({ deviceId, onRestore }: { deviceId: string; onRestore?: () => void }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const { list } = getVersionEndpoints(deviceId);
      const res = await fetch(list);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions ?? []);
      }
    } catch {
      // Silent fail
    }
    setLoading(false);
  }, [deviceId]);

  const handleToggle = useCallback(() => {
    if (!open) {
      setVisibleCount(PAGE_SIZE);
      setExpandedGroups(new Set());
      fetchVersions();
    }
    setOpen(!open);
  }, [open, fetchVersions]);

  const handleRestore = useCallback(async (filename: string) => {
    if (!confirm('Restore this version? Your current work will be backed up first.')) return;
    setRestoring(filename);
    try {
      const { restore } = getVersionEndpoints(deviceId);
      const res = await fetch(restore, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Restore failed:', body.error);
        setRestoring(null);
        return;
      }
      setOpen(false);
      if (onRestore) onRestore();
    } catch (err) {
      console.error('Restore error:', err);
    }
    setRestoring(null);
  }, [deviceId, onRestore]);

  // Apply pagination on raw versions, then group what's visible.
  // Current entry is always shown; pagination applies to historical entries only.
  const grouped = useMemo<GroupedEntry[]>(() => {
    const current = versions.find(v => v.isCurrent);
    const history = versions.filter(v => !v.isCurrent).slice(0, visibleCount);
    const sliced = current ? [current, ...history] : history;
    return groupVersions(sliced);
  }, [versions, visibleCount]);

  const historicalCount = versions.filter(v => !v.isCurrent).length;
  const hasMore = visibleCount < historicalCount;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex h-7 items-center rounded px-2 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        title="Version History — browse and restore previous saves"
      >
        History
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-80 rounded-lg border border-gray-700 bg-[#0d0d1a] shadow-xl">
          <div className="border-b border-gray-800 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Version History
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500">Loading…</div>
            ) : grouped.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500">No versions yet</div>
            ) : (
              grouped.map((entry, idx) => {
                if (entry.type === 'day-separator') {
                  return (
                    <div
                      key={`day-${idx}-${entry.dayLabel}`}
                      className="border-b border-gray-800/50 bg-gray-900/40 px-3 py-1"
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                        {entry.dayLabel}
                      </span>
                    </div>
                  );
                }

                if (entry.type === 'current') {
                  return (
                    <div
                      key="current"
                      className="flex items-center justify-between border-b border-gray-800/50 bg-blue-500/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-blue-400">●</span>
                        <span className="text-[11px] text-gray-200">Current</span>
                      </div>
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-400">
                        Live
                      </span>
                    </div>
                  );
                }

                if (entry.type === 'discrete') {
                  const pres = SOURCE_PRESENTATION[entry.source];
                  return (
                    <div
                      key={entry.entry.filename}
                      className="flex items-center justify-between border-b border-gray-800/50 px-3 py-2 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-[11px] ${pres.iconClass}`} aria-hidden>◆</span>
                        <div className="flex flex-col min-w-0">
                          <span className={`inline-block max-w-fit rounded px-1.5 py-0 text-[9px] ${pres.chipClass}`}>
                            {pres.label}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {relativeTime(entry.entry.timestamp)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestore(entry.entry.filename)}
                        disabled={restoring !== null}
                        className="rounded border border-gray-600 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-30"
                      >
                        {restoring === entry.entry.filename ? '…' : 'Restore'}
                      </button>
                    </div>
                  );
                }

                // autosave-group
                const groupKey = `group-${entry.firstTimestamp}-${entry.lastTimestamp}`;
                const isExpanded = expandedGroups.has(groupKey);
                const count = entry.entries.length;
                return (
                  <div key={groupKey} className="border-b border-gray-800/50 last:border-0">
                    <button
                      onClick={() => {
                        setExpandedGroups(prev => {
                          const next = new Set(prev);
                          if (next.has(groupKey)) next.delete(groupKey);
                          else next.add(groupKey);
                          return next;
                        });
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-block w-3 text-center text-[9px] text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} aria-hidden>▶</span>
                        <span className="text-[11px] text-gray-400">
                          {count} {count === 1 ? 'autosave' : 'autosaves'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {relativeTimeRange(entry.firstTimestamp, entry.lastTimestamp)}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="bg-black/20 border-t border-gray-800/30">
                        {entry.entries.map(v => (
                          <div
                            key={v.filename}
                            className="flex items-center justify-between border-b border-gray-800/20 px-6 py-1.5 last:border-0"
                          >
                            <span className="text-[10px] text-gray-500">
                              {relativeTime(v.timestamp)}
                            </span>
                            <button
                              onClick={() => handleRestore(v.filename)}
                              disabled={restoring !== null}
                              className="rounded border border-gray-700 bg-gray-800/60 px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200 disabled:opacity-30"
                            >
                              {restoring === v.filename ? '…' : 'Restore'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {hasMore && (
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="w-full border-b border-gray-800/50 px-3 py-2 text-[10px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
              >
                Load {Math.min(PAGE_SIZE, historicalCount - visibleCount)} more
                <span className="ml-1 text-gray-600">
                  ({historicalCount - visibleCount} remaining)
                </span>
              </button>
            )}
          </div>

          {grouped.length > 0 && (
            <div className="border-t border-gray-800 px-3 py-1.5">
              <span className="text-[9px] text-gray-600">
                Showing {Math.min(visibleCount, historicalCount)} of {historicalCount} · Cmd+Z undoes restore
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
