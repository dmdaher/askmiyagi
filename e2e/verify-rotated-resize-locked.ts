/**
 * Verify resize handles vanish on rotated non-fader controls + Properties
 * Panel shows the amber "Resize is locked while rotated" hint.
 */
import { chromium } from 'playwright';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addCookies([{ name: 'admin_access', value: ADMIN_PASSWORD, domain: 'localhost', path: '/', sameSite: 'Lax' }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);

  await page.goto(`${BASE}/admin/cdj-3000/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  // Pick MASTER button (rect, has hasLed but not a fader → CSS rotation applies)
  const ctrl = page.locator('[data-control-id="MASTER"]');
  await ctrl.scrollIntoViewIfNeeded({ timeout: 3_000 });
  const box = await ctrl.boundingBox();
  if (!box) throw new Error('MASTER not found');

  // Step 1 — select first, then rotation=0
  await page.evaluate(() => {
    const w = window as any;
    w.useEditorStore?.getState().setSelectedIds(['MASTER']);
    w.useEditorStore?.getState().updateControlProp(['MASTER'], 'rotation', 0);
  });
  await page.waitForTimeout(500);
  const boxAt0 = await ctrl.boundingBox();
  await page.screenshot({
    path: '/tmp/rotated-resize-at0.png',
    clip: boxAt0 ? { x: Math.max(0, boxAt0.x - 30), y: Math.max(0, boxAt0.y - 30), width: boxAt0.width + 60, height: boxAt0.height + 60 } : { x: 0, y: 0, width: 200, height: 200 },
  });

  // Step 2 — rotate to 90°, expect no handles + hint visible
  await page.evaluate(() => {
    const w = window as any;
    w.useEditorStore?.getState().updateControlProp(['MASTER'], 'rotation', 90);
  });
  await page.waitForTimeout(500);
  const boxAt90 = await ctrl.boundingBox();
  await page.screenshot({
    path: '/tmp/rotated-resize-at90.png',
    clip: boxAt90 ? { x: Math.max(0, boxAt90.x - 30), y: Math.max(0, boxAt90.y - 30), width: boxAt90.width + 60, height: boxAt90.height + 60 } : { x: 0, y: 0, width: 200, height: 200 },
  });

  const hintVisible = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div'))
      .find((d) => d.textContent?.includes('Resize is locked while rotated'));
    return !!el;
  });
  console.log(`'Resize locked' hint in Properties Panel: ${hintVisible}`);

  // Reset
  await page.evaluate(() => {
    const w = window as any;
    w.useEditorStore?.getState().updateControlProp(['MASTER'], 'rotation', 0);
  });
  await page.waitForTimeout(300);

  await browser.close();

  if (!hintVisible) {
    console.error('FAIL — Properties Panel hint not visible at rotation=90');
    process.exit(1);
  }
  console.log('PASS — hint visible. See /tmp/rotated-resize-at0.png vs /tmp/rotated-resize-at90.png for visual handle-vanish proof.');
})();
