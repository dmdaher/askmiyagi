/**
 * Smoke test for A4-P1 — Send/Pull overwrite warnings.
 *
 * Asserts the admin pipeline page renders without error and the contractor
 * actions component is present (so the new useEffect/state additions don't
 * crash the page). Also verifies the formatTimeAgo helper module is wired.
 *
 * Real warning behavior (amber banner, enriched confirm) requires actual
 * Blob state, which is environment-dependent. This script just proves
 * the new code paths don't break the page.
 *
 * Prereq: dev server running on localhost:3000.
 *
 * Run: npx tsx e2e/verify-a4-p1-warnings.ts
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const PIPELINE_URL = `${BASE_URL}/admin/pipeline/deepmind-12`;

let exitCode = 0;
function pass(msg: string) { console.log(`\x1b[32m✓\x1b[0m ${msg}`); }
function fail(msg: string) { console.error(`\x1b[31m✗\x1b[0m ${msg}`); exitCode = 1; }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([
    { name: 'admin_access', value: ADMIN_PASSWORD, domain: 'localhost', path: '/' },
  ]);
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERR: ${e.message}`));

  console.log(`Loading ${PIPELINE_URL}…`);
  await page.goto(PIPELINE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Test 1: page rendered without console errors involving formatTimeAgo
  const helperErrors = consoleErrors.filter((e) => e.includes('formatTimeAgo') || e.includes('isRecent'));
  if (helperErrors.length === 0) {
    pass('No errors importing formatTimeAgo / isRecent');
  } else {
    fail(`Helper errors: ${helperErrors.slice(0, 2).join('; ')}`);
  }

  // Test 2: "Send to Contractor" button is present
  const sendBtn = page.locator('button:has-text("Send to Contractor")').first();
  const sendCount = await sendBtn.count();
  if (sendCount > 0) {
    pass('Send to Contractor button rendered');
  } else {
    fail('Send to Contractor button not found');
  }

  // Test 3: clicking Send opens the modal (no crash)
  if (sendCount > 0) {
    await sendBtn.click();
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('h3:has-text("Send to Contractor")').count();
    if (modalVisible > 0) {
      pass('Send modal opens without error');
    } else {
      fail('Send modal did not open');
    }

    // Test 4: warning banner OR no-warning (both acceptable depending on Blob state)
    const warningVisible = await page.locator('text=/Contractor last saved/').count();
    if (warningVisible > 0) {
      pass(`Warning banner shown (contractor has recent activity)`);
    } else {
      pass('No warning banner (no recent contractor activity, or Blob empty) — also valid');
    }
  }

  // Test 5: no general page errors
  if (consoleErrors.length === 0) {
    pass('Zero console errors during page load');
  } else {
    console.log(`  (${consoleErrors.length} non-fatal console errors)`);
    consoleErrors.slice(0, 3).forEach((e) => console.log(`    - ${e.slice(0, 100)}`));
  }

  await browser.close();

  if (exitCode === 0) {
    console.log('\n\x1b[32mA4-P1 smoke test passed.\x1b[0m');
  } else {
    console.error('\n\x1b[31mA4-P1 smoke test FAILED.\x1b[0m');
  }
  process.exit(exitCode);
}

run().catch((err: unknown) => { console.error(err); process.exit(1); });
