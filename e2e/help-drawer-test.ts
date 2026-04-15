/**
 * Playwright test for the Editor Help Drawer and Guided Tour.
 * Run: npx tsx e2e/help-drawer-test.ts [deviceId]
 * Requires: dev server running on http://localhost:3000
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.argv[2] || 'fantom-06';
const EDITOR_URL = `${BASE_URL}/admin/${DEVICE_ID}/editor`;
const SCREENSHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/help-drawer');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
  screenshot?: string;
}

async function run() {
  const results: TestResult[] = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Set admin auth cookie
  await context.addCookies([{
    name: 'admin_access',
    value: process.env.ADMIN_PASSWORD || 'miyagi2026',
    domain: new URL(BASE_URL).hostname,
    path: '/',
  }]);

  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // ── Setup: Load editor (with joyride suppressed) ───────────────────────
  try {
    // First visit a same-origin page to set localStorage before the editor loads
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.setItem('editor-tutorial-disabled', 'true');
    });
    // Now load the editor — joyride sees localStorage and won't auto-start
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('[data-tutorial="canvas"]', { timeout: 15000 });
    await page.waitForTimeout(1000);
  } catch (err) {
    console.error('Setup failed:', err);
    await browser.close();
    process.exit(2);
  }

  // ── Test 1: "?" button is visible ────────────────────────────────────────
  try {
    const helpBtn = await page.$('button[title="Help (?)"]');
    const isVisible = helpBtn ? await helpBtn.isVisible() : false;

    const screenshotPath = path.join(SCREENSHOT_DIR, '01-help-button.png');
    await page.screenshot({ path: screenshotPath });

    results.push({
      name: '"?" help button visible in toolbar',
      passed: isVisible,
      detail: isVisible ? 'Found and visible' : 'Not found or not visible',
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: '"?" help button visible', passed: false, detail: `${err}` });
  }

  // ── Test 2: Click "?" opens the help drawer ──────────────────────────────
  try {
    const helpBtn = await page.$('button[title="Help (?)"]');
    await helpBtn?.click();
    await page.waitForTimeout(500);

    // Check for the drawer header
    const drawerHeader = await page.$('h2:has-text("Editor Guide")');
    const isOpen = drawerHeader !== null && await drawerHeader.isVisible();

    const screenshotPath = path.join(SCREENSHOT_DIR, '02-drawer-open.png');
    await page.screenshot({ path: screenshotPath });

    results.push({
      name: 'Click "?" opens help drawer',
      passed: isOpen,
      detail: isOpen ? 'Drawer opened with "Editor Guide" header' : 'Drawer not found',
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: 'Click "?" opens help drawer', passed: false, detail: `${err}` });
  }

  // ── Test 3: All 3 tabs render ────────────────────────────────────────────
  try {
    const guideTab = await page.$('button:has-text("Guide")');
    const shortcutsTab = await page.$('button:has-text("Shortcuts")');
    const workflowTab = await page.$('button:has-text("Workflow")');

    const allPresent = guideTab !== null && shortcutsTab !== null && workflowTab !== null;

    // Click Shortcuts tab
    if (shortcutsTab) {
      await shortcutsTab.click();
      await page.waitForTimeout(300);
    }
    const hasShortcutContent = await page.$('text=Cmd+Z');

    // Click Workflow tab
    if (workflowTab) {
      await workflowTab.click();
      await page.waitForTimeout(300);
    }
    const hasWorkflowContent = await page.$('text=Open the photo overlay');

    // Go back to Guide tab
    if (guideTab) {
      await guideTab.click();
      await page.waitForTimeout(300);
    }

    const screenshotPath = path.join(SCREENSHOT_DIR, '03-tabs.png');
    await page.screenshot({ path: screenshotPath });

    const passed = allPresent && hasShortcutContent !== null && hasWorkflowContent !== null;
    results.push({
      name: 'All 3 tabs render with content',
      passed,
      detail: `tabs=${allPresent}, shortcuts=${hasShortcutContent !== null}, workflow=${hasWorkflowContent !== null}`,
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: 'All 3 tabs render', passed: false, detail: `${err}` });
  }

  // ── Test 4: Guide tab has collapsible sections ───────────────────────────
  try {
    // Canvas section is defaultOpen — check content is already visible
    const canvasContent = await page.$('text=Move controls');

    // Click "Toolbar" section
    const toolbarSection = await page.$('button:has-text("Toolbar")');
    if (toolbarSection) {
      await toolbarSection.click();
      await page.waitForTimeout(300);
    }
    const toolbarContent = await page.$('text=Undo / Redo');

    const screenshotPath = path.join(SCREENSHOT_DIR, '04-collapsible-sections.png');
    await page.screenshot({ path: screenshotPath });

    const passed = canvasContent !== null && toolbarContent !== null;
    results.push({
      name: 'Guide tab has collapsible sections with content',
      passed,
      detail: `canvas=${canvasContent !== null}, toolbar=${toolbarContent !== null}`,
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: 'Guide collapsible sections', passed: false, detail: `${err}` });
  }

  // ── Test 5: Close drawer with backdrop click ─────────────────────────────
  try {
    // Click the backdrop (the semi-transparent overlay)
    await page.click('.bg-black\\/40');
    await page.waitForTimeout(500);

    const drawerHeader = await page.$('h2:has-text("Editor Guide")');
    const isClosed = drawerHeader === null || !(await drawerHeader.isVisible());

    const screenshotPath = path.join(SCREENSHOT_DIR, '05-drawer-closed.png');
    await page.screenshot({ path: screenshotPath });

    results.push({
      name: 'Backdrop click closes drawer',
      passed: isClosed,
      detail: isClosed ? 'Drawer closed' : 'Drawer still open',
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: 'Backdrop click closes drawer', passed: false, detail: `${err}` });
  }

  // ── Test 6: "Replay Guided Tour" triggers joyride ────────────────────────
  try {
    // Reopen drawer
    const helpBtn = await page.$('button[title="Help (?)"]');
    await helpBtn?.click();
    await page.waitForTimeout(500);

    // Click "Replay Guided Tour"
    const replayBtn = await page.$('button:has-text("Replay Guided Tour")');
    if (replayBtn) {
      await replayBtn.click();
    }
    // Wait for drawer to close + joyride to start (500ms delay in code)
    await page.waitForTimeout(1500);

    // Look for joyride tooltip
    const joyrideTooltip = await page.$('[class*="react-joyride"]')
      ?? await page.$('[data-test-id="button-primary"]')
      ?? await page.$('button:has-text("Next")')
      ?? await page.$('button:has-text("Skip Tutorial")');

    const screenshotPath = path.join(SCREENSHOT_DIR, '06-joyride-replay.png');
    await page.screenshot({ path: screenshotPath });

    results.push({
      name: 'Replay Guided Tour triggers joyride',
      passed: joyrideTooltip !== null,
      detail: joyrideTooltip !== null ? 'Joyride tooltip found' : 'No joyride tooltip detected',
      screenshot: screenshotPath,
    });

    // Dismiss joyride if running
    if (joyrideTooltip) {
      const skipBtn = await page.$('button:has-text("Skip Tutorial")');
      if (skipBtn) await skipBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (err) {
    results.push({ name: 'Replay Guided Tour', passed: false, detail: `${err}` });
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n===================================================');
  console.log('  Help Drawer & Guided Tour — Playwright Report  ');
  console.log('===================================================\n');

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${r.name}`);
    console.log(`         ${r.detail}`);
    if (r.screenshot) console.log(`         Screenshot: ${r.screenshot}`);
    console.log();
    if (r.passed) passed++;
    else failed++;
  }

  if (consoleErrors.length > 0) {
    console.log('  Console Errors:');
    for (const err of consoleErrors.slice(0, 10)) {
      console.log(`    - ${err}`);
    }
    console.log();
  }

  console.log(`  Total: ${passed} passed, ${failed} failed out of ${results.length}`);
  console.log('===================================================\n');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
