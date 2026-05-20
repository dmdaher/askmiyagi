/**
 * Floating step control — verification.
 *
 * 4 modes: anchored / floating / mini / hidden.
 * Each cyclable via the mode-cluster buttons.
 * Position persisted per device. Drag clamps to viewport.
 *
 * Covers:
 *   1. anchored default
 *   2. mode buttons present (anchored/floating/mini/hidden)
 *   3. switching to floating renders absolutely-positioned card
 *   4. switching to mini renders pill with step info + nav
 *   5. switching to hidden renders reveal chip only (no step block)
 *   6. reveal chip restores anchored
 *   7. mode persisted across reload
 *   8. dragging floating card moves it
 *   9. position persisted across reload
 *  10. switching to anchored re-mounts in-flow
 *  11. nav buttons in mini still work
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

async function openCanvas(page: Page) {
  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(800);
}

async function clearStepControlState(ctx: BrowserContext) {
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate((d) => {
    sessionStorage.removeItem(`canvas:step-control:${d}`);
    sessionStorage.removeItem(`canvas:step-control:pos:${d}`);
  }, DEVICE);
  await p.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  await clearStepControlState(ctx);
  const page = await ctx.newPage();

  console.log(`\n══ Floating step control — ${DEVICE} ════════════\n`);
  await openCanvas(page);

  // ── 1. anchored default ────────────────────────────────────────────────
  console.log('── 1. anchored default ──────────────');
  check('anchored block present',
    (await page.locator('[data-testid="step-control-anchored"]').count()) === 1);
  check('floating block absent',
    (await page.locator('[data-testid="step-control-floating"]').count()) === 0);

  // ── 2. mode buttons present ────────────────────────────────────────────
  console.log('\n── 2. mode buttons present ─────────');
  for (const m of ['anchored', 'floating', 'mini', 'hidden']) {
    check(`mode button ${m} exists`,
      (await page.locator(`[data-testid="step-mode-${m}"]`).count()) === 1);
  }

  // ── 3. switch to floating ──────────────────────────────────────────────
  console.log('\n── 3. switch to floating ────────────');
  await page.locator('[data-testid="step-mode-floating"]').click();
  await page.waitForTimeout(300);
  check('floating block visible',
    await page.locator('[data-testid="step-control-floating"]').isVisible());
  check('anchored block gone',
    (await page.locator('[data-testid="step-control-anchored"]').count()) === 0);

  // ── 4. switch to mini ──────────────────────────────────────────────────
  console.log('\n── 4. switch to mini ────────────────');
  await page.locator('[data-testid="step-mode-mini"]').click();
  await page.waitForTimeout(300);
  check('mini pill visible',
    await page.locator('[data-testid="step-control-mini"]').isVisible());
  const miniBox = await page.locator('[data-testid="step-control-mini"]').boundingBox();
  check('mini is short (≤ 48px tall)',
    (miniBox?.height ?? 0) <= 48,
    `height=${miniBox?.height?.toFixed(0)}px`);

  // ── 11. nav buttons in mini work ───────────────────────────────────────
  console.log('\n── 5. nav in mini works ─────────────');
  const stepBefore = await page.locator('[data-testid="current-step-num"]').textContent();
  await page.locator('[data-testid="step-control-mini"] >> text=›').click();
  await page.waitForTimeout(200);
  const stepAfter = await page.locator('[data-testid="current-step-num"]').textContent();
  check('mini next button advances step', stepBefore !== stepAfter,
    `before="${stepBefore?.trim()}" after="${stepAfter?.trim()}"`);

  // ── 5. switch to hidden ────────────────────────────────────────────────
  console.log('\n── 6. switch to hidden ──────────────');
  await page.locator('[data-testid="step-mode-hidden"]').click();
  await page.waitForTimeout(300);
  check('hidden mode — mini gone',
    (await page.locator('[data-testid="step-control-mini"]').count()) === 0);
  check('hidden mode — reveal chip visible',
    await page.locator('[data-testid="step-control-reveal"]').isVisible());

  // ── 6. reveal chip restores anchored ───────────────────────────────────
  console.log('\n── 7. reveal restores anchored ─────');
  await page.locator('[data-testid="step-control-reveal"]').click();
  await page.waitForTimeout(300);
  check('back to anchored',
    (await page.locator('[data-testid="step-control-anchored"]').count()) === 1);

  // ── 7. mode persisted across reload ────────────────────────────────────
  console.log('\n── 8. mode persists across reload ──');
  await page.locator('[data-testid="step-mode-floating"]').click();
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(800);
  check('after reload: floating mode active',
    (await page.locator('[data-testid="step-control-floating"]').count()) === 1);

  // ── 8. drag moves the card ─────────────────────────────────────────────
  console.log('\n── 9. drag moves floating card ─────');
  const card = page.locator('[data-testid="step-control-floating"]');
  const before = await card.boundingBox();
  if (!before) throw new Error('floating card not found');
  // Drag the header (where the draghandle lives) leftward
  const handle = page.locator('[data-testid="step-control-floating"] [data-testid="step-control-draghandle"]').first();
  const handleBb = await handle.boundingBox();
  if (handleBb) {
    await page.mouse.move(handleBb.x + 50, handleBb.y + handleBb.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBb.x + 50 - 200, handleBb.y + handleBb.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(300);
    const after = await card.boundingBox();
    check('card x position changed after drag',
      Math.abs((after?.x ?? 0) - before.x) >= 50,
      `before x=${before.x.toFixed(0)} after x=${after?.x?.toFixed(0)}`);
  }

  // ── 9. position persisted ──────────────────────────────────────────────
  console.log('\n── 10. position persists across reload ─');
  const positioned = await card.boundingBox();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(800);
  const after2 = await page.locator('[data-testid="step-control-floating"]').boundingBox();
  if (positioned && after2) {
    check('floating card position preserved after reload',
      Math.abs(after2.x - positioned.x) < 10 && Math.abs(after2.y - positioned.y) < 10,
      `was ${positioned.x.toFixed(0)},${positioned.y.toFixed(0)} now ${after2.x.toFixed(0)},${after2.y.toFixed(0)}`);
  }

  // ── 10. switch back to anchored cleans up ──────────────────────────────
  console.log('\n── 11. back to anchored cleans up ──');
  // Mode cluster is INSIDE the floating card now (header)
  await page.locator('[data-testid="step-control-floating"] [data-testid="step-mode-anchored"]').click();
  await page.waitForTimeout(300);
  check('anchored block returns',
    (await page.locator('[data-testid="step-control-anchored"]').count()) === 1);
  check('floating block gone',
    (await page.locator('[data-testid="step-control-floating"]').count()) === 0);

  await ctx.close();
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
