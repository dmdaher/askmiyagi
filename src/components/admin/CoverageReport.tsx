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
  /** Features that appear in tutorial prose but fail the TAUGHT bar
   *  (no dedicated step / no highlights+panelStateChanges / no consequence / no WHY).
   *  Optional for backward compat — older callers may not pass this. */
  mentionedNotTaught?: MatchRow[];
  /** Show cost line in footer. Tab variant may hide if irrelevant. */
  costUsd?: number;
  /** Show source path line in footer. */
  matchTablePath?: string;
  /** If non-null, show "Last audit: X ago" line. */
  lastAuditMs?: number | null;
  /** Compact = no extra whitespace, smaller summary cards. Use for tab. */
  compact?: boolean;
  /** Optional verdict from scoreCoverage(). When provided, shows a prominent
   *  "why" block explaining the verdict (especially useful after self-heal
   *  fails — surfaces lostFeatures or stillMissingDirectives reasoning). */
  verdict?: {
    name: 'CRITICAL' | 'REJECTED' | 'APPROVED_WITH_WARNINGS' | 'APPROVED';
    reason: string;
    selfHealTriggered?: boolean;
    retryCount?: number;
    maxRetries?: number;
  };
}

// Coverage thresholds (mirrors src/lib/pipeline/coverage-scorer.ts).
//   90% = PASS threshold (REJECT_INVENTORY) — below this triggers auto-retry
//   99% = ASPIRATION goal — what we aim for; 95-99% is APPROVED_WITH_WARNINGS
const PASS_THRESHOLD = 90;
const ASPIRATION_GOAL = 99;

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
  mentionedNotTaught = [],
  costUsd,
  matchTablePath,
  lastAuditMs,
  compact = false,
  verdict,
}: CoverageReportProps) {
  const coveragePct = summary.total > 0
    ? Math.round((summary.confirmed / summary.total) * 100)
    : 0;
  const coverageColor = coveragePct >= PASS_THRESHOLD ? '#22c55e' : coveragePct >= 70 ? '#f59e0b' : '#ef4444';
  const last = relTime(lastAuditMs);
  const fromGoal = ASPIRATION_GOAL - coveragePct;
  const passedThreshold = coveragePct >= PASS_THRESHOLD;
  const hitAspiration = coveragePct >= ASPIRATION_GOAL;

  return (
    <div data-testid="coverage-report" className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Verdict reason block — prominent when verdict provided.
          Especially valuable after self-heal exhausts retries: surfaces
          lostFeatures / stillMissingDirectives so admin understands why. */}
      {verdict && (
        <div
          data-testid="coverage-verdict-block"
          className={`text-xs px-3 py-2 rounded border ${
            verdict.name === 'APPROVED'
              ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-200'
              : verdict.name === 'APPROVED_WITH_WARNINGS'
                ? 'bg-amber-900/20 border-amber-700/40 text-amber-200'
                : 'bg-red-900/20 border-red-700/40 text-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <strong>Verdict: {verdict.name}</strong>
            {verdict.retryCount != null && verdict.maxRetries != null && verdict.retryCount > 0 && (
              <span className="text-[10px] opacity-70">Retry {verdict.retryCount}/{verdict.maxRetries}</span>
            )}
          </div>
          <div className="text-[11px] opacity-90 leading-snug">{verdict.reason}</div>
        </div>
      )}

      {/* Summary cards — show 5 cards when MENTIONED_NOT_TAUGHT data is present */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : mentionedNotTaught.length > 0 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <div className="rounded p-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="text-2xl font-semibold" style={{ color: coverageColor }}>{coveragePct}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Coverage</div>
          {/* 90% pass / 99% goal markers */}
          <div className="text-[9px] text-gray-600 mt-1 leading-tight">
            {hitAspiration ? (
              <span className="text-emerald-400">✓ Goal reached (99%)</span>
            ) : passedThreshold ? (
              <span className="text-emerald-400/70">✓ Pass · <span className="text-amber-400/80">{fromGoal}% from goal</span></span>
            ) : (
              <span className="text-red-400/80">Below 90% pass</span>
            )}
          </div>
        </div>
        <div className="rounded p-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)' }}>
          <div className="text-2xl font-semibold text-green-400">{summary.confirmed}</div>
          <div className="text-xs text-gray-500 mt-1">Confirmed (taught)</div>
        </div>
        {mentionedNotTaught.length > 0 && (
          <div className="rounded p-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
            <div className="text-2xl font-semibold text-amber-300">{mentionedNotTaught.length}</div>
            <div className="text-xs text-gray-500 mt-1">Mentioned-only</div>
          </div>
        )}
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
            These features appear in the manual but have no tutorial coverage.
            {' '}
            {coveragePct < PASS_THRESHOLD ? (
              <>Click <strong>Re-check Coverage</strong> above — if coverage is below 90% and retries are available, the pipeline will auto-rebuild missing tutorials.</>
            ) : (
              <>Coverage passes 90% so no auto-rebuild fires. To force a rebuild, add the missing features to the batch plan manually.</>
            )}
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

      {/* Mentioned-not-taught list — feature is in tutorial prose but step
          lacks hands-on practice (no highlights / panelStateChanges / consequence) */}
      {mentionedNotTaught.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-300 mb-2 uppercase tracking-wide">
            Mentioned but not taught ({mentionedNotTaught.length})
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            These features appear in a tutorial's prose but don't meet the TAUGHT bar — no dedicated step with
            highlights + panelStateChanges + visible consequence + WHY explanation. The user sees the name but
            never gets hands-on practice.
          </p>
          <div className={`space-y-2 ${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
            {mentionedNotTaught.map((row) => (
              <div
                key={row.featureId}
                className="rounded p-2 text-xs"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)' }}
              >
                <div className="font-mono text-amber-300">{row.featureId}</div>
                <div className="text-gray-200 mt-0.5">{row.featureName}</div>
                {row.tutorialId && (
                  <div className="text-gray-500 mt-0.5 text-[10px]">
                    in <code className="font-mono">{row.tutorialId}</code>
                    {row.stepId && <> · <code className="font-mono">{row.stepId}</code></>}
                    {row.page && <> · manual page {row.page}</>}
                  </div>
                )}
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
      {missing.length === 0 && parentOnlyGaps.length === 0 && mentionedNotTaught.length === 0 && (
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
