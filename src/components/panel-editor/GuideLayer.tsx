'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditorStore } from './store';

/**
 * Renders draggable guide lines on the editor canvas.
 * Guides are persistent red reference lines for alignment checking.
 */
export default function GuideLayer() {
  const guides = useEditorStore((s) => s.guides);
  const moveGuide = useEditorStore((s) => s.moveGuide);
  const deleteGuide = useEditorStore((s) => s.deleteGuide);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const showRulers = useEditorStore((s) => s.showRulers);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ startPos: number; orientation: 'horizontal' | 'vertical' } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, guideId: string, orientation: 'horizontal' | 'vertical') => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(guideId);
    dragStartRef.current = { startPos: orientation === 'horizontal' ? e.clientY : e.clientX, orientation };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStartRef.current) return;
      const pan = orientation === 'horizontal' ? panY : panX;
      const clientPos = orientation === 'horizontal' ? me.clientY : me.clientX;
      // Convert screen position to canvas position
      // Account for the ruler offset (20px) and the workspace container position
      const canvasPos = (clientPos - pan) / zoom;
      const snapped = Math.round(canvasPos / snapGrid) * snapGrid;
      moveGuide(guideId, snapped);
    };

    const handleMouseUp = (me: MouseEvent) => {
      setDraggingId(null);
      dragStartRef.current = null;
      // If dragged back to ruler area (within 20px of edge), delete the guide
      const threshold = 30;
      if (orientation === 'horizontal' && me.clientY < threshold) {
        deleteGuide(guideId);
      } else if (orientation === 'vertical' && me.clientX < threshold) {
        deleteGuide(guideId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [zoom, panX, panY, snapGrid, moveGuide, deleteGuide]);

  const handleContextMenu = useCallback((e: React.MouseEvent, guideId: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteGuide(guideId);
  }, [deleteGuide]);

  if (!showRulers || guides.length === 0) return null;

  return (
    <div className="absolute inset-0" style={{ zIndex: 180, pointerEvents: 'none' }}>
      {guides.map((guide) => {
        const isH = guide.orientation === 'horizontal';
        return (
          <div
            key={guide.id}
            className="absolute"
            style={{
              [isH ? 'top' : 'left']: guide.position,
              [isH ? 'left' : 'top']: 0,
              [isH ? 'width' : 'height']: '100%',
              [isH ? 'height' : 'width']: draggingId === guide.id ? 2 : 1,
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              pointerEvents: 'auto',
              cursor: isH ? 'ns-resize' : 'ew-resize',
            }}
            onMouseDown={(e) => handleMouseDown(e, guide.id, guide.orientation)}
            onContextMenu={(e) => handleContextMenu(e, guide.id)}
          >
            {/* Position label on hover/drag */}
            {draggingId === guide.id && (
              <div
                className="absolute bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[9px] text-gray-300 font-mono pointer-events-none whitespace-nowrap"
                style={isH
                  ? { top: 4, left: 8 }
                  : { left: 4, top: 8 }
                }
              >
                {isH ? 'Y' : 'X'}: {Math.round(guide.position)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
