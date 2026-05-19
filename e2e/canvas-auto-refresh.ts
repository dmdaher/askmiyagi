/**
 * Canvas auto-refresh poll — end-to-end verification.
 *
 * Covers:
 *   1. mtime endpoint returns numbers
 *   2. While canvas is open, an external file mutation triggers
 *      router.refresh() within ~7s (5s poll + 2s slop)
 *   3. Feature flag (localStorage.canvas-auto-refresh = '0') disables polling
 *
 * Strategy: touch the qa-report.json file directly on disk to simulate an
 * upstream change (editor save would do this via scheduleCanvasDataRefresh).
 * Assert the canvas re-fetches.
 */
import { chromium, BrowserContext } from 'playwright';
import fs from 'fs';
import path from 'path';

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

const PWD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';
const REPO_ROOT = '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi-wt-pre';
const qaPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents', 'tutorial-review', 'qa-report.json');

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: PWD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, ok: boolean, info = '') => {
  if (ok) { console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fails.push(`${label} — ${info}`); fail++; }
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);

  console.log(`\n══ Canvas auto-refresh poll — ${DEVICE} ══════════════\n`);

  // ── 1. mtime endpoint sanity ───────────────────────────────────────────
  console.log('── 1. mtime endpoint sanity ──────────────');
  const probePage = await ctx.newPage();
  await probePage.goto(BASE, { waitUntil: 'domcontentloaded' });
  const mtimeRes = await probePage.evaluate(async (device) => {
    const r = await fetch(`/api/pipeline/${device}/review-tutorials/mtime`);
    return { status: r.status, body: await r.json() };
  }, DEVICE);
  check('mtime endpoint returns 200', mtimeRes.status === 200, `status=${mtimeRes.status}`);
  check('mtime endpoint returns qaReportMtime',
    typeof mtimeRes.body.qaReportMtime === 'number',
    `value=${mtimeRes.body.qaReportMtime}`);
  await probePage.close();

  // ── 2. Open canvas, simulate upstream change, assert reload ────────────
  console.log('\n── 2. File mtime change triggers reload ──');
  const page = await ctx.newPage();

  // Track fetches so we can confirm the canvas re-fetched the page route
  // after our mtime change. The router.refresh() triggers an RSC payload
  // fetch with `?_rsc=...` query param OR refetches the page itself.
  // We'll watch for /admin/<id>/review-tutorials requests.
  let refreshFetches = 0;
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes(`/admin/${DEVICE}/review-tutorials`) &&
        (req.method() === 'GET' || url.includes('_rsc='))) {
      refreshFetches++;
    }
  });

  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(1500);
  // Reset counter after initial load
  refreshFetches = 0;

  // Wait for the polling baseline tick to capture initial mtimes
  await page.waitForTimeout(6000);
  const baselineFetchesAfterBaseline = refreshFetches;

  // Touch the qa-report file (changes mtime without changing content)
  const originalMtime = fs.statSync(qaPath).mtimeMs;
  const newMtime = Date.now();
  fs.utimesSync(qaPath, new Date(), new Date(newMtime));
  console.log(`  · touched qa-report.json (mtime ${originalMtime} → ${newMtime})`);

  // Wait for next poll tick + the refresh fetch
  await page.waitForTimeout(7000);

  check('canvas refetched after qa-report mtime change',
    refreshFetches > baselineFetchesAfterBaseline,
    `baseline=${baselineFetchesAfterBaseline} now=${refreshFetches}`);

  await page.close();

  // ── 3. Feature flag disables polling ───────────────────────────────────
  console.log('\n── 3. Feature flag disable ──────────────');
  const page3 = await ctx.newPage();
  await page3.goto(BASE);
  await page3.evaluate(() => localStorage.setItem('canvas-auto-refresh', '0'));

  let pollFetches = 0;
  page3.on('request', (req) => {
    if (req.url().includes(`/api/pipeline/${DEVICE}/review-tutorials/mtime`)) pollFetches++;
  });
  await page3.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, { waitUntil: 'domcontentloaded' });
  await page3.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page3.waitForTimeout(7000);
  check('feature flag disables mtime polling', pollFetches === 0, `polls=${pollFetches}`);
  // Cleanup the flag for future runs
  await page3.evaluate(() => localStorage.removeItem('canvas-auto-refresh'));
  await page3.close();

  await ctx.close();
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
