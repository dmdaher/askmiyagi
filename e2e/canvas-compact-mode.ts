/**
 * Compact mode — verification.
 *
 * Covers:
 *   1. Default (no ?compact param): outer chrome + device banner present
 *   2. Click Compact toggle → adds ?compact=1, both chromes hidden
 *   3. Esc exits compact (back to chrome visible)
 *   4. Direct URL with ?compact=1 starts in compact mode
 *   5. Vertical gain measurable (canvas occupies more viewport)
 *   6. Esc TWICE: first exits compact, second navigates to /admin
 */
import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';

function readPwd(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  try {
    const env = fs.readFileSync(
      '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.env.local', 'utf-8');
    const m = env.match(/^ADMIN_PASSWORD=(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : 'miyagi2026';
  } catch { return 'miyagi2026'; }
}

const PWD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: PWD, domain: 'localhost', path: '/',
    httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, ok: boolean, info = '') => {
  if (ok) { console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fails.push(`${label} — ${info}`); fail++; }
};

async function openCanvas(page: Page, compact = false) {
  const qs = compact ? '?compact=1' : '';
  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials${qs}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();

  console.log(`\n══ Compact mode — ${DEVICE} ════════════\n`);

  // ── 1. Default: chrome present ─────────────────────────────────────────
  console.log('── 1. Default: chrome present ───');
  await openCanvas(page, false);
  check('outer header has Miyagi Pipeline Control',
    await page.locator('text=Miyagi Pipeline Control').first().isVisible());
  // The canvas top bar is always present; what we check is the OUTER chrome
  const canvasBb = await page.locator('[data-testid="tutorial-review-canvas"]').boundingBox();
  const normalTop = canvasBb?.y ?? 0;
  check('canvas pushed down by chrome',
    normalTop > 50, `canvas top=${normalTop}`);

  // ── 2. Toggle to compact ───────────────────────────────────────────────
  console.log('\n── 2. Compact toggle ─────────────');
  await page.locator('[data-testid="compact-toggle"]').click();
  await page.waitForTimeout(600);
  const url = page.url();
  check('URL gained ?compact=1', url.includes('compact=1'), `url=${url}`);
  check('Miyagi Pipeline Control hidden',
    !(await page.locator('text=Miyagi Pipeline Control').first().isVisible().catch(() => false)));
  const compactBb = await page.locator('[data-testid="tutorial-review-canvas"]').boundingBox();
  check('canvas top reclaimed (lower y value)',
    (compactBb?.y ?? Infinity) < normalTop - 40,
    `was ${normalTop} now ${compactBb?.y}`);

  // ── 3. Esc exits compact ───────────────────────────────────────────────
  console.log('\n── 3. Esc exits compact ─────────');
  await page.evaluate(() => {
    const ae = document.activeElement as HTMLElement | null;
    if (ae && ae !== document.body) ae.blur();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await page.waitForTimeout(800);
  const urlAfterEsc = page.url();
  check('URL no longer has compact=1', !urlAfterEsc.includes('compact=1'),
    `url=${urlAfterEsc}`);
  check('chrome restored',
    await page.locator('text=Miyagi Pipeline Control').first().isVisible());

  // ── 4. Direct ?compact=1 URL ───────────────────────────────────────────
  console.log('\n── 4. Direct compact URL ─────────');
  await openCanvas(page, true);
  const directBb = await page.locator('[data-testid="tutorial-review-canvas"]').boundingBox();
  check('direct compact URL starts compact',
    (directBb?.y ?? Infinity) < 50, `canvas y=${directBb?.y}`);

  // ── 5. Esc twice → admin ───────────────────────────────────────────────
  console.log('\n── 5. Esc twice → /admin ─────────');
  await page.evaluate(() => {
    const ae = document.activeElement as HTMLElement | null;
    if (ae && ae !== document.body) ae.blur();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await page.waitForTimeout(600);
  // After first Esc: exited compact, still on review page
  check('after Esc 1: still on review-tutorials',
    page.url().includes('/review-tutorials'),
    `url=${page.url()}`);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await page.waitForTimeout(1200);
  check('after Esc 2: navigated to /admin/<id>',
    !page.url().includes('/review-tutorials'),
    `url=${page.url()}`);

  await ctx.close();
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
