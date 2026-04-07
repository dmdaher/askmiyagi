'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useZoomPan } from './hooks/useZoomPan';
import { useEditorStore } from './store';
import { isHosted } from '@/lib/env';
import PanCanvas from './PanCanvas';

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
        const res = await fetch(`${isHosted ? '/api/hosted/panels' : '/api/pipeline'}/${deviceId}/photos`);
        if (!res.ok) return;
        const data = await res.json();
        const photos = data.photos ?? data;
        if (!cancelled && Array.isArray(photos) && photos.length > 0) {
          const topView = photos.find((p: { name: string }) =>
            p.name.toLowerCase().includes('top-view') || p.name.toLowerCase().includes('top_view')
          );
          const chosen = topView ?? photos[0];
          setPhotoUrl(
            isHosted
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

      {/* Canvas */}
      <div
        className={`relative flex-1 overflow-auto ${
          readOnly
            ? 'cursor-default'
            : 'cursor-grab active:cursor-grabbing'
        }`}
        onPointerDown={readOnly ? undefined : onPointerDown}
        onPointerMove={readOnly ? undefined : onPointerMove}
        onPointerUp={readOnly ? undefined : onPointerUp}
      >
        {readOnly && (
          <div
            className="absolute inset-0 z-50"
            style={{ pointerEvents: 'auto' }}
          />
        )}
        <PanCanvas />
      </div>
    </div>
  );
}
