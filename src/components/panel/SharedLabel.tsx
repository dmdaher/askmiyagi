/**
 * SharedLabel — single source of truth for label rendering.
 *
 * Used by BOTH:
 *   - LabelLayer (editor) — wraps SharedLabel with drag handlers + selection outline
 *   - PanelRenderer (preview) — uses SharedLabel directly
 *
 * The rule: pixel-identical text and icon positioning regardless of mode.
 * Any drift between editor and preview labels is a bug at this level.
 *
 * Editor-only chrome (selection outline, drag cursor, opacity) is added by the
 * wrapper, NOT here. SharedLabel is a pure renderer.
 */
import { HARDWARE_ICONS, HARDWARE_ICON_SVGS } from '@/lib/hardware-icons';

export interface SharedLabelData {
  id: string;
  text: string;
  icon?: string;
  x: number;
  y: number;
  w?: number;
  fontSize: number;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  color?: string;
  hidden?: boolean;
}

interface SharedLabelProps {
  label: SharedLabelData;
  /** Editor adds drag/edit handlers to the inner <span>. Pass them through. */
  innerSpanProps?: React.HTMLAttributes<HTMLSpanElement> & { 'data-label-id'?: string };
  /** Editor-only: opacity adjustment for dragging / hidden states. */
  opacity?: number;
  /** Editor-only: outline applied to outer wrapper. */
  outline?: string;
  /** Editor-only: z-index applied to outer wrapper. */
  zIndex?: number;
  /** Editor-only: extra className on outer wrapper (e.g. flash animation). */
  outerClassName?: string;
}

/**
 * Render the text content of a label. If the text contains newlines, wrap
 * each line in a <span> with <br /> between. Mirrors the editor's original
 * inline split — the wrapper structure is part of the pixel contract.
 */
function renderLabelText(text: string): React.ReactNode {
  if (!text.includes('\n')) {
    // Single-line — wrap in a single <span> so the DOM structure is the same
    // as multi-line case (both render via <span>) for layout consistency.
    return <span>{text}</span>;
  }
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ));
}

/**
 * The single, canonical label render. Outer div positioning + sizing + the
 * exact span padding/margin trick that determines visual text centering.
 *
 * History: PR #113 added `padding: '1px 3px'` to the outer div to match the
 * editor's bridge-icon positioning. The inner span padding/margin pattern
 * (`padding: '4px 6px'`, `margin: '-4px -6px'`) extends the click target
 * without shifting visual position — but only one renderer had it, causing
 * text-center math drift. This component locks the pattern for both.
 */
export default function SharedLabel({
  label,
  innerSpanProps,
  opacity = 1,
  outline = 'none',
  zIndex,
  outerClassName,
}: SharedLabelProps) {
  // Outer wrapper — positioned at label.x/y, owns width + alignment.
  // Width: icon-only labels hug their content; text labels use stored w.
  const outerStyle: React.CSSProperties = {
    position: 'absolute',
    left: label.x,
    top: label.y,
    width: (label.icon && !label.text) ? undefined : (label.w ?? undefined),
    fontSize: label.fontSize,
    lineHeight: `${label.lineHeight ?? label.fontSize + 2}px`,
    textAlign: label.align ?? 'center',
    opacity,
    outline,
    outlineOffset: 2,
    borderRadius: 2,
    padding: '1px 3px',
    ...(zIndex !== undefined ? { zIndex } : {}),
  };

  // Inner span — the click target / text container.
  // The padding + negative margin trick extends the clickable area without
  // shifting visual text position. This pattern was editor-only before
  // unification; now it's both.
  const innerStyle: React.CSSProperties = {
    padding: '4px 6px',
    margin: '-4px -6px',
    display: 'inline-block',
    minWidth: 16,
    minHeight: label.fontSize + 4,
    ...(label.color ? { color: label.color } : {}),
  };

  const { className: extraInnerClass, ...innerRest } = innerSpanProps ?? {};
  const innerClassName = `font-medium uppercase tracking-wider whitespace-nowrap${label.color ? '' : ' text-gray-300'}${extraInnerClass ? ` ${extraInnerClass}` : ''}`;

  return (
    <div className={`absolute pointer-events-none select-none${outerClassName ? ` ${outerClassName}` : ''}`} style={outerStyle}>
      <span
        className={innerClassName}
        style={innerStyle}
        {...innerRest}
      >
        {label.icon && HARDWARE_ICON_SVGS[label.icon] ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: label.fontSize + 4,
              height: label.fontSize + 4,
              verticalAlign: 'middle',
              marginRight: label.text ? 3 : 0,
            }}
          >
            {HARDWARE_ICON_SVGS[label.icon]}
          </span>
        ) : label.icon && HARDWARE_ICONS[label.icon] ? (
          <span style={{ marginRight: label.text ? 3 : 0 }}>{HARDWARE_ICONS[label.icon]}</span>
        ) : null}
        {label.text ? (
          renderLabelText(label.text)
        ) : !label.icon ? (
          <span className="text-gray-600 italic" style={{ fontSize: Math.max(label.fontSize - 1, 6) }}>
            empty
          </span>
        ) : null}
      </span>
    </div>
  );
}
