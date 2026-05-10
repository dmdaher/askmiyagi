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

      {/* Status banners — separate signal for genuine problems vs planned
          hand-offs. Both can show simultaneously. Healthy state shows
          neither (cards below speak for themselves). */}
      {hasRuns && attentionCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-3 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid #ef4444',
          }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.18)', color: '#f87171' }}
          >
            !
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {attentionCount} pipeline{attentionCount === 1 ? '' : 's'} need your attention
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Failed or halted with an issue. Sorted to the top below. Click into one to see the recommended action.
            </p>
          </div>
        </motion.div>
      )}

      {hasRuns && handoffCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="mb-3 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid #3b82f6',
          }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa' }}
          >
            ◇
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {handoffCount} ready for review or hand-off
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              Planned gates: send to contractor, approve templates, or approve curriculum. Decide when convenient.
            </p>
          </div>
        </motion.div>
      )}

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

        {/* Grid layout: upload zone first, then pipeline cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Upload zone as the first card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <UploadZone onCreated={handleCreated} />
          </motion.div>

          <PipelineDashboard
            runs={filteredRuns}
            onSelectPipeline={handleSelectPipeline}
          />
        </div>
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
