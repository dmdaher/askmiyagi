'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DeviceState {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ready: { bg: 'bg-green-600/10', text: 'text-green-400', label: 'Ready — contractor can edit' },
  'in-progress': { bg: 'bg-blue-600/10', text: 'text-blue-400', label: 'Contractor editing' },
  submitted: { bg: 'bg-amber-600/10', text: 'text-amber-400', label: 'Submitted — needs your review' },
  approved: { bg: 'bg-green-600/10', text: 'text-green-400', label: 'Approved ✓' },
};

export default function ContractorSubmissions() {
  const [devices, setDevices] = useState<DeviceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string>>({});

  const fetchDevices = useCallback(() => {
    fetch('/api/hosted/panels')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setDevices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleAction = async (deviceId: string, action: string) => {
    setActing(deviceId);
    try {
      if (action === 'approve') {
        await fetch(`/api/hosted/panels/${deviceId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        });
        setResult(prev => ({ ...prev, [deviceId]: '✓ Approved' }));
      } else if (action === 'request-changes') {
        const note = prompt('Feedback for contractor (optional):');
        await fetch(`/api/hosted/panels/${deviceId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in-progress', reviewNote: note ?? undefined }),
        });
        setResult(prev => ({ ...prev, [deviceId]: '↩ Sent back for changes' }));
      } else if (action === 'pull-build') {
        const res = await fetch(`/api/pipeline/${deviceId}/pull-from-hosted`, { method: 'POST' });
        const data = await res.json();
        setResult(prev => ({ ...prev, [deviceId]: data.ok ? '✓ Pulled + exported' : `✗ ${data.error}` }));
      }
      fetchDevices();
    } catch (err) {
      setResult(prev => ({ ...prev, [deviceId]: `✗ ${(err as Error).message}` }));
    }
    setActing(null);
  };

  if (loading || devices.length === 0) return null;

  // Sort: submitted first
  const sorted = [...devices].sort((a, b) => {
    const order: Record<string, number> = { submitted: 0, 'in-progress': 1, ready: 2, approved: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mb-10"
    >
      <h2 className="text-lg font-semibold text-gray-200 mb-1">Contractor Submissions</h2>
      <p className="text-xs text-gray-500 mb-4">Instruments sent to contractor for editing</p>

      <div className="flex flex-col gap-2">
        {sorted.map((d) => {
          const style = STATUS_STYLES[d.status] ?? STATUS_STYLES.ready;
          const isSubmitted = d.status === 'submitted';
          const isApproved = d.status === 'approved';

          return (
            <div
              key={d.deviceId}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                isSubmitted
                  ? 'border-amber-600/40 bg-amber-900/10'
                  : 'border-gray-800 bg-[#111122]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isSubmitted ? 'bg-amber-400' : isApproved ? 'bg-green-400' : 'bg-blue-400'}`} />
                <div>
                  <span className="text-sm font-medium text-gray-200">
                    {d.manufacturer} {d.deviceName}
                  </span>
                  <p className={`text-[10px] ${style.text}`}>{style.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {result[d.deviceId] && (
                  <span className={`text-[10px] ${result[d.deviceId].startsWith('✓') ? 'text-green-400' : result[d.deviceId].startsWith('↩') ? 'text-amber-400' : 'text-red-400'}`}>
                    {result[d.deviceId]}
                  </span>
                )}

                {/* Open in editor — always available for any status */}
                <button
                  onClick={async () => {
                    setActing(d.deviceId);
                    try {
                      await fetch(`/api/pipeline/${d.deviceId}/pull-from-hosted`, { method: 'POST' });
                    } catch { /* pull failed — open editor with local state */ }
                    setActing(null);
                    window.open(`/admin/${d.deviceId}/editor`, '_blank');
                  }}
                  disabled={acting === d.deviceId}
                  className={`rounded px-3 py-1.5 text-[10px] font-medium transition-colors disabled:opacity-50 ${
                    isSubmitted
                      ? 'border border-amber-600 bg-amber-700/30 text-amber-300 hover:bg-amber-700/50'
                      : 'border border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {acting === d.deviceId ? 'Loading...' : isSubmitted ? 'Review →' : 'Open →'}
                </button>

                {/* Approve / Changes — only for submitted */}
                {isSubmitted && (
                  <>
                    <button
                      onClick={() => handleAction(d.deviceId, 'approve')}
                      disabled={acting === d.deviceId}
                      className="rounded border border-green-600 bg-green-700/30 px-3 py-1.5 text-[10px] font-medium text-green-300 hover:bg-green-700/50 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(d.deviceId, 'request-changes')}
                      disabled={acting === d.deviceId}
                      className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-[10px] font-medium text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Changes
                    </button>
                  </>
                )}

                {/* Pull & Build — only for approved */}
                {isApproved && (
                  <button
                    onClick={() => handleAction(d.deviceId, 'pull-build')}
                    disabled={acting === d.deviceId}
                    className="rounded border border-green-600 bg-green-700/30 px-3 py-1.5 text-[10px] font-medium text-green-300 hover:bg-green-700/50 transition-colors disabled:opacity-50"
                  >
                    Pull & Build Tutorials
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
