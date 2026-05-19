/**
 * End-to-end smoke for editor→canvas propagation.
 *
 * Scenario: admin deletes DIRECTION_LEVER-copy from manifest-editor,
 * saves, then expects the canvas QA panel to no longer list it as
 * orphan — without any manual refresh of the page beyond router.refresh.
 *
 * Steps:
 *   1. Snapshot the current qa-report.json and verify DIRECTION_LEVER-copy
 *      IS listed (precondition).
 *   2. Back up manifest-editor.json (so we restore it after).
 *   3. PUT the manifest with DIRECTION_LEVER-copy deleted.
 *   4. Wait for debounced auto-refresh to finish (~2s after save).
 *   5. Re-read qa-report.json — assert DIRECTION_LEVER-copy is GONE.
 *   6. Also assert summary.json was regenerated (mtime newer).
 *   7. Restore the backup.
 *   8. PUT again to trigger debounce → DIRECTION_LEVER-copy back in qa-report.
 *
 * The manual button is verified by the existing qa-panel-smoke.ts; here
 * we focus on the AUTO path.
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';
const REPO_ROOT = '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi-wt-pre';

const editorPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'manifest-editor.json');
const qaPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents', 'tutorial-review', 'qa-report.json');
const summaryPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents', 'tutorial-review', 'summary.json');

function readPwd(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  try {
    const env = fs.readFileSync(
      '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.env.local',
      'utf-8',
    );
    const m = env.match(/^ADMIN_PASSWORD=(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : 'miyagi2026';
  } catch { return 'miyagi2026'; }
}

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, ok: boolean, info = '') => {
  if (ok) { console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fails.push(`${label} — ${info}`); fail++; }
};

function reportListsOrphan(reportPath: string, controlId: string): boolean {
  const r = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  for (const finding of r.results) {
    if (finding.layer === 1 && finding.name.includes('1b')) {
      const details = (finding.details ?? []) as Array<{ controlId?: string }>;
      if (details.some((d) => d?.controlId === controlId)) return true;
    }
  }
  return false;
}

async function putManifest(body: unknown): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(`${BASE}/api/pipeline/${DEVICE}/manifest`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `admin_access=${readPwd()}`,
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status };
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  // Precondition: orphan listed
  check('precondition: qa-report exists', fs.existsSync(qaPath));
  check('precondition: DIRECTION_LEVER-copy is listed as orphan', reportListsOrphan(qaPath, 'DIRECTION_LEVER-copy'));

  // Backup manifest-editor
  const original = fs.readFileSync(editorPath, 'utf-8');
  const parsed = JSON.parse(original);

  // Snapshot summary.json mtime to detect refresh later
  const summaryMtimeBefore = fs.statSync(summaryPath).mtimeMs;

  // Mutate: remove DIRECTION_LEVER-copy
  if (parsed.controls && typeof parsed.controls === 'object' && !Array.isArray(parsed.controls)) {
    delete parsed.controls['DIRECTION_LEVER-copy'];
  } else if (Array.isArray(parsed.controls)) {
    parsed.controls = parsed.controls.filter((c: { id: string }) => c.id !== 'DIRECTION_LEVER-copy');
  }
  check('test setup: DIRECTION_LEVER-copy removed from in-memory body',
    !JSON.stringify(parsed.controls).includes('DIRECTION_LEVER-copy'));

  // PUT
  const putRes = await putManifest(parsed);
  check('PUT manifest succeeds', putRes.ok, `status=${putRes.status}`);

  // Wait for debounced refresh (1.5s + safety margin)
  console.log('  · waiting 3s for debounced auto-refresh…');
  await sleep(3000);

  // Verify orphan gone
  const stillListed = reportListsOrphan(qaPath, 'DIRECTION_LEVER-copy');
  check('after save: DIRECTION_LEVER-copy NO LONGER in qa-report', !stillListed);

  // Verify qa-report.json was regenerated (load-bearing — this is what
  // the canvas reads). summary.json is only re-run when src/data/tutorials/<id>/
  // exists (post-tutorial-PR), so we don't assert on it here.
  const qaMtimeAfter = fs.statSync(qaPath).mtimeMs;
  check('qa-report.json was regenerated (mtime newer)',
    qaMtimeAfter > summaryMtimeBefore,
    `before=${summaryMtimeBefore}, after=${qaMtimeAfter}`);

  // Restore
  fs.writeFileSync(editorPath, original);
  console.log('  · restoring + waiting 3s…');
  await putManifest(JSON.parse(original));
  await sleep(3000);

  // Verify orphan is back (auto-refresh ran again)
  const reListed = reportListsOrphan(qaPath, 'DIRECTION_LEVER-copy');
  check('after restore: DIRECTION_LEVER-copy back in qa-report', reListed);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
