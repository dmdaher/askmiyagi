/**
 * Visual verification: label-backlit rect button glows its label when
 * Test LEDs is on in preview. Force QUANTIZE to label-backlit + green
 * ledColor and capture before/after screenshots.
 */
import { chromium } from 'playwright';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: 'admin_access', value: ADMIN_PASSWORD, domain: 'localhost', path: '/', sameSite: 'Lax' }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);

  await page.goto(`${BASE}/admin/cdj-3000/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  // Force QUANTIZE to label-backlit with a saturated green ledColor
  await page.evaluate(() => {
    const w = window as any;
    w.useEditorStore?.getState().updateControlProp(['QUANTIZE'], 'ledStyle', 'label-backlit');
    w.useEditorStore?.getState().updateControlProp(['QUANTIZE'], 'hasLed', true);
    w.useEditorStore?.getState().updateControlProp(['QUANTIZE'], 'ledColor', '#22c55e');
  });
  await page.waitForTimeout(400);

  await page.locator('button', { hasText: /^Preview$/ }).first().click();
  await page.waitForTimeout(1000);

  const q = page.locator('[data-control-id="QUANTIZE"]');
  await q.scrollIntoViewIfNeeded({ timeout: 3_000 });
  const box = await q.boundingBox();
  if (!box) throw new Error('QUANTIZE not visible');
  const clip = { x: Math.max(0, box.x - 50), y: Math.max(0, box.y - 50), width: box.width + 100, height: box.height + 100 };

  // BEFORE Test LEDs (editor-hint state — label at 60% alpha green)
  await page.screenshot({ path: '/tmp/labelbacklit-before.png', clip });

  // Inspect label style PRE-toggle
  const styleBefore = await page.evaluate(() => {
    const wrap = document.querySelector('[data-control-id="QUANTIZE"]');
    const span = wrap?.querySelector('button span');
    if (!span) return null;
    const cs = window.getComputedStyle(span);
    return { color: cs.color, textShadow: cs.textShadow };
  });
  console.log(`Pre-toggle label style: ${JSON.stringify(styleBefore)}`);

  // Toggle Test LEDs
  await page.locator('button[title*="Test LEDs"]').first().click();
  await page.waitForTimeout(800);

  const styleAfter = await page.evaluate(() => {
    const wrap = document.querySelector('[data-control-id="QUANTIZE"]');
    const span = wrap?.querySelector('button span');
    if (!span) return null;
    const cs = window.getComputedStyle(span);
    return { color: cs.color, textShadow: cs.textShadow };
  });
  console.log(`Post-toggle label style: ${JSON.stringify(styleAfter)}`);

  await page.screenshot({ path: '/tmp/labelbacklit-after.png', clip });

  await browser.close();
  console.log('Screenshots saved to /tmp/labelbacklit-{before,after}.png');
})();
