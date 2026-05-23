'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Tutorial } from '@/types/tutorial';
import type { TutorialReviewSummary } from '@/lib/pipeline/tutorial-validators';
import type { PanelManifest } from '@/components/controls/PanelRenderer';
import TutorialReviewCanvas from '@/components/admin/TutorialReviewCanvas';

interface ReviewData {
  deviceId: string;
  deviceName: string;
  currentPhase: string;
  status: string;
  escalationId: string | null;
  summary: TutorialReviewSummary;
  tutorials: Tutorial[];
  manifest: PanelManifest | null;
}

export default function ReviewTutorialsPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * PR-N1: refreshData is the single re-fetch path. Called by:
   *   - mount (initial load)
   *   - canvas action handlers after a successful mutation
   *   - useCanvasAutoRefresh hook on mtime change
   *
   * Replaces router.refresh() which was a no-op against this client
   * component's useState. Bug: orphan-action buttons appeared to "do
   * nothing" because the page never re-fetched its data.
   */
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/pipeline/${deviceId}/review-tutorials`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      const json: ReviewData = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [deviceId]);

  useEffect(() => { void refreshData(); }, [refreshData]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="max-w-lg rounded-lg border border-amber-700/50 bg-amber-950/30 p-6 text-center">
          <h2 className="text-base font-semibold text-amber-300 mb-2">Tutorial review not ready</h2>
          <p className="text-sm text-amber-100/80 mb-4">{error}</p>
          <a
            href={`/admin/${deviceId}`}
            className="inline-block text-xs px-3 py-1.5 rounded font-medium bg-amber-900/40 text-amber-200 hover:bg-amber-900/60 transition-colors"
          >
            ← Back to pipeline
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-gray-500">Loading tutorial review…</div>
      </div>
    );
  }

  return <TutorialReviewCanvas data={data} onRefreshData={refreshData} />;
}
