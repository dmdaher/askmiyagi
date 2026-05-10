'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Severity } from '@/lib/pipeline/manifest-repair';

interface AttentionItem {
  id: string;
  deviceId: string;
  severity: Severity;
  kind: string;
  description: string;
  suggestedAction: string;
  originalState?: Record<string, unknown>;
  timestamp: string;
  reviewed: boolean;
}

interface AttentionResponse {
  items: AttentionItem[];
  counts: Record<Severity, number>;
  total: number;
  unreviewed: number;
}

const SEVERITY_STYLES: Record<Severity, { icon: string; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: '!', color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', label: 'CRITICAL' },
  high:     { icon: '⚠', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.30)', label: 'HIGH' },
  medium:   { icon: '◆', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', label: 'MEDIUM' },
  low:      { icon: '·', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.06)', border: 'rgba(156, 163, 175, 0.20)', label: 'LOW' },
};

const POLL_MS = 30_000;

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function AttentionInventory() {
  const [data, setData] = useState<AttentionResponse | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showReviewed, setShowReviewed] = useState(false);
  // Default: hide medium/low (cosmetic stuff like dissolved containers).
  // Admin only wants to see things that could affect tutorials — missing
  // controls, unlinked labels. Medium items stay in the audit log but
  // don't compete for admin attention.
  const [showLowPriority, setShowLowPriority] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/attention-items', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch {
      /* network blip — keep showing stale data */
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const t = setInterval(fetchItems, POLL_MS);
    return () => clearInterval(t);
  }, [fetchItems]);

  const markReviewed = useCallback(async (itemId: string, reviewed: boolean) => {
    setBusyIds((s) => new Set(s).add(itemId));
    try {
      await fetch('/api/admin/attention-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, reviewed }),
      });
      await fetchItems();
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(itemId);
        return next;
      });
    }
  }, [fetchItems]);

  if (!data) return null;

  // Default filter: only HIGH + CRITICAL (things that could affect tutorials).
  // Medium = cosmetic cleanup (dissolved containers, etc.), low = format warnings.
  // Toggle reveals everything for power users.
  const tutorialAffecting = (i: AttentionItem) => i.severity === 'critical' || i.severity === 'high';
  const severityFiltered = showLowPriority ? data.items : data.items.filter(tutorialAffecting);
  const visibleItems = showReviewed ? severityFiltered : severityFiltered.filter((i) => !i.reviewed);

  const unreviewedHigh = data.counts.high + data.counts.critical;
  const hiddenLowPriority = data.items.filter((i) => !tutorialAffecting(i) && !i.reviewed).length;

  // Empty state — only show when no items at all (not just no unreviewed)
  if (data.total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.25)' }}
      >
        <div
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.18)', color: '#4ade80' }}
        >
          ✓
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{ color: '#9ca3af' }}>
            Attention inventory: empty
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
            Auto-repair hasn't flagged anything across your pipelines. Healthy.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-6 rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      {/* Header — count reflects ONLY tutorial-affecting items (high+critical)
          by default. Low-priority cosmetic items don't compete for the
          eyebrow-raise. */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex-1 flex items-center gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: unreviewedHigh > 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(34, 197, 94, 0.18)',
              color: unreviewedHigh > 0 ? '#fbbf24' : '#4ade80',
            }}
          >
            {unreviewedHigh > 0 ? unreviewedHigh : '✓'}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground, #e0e0e0)' }}>
              Attention inventory
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>
              {unreviewedHigh > 0
                ? <>{unreviewedHigh} item{unreviewedHigh === 1 ? '' : 's'} that may affect tutorials — review when convenient</>
                : <>No tutorial-affecting items{hiddenLowPriority > 0 ? <> · {hiddenLowPriority} cosmetic items hidden</> : ''}</>}
            </p>
          </div>
        </div>
        <span style={{ color: '#6b7280', fontSize: '10px' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--card-border, #2a2a3a)' }}>
              {/* Filter strip */}
              <div className="flex items-center gap-3 py-2.5 text-[11px] flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer" style={{ color: '#9ca3af' }}>
                  <input
                    type="checkbox"
                    checked={showLowPriority}
                    onChange={(e) => setShowLowPriority(e.target.checked)}
                    className="h-3 w-3 accent-blue-500"
                  />
                  Show cosmetic items
                  {hiddenLowPriority > 0 && !showLowPriority && (
                    <span style={{ color: '#6b7280' }}> ({hiddenLowPriority} hidden)</span>
                  )}
                </label>
                <span style={{ color: '#6b7280' }}>·</span>
                <label className="flex items-center gap-1.5 cursor-pointer" style={{ color: '#9ca3af' }}>
                  <input
                    type="checkbox"
                    checked={showReviewed}
                    onChange={(e) => setShowReviewed(e.target.checked)}
                    className="h-3 w-3 accent-blue-500"
                  />
                  Show reviewed
                </label>
                <span style={{ color: '#6b7280' }}>·</span>
                <span style={{ color: '#6b7280' }}>{visibleItems.length} visible</span>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {visibleItems.length === 0 ? (
                  <p className="text-xs py-3 text-center" style={{ color: '#6b7280' }}>
                    All caught up. Toggle "Show reviewed" to see history.
                  </p>
                ) : (
                  visibleItems.map((item) => {
                    const sev = SEVERITY_STYLES[item.severity];
                    const isBusy = busyIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg px-3 py-2 flex items-start gap-3"
                        style={{
                          backgroundColor: sev.bg,
                          border: `1px solid ${sev.border}`,
                          opacity: item.reviewed ? 0.5 : 1,
                        }}
                      >
                        {/* Severity badge */}
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold mt-0.5"
                          style={{ backgroundColor: `${sev.color}25`, color: sev.color }}
                          title={sev.label}
                        >
                          {sev.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                              {item.deviceId}
                            </span>
                            <span className="text-[10px]" style={{ color: '#6b7280' }}>
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs leading-snug" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                            {item.description}
                          </p>
                          <p className="text-[11px] leading-snug mt-1" style={{ color: '#9ca3af' }}>
                            <span style={{ color: sev.color }}>Suggested:</span> {item.suggestedAction}
                          </p>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => markReviewed(item.id, !item.reviewed)}
                          disabled={isBusy}
                          className="flex-shrink-0 self-center text-[11px] px-2.5 py-1 rounded transition-colors hover:bg-white/10 disabled:opacity-40"
                          style={{ color: item.reviewed ? '#60a5fa' : '#9ca3af', border: '1px solid #374151' }}
                        >
                          {isBusy ? '...' : item.reviewed ? 'Unreview' : 'Mark reviewed'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
