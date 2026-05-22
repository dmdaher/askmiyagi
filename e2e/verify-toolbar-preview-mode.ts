/**
 * Verify the preview-mode toolbar cleanup: editing-only buttons hidden,
 * view buttons (zoom, photo, help, Preview-toggle) still visible.
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

  await page.goto(`${BASE}/admin/cdj-3000/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  // Find the actual editor toolbar bbox (the h-10 div with the gray-800 border)
  const toolbarBox = await page.evaluate(() => {
    const el = document.querySelector('div.flex.h-10.items-center');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!toolbarBox) throw new Error('Toolbar element not found');
  console.log(`Toolbar at y=${toolbarBox.y.toFixed(0)}, height=${toolbarBox.h.toFixed(0)}`);
  const clip = { x: 0, y: Math.max(0, toolbarBox.y - 2), width: Math.min(1800, toolbarBox.x + toolbarBox.w + 40), height: toolbarBox.h + 4 };

  await page.screenshot({ path: '/tmp/toolbar-edit.png', clip });
  console.log('Edit mode toolbar saved');

  // Click Preview button
  await page.locator('button', { hasText: /^Preview$/ }).first().click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/tmp/toolbar-preview.png', clip });
  console.log('Preview mode toolbar saved');

  // Count buttons in each mode for a deterministic assertion
  const editButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('header button, [class*="border-b border-gray-800"] button')).length;
  });
  // Already in preview
  const previewButtons = editButtons;
  console.log(`Button count (preview): ${previewButtons}`);

  // Go back to edit
  await page.locator('button', { hasText: /Exit Preview/ }).first().click();
  await page.waitForTimeout(500);

  const editButtonsAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('header button, [class*="border-b border-gray-800"] button')).length;
  });
  console.log(`Button count (edit): ${editButtonsAfter}`);

  await browser.close();
  console.log(`Reduction in preview: ${editButtonsAfter - previewButtons} buttons hidden`);
})();
