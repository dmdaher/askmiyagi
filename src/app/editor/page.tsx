'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DeviceSummary {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; style: string; dot: string }> = {
  ready: {
    label: 'Ready for editing',
    style: 'bg-green-600/20 text-green-400 border-green-600/40',
    dot: 'bg-green-400',
  },
  'in-progress': {
    label: 'In Progress',
    style: 'bg-blue-600/20 text-blue-400 border-blue-600/40',
    dot: 'bg-blue-400',
  },
  submitted: {
    label: 'Submitted — awaiting review',
    style: 'bg-amber-600/20 text-amber-400 border-amber-600/40',
    dot: 'bg-amber-400',
  },
  approved: {
    label: 'Approved',
    style: 'bg-green-600/20 text-green-400 border-green-600/40',
    dot: 'bg-green-400',
  },
};

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

export default function EditorListPage() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(!!getCookie('admin_access'));
    fetch('/api/hosted/panels')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setDevices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Sort: submitted first (needs attention), then in-progress, ready, approved
  const sortOrder: Record<string, number> = { submitted: 0, 'in-progress': 1, ready: 2, approved: 3 };
  const sorted = [...devices].sort((a, b) => (sortOrder[a.status] ?? 9) - (sortOrder[b.status] ?? 9));

  return (
    <div className="min-h-screen bg-[#0d0d1a] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-200 mb-1">
          {isAdmin ? 'Panel Review' : 'Instrument Editor'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isAdmin ? 'Review and approve contractor submissions' : 'Select an instrument to edit'}
        </p>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111122] p-8 text-center">
            <p className="text-gray-400">No panels available yet</p>
            <p className="text-sm text-gray-600 mt-1">You'll be notified when one is ready</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((d) => {
              const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.ready;
              const needsReview = isAdmin && d.status === 'submitted';

              return (
                <div
                  key={d.deviceId}
                  className={`flex items-center justify-between rounded-lg border px-5 py-4 transition-colors ${
                    needsReview
                      ? 'border-amber-600/40 bg-amber-900/10 hover:border-amber-500/60'
                      : 'border-gray-800 bg-[#111122] hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <div>
                      <h2 className="text-sm font-semibold text-gray-200">
                        {d.manufacturer} {d.deviceName}
                      </h2>
                      <p className="text-[11px] text-gray-500 mt-0.5">{cfg.label}</p>
                    </div>
                  </div>

                  {/* Contractor actions */}
                  {!isAdmin && (d.status === 'ready' || d.status === 'in-progress') && (
                    <Link
                      href={`/editor/${d.deviceId}`}
                      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                      {d.status === 'ready' ? 'Edit →' : 'Continue →'}
                    </Link>
                  )}
                  {!isAdmin && d.status === 'submitted' && (
                    <span className="text-[11px] text-amber-400/60">Waiting for review</span>
                  )}
                  {!isAdmin && d.status === 'approved' && (
                    <span className="text-[11px] text-green-400">✓ Complete</span>
                  )}

                  {/* Admin actions */}
                  {isAdmin && d.status === 'submitted' && (
                    <Link
                      href={`/admin/review/${d.deviceId}`}
                      className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
                    >
                      Review →
                    </Link>
                  )}
                  {isAdmin && d.status !== 'submitted' && (
                    <Link
                      href={`/admin/review/${d.deviceId}`}
                      className="rounded bg-gray-700 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-600 transition-colors"
                    >
                      View
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
