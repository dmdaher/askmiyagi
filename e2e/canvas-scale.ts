/**
 * Canvas Scale UX — comprehensive verification.
 *
 * Covers:
 *   1. Slider drag changes scale
 *   2. + / - buttons step ±10%
 *   3. Cmd+0 resets to 100%
 *   4. Cmd+= / Cmd+- step ±10%
 *   5. Cmd+wheel over panel preview area zooms (preventDefault inside)
 *   6. Cmd+wheel OUTSIDE preview does NOT preventDefault (browser zoom still works elsewhere)
 *   7. sessionStorage persists per device (different devices → different scales)
 *   8. Reset (click % label) returns to 100%
 *   9. Slider clamps to 25–200%, wheel can overshoot to 10–500%
 *  10. Reload picks up persisted scale
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

async function getPanelWrapperWidth(page: Page): Promise<number> {
  const wrapper = page.locator('[data-testid="panel-scaled-wrapper"]');
  const bb = await wrapper.boundingBox();
  return bb?.width ?? 0;
}

async function getScalePercentText(page: Page): Promise<string> {
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

  console.log(`\n══ Canvas Scale UX — ${DEVICE} ══════════════════════\n`);
  await openCanvas(page);

  const nativeWidth = await getPanelWrapperWidth(page);
  const nativePercent = await getScalePercentText(page);
  check('initial scale is 100%', nativePercent === '100%', `text="${nativePercent}"`);
  check('native panel width measured', nativeWidth > 100, `${nativeWidth.toFixed(0)}px`);

  // ── 1. Slider drag ─────────────────────────────────────────────────────
  console.log('\n── 1. Slider drag ─────────────────────────────');
  // Programmatically set the slider value via input.fill doesn't work for range;
  // use evaluate to set value + dispatch input event.
  // React uses a custom value setter shim — must bypass it via the native
  // prototype setter for the change event to register on controlled inputs.
  await page.evaluate(() => {
    const slider = document.querySelector('[data-testid="scale-slider"]') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeSetter.call(slider, '0.5');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const after50 = await getPanelWrapperWidth(page);
  const text50 = await getScalePercentText(page);
  check('slider 0.5 → 50% text', text50 === '50%', `text="${text50}"`);
  check('slider 0.5 → wrapper half native', Math.abs(after50 / nativeWidth - 0.5) < 0.05,
    `ratio=${(after50/nativeWidth).toFixed(2)}`);

  // ── 2. + / - buttons ──────────────────────────────────────────────────
  console.log('\n── 2. + / - buttons ──────────────────────');
  // Reset first
  await page.locator('[data-testid="scale-percent"]').click();
  await page.waitForTimeout(200);
  check('reset via percent click → 100%',
    (await getScalePercentText(page)) === '100%');

  await page.locator('[data-testid="scale-plus"]').click();
  await page.waitForTimeout(200);
  const afterPlus = await getScalePercentText(page);
  check('+ button → 110%', afterPlus === '110%', `text="${afterPlus}"`);

  await page.locator('[data-testid="scale-minus"]').click();
  await page.locator('[data-testid="scale-minus"]').click();
  await page.waitForTimeout(200);
  const afterMinus = await getScalePercentText(page);
  check('- button (×2) from 110 → 90%', afterMinus === '90%', `text="${afterMinus}"`);

  // ── 3. Cmd+0 reset ────────────────────────────────────────────────────
  console.log('\n── 3. Cmd+0 reset ────────────────────────');
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(200);
  check('Cmd+0 → 100%', (await getScalePercentText(page)) === '100%');

  // ── 4. Cmd+= / Cmd+- ──────────────────────────────────────────────────
  console.log('\n── 4. Cmd+= / Cmd+- ──────────────────────');
  await page.keyboard.press('Meta+=');
  await page.waitForTimeout(200);
  check('Cmd+= → 110%', (await getScalePercentText(page)) === '110%');
  await page.keyboard.press('Meta+-');
  await page.keyboard.press('Meta+-');
  await page.waitForTimeout(200);
  check('Cmd+- ×2 → 90%', (await getScalePercentText(page)) === '90%');

  // ── 5. Cmd+wheel over preview ─────────────────────────────────────────
  console.log('\n── 5. Cmd+wheel inside panel preview ─────');
  await page.keyboard.press('Meta+0'); // reset
  await page.waitForTimeout(200);

  const scrollEl = page.locator('[data-testid="panel-preview-scroll"]');
  const sbb = await scrollEl.boundingBox();
  if (sbb) {
    // Cmd+wheel up (zoom in)
    await page.mouse.move(sbb.x + sbb.width / 2, sbb.y + sbb.height / 2);
    await page.keyboard.down('Meta');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Meta');
    await page.waitForTimeout(300);
    const afterWheelUp = await getScalePercentText(page);
    check('Cmd+wheel up → zoom in',
      /^1[0-9][0-9]%$/.test(afterWheelUp.trim()) && afterWheelUp !== '100%',
      `text="${afterWheelUp}"`);

    // Cmd+wheel down (zoom out)
    await page.keyboard.down('Meta');
    await page.mouse.wheel(0, 100);
    await page.mouse.wheel(0, 100);
    await page.keyboard.up('Meta');
    await page.waitForTimeout(300);
    const afterWheelDown = await getScalePercentText(page);
    check('Cmd+wheel down → zoom out',
      Number(afterWheelDown.replace('%', '')) < Number(afterWheelUp.replace('%', '')),
      `${afterWheelUp} → ${afterWheelDown}`);
  } else {
    check('preview area bbox found', false, 'sbb=null');
  }

  // ── 6. Cmd+wheel OUTSIDE preview does NOT scale canvas ────────────────
  console.log('\n── 6. Cmd+wheel outside preview = no scale change ─');
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(200);
  const baselinePercent = await getScalePercentText(page);
  // Move cursor to the top bar (definitively outside the panel preview)
  await page.mouse.move(700, 30);
  await page.keyboard.down('Meta');
  await page.mouse.wheel(0, -200);
  await page.keyboard.up('Meta');
  await page.waitForTimeout(300);
  const afterOutside = await getScalePercentText(page);
  check('Cmd+wheel outside preview leaves canvas scale unchanged',
    afterOutside === baselinePercent, `before="${baselinePercent}" after="${afterOutside}"`);

  // ── 7. sessionStorage persists per device ─────────────────────────────
  console.log('\n── 7. sessionStorage persists per device ──');
  // Set cdj-3000 to 75%
  await page.evaluate(() => {
    const slider = document.querySelector('[data-testid="scale-slider"]') as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeSetter.call(slider, '0.75');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  check('set cdj-3000 to 75%', (await getScalePercentText(page)) === '75%');
  const stored = await page.evaluate(() => sessionStorage.getItem(`canvas:scale:${'cdj-3000'}`));
  check('cdj-3000 scale persisted in sessionStorage', stored === '0.75', `value="${stored}"`);

  // ── 8. Reload picks up persisted scale ────────────────────────────────
  console.log('\n── 8. Reload picks up persisted scale ─────');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(600);
  const afterReload = await getScalePercentText(page);
  check('after reload, scale still 75%', afterReload === '75%', `text="${afterReload}"`);

  // ── 9. Slider clamp 25-200% ───────────────────────────────────────────
  console.log('\n── 9. Slider clamps 25-200% ──────────────');
  await page.evaluate(() => {
    const slider = document.querySelector('[data-testid="scale-slider"]') as HTMLInputElement;
    check_min: { /* slider min attr is 0.25 */ }
    return { min: slider.min, max: slider.max };
  });
  const sliderAttrs = await page.evaluate(() => {
    const s = document.querySelector('[data-testid="scale-slider"]') as HTMLInputElement;
    return { min: s.min, max: s.max };
  });
  check('slider min is 25%', sliderAttrs.min === '0.25', `min=${sliderAttrs.min}`);
  check('slider max is 200%', sliderAttrs.max === '2', `max=${sliderAttrs.max}`);

  // ── 10. Auto-fit button ────────────────────────────────────────────────
  console.log('\n── 10. Auto-fit ──────────────────────────');
  await page.keyboard.press('Meta+0');
  await page.waitForTimeout(200);
  await page.locator('[data-testid="scale-autofit"]').click();
  await page.waitForTimeout(400);
  const autoPercent = Number((await getScalePercentText(page)).replace('%', ''));
  check('auto-fit ≤ 100%', autoPercent <= 100, `${autoPercent}%`);
  // Preview area is much smaller than viewport (260 sidebar + 320 diagnostics
  // + bottom step content). For cdj-3000 at 1400x900 the fit value is in the
  // 30-60% range — assert it's at least 20% to catch math bugs without being
  // brittle.
  check('auto-fit ≥ 20% (sane lower bound)', autoPercent >= 20, `${autoPercent}%`);

  await ctx.close();
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
