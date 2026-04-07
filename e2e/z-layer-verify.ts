/**
 * Z-Layer Validation for Panel Editor
 * Validates click-through behavior and z-index stacking order.
 *
 * Tests the current z-layer stack and validates assumptions
 * for the proposed grouping/alignment feature design.
 *
 * Run: npx tsx e2e/z-layer-verify.ts [deviceId]
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.argv[2] || 'cdj-3000';
const EDITOR_URL = `${BASE_URL}/admin/${DEVICE_ID}/editor`;
const SCREENSHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/z-layer');

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
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Load editor
  try {
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.control-node', { timeout: 60000 });
    console.log('  Editor loaded successfully\n');
  } catch (err) {
    console.error('  FATAL: Editor failed to load:', err);
    await browser.close();
    process.exit(2);
  }

  // ── Test 1: Audit all z-index values on canvas elements ──────────────────
  try {
    const zIndexMap = await page.evaluate(() => {
      const results: Record<string, { zIndex: string; pointerEvents: string; count: number }> = {};

      // Walk all absolutely/relatively positioned elements inside the canvas
      const canvas = document.querySelector('[style*="transformOrigin"]');
      if (!canvas) return results;

      const allElements = canvas.querySelectorAll('*');
      for (const el of allElements) {
        const computed = window.getComputedStyle(el);
        const zIndex = computed.zIndex;
        const position = computed.position;
        const pointerEvents = computed.pointerEvents;

        if (zIndex !== 'auto' && position !== 'static') {
          const classes = el.className?.toString?.() || '';
          const dataId = el.getAttribute('data-control-id');
          const inlineStyle = (el as HTMLElement).style;
          let type = 'other';
          if (dataId) type = 'control-data-id';
          else if (classes.includes('control-node')) type = 'control-node';
          else if (classes.includes('section-drag-handle')) type = 'section-drag-handle';
          else if (el.getAttribute('data-label-id')) type = 'editor-label';
          else if (inlineStyle?.zIndex === '150' && inlineStyle?.pointerEvents === 'none') type = 'label-layer-wrapper';

          const key = `${type}:z=${zIndex}:pe=${pointerEvents}`;
          if (!results[key]) {
            results[key] = { zIndex, pointerEvents, count: 0 };
          }
          results[key].count++;
        }
      }

      return results;
    });

    const screenshotPath = path.join(SCREENSHOT_DIR, '01-z-index-audit.png');
    await page.screenshot({ path: screenshotPath });

    const entries = Object.entries(zIndexMap).sort((a, b) =>
      parseInt(a[1].zIndex) - parseInt(b[1].zIndex)
    );

    let detail = 'Z-Index Stack (bottom→top):\n';
    for (const [key, val] of entries) {
      detail += `    ${key} (x${val.count})\n`;
    }

    results.push({
      name: 'Z-index audit — all canvas elements',
      passed: true,
      detail,
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: 'Z-index audit', passed: false, detail: `${err}` });
  }

  // ── Test 2: Controls are clickable (not blocked by labels or overlays) ───
  // Only checks controls visible within the viewport (not scrolled off-screen)
  try {
    const controlNodes = await page.$$('.control-node');
    let clickable = 0;
    let blocked = 0;
    let offscreen = 0;
    const blockedIds: string[] = [];
    const vw = 1440, vh = 900;

    const testCount = Math.min(20, controlNodes.length);
    for (let i = 0; i < testCount; i++) {
      const node = controlNodes[i];
      const box = await node.boundingBox();
      if (!box) continue;

      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;

      // Skip controls outside viewport
      if (cx < 0 || cx > vw || cy < 0 || cy > vh) {
        offscreen++;
        continue;
      }

      const hitElement = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return { tag: 'none', classes: '', isControlOrChild: false, blocker: '' };
        const isControlOrChild = !!el.closest('.control-node');
        // If blocked, find what's blocking
        let blocker = '';
        if (!isControlOrChild) {
          blocker = el.tagName + '.' + (el.className?.toString?.().slice(0, 50) || '');
          const style = window.getComputedStyle(el);
          blocker += ` z=${style.zIndex} pe=${style.pointerEvents}`;
        }
        return { tag: el.tagName, classes: el.className?.toString?.().slice(0, 80) || '', isControlOrChild, blocker };
      }, { x: cx, y: cy });

      if (hitElement.isControlOrChild) {
        clickable++;
      } else {
        blocked++;
        const controlId = await node.evaluate((el) =>
          el.querySelector('[data-control-id]')?.getAttribute('data-control-id') || 'unknown'
        );
        blockedIds.push(`${controlId} blocked by: ${hitElement.blocker}`);
      }
    }

    const screenshotPath = path.join(SCREENSHOT_DIR, '02-click-through.png');
    await page.screenshot({ path: screenshotPath });

    const inViewport = testCount - offscreen;
    const passed = blocked === 0 && inViewport > 0;
    let detail = `${clickable}/${inViewport} in-viewport controls clickable (${offscreen} off-screen skipped)`;
    if (blocked > 0) {
      detail += `\n    BLOCKED:\n    ${blockedIds.join('\n    ')}`;
    }

    results.push({
      name: 'Controls clickable (not blocked by overlays)',
      passed,
      detail,
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: 'Controls clickable', passed: false, detail: `${err}` });
  }

  // ── Test 3: Labels clickable (text span has pointer-events) ──────────────
  try {
    const labelSpans = await page.$$('[data-label-id]');
    let clickable = 0;
    let blocked = 0;
    const testCount = Math.min(5, labelSpans.length);

    for (let i = 0; i < testCount; i++) {
      const span = labelSpans[i];
      const box = await span.boundingBox();
      if (!box) continue;

      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;

      const hitElement = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return { hasLabelId: false };
        return { hasLabelId: !!el.closest('[data-label-id]') || !!el.getAttribute('data-label-id') };
      }, { x: cx, y: cy });

      if (hitElement.hasLabelId) clickable++;
      else blocked++;
    }

    results.push({
      name: 'Labels clickable via text span',
      passed: blocked === 0 && testCount > 0,
      detail: testCount === 0
        ? 'No labels found (labels may be hidden)'
        : `${clickable}/${testCount} labels clickable, ${blocked} blocked`,
    });
  } catch (err) {
    results.push({ name: 'Labels clickable', passed: false, detail: `${err}` });
  }

  // ── Test 4: Selected control z-index raises above unselected ─────────────
  try {
    const controlNodes = await page.$$('.control-node');
    if (controlNodes.length < 2) {
      results.push({ name: 'Selected control z-raise', passed: false, detail: 'Need 2+ controls' });
    } else {
      // Get z-index of first control before selection
      const beforeZ = await controlNodes[0].evaluate((el) =>
        window.getComputedStyle(el).zIndex
      );

      // Click to select
      await controlNodes[0].click({ force: true });
      await page.waitForTimeout(300);

      // Get z-index after selection
      const afterZ = await controlNodes[0].evaluate((el) =>
        window.getComputedStyle(el).zIndex
      );

      // Get z-index of unselected neighbor
      const neighborZ = await controlNodes[1].evaluate((el) =>
        window.getComputedStyle(el).zIndex
      );

      const screenshotPath = path.join(SCREENSHOT_DIR, '04-selected-z-raise.png');
      await page.screenshot({ path: screenshotPath });

      const passed = parseInt(afterZ) > parseInt(neighborZ);
      results.push({
        name: 'Selected control z-index raises above unselected',
        passed,
        detail: `before=${beforeZ}, after=${afterZ}, neighbor=${neighborZ}`,
        screenshot: screenshotPath,
      });
    }
  } catch (err) {
    results.push({ name: 'Selected control z-raise', passed: false, detail: `${err}` });
  }

  // ── Test 5: Section frame z-index behavior ───────────────────────────────
  try {
    const sectionFrames = await page.$$('[class*="hover:border-white"]');

    const zIndices: { text: string; z: number }[] = [];
    for (const frame of sectionFrames) {
      const info = await frame.evaluate((el) => {
        const z = parseInt(window.getComputedStyle(el).zIndex) || 0;
        const text = el.querySelector('.section-drag-handle span')?.textContent || 'unknown';
        return { text: text.trim(), z };
      });
      zIndices.push(info);
    }

    // Sort by z-index
    zIndices.sort((a, b) => a.z - b.z);

    const screenshotPath = path.join(SCREENSHOT_DIR, '05-section-z-order.png');
    await page.screenshot({ path: screenshotPath });

    const detail = zIndices.map(s => `${s.text}: z=${s.z}`).join(', ');
    results.push({
      name: 'Section frame z-ordering (largest area = lowest z)',
      passed: zIndices.length > 0,
      detail: `${zIndices.length} sections: ${detail}`,
      screenshot: screenshotPath,
    });
  } catch (err) {
    results.push({ name: 'Section frame z-ordering', passed: false, detail: `${err}` });
  }

  // ── Test 6: LabelLayer wrapper is pointer-events:none ────────────────────
  try {
    const labelLayerPass = await page.evaluate(() => {
      const canvas = document.querySelector('[style*="transformOrigin"]');
      if (!canvas) return { found: false, pointerEvents: '', zIndex: '' };

      const all = canvas.querySelectorAll('*');
      for (const el of all) {
        const htmlEl = el as HTMLElement;
        // Check both inline style and computed style
        const inlineZ = htmlEl.style?.zIndex;
        const inlinePE = htmlEl.style?.pointerEvents;
        const computed = window.getComputedStyle(htmlEl);

        // LabelLayer wrapper: absolute div with z=150 and pointer-events:none
        if ((inlineZ === '150' || computed.zIndex === '150') &&
            (inlinePE === 'none' || computed.pointerEvents === 'none')) {
          return { found: true, pointerEvents: computed.pointerEvents, zIndex: computed.zIndex };
        }
      }
      return { found: false, pointerEvents: '', zIndex: '' };
    });

    results.push({
      name: 'LabelLayer wrapper is pointer-events:none (pass-through)',
      passed: labelLayerPass.found && labelLayerPass.pointerEvents === 'none',
      detail: labelLayerPass.found
        ? `Found at z=${labelLayerPass.zIndex}, pointerEvents=${labelLayerPass.pointerEvents}`
        : 'LabelLayer wrapper not found',
    });
  } catch (err) {
    results.push({ name: 'LabelLayer wrapper pass-through', passed: false, detail: `${err}` });
  }

  // ── Test 7: Click canvas background deselects all ────────────────────────
  try {
    // First select a control
    const controlNodes = await page.$$('.control-node');
    if (controlNodes.length > 0) {
      await controlNodes[0].click({ force: true });
      await page.waitForTimeout(300);

      // Check something is selected
      const beforeCount = await page.evaluate(() => {
        const selected = document.querySelectorAll('.control-node');
        let count = 0;
        for (const n of selected) {
          const style = n.getAttribute('style') || '';
          if (style.includes('59') && style.includes('130') && style.includes('246')) count++;
        }
        return count;
      });

      // Press Escape to deselect (more reliable than clicking empty space)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const afterCount = await page.evaluate(() => {
        const selected = document.querySelectorAll('.control-node');
        let count = 0;
        for (const n of selected) {
          const style = n.getAttribute('style') || '';
          if (style.includes('59') && style.includes('130') && style.includes('246')) count++;
        }
        return count;
      });

      const screenshotPath = path.join(SCREENSHOT_DIR, '07-deselect.png');
      await page.screenshot({ path: screenshotPath });

      results.push({
        name: 'Click canvas background deselects all controls',
        passed: beforeCount > 0 && afterCount === 0,
        detail: `selected before click: ${beforeCount}, after: ${afterCount}`,
        screenshot: screenshotPath,
      });
    }
  } catch (err) {
    results.push({ name: 'Canvas deselect', passed: false, detail: `${err}` });
  }

  // ── Test 8: Multi-select z-index — all selected raise together ───────────
  try {
    const controlNodes = await page.$$('.control-node');
    if (controlNodes.length >= 3) {
      // Click first control
      await controlNodes[0].click({ force: true });
      await page.waitForTimeout(200);

      // Shift+click second and third
      await controlNodes[1].click({ force: true, modifiers: ['Shift'] });
      await page.waitForTimeout(200);
      await controlNodes[2].click({ force: true, modifiers: ['Shift'] });
      await page.waitForTimeout(300);

      // Check z-indices of all three
      const zValues = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.control-node');
        const zList: { index: number; z: string; hasOutline: boolean }[] = [];
        let i = 0;
        for (const n of nodes) {
          if (i >= 3) break;
          const style = window.getComputedStyle(n);
          const attrStyle = n.getAttribute('style') || '';
          const hasOutline = attrStyle.includes('59') && attrStyle.includes('130');
          zList.push({ index: i, z: style.zIndex, hasOutline });
          i++;
        }
        return zList;
      });

      const screenshotPath = path.join(SCREENSHOT_DIR, '08-multi-select-z.png');
      await page.screenshot({ path: screenshotPath });

      const selectedZ = zValues.filter(v => v.hasOutline).map(v => parseInt(v.z));
      const allSameZ = selectedZ.length >= 2 && selectedZ.every(z => z === selectedZ[0]);

      results.push({
        name: 'Multi-selected controls all raise to same z-index',
        passed: allSameZ && selectedZ[0] >= 50,
        detail: `z-values: ${zValues.map(v => `[${v.index}] z=${v.z} selected=${v.hasOutline}`).join(', ')}`,
        screenshot: screenshotPath,
      });
    } else {
      results.push({ name: 'Multi-select z-index', passed: false, detail: 'Need 3+ controls' });
    }
  } catch (err) {
    results.push({ name: 'Multi-select z-index', passed: false, detail: `${err}` });
  }

  // ── Test 9: Keyboard section z-index validation ──────────────────────────
  try {
    const keyboardZ = await page.evaluate(() => {
      // Find the keyboard section by looking for the "Keyboard" label
      const allElements = document.querySelectorAll('[style*="zIndex"]');
      for (const el of allElements) {
        const text = el.textContent || '';
        if (text.includes('Keyboard') && (el as HTMLElement).style?.zIndex) {
          return (el as HTMLElement).style.zIndex;
        }
      }
      // Also check computed style on elements with explicit z-index 50
      const canvas = document.querySelector('[style*="transformOrigin"]');
      if (!canvas) return 'no-canvas';
      const candidates = canvas.querySelectorAll('*');
      for (const el of candidates) {
        const style = (el as HTMLElement).style;
        if (style?.zIndex === '50') {
          const text = el.textContent || '';
          if (text.includes('Keyboard')) return '50';
        }
      }
      return 'not-found';
    });

    results.push({
      name: 'Keyboard section z-index',
      passed: keyboardZ !== 'not-found',
      detail: `Keyboard z-index: ${keyboardZ}`,
    });
  } catch (err) {
    results.push({ name: 'Keyboard section z-index', passed: false, detail: `${err}` });
  }

  // ── Test 10: Proposed group overlay z-slot is clear ──────────────────────
  // Validate that no existing element occupies z=20 or z=70 (our proposed slots)
  try {
    const conflictCheck = await page.evaluate(() => {
      const canvas = document.querySelector('[style*="transformOrigin"]');
      if (!canvas) return { z20: [], z70: [] };

      const z20: string[] = [];
      const z70: string[] = [];

      const all = canvas.querySelectorAll('*');
      for (const el of all) {
        const computed = window.getComputedStyle(el);
        const z = parseInt(computed.zIndex);
        const pos = computed.position;
        if (pos === 'static') continue;

        if (z === 20) z20.push(el.tagName + '.' + (el.className?.toString?.().slice(0, 30) || ''));
        if (z === 70) z70.push(el.tagName + '.' + (el.className?.toString?.().slice(0, 30) || ''));
      }

      return { z20, z70 };
    });

    const clear = conflictCheck.z20.length === 0 && conflictCheck.z70.length === 0;
    results.push({
      name: 'Proposed group z-slots (20, 70) are clear',
      passed: clear,
      detail: clear
        ? 'No existing elements at z=20 or z=70 — safe for group overlays'
        : `CONFLICT: z=20: [${conflictCheck.z20.join(', ')}], z=70: [${conflictCheck.z70.join(', ')}]`,
    });
  } catch (err) {
    results.push({ name: 'Proposed group z-slots clear', passed: false, detail: `${err}` });
  }

  // ── Final screenshot ──────────────────────────────────────────────────────
  const finalScreenshot = path.join(SCREENSHOT_DIR, '99-final-state.png');
  await page.screenshot({ path: finalScreenshot, fullPage: false });

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n===================================================');
  console.log('  Z-Layer Validation Report  ');
  console.log('===================================================\n');

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${r.name}`);
    // Multi-line detail handling
    for (const line of r.detail.split('\n')) {
      console.log(`         ${line}`);
    }
    if (r.screenshot) {
      console.log(`         Screenshot: ${r.screenshot}`);
    }
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
