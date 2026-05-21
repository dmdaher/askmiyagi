'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * useCanvasAutoRefresh — polls the mtime endpoint every N seconds while
 * the tab is visible AND the suppress callback returns false. When a
 * change is detected, calls the supplied `onRefresh` callback (PR-N1)
 * or falls back to `router.refresh()` for legacy callers.
 *
 * **PR-N1**: previously this only called `router.refresh()`, which is
 * a no-op for client components that fetch their own data via useState
 * + useEffect (review-tutorials/page.tsx). Pass `onRefresh` to opt
 * into the client re-fetch path.
 *
 * Suppression: pass a function returning `true` when refresh should be
 * blocked (e.g., while a Fix modal is open so admin's review isn't
 * yanked out from under them).
 *
 * Feature flag: set `localStorage.canvas-auto-refresh = '0'` to disable.
 */
interface AutoRefreshOpts {
  deviceId: string;
  intervalMs?: number;
  suppress?: () => boolean;
  /**
   * PR-N1: caller-supplied re-fetch. When omitted, falls back to
   * `router.refresh()` (legacy behavior).
   */
  onRefresh?: () => void | Promise<void>;
}

interface MtimeResponse {
  qaReportMtime: number | null;
  tutorialsMtime: number | null;
}

export function useCanvasAutoRefresh({
  deviceId,
  intervalMs = 5000,
  suppress,
  onRefresh,
}: AutoRefreshOpts) {
  const router = useRouter();
  const lastMtimes = useRef<MtimeResponse>({ qaReportMtime: null, tutorialsMtime: null });
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Feature flag opt-out
    try {
      if (localStorage.getItem('canvas-auto-refresh') === '0') return;
    } catch { /* ignore */ }

    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      if (cancelled) return;
      // Pause when tab not visible
      if (document.visibilityState !== 'visible') {
        scheduleNext();
        return;
      }
      // Pause when caller says to (e.g., Fix modal open)
      if (suppress?.()) {
        scheduleNext();
        return;
      }
      try {
        const res = await fetch(
          `/api/pipeline/${deviceId}/review-tutorials/mtime`,
          { cache: 'no-store' },
        );
        if (!res.ok) { scheduleNext(); return; }
        const data = (await res.json()) as MtimeResponse;
        // First tick: capture baseline, don't refresh
        if (!initialized.current) {
          lastMtimes.current = data;
          initialized.current = true;
          scheduleNext();
          return;
        }
        const changed =
          data.qaReportMtime !== lastMtimes.current.qaReportMtime ||
          data.tutorialsMtime !== lastMtimes.current.tutorialsMtime;
        if (changed) {
          lastMtimes.current = data;
          // PR-N1: prefer the caller's re-fetch callback. Fall back to
          // router.refresh() only when no callback is supplied (legacy).
          if (onRefresh) void onRefresh();
          else router.refresh();
        }
      } catch { /* network blip — try again next tick */ }
      scheduleNext();
    };

    const scheduleNext = () => {
      if (cancelled) return;
      timer = window.setTimeout(tick, intervalMs);
    };

    // Kick off on mount + on visibility change → visible
    void tick();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [deviceId, intervalMs, suppress, router, onRefresh]);
}
