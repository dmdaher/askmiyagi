'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import Keyboard from '@/components/controls/Keyboard';
import { computeKeyboardLayout, KEY_ASPECT } from '@/lib/keyboard-layout';

/**
 * Draggable/resizable keyboard section in the editor.
 *
 * The contractor has full freedom: drag horizontally and vertically, resize
 * top/bottom/left/right. Stored fields (`panelHeightPercent`, `leftPercent`,
 * `widthPercent`) are user-controlled — no auto-derivation.
 *
 * Two informational nudges (no auto-correction):
 *   1. Tiny aspect chip next to the "Keyboard" label — turns amber when
 *      actual aspect drifts > BUFFER from 6.6:1.
 *   2. Bigger explanatory banner when aspect is way off (> WARN_THRESHOLD).
 *      Tells the contractor WHY keys look stubby/long and how to fix it.
 *      Dismissable; never blocks; never auto-resizes anything.
 *
 * History note: K1.5/K1.6 (2026-05-08) tried to auto-lock aspect with an
 * Auto-fit Canvas button. It pushed the keyboard down too far and overlapped
 * controls. Reverted to free-form on the same day; aspect math survives only
 * as gentle indicators.
 */

// Asymmetric thresholds — long keys warn much sooner than stubby keys,
// since tall stretchy keys look obviously wrong on a real instrument.
const ASPECT_CHIP_BUFFER_STUBBY = 0.7;     // chip amber when aspect ≤ 5.9
const ASPECT_CHIP_BUFFER_LONG = 0.2;       // chip amber when aspect ≥ 6.8
const ASPECT_WARN_THRESHOLD_STUBBY = 1.3;  // banner when aspect ≤ 5.3
const ASPECT_WARN_THRESHOLD_LONG = 0.4;    // banner when aspect ≥ 7.0
// Spatial overlap: warn when keyboard top covers a control by more than this.
const OVERLAP_WARN_PX = 4;
// Spatial gap: warn when there's a big empty band between controls and keyboard.
const LARGE_GAP_PX = 100;

export default function KeyboardSection() {
  const keyboard = useEditorStore((s) => s.keyboard);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);
  const controls = useEditorStore((s) => s.controls);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerCollapsed, setBannerCollapsed] = useState(false);
  // User-applied offset from the banner's default top-of-keyboard position.
  // In CANVAS coordinates (zoom-invariant) so drag feels right at any zoom.
  const [bannerOffset, setBannerOffset] = useState({ x: 0, y: 0 });
  const bannerDragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      if (!keyboard) return;
      const newLeftPct = Math.max(0, Math.min(50, (d.x / canvasWidth) * 100));
      const newPanelPct = Math.max(20, Math.min(90, (d.y / canvasHeight) * 100));
      pushSnapshot();
      useEditorStore.setState({
        keyboard: {
          ...keyboard,
          leftPercent: Math.round(newLeftPct * 10) / 10,
          panelHeightPercent: Math.round(newPanelPct * 10) / 10,
        },
        hasUserEdited: true,
      });
    },
    [keyboard, canvasWidth, canvasHeight, pushSnapshot],
  );

  const handleResizeStop = useCallback(
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
      const newPanelPct = Math.max(20, Math.min(90, (position.y / canvasHeight) * 100));
      pushSnapshot();
      useEditorStore.setState({
        keyboard: {
          ...keyboard,
          leftPercent: Math.round(newLeftPct * 10) / 10,
          widthPercent: Math.round(newWidthPct * 10) / 10,
          panelHeightPercent: Math.round(newPanelPct * 10) / 10,
        },
        hasUserEdited: true,
      });
    },
    [keyboard, canvasWidth, canvasHeight, pushSnapshot],
  );

  // Pixel geometry (manual model — match original pre-K1.5 behavior).
  // Computed BEFORE any early return so hooks below run consistently.
  const safeKeyboard = keyboard;
  const x = safeKeyboard ? ((safeKeyboard.leftPercent ?? 0) / 100) * canvasWidth : 0;
  const y = safeKeyboard ? (safeKeyboard.panelHeightPercent / 100) * canvasHeight : 0;
  const w = safeKeyboard ? ((safeKeyboard.widthPercent ?? 100) / 100) * canvasWidth : 0;
  const h = safeKeyboard ? canvasHeight - y : 0;

  // Aspect indicator — for the inline chip and (when far off) the banner.
  const layout = safeKeyboard
    ? computeKeyboardLayout({
        canvasWidth,
        canvasHeight,
        widthPercent: safeKeyboard.widthPercent ?? 100,
        keys: safeKeyboard.keys,
        startNote: safeKeyboard.startNote,
      })
    : null;
  const whiteKeyWidth = layout && layout.totalWhiteKeys > 0 ? w / layout.totalWhiteKeys : 0;
  const actualAspect = whiteKeyWidth > 0 ? h / whiteKeyWidth : 0;
  const aspectDelta = actualAspect > 0 ? Math.abs(actualAspect - KEY_ASPECT) : 0;
  const isStubby = actualAspect > 0 && actualAspect < KEY_ASPECT;
  const isLong = actualAspect > KEY_ASPECT;
  const chipBuffer = isLong ? ASPECT_CHIP_BUFFER_LONG : ASPECT_CHIP_BUFFER_STUBBY;
  const warnThreshold = isLong ? ASPECT_WARN_THRESHOLD_LONG : ASPECT_WARN_THRESHOLD_STUBBY;
  const aspectIsOff = aspectDelta > chipBuffer;
  const aspectIsBad = aspectDelta > warnThreshold;

  // Spatial relationship between keyboard rectangle and control rectangles.
  // True overlap = both X and Y axes have non-trivial intersection.
  //
  // Keyboard rect:   [keyboardLeft, keyboardRight] × [keyboardTop, keyboardBottom]
  // Control rect:    [cLeft, cRight] × [cTop, cBottom]
  //
  // Earlier checks were missing the lower-Y bound: a control ENTIRELY BELOW
  // the keyboard (y > canvasHeight) matched `cBottom > keyboardTop` and got
  // false-flagged as overlap. The fix: also require `cTop < keyboardBottom`.
  const overlappingControls: { id: string; label: string; overlapPx: number }[] = [];
  let lowestControlBottom = 0;
  const keyboardLeft = x;
  const keyboardRight = x + w;
  const keyboardTop = y;
  const keyboardBottom = y + h; // keyboard fills from y to canvas bottom
  for (const id in controls) {
    const c = controls[id];
    if (!c) continue;
    const cTop = c.y ?? 0;
    const cBottom = cTop + (c.h ?? 0);
    if (cBottom > lowestControlBottom) lowestControlBottom = cBottom;
    // Y-axis overlap: rectangles intersect when control's bottom crosses
    // INTO the keyboard AND control's top is above the keyboard's bottom.
    // OVERLAP_WARN_PX gives a small tolerance on each edge.
    const yOverlapsKeyboard =
      cBottom > keyboardTop + OVERLAP_WARN_PX &&
      cTop < keyboardBottom - OVERLAP_WARN_PX;
    if (!yOverlapsKeyboard) continue;
    // X-axis overlap: control's box and keyboard's box intersect horizontally
    const cLeft = c.x ?? 0;
    const cRight = cLeft + (c.w ?? 0);
    const xOverlaps = cRight > keyboardLeft && cLeft < keyboardRight;
    if (!xOverlaps) continue;
    // Report depth as how far the control crosses INTO the keyboard from
    // either edge — clamped to keyboard height for sanity.
    const overlapPx = Math.min(cBottom, keyboardBottom) - Math.max(cTop, keyboardTop);
    overlappingControls.push({ id, label: c.label || id, overlapPx });
  }
  // Sort by overlap depth (worst offenders first)
  overlappingControls.sort((a, b) => b.overlapPx - a.overlapPx);
  const overlapCount = overlappingControls.length;
  const gapAboveKeyboard = lowestControlBottom > 0 ? y - lowestControlBottom : 0;
  const hasOverlap = overlapCount > 0;
  const hasLargeGap = !hasOverlap && gapAboveKeyboard > LARGE_GAP_PX;

  const handleFindControl = useCallback((e: React.MouseEvent, controlId: string) => {
    // Stop event from bubbling to canvas (which has a "click empty space →
    // clear selection" handler that would immediately deselect us).
    e.stopPropagation();
    useEditorStore.getState().setSelectedIds([controlId]);
    // Match the scroll-to-find pattern in LayersPanel (A6.1).
    if (typeof document !== 'undefined') {
      const el = document.querySelector(`[data-control-id="${controlId}"]`);
      if (el && 'scrollIntoView' in el) {
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
    }
  }, []);

  const handleBannerDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const currentZoom = useEditorStore.getState().zoom;
      // Snapshot the banner's "natural" anchor (top-of-keyboard center).
      // Drag offsets are relative to this. Capture canvas dims for clamping.
      const naturalLeft = x + w / 2;
      const naturalTop = y - 12;
      const cw = canvasWidth;
      const ch = canvasHeight;
      // Approximate banner size for clamp boundaries — exact px don't matter
      // because we clamp loosely, just enough to keep banner on-canvas.
      const bannerWidthPx = bannerCollapsed ? 280 : 520;
      const bannerHeightPx = bannerCollapsed ? 40 : 260;
      bannerDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        offsetX: bannerOffset.x,
        offsetY: bannerOffset.y,
      };
      const handleMove = (ev: MouseEvent) => {
        if (!bannerDragRef.current) return;
        const dxScreen = ev.clientX - bannerDragRef.current.startX;
        const dyScreen = ev.clientY - bannerDragRef.current.startY;
        // Canvas coords = screen coords / zoom
        let nextX = bannerDragRef.current.offsetX + dxScreen / currentZoom;
        let nextY = bannerDragRef.current.offsetY + dyScreen / currentZoom;
        // Clamp so banner's bounding box stays within canvas. Banner is
        // positioned with translate(-50%, -100%) — so its rect is:
        //   left  = (naturalLeft + offsetX) - bannerWidthPx/2
        //   right = (naturalLeft + offsetX) + bannerWidthPx/2
        //   top   = (naturalTop  + offsetY) - bannerHeightPx
        //   bottom= (naturalTop  + offsetY)
        const minOffsetX = bannerWidthPx / 2 - naturalLeft;
        const maxOffsetX = cw - bannerWidthPx / 2 - naturalLeft;
        const minOffsetY = bannerHeightPx - naturalTop;
        const maxOffsetY = ch - naturalTop;
        nextX = Math.max(minOffsetX, Math.min(maxOffsetX, nextX));
        nextY = Math.max(minOffsetY, Math.min(maxOffsetY, nextY));
        setBannerOffset({ x: nextX, y: nextY });
      };
      const handleUp = () => {
        bannerDragRef.current = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [bannerOffset.x, bannerOffset.y, bannerCollapsed, x, y, w, canvasWidth, canvasHeight],
  );

  // Reset dismissal when nothing is wrong anymore.
  const anyIssue = aspectIsBad || hasOverlap || hasLargeGap;
  useEffect(() => {
    if (!anyIssue) setBannerDismissed(false);
  }, [anyIssue]);

  if (!keyboard) return null;

  const showBanner = anyIssue && !bannerDismissed;

  return (
    <>
      <Rnd
        position={{ x, y }}
        size={{ width: w, height: h }}
        scale={zoom}
        dragGrid={[snapGrid, snapGrid]}
        enableResizing={{
          left: true,
          right: true,
          top: true,
          bottom: true,
          topLeft: false,
          topRight: false,
          bottomLeft: false,
          bottomRight: false,
        }}
        resizeHandleStyles={{
          left: { width: 8, left: -4, top: 0, height: '100%', cursor: 'ew-resize', background: 'transparent' },
          right: { width: 8, right: -4, top: 0, height: '100%', cursor: 'ew-resize', background: 'transparent' },
          top: { height: 8, top: -4, left: 0, width: '100%', cursor: 'ns-resize', background: 'transparent' },
          bottom: { height: 8, bottom: -4, left: 0, width: '100%', cursor: 'ns-resize', background: 'transparent' },
        }}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
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
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none bg-[#111122] px-2 z-[55]">
          <span className="text-[8px] uppercase tracking-widest text-gray-500">
            Keyboard
          </span>
        </div>

        {/* Aspect-ratio chip — center of keyboard, sized to be readable.
            Updates live as the contractor drags edges. Amber when off-target,
            grey when close to the 6.6:1 real-synth standard.
            CLICKABLE when the warning banner has been dismissed but issues
            remain — clicking re-opens the banner. */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[56] ${
            anyIssue && bannerDismissed ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          data-testid="keyboard-aspect-indicator"
        >
          <button
            type="button"
            onClick={(e) => {
              if (!anyIssue || !bannerDismissed) return;
              e.stopPropagation();
              setBannerDismissed(false);
            }}
            disabled={!anyIssue || !bannerDismissed}
            className={`rounded-full border px-3 py-1 font-mono text-[12px] backdrop-blur-sm shadow-lg transition-colors ${
              aspectIsOff
                ? 'bg-amber-950/80 border-amber-600/70 text-amber-200'
                : 'bg-black/40 border-white/15 text-gray-300'
            } ${anyIssue && bannerDismissed ? 'cursor-pointer hover:brightness-125 ring-1 ring-amber-500/40' : 'cursor-default'}`}
            title={
              anyIssue && bannerDismissed
                ? `Click to re-open keyboard layout warning`
                : aspectIsOff
                  ? `Keys are ${isStubby ? 'stubby' : 'long'} — real synth keys are ~${KEY_ASPECT}:1.`
                  : `Close to real synth keys (${KEY_ASPECT}:1)`
            }
          >
            {actualAspect > 0 ? (
              <>
                <span className="opacity-70 mr-1">aspect</span>
                <span className="font-semibold">{actualAspect.toFixed(1)}:1</span>
                <span className="opacity-50 mx-1.5">/</span>
                <span className="opacity-80">{KEY_ASPECT}:1 target</span>
                {aspectIsOff && <span className="ml-1.5">⚠</span>}
                {anyIssue && bannerDismissed && <span className="ml-1.5 text-amber-300/80">(click to expand)</span>}
              </>
            ) : (
              <span className="opacity-70">no aspect data</span>
            )}
          </button>
        </div>

        {/* Resize handle visual indicators (subtle, fade in on hover) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded bg-gray-600 opacity-0 hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded bg-gray-600 opacity-0 hover:opacity-100 transition-opacity" />

        {/* Keyboard component */}
        <div className="w-full h-full overflow-hidden">
          <Keyboard keys={keyboard.keys} startNote={keyboard.startNote} />
        </div>
      </Rnd>

      {/* Educational warning banner — fires for ANY of:
          - aspect significantly off (keys stubby/long, buffer 1.8)
          - keyboard overlaps existing controls (>4px overlap)
          - large empty band between controls and keyboard (>100px)
          Banner is draggable (header acts as drag handle) and collapsible. */}
      {showBanner && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: x + w / 2 + bannerOffset.x,
            top: y - 12 + bannerOffset.y,
            transform: 'translate(-50%, -100%)',
            minWidth: bannerCollapsed ? 220 : 400,
            maxWidth: bannerCollapsed ? 280 : 520,
            zIndex: 9999,
          }}
          data-testid="keyboard-aspect-banner"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="rounded-lg border border-amber-700/60 bg-amber-950/95 backdrop-blur shadow-2xl text-[11px] text-amber-100 overflow-hidden">
            {/* Draggable header bar */}
            <div
              className="flex items-center justify-between gap-2 px-4 py-2 cursor-move select-none border-b border-amber-700/40 bg-amber-900/40"
              onMouseDown={handleBannerDragStart}
              data-testid="keyboard-aspect-banner-drag"
            >
              <div className="font-medium flex items-center gap-2">
                <span className="text-amber-300/60 text-[10px]">⋮⋮</span>
                <span>
                  💡 {[aspectIsBad, hasOverlap, hasLargeGap].filter(Boolean).length} keyboard issue{[aspectIsBad, hasOverlap, hasLargeGap].filter(Boolean).length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setBannerCollapsed((v) => !v); }}
                  className="text-[10px] px-1.5 py-0.5 rounded hover:bg-amber-700/40 text-amber-200/70 hover:text-amber-100 transition-colors"
                  title={bannerCollapsed ? 'Expand' : 'Collapse'}
                  data-testid="keyboard-aspect-banner-collapse"
                >
                  {bannerCollapsed ? '▼' : '▲'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setBannerDismissed(true); }}
                  className="text-[10px] px-1.5 py-0.5 rounded hover:bg-amber-700/40 text-amber-200/70 hover:text-amber-100 transition-colors"
                  title="Dismiss"
                  data-testid="keyboard-aspect-banner-dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Collapsible body */}
            {!bannerCollapsed && (
              <div className="px-4 py-3">
            <ul className="text-amber-200/85 mb-2.5 leading-snug space-y-1.5 list-disc pl-4">
              {aspectIsBad && (
                <li>
                  <span className="text-amber-100 font-medium">Keys look {isStubby ? 'stubby' : 'long'}</span> ({actualAspect.toFixed(1)}:1, target {KEY_ASPECT}:1).
                  {' '}
                  {isStubby
                    ? 'Drag the top edge up or shrink widthPercent.'
                    : 'Drag the top edge down or widen the keyboard.'}
                </li>
              )}
              {hasOverlap && (
                <li>
                  <span className="text-amber-100 font-medium">Keyboard overlaps {overlapCount} control{overlapCount === 1 ? '' : 's'}</span> — drag the top edge DOWN, or click a control below to jump to it on the canvas:
                  <div
                    className="mt-1.5 ml-1 max-h-40 overflow-y-auto space-y-0.5 rounded border border-amber-700/40 bg-amber-950/60 px-1.5 py-1"
                    data-testid="keyboard-overlap-list"
                  >
                    {overlappingControls.slice(0, 12).map((c) => (
                      <button
                        key={c.id}
                        onClick={(e) => handleFindControl(e, c.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="block w-full text-left text-[10px] font-mono text-amber-100 hover:bg-amber-700/40 rounded px-1.5 py-0.5 transition-colors"
                        title={`Select ${c.id} and scroll canvas to it (overlap ${Math.round(c.overlapPx)}px)`}
                        data-testid={`keyboard-overlap-find-${c.id}`}
                      >
                        <span className="text-amber-300/70 mr-1.5">→</span>
                        <span className="font-semibold">{c.label}</span>
                        {c.label !== c.id && (
                          <span className="text-amber-200/50 ml-1">({c.id})</span>
                        )}
                        <span className="text-amber-300/60 float-right">{Math.round(c.overlapPx)}px</span>
                      </button>
                    ))}
                    {overlappingControls.length > 12 && (
                      <div className="text-[9px] text-amber-300/60 italic px-1.5 py-0.5">
                        +{overlappingControls.length - 12} more (scroll to see)
                      </div>
                    )}
                  </div>
                </li>
              )}
              {hasLargeGap && (
                <li>
                  <span className="text-amber-100 font-medium">Big empty space</span> ({Math.round(gapAboveKeyboard)}px) between controls and keyboard — drag the top edge UP, or shrink the canvas height.
                </li>
              )}
            </ul>
                {/* Bottom drag handle — mirrors the header so contractor
                    can grab the bottom edge to move the banner. */}
                <div
                  className="-mx-4 -mb-3 mt-1 flex items-center justify-center gap-1.5 px-4 py-1.5 cursor-move select-none border-t border-amber-700/30 bg-amber-900/30 hover:bg-amber-900/50 transition-colors"
                  onMouseDown={handleBannerDragStart}
                  data-testid="keyboard-aspect-banner-drag-bottom"
                  title="Drag to move banner"
                >
                  <span className="text-amber-300/50 text-[9px]">⋮⋮ drag ⋮⋮</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
