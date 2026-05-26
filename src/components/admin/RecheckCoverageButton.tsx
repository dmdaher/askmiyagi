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
