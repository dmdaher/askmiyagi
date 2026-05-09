'use client';

import { useCallback, useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import Keyboard from '@/components/controls/Keyboard';
import {
  computeKeyboardLayout,
  computeAutoFitTarget,
} from '@/lib/keyboard-layout';

/**
 * Draggable/resizable keyboard section in the editor.
 *
 * K1.5 (2026-05-08): keyboard height is now DERIVED from width × KEY_ASPECT
 * (6.6:1 piano standard). This means:
 *   - The contractor adjusts widthPercent (left/right resize) → height
 *     auto-follows
 *   - The contractor cannot adjust panelHeightPercent directly anymore;
 *     it's recomputed from canvas dims + widthPercent
 *   - When canvas is too short, keyboard clamps to 65% of canvas and a
 *     warning banner appears with an Auto-fit Canvas button
 *
 * Vertical drag is disabled (Y is always canvasHeight - keyboardHeight).
 * Top/bottom resize handles are disabled (height is computed).
 */
export default function KeyboardSection() {
  const keyboard = useEditorStore((s) => s.keyboard);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);

  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Compute layout BEFORE any early returns (Rules of Hooks).
  const layout = keyboard
    ? computeKeyboardLayout({
        canvasWidth,
        canvasHeight,
        widthPercent: keyboard.widthPercent ?? 100,
        keys: keyboard.keys,
        startNote: keyboard.startNote,
      })
    : null;

  // Cache the computed panelHeightPercent back onto the manifest so production
  // PanelShell renders match the editor view. Skip if the change is below
  // tolerance to avoid render-loop noise.
  useEffect(() => {
    if (!keyboard || !layout) return;
    const stored = keyboard.panelHeightPercent;
    const computed = layout.panelHeightPercent;
    if (Math.abs(stored - computed) < 0.1) return;
    useEditorStore.setState({
      keyboard: { ...keyboard, panelHeightPercent: Math.round(computed * 10) / 10 },
    });
  }, [keyboard, layout]);

  // When user adjusts canvas/widthPercent and the keyboard goes back to
  // aspect-locked, clear the dismissal so the banner can re-fire on next
  // overflow.
  useEffect(() => {
    if (layout?.isAspectLocked) setBannerDismissed(false);
  }, [layout?.isAspectLocked]);

  const handleHorizontalDrag = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      if (!keyboard) return;
      const newLeftPct = Math.max(0, Math.min(50, (d.x / canvasWidth) * 100));
      pushSnapshot();
      useEditorStore.setState({
        keyboard: {
          ...keyboard,
          leftPercent: Math.round(newLeftPct * 10) / 10,
        },
        hasUserEdited: true,
      });
    },
    [keyboard, canvasWidth, pushSnapshot],
  );

  const handleHorizontalResize = useCallback(
    (
      _e: unknown,
      _dir: unknown,
      ref: HTMLElement,
      _delta: unknown,
      position: { x: number; y: number },
    ) => {
      if (!keyboard) return;
      const newW = parseInt(ref.style.width, 10);
      const newLeftPct = Math.max(0, (position.x / canvasWidth) * 100);
      const newWidthPct = Math.max(50, Math.min(100, (newW / canvasWidth) * 100));

      pushSnapshot();
      useEditorStore.setState({
        keyboard: {
          ...keyboard,
          leftPercent: Math.round(newLeftPct * 10) / 10,
          widthPercent: Math.round(newWidthPct * 10) / 10,
        },
        hasUserEdited: true,
      });
    },
    [keyboard, canvasWidth, pushSnapshot],
  );

  const handleAutoFit = useCallback(() => {
    if (!layout) return;
    const target = computeAutoFitTarget({
      canvasWidth,
      canvasHeight,
      desiredHeight: layout.desiredHeight,
      controlsAreaHeight: layout.controlsAreaHeight,
    });
    pushSnapshot();
    setCanvasSize(target.newCanvasWidth, target.newCanvasHeight);
  }, [layout, canvasWidth, canvasHeight, setCanvasSize, pushSnapshot]);

  if (!keyboard || !layout) return null;

  // Pixel positions
  const x = ((keyboard.leftPercent ?? 0) / 100) * canvasWidth;
  const w = layout.keyboardWidth;
  const h = layout.keyboardHeight;
  const y = canvasHeight - h; // bottom-anchored

  const showBanner = !layout.isAspectLocked && !bannerDismissed;
  const target = showBanner
    ? computeAutoFitTarget({
        canvasWidth,
        canvasHeight,
        desiredHeight: layout.desiredHeight,
        controlsAreaHeight: layout.controlsAreaHeight,
      })
    : null;

  return (
    <>
      <Rnd
        position={{ x, y }}
        size={{ width: w, height: h }}
        scale={zoom}
        dragGrid={[snapGrid, snapGrid]}
        dragAxis="x"  // K1.5: vertical drag disabled — Y is computed
        enableResizing={{
          left: true,
          right: true,
          top: false,    // K1.5: height is computed, top resize meaningless
          bottom: false, // K1.5: bottom always anchored to canvas
          topLeft: false,
          topRight: false,
          bottomLeft: false,
          bottomRight: false,
        }}
        resizeHandleStyles={{
          left: {
            width: 8,
            left: -4,
            top: 0,
            height: '100%',
            cursor: 'ew-resize',
            background: 'transparent',
          },
          right: {
            width: 8,
            right: -4,
            top: 0,
            height: '100%',
            cursor: 'ew-resize',
            background: 'transparent',
          },
        }}
        onDragStop={handleHorizontalDrag}
        onResizeStop={handleHorizontalResize}
        style={{ zIndex: 50 }}
      >
        {/* Boundary line */}
        <div
          className="absolute -top-px left-0 right-0 h-px"
          style={{
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 8px, transparent 8px, transparent 16px)',
          }}
        />

        {/* Keyboard label */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="text-[8px] uppercase tracking-widest text-gray-500 bg-[#111122] px-2">
            Keyboard
          </span>
        </div>

        {/* Resize handles visual indicators */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded bg-gray-600 opacity-0 hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded bg-gray-600 opacity-0 hover:opacity-100 transition-opacity" />

        {/* Keyboard component */}
        <div className="w-full h-full overflow-hidden">
          <Keyboard keys={keyboard.keys} startNote={keyboard.startNote} />
        </div>
      </Rnd>

      {/* Aspect-lock warning banner — only when keyboard is clamped.
          z-index 9999 keeps it above all controls (which render up to ~250). */}
      {showBanner && target && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: x + w / 2,
            top: y - 12,
            transform: 'translate(-50%, -100%)',
            minWidth: 360,
            maxWidth: 440,
            zIndex: 9999,
          }}
          data-testid="keyboard-aspect-banner"
        >
          <div className="rounded-lg border border-amber-700/60 bg-amber-950/95 backdrop-blur px-4 py-3 shadow-2xl text-[11px] text-amber-100">
            <div className="font-medium mb-2">
              ⚠ Keyboard cropped — keys are stubby
            </div>
            <div className="text-amber-200/80 space-y-0.5 mb-2.5 font-mono">
              <div>
                Canvas now:    <span className="text-amber-100">{canvasWidth} × {canvasHeight}</span>
              </div>
              <div>
                Auto-fit will: <span className="text-amber-100">{target.newCanvasWidth} × {target.newCanvasHeight}</span>
                {' '}<span className="text-amber-300/60">(keyboard {Math.round(layout.desiredHeight)} + controls {Math.round(Math.max(layout.controlsAreaHeight, 30))})</span>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-[10px] px-2 py-1 text-amber-200/60 hover:text-amber-100 transition-colors"
                data-testid="keyboard-aspect-banner-dismiss"
              >
                Dismiss
              </button>
              <button
                onClick={handleAutoFit}
                className="text-[10px] rounded bg-amber-600 hover:bg-amber-500 px-3 py-1 font-medium text-white transition-colors"
                data-testid="keyboard-aspect-banner-autofit"
              >
                Auto-fit Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
