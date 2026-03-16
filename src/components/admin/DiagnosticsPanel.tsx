'use client';

import { useState, useEffect, useCallback } from 'react';

interface HealthData {
  deviceId: string;
  status: string;
  currentPhase: string;
  process: {
    pid: number | null;
    alive: boolean;
    uptime: string | null;
    memory: string | null;
  };
  timing: {
    createdAt: string;
    updatedAt: string;
    lastUpdateAgoMs: number;
    totalDurationMs: number;
    currentPhaseDurationMs: number | null;
    currentPhaseStartedAt: string | null;
  };
  logs: {
    count: number;
    lastTimestamp: string | null;
  };
  worktree: string | null;
  checkpoint: {
    phase: string;
    subStep: string;
  };
  budget: {
    spent: number;
    cap: number;
    pctUsed: string;
  };
}

type Issue = {
  label: string;
  description: string;
  action: string;
  severity: 'error' | 'warning';
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatAgo(ms: number): string {
  if (ms < 5000) return 'just now';
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  return `${Math.floor(ms / 3600000)}h ago`;
}

function detectIssues(health: HealthData): Issue[] {
  const issues: Issue[] = [];

  // Process dead but status says running
  if (health.status === 'running' && !health.process.alive) {
    issues.push({
      label: 'Process dead',
      description: `PID ${health.process.pid} is no longer running but status is "running"`,
      action: 'fix-stale',
      severity: 'error',
    });
  }

  // Pipeline in failed state
  if (health.status === 'failed') {
    issues.push({
      label: 'Pipeline failed',
      description: `Failed at ${health.currentPhase}. Reset to resume from last good phase.`,
      action: 'reset-failed',
      severity: 'error',
    });
  }

  // Stale heartbeat (running but no update in 5 min)
  if (health.status === 'running' && health.process.alive && health.timing.lastUpdateAgoMs > 300000) {
    issues.push({
      label: 'Heartbeat stale',
      description: `No state update for ${formatAgo(health.timing.lastUpdateAgoMs)}. Process may be hung.`,
      action: 'kill-restart',
      severity: 'warning',
    });
  }

  return issues;
}

interface DiagnosticsPanelProps {
  deviceId: string;
}

export default function DiagnosticsPanel({ deviceId }: DiagnosticsPanelProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [recovering, setRecovering] = useState(false);
  const [recoverResult, setRecoverResult] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
      setError(null);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    }
  }, [deviceId]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleRecover = useCallback(async (action: string) => {
    setRecovering(true);
    setRecoverResult(null);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoverResult(data.message || `Done: ${action}`);
        // Refresh health immediately
        await fetchHealth();
      } else {
        setRecoverResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setRecoverResult(`Failed: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setRecovering(false);
    }
  }, [deviceId, fetchHealth]);

  const handleRestart = useCallback(async () => {
    setRecovering(true);
    setRecoverResult(null);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/start`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRecoverResult(`Restarted (PID ${data.pid})`);
        await fetchHealth();
      } else {
        setRecoverResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setRecoverResult(`Failed: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setRecovering(false);
    }
  }, [deviceId, fetchHealth]);

  if (error && !health) {
    return (
      <div
        className="rounded-lg p-3"
        style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-red-400">
          Diagnostics Unavailable
        </h3>
        <p className="text-xs text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div
        className="rounded-lg p-3 animate-pulse"
        style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
      >
        <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
        <div className="h-3 bg-gray-700 rounded w-full" />
      </div>
    );
  }

  const isStale = health.timing.lastUpdateAgoMs > 120000;
  const processOk = health.process.alive;
  const issues = detectIssues(health);
  const isPaused = health.status === 'paused';

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--foreground, #e0e0e0)' }}
        >
          Diagnostics
        </h3>
        <span className="text-[10px] text-gray-600">
          updated {lastFetch ? formatAgo(Date.now() - lastFetch) : '...'}
        </span>
      </div>

      {/* Issues & Fix Buttons */}
      {issues.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {issues.map((issue) => (
            <div
              key={issue.action}
              className={`rounded-md px-2.5 py-2 text-[11px] ${
                issue.severity === 'error'
                  ? 'bg-red-950/50 border border-red-800/50'
                  : 'bg-yellow-950/50 border border-yellow-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className={`font-medium ${issue.severity === 'error' ? 'text-red-300' : 'text-yellow-300'}`}>
                    {issue.label}
                  </span>
                  <p className="text-gray-400 mt-0.5 leading-tight">{issue.description}</p>
                </div>
                <button
                  onClick={() => handleRecover(issue.action)}
                  disabled={recovering}
                  className={`shrink-0 rounded px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-40 ${
                    issue.severity === 'error'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  }`}
                >
                  {recovering ? '...' : 'Fix'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paused — show restart button */}
      {isPaused && issues.length === 0 && (
        <div className="mb-2">
          <button
            onClick={handleRestart}
            disabled={recovering}
            className="w-full rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium px-3 py-1.5 transition-colors disabled:opacity-40"
          >
            {recovering ? 'Starting...' : 'Resume Pipeline'}
          </button>
        </div>
      )}

      {/* Recovery result message */}
      {recoverResult && (
        <div className="mb-2 rounded-md bg-gray-800/50 px-2.5 py-1.5 text-[10px] text-gray-300">
          {recoverResult}
        </div>
      )}

      <div className="space-y-1.5">
        {/* Process Status */}
        <Row
          label="Process"
          value={
            health.process.pid
              ? processOk
                ? `PID ${health.process.pid} — alive`
                : `PID ${health.process.pid} — DEAD`
              : 'No process'
          }
          indicator={processOk ? 'green' : health.process.pid ? 'red' : 'gray'}
        />

        {/* Heartbeat */}
        <Row
          label="Last heartbeat"
          value={formatAgo(health.timing.lastUpdateAgoMs)}
          indicator={isStale ? 'red' : 'green'}
        />

        {/* Uptime */}
        {health.process.uptime && (
          <Row label="Uptime" value={health.process.uptime} />
        )}

        {/* Memory */}
        {health.process.memory && (
          <Row label="Memory" value={health.process.memory} />
        )}

        {/* Current Phase Duration */}
        {health.timing.currentPhaseDurationMs !== null && (
          <Row
            label="Phase duration"
            value={formatDuration(health.timing.currentPhaseDurationMs)}
          />
        )}

        {/* Total Duration */}
        <Row
          label="Total elapsed"
          value={formatDuration(health.timing.totalDurationMs)}
        />

        {/* Checkpoint */}
        <Row
          label="Checkpoint"
          value={`${health.checkpoint.phase} / ${health.checkpoint.subStep}`}
        />

        {/* Log count */}
        <Row label="Log entries" value={String(health.logs.count)} />

        {/* Worktree */}
        {health.worktree && (
          <Row
            label="Worktree"
            value={health.worktree.replace(/.*\//, '.../')}
            title={health.worktree}
          />
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  indicator,
  title,
}: {
  label: string;
  value: string;
  indicator?: 'green' | 'red' | 'gray';
  title?: string;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]" title={title}>
      <span className="text-gray-500 flex items-center gap-1.5">
        {indicator && (
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              indicator === 'green'
                ? 'bg-emerald-400'
                : indicator === 'red'
                  ? 'bg-red-400 animate-pulse'
                  : 'bg-gray-600'
            }`}
          />
        )}
        {label}
      </span>
      <span className="text-gray-300 font-mono truncate ml-2 max-w-[60%] text-right">
        {value}
      </span>
    </div>
  );
}
