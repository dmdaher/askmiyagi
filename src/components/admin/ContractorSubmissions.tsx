'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DeviceState {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: string;
  updatedAt: string;
  reviewNote?: string;
}

const STATUS_STYLES: Record<string, { text: string; dot: string }> = {
  ready: { text: 'text-green-400', dot: 'bg-green-400' },
  'in-progress': { text: 'text-blue-400', dot: 'bg-blue-400' },
  submitted: { text: 'text-amber-400', dot: 'bg-amber-400' },
  approved: { text: 'text-green-400', dot: 'bg-green-400' },
};

function getStatusLabel(d: DeviceState): string {
  if (d.status === 'ready') return 'Sent to contractor — waiting for edits';
  if (d.status === 'in-progress' && d.reviewNote) return 'Changes requested — contractor revising';
  if (d.status === 'in-progress') return 'Contractor editing';
  if (d.status === 'submitted') return 'Submitted — needs your review';
  if (d.status === 'approved') return 'Approved ✓';
  return d.status;
}

export default function ContractorSubmissions() {
  const [devices, setDevices] = useState<DeviceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string>>({});
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

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
        // Handled by feedback modal — this is called from the modal's Send button
        return;
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

  const sendFeedback = async (deviceId: string) => {
    setActing(deviceId);
    try {
      await fetch(`/api/hosted/panels/${deviceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress', reviewNote: feedbackText }),
      });
      setResult(prev => ({ ...prev, [deviceId]: '↩ Sent back with feedback' }));
      setFeedbackFor(null);
      setFeedbackText('');
      fetchDevices();
    } catch (err) {
      setResult(prev => ({ ...prev, [deviceId]: `✗ ${(err as Error).message}` }));
    }
    setActing(null);
  };

  if (loading || devices.length === 0) return null;

  const needsReview = devices.filter(d => d.status === 'submitted').length;

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
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Contractor Submissions</h2>
        {needsReview > 0 && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            {needsReview} needs review
          </span>
        )}
      </div>

      {needsReview > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-900/20 px-4 py-3 mb-3 flex items-center gap-2">
          <span className="text-amber-400 text-sm">⚠</span>
          <span className="text-sm text-amber-300">
            {needsReview === 1
              ? 'A panel is ready for your review'
              : `${needsReview} panels are ready for your review`}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((d) => {
          const style = STATUS_STYLES[d.status] ?? STATUS_STYLES.ready;
          const isSubmitted = d.status === 'submitted';
          const isApproved = d.status === 'approved';
          const label = getStatusLabel(d);

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
                <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                <div>
                  <span className="text-sm font-medium text-gray-200">
                    {d.manufacturer} {d.deviceName}
                  </span>
                  <p className={`text-[10px] ${style.text}`}>{label}</p>
                  {d.reviewNote && d.status === 'in-progress' && (
                    <p className="text-[9px] text-amber-400/60 mt-0.5">Note: {d.reviewNote}</p>
                  )}
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
                      onClick={() => { setFeedbackFor(d.deviceId); setFeedbackText(''); }}
                      disabled={acting === d.deviceId}
                      className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-[10px] font-medium text-gray-400 hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Request Changes
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
      {/* Feedback modal */}
      {feedbackFor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setFeedbackFor(null)}>
          <div
            className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#111122] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-200 mb-1">Request Changes</h3>
            <p className="text-xs text-gray-500 mb-4">
              Describe what the contractor needs to fix — be specific about controls, alignment, labels, or any issues.
            </p>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={"Example:\n- Zone buttons aren't aligned horizontally\n- SCENE CTRL label should be hidden\n- Cursor up/down need arrow icons\n- Value dial is too far right, move closer to cursor buttons"}
              rows={8}
              autoFocus
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
            />

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setFeedbackFor(null)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendFeedback(feedbackFor)}
                disabled={!feedbackText.trim() || acting === feedbackFor}
                className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {acting === feedbackFor ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
