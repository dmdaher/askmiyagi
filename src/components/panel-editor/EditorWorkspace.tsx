'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useZoomPan } from './hooks/useZoomPan';
import { useEditorStore } from './store';
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
        const res = await fetch(`/api/pipeline/${deviceId}/photos`);
        if (!res.ok) return;
        const data = await res.json();
        const photos = data.photos ?? data;
        if (!cancelled && Array.isArray(photos) && photos.length > 0) {
          const topView = photos.find((p: { name: string }) =>
            p.name.toLowerCase().includes('top-view') || p.name.toLowerCase().includes('top_view')
          );
          const chosen = topView ?? photos[0];
          setPhotoUrl(`/api/pipeline/${deviceId}/photos?file=${encodeURIComponent(chosen.name)}`);
        }
      } catch { /* ignore */ }
    }
    fetchPhoto();
    return () => { cancelled = true; };
  }, [deviceId]);

  const isSideBySide = showPhoto && photoMode === 'side-by-side';
  const [photoWidth, setPhotoWidth] = useState(40); // percentage
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
            className="overflow-auto bg-[#0a0a14] flex items-start justify-center p-4"
            style={{ width: `${photoWidth}%`, minWidth: 200 }}
          >
            <img
              src={photoUrl}
              alt="Hardware reference"
              className="max-w-full h-auto object-contain"
              style={{ maxHeight: '100%' }}
            />
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
