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

export default function EditorListPage() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hosted/panels')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setDevices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d1a] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-200 mb-1">Instrument Editor</h1>
            <p className="text-sm text-gray-500">Select an instrument to edit</p>
          </div>
          <button
            onClick={() => {
              document.cookie = 'contractor_access=; path=/; max-age=0';
              window.location.href = '/signin?role=contractor';
            }}
            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Sign out
          </button>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : devices.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111122] p-8 text-center">
            <p className="text-gray-400">No panels available yet</p>
            <p className="text-sm text-gray-600 mt-1">You'll be notified when one is ready</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {devices.map((d) => {
              const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.ready;
              return (
                <div
                  key={d.deviceId}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#111122] px-5 py-4 transition-colors hover:border-gray-700"
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

                  {(d.status === 'ready' || d.status === 'in-progress') && (
                    <Link
                      href={`/editor/${d.deviceId}`}
                      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                      {d.status === 'ready' ? 'Edit →' : 'Continue →'}
                    </Link>
                  )}
                  {d.status === 'submitted' && (
                    <span className="text-[11px] text-amber-400/60">Waiting for review</span>
                  )}
                  {d.status === 'approved' && (
                    <span className="text-[11px] text-green-400">✓ Complete</span>
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
