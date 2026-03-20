'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '../store';

interface ZoomPanHandlers {
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
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

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const { zoom, panX, panY, setZoom, setPan } = useEditorStore.getState();

    // Zoom factor: scroll up = zoom in, scroll down = zoom out
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = 0.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom + direction * factor));

    if (newZoom === zoom) return;

    // Get cursor position relative to the container
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Adjust pan so the point under cursor stays fixed.
    // Screen point = worldPoint * zoom + pan
    // worldPoint = (screenPoint - pan) / zoom
    // After zoom change: newPan = screenPoint - worldPoint * newZoom
    const worldX = (cursorX - panX) / zoom;
    const worldY = (cursorY - panY) / zoom;

    const newPanX = cursorX - worldX * newZoom;
    const newPanY = cursorY - worldY * newZoom;

    setZoom(newZoom);
    setPan(newPanX, newPanY);
  }, []);

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

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}
