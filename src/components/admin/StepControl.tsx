'use client';

/**
 * StepControl (PR-N3) — replaces FloatingStepControl.
 *
 * Two modes only:
 *   - 'anchored' (default): in-flow at bottom of preview column
 *     (ProgressBar + full StepContent + NavigationControls)
 *   - 'compact-strip': slim bar with "Step N · ← → · title" only
 *
 * Dropped from v1: 'floating', 'mini', 'hidden' — they caused the
 * panel glitches + scroll-block + arrow-key hijack you reported.
 *
 * Arrow keys ←/→ navigate steps. Bound at window level in the parent
 * canvas, NOT inside this component (so they work regardless of focus).
 */
import { useCallback, useEffect, useState } from 'react';
import type { Tutorial, TutorialStep } from '@/types/tutorial';
import ProgressBar from '@/components/tutorial/ProgressBar';
import StepContent from '@/components/tutorial/StepContent';
import NavigationControls from '@/components/tutorial/NavigationControls';

export type StepControlMode = 'anchored' | 'compact-strip';

const MODE_KEY = (deviceId: string) => `canvas:step-control:${deviceId}`;
const VALID_MODES: StepControlMode[] = ['anchored', 'compact-strip'];

interface Props {
  deviceId: string;
  mode: StepControlMode;
  setMode: (m: StepControlMode) => void;
  currentStepIndex: number;
  totalSteps: number;
  step: TutorialStep | undefined;
  steps: Tutorial['steps'];
  onStepClick: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function useStepControlMode(deviceId: string) {
  const [mode, setModeState] = useState<StepControlMode>('anchored');

  // Load persisted mode per device. Includes a one-time migration:
  // if the user's saved mode is a legacy value (floating/mini/hidden),
  // silently fall back to 'anchored' so we don't leave them on a
  // non-existent mode.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const m = sessionStorage.getItem(MODE_KEY(deviceId));
      if (m && (VALID_MODES as string[]).includes(m)) {
        setModeState(m as StepControlMode);
      } else {
        // Legacy value or absent → default + write back so we don't keep migrating
        setModeState('anchored');
        if (m && m !== 'anchored') {
          sessionStorage.setItem(MODE_KEY(deviceId), 'anchored');
        }
      }
    } catch { /* ignore */ }
  }, [deviceId]);

  const setMode = useCallback((m: StepControlMode) => {
    setModeState(m);
    try { sessionStorage.setItem(MODE_KEY(deviceId), m); } catch { /* ignore */ }
  }, [deviceId]);

  return { mode, setMode };
}

export default function StepControl({
  mode, setMode,
  currentStepIndex, totalSteps, step, steps,
  onStepClick, onPrev, onNext,
}: Props) {
  if (mode === 'compact-strip') {
    return (
      <div
        className="flex-shrink-0 border-t border-white/10 bg-[#0a0a14] px-3 py-1.5 flex items-center gap-2"
        data-testid="step-control-compact-strip"
      >
        <span
          className="text-[10px] text-white/40 tabular-nums flex-shrink-0"
          data-testid="current-step-num"
        >
          {currentStepIndex + 1} / {totalSteps}
        </span>
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStepIndex === 0}
          className="text-[12px] px-2 py-0.5 rounded text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          data-testid="step-control-strip-prev"
          aria-label="Previous step"
        >‹</button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentStepIndex >= totalSteps - 1}
          className="text-[12px] px-2 py-0.5 rounded text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          data-testid="step-control-strip-next"
          aria-label="Next step"
        >›</button>
        <span className="text-[11px] text-white/80 flex-1 min-w-0 truncate">
          {step?.title ?? ''}
        </span>
        <button
          type="button"
          onClick={() => setMode('anchored')}
          className="text-[10px] px-2 py-0.5 rounded text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0"
          data-testid="step-control-expand"
          title="Expand to anchored mode (shows full step content)"
        >▾ Expand</button>
      </div>
    );
  }

  // anchored (default)
  return (
    <div
      className="flex-shrink-0 border-t border-white/10 bg-[#0a0a14]"
      data-testid="step-control-anchored"
    >
      <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2">
        <span
          className="text-[10px] text-white/50 tabular-nums flex-shrink-0"
          data-testid="current-step-num"
        >
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
        <div className="flex-1 min-w-0">
          <ProgressBar
            steps={totalSteps}
            currentStep={currentStepIndex}
            progress={totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0}
            onStepClick={onStepClick}
          />
        </div>
        <button
          type="button"
          onClick={() => setMode('compact-strip')}
          className="text-[10px] px-2 py-0.5 rounded text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0"
          data-testid="step-control-collapse"
          title="Collapse to compact strip (more panel space)"
        >▴ Collapse</button>
      </div>
      <div data-testid="step-content-wrapper">
        {step && <StepContent step={step} />}
      </div>
      <NavigationControls
        onPrev={onPrev}
        onNext={onNext}
        isPrevDisabled={currentStepIndex === 0}
        isNextDisabled={currentStepIndex >= totalSteps - 1}
      />
    </div>
  );
}
