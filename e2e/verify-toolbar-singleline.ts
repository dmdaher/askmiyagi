/**
 * Verify: 1-line toolbar with More ▾ dropdown + 2-line Select/Scale buttons +
 * Properties Panel renders correctly with a control selected.
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

  // Capture full editor — empty state
  await page.screenshot({ path: '/tmp/toolbar-singleline-empty.png', fullPage: false });

  // Click on QUANTIZE to select it (triggers Properties Panel)
  const q = page.locator('[data-control-id="QUANTIZE"]');
  await q.scrollIntoViewIfNeeded({ timeout: 3_000 });
  const box = await q.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
  }

  // Properties panel should appear (right sidebar). Take screenshot.
  await page.screenshot({ path: '/tmp/toolbar-singleline-selected.png', fullPage: false });

  // Inspect: is the Properties Panel rendered? Look for some Properties text
  const propsPanelInfo = await page.evaluate(() => {
    // Properties panel has heading "Control" or labels
    const candidates = Array.from(document.querySelectorAll('h1, h2, h3, h4, label')).filter(
      (el) => /Control|Type|Shape|LED|Rotate|Position|Label/.test(el.textContent || ''),
    );
    return {
      foundElements: candidates.length,
      sample: candidates.slice(0, 5).map((el) => el.textContent?.trim().slice(0, 40)),
    };
  });
  console.log(`Properties Panel signals: ${JSON.stringify(propsPanelInfo)}`);

  // Find toolbar height
  const toolbarH = await page.evaluate(() => {
    const tb = document.querySelector('div.flex.h-10.items-center');
    return tb ? (tb as HTMLElement).getBoundingClientRect().height : null;
  });
  console.log(`Toolbar height: ${toolbarH}px (should be 40 for 1-line)`);

  await browser.close();
  console.log('Screenshots saved to /tmp/toolbar-singleline-{empty,selected}.png');
})();
