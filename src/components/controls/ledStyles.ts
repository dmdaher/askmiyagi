/**
 * Pure helper for LED rendering across 5 styles × 3 states.
 *
 * Returns a CSSProperties object to merge into the button's style.
 * Always returns SOMETHING when hasLed=true and ledStyle indicates an
 * "on the button" rendering (face / label-backlit / edge-glow) — the
 * critical bug fix from the 2026-05-21 audit: previously the OFF state
 * returned `undefined`, leaving LED-capable buttons indistinguishable
 * from non-LED buttons.
 *
 * `dot` style returns `null` because the dot is rendered as a separate
 * element by the caller, not as a button face overlay.
 *
 * Styles:
 *   - dot           → returns null (separate indicator element)
 *   - face          → whole button face glows (preferred name)
 *   - integrated    → backwards-compat alias for face (legacy gatekeeper data)
 *   - label-backlit → only label/text glows; button face stays dark
 *   - edge-glow     → only border lights up (ring on circle, border on rect)
 *
 * States (via ledOn tristate):
 *   - true       → ON (bright/active)
 *   - false      → OFF (dark baseline with subtle hint)
 *   - undefined  → EDITOR (more visible than OFF so contractor can scan)
 */
import type { CSSProperties } from 'react';
import type { LEDStyle } from '@/types/manifest';

export type LedRenderState = 'on' | 'off' | 'editor';

export interface LedStyleResult {
  /** Style to merge into the button's container style object */
  containerStyle: CSSProperties | null;
  /** When non-null, render this style on the label/text instead of normal text style */
  labelStyle: CSSProperties | null;
  /** When true, suppress the separate LED-dot element (it's handled inline) */
  suppressDotIndicator: boolean;
}

/** Resolve the actual style to render (face === integrated). */
function resolveStyle(ledStyle: LEDStyle | undefined): LEDStyle | null {
  if (!ledStyle) return null;
  if (ledStyle === 'integrated') return 'face';  // alias
  return ledStyle;
}

/** Map ledOn boolean | undefined into a render state. */
export function ledRenderStateFromOn(ledOn: boolean | undefined): LedRenderState {
  if (ledOn === true) return 'on';
  if (ledOn === false) return 'off';
  return 'editor';
}

export function getLedStyleObject(
  ledStyle: LEDStyle | undefined,
  ledOn: boolean | undefined,
  ledColor: string | undefined,
  hasLed: boolean,
): LedStyleResult {
  const empty: LedStyleResult = { containerStyle: null, labelStyle: null, suppressDotIndicator: false };
  if (!hasLed || !ledColor) return empty;

  const style = resolveStyle(ledStyle);
  if (!style) return empty;
  // Dot style: caller renders the separate dot element. We suppress nothing here.
  if (style === 'dot') return { ...empty, suppressDotIndicator: false };

  const state = ledRenderStateFromOn(ledOn);

  // FACE style (whole button face)
  if (style === 'face') {
    if (state === 'on') {
      return {
        containerStyle: {
          background: `radial-gradient(ellipse at 50% 40%, ${ledColor}50 0%, ${ledColor}25 50%, transparent 80%)`,
          border: `1px solid ${ledColor}`,
          boxShadow: `0 0 12px ${ledColor}80, 0 0 4px ${ledColor}60, inset 0 0 8px ${ledColor}30`,
        },
        labelStyle: null,
        suppressDotIndicator: true,
      };
    }
    if (state === 'off') {
      // Dark face baseline — distinguishable from non-LED button
      return {
        containerStyle: {
          backgroundColor: '#1a1a1e',
          border: `1px solid ${ledColor}40`,
          boxShadow: `inset 0 0 4px ${ledColor}20`,
        },
        labelStyle: null,
        suppressDotIndicator: true,
      };
    }
    // editor — slightly more visible than off
    return {
      containerStyle: {
        backgroundColor: '#1a1a1e',
        border: `2px solid ${ledColor}40`,
        boxShadow: `inset 0 0 4px ${ledColor}25, 0 0 0 1px ${ledColor}20`,
      },
      labelStyle: null,
      suppressDotIndicator: true,
    };
  }

  // LABEL-BACKLIT style (face dark, only text glows)
  if (style === 'label-backlit') {
    const faceDark: CSSProperties = {
      backgroundColor: '#1a1a1e',
      border: `1px solid #333`,
    };
    if (state === 'on') {
      return {
        containerStyle: faceDark,
        labelStyle: {
          color: ledColor,
          textShadow: `0 0 6px ${ledColor}, 0 0 2px ${ledColor}`,
        },
        suppressDotIndicator: true,
      };
    }
    if (state === 'off') {
      return {
        containerStyle: faceDark,
        labelStyle: { color: `${ledColor}80` },
        suppressDotIndicator: true,
      };
    }
    return {
      containerStyle: faceDark,
      labelStyle: { color: `${ledColor}60` },
      suppressDotIndicator: true,
    };
  }

  // EDGE-GLOW style (border lights up; auto-ring on circle via border-radius:50%)
  if (style === 'edge-glow') {
    if (state === 'on') {
      return {
        containerStyle: {
          backgroundColor: '#1a1a1e',
          border: `3px solid ${ledColor}`,
          boxShadow: `0 0 10px ${ledColor}90, 0 0 4px ${ledColor}60`,
        },
        labelStyle: null,
        suppressDotIndicator: true,
      };
    }
    if (state === 'off') {
      return {
        containerStyle: {
          backgroundColor: '#1a1a1e',
          border: `1px solid ${ledColor}40`,
        },
        labelStyle: null,
        suppressDotIndicator: true,
      };
    }
    return {
      containerStyle: {
        backgroundColor: '#1a1a1e',
        border: `2px solid ${ledColor}60`,
      },
      labelStyle: null,
      suppressDotIndicator: true,
    };
  }

  return empty;
}
