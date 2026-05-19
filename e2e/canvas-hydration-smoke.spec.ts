/**
 * Real-browser smoke test for the tutorial-review canvas + hydration cleanliness.
 *
 * This is the test I should have run BEFORE claiming the fixes worked.
 *
 * Asserts:
 *   1. Canvas loads at /admin/<id>/review-tutorials without 404
 *   2. No React hydration mismatch errors in console
 *   3. No "Tutorial review not ready" overlay
 *   4. Sidebar lists tutorials, panel area is visible
 *   5. Takes a screenshot for visual confirmation
 *
 * Browser: chromium headless, NO extensions (Grammarly etc. not loaded).
 * If hydration still warns in clean browser, the SSR/CSR markup actually
 * differs and my fix doesn't apply.
 */
import { chromium, BrowserContext } from 'playwright';
import fs from 'fs';

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

const ADMIN_PASSWORD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.env.TEST_DEVICE || 'cdj-3000';

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, info: string) => {
  if (ok) { console.log(`  ✓ ${label} — ${info}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fail++; }
};

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();

  // Capture EVERY console error, EVERY page error, every failed request.
  // Hydration warnings come through as console.error in Next dev mode.
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`));

  // Navigate to the canvas page
  console.log(`\nNavigating to ${BASE}/admin/${DEVICE_ID}/review-tutorials`);
  // domcontentloaded (not networkidle) — admin layout opens an SSE
  // connection to /api/.../logs which keeps the network active forever.
  await page.goto(`${BASE}/admin/${DEVICE_ID}/review-tutorials`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);  // let hydration finish, any warnings emit

  // [1] Canvas rendered? (look for the test-id we added)
  const canvasVisible = await page.locator('[data-testid="tutorial-review-canvas"]').isVisible().catch(() => false);
  check('canvas renders (no 404, no overlay)', canvasVisible, `visible=${canvasVisible}`);

  // [2] Device name in header
  const deviceName = await page.locator('[data-testid="review-device-name"]').textContent().catch(() => null);
  check('header shows device name', !!deviceName?.includes('cdj-3000') || !!deviceName?.toLowerCase().includes('cdj'), `text="${deviceName}"`);

  // [3] Tutorial list has rows
  const rowCount = await page.locator('[data-testid^="tutorial-row-"]').count();
  check('tutorial list rows present', rowCount > 0, `${rowCount} rows`);

  // [4] No "not ready" overlay visible
  const notReady = await page.locator('text=Tutorial review not ready').isVisible().catch(() => false);
  check('no "not ready" overlay', !notReady, notReady ? 'OVERLAY VISIBLE — fix did not deploy' : 'overlay absent');

  // [5] No React hydration mismatch errors
  const hydrationErrors = consoleErrors.filter((e) =>
    /hydration|hydrated.*didn't match|Text content does not match|server.*rendered HTML/i.test(e),
  );
  check(
    'no hydration mismatch errors',
    hydrationErrors.length === 0,
    hydrationErrors.length === 0
      ? 'clean'
      : `${hydrationErrors.length} found: ${hydrationErrors.map((e) => e.slice(0, 80)).join(' | ')}`,
  );

  // [6] No page errors (JS exceptions)
  check(
    'no page errors',
    pageErrors.length === 0,
    pageErrors.length === 0 ? 'clean' : pageErrors.join('\n'),
  );

  // [7] No failed network requests (excluding favicon/etc cosmetics)
  const realFailures = failedRequests.filter((f) => !/favicon|analytics|sourceMappingURL/i.test(f));
  check('no failed network requests', realFailures.length === 0, realFailures.length === 0 ? 'clean' : realFailures.join('\n'));

  // [8] Inspect served HTML — does it contain suppressHydrationWarning's effect?
  // (React doesn't emit suppressHydrationWarning as an attribute on the rendered
  // HTML, but the absence of the warning is the actual signal — captured above.)
  // Belt+suspenders: verify body className still matches what we expect.
  const bodyClass = await page.locator('body').getAttribute('class');
  check('body class intact', bodyClass?.includes('min-h-screen') === true, `class="${bodyClass}"`);

  // [9] Screenshot for visual evidence
  const screenshotPath = '/tmp/canvas-smoke-screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`\n  📸 Screenshot saved: ${screenshotPath}`);

  await browser.close();
}

run().then(() => {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}).catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});
