'use client';

/**
 * SharedLedDot — single source of truth for the LED dot visual.
 *
 * Replaces 5 inline dot definitions that previously lived in:
 *   - ControlNode.renderButtonLed (editor; always lit / design-viz)
 *   - PanelRenderer (3 sites: circle / rect / pad; ledOn-driven)
 *   - PanelButton internal dot (flex sibling inside the button column)
 *
 * Positioning lives at the CALL SITE. This component owns ONLY the visual
 * (the colored circle + glow / off-state). Consumers wrap with their own
 * positioning class (e.g. `absolute -top-2 left-1/2 -translate-x-1/2`).
 *
 * Two variants:
 *   - 'external' (default) — floating above a button, off-state = '#333' no shadow.
 *   - 'internal'           — flex sibling inside button column, off-state =
 *                            '#1a1a1a' + inset shadow (visually recessed).
 *
 * ledOn semantics (variant-dependent so behavior matches the pre-refactor code):
 *   - 'external' + ledOn=undefined → LIT (editor design-viz). true → LIT, false → DIM.
 *   - 'internal' + ledOn=undefined → DIM (matches PanelButton's prior `ledOn ? on : off`
 *     truthy check). true → LIT, false → DIM.
 */
interface SharedLedDotProps {
  color: string;
  ledOn?: boolean;
  variant?: 'external' | 'internal';
  /** External default 6px. Internal: omit when sizing via className. */
  size?: number;
  /** Extra className (used by internal variant for preset sizing + transitions). */
  className?: string;
}

export default function SharedLedDot({
  color,
  ledOn,
  variant = 'external',
  size,
  className,
}: SharedLedDotProps) {
  if (variant === 'internal') {
    const isLit = ledOn === true;
    return (
      <div
        className={`rounded-full transition-all duration-150${className ? ` ${className}` : ''}`}
        style={{
          ...(size != null ? { width: size, height: size } : {}),
          backgroundColor: isLit ? color : '#1a1a1a',
          boxShadow: isLit ? `0 0 6px 2px ${color}` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}
      />
    );
  }

  // External (default) — undefined treated as lit so editor design-viz shows the dot.
  const isLit = ledOn !== false;
  return (
    <div
      className={`rounded-full${className ? ` ${className}` : ''}`}
      style={{
        width: size ?? 6,
        height: size ?? 6,
        backgroundColor: isLit ? color : '#333',
        boxShadow: isLit ? `0 0 4px 1px ${color}` : 'none',
      }}
    />
  );
}
