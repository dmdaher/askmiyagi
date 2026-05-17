/**
 * Phase 10.1 — auto-compute a sensible `controlScale` for FRESH instruments
 * by sampling the typical control bounding-box width from the manifest.
 *
 * Why not physical dimensions (Phase 10.0)? Each device's pipeline emits
 * different bbox conventions for the same control type — fantom-06 knobs
 * are 113px wide while cdj-3000 knobs are 32px. Normalizing by physical mm
 * can't recover from that variance; sampling the actual measured controls
 * does.
 *
 * Formula: pick the median bbox width of button+knob controls and choose a
 * controlScale that lands them at TARGET_EFFECTIVE_PX on screen, clamped
 * to [MIN_SCALE, MAX_SCALE].
 *
 * Calibration: TARGET_EFFECTIVE_PX = 40 — close to fantom-06's working
 * effective size (113×0.30 ≈ 34) and cdj-3000's (32 at scale 1.0), so the
 * three existing edited instruments would all land near 40 if we re-fit
 * them. The gate (autoFitControlScale only runs when controlScale is unset)
 * keeps them untouched in practice.
 */

const TARGET_EFFECTIVE_PX = 40;
const MIN_SCALE = 0.15;
const MAX_SCALE = 1.0;
const MIN_SAMPLE = 3;

export interface ControlSample {
  type: string;
  w: number;
  h: number;
}

export interface DeviceDimensions {
  widthMm: number;
  depthMm: number;
}

/**
 * Compute a sensible controlScale for a fresh instrument by sampling
 * its button+knob bbox widths.
 *
 * Returns `null` when fewer than 3 button/knob samples are present —
 * treat as "don't auto-fit; leave controlScale alone."
 */
export function computeControlScaleFromControls(
  controls: ReadonlyArray<ControlSample> | null | undefined,
): number | null {
  if (!controls || controls.length === 0) return null;
  const sample = controls.filter(
    (c) => (c.type === 'button' || c.type === 'knob') && c.w > 0,
  );
  if (sample.length < MIN_SAMPLE) return null;
  const widths = sample.map((c) => c.w).sort((a, b) => a - b);
  const median = widths[Math.floor(widths.length / 2)];
  if (median <= 0) return null;
  const raw = TARGET_EFFECTIVE_PX / median;
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
  return Math.round(clamped * 100) / 100;
}

/**
 * @deprecated Phase 10.0 formula — kept as a thin wrapper for any caller
 * we missed. Internally ignores its inputs and returns null so the
 * autoFitControlScale store action no-ops, preserving existing behavior.
 *
 * Will be removed in a follow-up commit after CI green.
 */
export function computeControlScaleFromDeviceDims(
  _dimensions: DeviceDimensions | null | undefined,
  _canvasWidth: number | null | undefined,
): number | null {
  return null;
}

export const __PHASE_10_CONSTANTS = {
  TARGET_EFFECTIVE_PX,
  MIN_SCALE,
  MAX_SCALE,
  MIN_SAMPLE,
};
