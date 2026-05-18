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
import { resolveDisplayContent } from '@/lib/render-helpers';

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
}: SharedCircleButtonProps) {
  const { text, isIcon } = resolveDisplayContent({ label, icon, labelDisplay });
  const showInside = labelPosition === 'on-button' || labelDisplay === 'icon-only';

  const isIntegrated = ledStyle === 'integrated' && !!hasLed;
  const intColor = ledColor ?? '#22c55e';

  // Base background color. React drops `undefined` style props, so when
  // bgColor is undefined the prop is simply absent — this is intentional for
  // the integrated-ledOn=true case where the radial gradient takes over.
  const bgColor = isIntegrated
    ? ledOn === true
      ? undefined
      : ledOn === false
        ? '#2a2a2a'
        : `${intColor}10`
    : active
      ? '#3a3a3a'
      : '#2a2a2a';

  // Integrated-LED radial gradient (conditional — see Bug 2 guard above).
  const integratedGradient =
    isIntegrated && ledOn === true
      ? `radial-gradient(ellipse at 50% 40%, ${intColor}50 0%, ${intColor}25 50%, transparent 80%)`
      : null;

  const border = isIntegrated
    ? ledOn === true
      ? `1px solid ${intColor}`
      : ledOn === false
        ? `3px solid ${surfaceColor ?? '#444'}`
        : `1px solid ${intColor}25`
    : `3px solid ${surfaceColor ?? '#444'}`;

  // boxShadow base mirrors the editor's pre-extraction code, which included
  // a subtle 1px white highlight (preview was missing it pre-extraction —
  // unifying through SharedCircleButton gives preview that highlight too).
  // Drift PR will call this out as an intentional preview-side improvement.
  const boxShadow =
    isIntegrated && ledOn === true
      ? `0 0 12px ${intColor}80, 0 0 4px ${intColor}60, inset 0 0 8px ${intColor}30`
      : surfaceColor
        ? `inset 0 2px 4px rgba(0,0,0,0.4), 0 0 8px ${surfaceColor}40, 0 1px 0 rgba(255,255,255,0.05)`
        : 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)';

  const faceStyle: React.CSSProperties = {
    width: diameter,
    height: diameter,
    ...(bgColor !== undefined && { backgroundColor: bgColor }),
    ...(integratedGradient && { background: integratedGradient }),
    border,
    boxShadow,
  };

  const fontSize =
    labelFontSize ?? (isIcon ? Math.max(Math.round(diameter * 0.35), 8) : 8);

  return (
    <div
      className="rounded-full flex items-center justify-center cursor-pointer"
      style={faceStyle}
      onClick={onClick}
    >
      {showInside && (
        <span
          className={`font-medium uppercase text-center leading-tight ${isIcon ? 'whitespace-nowrap' : 'w-full px-1'}`}
          style={{
            fontSize,
            color: labelColor ?? '#d1d5db',
            ...(isIcon ? {} : { overflowWrap: 'break-word' as const }),
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
