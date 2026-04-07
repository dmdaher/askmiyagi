'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface Version {
  filename: string;
  timestamp: string;
  sizeBytes: number;
  isCurrent: boolean;
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

export default function VersionHistoryDropdown({ deviceId, onRestore }: { deviceId: string; onRestore?: () => void }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions ?? []);
      }
    } catch {
      // Silent fail
    }
    setLoading(false);
  }, [deviceId]);

  const handleToggle = useCallback(() => {
    if (!open) {
      fetchVersions();
    }
    setOpen(!open);
  }, [open, fetchVersions]);

  const handleRestore = useCallback(async (filename: string) => {
    setRestoring(filename);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/versions/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('Restore failed:', body.error);
        setRestoring(null);
        return;
      }

      setOpen(false);

      // Trigger PanelEditor to reload from disk (which now has the restored data).
      // This goes through the normal fetch → load cycle, avoiding React hooks errors
      // from direct setState with dramatically different data.
      if (onRestore) {
        onRestore();
      }
    } catch (err) {
      console.error('Restore error:', err);
    }
    setRestoring(null);
  }, [deviceId, onRestore]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex h-7 items-center rounded px-2 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        title="Version History — browse and restore previous saves"
      >
        History
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-72 rounded-lg border border-gray-700 bg-[#0d0d1a] shadow-xl">
          <div className="border-b border-gray-800 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Version History
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500">Loading...</div>
            ) : versions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500">No versions yet</div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.filename}
                  className="flex items-center justify-between border-b border-gray-800/50 px-3 py-2 last:border-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-gray-300">
                      {v.isCurrent ? 'Current' : relativeTime(v.timestamp)}
                    </span>
                    <span className="text-[9px] text-gray-500 truncate">
                      {formatTimestamp(v.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {v.isCurrent ? (
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-400">
                        Current
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRestore(v.filename)}
                        disabled={restoring !== null}
                        className="rounded border border-gray-600 bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-30"
                      >
                        {restoring === v.filename ? 'Restoring...' : 'Restore'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {versions.length > 0 && (
            <div className="border-t border-gray-800 px-3 py-1.5">
              <span className="text-[9px] text-gray-600">
                {versions.length} version{versions.length !== 1 ? 's' : ''} — Cmd+Z undoes restore
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
