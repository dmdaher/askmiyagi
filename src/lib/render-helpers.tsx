import React from 'react';
import { HARDWARE_ICONS, HARDWARE_ICON_SVGS } from '@/lib/hardware-icons';

/**
 * Render label text with `\n` as line breaks.
 *
 * Used by both `ControlNode.tsx` (editor) and `PanelRenderer.tsx` (preview).
 * Pure function — no side effects, no React hooks. Safe to call from any
 * render path.
 */
export function renderLabelText(text: string): React.ReactNode {
  if (!text.includes('\n')) return text;
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ));
}

/**
 * Infer a Port variant ('usb-a' | 'sd-card' | 'ethernet' | 'rca') from a
 * label string. Used by both editor and preview for the Port primitive.
 *
 * Heuristic: lowercase + keyword match.
 *  - 'sd', 'card'                         → 'sd-card'
 *  - 'ethernet', 'lan', 'link'            → 'ethernet'
 *  - 'rca', 'phono'                       → 'rca'
 *  - anything else (including 'usb', '')  → 'usb-a' (default)
 *
 * Unified behavior: the previous editor version covered 'link' for
 * networking labels (e.g., CDJ-3000 "LINK"); the previous preview version
 * had an explicit 'usb' check that was redundant with the default. This
 * helper combines both — strictest typing, broadest keyword coverage.
 */
export function inferPortVariant(
  label: string,
): 'usb-a' | 'sd-card' | 'ethernet' | 'rca' {
  const lower = label.toLowerCase();
  if (lower.includes('sd') || lower.includes('card')) return 'sd-card';
  if (
    lower.includes('ethernet') ||
    lower.includes('lan') ||
    lower.includes('link')
  ) {
    return 'ethernet';
  }
  if (lower.includes('rca') || lower.includes('phono')) return 'rca';
  return 'usb-a';
}

/**
 * Map the editor's `labelPosition` enum onto the limited set of positions
 * that `PanelButton` understands.
 *
 * Editor positions: 'on-button' | 'above' | 'below' | 'left' | 'right' |
 * 'hidden'.
 * PanelButton positions: 'on' | 'above' | 'below'.
 *
 * Drop-down values that PanelButton doesn't support ('left', 'right',
 * 'hidden') fall back to 'on' — the safest default since the floating
 * label will render separately at the stored x/y in those cases.
 *
 * Previously editor-only; now also used by preview so both modes pick the
 * same target for rect/oval buttons.
 */
export function mapButtonLabelPosition(
  lp: string | undefined,
): 'on' | 'above' | 'below' {
  if (lp === 'on-button') return 'on';
  if (lp === 'above') return 'above';
  if (lp === 'below') return 'below';
  return 'on';
}

/**
 * Structural type that both editor `ControlDef` and preview
 * `ManifestControl` satisfy. Allows `resolveDisplayContent` to be called
 * from either render path without coupling the helper to a specific
 * shape.
 */
export interface DisplayContentSource {
  label: string;
  /** Accepts `null` for editor's `ControlDef` shape (uses null for "cleared"). */
  icon?: string | null;
  /** Accepts `null` for the same reason. */
  labelDisplay?: string | null;
}

/**
 * Resolve the display content for a control with an icon.
 *
 * - If `icon` is set AND `labelDisplay === 'icon-only'`:
 *   - prefer the SVG icon from `HARDWARE_ICON_SVGS` (for waveforms,
 *     envelope curves, etc. that need React components)
 *   - fall back to the unicode character in `HARDWARE_ICONS` (for
 *     play/pause/eject etc.)
 *   - fall back to the raw icon key string if neither map has it
 *     (last-ditch debug-friendly behavior)
 * - Otherwise: render the plain `label` text.
 *
 * Previously editor-only; preview's inline equivalent only checked the
 * text icon map (`HARDWARE_ICONS`) and missed SVG-only icons like
 * `'sine-wave'`. Unifying through this helper ensures both modes resolve
 * icons identically.
 */
export function resolveDisplayContent(
  control: DisplayContentSource,
): { text: string; isIcon: boolean; svgIcon?: React.ReactNode } {
  if (control.icon && control.labelDisplay === 'icon-only') {
    const svg = HARDWARE_ICON_SVGS[control.icon];
    if (svg) return { text: '', isIcon: true, svgIcon: svg };
    const iconChar = HARDWARE_ICONS[control.icon] ?? control.icon;
    return { text: iconChar, isIcon: true };
  }
  return { text: control.label, isIcon: false };
}
