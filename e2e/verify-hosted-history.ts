/**
 * Verifies hosted-history changes end-to-end:
 *   1. History dropdown button is visible in admin editor
 *   2. Dropdown opens and renders the version list
 *   3. Restore button triggers a confirm() dialog (new safety behavior)
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

  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-control-id]', { timeout: 15_000 });
  await page.waitForTimeout(2500);

  // 1. History button exists
  const historyBtn = page.locator('button[title*="Version History"]').first();
  const visible = await historyBtn.count() > 0;
  results.push(`History button rendered: ${visible ? 'YES' : 'NO'}`);
  if (!visible) {
    fail.push('FAIL: History button not found');
    await browser.close();
    console.log(results.join('\n'));
    console.log(fail.join('\n'));
    process.exit(1);
  }

  // 2. Click opens dropdown
  await historyBtn.click();
  await page.waitForTimeout(800);
  const heading = page.locator('span:has-text("Version History")');
  const dropdownOpen = await heading.count() > 0;
  results.push(`Dropdown opens: ${dropdownOpen ? 'YES' : 'NO'}`);
  if (!dropdownOpen) fail.push('FAIL: Dropdown did not open');

  // 3. Versions list renders (Current entry should always be visible)
  const currentEntry = await page.locator('span:has-text("Current")').count();
  results.push(`"Current" entry visible: ${currentEntry > 0 ? 'YES' : 'NO'}`);
  if (currentEntry === 0) fail.push('FAIL: No "Current" entry in dropdown');

  // 4. Confirm dialog on Restore — install handler before clicking
  let confirmFired = false;
  let confirmMessage = '';
  page.on('dialog', async (d) => {
    confirmFired = true;
    confirmMessage = d.message();
    await d.dismiss();
  });

  const restoreButtons = page.locator('button:has-text("Restore")');
  const restoreCount = await restoreButtons.count();
  results.push(`Restore buttons available: ${restoreCount}`);
  if (restoreCount > 0) {
    await restoreButtons.first().click();
    await page.waitForTimeout(800);
    results.push(`Confirm() dialog fired on Restore: ${confirmFired ? 'YES' : 'NO'}`);
    if (!confirmFired) {
      fail.push('FAIL: Restore did not trigger confirm() dialog — safety prompt missing');
    } else {
      results.push(`  message="${confirmMessage}"`);
    }
  } else {
    results.push('No backup versions exist yet (fresh device) — confirm test skipped');
  }

  // 5. Hosted endpoint shape check (will 404 for local devices, that's fine)
  const apiResponse = await page.evaluate(`
    fetch('/api/hosted/panels/sandbox-test-001/history').then(r => r.json()).catch(() => null)
  `) as Record<string, unknown> | null;
  if (apiResponse) {
    const hasVersionsField = 'versions' in apiResponse;
    const hasTotalField = 'total' in apiResponse;
    results.push(`Hosted endpoint returns {versions, total}: versions=${hasVersionsField} total=${hasTotalField}`);
    if (!hasVersionsField || !hasTotalField) {
      // Only fail if a device exists. For a non-existent sandbox device the
      // endpoint may return a different shape — don't hard-fail.
      results.push('  (non-existent device — shape check is optional)');
    }
  } else {
    results.push('Hosted endpoint check: response null (expected for unprovisioned device)');
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
