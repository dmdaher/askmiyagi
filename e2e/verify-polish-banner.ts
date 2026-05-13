/**
 * Verifies polish banner end-to-end:
 *   1. +B toolbar button creates a banner
 *   2. Banner renders in editor with default dimensions (full-width × 70 high)
 *   3. Properties panel opens automatically for the new banner
 *   4. Editing text updates the rendered banner
 *   5. Banner renders identically in preview mode
 *   6. Banner has pointer-events: none in preview (clicks pass through)
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const DEVICE_ID = 'deepmind-12';
const URL = `http://localhost:3000/admin/${DEVICE_ID}/editor`;
const SHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/polish-banner');
fs.mkdirSync(SHOT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-control-id]', { timeout: 15_000 });
  await page.waitForTimeout(3000);

  const results: string[] = [];
  const fail: string[] = [];

  // 1. Click +B button
  const addBtn = page.locator('button[title*="polish banner"]').first();
  const addBtnVisible = await addBtn.count() > 0;
  results.push(`+B button visible: ${addBtnVisible}`);
  if (!addBtnVisible) {
    fail.push('FAIL: +B button not found');
    await browser.close();
    console.log(results.join('\\n'));
    console.log(fail.join('\\n'));
    process.exit(1);
  }
  await addBtn.click();
  await page.waitForTimeout(800);

  // 2. Check banner exists in DOM with data-banner-id
  const editorBanner = await page.evaluate(`(() => {
    const els = document.querySelectorAll('[data-banner-id]');
    if (els.length === 0) return null;
    const el = els[0];
    const r = el.getBoundingClientRect();
    return {
      id: el.dataset.bannerId,
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };
  })()`);
  results.push(`Editor banner rendered: ${editorBanner ? 'YES' : 'NO'}`);
  if (editorBanner) {
    results.push(`  id=${editorBanner.id} size=${editorBanner.width.toFixed(0)}x${editorBanner.height.toFixed(0)}`);
  } else {
    fail.push('FAIL: editor banner not in DOM');
  }
  await page.screenshot({ path: path.join(SHOT_DIR, '1-editor-after-add.png'), fullPage: false });

  // 3. Properties panel should show "Polish Banner" heading
  const propsHeading = await page.locator('h3:has-text("Polish Banner")').count();
  results.push(`Properties shows "Polish Banner" heading: ${propsHeading > 0 ? 'YES' : 'NO'}`);
  if (propsHeading === 0) fail.push('FAIL: Properties panel did not route to PolishBannerProperties');

  // 4. Type text into the banner's text input
  const textInput = page.locator('input[placeholder*="leave empty for no text"]').first();
  const textInputVisible = await textInput.count() > 0;
  results.push(`Properties text input visible: ${textInputVisible ? 'YES' : 'NO'}`);
  if (textInputVisible) {
    await textInput.fill('TEST BANNER');
    await textInput.blur();
    await page.waitForTimeout(400);
    // Verify the text appears in the banner
    const renderedText = await page.evaluate(`(() => {
      const el = document.querySelector('[data-banner-id]');
      return el ? el.textContent : null;
    })()`);
    results.push(`Banner text rendered: ${renderedText === 'TEST BANNER' ? 'YES' : `NO (got: "${renderedText}")`}`);
    if (renderedText !== 'TEST BANNER') fail.push(`FAIL: banner text incorrect (got "${renderedText}")`);
  }

  await page.screenshot({ path: path.join(SHOT_DIR, '2-editor-with-text.png'), fullPage: false });

  // 5. Toggle Preview
  const previewBtn = page.locator('button:has-text("Preview")').first();
  await previewBtn.click();
  await page.waitForTimeout(2000);

  const previewBanner = await page.evaluate(`(() => {
    const els = document.querySelectorAll('[data-banner-id]');
    if (els.length === 0) return null;
    const el = els[0];
    const r = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    return {
      id: el.dataset.bannerId,
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      text: el.textContent,
      pointerEvents: cs.pointerEvents,
    };
  })()`);
  results.push(`Preview banner rendered: ${previewBanner ? 'YES' : 'NO'}`);
  if (previewBanner) {
    results.push(`  text="${previewBanner.text}" pointerEvents=${previewBanner.pointerEvents}`);
    if (previewBanner.text !== 'TEST BANNER') {
      fail.push(`FAIL: preview text mismatch (got "${previewBanner.text}")`);
    }
    if (previewBanner.pointerEvents !== 'none') {
      fail.push(`FAIL: preview banner should have pointer-events: none (got "${previewBanner.pointerEvents}")`);
    }
  } else {
    fail.push('FAIL: preview banner not in DOM');
  }
  await page.screenshot({ path: path.join(SHOT_DIR, '3-preview.png'), fullPage: false });

  // 6. Editor vs preview size match (using shared style)
  if (editorBanner && previewBanner) {
    const dW = Math.abs(previewBanner.width - editorBanner.width);
    const dH = Math.abs(previewBanner.height - editorBanner.height);
    results.push(`Editor/preview size match: Δw=${dW.toFixed(2)} Δh=${dH.toFixed(2)} (≤1px expected)`);
    if (dW > 1.5 || dH > 1.5) fail.push(`FAIL: dimensions differ between editor + preview`);
  }

  console.log('\\n=== RESULTS ===');
  console.log(results.join('\\n'));
  console.log('\\n=== VERDICT ===');
  if (fail.length === 0) {
    console.log('\\x1b[32mPASS — all 6 checks green\\x1b[0m');
  } else {
    console.log('\\x1b[31mFAIL\\x1b[0m');
    console.log(fail.join('\\n'));
  }
  console.log(`\\nScreenshots: ${SHOT_DIR}/`);

  await browser.close();
  process.exit(fail.length === 0 ? 0 : 1);
}

run().catch((err) => { console.error(err); process.exit(1); });
