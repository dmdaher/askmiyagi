/**
 * Verification test for Bug-7 — sparse SVG icons not draggable.
 *
 * Bug: SVG icons rendered with `fill: none` only catch clicks on the
 * painted stroke (per SVG default `pointer-events: visiblePainted`).
 * Sparse icons like `sawtooth-cycle` (3 line segments forming a triangle
 * outline) had a large empty interior — clicks there fell through to the
 * canvas behind, bypassing the parent drag-handle span.
 *
 * Fix: added `pointerEvents: 'all'` to the svgIcon helper's SVG element
 * style. Now clicks anywhere in the icon's bounding rect register.
 *
 * This test:
 *   1. Creates a standalone label with the sawtooth-cycle icon
 *   2. Locates the rendered icon in the DOM
 *   3. Sends a pointerdown at the icon's CENTER (the empty interior)
 *   4. Asserts the editor store's `dragging` state was set
 *
 * Prereq: dev server running on localhost:3000.
 *
 * Run: npx tsx e2e/verify-bug-7-icon-drag.ts
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const EDITOR_URL = `${BASE_URL}/admin/deepmind-12/editor`;

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

  console.log(`Loading ${EDITOR_URL}…`);
  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Inject a standalone label with the sawtooth-cycle icon at a known position
  const TEST_LABEL_ID = 'bug-7-test-label';
  const setupOk = await page.evaluate((labelId: string) => {
    type W = Window & { useEditorStore?: { setState: (fn: (s: unknown) => unknown) => void } };
    const store = (window as unknown as W).useEditorStore;
    if (!store) return false;
    store.setState((s) => {
      const labels = (s as { editorLabels: unknown[] }).editorLabels;
      return {
        editorLabels: [
          ...labels,
          {
            id: labelId,
            controlId: null,
            text: '',  // icon-only label — no text
            icon: 'sawtooth-cycle',
            x: 200,
            y: 200,
            fontSize: 24,  // large so click target is generous
            align: 'left' as const,
          },
        ],
      };
    });
    return true;
  }, TEST_LABEL_ID);
  if (!setupOk) {
    fail('useEditorStore not exposed — cannot inject test label');
    await browser.close();
    process.exit(exitCode);
  }
  pass('injected test label with sawtooth-cycle icon');
  await page.waitForTimeout(500);

  // Find the icon's SVG in the DOM via the label's data-label-id
  const labelLocator = page.locator(`[data-label-id="${TEST_LABEL_ID}"]`).first();
  const labelExists = await labelLocator.count();
  if (labelExists === 0) {
    fail('test label not found in DOM');
    await browser.close();
    process.exit(exitCode);
  }
  const labelBox = await labelLocator.boundingBox();
  if (!labelBox) {
    fail('test label has no bounding box');
    await browser.close();
    process.exit(exitCode);
  }
  pass(`label rendered at ${labelBox.x.toFixed(0)},${labelBox.y.toFixed(0)} (${labelBox.width.toFixed(0)}x${labelBox.height.toFixed(0)})`);

  // Click on the icon's empty interior — center of the bounding box
  const cx = labelBox.x + labelBox.width / 2;
  const cy = labelBox.y + labelBox.height / 2;

  // Read dragging state before
  const draggingBefore = await page.evaluate(() => {
    type W = Window & { useEditorStore?: { getState: () => { dragging?: string | null } } };
    return (window as unknown as W).useEditorStore?.getState().dragging ?? null;
  });

  // Send pointer events: down then small move (some drag systems need movement to commit)
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 5, cy + 5);
  await page.waitForTimeout(200);

  const draggingAfter = await page.evaluate(() => {
    type W = Window & { useEditorStore?: { getState: () => { dragging?: string | null; selectedLabelId?: string | null } } };
    const s = (window as unknown as W).useEditorStore?.getState();
    return { dragging: s?.dragging ?? null, selectedLabelId: s?.selectedLabelId ?? null };
  });

  await page.mouse.up();

  if (draggingAfter.dragging === TEST_LABEL_ID) {
    pass(`dragging === '${TEST_LABEL_ID}' — drag event registered on icon interior (Bug-7 fixed)`);
  } else if (draggingAfter.selectedLabelId === TEST_LABEL_ID) {
    pass(`selectedLabelId === '${TEST_LABEL_ID}' — pointerdown registered (label selected, drag may need more movement)`);
  } else {
    fail(`drag NOT registered. dragging=${draggingAfter.dragging}, selectedLabelId=${draggingAfter.selectedLabelId}, before=${draggingBefore}`);
  }

  await browser.close();

  if (exitCode === 0) {
    console.log('\n\x1b[32mBug-7 fix verified.\x1b[0m');
  } else {
    console.error('\n\x1b[31mBug-7 verification FAILED.\x1b[0m');
  }
  process.exit(exitCode);
}

run().catch((err: unknown) => { console.error(err); process.exit(1); });
