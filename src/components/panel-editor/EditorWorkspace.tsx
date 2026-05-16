'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useZoomPan } from './hooks/useZoomPan';
import { useEditorStore } from './store';
import { selectedControlIds } from './store/selection-types';
import { isHosted } from '@/lib/env';
import PanCanvas from './PanCanvas';
import Ruler, { RULER_THICKNESS } from './Ruler';

interface EditorWorkspaceProps {
  deviceId: string;
  readOnly?: boolean;
}

export default function EditorWorkspace({ deviceId, readOnly }: EditorWorkspaceProps) {
  const { onPointerDown, onPointerMove, onPointerUp } = useZoomPan();
  const showPhoto = useEditorStore((s) => s.showPhoto);
  const photoMode = useEditorStore((s) => s.photoMode);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;
    async function fetchPhoto() {
      try {
        const useHostedApi = isHosted || deviceId.startsWith('sandbox-');
        const res = await fetch(`${useHostedApi ? '/api/hosted/panels' : '/api/pipeline'}/${deviceId}/photos`);
        if (!res.ok) return;
        const data = await res.json();
        const photos = data.photos ?? data;
        if (!cancelled && Array.isArray(photos) && photos.length > 0) {
          const topView = photos.find((p: { name: string }) =>
            p.name.toLowerCase().includes('top-view') || p.name.toLowerCase().includes('top_view')
          );
          const chosen = topView ?? photos[0];
          setPhotoUrl(
            useHostedApi
              ? chosen.url  // Blob URLs are direct
              : `/api/pipeline/${deviceId}/photos?file=${encodeURIComponent(chosen.name)}`
          );
        }
      } catch { /* ignore */ }
    }
    fetchPhoto();
    return () => { cancelled = true; };
  }, [deviceId]);

  const isSideBySide = showPhoto && photoMode === 'side-by-side';
  const [photoWidth, setPhotoWidth] = useState(40); // percentage
  const [photoZoom, setPhotoZoom] = useState(1);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDividerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDividerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setPhotoWidth(Math.max(20, Math.min(70, pct)));
  }, []);

  const handleDividerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div ref={containerRef} className={`relative flex-1 flex ${isSideBySide ? 'flex-row' : ''} overflow-hidden`}>
      {/* Side-by-side photo panel */}
      {isSideBySide && photoUrl && (
        <>
          <div
            className="overflow-auto bg-[#0a0a14] p-2"
            style={{ width: `${photoWidth}%`, minWidth: 200 }}
            onWheel={(e) => {
              // Only zoom on vertical scroll — let horizontal scroll pan the photo
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
              e.stopPropagation();
              const delta = e.deltaY < 0 ? 0.1 : -0.1;
              setPhotoZoom(z => Math.max(0.3, Math.min(5, z + delta)));
            }}
          >
            <img
              src={photoUrl}
              alt="Hardware reference"
              style={{
                width: `${100 * photoZoom}%`,
                maxWidth: 'none',
              }}
            />
            <div className="sticky bottom-1 left-1 text-[9px] text-gray-600 bg-gray-900/80 rounded px-1 py-0.5 inline-block">
              {Math.round(photoZoom * 100)}% — scroll to zoom
            </div>
          </div>
          {/* Draggable divider */}
          <div
            className="w-1.5 cursor-col-resize bg-gray-800 hover:bg-blue-600 transition-colors flex-shrink-0"
            onPointerDown={handleDividerDown}
            onPointerMove={handleDividerMove}
            onPointerUp={handleDividerUp}
            title="Drag to resize"
          />
        </>
      )}

      {/* Canvas + Rulers */}
      <CanvasWithRulers readOnly={readOnly} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
    </div>
  );
}

function CanvasWithRulers({ readOnly, onPointerDown, onPointerMove, onPointerUp }: {
  readOnly?: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const showRulers = useEditorStore((s) => s.showRulers);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const selection = useEditorStore((s) => s.selection);
  const selectedIds = selectedControlIds(selection);
  const controls = useEditorStore((s) => s.controls);
  const controlScale = useEditorStore((s) => s.controlScale);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const addGuide = useEditorStore((s) => s.addGuide);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Track container size for ruler length
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Compute selection bounds for ruler markers
  const selBounds = (() => {
    if (selectedIds.length === 0) return null;
    const ctrls = selectedIds.map(id => controls[id]).filter(Boolean);
    if (ctrls.length === 0) return null;
    const scale = controlScale ?? 1;
    return {
      minX: Math.min(...ctrls.map(c => c.x)),
      minY: Math.min(...ctrls.map(c => c.y)),
      maxX: Math.max(...ctrls.map(c => c.x + c.w * scale)),
      maxY: Math.max(...ctrls.map(c => c.y + c.h * scale)),
    };
  })();

  return (
    <div ref={canvasContainerRef} className="relative flex-1 overflow-hidden">
      {/* Top ruler */}
      {showRulers && containerSize.w > 0 && (
        <div className="absolute top-0 z-40" style={{ left: RULER_THICKNESS, right: 0 }}>
          <Ruler
            orientation="horizontal"
            length={containerSize.w - RULER_THICKNESS}
            zoom={zoom}
            pan={panX}
            selectionMin={selBounds?.minX}
            selectionMax={selBounds?.maxX}
            snapGrid={snapGrid}
            onCreateGuide={addGuide}
          />
        </div>
      )}

      {/* Left ruler */}
      {showRulers && containerSize.h > 0 && (
        <div className="absolute left-0 z-40" style={{ top: RULER_THICKNESS, bottom: 0 }}>
          <Ruler
            orientation="vertical"
            length={containerSize.h - RULER_THICKNESS}
            zoom={zoom}
            pan={panY}
            selectionMin={selBounds?.minY}
            selectionMax={selBounds?.maxY}
            snapGrid={snapGrid}
            onCreateGuide={addGuide}
          />
        </div>
      )}

      {/* Corner square */}
      {showRulers && (
        <div
          className="absolute top-0 left-0 z-40"
          style={{ width: RULER_THICKNESS, height: RULER_THICKNESS, backgroundColor: '#0a0a14' }}
        />
      )}

      {/* Canvas scroll container */}
      <div
        className={`absolute inset-0 overflow-auto ${
          readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={showRulers ? { top: RULER_THICKNESS, left: RULER_THICKNESS } : undefined}
        onPointerDown={readOnly ? undefined : onPointerDown}
        onPointerMove={readOnly ? undefined : onPointerMove}
        onPointerUp={readOnly ? undefined : onPointerUp}
      >
        {readOnly && (
          <div className="absolute inset-0 z-50" style={{ pointerEvents: 'auto' }} />
        )}
        <PanCanvas />
      </div>
    </div>
  );
}
