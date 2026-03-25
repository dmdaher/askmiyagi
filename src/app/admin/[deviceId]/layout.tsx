'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePipelineStore } from '@/store/pipelineStore';
import DeviceHeader from '@/components/admin/DeviceHeader';
import DeviceNav from '@/components/admin/DeviceNav';

export default function DeviceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { deviceId } = useParams<{ deviceId: string }>();
  const fetchPipeline = usePipelineStore((s) => s.fetchPipeline);
  const connectSSE = usePipelineStore((s) => s.connectSSE);
  const disconnectSSE = usePipelineStore((s) => s.disconnectSSE);

  // SSE connection persists across route changes within /admin/{id}/*
  useEffect(() => {
    if (!deviceId) return;
    fetchPipeline(deviceId);
    connectSSE(deviceId);
    return () => disconnectSSE();
  }, [deviceId, fetchPipeline, connectSSE, disconnectSSE]);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <DeviceHeader deviceId={deviceId} />
      <DeviceNav deviceId={deviceId} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
