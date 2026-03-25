'use client';

import { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import Keyboard from '@/components/controls/Keyboard';

/**
 * Draggable/resizable keyboard section in the editor.
 * The contractor can:
 * - Drag the keyboard freely (both axes) to position it
 * - Resize horizontally (widen/narrow)
 * - The keyboard's position updates panelHeightPercent (vertical) and leftPercent (horizontal)
 */
export default function KeyboardSection() {
  const keyboard = useEditorStore((s) => s.keyboard);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);

  if (!keyboard) return null;

  // Convert percentage positions to pixels
  const x = ((keyboard.leftPercent ?? 0) / 100) * canvasWidth;
  const y = (keyboard.panelHeightPercent / 100) * canvasHeight;
  const w = ((keyboard.widthPercent ?? 100) / 100) * canvasWidth;
  const h = canvasHeight - y; // keyboard fills from y to bottom

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      const newLeftPct = Math.max(0, Math.min(50, (d.x / canvasWidth) * 100));
      const newPanelPct = Math.max(20, Math.min(90, (d.y / canvasHeight) * 100));

      useEditorStore.setState({
        keyboard: {
          ...keyboard!,
          leftPercent: Math.round(newLeftPct * 10) / 10,
          panelHeightPercent: Math.round(newPanelPct * 10) / 10,
        },
        hasUserEdited: true,
      });
    },
    [keyboard, canvasWidth, canvasHeight],
  );

  const handleResizeStop = useCallback(
    (
      _e: unknown,
      _dir: unknown,
      ref: HTMLElement,
      _delta: unknown,
      position: { x: number; y: number },
    ) => {
      const newW = parseInt(ref.style.width, 10);
      const newLeftPct = Math.max(0, (position.x / canvasWidth) * 100);
      const newWidthPct = Math.max(50, Math.min(100, (newW / canvasWidth) * 100));

      useEditorStore.setState({
        keyboard: {
          ...keyboard!,
          leftPercent: Math.round(newLeftPct * 10) / 10,
          widthPercent: Math.round(newWidthPct * 10) / 10,
        },
        hasUserEdited: true,
      });
    },
    [keyboard, canvasWidth],
  );

  return (
    <Rnd
      position={{ x, y }}
      size={{ width: w, height: h }}
      scale={zoom}
      dragGrid={[snapGrid, snapGrid]}
      enableResizing={{
        left: true,
        right: true,
        top: false,
        bottom: false,
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
  );
}
