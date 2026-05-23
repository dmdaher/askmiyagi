'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '../store';

interface ZoomPanHandlers {
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Manages zoom-toward-cursor and middle-button / empty-canvas pan.
 *
 * Zoom formula: on zoom change, adjust pan so the point under the cursor
 * stays fixed in screen space.
 *
 * Pan: activated on middle mouse button (button === 1) or when no control
 * is under the cursor (left button on empty canvas).
 */
export function useZoomPan(): ZoomPanHandlers {
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Middle mouse button always pans
      if (e.button === 1) {
        isPanning.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Left button on the canvas background starts panning
      // (target === currentTarget means no child element was clicked)
      if (e.button === 0 && e.target === e.currentTarget) {
        isPanning.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPanning.current) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      const { panX, panY, setPan } = useEditorStore.getState();
      setPan(panX + dx, panY + dy);
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isPanning.current) {
        isPanning.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    []
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
