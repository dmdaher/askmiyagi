'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { usePipelineStore } from '@/store/pipelineStore';
import DeviceHeader from '@/components/admin/DeviceHeader';
import DeviceNav from '@/components/admin/DeviceNav';

function DeviceLayoutInner({ children }: { children: React.ReactNode }) {
  const { deviceId } = useParams<{ deviceId: string }>();
  const fetchPipeline = usePipelineStore((s) => s.fetchPipeline);
  const connectSSE = usePipelineStore((s) => s.connectSSE);
  const disconnectSSE = usePipelineStore((s) => s.disconnectSSE);
  const search = useSearchParams();
  const compact = search.get('compact') === '1';

  // SSE connection persists across route changes within /admin/{id}/*
  useEffect(() => {
    if (!deviceId) return;
    fetchPipeline(deviceId);
    connectSSE(deviceId);
    return () => disconnectSSE();
  }, [deviceId, fetchPipeline, connectSSE, disconnectSSE]);

  // Compact mode reclaims the outer header's 56px and hides the device
  // header + nav cluster (~120px combined). The canvas page gets the
  // full viewport.
  return (
    <div className={compact ? 'flex h-screen flex-col' : 'flex h-[calc(100vh-56px)] flex-col'}>
      {!compact && <DeviceHeader deviceId={deviceId} />}
      {!compact && <DeviceNav deviceId={deviceId} />}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export default function DeviceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen flex-col">{children}</div>}>
      <DeviceLayoutInner>{children}</DeviceLayoutInner>
    </Suspense>
  );
}
