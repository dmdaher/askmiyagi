'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePipelineStore } from '@/store/pipelineStore';
import PipelineDetail from '@/components/admin/PipelineDetail';

export default function PipelineOverviewPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const router = useRouter();
  const activePipeline = usePipelineStore((s) => s.activePipeline);
  const logs = usePipelineStore((s) => s.logs);
  const resolveEscalation = usePipelineStore((s) => s.resolveEscalation);

  if (!activePipeline) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading pipeline...</div>
      </div>
    );
  }

  const handleResolve = (escalationId: string, resolution: string) => {
    // 'navigate' is a UI-only intent (e.g., from the tutorial-review banner)
    // — route to the relevant review page rather than resolving the escalation.
    if (resolution === 'navigate') {
      router.push(`/admin/${deviceId}/review-tutorials`);
      return;
    }
    resolveEscalation(deviceId, escalationId, resolution);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 h-full overflow-auto">
      <PipelineDetail
        pipeline={activePipeline}
        logs={logs}
        onResolve={handleResolve}
      />
    </div>
  );
}
