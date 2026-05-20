'use client';

/**
 * FloatingStepControl — admin-only positioning wrapper for the canvas
 * step navigation cluster (ProgressBar + StepContent + NavigationControls).
 *
 * 4 modes cyclable via a button cluster in the header:
 *   - anchored: in-flow at the bottom of the preview column (default)
 *   - floating: absolutely-positioned draggable card, default bottom-right
 *   - mini:     32px pill showing "Step N/M · ‹ ›" + truncated title
 *   - hidden:   completely hidden; a tiny "⤴ Show steps" chip reveals
 *
 * Mode + position persisted per device in sessionStorage.
 * Drag clamps to viewport.
 */
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import type { Tutorial, TutorialStep } from '@/types/tutorial';
import ProgressBar from '@/components/tutorial/ProgressBar';
import StepContent from '@/components/tutorial/StepContent';
import NavigationControls from '@/components/tutorial/NavigationControls';

export type StepControlMode = 'anchored' | 'floating' | 'mini' | 'hidden';

const MODE_KEY = (deviceId: string) => `canvas:step-control:${deviceId}`;
const POS_KEY = (deviceId: string) => `canvas:step-control:pos:${deviceId}`;
const MODES: StepControlMode[] = ['anchored', 'floating', 'mini', 'hidden'];

interface Position { x: number; y: number; }

interface Props {
  deviceId: string;
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
  const [position, setPositionState] = useState<Position>({ x: 0, y: 0 });

  // Load persisted state per device
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const m = sessionStorage.getItem(MODE_KEY(deviceId));
      if (m && (MODES as string[]).includes(m)) setModeState(m as StepControlMode);
      else setModeState('anchored');
      const pos = sessionStorage.getItem(POS_KEY(deviceId));
      if (pos) {
        const parsed = JSON.parse(pos);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPositionState(parsed);
        }
      }
    } catch { /* ignore */ }
  }, [deviceId]);

  const setMode = useCallback((m: StepControlMode) => {
    setModeState(m);
    try { sessionStorage.setItem(MODE_KEY(deviceId), m); } catch { /* ignore */ }
  }, [deviceId]);

  const setPosition = useCallback((p: Position) => {
    setPositionState(p);
    try { sessionStorage.setItem(POS_KEY(deviceId), JSON.stringify(p)); } catch { /* ignore */ }
  }, [deviceId]);

  const cycleMode = useCallback(() => {
    const idx = MODES.indexOf(mode);
    setMode(MODES[(idx + 1) % MODES.length]);
  }, [mode, setMode]);

  return { mode, setMode, cycleMode, position, setPosition };
}

function ModeClusterButton({
  active, onClick, title, testid, children,
}: {
  active: boolean; onClick: () => void; title: string; testid: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      data-testid={testid}
      aria-pressed={active}
      className={`w-5 h-5 flex items-center justify-center rounded text-[11px] transition-colors ${
        active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ModeCluster({ mode, setMode }: { mode: StepControlMode; setMode: (m: StepControlMode) => void }) {
  return (
    <div className="flex items-center gap-0.5" data-testid="step-control-mode-cluster">
      <ModeClusterButton
        active={mode === 'anchored'}
        onClick={() => setMode('anchored')}
        title="Anchor at bottom of preview"
        testid="step-mode-anchored"
      >⤓</ModeClusterButton>
      <ModeClusterButton
        active={mode === 'floating'}
        onClick={() => setMode('floating')}
        title="Float as draggable card"
        testid="step-mode-floating"
      >⇲</ModeClusterButton>
      <ModeClusterButton
        active={mode === 'mini'}
        onClick={() => setMode('mini')}
        title="Minimize to step pill"
        testid="step-mode-mini"
      >⇱</ModeClusterButton>
      <ModeClusterButton
        active={mode === 'hidden'}
        onClick={() => setMode('hidden')}
        title="Hide step control"
        testid="step-mode-hidden"
      >⏵</ModeClusterButton>
    </div>
  );
}

function FullStepBlock({
  currentStepIndex, totalSteps, step, steps, onStepClick, onPrev, onNext,
  mode, setMode, onPointerDown,
}: Props & {
  mode: StepControlMode;
  setMode: (m: StepControlMode) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <>
      <div
        className="max-w-[1100px] mx-auto px-6 pt-3 pb-2 flex items-center gap-4"
        onPointerDown={onPointerDown}
        data-testid="step-control-draghandle"
        style={onPointerDown ? { cursor: 'grab' } : undefined}
      >
        <p
          className="text-[10px] uppercase tracking-wider text-white/40 flex-shrink-0"
          data-testid="current-step-num"
        >
          Step {currentStepIndex + 1} / {totalSteps}
        </p>
        <div className="flex-1 min-w-0">
          <ProgressBar
            progress={((currentStepIndex + 1) / totalSteps) * 100}
            steps={totalSteps}
            currentStep={currentStepIndex}
            onStepClick={onStepClick}
          />
        </div>
        <div className="flex-shrink-0">
          <NavigationControls
            onPrev={onPrev}
            onNext={onNext}
            isPrevDisabled={currentStepIndex === 0}
            isNextDisabled={currentStepIndex >= totalSteps - 1}
          />
        </div>
        <ModeCluster mode={mode} setMode={setMode} />
      </div>
      <div data-testid="step-content-wrapper">
        {step && <StepContent step={step} />}
      </div>
    </>
  );
}

interface FullProps extends Props {
  mode: StepControlMode;
  setMode: (m: StepControlMode) => void;
  position: Position;
  setPosition: (p: Position) => void;
}

const FloatingStepControl = forwardRef<HTMLDivElement | HTMLButtonElement, FullProps>(function FloatingStepControl(props, ref) {
  const { mode, setMode, position, setPosition, step, currentStepIndex, totalSteps, onPrev, onNext, onStepClick, steps, deviceId } = props;
  const dragState = useRef<{ active: boolean; startX: number; startY: number; origX: number; origY: number }>({
    active: false, startX: 0, startY: 0, origX: 0, origY: 0,
  });

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== 'floating' && mode !== 'mini') return;
    if (!(e.target as HTMLElement).closest('[data-testid="step-control-draghandle"]')) return;
    // Don't start drag on interactive children (buttons, inputs)
    const t = e.target as HTMLElement;
    if (t.closest('button, input, a, [data-testid^="progress-dot-"]')) return;
    dragState.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      origX: position.x, origY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [mode, position]);

  useEffect(() => {
    if (mode !== 'floating' && mode !== 'mini') return;
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.active) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      const next = { x: dragState.current.origX + dx, y: dragState.current.origY + dy };
      // Clamp to viewport
      const vw = window.innerWidth, vh = window.innerHeight;
      const PAD = 16;
      next.x = Math.max(-vw + 200, Math.min(vw - 200, next.x));
      next.y = Math.max(-vh + 80, Math.min(vh - 80 - PAD, next.y));
      setPosition(next);
    };
    const onUp = () => { dragState.current.active = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [mode, setPosition]);

  // ── HIDDEN — reveal chip only ──────────────────────────────────────────
  if (mode === 'hidden') {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={() => setMode('anchored')}
        data-testid="step-control-reveal"
        title="Show step control"
        className="fixed bottom-4 right-4 z-40 text-[10px] px-2.5 py-1.5 rounded-full bg-cyan-700/80 hover:bg-cyan-600 text-white shadow-lg cursor-pointer transition-colors"
      >
        ⤴ Show steps
      </button>
    );
  }

  // ── MINI — 32px pill ──────────────────────────────────────────────────
  if (mode === 'mini') {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className="fixed z-40 bg-[#0f0f1a] border border-white/15 rounded-full shadow-lg flex items-center gap-2 pl-3 pr-1 py-1 cursor-grab"
        style={{
          bottom: 16 - position.y,
          right: 16 - position.x,
          maxWidth: 'min(480px, calc(100vw - 32px))',
        }}
        onPointerDown={onPointerDown}
        data-testid="step-control-mini"
      >
        <div data-testid="step-control-draghandle" className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="text-[10px] uppercase tracking-wider text-white/60 flex-shrink-0"
            data-testid="current-step-num"
          >
            Step {currentStepIndex + 1} / {totalSteps}
          </span>
          <span className="text-[11px] text-white/85 truncate min-w-0">
            {step?.title ?? ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStepIndex === 0}
          className="w-6 h-6 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[12px]"
          title="Previous"
        >‹</button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentStepIndex >= totalSteps - 1}
          className="w-6 h-6 rounded-full text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[12px]"
          title="Next"
        >›</button>
        <ModeCluster mode={mode} setMode={setMode} />
      </div>
    );
  }

  // ── FLOATING — absolutely-positioned draggable card ────────────────────
  if (mode === 'floating') {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className="fixed z-40 bg-[#0f0f1a] border border-white/15 rounded-lg shadow-2xl"
        style={{
          bottom: 16 - position.y,
          right: 16 - position.x,
          width: 'min(720px, calc(100vw - 32px))',
          maxHeight: 'min(60vh, 480px)',
          overflow: 'auto',
        }}
        onPointerDown={onPointerDown}
        data-testid="step-control-floating"
      >
        <FullStepBlock
          {...props}
          mode={mode}
          setMode={setMode}
          onPointerDown={undefined}
        />
      </div>
    );
  }

  // ── ANCHORED (default) — caller renders this in the preview column ─────
  // We render the full block here too; the caller is responsible for
  // positioning context (it'll be in-flow at the bottom of the preview).
  // No ref attached in anchored mode — caller's useFloatingSafeArea sees
  // null and returns default padding, which is exactly what we want
  // since anchored mode doesn't overlay the scroll content.
  return (
    <div
      className="flex-shrink-0 border-t border-white/10 bg-[#0f0f1a]"
      data-testid="step-control-anchored"
    >
      <FullStepBlock
        {...props}
        mode={mode}
        setMode={setMode}
        onPointerDown={undefined}
      />
    </div>
  );
});

export default FloatingStepControl;
