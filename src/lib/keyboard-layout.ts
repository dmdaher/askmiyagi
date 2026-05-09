/**
 * Single source of truth for keyboard sizing math.
 *
 * The keyboard's vertical extent is derived from its width × KEY_ASPECT, so
 * that white keys keep their real-instrument proportions (~6.6:1 length:width)
 * regardless of canvas dimensions. The stored `panelHeightPercent` field
 * becomes a cached output of this computation rather than a free input.
 *
 * Both `KeyboardSection` (editor) and `PanelShell` (production renderer) call
 * `computeKeyboardLayout` to ensure editor preview and exported panel render
 * identically.
 */

import { generateKeyboardNotes, nameToMidiNote } from './noteHelpers';

/** Standard piano white-key length / width ratio. */
export const KEY_ASPECT = 6.6;

/** Floor for the controls area when keyboard would otherwise eat the canvas. */
export const MIN_CONTROLS_PX = 30;

/**
 * Keyboard never exceeds this fraction of canvas height. Even when the
 * aspect-correct keyboard would fit inside `canvasHeight - MIN_CONTROLS_PX`,
 * we still cap it here so controls always get a reasonable share of the
 * canvas. 0.65 gives synths room for ~8 control rows above the keyboard.
 */
export const MAX_KEYBOARD_HEIGHT_RATIO = 0.65;

/** Tolerance for "is the keyboard at its desired height" — matches 0.5 px. */
const ASPECT_LOCK_TOLERANCE_PX = 0.5;

export interface KeyboardLayoutInputs {
  canvasWidth: number;
  canvasHeight: number;
  widthPercent: number; // 50–100, user-controlled
  keys: number;         // total key count, e.g. 49
  startNote: string;    // e.g. "C2"
}

export interface KeyboardLayout {
  /** Pixel width of the rendered keyboard (after widthPercent). */
  keyboardWidth: number;
  /** Pixel height the keyboard ACTUALLY renders at (may be clamped). */
  keyboardHeight: number;
  /** Pixel height the keyboard WANTS to be at correct aspect (≥ actual when clamped). */
  desiredHeight: number;
  /** Derived percentage that gets cached back to manifest.keyboard.panelHeightPercent. */
  panelHeightPercent: number;
  /** false = keyboard was clamped because canvas height couldn't fit it. */
  isAspectLocked: boolean;
  /** Pixel height of the controls area above the keyboard. */
  controlsAreaHeight: number;
  /** White-key count in this keyboard (used internally for width math). */
  totalWhiteKeys: number;
}

/** Count white keys for a keyboard config (e.g. 49 keys starting at C2 → 28). */
export function computeTotalWhiteKeys(keys: number, startNote: string): number {
  if (keys <= 0) return 0;
  try {
    const lowestMidi = nameToMidiNote(startNote);
    const highestMidi = lowestMidi + keys - 1;
    return generateKeyboardNotes(lowestMidi, highestMidi).filter((n) => !n.isBlack).length;
  } catch {
    return 0;
  }
}

/**
 * Compute keyboard dimensions and aspect-lock status from the manifest inputs.
 * Defensive against invalid input — returns zero-dim layout rather than NaN.
 */
export function computeKeyboardLayout(input: KeyboardLayoutInputs): KeyboardLayout {
  const totalWhiteKeys = computeTotalWhiteKeys(input.keys, input.startNote);
  const widthPercent = Math.max(1, Math.min(100, input.widthPercent));
  const canvasWidth = Math.max(0, input.canvasWidth);
  const canvasHeight = Math.max(0, input.canvasHeight);

  if (totalWhiteKeys === 0 || canvasWidth === 0 || canvasHeight === 0) {
    return {
      keyboardWidth: 0,
      keyboardHeight: 0,
      desiredHeight: 0,
      panelHeightPercent: 100,
      isAspectLocked: false,
      controlsAreaHeight: canvasHeight,
      totalWhiteKeys: 0,
    };
  }

  const keyboardWidth = (canvasWidth * widthPercent) / 100;
  const whiteKeyWidth = keyboardWidth / totalWhiteKeys;
  const desiredHeight = whiteKeyWidth * KEY_ASPECT;

  // Two ceilings, take the lower:
  //   1. canvasHeight - MIN_CONTROLS_PX (always keep some controls room)
  //   2. canvasHeight × MAX_KEYBOARD_HEIGHT_RATIO (keyboard never dominates)
  const maxAllowedHeight = Math.max(
    0,
    Math.min(
      canvasHeight - MIN_CONTROLS_PX,
      canvasHeight * MAX_KEYBOARD_HEIGHT_RATIO,
    ),
  );
  const keyboardHeight = Math.min(desiredHeight, maxAllowedHeight);

  const isAspectLocked = keyboardHeight >= desiredHeight - ASPECT_LOCK_TOLERANCE_PX;
  const controlsAreaHeight = canvasHeight - keyboardHeight;
  const panelHeightPercent = (controlsAreaHeight / canvasHeight) * 100;

  return {
    keyboardWidth,
    keyboardHeight,
    desiredHeight,
    panelHeightPercent,
    isAspectLocked,
    controlsAreaHeight,
    totalWhiteKeys,
  };
}

/**
 * Compute the canvas dimensions that would let the keyboard render at correct
 * aspect WITHOUT changing canvas width or shrinking the controls area.
 */
export interface AutoFitTargetInputs {
  canvasWidth: number;
  canvasHeight: number;
  desiredHeight: number;
  controlsAreaHeight: number;
}

export function computeAutoFitTarget(input: AutoFitTargetInputs): {
  newCanvasWidth: number;
  newCanvasHeight: number;
} {
  const safeControls = Math.max(input.controlsAreaHeight, MIN_CONTROLS_PX);
  // Two constraints — pick the LARGER (most generous) so neither clamp
  // re-engages after the resize:
  //   1. keyboard + current controls   (preserves user's controls room)
  //   2. desiredHeight / MAX_KEYBOARD_HEIGHT_RATIO   (so 65% cap doesn't clamp)
  const heightForControls = input.desiredHeight + safeControls;
  const heightForRatio = input.desiredHeight / MAX_KEYBOARD_HEIGHT_RATIO;
  return {
    newCanvasWidth: input.canvasWidth,
    newCanvasHeight: Math.round(Math.max(heightForControls, heightForRatio)),
  };
}
