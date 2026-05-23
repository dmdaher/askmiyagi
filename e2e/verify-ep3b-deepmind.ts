/**
 * Verify Test LEDs lights up the 31 `type: 'led'` indicators on
 * deepmind-12 when toggled in preview mode.
 */
import { chromium } from 'playwright';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

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

  await page.goto(`${BASE}/admin/deepmind-12/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  // Enter preview
  await page.locator('button', { hasText: /^Preview$/ }).first().click();
  await page.waitForTimeout(800);

  // Take a wide canvas screenshot OFF state
  await page.screenshot({ path: '/tmp/dm12-leds-off.png', fullPage: false });
  console.log('Off screenshot saved');

  // Verify panelState pre-toggle (should be undefined)
  const preState = await page.evaluate(() => {
    const win = window as unknown as { useEditorStore?: { getState: () => { testLedsActive: boolean } } };
    return win.useEditorStore?.getState().testLedsActive;
  });
  console.log(`Pre-toggle testLedsActive: ${preState}`);

  // Toggle Test LEDs
  await page.locator('button', { hasText: /Test LEDs/ }).first().click();
  await page.waitForTimeout(800);

  const postState = await page.evaluate(() => {
    const win = window as unknown as { useEditorStore?: { getState: () => { testLedsActive: boolean } } };
    return win.useEditorStore?.getState().testLedsActive;
  });
  console.log(`Post-toggle testLedsActive: ${postState}`);

  // Count how many controls have `type: 'led'` to know what to expect
  const ledCount = await page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { controls: Record<string, { type: string; hasLed?: boolean }> } };
    };
    const ctrls = Object.values(win.useEditorStore?.getState().controls ?? {});
    return {
      typeLed: ctrls.filter((c) => c.type === 'led').length,
      typeIndicator: ctrls.filter((c) => c.type === 'indicator').length,
      hasLedTrue: ctrls.filter((c) => c.hasLed === true).length,
    };
  });
  console.log(`LED-capable inventory: ${JSON.stringify(ledCount)}`);

  await page.screenshot({ path: '/tmp/dm12-leds-on.png', fullPage: false });
  console.log('On screenshot saved');

  // Pick a specific LFO LED and check its lit state vs unlit
  const sampleLedBefore = await page.evaluate(() => {
    const el = document.querySelector('[data-control-id="lfo1-sine"]');
    if (!el) return null;
    const stylish = el.querySelector('div');
    return stylish ? window.getComputedStyle(stylish).backgroundColor : null;
  });
  console.log(`Sample LFO LED computed bg: ${sampleLedBefore}`);

  await browser.close();
  console.log('Done — compare /tmp/dm12-leds-{off,on}.png');
})();
