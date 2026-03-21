'use client';

import { useEffect, useState } from 'react';
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

  return (
    <div className={`relative flex-1 flex ${isSideBySide ? 'flex-row' : ''} overflow-hidden`}>
      {/* Side-by-side photo panel */}
      {isSideBySide && photoUrl && (
        <div className="w-[40%] min-w-[300px] border-r border-gray-800 overflow-auto bg-[#0a0a14] flex items-start justify-center p-4">
          <img
            src={photoUrl}
            alt="Hardware reference"
            className="max-w-full h-auto object-contain"
            style={{ maxHeight: '100%' }}
          />
        </div>
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
