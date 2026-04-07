'use client';

import { usePipelineStore } from '@/store/pipelineStore';

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
      <span className="capitalize">{status}</span>
    </span>
  );
}

interface DeviceHeaderProps {
  deviceId: string;
}

export default function DeviceHeader({ deviceId }: DeviceHeaderProps) {
  const activePipeline = usePipelineStore((s) => s.activePipeline);
  const startPipeline = usePipelineStore((s) => s.startPipeline);

  const deviceName = activePipeline?.deviceName ?? deviceId;
  const manufacturer = activePipeline?.manufacturer ?? '';
  const status = activePipeline?.status ?? 'paused';

  const handlePause = async () => {
    await fetch(`/api/pipeline/${deviceId}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' }),
    });
  };

  const handleRestart = async () => {
    if (!confirm('Re-run the entire pipeline with latest improvements. Your editor positions will be preserved.')) return;
    await fetch(`/api/pipeline/${deviceId}/restart`, { method: 'POST' });
    window.location.reload();
  };

  return (
    <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--card-border)] bg-[var(--background)] px-6">
      <div className="flex items-center gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {manufacturer}
          </span>
          <h1 className="text-lg font-bold text-[var(--foreground)] leading-tight">
            {deviceName}
          </h1>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center gap-2">
        {status === 'running' && (
          <button
            onClick={handlePause}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            Pause
          </button>
        )}
        {status === 'paused' && (
          <button
            onClick={() => startPipeline(deviceId)}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Resume
          </button>
        )}
        {(status === 'paused' || status === 'completed' || status === 'failed') && (
          <button
            onClick={handleRestart}
            className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
          >
            Restart
          </button>
        )}
      </div>
    </div>
  );
}
