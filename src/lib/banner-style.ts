/**
 * Shared style + content rendering for the PolishBanner overlay.
 *
 * Used by BOTH:
 *  - src/components/panel-editor/PolishBannerLayer.tsx (editor canvas)
 *  - src/components/controls/PanelRenderer.tsx          (preview / production)
 *
 * Single source of truth so editor and preview cannot drift. If you need to
 * tweak how a banner renders visually, change it here once.
 */
import type { CSSProperties } from 'react';
import type { PolishBanner } from '@/components/panel-editor/store/historySlice';

/**
 * Resolve the banner's background color as an rgba() string that respects
 * `backgroundOpacity`. Accepts hex (#RGB, #RRGGBB) or named colors.
 */
function resolveBackground(bg: string | undefined, opacity: number): string {
  if (!bg) return `rgba(31, 41, 55, ${opacity})`; // default dark gray
  // Hex → rgba
  const hex = bg.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Fallback: just return as-is (browser will resolve named colors).
  // Note: if user supplies an rgba(...) string with alpha, this will keep the
  // baked-in alpha and ignore the opacity slider — document in Properties UI.
  return bg;
}

/**
 * Compute the outer-box CSS for a polish banner. Identical in editor and
 * preview — same width, height, position, color, opacity, radius.
 */
export function computeBannerBoxStyle(banner: PolishBanner): CSSProperties {
  return {
    position: 'absolute',
    left: banner.x,
    top: banner.y,
    width: banner.w,
    height: banner.h,
    backgroundColor: resolveBackground(banner.backgroundColor, banner.backgroundOpacity ?? 1.0),
    border: banner.borderColor ? `1px solid ${banner.borderColor}` : undefined,
    borderRadius: banner.borderRadius ?? 4,
    zIndex: banner.zIndex ?? 5,
    overflow: 'hidden',
  };
}

/**
 * Compute the inner text container CSS — handles alignment + typography.
 * Vertical alignment uses flexbox so it works regardless of banner height.
 */
export function computeBannerTextStyle(banner: PolishBanner): CSSProperties {
  const justifyContent =
    banner.align === 'left' ? 'flex-start' :
    banner.align === 'right' ? 'flex-end' :
    'center';
  const alignItems =
    banner.verticalAlign === 'top' ? 'flex-start' :
    banner.verticalAlign === 'bottom' ? 'flex-end' :
    'center';
  return {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent,
    alignItems,
    padding: '0 12px',
    color: banner.textColor ?? '#d1d5db',
    fontSize: banner.fontSize ?? 16,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    userSelect: 'none',
  };
}
