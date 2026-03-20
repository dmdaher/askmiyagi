'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from './store';

interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Rubber-band selection rectangle rendered on the canvas background.
 * Listens for pointerdown on the transparent overlay, draws a selection
 * rectangle on pointermove, and on pointerup computes which control
 * bounding boxes intersect the selection rect.
 */
export default function DragSelectRect() {
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const [rect, setRect] = useState<Rect | null>(null);
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only start on left-click directly on this overlay (not on controls)
      if (e.button !== 0) return;
      // The overlay is pointer-events:none normally; we only capture events
      // when the PanCanvas click handler fires on the background.
      // But since this div sits as a sibling, we handle it here.

      const target = e.target as HTMLElement;
      // Only start if the target is this overlay div itself
      if (target !== e.currentTarget) return;

      e.stopPropagation();
      dragging.current = true;

      // Compute canvas-local coordinates from the client position.
      // The parent div has transform: translate(panX, panY) scale(zoom),
      // so we need to account for that.
      const parentRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;

      origin.current = { x, y };
      setRect({ x1: x, y1: y, x2: x, y2: y });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;

      const parentRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;

      setRect({ x1: origin.current.x, y1: origin.current.y, x2: x, y2: y });
    },
    [],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      dragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);

      const parentRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;

      // Compute the final selection rectangle in canvas-local px
      // The overlay div is the size of the canvas (the transform is on the parent).
      // Since the overlay is a direct child of the transformed container,
      // the parentRect already accounts for zoom. We need canvas coords.
      const { canvasWidth: cw, canvasHeight: ch } = useEditorStore.getState();
      const scaleX = cw / parentRect.width;
      const scaleY = ch / parentRect.height;

      const sx1 = Math.min(origin.current.x, x) * scaleX;
      const sy1 = Math.min(origin.current.y, y) * scaleY;
      const sx2 = Math.max(origin.current.x, x) * scaleX;
      const sy2 = Math.max(origin.current.y, y) * scaleY;

      // Find all controls whose bounding box intersects the selection rect
      const { controls, setSelectedIds } = useEditorStore.getState();
      const hitIds: string[] = [];

      for (const ctrl of Object.values(controls)) {
        const cx1 = ctrl.x;
        const cy1 = ctrl.y;
        const cx2 = ctrl.x + ctrl.w;
        const cy2 = ctrl.y + ctrl.h;

        // AABB intersection test
        if (cx1 < sx2 && cx2 > sx1 && cy1 < sy2 && cy2 > sy1) {
          hitIds.push(ctrl.id);
        }
      }

      setSelectedIds(hitIds);
      setRect(null);
    },
    [],
  );

  // Compute visual rect for rendering
  const visualRect = rect
    ? {
        left: Math.min(rect.x1, rect.x2),
        top: Math.min(rect.y1, rect.y2),
        width: Math.abs(rect.x2 - rect.x1),
        height: Math.abs(rect.y2 - rect.y1),
      }
    : null;

  return (
    <div
      className="absolute inset-0"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        zIndex: 0,
        cursor: 'crosshair',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {visualRect && visualRect.width > 2 && visualRect.height > 2 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: visualRect.left,
            top: visualRect.top,
            width: visualRect.width,
            height: visualRect.height,
            border: '1px solid rgba(59, 130, 246, 0.7)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );
}
