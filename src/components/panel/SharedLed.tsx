/**
 * SharedLed — single source of truth for LED indicator rendering.
 *
 * Used by BOTH:
 *   - ControlNode (editor): config-time render. Passes no `ledOn`, so the
 *     component renders in "design-viz" mode (top-active for dual-label,
 *     lit for bar, dim for dot — matches pre-PR-3 editor behavior).
 *   - PanelRenderer (preview): tutorial-time render. Passes `ledOn` as
 *     boolean. Variant-specific semantics determine whether each variant
 *     interprets `false` as "off" (dot/bar) or "bottom-row-active"
 *     (dual-label).
 *
 * Three variants:
 *   - `dot` (default) — small transparent-bg circle with optional glow.
 *     Used for most synth LEDs.
 *   - `dual-label` — vertical 2-row stack with active/inactive coloring.
 *     Used for mode-toggle indicators (e.g., "VINYL / CDJ").
 *   - `bar` — horizontal bar with text label below. Used for meter
 *     indicators (e.g., level meters).
 *
 * Owns:
 *   - The container div with border + background per variant
 *   - The visual content per variant (rows, bar, dot)
 *   - The `data-control-id` attribute (when caller passes one)
 *
 * Does NOT own:
 *   - Outer panel layout / positioning — caller wraps with whatever
 *     positioning context applies (Rnd in editor, absolute-positioned
 *     wrapper in preview).
 *
 * Unifies two pre-existing divergences:
 *   1. dual-label `secondaryLabel`: editor splits `label` on / or \n;
 *      preview's button-case path uses `secondaryLabel` field; preview's
 *      indicator-case path also splits `label`. SharedLed prefers
 *      `secondaryLabel` field, falls back to split for legacy manifests
 *      that encoded both halves in `label` like "MODE A/MODE B".
 *   2. bar transition CSS: preview had `transition: background-color
 *      200ms, box-shadow 200ms`; editor didn't. SharedLed adds it for
 *      both — editor's bar now smoothly transitions on state change
 *      (matters less in editor since no state changes, but harmless).
 *
 * Tristate `ledOn` semantics (matches the natural editor/preview split):
 *   | ledOn     | dot               | dual-label                | bar               |
 *   |-----------|-------------------|---------------------------|-------------------|
 *   | true      | lit + glow        | top row active            | lit + glow        |
 *   | false     | dim grey          | bottom row active         | dim grey          |
 *   | undefined | dim grey          | top row active            | lit + glow        |
 *                 (editor default)    (editor design-viz)         (editor design-viz)
 *
 * The undefined case matches each variant's CURRENT editor behavior
 * pre-PR-3, so editor renders are pixel-identical post-extraction.
 */
import { motion } from 'framer-motion';
import { renderLabelText } from '@/lib/render-helpers';

// Same cyan pulse other highlight-aware controls use (PanelButton,
// SharedCircleButton). LEDs already glow in their own color via `ledOn`;
// the cyan halo is the "tutorial wants you to look here" signal layered
// on top. Editor never passes `highlighted` so its pixel baseline is
// unaffected.
const HIGHLIGHT_ANIMATION = {
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

export type SharedLedVariant = 'dot' | 'dual-label' | 'bar';

export interface SharedLedProps {
  /** Container width in CSS pixels (already scaled by caller). */
  width: number;
  /** Container height in CSS pixels (already scaled by caller). */
  height: number;
  variant?: SharedLedVariant;
  /** Primary label. For dual-label, becomes the top row text. */
  label: string;
  /**
   * Explicit secondary label (preferred for dual-label). Falls back to
   * splitting `label` on `/` or `\n` for legacy manifests.
   */
  secondaryLabel?: string | null;
  ledColor?: string | null;
  /**
   * Tutorial-driven LED state. TRISTATE — see comment block at top.
   */
  ledOn?: boolean;
  /** Optional data-control-id for editor selectors + drift CI. */
  dataControlId?: string;
  /**
   * Tutorial-driven highlight (preview-only). When true, the LED is
   * wrapped in a motion.div that pulses with the cyan-blue framer
   * animation. Editor never passes this; default `false` keeps pixel-
   * identical editor render.
   */
  highlighted?: boolean;
}

const DEFAULT_LED_COLOR = '#22c55e';

function splitDualLabel(label: string): { top: string; bottom: string } {
  const parts = label.split(/[\/\n]/).map((s) => s.trim()).filter(Boolean);
  return {
    top: parts[0] || 'MODE A',
    bottom: parts[1] || 'MODE B',
  };
}

function DualLabel({ width, height, label, secondaryLabel, ledColor, ledOn, dataControlId }: SharedLedProps) {
  const color = ledColor ?? DEFAULT_LED_COLOR;
  // Prefer the dedicated `secondaryLabel` field when set (so contractor's
  // Properties-panel "Secondary Label" actually takes effect). Fall back
  // to splitting `label` for legacy manifests.
  const { top: topText, bottom: bottomText } =
    secondaryLabel != null
      ? { top: label, bottom: secondaryLabel }
      : splitDualLabel(label);
  // ledOn !== false means undefined (editor design-viz) OR true (tutorial-on)
  // both render the top row as active. Only explicit `false` flips to bottom.
  const topActive = ledOn !== false;
  return (
    <div
      className="flex flex-col rounded overflow-hidden"
      style={{ width, height, border: '1px solid #333' }}
      {...(dataControlId ? { 'data-control-id': dataControlId } : {})}
    >
      <div
        className="flex flex-1 items-center justify-center py-0.5 px-1"
        style={{
          backgroundColor: topActive ? '#0a2e1a' : '#1a1a2a',
          borderBottom: '1px solid #333',
        }}
      >
        <span
          className="text-[7px] font-medium uppercase truncate"
          style={{ color: topActive ? '#4ade80' : `${color}88` }}
        >
          {topText}
        </span>
      </div>
      <div
        className="flex flex-1 items-center justify-center py-0.5 px-1"
        style={{ backgroundColor: !topActive ? '#0a2e1a' : '#1a1a2a' }}
      >
        <span
          className="text-[7px] font-medium uppercase truncate"
          style={{ color: !topActive ? '#4ade80' : `${color}88` }}
        >
          {bottomText}
        </span>
      </div>
    </div>
  );
}

function Bar({ width, label, ledColor, ledOn, dataControlId }: SharedLedProps) {
  const color = ledColor ?? DEFAULT_LED_COLOR;
  // ledOn !== false = lit (both undefined and true). False = dim.
  // Editor passes undefined → lit (design-viz, matches pre-PR-3 editor).
  // Preview passes explicit boolean from panelState.
  const lit = ledOn !== false;
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded"
      style={{ backgroundColor: '#1a1a2a', padding: 4 }}
      {...(dataControlId ? { 'data-control-id': dataControlId } : {})}
    >
      <div
        className="rounded-sm"
        style={{
          width: Math.max(width - 8, 16),
          height: 6,
          backgroundColor: lit ? color : '#333',
          boxShadow: lit ? `0 0 6px ${color}` : 'none',
          // Preview-only pre-PR-3; now applied uniformly. Harmless in
          // editor (no state changes, transition never fires).
          transition: 'background-color 200ms, box-shadow 200ms',
        }}
      />
      <span className="text-[7px] text-gray-400 uppercase break-words w-full text-center leading-tight">
        {renderLabelText(label)}
      </span>
    </div>
  );
}

function Dot({ width, height, ledColor, ledOn, dataControlId }: SharedLedProps) {
  const color = ledColor ?? DEFAULT_LED_COLOR;
  // Dot is the most state-strict variant: undefined and false BOTH read
  // as off. Only `true` lights it. Matches both pre-PR-3 editor and
  // pre-PR-3 preview behavior (both did `ledIsOn = ledOn === true`).
  const ledIsOn = ledOn === true;
  const dotColor = ledIsOn ? color : '#333';
  return (
    <div
      className="flex items-center justify-center"
      style={{ width, height }}
      {...(dataControlId ? { 'data-control-id': dataControlId } : {})}
    >
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: Math.min(width, height) * 0.7,
          height: Math.min(width, height) * 0.7,
          minWidth: 6,
          minHeight: 6,
          backgroundColor: dotColor,
          border: ledIsOn ? `2px solid ${color}44` : '1px solid #444',
          boxShadow: ledIsOn ? `0 0 6px ${color}` : 'none',
        }}
      />
    </div>
  );
}

export default function SharedLed(props: SharedLedProps) {
  const variant = props.variant ?? 'dot';
  const inner =
    variant === 'dual-label' ? <DualLabel {...props} />
    : variant === 'bar' ? <Bar {...props} />
    : <Dot {...props} />;
  // When highlighted, wrap in a motion.div pulsing the cyan glow. Use
  // the LED container's exact box (width/height) so the halo sits flush
  // around the indicator. Editor never passes `highlighted`, so its
  // baseline render path is unchanged.
  if (!props.highlighted) return inner;
  // When highlighted, wrap with a motion.div that pulses the cyan glow.
  // We also tag the wrapper with data-control-id so test selectors that
  // search `[data-control-id="X"]` subtrees find the glow on the right
  // ancestor. (The inner SharedLed variant root also has data-control-id —
  // that's fine, having it on both is harmless.)
  return (
    <motion.div
      style={{
        width: props.width,
        height: props.height,
        borderRadius: 6,
        position: 'relative',
        zIndex: 1000,
      }}
      {...HIGHLIGHT_ANIMATION}
      {...(props.dataControlId ? { 'data-control-id': props.dataControlId } : {})}
    >
      {inner}
    </motion.div>
  );
}
