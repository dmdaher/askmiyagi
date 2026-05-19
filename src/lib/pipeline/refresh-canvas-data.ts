/**
 * refresh-canvas-data — recomputes the data the tutorial-review canvas
 * consumes when something upstream changes (editor save, manual admin
 * refresh).
 *
 * Re-runs:
 *   1. tutorial-validators → summary.json (catches highlightControls
 *      pointing at controls that no longer exist after an editor delete)
 *   2. runDeterministicQa → qa-report.json (1b unreferenced controls,
 *      3 semantic coherence)
 *
 * Skips gracefully when there's no tutorial-review data on disk yet
 * (editor save before pipeline reached tutorial-review pause). Failures
 * are logged but do not throw — editor save flow must not break because
 * of a downstream QA hiccup.
 */
import fs from 'fs';
import path from 'path';
import { runDeterministicQa } from '@/lib/pipeline/canvas-qa';

export interface RefreshOutcome {
  ran: boolean;
  skippedReason?: 'no-tutorials' | 'no-manifest';
  validatorErrors?: number;
  validatorWarnings?: number;
  qaFails?: number;
  qaWarns?: number;
  error?: string;
}

const reviewDirFor = (deviceId: string, repoRoot = process.cwd()) =>
  path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review');
const productionManifestFor = (deviceId: string, repoRoot = process.cwd()) =>
  path.join(repoRoot, 'src', 'data', 'manifests', `${deviceId}.json`);

export async function refreshCanvasData(
  deviceId: string,
  opts: { repoRoot?: string } = {},
): Promise<RefreshOutcome> {
  const repoRoot = opts.repoRoot ?? process.cwd();
  const reviewDir = reviewDirFor(deviceId, repoRoot);

  if (!fs.existsSync(path.join(reviewDir, 'tutorials.json'))) {
    return { ran: false, skippedReason: 'no-tutorials' };
  }
  if (!fs.existsSync(productionManifestFor(deviceId, repoRoot))) {
    return { ran: false, skippedReason: 'no-manifest' };
  }

  const outcome: RefreshOutcome = { ran: true };

  // 1. Re-run tutorial-validators IF source .ts tutorial files exist in
  //    src/data/tutorials/<id>/ (only the case AFTER tutorial-pr has run).
  //    Pre-tutorial-pr, tutorials live only as a JSON snapshot in
  //    .pipeline/<id>/agents/tutorial-review/tutorials.json — the
  //    validator can't ingest those directly. The canvas-qa Layer 1a
  //    catches missing-control references against the JSON snapshot, so
  //    we don't lose coverage by skipping this step pre-PR.
  const tutorialsBaseDir = path.join(repoRoot, 'src', 'data', 'tutorials');
  const deviceTutorialsDir = path.join(tutorialsBaseDir, deviceId);
  if (fs.existsSync(deviceTutorialsDir)) {
    try {
      const { validateGeneratedTutorials } = await import('@/lib/pipeline/tutorial-validators');
      const summary = await validateGeneratedTutorials(deviceId, {
        preferPipelineManifest: false,
        tutorialsBaseDir,
      });
      fs.writeFileSync(path.join(reviewDir, 'summary.json'), JSON.stringify(summary, null, 2));
      outcome.validatorErrors = summary.totalErrors;
      outcome.validatorWarnings = summary.totalWarnings;
    } catch (err) {
      outcome.error = `validator: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // 2. Re-run deterministic QA
  try {
    const report = runDeterministicQa({ deviceId, repoRoot });
    outcome.qaFails = report.results.filter((r) => r.severity === 'fail').length;
    outcome.qaWarns = report.results.filter((r) => r.severity === 'warn').length;
  } catch (err) {
    outcome.error =
      (outcome.error ? outcome.error + '; ' : '') +
      `qa: ${err instanceof Error ? err.message : String(err)}`;
  }

  return outcome;
}

// ── Debounced auto-refresh ──────────────────────────────────────────────
//
// Per-device timer map. Editor autosaves can come every ~800ms (debounced
// client-side); we add a server-side debounce on top so a burst of saves
// produces a single re-run after the user pauses for 1.5s.
//
// Module-level state in Next.js dev mode is preserved across requests
// within the same process — exactly what we want here.
const DEBOUNCE_MS = 1500;
const pendingTimers = new Map<string, NodeJS.Timeout>();
const lastRunPromise = new Map<string, Promise<RefreshOutcome>>();

export function scheduleCanvasDataRefresh(
  deviceId: string,
  opts: { repoRoot?: string; onComplete?: (outcome: RefreshOutcome) => void } = {},
): void {
  const existing = pendingTimers.get(deviceId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(async () => {
    pendingTimers.delete(deviceId);
    const p = refreshCanvasData(deviceId, opts).catch(
      (err): RefreshOutcome => ({ ran: false, error: err instanceof Error ? err.message : String(err) }),
    );
    lastRunPromise.set(deviceId, p);
    const outcome = await p;
    opts.onComplete?.(outcome);
  }, DEBOUNCE_MS);
  pendingTimers.set(deviceId, t);
}

/** Used by tests / hooks that want to await any pending debounced run. */
export async function flushPendingRefresh(deviceId: string): Promise<RefreshOutcome | null> {
  const existing = pendingTimers.get(deviceId);
  if (existing) {
    clearTimeout(existing);
    pendingTimers.delete(deviceId);
    const outcome = await refreshCanvasData(deviceId);
    lastRunPromise.set(deviceId, Promise.resolve(outcome));
    return outcome;
  }
  return (await lastRunPromise.get(deviceId)) ?? null;
}
