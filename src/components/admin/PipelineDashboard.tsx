'use client';

import { motion } from 'framer-motion';
import { PipelinePhase, PipelineRunSummary, RunStatus } from '@/lib/pipeline/types';

interface PipelineDashboardProps {
  runs: Record<string, PipelineRunSummary>;
  onSelectPipeline: (deviceId: string) => void;
}

const PIPELINE_PHASES: PipelinePhase[] = [
  'pending',
  'phase-preflight',
  'phase-0-gatekeeper',
  'phase-1-section-loop',
  'phase-2-global-assembly',
  'phase-3-harmonic-polish',
  'panel-pr',
  'phase-4-extraction',
  'phase-4-audit',
  'phase-5-tutorial-build',
  'tutorial-pr',
  'completed',
];

const STATUS_CONFIG: Record<RunStatus, { color: string; label: string; pulse: boolean }> = {
  running: { color: '#3B82F6', label: 'Running', pulse: true },
  paused: { color: '#F59E0B', label: 'Paused', pulse: false },
  completed: { color: '#22C55E', label: 'Completed', pulse: false },
  failed: { color: '#EF4444', label: 'Failed', pulse: false },
};

function getPhaseIndex(phase: PipelinePhase): number {
  const idx = PIPELINE_PHASES.indexOf(phase);
  return idx === -1 ? 0 : idx;
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PhaseProgressBar({
  currentPhase,
  status,
}: {
  currentPhase: PipelinePhase;
  status: RunStatus;
}) {
  const currentIndex = getPhaseIndex(currentPhase);
  const isFailed = status === 'failed';

  return (
    <div className="flex items-center gap-0.5">
      {PIPELINE_PHASES.map((phase, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFailedPhase = isCurrent && isFailed;

        let bgColor = 'bg-gray-700/50';
        if (isCompleted) bgColor = 'bg-[var(--accent)]';
        if (isFailedPhase) bgColor = 'bg-red-500';

        return (
          <div key={phase} className="relative flex-1">
            <div
              className={`h-1.5 rounded-full ${bgColor} transition-colors`}
              title={phase}
            />
            {isCurrent && !isFailed && status === 'running' && (
              <motion.div
                className="absolute inset-0 h-1.5 rounded-full bg-[var(--accent)]"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              />
            )}
            {isCurrent && status === 'paused' && (
              <div className="absolute inset-0 h-1.5 rounded-full bg-amber-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: RunStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
      <span
        className="relative flex h-2 w-2"
      >
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{
            backgroundColor: config.color,
            animation: config.pulse ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none',
          }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
      </span>
      <span style={{ color: config.color }}>{config.label}</span>
    </span>
  );
}

function PipelineCard({
  run,
  onClick,
}: {
  run: PipelineRunSummary;
  onClick: () => void;
}) {
  const statusConfig = STATUS_CONFIG[run.status];

  return (
    <motion.button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-left transition-colors hover:border-opacity-60"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        boxShadow: `0 0 0 0 ${statusConfig.color}33`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 4px 30px ${statusConfig.color}33`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 0 0 0 ${statusConfig.color}33`;
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-1 w-full"
        style={{ background: statusConfig.color }}
      />

      <div className="p-5">
        {/* Header: manufacturer + status */}
        <div className="mb-1 flex items-center justify-between">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            {run.manufacturer}
          </p>
          <StatusBadge status={run.status} />
        </div>

        {/* Device name */}
        <h3 className="mb-3 text-xl font-bold text-gray-100">
          {run.deviceName}
        </h3>

        {/* Phase progress bar */}
        <div className="mb-3">
          <PhaseProgressBar currentPhase={run.currentPhase} status={run.status} />
          <p className="mt-1.5 text-xs text-gray-500">
            {run.currentPhase.replace(/-/g, ' ')}
          </p>
        </div>

        {/* Footer: cost + time + escalation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">
                ${(run.totalActualCostUsd || run.totalCostUsd).toFixed(2)}
              </span>
              {run.budgetCapUsd > 0 && (
                <>
                  <span className="text-xs text-gray-500">/ ${run.budgetCapUsd.toFixed(2)}</span>
                  <div className="w-12 h-1.5 rounded-full overflow-hidden bg-gray-700/50">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(((run.totalActualCostUsd || run.totalCostUsd) / run.budgetCapUsd) * 100, 100)}%`,
                        backgroundColor:
                          (run.totalActualCostUsd || run.totalCostUsd) / run.budgetCapUsd >= 0.85
                            ? '#EF4444'
                            : (run.totalActualCostUsd || run.totalCostUsd) / run.budgetCapUsd >= 0.7
                              ? '#F59E0B'
                              : 'var(--accent)',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
            <span className="text-xs text-gray-600">
              {formatRelativeTime(run.updatedAt)}
            </span>
          </div>

          {run.activeEscalation && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20"
              title={`Escalation: ${run.activeEscalation}`}
            >
              <svg
                className="h-3.5 w-3.5 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function PipelineDashboard({
  runs,
  onSelectPipeline,
}: PipelineDashboardProps) {
  const runEntries = Object.entries(runs);

  if (runEntries.length === 0) {
    return null;
  }

  return (
    <>
      {runEntries.map(([deviceId, run], i) => (
        <motion.div
          key={deviceId}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <PipelineCard
            run={run}
            onClick={() => onSelectPipeline(deviceId)}
          />
        </motion.div>
      ))}
    </>
  );
}
