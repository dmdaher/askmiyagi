'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * CanvasScaleControl — editor-parity scale UX for the tutorial review canvas.
 *
 * Mirrors the editor's `controlScale` interaction:
 *   - Slider 25%-200%, snap to 5%
 *   - ± buttons (10% per click)
 *   - Cmd+0 reset to 100%
 *   - Cmd+= / Cmd+- step
 *   - Cmd+wheel over the panel preview area (caller wires `attachWheelTo`)
 *   - Persisted per device in sessionStorage
 *
 * Visual effect is achieved via CSS transform-scale on the panel wrapper
 * (caller multiplies wrapper width/height by `scale` and applies
 * `transform: scale(${scale})` with `transform-origin: top left`).
 * No manifest mutation, no drift impact.
 */

const STORAGE_KEY = (deviceId: string) => `canvas:scale:${deviceId}`;
const MIN_SLIDER = 0.25;
const MAX_SLIDER = 2.0;
// Cmd+wheel may overshoot the slider clamp briefly for spot-checks.
const MIN_WHEEL = 0.1;
const MAX_WHEEL = 5.0;
const STEP = 0.1;
const SLIDER_SNAP = 0.05;

function readPersisted(deviceId: string): number {
  if (typeof window === 'undefined') return 1;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY(deviceId));
    if (!v) return 1;
    const n = Number(v);
    if (!Number.isFinite(n) || n < MIN_WHEEL || n > MAX_WHEEL) return 1;
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
  /** Compute the auto-fit scale (caller knows preview area + panel dims). */
  computeAutoFit?: () => number;
}

export interface CanvasScaleApi {
  scale: number;
  setScale: (n: number) => void;
  setAutoFit: () => void;
  reset: () => void;
  /** Attach Cmd+wheel handler to a panel preview area (call inside ref or useEffect). */
  bindWheelTo: (el: HTMLElement | null) => void;
}

export function useCanvasScale(opts: CanvasScaleControlProps): CanvasScaleApi {
  const { deviceId, onScaleChange, computeAutoFit } = opts;
  const [scale, setScaleState] = useState<number>(() => readPersisted(deviceId));

  const setScale = useCallback((n: number) => {
    const clamped = Math.max(MIN_WHEEL, Math.min(MAX_WHEEL, n));
    setScaleState(clamped);
    writePersisted(deviceId, clamped);
    onScaleChange?.(clamped);
  }, [deviceId, onScaleChange]);

  const setAutoFit = useCallback(() => {
    const fit = computeAutoFit?.() ?? 1;
    setScale(fit);
  }, [computeAutoFit, setScale]);

  const reset = useCallback(() => setScale(1), [setScale]);

  // Reload persisted scale when deviceId changes (each device has its own).
  useEffect(() => {
    setScaleState(readPersisted(deviceId));
  }, [deviceId]);

  // Cmd+0 / Cmd+= / Cmd+- keyboard shortcuts (window-level).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '0') { e.preventDefault(); reset(); }
      else if (e.key === '=' || e.key === '+') { e.preventDefault(); setScale(scale + STEP); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); setScale(scale - STEP); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scale, setScale, reset]);

  // Bind Cmd+wheel to a specific element (preventDefault inside that area
  // only — browser zoom still works elsewhere).
  const bindWheelTo = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      // deltaY negative = scroll up = zoom in
      const delta = -Math.sign(e.deltaY) * STEP;
      setScale(scale + delta);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scale, setScale]);

  return { scale, setScale, setAutoFit, reset, bindWheelTo };
}

interface ToolbarProps {
  api: CanvasScaleApi;
}

export default function CanvasScaleControlToolbar({ api }: ToolbarProps) {
  const { scale, setScale, setAutoFit, reset } = api;
  const percent = Math.round(scale * 100);

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/15 bg-white/[0.03]"
      data-testid="canvas-scale-toolbar"
    >
      <button
        type="button"
        onClick={() => setScale(scale - STEP)}
        disabled={scale <= MIN_WHEEL + 0.01}
        title="Zoom out (Cmd+-)"
        data-testid="scale-minus"
        className="w-5 h-5 flex items-center justify-center rounded text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <input
        type="range"
        min={MIN_SLIDER}
        max={MAX_SLIDER}
        step={SLIDER_SNAP}
        value={Math.max(MIN_SLIDER, Math.min(MAX_SLIDER, scale))}
        onChange={(e) => setScale(Number(e.target.value))}
        data-testid="scale-slider"
        className="w-24 h-1 accent-cyan-500 cursor-pointer"
        aria-label="Canvas scale"
      />
      <button
        type="button"
        onClick={() => setScale(scale + STEP)}
        disabled={scale >= MAX_WHEEL - 0.01}
        title="Zoom in (Cmd+=)"
        data-testid="scale-plus"
        className="w-5 h-5 flex items-center justify-center rounded text-white/70 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
      <button
        type="button"
        onClick={reset}
        title="Reset to 100% (Cmd+0)"
        data-testid="scale-percent"
        className="w-10 text-center text-[10px] text-white/70 hover:text-white tabular-nums cursor-pointer"
      >
        {percent}%
      </button>
      <div className="w-px h-3 bg-white/15" />
      <button
        type="button"
        onClick={setAutoFit}
        title="Auto-fit panel into viewport"
        data-testid="scale-autofit"
        className="text-[10px] px-1.5 py-0.5 rounded text-white/70 hover:bg-white/10 transition-colors"
      >
        ⇆ Fit
      </button>
    </div>
  );
}
