'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tutorial } from '@/types/tutorial';
import { useTutorialEngine } from '@/hooks/useTutorialEngine';
import { PANEL_NATURAL_WIDTH, PANEL_NATURAL_HEIGHT } from '@/lib/constants';
import StepContent from './StepContent';
import NavigationControls from './NavigationControls';
import ProgressBar from './ProgressBar';
import KeyboardZoneOverlay from './KeyboardZoneOverlay';
import ReportModal from './ReportModal';

interface TutorialRunnerProps {
  tutorial: Tutorial;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DevicePanel: React.ComponentType<any>;
}

const SPEED_OPTIONS = [
  { label: 'Slow', value: 15 },
  { label: 'Medium', value: 8 },
  { label: 'Fast', value: 4 },
] as const;

export default function TutorialRunner({
  tutorial,
  DevicePanel,
}: TutorialRunnerProps) {
  const store = useTutorialEngine(tutorial);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [scale, setScale] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return Math.min(w / PANEL_NATURAL_WIDTH, 1) * 0.99;
  });

  const updateScale = useCallback((width: number) => {
    if (width > 0) setScale(Math.min(width / PANEL_NATURAL_WIDTH, 1) * 0.99);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => updateScale(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  const step = store.currentStep();
  const totalSteps = store.totalSteps();
  const isFirst = store.isFirstStep();
  const isLast = store.isLastStep();
  const progress = store.progress();

  const handleClose = () => {
    store.reset();
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  if (!store.isActive || !step) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0a14]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0f0f1a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close tutorial"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">
              {tutorial.title}
            </h1>
            <p className="text-[10px] text-white/40 mt-0.5">
              {tutorial.category} &middot; {tutorial.difficulty} &middot;{' '}
              {tutorial.estimatedTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-white/40 font-medium">
            {store.currentStepIndex + 1} / {totalSteps}
          </div>
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 hover:border-amber-400/30 transition-colors cursor-pointer"
            aria-label="Report an issue"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
            Help Us Improve
          </button>
        </div>
      </header>

      {/* Pinned panel area */}
      <div className="flex-shrink-0 flex flex-col items-center p-3 pb-0">
        <div ref={containerRef} className="w-full overflow-x-auto rounded-lg">
          <div style={{
            width: PANEL_NATURAL_WIDTH * scale,
            height: PANEL_NATURAL_HEIGHT * scale,
            overflow: 'hidden',
          }}>
            <div style={{
              width: PANEL_NATURAL_WIDTH,
              height: PANEL_NATURAL_HEIGHT,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
            }}>
              <DevicePanel
                panelState={store.panelState}
                displayState={store.displayState}
                highlightedControls={store.highlightedControls}
                zones={store.zones}
              />
            </div>
          </div>
        </div>
        {store.zones.length > 0 && (
          <div className="w-full mt-2">
            <KeyboardZoneOverlay zones={store.zones} />
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex-shrink-0 flex flex-col gap-2 px-4 py-3 border-y border-white/10 bg-[#0f0f1a]/60">
        <ProgressBar
          progress={progress}
          steps={totalSteps}
          currentStep={store.currentStepIndex}
        />
        <div className="flex justify-center">
          <NavigationControls
            onPrev={store.prevStep}
            onNext={store.nextStep}
            isPrevDisabled={isFirst}
            isNextDisabled={isLast}
            autoplay={store.autoplay}
            onToggleAutoplay={store.toggleAutoplay}
          />
        </div>
      </div>

      {/* Panel hint (first step only) */}
      <div className="text-center text-sm text-[#66ccff] font-medium py-2" style={{ background: 'rgba(0, 170, 255, 0.08)' }}>
        ↑ Your instrument updates in real time — watch the highlighted controls above as you navigate
      </div>

      {/* Speed controls (only when autoplay is on) */}
      <AnimatePresence>
        {store.autoplay && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="px-4 py-2 flex items-center gap-2 border-b border-white/10 bg-[#0f0f1a]/40">
              <span className="text-[10px] text-white/30">Speed</span>
              <div className="flex items-center gap-1">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => store.setAutoplaySpeed(option.value)}
                    className={[
                      'px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
                      store.autoplaySpeed === option.value
                        ? 'bg-[#00aaff]/20 text-[#00ccff] border border-[#00aaff]/30'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto">
        <StepContent step={step} />
      </div>

      {/* Report modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tutorialTitle={tutorial.title}
        tutorialId={tutorial.id}
        deviceId={tutorial.deviceId}
        category={tutorial.category}
        difficulty={tutorial.difficulty}
        currentStepIndex={store.currentStepIndex}
        stepTitles={tutorial.steps.map((s) => s.title)}
        totalSteps={totalSteps}
      />
    </div>
  );
}
