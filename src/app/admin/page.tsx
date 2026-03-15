'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { usePipelineStore } from '@/store/pipelineStore';
import PipelineDashboard from '@/components/admin/PipelineDashboard';
import UploadZone from '@/components/admin/UploadZone';

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
      router.push(`/admin/pipeline/${deviceId}`);
    },
    [router],
  );

  const handleCreated = useCallback(
    (deviceId: string) => {
      fetchRuns();
      router.push(`/admin/pipeline/${deviceId}`);
    },
    [fetchRuns, router],
  );

  const hasRuns = Object.keys(runs).length > 0;

  return (
    <div>
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

      {hasRuns ? (
        /* Grid layout: pipeline cards + upload zone as last card */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PipelineDashboard
            runs={runs}
            onSelectPipeline={handleSelectPipeline}
          />

          {/* Upload zone as the last card in the grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: Object.keys(runs).length * 0.05,
            }}
          >
            <UploadZone onCreated={handleCreated} />
          </motion.div>
        </div>
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
