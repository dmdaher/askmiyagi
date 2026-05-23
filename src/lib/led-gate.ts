/**
 * panelButtonHasLed — single source of truth for the `hasLed` prop passed
 * into <PanelButton>. Consumed by BOTH ControlNode (editor) and PanelRenderer
 * (preview) so the editor↔preview gate cannot drift.
 *
 * History: in PR #155 the gate was an inline expression duplicated at both
 * call sites. drift:ci nearly caught a divergence right before merge because
 * one side was updated and the other wasn't. This helper makes the rule a
 * single function with a tablified test suite.
 *
 * Why the gate exists:
 *   PanelButton's internal flex-sibling dot fires when `hasLed && !suppressDot`.
 *   For ledStyle === 'dot' with ledPosition !== 'inside', the SEPARATE
 *   external dot (above the button) is the one that should show. Passing
 *   hasLed=false here suppresses PanelButton's internal dot so we don't
 *   double up. For face / label-backlit / edge-glow styles, hasLed=true is
 *   required so `getLedStyleObject` activates the LED face/glow rendering.
 *
 * Pass hasLed=true to PanelButton WHEN:
 *   - ledPosition === 'inside' (PanelButton's internal dot is the intended
 *     visual — rare, used by some inside-button-LED designs)
 *   - ledStyle is a non-dot style (face / label-backlit / edge-glow) —
 *     PanelButton paints the full LED face via getLedStyleObject
 */
export interface LedGateInput {
  hasLed?: boolean;
  ledStyle?: string;
  ledPosition?: string;
}

export function panelButtonHasLed(control: LedGateInput): boolean {
  if (!control.hasLed) return false;
  // Clause A — inside-position dot lives inside PanelButton (its internal dot
  // path is the intended visual; the external dot wrappers skip this case).
  if (control.ledPosition === 'inside') return true;
  // Clause B — non-dot styles render the LED face/glow inside PanelButton
  // via getLedStyleObject, which short-circuits if hasLed === false.
  if (control.ledStyle && control.ledStyle !== 'dot') return true;
  return false;
}
