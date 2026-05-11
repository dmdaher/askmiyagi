/**
 * Playwright test for the label color picker on standalone labels.
 *
 * Verifies:
 *  1. Properties panel shows the Text Color section when a label is selected
 *  2. Clicking a preset applies a color (via the store)
 *  3. The rendered label in LabelLayer reflects the color
 *  4. Default button clears the override
 *  5. Hex input accepts arbitrary values
 *
 * Run: npx tsx e2e/label-color-picker-verify.ts
 * Requires: dev server + admin password + deepmind-12 with at least one
 *           standalone editor label.
 */

import { chromium, type Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const DEVICE_ID = 'deepmind-12';
const SCREENSHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/label-color');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface Result { name: string; passed: boolean; detail: string }
const results: Result[] = [];
function record(name: string, passed: boolean, detail: string) {
  results.push({ name, passed, detail });
  const icon = passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`${icon} ${name} — ${detail}`);
}

async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  const pw = page.locator('input[type="password"]');
  if (await pw.count() > 0) {
    await pw.fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((u) => !u.toString().includes('/signin'), { timeout: 5_000 });
    await page.waitForLoadState('networkidle');
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept().catch(() => {}));

  try {
    await signIn(page);

    // Open the LOCAL admin editor for DeepMind-12. Use 'domcontentloaded'
    // instead of 'networkidle' because the editor maintains long-poll
    // connections that never go idle.
    await page.goto(`${BASE_URL}/admin/${DEVICE_ID}/editor`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Find a standalone label on the canvas. The simplest path: dispatch a
    // click via the store API the editor exposes — but Playwright doesn't
    // have store access. Instead, click into the page via the Layers panel
    // or use the +L toolbar to add one fresh.

    // Click the +L button (toolbar) to add a fresh standalone label
    const addLabelBtn = page.locator('button[title="Add standalone label at canvas center"]').first();
    let hasAddBtn = (await addLabelBtn.count()) > 0;
    if (!hasAddBtn) {
      // Fallback: try by button text content "+L"
      const fallback = page.locator('button:has-text("+L")').first();
      hasAddBtn = (await fallback.count()) > 0;
      if (hasAddBtn) {
        await fallback.click();
        await page.waitForTimeout(800);
      }
    } else {
      await addLabelBtn.click();
      await page.waitForTimeout(800);
    }
    record('+L (add standalone label) button visible', hasAddBtn, hasAddBtn ? 'clicked' : 'missing');
    if (!hasAddBtn) {
      throw new Error('No +L button found — cannot continue');
    }

    // The new label should be selected automatically (we wired setSelectedLabel
    // into the +L button). Properties panel should now show LabelProperties.
    const labelHeader = page.locator('text=/^Label$/').first();
    const hasLabelPanel = (await labelHeader.count()) > 0;
    record('Properties shows Label section after +L', hasLabelPanel, hasLabelPanel ? 'visible' : 'missing');

    // Text Color section should be present
    const textColorLabel = page.locator('text=Text Color').first();
    const hasColorSection = (await textColorLabel.count()) > 0;
    record('Properties shows "Text Color" section for label', hasColorSection, hasColorSection ? 'visible' : 'missing');

    if (hasColorSection) {
      // Default-grey preset (#d1d5db) should be the first option in the
      // unified preset list. Title now includes "Match other labels (default)"
      // helper text from ColorPickerRow.
      const greyBtn = page.locator('button[title*="#d1d5db"]').first();
      const hasGrey = (await greyBtn.count()) > 0;
      record('Default-grey preset (#d1d5db) in picker', hasGrey, hasGrey ? 'visible' : 'missing');
      if (hasGrey) {
        const greyTitle = await greyBtn.getAttribute('title');
        const hasHelpfulCopy = greyTitle?.includes('Match other labels');
        record(
          'Default-grey tooltip explains intent ("Match other labels")',
          !!hasHelpfulCopy,
          hasHelpfulCopy ? `title: "${greyTitle}"` : `title: "${greyTitle}"`,
        );
      }

      // Click the amber preset (#f59e0b) — matches the shared LabelEditor palette
      const amberBtn = page.locator('button[title*="#f59e0b"]').first();
      const hasAmber = (await amberBtn.count()) > 0;
      record('Amber preset (#f59e0b) button visible', hasAmber, hasAmber ? 'visible' : 'missing');

      if (hasAmber) {
        await amberBtn.click();
        await page.waitForTimeout(500);

        // Verify the label in the canvas now has color: #f59e0b inline style
        const coloredSpan = page.locator('[data-label-id]').last();
        const styleAttr = await coloredSpan.getAttribute('style');
        const appliedColor = styleAttr?.includes('rgb(245, 158, 11)') || styleAttr?.toLowerCase().includes('#f59e0b');
        record(
          'Label rendered with amber color (#f59e0b) after click',
          !!appliedColor,
          appliedColor ? `style includes color override` : `style: ${styleAttr?.slice(0, 80) ?? '(no style)'}`,
        );

        // UX check: amber preset now has the blue ring (selected state)
        const ringClass = await amberBtn.getAttribute('class');
        const hasRing = ringClass?.includes('ring-blue-500') || ringClass?.includes('border-blue-500');
        record(
          'Selected preset shows blue ring (selection feedback)',
          !!hasRing,
          hasRing ? 'ring visible on amber' : 'no selection indicator',
        );

        // UX check: default button does NOT have the ring (only amber should)
        const defaultBtnNow = page.locator('button[title*="Reset to default"]').first();
        if (await defaultBtnNow.count() > 0) {
          const defClass = await defaultBtnNow.getAttribute('class');
          const defHasRing = defClass?.includes('ring-blue-500');
          record(
            'Only ONE preset has the ring at a time (default button is NOT selected when amber is)',
            !defHasRing,
            !defHasRing ? 'default unhighlighted' : 'both highlighted (bug)',
          );
        }

        const shotColored = path.join(SCREENSHOT_DIR, '1-amber-applied.png');
        await page.screenshot({ path: shotColored, fullPage: false });

        // Now click the "default" button to clear the override
        const defaultBtn = page.locator('button[title*="Reset to default"]').first();
        if (await defaultBtn.count() > 0) {
          await defaultBtn.click();
          await page.waitForTimeout(500);

          const coloredSpanAfter = page.locator('[data-label-id]').last();
          const styleAfter = await coloredSpanAfter.getAttribute('style');
          const cleared = !styleAfter?.includes('rgb(245, 158, 11)') && !styleAfter?.toLowerCase().includes('#f59e0b');
          record(
            'Default button clears color override',
            cleared,
            cleared ? 'override cleared' : `still has: ${styleAfter?.slice(0, 80)}`,
          );

          // After clearing, the default button itself should have the ring
          const defClassAfter = await defaultBtn.getAttribute('class');
          const defRingAfter = defClassAfter?.includes('ring-blue-500');
          record(
            'After default-click, the default button gets the blue ring',
            !!defRingAfter,
            defRingAfter ? 'ring on default' : 'no ring',
          );

          const shotCleared = path.join(SCREENSHOT_DIR, '2-default-cleared.png');
          await page.screenshot({ path: shotCleared, fullPage: false });
        }

        // Test hex input
        const hexInput = page.locator('input[placeholder="#hex"]').first();
        if (await hexInput.count() > 0) {
          await hexInput.fill('#ff00ff');
          await hexInput.blur();
          await page.waitForTimeout(500);

          const coloredSpanHex = page.locator('[data-label-id]').last();
          const styleHex = await coloredSpanHex.getAttribute('style');
          const hexApplied = styleHex?.toLowerCase().includes('#ff00ff') || styleHex?.includes('rgb(255, 0, 255)');
          record(
            'Custom hex (#ff00ff) is applied to the label',
            !!hexApplied,
            hexApplied ? 'hex applied' : `style: ${styleHex?.slice(0, 80)}`,
          );
        }
      }
    }
  } catch (err) {
    record('Test crashed', false, (err as Error).message);
  } finally {
    await browser.close();
  }

  console.log('');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const color = passed === total ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${passed}/${total} passed\x1b[0m`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  process.exit(passed === total ? 0 : 1);
}

run();
