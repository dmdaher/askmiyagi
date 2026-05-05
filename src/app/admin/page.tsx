'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePipelineStore } from '@/store/pipelineStore';
import PipelineDashboard from '@/components/admin/PipelineDashboard';
import UploadZone from '@/components/admin/UploadZone';
import ContractorSubmissions from '@/components/admin/ContractorSubmissions';
import type { PipelineRunSummary, RunStatus } from '@/lib/pipeline/types';
import { isEditorReady } from '@/lib/pipeline/phase-order';

type SortOption = 'status' | 'manufacturer' | 'cost' | 'recent';

const STATUS_ORDER: Record<RunStatus, number> = {
  running: 0,
  paused: 1,
  failed: 2,
  completed: 3,
};

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

  const [sortBy, setSortBy] = useState<SortOption>('status');
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
        case 'status':
          return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        case 'manufacturer':
          return (a.manufacturer || '').localeCompare(b.manufacturer || '') || a.deviceName.localeCompare(b.deviceName);
        case 'cost':
          return ((b.totalActualCostUsd || b.totalCostUsd) ?? 0) - ((a.totalActualCostUsd || a.totalCostUsd) ?? 0);
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
            <option value="status">Sort: Status</option>
            <option value="manufacturer">Sort: Manufacturer</option>
            <option value="cost">Sort: Cost</option>
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
