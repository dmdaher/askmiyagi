'use client';

/**
 * Coverage tab — lives inside the canvas review sidebar.
 *
 * On mount: tries to load cached match-table from the API. If present,
 * renders the parsed report. If not, shows empty state. Either way,
 * a "Re-check now" button invokes the live audit (~$3-5, ~2-4 min)
 * and refreshes the tab with fresh results.
 *
 * Composes with PR #169 (auto-push of match-table.md) — the displayed
 * report is the same artifact that gets backed up to pipeline/<id>.
 */

import { useEffect, useState } from 'react';
import type { MatchRow, MatchTableSummary } from '@/lib/pipeline/coverage-scorer';
import CoverageReport from './CoverageReport';

interface CoverageTabProps {
  deviceId: string;
}

interface CachedResult {
  summary: MatchTableSummary;
  missing: MatchRow[];
  parentOnlyGaps: MatchRow[];
  matchTablePath: string;
  lastAuditMs: number | null;
  costUsd?: number;
  /** Phase 3a verdict — surfaces "why" reason block + retry counter */
  verdict?: {
    name: 'CRITICAL' | 'REJECTED' | 'APPROVED_WITH_WARNINGS' | 'APPROVED';
    reason: string;
    selfHealTriggered?: boolean;
    retryCount?: number;
    maxRetries?: number;
  };
}

export default function CoverageTab({ deviceId }: CoverageTabProps) {
  const [cached, setCached] = useState<CachedResult | null>(null);
  const [loadingCache, setLoadingCache] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: ask the recheck-coverage endpoint about cache state via GET
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/pipeline/${deviceId}/recheck-coverage?action=cached`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data?.summary) {
            setCached(data as CachedResult);
          }
        }
      } catch {
        /* ignore — no cached data is a valid state */
      } finally {
        if (!cancelled) setLoadingCache(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deviceId]);

  async function runRecheck() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/recheck-coverage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Re-check failed');
      } else {
        setCached({
          summary: data.summary,
          missing: data.missing,
          parentOnlyGaps: data.parentOnlyGaps,
          matchTablePath: data.matchTablePath,
          costUsd: data.costUsd,
          lastAuditMs: Date.now(),
          verdict: data.verdict,
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      role="tabpanel"
      id="tab-panel-coverage"
      data-testid="coverage-tab-content"
      className="flex flex-col min-h-0 p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-white/40">Coverage Audit</p>
        <button
          type="button"
          onClick={runRecheck}
          disabled={running}
          data-testid="coverage-tab-recheck-button"
          className="text-[10px] px-2 py-1 rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            backgroundColor: running ? 'transparent' : 'rgba(6, 182, 212, 0.1)',
            color: running ? '#60a5fa' : '#06b6d4',
            border: '1px solid',
            borderColor: running ? 'rgba(96, 165, 250, 0.4)' : 'rgba(6, 182, 212, 0.4)',
          }}
        >
          {running ? '⏳ Re-checking…' : '↻ Re-check now'}
        </button>
      </div>

      {error && (
        <div
          className="text-[11px] text-red-300 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/30"
          data-testid="coverage-tab-error"
        >
          {error}
        </div>
      )}

      {running && (
        <div
          className="text-[11px] px-3 py-3 rounded bg-cyan-500/8 border border-cyan-500/30 space-y-1.5"
          data-testid="coverage-tab-running"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Coverage agent running…</span>
          </div>
          <p className="text-white/60 text-[10px] leading-snug">
            The coverage-auditor agent is re-reading the manual + comparing against current tutorials. Typical runtime: 2–4 minutes, cost ~$3–5.
          </p>
          <p className="text-white/40 text-[10px] leading-snug">
            Live progress: open the <strong>Overview</strong> tab on the device detail page → watch the log stream for <code className="font-mono bg-white/5 px-1 rounded">[coverage-auditor]</code> lines. Results will appear here automatically when done.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch(`/api/pipeline/${deviceId}/recheck-coverage`, { method: 'DELETE' });
              } catch { /* ignore */ }
            }}
            data-testid="coverage-tab-cancel"
            className="text-[10px] mt-1 px-2 py-1 rounded text-red-300 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer"
          >
            Cancel run
          </button>
        </div>
      )}

      {loadingCache && !cached && !running && (
        <div className="text-center py-8 text-[11px] text-white/40" data-testid="coverage-tab-loading">
          Loading cached audit…
        </div>
      )}

      {!loadingCache && !cached && !running && (
        <div className="text-center py-8" data-testid="coverage-tab-empty">
          <p className="text-[11px] text-white/40 mb-2">No coverage audit yet for this device.</p>
          <p className="text-[10px] text-white/30">
            Click <strong>Re-check now</strong> above to run the coverage-auditor agent against current tutorials.
          </p>
          <p className="text-[10px] text-white/30 mt-1">
            Typical runtime: 2–4 minutes · cost ~$3–5
          </p>
        </div>
      )}

      {cached && (
        <CoverageReport
          summary={cached.summary}
          missing={cached.missing}
          parentOnlyGaps={cached.parentOnlyGaps}
          costUsd={cached.costUsd}
          matchTablePath={cached.matchTablePath}
          lastAuditMs={cached.lastAuditMs}
          verdict={cached.verdict}
          compact
        />
      )}
    </div>
  );
}
