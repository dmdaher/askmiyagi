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

const STATUS_STYLES: Record<string, string> = {
  ready: 'bg-green-600/20 text-green-400 border-green-600/40',
  'in-progress': 'bg-blue-600/20 text-blue-400 border-blue-600/40',
  submitted: 'bg-amber-600/20 text-amber-400 border-amber-600/40',
  approved: 'bg-gray-600/20 text-gray-400 border-gray-600/40',
};

const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  'in-progress': 'In Progress',
  submitted: 'Submitted — awaiting review',
  approved: 'Approved ✓',
};

const ACTION_LABELS: Record<string, string> = {
  ready: 'Edit →',
  'in-progress': 'Continue →',
  submitted: 'View →',
  approved: '',
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
        <h1 className="text-2xl font-bold text-gray-200 mb-1">Your Panels</h1>
        <p className="text-sm text-gray-500 mb-6">Select a panel to edit</p>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : devices.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111122] p-8 text-center">
            <p className="text-gray-400">No panels available yet</p>
            <p className="text-sm text-gray-600 mt-1">You'll be notified when one is ready</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {devices.map((d) => (
              <div
                key={d.deviceId}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#111122] px-5 py-4 transition-colors hover:border-gray-700"
              >
                <div>
                  <h2 className="text-sm font-semibold text-gray-200">
                    {d.manufacturer} {d.deviceName}
                  </h2>
                  <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLES[d.status] ?? STATUS_STYLES.ready}`}>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>
                {ACTION_LABELS[d.status] && (
                  <Link
                    href={`/editor/${d.deviceId}`}
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                  >
                    {ACTION_LABELS[d.status]}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
