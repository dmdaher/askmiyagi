/**
 * EP3b — verify the "✨ Test LEDs" toolbar toggle:
 *   - Default: testLedsActive=false → controls render with ledOn=undefined/false
 *   - Click: testLedsActive=true → every hasLed control renders as ledOn=true
 *   - Screenshots saved to /tmp/ep3b-{off,on}.png for side-by-side review
 */
import { chromium } from 'playwright';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = 'cdj-3000'; // has face-style circle buttons (CUE, PLAY)

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1800, height: 1200 },
    deviceScaleFactor: 1,
  });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);

  await page.goto(`${BASE}/admin/${DEVICE}/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  // ENTER PREVIEW MODE first — Test LEDs is preview-only now
  await page.locator('button', { hasText: /^Preview$/ }).first().click();
  await page.waitForTimeout(800);

  // Find CUE_BTN (face-style circle on cdj-3000) in preview
  const cueLocator = page.locator('[data-control-id="CUE_BTN"]');
  await cueLocator.scrollIntoViewIfNeeded({ timeout: 5_000 });
  const box = await cueLocator.boundingBox();
  if (!box) throw new Error('CUE_BTN not found');

  const clip = { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 60), width: box.width + 120, height: box.height + 120 };

  // Verify default state: testLedsActive = false
  const initialState = await page.evaluate(() => {
    const win = window as unknown as { useEditorStore?: { getState: () => { testLedsActive: boolean } } };
    return win.useEditorStore?.getState().testLedsActive;
  });
  console.log(`Initial testLedsActive: ${initialState}`);

  await page.screenshot({ path: '/tmp/ep3b-off.png', clip });
  console.log('Screenshot saved: /tmp/ep3b-off.png (Preview mode + Test LEDs OFF)');

  // Click the Test LEDs toolbar button (now visible only in preview)
  await page.locator('button', { hasText: /Test LEDs/ }).first().click();
  await page.waitForTimeout(500);

  const onState = await page.evaluate(() => {
    const win = window as unknown as { useEditorStore?: { getState: () => { testLedsActive: boolean } } };
    return win.useEditorStore?.getState().testLedsActive;
  });
  console.log(`After click testLedsActive: ${onState}`);

  if (!onState) {
    console.error('FAIL — toggle did not flip testLedsActive');
    await browser.close();
    process.exit(1);
  }

  await page.screenshot({ path: '/tmp/ep3b-on.png', clip });
  console.log('Screenshot saved: /tmp/ep3b-on.png (Test LEDs ON)');

  // Toggle off again to verify it's symmetrical
  await page.locator('button', { hasText: /Test LEDs/ }).first().click();
  await page.waitForTimeout(400);
  const offAgainState = await page.evaluate(() => {
    const win = window as unknown as { useEditorStore?: { getState: () => { testLedsActive: boolean } } };
    return win.useEditorStore?.getState().testLedsActive;
  });
  if (offAgainState) {
    console.error('FAIL — second click did not toggle off');
    await browser.close();
    process.exit(1);
  }
  console.log(`After 2nd click testLedsActive: ${offAgainState}`);

  await browser.close();
  console.log('PASS — Test LEDs toggle flips state correctly');
})();
