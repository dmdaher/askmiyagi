'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePipelineStore } from '@/store/pipelineStore';
import PipelineDetail from '@/components/admin/PipelineDetail';

export default function PipelineDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const router = useRouter();
  const {
    activePipeline,
    logs,
    fetchPipeline,
    connectSSE,
    disconnectSSE,
    resolveEscalation,
    startPipeline,
    cancelPipeline,
  } = usePipelineStore();

  useEffect(() => {
    if (!deviceId) return;
    fetchPipeline(deviceId);
    connectSSE(deviceId);
    return () => disconnectSSE();
  }, [deviceId, fetchPipeline, connectSSE, disconnectSSE]);

  if (!activePipeline) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading pipeline...</div>
      </div>
    );
  }

  const handleResolve = (escalationId: string, resolution: string) => {
    resolveEscalation(deviceId, escalationId, resolution);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/admin')}
            className="mb-2 text-sm text-gray-500 transition-colors hover:text-gray-300"
          >
            &larr; All Pipelines
          </button>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {activePipeline.deviceName}
          </h1>
          <p className="text-sm text-gray-500">{activePipeline.manufacturer}</p>
        </div>
        <div className="flex items-center gap-3">
          {activePipeline.status === 'paused' && (
            <button
              onClick={() => startPipeline(deviceId)}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Resume Pipeline
            </button>
          )}
          {activePipeline.status === 'running' && (
            <button
              onClick={() => cancelPipeline(deviceId)}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              Cancel
            </button>
          )}
          <StatusBadge status={activePipeline.status} />
        </div>
      </div>

      <PipelineDetail
        pipeline={activePipeline}
        logs={logs}
        onResolve={handleResolve}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    paused: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    completed: 'border-green-500/30 bg-green-500/10 text-green-400',
    failed: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? styles.paused}`}>
      {status === 'running' && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
