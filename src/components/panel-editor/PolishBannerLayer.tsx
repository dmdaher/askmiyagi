'use client';

import { useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { useEditorStore } from './store';
import { computeBannerBoxStyle, computeBannerTextStyle } from '@/lib/banner-style';

/**
 * Editor-side render for polish banners. Each banner is wrapped in an Rnd
 * for drag + resize. Visual styling delegates to computeBannerBoxStyle /
 * computeBannerTextStyle (shared with PanelRenderer) so editor + preview
 * stay pixel-identical by construction.
 *
 * Selection state is mutually exclusive with controls and labels: clicking
 * a banner clears selectedIds + selectedLabelId via setSelectedBanner().
 */
export default function PolishBannerLayer() {
  const polishBanners = useEditorStore((s) => s.polishBanners);
  const selectedBannerId = useEditorStore((s) => s.selectedBannerId);
  const zoom = useEditorStore((s) => s.zoom);
  const snapGrid = useEditorStore((s) => s.snapGrid);
  const movePolishBanner = useEditorStore((s) => s.movePolishBanner);
  const resizePolishBanner = useEditorStore((s) => s.resizePolishBanner);
  const setSelectedBanner = useEditorStore((s) => s.setSelectedBanner);
  const pushSnapshot = useEditorStore((s) => s.pushSnapshot);

  const handleDragStop = useCallback(
    (banner: typeof polishBanners[number], d: { x: number; y: number }) => {
      const dx = d.x - banner.x;
      const dy = d.y - banner.y;
      if (dx === 0 && dy === 0) return;
      pushSnapshot();
      movePolishBanner(banner.id, dx, dy);
    },
    [movePolishBanner, pushSnapshot],
  );

  const handleResizeStop = useCallback(
    (id: string, ref: HTMLElement, position: { x: number; y: number }) => {
      const newW = parseInt(ref.style.width, 10);
      const newH = parseInt(ref.style.height, 10);
      pushSnapshot();
      resizePolishBanner(id, position.x, position.y, newW, newH);
    },
    [resizePolishBanner, pushSnapshot],
  );

  return (
    <>
      {polishBanners.map((banner) => {
        const isSelected = selectedBannerId === banner.id;
        const boxStyle = computeBannerBoxStyle(banner);
        const textStyle = computeBannerTextStyle(banner);
        // The Rnd wrapper handles positioning; we strip left/top/position from
        // the shared style and apply them via Rnd's `position` prop instead.
        const { left: _l, top: _t, position: _p, ...visualStyle } = boxStyle as Record<string, unknown>;
        return (
          <Rnd
            key={banner.id}
            data-banner-id={banner.id}
            position={{ x: banner.x, y: banner.y }}
            size={{ width: banner.w, height: banner.h }}
            scale={zoom}
            dragGrid={[snapGrid, snapGrid]}
            resizeGrid={[snapGrid, snapGrid]}
            disableDragging={banner.locked}
            enableResizing={!banner.locked}
            onDragStop={(_e, d) => handleDragStop(banner, d)}
            onResizeStop={(_e, _dir, ref, _delta, position) => handleResizeStop(banner.id, ref, position)}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedBanner(banner.id); }}
            style={{
              ...visualStyle as React.CSSProperties,
              outline: isSelected ? '2px solid rgba(59,130,246,0.8)' : undefined,
              outlineOffset: 2,
              // Editor-only: explicit z-index above SectionFrame's default
              // (sections get z=1..N via PanCanvas; selected sections jump
              // to 99-100). Without this, the banner sinks behind section
              // frames when deselected (sections have explicit z, banner
              // would have auto → explicit wins → banner hidden).
              // Preview rendering (PanelRenderer) does NOT set zIndex —
              // DOM order keeps controls on top there, which is what we
              // want for production view.
              zIndex: banner.zIndex ?? 50,
              cursor: banner.locked ? 'default' : 'move',
            }}
          >
            <div style={textStyle}>
              {banner.text || (
                <span className="text-gray-500 italic" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  (empty banner — click to edit)
                </span>
              )}
            </div>
            {banner.locked && (
              <span className="absolute top-1 right-2 text-[9px] text-amber-400 pointer-events-none">🔒</span>
            )}
          </Rnd>
        );
      })}
    </>
  );
}
