import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  // 1. Verify editor loads with new toolbar controls (Gap input, Panel Scale slider, Clean Up button)
  console.log('1. Loading fantom-06 editor...');
  await page.goto('http://localhost:3000/admin/fantom-06/editor', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'e2e-screenshots/verify-01-editor-toolbar.png', fullPage: false });
  console.log('  Saved: verify-01-editor-toolbar.png');

  // 2. Check toolbar has Gap input, Clean Up button, Panel Scale slider, Approve & Build
  const gapInput = page.locator('input[title*="Gap between controls"]');
  const cleanUpBtn = page.locator('button:has-text("Clean Up")');
  const approveBtn = page.locator('button:has-text("Approve & Build")');
  const panelSlider = page.locator('input[title*="Panel Scale"]');

  console.log('  Gap input visible:', await gapInput.isVisible());
  console.log('  Clean Up button visible:', await cleanUpBtn.isVisible());
  console.log('  Approve & Build button visible:', await approveBtn.isVisible());
  console.log('  Panel Scale slider visible:', await panelSlider.isVisible());

  // 3. Verify the Gap input has default value 8
  const gapValue = await gapInput.inputValue();
  console.log('  Gap default value:', gapValue, gapValue === '8' ? '✓' : '✗ EXPECTED 8');

  // 4. Screenshot the right side of toolbar (Clean Up + Panel + Approve area)
  const toolbar = page.locator('.flex.h-10.items-center').first();
  if (await toolbar.isVisible()) {
    await toolbar.screenshot({ path: 'e2e-screenshots/verify-02-toolbar-closeup.png' });
    console.log('  Saved: verify-02-toolbar-closeup.png');
  }

  // 5. Verify CDJ-3000 editor also has the controls
  console.log('\n2. Loading cdj-3000 editor...');
  await page.goto('http://localhost:3000/admin/cdj-3000/editor', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'e2e-screenshots/verify-03-cdj3000-toolbar.png', fullPage: false });

  const gapInput2 = page.locator('input[title*="Gap between controls"]');
  const cleanUpBtn2 = page.locator('button:has-text("Clean Up")');
  console.log('  CDJ-3000 Gap input visible:', await gapInput2.isVisible());
  console.log('  CDJ-3000 Clean Up visible:', await cleanUpBtn2.isVisible());

  await browser.close();
  console.log('\nDone!');
}

verify().catch(console.error);
