/**
 * Debug: test joyride step navigation
 * Run: npx tsx e2e/joyride-debug.ts
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'admin_access', value: 'miyagi2026', domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();

  // Pre-clear localStorage
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('editor-tutorial-fantom-06'));

  // Load editor
  await page.goto(`${BASE_URL}/admin/fantom-06/editor`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-tutorial="canvas"]', { timeout: 15000 });
  await page.waitForTimeout(3500);

  // Step 0 — should be showing
  let tooltip = await page.evaluate(() => {
    const el = document.querySelector('.react-joyride__tooltip');
    return el ? (el.textContent || '').substring(0, 80) : null;
  });
  console.log('Step 0:', tooltip ? 'VISIBLE' : 'NOT FOUND');
  console.log('  Text:', tooltip);

  // Click Next
  const nextBtn = await page.locator('button', { hasText: 'Next' }).first();
  const nextVisible = await nextBtn.isVisible().catch(() => false);
  console.log('Next button:', nextVisible ? 'VISIBLE' : 'NOT FOUND');

  if (nextVisible) {
    await nextBtn.click();
    await page.waitForTimeout(1500);

    tooltip = await page.evaluate(() => {
      const el = document.querySelector('.react-joyride__tooltip');
      return el ? (el.textContent || '').substring(0, 80) : null;
    });
    console.log('Step 1:', tooltip ? 'VISIBLE' : 'NOT FOUND');
    console.log('  Text:', tooltip);

    const beacon = await page.evaluate(() => {
      const el = document.querySelector('.react-joyride__beacon');
      return el ? 'BEACON SHOWING (bad)' : 'no beacon (good)';
    });
    console.log('  Beacon:', beacon);

    // Check portal state
    const portalInfo = await page.evaluate(() => {
      const portal = document.getElementById('react-joyride-portal');
      if (!portal) return 'no portal';
      return `${portal.children.length} children, innerHTML starts: ${portal.innerHTML.substring(0, 150)}`;
    });
    console.log('  Portal:', portalInfo);
  }

  await page.screenshot({ path: 'e2e-screenshots/help-drawer/debug-step-nav.png' });
  await browser.close();
}

run().catch(console.error);
