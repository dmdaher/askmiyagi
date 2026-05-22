/**
 * SharedCircleButton — single source of truth for circle-shape button rendering.
 *
 * Used by BOTH:
 *   - ControlNode (editor) — wraps with Rnd selection chrome; passes minimal
 *     props (no `ledOn`/`active`/`onClick` — editor is config-time, not
 *     tutorial-time, so the integrated-LED + press-state branches never light).
 *   - PanelRenderer (preview) — passes tutorial-driven `ledOn`/`active`/`onClick`.
 *
 * Owns:
 *   - The circle face div, background, border, shadow
 *   - Integrated-LED visual states (when `ledStyle='integrated'`)
 *   - The optional on-button label/icon (shown when `labelPosition === 'on-button'`
 *     or `labelDisplay === 'icon-only'`)
 *
 * Does NOT own:
 *   - The non-integrated LED dot above the button — editor uses
 *     `renderButtonLed()` (always-on for design viz), preview uses an inline
 *     `ledOn`-driven dot. Two different behaviors, kept in their respective
 *     wrappers.
 *   - The outer wrapper div with `data-control-id` — callers wrap.
 *   - Selection chrome (editor's Rnd outline) — wrapper concern.
 *
 * Pixel-identity rule:
 *   This component is rendered into the editor by ControlNode. Drift CI
 *   asserts the editor side has 0 pixel changes from baseline on every PR.
 *   Any change to the rendered DOM here that affects layout MUST recapture
 *   the editor baseline in the same PR.
 *
 * Background-shorthand bug guard (Bug 2 from PR #140):
 *   The integrated-LED gradient is added via conditional spread, NEVER
 *   via `background: undefined`. Setting `background: undefined` in a React
 *   inline style risks clearing `backgroundColor` via CSS shorthand semantics
 *   when serialized to the DOM. Conditional spread guarantees the shorthand
 *   only enters the style object when actually needed.
 */
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { resolveDisplayContent } from '@/lib/render-helpers';
import { getLedStyleObject } from '@/components/controls/ledStyles';
import type { LEDStyle } from '@/types/manifest';

// Same cyan pulse PanelButton uses (PanelButton.tsx:74). Kept verbatim so
// circular transport buttons (PLAY_PAUSE, CUE_BTN, HOT_CUE_*, SLIP, etc.)
// glow identically to rectangular ones during tutorial steps.
const highlightAnimation = {
  animate: {
    boxShadow: [
      '0 0 8px 2px rgba(0,170,255,0.4)',
      '0 0 20px 8px rgba(0,170,255,0.8)',
      '0 0 8px 2px rgba(0,170,255,0.4)',
    ],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export interface SharedCircleButtonProps {
  /** Diameter in CSS pixels (caller has already applied controlScale). */
  diameter: number;

  // Label / icon resolution inputs (passed to resolveDisplayContent)
  label: string;
  icon?: string | null;
  labelPosition?: string | null;
  labelDisplay?: string | null;
  labelFontSize?: number;
  labelColor?: string | null;

  /** Circle face surface color (tints border + adds outer glow). */
  surfaceColor?: string | null;

  // Integrated-LED config (only consulted when ledStyle === 'integrated')
  hasLed?: boolean;
  ledStyle?: string | null;
  ledColor?: string | null;

  /**
   * Tutorial-driven LED state. TRISTATE:
   *   - `true`: lit (radial gradient bg + glow on integrated)
   *   - `false`: explicitly off (solid dark, dim border on integrated)
   *   - `undefined`: no state (faded integrated bg — the default editor look)
   */
  ledOn?: boolean;

  /** Tutorial-driven press state (slight bg lighten). Preview-only. */
  active?: boolean;

  /** Optional click handler. Preview-only (editor uses Rnd for interaction). */
  onClick?: () => void;

  /**
   * Tutorial-driven highlight (preview-only). When true, the button face
   * pulses with the cyan-blue framer animation and lifts to z-index 1000
   * so the glow renders unclipped above sibling controls. Editor never
   * passes this — default `false` keeps the editor render path
   * pixel-identical to baseline.
   */
  highlighted?: boolean;
}

export default function SharedCircleButton({
  diameter,
  label,
  icon,
  labelPosition,
  labelDisplay,
  labelFontSize,
  labelColor,
  surfaceColor,
  hasLed,
  ledStyle,
  ledColor,
  ledOn,
  active,
  onClick,
  highlighted = false,
}: SharedCircleButtonProps) {
  const { text, isIcon } = resolveDisplayContent({ label, icon, labelDisplay });
  const showInside = labelPosition === 'on-button' || labelDisplay === 'icon-only';

  // PR EP2: shared LED helper across 5 styles × 3 states.
  // The circle button is shape-agnostic for LED rendering — the only
  // shape-specific bit is `border-radius:50%` applied by the caller,
  // which automatically turns edge-glow's border into a ring.
  const ledResult = useMemo(
    () => getLedStyleObject(ledStyle as LEDStyle | undefined, ledOn, ledColor ?? undefined, !!hasLed),
    [ledStyle, ledOn, ledColor, hasLed],
  );
  const isLedStyled = !!ledResult.containerStyle;

  // Base background for non-LED-styled buttons (regular active/inactive)
  const baseBgColor = active ? '#3a3a3a' : '#2a2a2a';
  // Base border + shadow for non-LED-styled buttons (with optional surfaceColor)
  const baseBorder = `3px solid ${surfaceColor ?? '#444'}`;
  const baseShadow = surfaceColor
    ? `inset 0 2px 4px rgba(0,0,0,0.4), 0 0 8px ${surfaceColor}40, 0 1px 0 rgba(255,255,255,0.05)`
    : 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)';

  const faceStyle: React.CSSProperties = {
    width: diameter,
    height: diameter,
    // When LED-styled, the helper's containerStyle owns bg/border/boxShadow.
    // When not, fall back to base button face.
    ...(isLedStyled
      ? ledResult.containerStyle!
      : { backgroundColor: baseBgColor, border: baseBorder, boxShadow: baseShadow }),
    // Lift highlighted buttons so the cyan glow renders unclipped above
    // section frames + sibling controls (same pattern as PanelButton).
    ...(highlighted && { position: 'relative' as const, zIndex: 1000 }),
  };

  const fontSize =
    labelFontSize ?? (isIcon ? Math.max(Math.round(diameter * 0.35), 8) : 8);

  const inner = showInside && (
    <span
      className={`font-medium uppercase text-center leading-tight ${isIcon ? 'whitespace-nowrap' : 'w-full px-1'}`}
      style={{
        fontSize,
        // label-backlit overrides label color/glow via the helper; otherwise
        // use admin-configured labelColor or default text grey.
        color: ledResult.labelStyle?.color ?? labelColor ?? '#d1d5db',
        ...(ledResult.labelStyle?.textShadow && { textShadow: ledResult.labelStyle.textShadow as string }),
        ...(isIcon ? {} : { overflowWrap: 'break-word' as const }),
      }}
    >
      {text}
    </span>
  );

  // When NOT highlighted: plain <div> — byte-identical to pre-PR-F editor
  // render. Editor never passes `highlighted`, so drift CI stays clean.
  // When highlighted (preview only): wrap in motion.div with the same
  // pulse animation PanelButton uses.
  if (!highlighted) {
    return (
      <div
        className="rounded-full flex items-center justify-center cursor-pointer"
        style={faceStyle}
        onClick={onClick}
      >
        {inner}
      </div>
    );
  }
  return (
    <motion.div
      className="rounded-full flex items-center justify-center cursor-pointer"
      style={faceStyle}
      onClick={onClick}
      {...highlightAnimation}
    >
      {inner}
    </motion.div>
  );
}
