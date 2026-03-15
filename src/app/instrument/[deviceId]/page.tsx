'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import BrandingHeader from '@/components/ui/BrandingHeader';
import { getDevice } from '@/data/devices';
import { DEVICE_REGISTRY } from '@/lib/deviceRegistry';

export default function InstrumentPage() {
  const params = useParams<{ deviceId: string }>();
  const router = useRouter();
  const deviceId = params.deviceId;

  const device = useMemo(() => getDevice(deviceId), [deviceId]);
  const registry = DEVICE_REGISTRY[deviceId];
  const DevicePanel = registry?.PanelComponent;
  const panelWidth = registry?.dimensions.width ?? 0;
  const tutorials = registry?.tutorials ?? [];

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fullSize, setFullSize] = useState(false);

  const updateScale = useCallback(
    (width: number) => {
      if (width > 0 && !fullSize) setScale(Math.min(width / panelWidth, 1));
    },
    [panelWidth, fullSize],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => updateScale(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  useEffect(() => {
    if (fullSize) setScale(1);
  }, [fullSize]);

  if (!device || !DevicePanel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6">
        <div className="text-center">
          <div className="mb-4 text-6xl text-gray-600">404</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-100">Instrument Not Found</h1>
          <p className="max-w-md text-gray-400">
            We couldn&apos;t find an instrument with ID &quot;{deviceId}&quot;.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <BrandingHeader />

      <main className="flex-1">
        {/* Device info + controls */}
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                {device.manufacturer}
              </p>
              <h2 className="text-3xl font-bold text-gray-100">{device.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                {device.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setFullSize(!fullSize)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  fullSize
                    ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--card-border)] text-gray-400 hover:bg-[var(--surface)] hover:text-gray-200'
                }`}
              >
                {fullSize ? 'Fit to Window' : 'Full Size'}
              </button>
              {tutorials.length > 0 && (
                <button
                  onClick={() => router.push(`/?device=${deviceId}`)}
                  className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  {tutorials.length} {tutorials.length === 1 ? 'Tutorial' : 'Tutorials'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Panel viewport */}
        <div
          ref={containerRef}
          className={`relative mx-auto ${fullSize ? '' : 'max-w-7xl px-6'}`}
          style={fullSize ? { overflowX: 'auto', overflowY: 'hidden' } : undefined}
        >
          <motion.div
            className="origin-top-left"
            style={
              fullSize
                ? { width: panelWidth + 40, padding: '0 20px 20px' }
                : { transform: `scale(${scale})`, transformOrigin: 'top left', height: registry.dimensions.height * scale }
            }
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <DevicePanel
              panelState={{}}
              displayState={{ screenType: 'home' }}
              highlightedControls={[]}
            />
          </motion.div>
        </div>

        {/* Tutorial links */}
        {tutorials.length > 0 && (
          <div className="mx-auto max-w-7xl px-6 py-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-200">Available Tutorials</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tutorials.map((t) => (
                <Link
                  key={t.id}
                  href={`/tutorial/${deviceId}/${t.id}`}
                  className="group rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition-colors hover:border-[var(--accent)]/30"
                >
                  <p className="font-medium text-gray-200 group-hover:text-white">{t.title}</p>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-gray-400">
                      {t.difficulty}
                    </span>
                    <span className="text-[10px] text-gray-600">{t.estimatedTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
