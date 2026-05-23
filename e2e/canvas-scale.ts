/**
 * Canvas Scale UX — editor-parity verification.
 *
 * After PR-G-rev the canvas scale matches the editor's `Scale:` cluster
 * exactly: `[−] [%] [+] [⤢ Scale…]`. No slider, no auto-fit button.
 *
 * Covers:
 *   1. Toolbar renders the editor-parity row (label + 4 buttons, NO slider)
 *   2. − button scales DOWN to 80% of current (editor's scaleCanvas(0.8))
 *   3. + button scales UP to 125% of current (editor's scaleCanvas(1.25))
 *   4. Click % resets to 100%
 *   5. Cmd+0 / Cmd+= / Cmd+- keyboard shortcuts (invisible, power-user)
 *   6. Cmd+wheel inside panel preview scales (preventDefault inside only)
 *   7. Cmd+wheel OUTSIDE preview does not scale
 *   8. sessionStorage persists per device
 *   9. Reload picks up persisted scale
 *  10. Modal opens via ⤢ Scale… and preset buttons set the value
 *  11. Modal Apply commits the value to scale state
 *  12. Modal Cancel discards changes
 *  13. Modal percent input + Enter commits
 *  14. Modal Esc closes without changes
 *  15. Slider element does NOT exist in DOM (regression guard)
 *  16. ⇆ Fit button does NOT exist in DOM (regression guard)
 */
import { chromium, BrowserContext, Page } from 'playwright';
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

const PWD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';

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

async function openCanvas(page: Page, device = DEVICE) {
  await page.goto(`${BASE}/admin/${device}/review-tutorials`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(800);
}

async function getScalePercent(page: Page): Promise<string> {
  return (await page.locator('[data-testid="scale-percent"]').textContent()) ?? '';
}

async function clearSessionScale(ctx: BrowserContext, device = DEVICE) {
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((d) => sessionStorage.removeItem(`canvas:scale:${d}`), device);
  await page.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  await clearSessionScale(ctx);
  const page = await ctx.newPage();

  console.log(`\n══ Canvas Scale UX (editor parity) — ${DEVICE} ════════════\n`);
  await openCanvas(page);

  // ── 15+16. Regression guards: old elements GONE ────────────────────────
  console.log('── 0. Regression: removed elements ───');
  check('slider element is GONE', (await page.locator('[data-testid="scale-slider"]').count()) === 0);
  check('⇆ Fit button is GONE', (await page.locator('[data-testid="scale-autofit"]').count()) === 0);

  // ── 1. Editor-parity row renders ───────────────────────────────────────
  console.log('\n── 1. Editor-parity row ──────────────');
  const toolbar = page.locator('[data-testid="canvas-scale-toolbar"]');
  check('Scale: label visible', (await toolbar.locator('text=Scale:').count()) > 0);
  check('− button present', (await page.locator('[data-testid="scale-minus"]').count()) === 1);
  check('% display present', (await page.locator('[data-testid="scale-percent"]').count()) === 1);
  check('+ button present', (await page.locator('[data-testid="scale-plus"]').count()) === 1);
  check('⤢ Scale… button present', (await page.locator('[data-testid="scale-modal-open"]').count()) === 1);

  // Initial scale: auto-fit on first visit (computeAutoFit returns a
  // clamped value in [50, 100]%). For cdj-3000 at 1400×900 viewport the
  // height constraint forces ≥ 50% floor.
  const initial = await getScalePercent(page);
  check('initial scale auto-fit (≤ 100%, ≥ 50%)',
    /%/.test(initial) && Number(initial.replace('%','')) >= 50 && Number(initial.replace('%','')) <= 100,
    `text="${initial}"`);

  // Reset to 100% for subsequent button tests
  await page.locator('[data-testid="scale-percent"]').click();
  await page.waitForTimeout(200);

  // ── 2. − scales DOWN to 80% (multiplicative, editor parity) ────────────
  console.log('\n── 2. − button (× 0.8) ────────────────');
  await page.locator('[data-testid="scale-minus"]').click();
  await page.waitForTimeout(200);
  const afterMinus = await getScalePercent(page);
  check('after −: 100 → 80%', afterMinus === '80%', `text="${afterMinus}"`);

  // ── 3. + scales UP to 125% (multiplicative) ────────────────────────────
  console.log('\n── 3. + button (× 1.25) ──────────────');
  await page.locator('[data-testid="scale-percent"]').click(); // reset to 100%
  await page.waitForTimeout(200);
  await page.locator('[data-testid="scale-plus"]').click();
  await page.waitForTimeout(200);
  const afterPlus = await getScalePercent(page);
  check('after +: 100 → 125%', afterPlus === '125%', `text="${afterPlus}"`);

  // ── 4. Reset via % click ───────────────────────────────────────────────
  console.log('\n── 4. % click resets ──────────────────');
  await page.locator('[data-testid="scale-percent"]').click();
  await page.waitForTimeout(200);
  check('% click → 100%', (await getScalePercent(page)) === '100%');

  // ── 5. Cmd+0 / Cmd+= / Cmd+- (invisible power shortcuts) ───────────────
  console.log('\n── 5. Keyboard shortcuts ──────────────');
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(200);
  check('Cmd+= → 110%', (await getScalePercent(page)) === '110%');
  await page.keyboard.press('Meta+-');
  await page.keyboard.press('Meta+-');
  await page.waitForTimeout(200);
  check('Cmd+- ×2 → 90%', (await getScalePercent(page)) === '90%');
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(200);
  check('Cmd+0 → 100%', (await getScalePercent(page)) === '100%');

  // ── 6. Cmd+wheel inside preview ────────────────────────────────────────
  console.log('\n── 6. Cmd+wheel inside preview ───────');
  const scrollEl = page.locator('[data-testid="panel-preview-scroll"]');
  const sbb = await scrollEl.boundingBox();
  if (sbb) {
    await page.mouse.move(sbb.x + sbb.width / 2, sbb.y + sbb.height / 2);
    await page.keyboard.down('Meta');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Meta');
    await page.waitForTimeout(300);
    const afterWheel = await getScalePercent(page);
    check('Cmd+wheel up zooms in',
      afterWheel !== '100%' && Number(afterWheel.replace('%','')) > 100,
      `text="${afterWheel}"`);
  }

  // ── 7. Cmd+wheel outside preview ───────────────────────────────────────
  console.log('\n── 7. Cmd+wheel outside preview = no change ─');
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(200);
  const baseline = await getScalePercent(page);
  await page.mouse.move(700, 30);
  await page.keyboard.down('Meta');
  await page.mouse.wheel(0, -200);
  await page.keyboard.up('Meta');
  await page.waitForTimeout(300);
  check('outside preview: scale unchanged',
    (await getScalePercent(page)) === baseline, `baseline="${baseline}"`);

  // ── 8. sessionStorage persists per device ──────────────────────────────
  console.log('\n── 8. sessionStorage per device ──────');
  await page.locator('[data-testid="scale-plus"]').click(); // → 125%
  await page.waitForTimeout(200);
  const stored = await page.evaluate(() =>
    sessionStorage.getItem(`canvas:scale:${'cdj-3000'}`));
  check('sessionStorage value set', stored !== null);
  check('persisted value rounds to 125%',
    stored !== null && Math.round(Number(stored) * 100) === 125,
    `stored=${stored}`);

  // ── 9. Reload picks up persisted scale ─────────────────────────────────
  console.log('\n── 9. Reload picks up persisted scale ─');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(600);
  check('after reload, scale persisted',
    (await getScalePercent(page)) === '125%',
    `text="${await getScalePercent(page)}"`);

  // Reset to 100% before modal tests
  await page.locator('[data-testid="scale-percent"]').click();
  await page.waitForTimeout(200);

  // ── 10. Modal opens ────────────────────────────────────────────────────
  console.log('\n── 10. Modal opens ───────────────────');
  await page.locator('[data-testid="scale-modal-open"]').click();
  await page.waitForTimeout(300);
  const modalVisible = await page.locator('[data-testid="canvas-scale-modal"]').isVisible();
  check('⤢ Scale… opens modal', modalVisible);

  // ── 11. Presets set the input value ────────────────────────────────────
  console.log('\n── 11. Preset 150 sets input ─────────');
  await page.locator('[data-testid="canvas-scale-preset-150"]').click();
  await page.waitForTimeout(150);
  const inputVal = await page.locator('[data-testid="canvas-scale-modal-input"]').inputValue();
  check('preset 150 → input=150', inputVal === '150', `value="${inputVal}"`);

  // ── 12. Apply commits ──────────────────────────────────────────────────
  console.log('\n── 12. Apply commits 150% ────────────');
  await page.locator('[data-testid="canvas-scale-modal-apply"]').click();
  await page.waitForTimeout(300);
  check('after Apply: 150%', (await getScalePercent(page)) === '150%');
  check('modal closed', (await page.locator('[data-testid="canvas-scale-modal"]').count()) === 0);

  // ── 13. Reset, open modal, custom value + Enter ────────────────────────
  console.log('\n── 13. Custom value via Enter ────────');
  await page.locator('[data-testid="scale-percent"]').click(); // reset 100%
  await page.waitForTimeout(200);
  await page.locator('[data-testid="scale-modal-open"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-testid="canvas-scale-modal-input"]').fill('175');
  await page.locator('[data-testid="canvas-scale-modal-input"]').press('Enter');
  await page.waitForTimeout(300);
  check('custom 175 → 175%', (await getScalePercent(page)) === '175%');

  // ── 14. Cancel discards ────────────────────────────────────────────────
  console.log('\n── 14. Cancel discards changes ──────');
  await page.locator('[data-testid="scale-modal-open"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-testid="canvas-scale-modal-input"]').fill('50');
  await page.locator('[data-testid="canvas-scale-modal-cancel"]').click();
  await page.waitForTimeout(200);
  check('Cancel preserves prior scale',
    (await getScalePercent(page)) === '175%',
    `text="${await getScalePercent(page)}"`);

  // ── 15. Esc closes modal ───────────────────────────────────────────────
  console.log('\n── 15. Esc closes modal ──────────────');
  await page.locator('[data-testid="scale-modal-open"]').click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Esc closed modal',
    (await page.locator('[data-testid="canvas-scale-modal"]').count()) === 0);

  await ctx.close();
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
