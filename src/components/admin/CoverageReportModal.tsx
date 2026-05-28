'use client';

import type { MatchRow, MatchTableSummary } from '@/lib/pipeline/coverage-scorer';
import CoverageReport from './CoverageReport';

interface CoverageReportModalProps {
  deviceId: string;
  deviceName: string;
  summary: MatchTableSummary;
  missing: MatchRow[];
  parentOnlyGaps: MatchRow[];
  mentionedNotTaught?: MatchRow[];
  costUsd: number;
  matchTablePath: string;
  onClose: () => void;
  /** Optional Phase 3a verdict — surfaces "why" reason block + retry counter. */
  verdict?: {
    name: 'CRITICAL' | 'REJECTED' | 'APPROVED_WITH_WARNINGS' | 'APPROVED' | 'MATCH_TABLE_CONFLICT';
    reason: string;
    selfHealTriggered?: boolean;
    retryCount?: number;
    maxRetries?: number;
  };
}

export default function CoverageReportModal(props: CoverageReportModalProps) {
  const { deviceName, summary, missing, parentOnlyGaps, mentionedNotTaught, costUsd, matchTablePath, onClose, verdict } = props;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-testid="coverage-report-modal"
        className="rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--card-border, #2a2a3a)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Coverage Report — {deviceName}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {summary.total} features in manual · audit cost: ${costUsd.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body — extracted shared CoverageReport */}
        <div className="px-6 py-4">
          <CoverageReport
            summary={summary}
            missing={missing}
            parentOnlyGaps={parentOnlyGaps}
            mentionedNotTaught={mentionedNotTaught}
            costUsd={costUsd}
            matchTablePath={matchTablePath}
            verdict={verdict}
          />
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex items-center justify-end"
          style={{ borderColor: 'var(--card-border, #2a2a3a)' }}
        >
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-gray-300 hover:bg-white/[0.05]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
