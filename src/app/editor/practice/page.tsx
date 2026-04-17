'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DeviceSummary {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
}

export default function PracticeListPage() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    try {
      const res = await fetch('/api/hosted/panels?sandbox=true');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      if (list.length === 0 && !seeding) {
        // Auto-seed practice instruments on first visit
        setSeeding(true);
        await fetch('/api/hosted/panels/seed-practice', { method: 'POST' });
        // Re-fetch after seeding
        const res2 = await fetch('/api/hosted/panels?sandbox=true');
        const data2 = await res2.json();
        setDevices(Array.isArray(data2) ? data2 : []);
        setSeeding(false);
      } else {
        setDevices(list);
      }
    } catch {
      // Seeding may fail on Vercel (no local files) — show empty state
      setDevices([]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/editor" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to instruments
          </Link>
          <h1 className="text-2xl font-bold text-gray-200 mt-3 mb-1">Practice Editor</h1>
          <p className="text-sm text-gray-500">Learn the tools without affecting real instruments</p>
        </div>

        {loading || seeding ? (
          <div className="text-gray-500 text-sm">
            {seeding ? 'Setting up practice instruments...' : 'Loading...'}
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111122] p-8 text-center">
            <p className="text-gray-400">No practice instruments available</p>
            <p className="text-sm text-gray-600 mt-1">Practice instruments are set up by the admin</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {devices.map((d) => (
              <div
                key={d.deviceId}
                className="rounded-lg border border-gray-800 bg-[#111122] px-5 py-4 transition-colors hover:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-400" />
                    <div>
                      <h2 className="text-sm font-semibold text-gray-200">
                        {d.manufacturer} {d.deviceName}
                      </h2>
                      <p className="text-[11px] text-gray-500 mt-0.5">Practice — your changes won't affect real instruments</p>
                    </div>
                  </div>
                  <Link
                    href={`/editor/practice/${d.deviceId}`}
                    className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
