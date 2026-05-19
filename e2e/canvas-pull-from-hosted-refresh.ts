/**
 * Q1 fix verification — Pull from hosted must trigger canvas QA refresh.
 *
 * Two-layer test:
 *   1. Static: the pull-from-hosted route SOURCE contains the hook call
 *      (regression guard — if someone removes it, this fails)
 *   2. Dynamic: invoke the underlying refresh helper directly (same code
 *      path the hook fires) and verify qa-report.json mtime advances.
 *      Proves the hook would actually work when called.
 *
 * We don't make a real hosted Blob request — that requires live
 * contractor state. The static check + behavioral test together prove
 * the wiring works.
 */
import fs from 'fs';
import path from 'path';
import { refreshCanvasData, flushPendingRefresh } from '@/lib/pipeline/refresh-canvas-data';

const REPO_ROOT = '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi-wt-pre';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';
const routePath = path.join(
  REPO_ROOT, 'src/app/api/pipeline/[deviceId]/pull-from-hosted/route.ts',
);
const qaPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents/tutorial-review/qa-report.json');

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, ok: boolean, info = '') => {
  if (ok) { console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fails.push(`${label} — ${info}`); fail++; }
};

async function main() {
  console.log(`\n══ Q1 fix — Pull from hosted triggers canvas QA refresh ══\n`);

  // ── 1. Static check: hook is wired in the route ────────────────────────
  console.log('── 1. Static: hook call exists in route source ──');
  const routeSrc = fs.readFileSync(routePath, 'utf-8');
  check('route imports scheduleCanvasDataRefresh',
    /scheduleCanvasDataRefresh/.test(routeSrc));
  check('route CALLS scheduleCanvasDataRefresh',
    /scheduleCanvasDataRefresh\(deviceId\)/.test(routeSrc));
  // Sequencing: hook should be AFTER exportManifest call
  const exportIdx = routeSrc.indexOf('exportManifest(deviceId)');
  const hookIdx = routeSrc.indexOf('scheduleCanvasDataRefresh(deviceId)');
  check('hook fires AFTER exportManifest (sequential)',
    exportIdx > -1 && hookIdx > exportIdx,
    `exportIdx=${exportIdx} hookIdx=${hookIdx}`);

  // ── 2. Dynamic: same refresh path the hook triggers actually works ─────
  console.log('\n── 2. Dynamic: refresh helper advances qa-report mtime ─');
  if (!fs.existsSync(qaPath)) {
    check('qa-report.json exists for ' + DEVICE, false, 'precondition not met');
  } else {
    const before = fs.statSync(qaPath).mtimeMs;
    // Wait 50ms so mtime resolution can register a change
    await new Promise((r) => setTimeout(r, 50));
    await flushPendingRefresh(DEVICE);
    const outcome = await refreshCanvasData(DEVICE, { repoRoot: REPO_ROOT });
    check('refreshCanvasData ran', outcome.ran === true,
      outcome.skippedReason ? `skipped: ${outcome.skippedReason}` : 'ran');
    const after = fs.statSync(qaPath).mtimeMs;
    check('qa-report.json mtime advanced',
      after > before, `before=${before} after=${after}`);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
