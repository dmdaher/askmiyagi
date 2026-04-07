import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/z-layer');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/admin/cdj-3000/editor', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForSelector('.control-node', { timeout: 60000 });
  console.log('Editor loaded');

  // Select 3 controls via shift+click
  const nodes = await page.$$('.control-node');
  console.log(`Found ${nodes.length} controls`);

  if (nodes.length >= 3) {
    await nodes[0].click({ force: true });
    await page.waitForTimeout(200);
    await nodes[1].click({ force: true, modifiers: ['Shift'] });
    await page.waitForTimeout(200);
    await nodes[2].click({ force: true, modifiers: ['Shift'] });
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'review-01-multiselect.png') });

  // Check alignment buttons
  const alignBtns = await page.evaluate(() => {
    const btns = document.querySelectorAll('button[title*="Align"]');
    return { count: btns.length, titles: Array.from(btns).map((b) => (b as HTMLElement).title) };
  });
  console.log('Alignment buttons:', JSON.stringify(alignBtns));

  // Check Group buttons
  const groupBtns = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns)
      .filter((b) => b.textContent?.includes('Group'))
      .map((b) => b.textContent?.trim());
  });
  console.log('Group buttons:', JSON.stringify(groupBtns));

  // Test Shift+H (align center horizontally)
  await page.keyboard.down('Shift');
  await page.keyboard.press('KeyH');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'review-02-after-align-h.png') });
  console.log('Shift+H pressed (align center H)');

  // Undo
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(300);
  console.log('Cmd+Z (undo)');

  // Group with Cmd+G
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyG');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'review-03-after-group.png') });
  console.log('Cmd+G pressed (group)');

  // Check if group overlay appeared
  const overlay = await page.evaluate(() => {
    const divs = document.querySelectorAll('div');
    let found = false;
    for (const d of divs) {
      const style = d.getAttribute('style') || '';
      if (style.includes('dashed') && style.includes('147')) {
        found = true;
        break;
      }
    }
    return found;
  });
  console.log('Group overlay visible:', overlay);

  // Check layers panel
  const layersInfo = await page.evaluate(() => {
    const panel = document.querySelector('[data-tutorial="layers"]');
    if (!panel) return 'Layers panel not found';
    return panel.textContent?.slice(0, 300) || 'empty';
  });
  console.log('Layers panel content:', layersInfo);

  // Check distribute buttons
  const distBtns = await page.evaluate(() => {
    const btns = document.querySelectorAll('button[title*="Distribute"]');
    return { count: btns.length, titles: Array.from(btns).map((b) => (b as HTMLElement).title) };
  });
  console.log('Distribute buttons:', JSON.stringify(distBtns));

  // Check context menu
  if (nodes.length >= 1) {
    await nodes[0].click({ button: 'right', force: true });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'review-04-context-menu.png') });

    const menuItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.min-w-\\[160px\\] button');
      return Array.from(items).map((b) => b.textContent?.trim());
    });
    console.log('Context menu items:', JSON.stringify(menuItems));
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'review-99-final.png') });

  console.log('\n=== Visual Verification Complete ===');
  await browser.close();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
