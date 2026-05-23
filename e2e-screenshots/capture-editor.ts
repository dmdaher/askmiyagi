import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  // 1. Editor for fantom-06
  console.log('Loading fantom-06 editor...');
  await page.goto('http://localhost:3000/admin/fantom-06/editor', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'e2e-screenshots/01-editor-full.png', fullPage: false });
  console.log('  Saved: 01-editor-full.png');

  // 2. Preview
  console.log('Loading fantom-06 preview...');
  await page.goto('http://localhost:3000/admin/fantom-06/preview', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'e2e-screenshots/02-preview-panel.png', fullPage: false });
  console.log('  Saved: 02-preview-panel.png');

  // 3. Admin dashboard
  console.log('Loading admin dashboard...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'e2e-screenshots/03-admin-dashboard.png', fullPage: false });
  console.log('  Saved: 03-admin-dashboard.png');

  // 4. CDJ-3000 editor if available
  console.log('Loading cdj-3000 editor...');
  await page.goto('http://localhost:3000/admin/cdj-3000/editor', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'e2e-screenshots/04-cdj3000-editor.png', fullPage: false });
  console.log('  Saved: 04-cdj3000-editor.png');

  await browser.close();
  console.log('Done!');
}

capture().catch(console.error);
