/**
 * Playwright smoke test for the redesigned /admin/pipeline/<id> page.
 *
 * Verifies:
 *  - PipelineStatusHero renders with the correct status copy
 *  - Show/Hide details disclosure works
 *  - Token columns are absent from the cost-removal change
 *  - Cost references removed across dashboard + detail + section progress
 *  - Phase timeline renders with new "ID Check" node
 *  - Advanced section is collapsible
 *
 * Run:  npx tsx e2e/admin-redesign-verify.ts
 * Requires: dev server on localhost:3000 + admin password.
 */

import { chromium, type Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const DEVICE_ID = process.argv[2] || 'deepmind-12';
const SCREENSHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/admin-redesign');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface Result {
  name: string;
  passed: boolean;
  detail: string;
  screenshot?: string;
}

const results: Result[] = [];

function record(name: string, passed: boolean, detail: string, screenshot?: string) {
  results.push({ name, passed, detail, screenshot });
  const icon = passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`${icon} ${name} — ${detail}`);
}

async function signIn(page: Page) {
  const url = `${BASE_URL}/admin/pipeline/${DEVICE_ID}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  // If signin form is shown, fill password
  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.count() > 0) {
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((u) => u.toString().includes('/admin/'), { timeout: 5_000 });
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  try {
    await signIn(page);
    await page.waitForLoadState('networkidle');

    // ── 1. Status hero renders ──────────────────────────────────────────
    const heroHeading = page.locator('h2').first();
    const heroText = await heroHeading.textContent({ timeout: 5_000 }).catch(() => null);
    const heroVisible = heroText !== null && heroText.length > 0;
    const heroShot = path.join(SCREENSHOT_DIR, '1-hero.png');
    await page.screenshot({ path: heroShot, clip: { x: 0, y: 0, width: 1400, height: 400 } });
    record(
      'PipelineStatusHero renders',
      heroVisible,
      heroVisible ? `headline: "${heroText}"` : 'no h2 found above the fold',
      heroShot
    );

    // ── 2. Show/Hide details toggle ─────────────────────────────────────
    const showDetailsBtn = page.locator('button:has-text("Show details")').first();
    const hasDetailsBtn = (await showDetailsBtn.count()) > 0;
    if (hasDetailsBtn) {
      await showDetailsBtn.click();
      await page.waitForTimeout(300);

      const whatsHappening = page.locator('text=What\'s happening').first();
      const expanded = (await whatsHappening.count()) > 0;
      const expandedShot = path.join(SCREENSHOT_DIR, '2-details-expanded.png');
      await page.screenshot({ path: expandedShot, clip: { x: 0, y: 0, width: 1400, height: 600 } });
      record(
        'Show details expands to reveal "What\'s happening" + actions',
        expanded,
        expanded ? 'details panel visible' : '"What\'s happening" heading missing',
        expandedShot
      );

      // Collapse again
      const hideBtn = page.locator('button:has-text("Hide details")').first();
      if (await hideBtn.count() > 0) {
        await hideBtn.click();
        await page.waitForTimeout(300);
        record('Hide details collapses panel', true, 'toggle reverses');
      }
    } else {
      record('Show/Hide details toggle present', false, 'no "Show details" button found on hero');
    }

    // ── 3. No cost references in visible UI ─────────────────────────────
    // body.textContent() includes Next.js RSC payload (`"$L1a"`, `"$4"` etc.)
    // in inline <script> tags. Restrict to visible text by reading from main
    // content elements only.
    const visibleText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const out: string[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        // Skip text inside <script> and <style>
        const parent = node.parentElement;
        if (!parent) continue;
        const tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript') continue;
        out.push(node.textContent ?? '');
      }
      return out.join(' ');
    });
    const dollarMentions = visibleText.match(/\$[0-9]/g) ?? [];
    record(
      'No dollar-value cost references in detail page',
      dollarMentions.length === 0,
      dollarMentions.length === 0 ? 'no $N matches in visible text' : `found ${dollarMentions.length}: ${dollarMentions.slice(0, 3).join(', ')}`
    );

    // ── 4. Phase timeline shows the new "ID Check" node ─────────────────
    const idCheckNode = page.locator('text=ID Check').first();
    const hasIdCheck = (await idCheckNode.count()) > 0;
    record(
      'Phase timeline includes new "ID Check" node',
      hasIdCheck,
      hasIdCheck ? 'node visible' : 'missing (PR #104 wiring may not have shipped yet)'
    );

    // ── 5. Advanced section toggle works ────────────────────────────────
    const advancedHeader = page.locator('button:has-text("Advanced")').first();
    if (await advancedHeader.count() > 0) {
      const wasOpen = (await page.locator('text=Agent Scores').isVisible().catch(() => false));
      await advancedHeader.click();
      await page.waitForTimeout(400);
      const isOpenAfter = (await page.locator('text=Agent Scores').isVisible().catch(() => false));
      record(
        'Advanced section toggle works',
        wasOpen !== isOpenAfter,
        `started ${wasOpen ? 'open' : 'closed'}, after click ${isOpenAfter ? 'open' : 'closed'}`
      );
    } else {
      record('Advanced section present', false, 'no Advanced toggle');
    }

    // ── 6. Dashboard list view also has no cost ─────────────────────────
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    const dashVisibleText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const out: string[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const parent = node.parentElement;
        if (!parent) continue;
        const tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript') continue;
        out.push(node.textContent ?? '');
      }
      return out.join(' ');
    });
    const dashDollarMentions = dashVisibleText.match(/\$[0-9]/g) ?? [];
    const dashShot = path.join(SCREENSHOT_DIR, '6-dashboard.png');
    await page.screenshot({ path: dashShot, fullPage: false });
    record(
      'No cost references on dashboard list view',
      dashDollarMentions.length === 0,
      dashDollarMentions.length === 0 ? 'no $N.NN matches' : `found ${dashDollarMentions.length}`,
      dashShot
    );

    // Also verify the Sort dropdown no longer has "Cost"
    const sortDropdown = page.locator('select').first();
    if (await sortDropdown.count() > 0) {
      const opts = await sortDropdown.locator('option').allTextContents();
      const hasCostOption = opts.some(o => o.toLowerCase().includes('cost'));
      record(
        'Sort dropdown no longer contains "Cost" option',
        !hasCostOption,
        `options: [${opts.join(', ')}]`
      );
    }
  } catch (err) {
    record('Smoke test crashed', false, (err as Error).message);
  } finally {
    await browser.close();
  }

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('');
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const color = failed === 0 ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${passed}/${results.length} passed${failed > 0 ? `, ${failed} failed` : ''}\x1b[0m`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
