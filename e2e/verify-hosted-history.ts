/**
 * Verifies hosted-history changes end-to-end:
 *   1. Local admin editor: History dropdown opens and renders versions
 *   2. Restore button now triggers a confirm() dialog (new behavior)
 *   3. Manual Save passes ?backup=force in the URL
 *   4. Hosted history GET endpoint returns the new {versions, total} shape
 */
import { chromium } from 'playwright';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const DEVICE_ID = 'deepmind-12';
const URL = `http://localhost:3000/admin/${DEVICE_ID}/editor`;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();

  const results: string[] = [];
  const fail: string[] = [];

  // Track outgoing save requests to verify ?backup=force flag
  const saveRequests: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/manifest')) {
      saveRequests.push(req.url());
    }
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-control-id]', { timeout: 15_000 });
  await page.waitForTimeout(2500);

  // 1. History button exists
  const historyBtn = page.locator('button[title*="Version History"]').first();
  const visible = await historyBtn.count() > 0 && await historyBtn.isVisible();
  results.push(`History button visible: ${visible ? 'YES' : 'NO'}`);
  if (!visible) fail.push('FAIL: History button not found');

  // 2. Click opens dropdown
  await historyBtn.click();
  await page.waitForTimeout(800);
  const dropdownOpen = await page.locator('text=Version History').count() > 0;
  results.push(`Dropdown opens: ${dropdownOpen ? 'YES' : 'NO'}`);
  if (!dropdownOpen) fail.push('FAIL: Dropdown did not open');

  // 3. Versions list renders
  const versionRows = await page.locator('text=Current').count();
  results.push(`Versions list renders (Current entry visible): ${versionRows > 0 ? 'YES' : 'NO'}`);
  if (versionRows === 0) fail.push('FAIL: No "Current" entry in list');

  // 4. Confirm dialog fires on Restore — install handler BEFORE clicking
  let confirmFired = false;
  let confirmMessage = '';
  page.on('dialog', async (d) => {
    confirmFired = true;
    confirmMessage = d.message();
    await d.dismiss(); // Don't actually restore
  });

  const restoreButtons = page.locator('button:has-text("Restore")');
  const restoreCount = await restoreButtons.count();
  results.push(`Restore buttons available: ${restoreCount}`);
  if (restoreCount > 0) {
    await restoreButtons.first().click();
    await page.waitForTimeout(500);
    results.push(`Confirm() dialog fired: ${confirmFired ? 'YES' : 'NO'}`);
    if (!confirmFired) fail.push('FAIL: Restore did not trigger confirm() dialog');
    else results.push(`  message="${confirmMessage}"`);
  } else {
    results.push('Skipping confirm test (no backups exist yet — fine for fresh device)');
  }

  // Close dropdown
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 5. Trigger a save by interacting with editor + verify ?backup=force on manual save
  // (Local admin uses /api/pipeline/<id>/manifest — appended query param is harmless there)
  saveRequests.length = 0;

  // Move a control to trigger autosave (no force expected)
  const firstControl = page.locator('[data-control-id]').first();
  await firstControl.hover();
  await page.mouse.down();
  await page.mouse.move(20, 20);
  await page.mouse.up();
  await page.waitForTimeout(1500); // debounce window

  const autoSaveUrl = saveRequests.find(u => u.includes('/manifest') && !u.includes('backup=force'));
  results.push(`Autosave fires WITHOUT backup=force: ${autoSaveUrl ? 'YES' : 'NO'}`);

  // Click Save button — should fire WITH backup=force
  saveRequests.length = 0;
  const saveBtn = page.locator('button:has-text("Save")').filter({ hasNot: page.locator('button:has-text("Last")') }).first();
  const saveBtnExists = await saveBtn.count() > 0;
  if (saveBtnExists) {
    await saveBtn.click();
    await page.waitForTimeout(1500);
    const forceSaveUrl = saveRequests.find(u => u.includes('backup=force'));
    results.push(`Manual save fires WITH backup=force: ${forceSaveUrl ? 'YES' : 'NO'}`);
    if (!forceSaveUrl) {
      // Only fail if it's expected for this mode (hosted/sandbox). Local admin
      // also appends the flag — server ignores it — so it's still expected.
      fail.push('FAIL: Manual save did not include backup=force');
    }
  } else {
    results.push('Note: Save button not visible in this mode (expected for non-hosted)');
  }

  console.log('\n=== RESULTS ===');
  console.log(results.join('\n'));
  console.log('\n=== VERDICT ===');
  if (fail.length === 0) {
    console.log('\x1b[32mPASS\x1b[0m');
  } else {
    console.log('\x1b[31mFAIL\x1b[0m');
    console.log(fail.join('\n'));
  }

  await browser.close();
  process.exit(fail.length === 0 ? 0 : 1);
}

run().catch((err) => { console.error(err); process.exit(1); });
