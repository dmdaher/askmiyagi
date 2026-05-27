'use client';

import { useEffect, useState } from 'react';
import type { MatchRow, MatchTableSummary } from '@/lib/pipeline/coverage-scorer';
import CoverageReportModal from './CoverageReportModal';

interface RecheckCoverageButtonProps {
  deviceId: string;
  deviceName: string;
  pipelineStatus: string;
}

interface Preview {
  canRecheck: boolean;
  reason: string;
  hasIndependentChecklist: boolean;
}

interface RecheckResponse {
  ok: true;
  summary: MatchTableSummary;
  missing: MatchRow[];
  parentOnlyGaps: MatchRow[];
  matchTablePath: string;
  costUsd: number;
  /** NEW Phase 3a — coverage scorer verdict + self-heal status */
  verdict?: {
    name: 'CRITICAL' | 'REJECTED' | 'APPROVED_WITH_WARNINGS' | 'APPROVED';
    reason: string;
    shouldAutoRetry: boolean;
    coveragePct: number;
    selfHealTriggered: boolean;
    retryCount: number;
    maxRetries: number;
  };
}

export default function RecheckCoverageButton({ deviceId, deviceName, pipelineStatus }: RecheckCoverageButtonProps) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RecheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pipeline/${deviceId}/recheck-coverage`)
      .then((r) => r.json())
      .then((data: Preview) => { if (!cancelled) setPreview(data); })
      .catch(() => { if (!cancelled) setPreview({ canRecheck: false, reason: 'Failed to load preview', hasIndependentChecklist: false }); });
    return () => { cancelled = true; };
  }, [deviceId, pipelineStatus]); // re-fetch when pipeline status changes

  const canClick = preview?.canRecheck === true && !running && pipelineStatus !== 'running';

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
        setResult(data as RecheckResponse);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const tooltip = preview?.reason ?? 'Loading…';
  const buttonLabel = running ? 'Checking…' : 'Re-check Coverage';

  return (
    <>
      <button
        type="button"
        onClick={runRecheck}
        disabled={!canClick}
        data-testid="recheck-coverage-button"
        title={tooltip}
        className="text-xs font-medium py-1.5 px-3 rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 flex-shrink-0 whitespace-nowrap"
        style={{
          backgroundColor: 'transparent',
          color: canClick ? '#06b6d4' : '#6b7280',
          border: '1px solid',
          borderColor: canClick ? 'rgba(6, 182, 212, 0.4)' : 'var(--card-border, #2a2a3a)',
        }}
      >
        {buttonLabel}
      </button>

      {error && (
        <div
          className="text-xs text-red-400 mt-1 px-2"
          data-testid="recheck-coverage-error"
        >
          {error}
        </div>
      )}

      {/* Phase 3a — surface coverage verdict + self-heal status inline so the
          admin sees the outcome at a glance before opening the full report. */}
      {result?.verdict && (
        <div
          className={`text-[10px] mt-1 px-2 rounded ${
            result.verdict.selfHealTriggered
              ? 'text-amber-300 bg-amber-900/20'
              : result.verdict.name === 'APPROVED' || result.verdict.name === 'APPROVED_WITH_WARNINGS'
                ? 'text-emerald-300 bg-emerald-900/20'
                : 'text-red-300 bg-red-900/20'
          }`}
          data-testid="recheck-coverage-verdict"
        >
          {result.verdict.selfHealTriggered ? (
            <>
              <strong>Auto-recovery started</strong> (retry {result.verdict.retryCount}/{result.verdict.maxRetries})
              {' — '}
              coverage {result.verdict.coveragePct.toFixed(1)}% &lt; 90%. Resume the pipeline to apply directives.
            </>
          ) : result.verdict.name === 'APPROVED' || result.verdict.name === 'APPROVED_WITH_WARNINGS' ? (
            <>✓ Coverage {result.verdict.coveragePct.toFixed(1)}% — {result.verdict.name === 'APPROVED' ? 'clean' : 'with warnings'}, no action needed.</>
          ) : result.verdict.retryCount >= result.verdict.maxRetries ? (
            <><strong>Self-heal cap reached.</strong> Coverage {result.verdict.coveragePct.toFixed(1)}% after {result.verdict.maxRetries} retries. Manual review required.</>
          ) : (
            <>{result.verdict.name}: {result.verdict.reason}</>
          )}
        </div>
      )}

      {result && (
        <CoverageReportModal
          deviceId={deviceId}
          deviceName={deviceName}
          summary={result.summary}
          missing={result.missing}
          parentOnlyGaps={result.parentOnlyGaps}
          costUsd={result.costUsd}
          matchTablePath={result.matchTablePath}
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
}
