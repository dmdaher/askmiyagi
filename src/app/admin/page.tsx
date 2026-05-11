'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePipelineStore } from '@/store/pipelineStore';
import PipelineDashboard from '@/components/admin/PipelineDashboard';
import UploadZone from '@/components/admin/UploadZone';
import ContractorSubmissions from '@/components/admin/ContractorSubmissions';
import AttentionInventory from '@/components/admin/AttentionInventory';
import type { PipelineRunSummary, RunStatus } from '@/lib/pipeline/types';
import { isEditorReady } from '@/lib/pipeline/phase-order';

type SortOption = 'attention' | 'status' | 'manufacturer' | 'recent';

const STATUS_ORDER: Record<RunStatus, number> = {
  running: 0,
  paused: 1,
  failed: 2,
  completed: 3,
};

/** Escalation types that are PLANNED hand-offs (admin gates the next step
 *  by choice — not a problem). These do NOT count as "needs attention". */
const HANDOFF_ESCALATIONS = new Set([
  'editor-ready',
  'template-review',
  'curriculum-review',
]);

/**
 * Hands-off ordering: anything requiring admin action floats to the top,
 * then planned hand-offs, then in-progress builds, then idle.
 *
 * Priority (lower = higher up):
 *   0 — failed (genuine fault, needs eyes)
 *   1 — paused with PROBLEM escalation (action required)
 *   2 — paused waiting on HAND-OFF (review/approve, planned gate)
 *   3 — paused without escalation (awaiting resume)
 *   4 — running
 *   5 — completed (terminal good state)
 */
function attentionPriority(r: PipelineRunSummary): number {
  if (r.status === 'failed') return 0;
  if (r.status === 'paused' && r.activeEscalation) {
    return isHandoff(r) ? 2 : 1;
  }
  if (r.status === 'paused') return 3;
  if (r.status === 'running') return 4;
  return 5;
}

/** True when the pipeline is paused on a planned hand-off (admin decides
 *  when to proceed) — NOT a problem state. */
function isHandoff(r: PipelineRunSummary): boolean {
  return r.activeEscalationType != null && HANDOFF_ESCALATIONS.has(r.activeEscalationType);
}

/** True ONLY for genuine problems — not for planned hand-offs. */
function needsAttention(r: PipelineRunSummary): boolean {
  if (r.status === 'failed') return true;
  if (r.status === 'paused' && r.activeEscalation && !isHandoff(r)) return true;
  return false;
}

const POLL_INTERVAL_MS = 30_000;

export default function AdminPage() {
  const router = useRouter();
  const runs = usePipelineStore((s) => s.runs);
  const fetchRuns = usePipelineStore((s) => s.fetchRuns);

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchRuns]);

  const handleSelectPipeline = useCallback(
    (deviceId: string) => {
      router.push(`/admin/${deviceId}`);
    },
    [router],
  );

  const handleCreated = useCallback(
    (deviceId: string) => {
      fetchRuns();
      router.push(`/admin/${deviceId}`);
    },
    [fetchRuns, router],
  );

  const [sortBy, setSortBy] = useState<SortOption>('attention');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('all');
  const [filterEditorReady, setFilterEditorReady] = useState(false);

  // Get unique manufacturers for filter dropdown
  const manufacturers = useMemo(() => {
    const set = new Set(Object.values(runs).map(r => r.manufacturer).filter(Boolean));
    return Array.from(set).sort();
  }, [runs]);

  // Apply filters and sort
  const filteredRuns = useMemo(() => {
    let entries = Object.entries(runs);

    // Filter: manufacturer
    if (filterManufacturer !== 'all') {
      entries = entries.filter(([, r]) => r.manufacturer === filterManufacturer);
    }

    // Filter: ready for editor — any pipeline at or past layout-engine
    // has a usable manifest-editor.json (regardless of status).
    if (filterEditorReady) {
      entries = entries.filter(([, r]) => isEditorReady(r.currentPhase));
    }

    // Sort
    entries.sort(([, a], [, b]) => {
      switch (sortBy) {
        case 'attention':
          // Primary: priority bucket. Secondary: most recently updated first
          // (so within "needs attention", newest sits above stale).
          return attentionPriority(a) - attentionPriority(b)
            || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'status':
          return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        case 'manufacturer':
          return (a.manufacturer || '').localeCompare(b.manufacturer || '') || a.deviceName.localeCompare(b.deviceName);
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return Object.fromEntries(entries) as Record<string, PipelineRunSummary>;
  }, [runs, sortBy, filterManufacturer, filterEditorReady]);

  const hasRuns = Object.keys(runs).length > 0;
  const editorReadyCount = Object.values(runs).filter(r => isEditorReady(r.currentPhase)).length;
  const attentionCount = Object.values(runs).filter(needsAttention).length;
  const handoffCount = Object.values(runs).filter(isHandoff).length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Pipeline Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage instrument pipelines and launch new builds
        </p>
      </motion.div>

      {/* Status confirmation — only the healthy case. When there's anything
          to act on, the bucket sections below carry the signal (they have
          their own colored headers + descriptions). */}
      {hasRuns && attentionCount === 0 && handoffCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-3 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid #22c55e',
          }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.18)', color: '#4ade80' }}
          >
            ✓
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              All pipelines healthy
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              No action required. Cards below show running and completed builds.
            </p>
          </div>
        </motion.div>
      )}

      {/* Attention inventory — persistent backlog of auto-repaired issues
          and admin-review flags across all pipelines. Survives publish. */}
      <AttentionInventory />

      {/* Contractor submissions — above pipeline grid, always visible */}
      <ContractorSubmissions />

      {hasRuns ? (
        <>
        {/* Sort & Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-8 rounded-lg border border-gray-700 bg-[var(--card-bg)] px-3 text-xs text-gray-300 outline-none"
          >
            <option value="attention">Sort: Needs attention</option>
            <option value="status">Sort: Status</option>
            <option value="manufacturer">Sort: Manufacturer</option>
            <option value="recent">Sort: Recent</option>
          </select>

          {manufacturers.length > 1 && (
            <select
              value={filterManufacturer}
              onChange={(e) => setFilterManufacturer(e.target.value)}
              className="h-8 rounded-lg border border-gray-700 bg-[var(--card-bg)] px-3 text-xs text-gray-300 outline-none"
            >
              <option value="all">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterEditorReady}
              onChange={(e) => setFilterEditorReady(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-800 accent-blue-500"
            />
            <span className="text-xs text-gray-400">
              Ready for Editor
              {editorReadyCount > 0 && (
                <span className="ml-1 rounded-full bg-green-500/20 border border-green-500/30 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
                  {editorReadyCount}
                </span>
              )}
            </span>
          </label>
        </div>

        {/* Bucketed layout: cards grouped by what kind of admin action they
            require. Each bucket has its own header + grid. Empty buckets
            are hidden so the eye lands on the right cluster. */}
        {(() => {
          const filteredArr = Object.values(filteredRuns);
          const needsAttentionRuns = Object.fromEntries(
            Object.entries(filteredRuns).filter(([, r]) => needsAttention(r)),
          );
          const handoffRuns = Object.fromEntries(
            Object.entries(filteredRuns).filter(([, r]) => isHandoff(r)),
          );
          const inProgressRuns = Object.fromEntries(
            Object.entries(filteredRuns).filter(([, r]) => r.status === 'running'),
          );
          const idleRuns = Object.fromEntries(
            Object.entries(filteredRuns).filter(([, r]) => {
              if (needsAttention(r)) return false;
              if (isHandoff(r)) return false;
              if (r.status === 'running') return false;
              return true; // paused-without-escalation OR completed
            }),
          );

          const hasNeedsAttention = Object.keys(needsAttentionRuns).length > 0;
          const hasHandoff = Object.keys(handoffRuns).length > 0;
          const hasInProgress = Object.keys(inProgressRuns).length > 0;
          const hasIdle = Object.keys(idleRuns).length > 0;

          return (
            <div className="space-y-8">
              {/* Upload zone — always visible at top */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                <UploadZone onCreated={handleCreated} />
              </motion.div>

              {hasNeedsAttention && (
                <BucketSection
                  title="Needs your attention"
                  description="Failed or halted with an issue. Click in to see what to do."
                  toneColor="#ef4444"
                  toneBg="rgba(239, 68, 68, 0.06)"
                  icon="!"
                  count={Object.keys(needsAttentionRuns).length}
                  runs={needsAttentionRuns}
                  onSelectPipeline={handleSelectPipeline}
                />
              )}

              {hasHandoff && (
                <BucketSection
                  title="Ready for hand-off"
                  description="Send manifest to contractor, or approve templates/curriculum. Decide when convenient — no problem to fix."
                  toneColor="#3b82f6"
                  toneBg="rgba(59, 130, 246, 0.06)"
                  icon="◇"
                  count={Object.keys(handoffRuns).length}
                  runs={handoffRuns}
                  onSelectPipeline={handleSelectPipeline}
                />
              )}

              {hasInProgress && (
                <BucketSection
                  title="In progress"
                  description="Pipeline is running. Nothing for you to do — check back when it pauses or completes."
                  toneColor="#9ca3af"
                  toneBg="transparent"
                  icon="◐"
                  count={Object.keys(inProgressRuns).length}
                  runs={inProgressRuns}
                  onSelectPipeline={handleSelectPipeline}
                />
              )}

              {hasIdle && (
                <BucketSection
                  title="Idle & completed"
                  description="Stable terminal state. Open to test, preview, or publish."
                  toneColor="#6b7280"
                  toneBg="transparent"
                  icon="○"
                  count={Object.keys(idleRuns).length}
                  runs={idleRuns}
                  onSelectPipeline={handleSelectPipeline}
                />
              )}

              {/* Defensive: show full list if filtering left nothing visible */}
              {!hasNeedsAttention && !hasHandoff && !hasInProgress && !hasIdle && filteredArr.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <PipelineDashboard runs={filteredRuns} onSelectPipeline={handleSelectPipeline} />
                </div>
              )}
            </div>
          );
        })()}
        </>
      ) : (
        /* Empty state: centered upload zone */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)]">
              <svg
                className="h-8 w-8 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-300">
              No pipelines yet
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload a product manual to start building a digital twin
            </p>
          </div>

          <div className="w-full max-w-md">
            <UploadZone onCreated={handleCreated} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Bucketed section ──────────────────────────────────────────────────────
// A titled grid of pipeline cards. Each bucket on the dashboard renders one
// of these. The title + description + color tone tell admin what KIND of
// action (if any) these pipelines need.

interface BucketSectionProps {
  title: string;
  description: string;
  toneColor: string;
  toneBg: string;
  icon: string;
  count: number;
  runs: Record<string, PipelineRunSummary>;
  onSelectPipeline: (deviceId: string) => void;
}

function BucketSection({
  title,
  description,
  toneColor,
  toneBg,
  icon,
  count,
  runs,
  onSelectPipeline,
}: BucketSectionProps) {
  return (
    <section>
      {/* Bucket header */}
      <div
        className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2"
        style={{
          backgroundColor: toneBg,
          borderLeft: `3px solid ${toneColor}`,
        }}
      >
        <div
          className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: `${toneColor}22`, color: toneColor }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground, #e0e0e0)' }}>
            {title}
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${toneColor}22`, color: toneColor }}
            >
              {count}
            </span>
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <PipelineDashboard runs={runs} onSelectPipeline={onSelectPipeline} />
      </div>
    </section>
  );
}
