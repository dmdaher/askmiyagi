'use client';

import { useEffect, useState } from 'react';
import { useEditorStore } from './store';
import { isHosted } from '@/lib/env';

/**
 * Renders the first hardware reference photo behind the canvas content.
 * Reads deviceId from the editor store.
 * Fetches the photo list from the appropriate API (pipeline or hosted).
 */
export default function PhotoOverlay() {
  const showPhoto = useEditorStore((s) => s.showPhoto);
  const photoOpacity = useEditorStore((s) => s.photoOpacity);
  const photoOffsetX = useEditorStore((s) => s.photoOffsetX);
  const photoOffsetY = useEditorStore((s) => s.photoOffsetY);
  const photoScale = useEditorStore((s) => s.photoScale);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const deviceId = useEditorStore((s) => s.deviceId);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;

    async function fetchPhotos() {
      try {
        const useHostedApi = isHosted || deviceId.startsWith('sandbox-');
        const res = await fetch(`${useHostedApi ? '/api/hosted/panels' : '/api/pipeline'}/${deviceId}/photos`);
        if (!res.ok) return;
        const data = await res.json();
        // API returns { photos: [{ name, path, size }] } or [{ name, url }]
        const photos = data.photos ?? data;
        if (!cancelled && Array.isArray(photos) && photos.length > 0) {
          // Prefer the top-view photo if available, otherwise first photo
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
      } catch {
        // Silently ignore — photo overlay is optional
      }
    }

    fetchPhotos();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const photoMode = useEditorStore((s) => s.photoMode);

  // Only render in overlay mode — side-by-side is handled by EditorWorkspace
  if (!showPhoto || !photoUrl || photoMode !== 'overlay') return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt="Hardware reference photo"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          objectFit: 'contain',
          opacity: photoOpacity,
          transform: `translate(${photoOffsetX}px, ${photoOffsetY}px) scale(${photoScale})`,
          transformOrigin: '0 0',
        }}
      />
    </div>
  );
}
