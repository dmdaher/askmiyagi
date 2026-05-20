'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * CanvasScaleControl — exact editor-parity scale UX.
 *
 * Mirrors the editor's `Scale:` cluster from EditorToolbar.tsx:
 *   - Compact `Scale: [−] [%] [+] [⤢ Scale…]` row
 *   - `−` button scales DOWN to 80% of current (matches editor's
 *     `scaleCanvas(0.8)` shortcut)
 *   - `+` button scales UP to 125% of current (matches editor's
 *     `scaleCanvas(1.25)` shortcut)
 *   - Click `%` resets to 100%
 *   - `⤢ Scale…` opens CanvasScaleModal for custom % + presets
 *
 * Power-user keyboard shortcuts (invisible, no UI affordance):
 *   - Cmd+0 reset to 100%
 *   - Cmd+= / Cmd+- step ±10% (NOT the editor's 0.8x/1.25x — keyboard
 *     stepping has finer granularity than button stepping)
 *   - Cmd+wheel over the panel preview area (caller wires `bindWheelTo`)
 *
 * Visual effect is CSS transform-scale on the panel wrapper (caller
 * multiplies wrapper width/height by `scale` + applies
 * `transform: scale(${scale})` with `transform-origin: top left`).
 * Session-only — never mutates the manifest, drift CI unaffected.
 */

const STORAGE_KEY = (deviceId: string) => `canvas:scale:${deviceId}`;
// Editor step factors: −=×0.8, +=×1.25 (multiplicative, not additive)
const STEP_DOWN_FACTOR = 0.8;
const STEP_UP_FACTOR = 1.25;
// Clamp range. Slider/buttons clamp to 25–200% (sane review range).
// Cmd+wheel + modal can overshoot to 10–500% for power-user spot-checks.
const MIN_CLAMP = 0.25;
const MAX_CLAMP = 2.0;
const MIN_OVERSHOOT = 0.1;
const MAX_OVERSHOOT = 5.0;
// Cmd+= / Cmd+- step (additive — finer than button factor)
const KEYBOARD_STEP = 0.1;

function readPersisted(deviceId: string): number {
  if (typeof window === 'undefined') return 1;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY(deviceId));
    if (!v) return 1;
    const n = Number(v);
    if (!Number.isFinite(n) || n < MIN_OVERSHOOT || n > MAX_OVERSHOOT) return 1;
    return n;
  } catch { return 1; }
}

function writePersisted(deviceId: string, scale: number): void {
  try { sessionStorage.setItem(STORAGE_KEY(deviceId), String(scale)); } catch { /* ignore */ }
}

interface CanvasScaleControlProps {
  deviceId: string;
  /** Optional callback when the scale changes (caller applies to wrapper). */
  onScaleChange?: (scale: number) => void;
  /**
   * Optional auto-fit calculator. Called on first visit (no persisted
   * scale yet) to compute an initial scale that fits the panel into the
   * preview viewport. Without this, large panels (e.g. cdj-3000 at
   * 1469×1842) overflow on default 100% scale and admin has to manually
   * scale down.
   */
  computeAutoFit?: () => number | null;
}

export interface CanvasScaleApi {
  scale: number;
  /** Set raw scale (clamped to overshoot range — used by Cmd+wheel + modal). */
  setScale: (n: number) => void;
  /** Set scale via the slider-range clamp (25–200%) — used by buttons. */
  setScaleClamped: (n: number) => void;
  stepDown: () => void;
  stepUp: () => void;
  reset: () => void;
  /** Attach Cmd+wheel handler to a panel preview area. */
  bindWheelTo: (el: HTMLElement | null) => (() => void) | undefined;
}

function hasPersistedScale(deviceId: string): boolean {
  if (typeof window === 'undefined') return false;
  try { return sessionStorage.getItem(STORAGE_KEY(deviceId)) !== null; } catch { return false; }
}

export function useCanvasScale(opts: CanvasScaleControlProps): CanvasScaleApi {
  const { deviceId, onScaleChange, computeAutoFit } = opts;
  const [scale, setScaleState] = useState<number>(() => readPersisted(deviceId));
  const autoFitDone = useRef<string | null>(null);

  const setScale = useCallback((n: number) => {
    const clamped = Math.max(MIN_OVERSHOOT, Math.min(MAX_OVERSHOOT, n));
    setScaleState(clamped);
    writePersisted(deviceId, clamped);
    onScaleChange?.(clamped);
  }, [deviceId, onScaleChange]);

  const setScaleClamped = useCallback((n: number) => {
    setScale(Math.max(MIN_CLAMP, Math.min(MAX_CLAMP, n)));
  }, [setScale]);

  const stepDown = useCallback(() => {
    setScaleClamped(scale * STEP_DOWN_FACTOR);
  }, [scale, setScaleClamped]);

  const stepUp = useCallback(() => {
    setScaleClamped(scale * STEP_UP_FACTOR);
  }, [scale, setScaleClamped]);

  const reset = useCallback(() => setScale(1), [setScale]);

  // Reload persisted scale when deviceId changes (each device has its own).
  useEffect(() => {
    setScaleState(readPersisted(deviceId));
  }, [deviceId]);

  // First-visit auto-fit: when admin has never persisted a scale for this
  // device, compute the fit-to-viewport scale and apply it. Large panels
  // (cdj-3000 at 1469×1842) would otherwise overflow the preview area at
  // default 100% and admin would have to manually shrink. Done once per
  // device per session.
  //
  // Implementation: the latest computeAutoFit is held in a ref so the
  // poll loop below picks up the up-to-date callback without restarting
  // on every previewSize change. A single 50ms poll waits until
  // computeAutoFit returns a usable number (i.e., the caller's
  // ResizeObserver has reported the preview area size), then applies it
  // and stops polling. Bails out after 2s if nothing usable comes back.
  const computeAutoFitRef = useRef(computeAutoFit);
  useEffect(() => { computeAutoFitRef.current = computeAutoFit; }, [computeAutoFit]);

  useEffect(() => {
    if (autoFitDone.current === deviceId) return;
    if (hasPersistedScale(deviceId)) {
      autoFitDone.current = deviceId;
      return;
    }
    let cancelled = false;
    let elapsed = 0;
    const POLL_MS = 50;
    const POLL_BUDGET_MS = 2000;
    const tick = () => {
      if (cancelled) return;
      if (autoFitDone.current === deviceId) return;
      const fn = computeAutoFitRef.current;
      const fit = fn ? fn() : null;
      // Apply when fit is a valid positive number (computeAutoFit clamps
      // to [0.5, 1.0] for cdj-3000-like big panels; small panels return
      // 1.0 and we still apply explicitly so percent display is correct).
      if (fit !== null && fit > 0) {
        autoFitDone.current = deviceId;
        setScale(fit);
        return;
      }
      elapsed += POLL_MS;
      if (elapsed >= POLL_BUDGET_MS) {
        autoFitDone.current = deviceId;
        return;
      }
      setTimeout(tick, POLL_MS);
    };
    setTimeout(tick, POLL_MS);
    return () => { cancelled = true; };
  }, [deviceId, setScale]);

  // Cmd+0 / Cmd+= / Cmd+- keyboard shortcuts (window-level, invisible to UI).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '0') { e.preventDefault(); reset(); }
      else if (e.key === '=' || e.key === '+') { e.preventDefault(); setScale(scale + KEYBOARD_STEP); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); setScale(scale - KEYBOARD_STEP); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scale, setScale, reset]);

  // Bind Cmd+wheel to a specific element (preventDefault inside that area
  // only — browser zoom still works elsewhere).
  const bindWheelTo = useCallback((el: HTMLElement | null) => {
    if (!el) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      // deltaY negative = scroll up = zoom in
      const delta = -Math.sign(e.deltaY) * KEYBOARD_STEP;
      setScale(scale + delta);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scale, setScale]);

  return { scale, setScale, setScaleClamped, stepDown, stepUp, reset, bindWheelTo };
}

interface ToolbarProps {
  api: CanvasScaleApi;
  /** Called when admin clicks the ⤢ Scale… button (caller opens modal). */
  onOpenModal: () => void;
}

export default function CanvasScaleControlToolbar({ api, onOpenModal }: ToolbarProps) {
  const { scale, stepDown, stepUp, reset } = api;
  const percent = Math.round(scale * 100);

  return (
    <div
      className="flex items-center gap-0.5"
      data-testid="canvas-scale-toolbar"
    >
      <span className="text-[9px] text-white/40 mr-1">Scale:</span>
      <button
        type="button"
        onClick={stepDown}
        disabled={scale <= MIN_CLAMP + 0.001}
        title="Scale down to 80% (Cmd+−)"
        data-testid="scale-minus"
        className="flex h-6 w-6 items-center justify-center rounded text-[12px] text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <button
        type="button"
        onClick={reset}
        title="Reset to 100% (Cmd+0)"
        data-testid="scale-percent"
        className="w-9 text-center text-[10px] text-white/70 hover:text-white tabular-nums cursor-pointer"
      >
        {percent}%
      </button>
      <button
        type="button"
        onClick={stepUp}
        disabled={scale >= MAX_CLAMP - 0.001}
        title="Scale up to 125% (Cmd+=)"
        data-testid="scale-plus"
        className="flex h-6 w-6 items-center justify-center rounded text-[12px] text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
      <button
        type="button"
        onClick={onOpenModal}
        data-testid="scale-modal-open"
        title="Scale all contents proportionally to a custom percentage"
        className="flex h-6 items-center px-2 rounded text-[9px] text-white/70 hover:bg-white/10 hover:text-white border border-white/15 ml-0.5 transition-colors"
      >
        ⤢ Scale…
      </button>
    </div>
  );
}
