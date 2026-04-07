'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeviceSummary {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  status: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  ready: 'border-green-500/30 bg-green-500/10 text-green-400',
  'in-progress': 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  submitted: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  approved: 'border-green-500/30 bg-green-500/10 text-green-400',
};

export default function ReviewPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hosted/panels')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setDevices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-200 mb-1">Review Panels</h1>
        <p className="text-sm text-gray-500 mb-6">Review contractor submissions and approve for production</p>

        {devices.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111122] p-8 text-center">
            <p className="text-gray-400">No panels submitted yet</p>
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
                    {d.status}
                  </span>
                </div>
                {d.status === 'submitted' && (
                  <button
                    onClick={() => router.push(`/admin/review/${d.deviceId}`)}
                    className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
                  >
                    Review →
                  </button>
                )}
                {d.status !== 'submitted' && (
                  <button
                    onClick={() => router.push(`/admin/review/${d.deviceId}`)}
                    className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    View
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
