'use client';

/**
 * Pure presentational component for displaying coverage audit results.
 * Used by:
 *   - CoverageReportModal (full-screen overlay from device detail page)
 *   - CoverageTab (inline within canvas review page sidebar)
 *
 * NO data fetching, NO state — caller passes parsed match-table data.
 */

import type { MatchRow, MatchTableSummary } from '@/lib/pipeline/coverage-scorer';

export interface CoverageReportProps {
  summary: MatchTableSummary;
  missing: MatchRow[];
  parentOnlyGaps: MatchRow[];
  /** Show cost line in footer. Tab variant may hide if irrelevant. */
  costUsd?: number;
  /** Show source path line in footer. */
  matchTablePath?: string;
  /** If non-null, show "Last audit: X ago" line. */
  lastAuditMs?: number | null;
  /** Compact = no extra whitespace, smaller summary cards. Use for tab. */
  compact?: boolean;
}

function relTime(ms: number | null | undefined): string {
  if (!ms) return '';
  const ago = Date.now() - ms;
  const s = Math.round(ago / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function CoverageReport({
  summary,
  missing,
  parentOnlyGaps,
  costUsd,
  matchTablePath,
  lastAuditMs,
  compact = false,
}: CoverageReportProps) {
  const coveragePct = summary.total > 0
    ? Math.round((summary.confirmed / summary.total) * 100)
    : 0;
  const coverageColor = coveragePct >= 90 ? '#22c55e' : coveragePct >= 70 ? '#f59e0b' : '#ef4444';
  const last = relTime(lastAuditMs);

  return (
    <div data-testid="coverage-report" className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Summary cards */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <div className="rounded p-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="text-2xl font-semibold" style={{ color: coverageColor }}>{coveragePct}%</div>
          <div className="text-xs text-gray-500 mt-1">Coverage</div>
        </div>
        <div className="rounded p-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
          <div className="text-2xl font-semibold text-green-400">{summary.confirmed}</div>
          <div className="text-xs text-gray-500 mt-1">Confirmed</div>
        </div>
        <div className="rounded p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <div className="text-2xl font-semibold text-red-400">{missing.length}</div>
          <div className="text-xs text-gray-500 mt-1">Missing</div>
        </div>
        <div className="rounded p-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
          <div className="text-2xl font-semibold text-amber-400">{parentOnlyGaps.length}</div>
          <div className="text-xs text-gray-500 mt-1">Parent-only gaps</div>
        </div>
      </div>

      {/* Missing list */}
      {missing.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide">
            Missing ({missing.length})
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            These features appear in the manual but have no tutorial coverage. To build them: add to the batch plan in
            the auditor output, then click <strong>Regenerate Tutorials</strong>.
          </p>
          <div className={`space-y-2 ${compact ? 'max-h-48' : 'max-h-64'} overflow-y-auto`}>
            {missing.map((row) => (
              <div
                key={row.featureId}
                className="rounded p-2 text-xs"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)' }}
              >
                <div className="font-mono text-red-400">{row.featureId}</div>
                <div className="text-gray-200 mt-0.5">{row.featureName}</div>
                {row.page && <div className="text-gray-500 mt-0.5">manual page {row.page}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parent-only gaps list */}
      {parentOnlyGaps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-wide">
            Parent-only gaps ({parentOnlyGaps.length})
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            These features fall within sections the tutorials nominally cover, but no specific step teaches the feature
            itself. Lower-priority than MISSING — consider whether each warrants its own tutorial.
          </p>
          <div className={`space-y-2 ${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
            {parentOnlyGaps.map((row) => (
              <div
                key={row.featureId}
                className="rounded p-2 text-xs"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.15)' }}
              >
                <div className="font-mono text-amber-400">{row.featureId}</div>
                <div className="text-gray-200 mt-0.5">{row.featureName}</div>
                {row.page && <div className="text-gray-500 mt-0.5">manual page {row.page}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {missing.length === 0 && parentOnlyGaps.length === 0 && (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-sm text-green-400 font-medium">No gaps found</p>
          <p className="text-xs text-gray-500 mt-1">All {summary.total} features in the manual are covered.</p>
        </div>
      )}

      {/* Footer meta */}
      {(matchTablePath || lastAuditMs || costUsd !== undefined) && (
        <div className="text-[10px] text-gray-500 pt-2 border-t border-white/10 space-y-0.5">
          {last && <div>Last audit: <span className="text-gray-300">{last}</span></div>}
          {costUsd !== undefined && <div>Audit cost: <span className="text-gray-300">${costUsd.toFixed(2)}</span></div>}
          {matchTablePath && <div className="truncate" title={matchTablePath}>Source: <code className="font-mono">{matchTablePath}</code></div>}
        </div>
      )}
    </div>
  );
}
