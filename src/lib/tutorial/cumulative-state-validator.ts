/**
 * Cumulative Panel State Validator — deterministic check that catches
 * stateful-drift bugs the LLM Tutorial Reviewer can't reliably see.
 *
 * The LLM reviewer is asked to track panel state across N steps mentally,
 * and it hallucinates state transitions (button-on-state forgotten, LED
 * carrying over between steps that should clear it, etc.). This script
 * computes cumulative state deterministically and surfaces the most
 * common drift patterns.
 *
 * Per CLAUDE.md: "Tutorial Reviewer must use a script to compute cumulative
 * panel state, not simulate mentally. LLMs hallucinate button deactivations."
 *
 * This is a pure function. Caller (a test or pre-push hook) handles I/O.
 *
 * Scope is conservative — we flag patterns that almost always indicate a
 * bug. We do NOT try to reason about teaching intent or manual content.
 *
 * Origin: 2026-05-10
 */
import type { Tutorial, TutorialStep } from '../../types/tutorial';
import type { PanelState, ButtonState } from '../../types/panel';
import { buildCumulativeState } from '../panelMapping';

export type Severity = 'error' | 'warning' | 'info';

export interface StateIssue {
  severity: Severity;
  code:
    | 'EXCESSIVE_FLIPS'             // a control toggles active state too many times (suggests forgotten reset)
    | 'CHANGE_REFERENCES_MISSING_CONTROL' // panelStateChanges key not in manifest
    | 'HIGHLIGHT_REFERENCES_MISSING_CONTROL' // highlight references missing id
    | 'LEFTOVER_LED_AT_END';        // tutorial ends with LEDs still on (often a forgot-to-reset bug)
  stepIndex: number;
  stepTitle: string;
  controlId?: string;
  message: string;
}

export interface CumulativeValidationResult {
  tutorialId: string;
  deviceId: string;
  issues: StateIssue[];
  errorCount: number;
  warningCount: number;
}

interface ValidationOptions {
  /** Max times a control's `active` may toggle across a tutorial before it's flagged. Default 4. */
  maxFlipsPerControl?: number;
  /** Allowlist of control IDs that are NORMAL to leave LED-on at the end (e.g., status indicators). */
  ledLeftoverAllowlist?: Set<string>;
  /** Initial panel state — usually all controls inactive. */
  initialState?: PanelState;
}

/**
 * Run all cumulative-state checks on a tutorial.
 *
 * @param tutorial - the tutorial to validate
 * @param manifestControlIds - the set of valid control IDs from the device's manifest
 * @param options - tuning knobs (defaults are sensible)
 */
export function validateCumulativeState(
  tutorial: Tutorial,
  manifestControlIds: Set<string>,
  options: ValidationOptions = {}
): CumulativeValidationResult {
  const issues: StateIssue[] = [];
  const maxFlips = options.maxFlipsPerControl ?? 4;
  const ledAllowlist = options.ledLeftoverAllowlist ?? new Set<string>();
  const initialState: PanelState = options.initialState ?? {};

  // Per-control flip count (toggles between active true ↔ false)
  const flipCounts = new Map<string, number>();
  const lastActiveState = new Map<string, boolean>();
  // Controls activated at SOME point during the tutorial (for HIGHLIGHTED_NOT_ACTIVATED check)
  const everActivated = new Set<string>();

  for (let i = 0; i < tutorial.steps.length; i++) {
    const step: TutorialStep = tutorial.steps[i];

    // Narrative steps (Welcome / Tour Complete / etc.) intentionally have
    // empty highlightControls + panelStateChanges — they teach via title +
    // instruction text alone. We don't flag those.

    // ── Check: any change/highlight references a missing control ────
    for (const controlId of Object.keys(step.panelStateChanges ?? {})) {
      if (!manifestControlIds.has(controlId)) {
        issues.push({
          severity: 'error',
          code: 'CHANGE_REFERENCES_MISSING_CONTROL',
          stepIndex: i,
          stepTitle: step.title,
          controlId,
          message: `Step "${step.title}" panelStateChanges["${controlId}"] — control id doesn't exist in manifest.`,
        });
      }
    }
    for (const controlId of step.highlightControls ?? []) {
      if (!manifestControlIds.has(controlId)) {
        // Allow specific synthetic targets: 'display' (LCD highlight)
        if (controlId === 'display') continue;
        issues.push({
          severity: 'error',
          code: 'HIGHLIGHT_REFERENCES_MISSING_CONTROL',
          stepIndex: i,
          stepTitle: step.title,
          controlId,
          message: `Step "${step.title}" highlightControls includes "${controlId}" — control id doesn't exist in manifest.`,
        });
      }
    }

    // ── Track flips ───────────────────────────────────────────────
    for (const [controlId, newState] of Object.entries(step.panelStateChanges ?? {})) {
      const newActive = (newState as ButtonState | undefined)?.active;
      if (newActive === undefined) continue;
      const prevActive = lastActiveState.get(controlId);
      if (prevActive !== undefined && prevActive !== newActive) {
        flipCounts.set(controlId, (flipCounts.get(controlId) ?? 0) + 1);
      }
      lastActiveState.set(controlId, newActive);
      if (newActive) everActivated.add(controlId);
    }

    // ── Check 3: highlight a control that's never activated ──────────
    // Only flag at the LAST step where the control is highlighted, if it
    // was never set active anywhere in the tutorial. We allow the case
    // where the same step's panelStateChanges activate it.
    const cumulativeAtStep = buildCumulativeState(initialState, tutorial.steps, i);
    for (const controlId of step.highlightControls ?? []) {
      if (controlId === 'display') continue;
      if (!manifestControlIds.has(controlId)) continue; // already flagged above
      const state = cumulativeAtStep[controlId];
      const isActive = state?.active === true;
      const isLedOn = state?.ledOn === true;
      // Only flag if the control has NEVER been activated in this tutorial.
      // (Some tutorials highlight a control without changing it — e.g., to
      // explain what it does. Not an error.)
      // This catches the actually-buggy case: highlighting a control that's
      // permanently inactive throughout the whole tutorial.
      if (!isActive && !isLedOn && !everActivated.has(controlId) && i === lastHighlightIndex(tutorial, controlId)) {
        // Skip — this is the common "explain what it does" pattern.
        // We're being conservative: the LLM Reviewer can read teaching intent.
      }
    }
  }

  // ── Check 4: excessive flips per control ────────────────────────
  for (const [controlId, count] of flipCounts) {
    if (count > maxFlips) {
      issues.push({
        severity: 'warning',
        code: 'EXCESSIVE_FLIPS',
        stepIndex: -1,
        stepTitle: '(tutorial-wide)',
        controlId,
        message: `Control "${controlId}" toggles active state ${count} times across the tutorial (max ${maxFlips} before flagged). Possible forgot-to-reset bug.`,
      });
    }
  }

  // ── Check 5: leftover LEDs at end of tutorial ────────────────────
  if (tutorial.steps.length > 0) {
    const finalState = buildCumulativeState(initialState, tutorial.steps, tutorial.steps.length - 1);
    for (const [controlId, state] of Object.entries(finalState)) {
      if (state?.ledOn === true && !ledAllowlist.has(controlId)) {
        issues.push({
          severity: 'info',
          code: 'LEFTOVER_LED_AT_END',
          stepIndex: tutorial.steps.length - 1,
          stepTitle: tutorial.steps[tutorial.steps.length - 1].title,
          controlId,
          message: `Tutorial ends with LED on "${controlId}". May be intentional; verify or reset in the final step.`,
        });
      }
    }
  }

  return {
    tutorialId: tutorial.id,
    deviceId: tutorial.deviceId,
    issues,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length,
  };
}

/** Index of the last step that highlights a given control. -1 if never. */
function lastHighlightIndex(tutorial: Tutorial, controlId: string): number {
  for (let i = tutorial.steps.length - 1; i >= 0; i--) {
    if ((tutorial.steps[i].highlightControls ?? []).includes(controlId)) return i;
  }
  return -1;
}

/**
 * Run the validator across every tutorial for a device. Returns a flat list
 * of issues sorted by tutorial then step.
 */
export function validateAllTutorials(
  tutorials: Tutorial[],
  manifestControlIds: Set<string>,
  options: ValidationOptions = {}
): CumulativeValidationResult[] {
  return tutorials.map((t) => validateCumulativeState(t, manifestControlIds, options));
}
