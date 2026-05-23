/**
 * Verify the Cancel-audit UI integrates with the DELETE endpoint.
 *
 * Strategy:
 *   1. Seed an issue in 'investigating' state via the issues API
 *   2. Open the admin pipeline page → confirm "Cancel" button is visible
 *   3. Click Cancel → confirm issue state transitions to 'open' + resolution set
 *
 * Run: npx tsx e2e/cancel-audit-verify.ts [deviceId]
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.argv[2] || 'deepmind-12';
const SCREENSHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/cancel-audit');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

async function getIssues(): Promise<Array<{ id: string; status: string; resolution?: string }>> {
  const r = await fetch(`${BASE_URL}/api/hosted/panels/${DEVICE_ID}/issues`);
  return r.ok ? r.json() : [];
}

async function seedInvestigatingIssue(): Promise<string> {
  // Read existing issues, add one with status='investigating' for the test
  const existing = await getIssues();
  const id = `test-cancel-${Date.now()}`;
  const updated = [
    ...existing,
    {
      id,
      type: 'missing-control',
      description: 'Cancel-audit test issue (auto-generated)',
      createdAt: new Date().toISOString(),
      status: 'investigating',
    },
  ];
  await fetch(`${BASE_URL}/api/hosted/panels/${DEVICE_ID}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _replace: true, issues: updated }),
  });
  return id;
}

async function cleanup(testIssueId: string): Promise<void> {
  const all = await getIssues();
  const filtered = all.filter((i) => i.id !== testIssueId);
  await fetch(`${BASE_URL}/api/hosted/panels/${DEVICE_ID}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _replace: true, issues: filtered }),
  });
}

async function run() {
  const results: TestResult[] = [];
  const testIssueId = await seedInvestigatingIssue();
  console.log(`Seeded test issue: ${testIssueId}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([
    { name: 'admin_access', value: 'miyagi2026', domain: 'localhost', path: '/' },
  ]);

  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  try {
    // Navigate to the pipeline detail page (where IssuesPanel renders)
    const url = `${BASE_URL}/admin/pipeline/${DEVICE_ID}`;
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-pipeline-loaded.png'),
      fullPage: true,
    });
    console.log('  saved: 01-pipeline-loaded.png');

    // Look for the Cancel button — it sits next to "Checking manual..."
    const cancelBtn = page.locator('button[title="Cancel this audit"]').first();
    const btnCount = await cancelBtn.count();
    console.log(`  cancel button count: ${btnCount}`);

    results.push({
      name: 'Cancel button rendered when issue is investigating',
      passed: btnCount > 0,
      detail: btnCount > 0 ? 'Found' : 'Not found — investigating-state UI did not render Cancel',
    });

    if (btnCount > 0) {
      // Click cancel
      await cancelBtn.click();
      await page.waitForTimeout(2000);

      // Re-fetch issue state
      const after = await getIssues();
      const myIssue = after.find((i) => i.id === testIssueId);
      console.log(`  issue status after cancel: ${myIssue?.status}`);
      console.log(`  issue resolution after cancel: ${myIssue?.resolution}`);

      results.push({
        name: 'Issue status transitions to "open" after cancel click',
        passed: myIssue?.status === 'open',
        detail: myIssue?.status === 'open' ? 'open' : `unexpected: ${myIssue?.status}`,
      });

      results.push({
        name: 'Issue gets "Audit cancelled by user" resolution',
        passed: myIssue?.resolution === 'Audit cancelled by user',
        detail: myIssue?.resolution ?? '(no resolution set)',
      });

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02-after-cancel.png'),
        fullPage: true,
      });
      console.log('  saved: 02-after-cancel.png');
    }

    results.push({
      name: 'No console errors',
      passed: consoleErrors.length === 0,
      detail:
        consoleErrors.length === 0
          ? 'Clean'
          : `${consoleErrors.length} errors: ${consoleErrors.slice(0, 3).join(' | ')}`,
    });
  } catch (err) {
    results.push({
      name: 'Test execution',
      passed: false,
      detail: `Crashed: ${err instanceof Error ? err.message : String(err)}`,
    });
  } finally {
    await browser.close();
    await cleanup(testIssueId);
    console.log(`Cleaned up test issue: ${testIssueId}`);
  }

  console.log('\n=== Cancel-Audit Verification Results ===');
  let pass = 0;
  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${r.name}`);
    console.log(`       ${r.detail}`);
    if (r.passed) pass++;
  }
  console.log(`\n${pass}/${results.length} passed`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  process.exit(pass === results.length ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
