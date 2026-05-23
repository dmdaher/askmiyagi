/**
 * Regression test for Bug-5 (2026-05-06).
 *
 * Bug: when `editorLabels[]` had many entries, the unassigned-labels block
 * in LayersPanel.tsx had no height cap. Its natural size crushed the
 * `flex-1` section list to 0px, making sections invisible (in DOM but
 * visually 0 height).
 *
 * Fix (PR #94): max-height: 33vh + overflow-y-auto on the unassigned block.
 *
 * This test:
 *   1. Loads /admin/deepmind-12/editor (cookie auth)
 *   2. Injects 100 standalone labels into editorLabels[] via store
 *   3. Asserts the section list height stays > 100px (sections still visible)
 *   4. Asserts the unassigned-labels block honors its 33vh cap
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000 (npm run dev)
 *   - ADMIN_PASSWORD env var (defaults to 'miyagi2026' per project default)
 *
 * Run: npm run regression:layers
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const DEVICE_ID = process.argv[2] || 'deepmind-12';
const EDITOR_URL = `${BASE_URL}/admin/${DEVICE_ID}/editor`;
const LABEL_COUNT = 100;

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
  await page.waitForTimeout(4000); // store hydration

  // Make sure layers panel is open
  const layersVisible = await page.locator('[data-testid="layers-section-list"]').count();
  if (layersVisible === 0) {
    await page.keyboard.press('l');
    await page.waitForTimeout(500);
  }

  // Sanity check: store hook is exposed on window
  const storeAvailable = await page.evaluate(() => {
    type W = Window & { useEditorStore?: { getState: () => unknown; setState: (fn: (s: unknown) => unknown) => void } };
    return typeof (window as unknown as W).useEditorStore?.setState === 'function';
  });
  if (!storeAvailable) {
    fail('useEditorStore not exposed on window — cannot inject test labels');
    await browser.close();
    process.exit(exitCode);
  }
  pass('useEditorStore exposed on window');

  // Inject N standalone labels (no controlId, no sectionId — go to "Unassigned" block)
  await page.evaluate((count: number) => {
    type StoreShape = { editorLabels: unknown[] };
    type W = Window & { useEditorStore: { setState: (fn: (s: StoreShape) => Partial<StoreShape>) => void } };
    const setState = (window as unknown as W).useEditorStore.setState;
    setState((s) => ({
      editorLabels: [
        ...s.editorLabels,
        ...Array.from({ length: count }, (_, i) => ({
          id: `regression-many-labels-${i}`,
          controlId: null,
          text: `Label ${i}`,
          x: 10,
          y: 10,
          fontSize: 10,
          align: 'left' as const,
        })),
      ],
    }));
  }, LABEL_COUNT);
  await page.waitForTimeout(500);
  pass(`Injected ${LABEL_COUNT} unassigned labels into store`);

  // Assert 1: section list height > 100px (Bug-5 would crush it to 0)
  const sectionListBox = await page.locator('[data-testid="layers-section-list"]').boundingBox();
  if (!sectionListBox) {
    fail('layers-section-list not found in DOM');
  } else if (sectionListBox.height < 100) {
    fail(`section list height ${sectionListBox.height}px < 100px (Bug-5 regression)`);
  } else {
    pass(`section list height = ${sectionListBox.height}px (well above crushed 0px)`);
  }

  // Assert 2: unassigned-labels block honors 33vh cap
  // 33vh of 900px viewport = 297px
  const unassignedBox = await page.locator('[data-testid="layers-unassigned-labels"]').boundingBox();
  if (!unassignedBox) {
    fail('layers-unassigned-labels not found in DOM');
  } else if (unassignedBox.height > 305) { // small tolerance over exact 297
    fail(`unassigned-labels height ${unassignedBox.height}px exceeds 33vh cap (~297px)`);
  } else {
    pass(`unassigned-labels height = ${unassignedBox.height}px (within 33vh cap)`);
  }

  // Assert 3: at least one section is rendered with non-trivial height inside the section list
  // (defensive — proves sections are actually visible, not just the container)
  const firstSection = page.locator('[data-testid="layers-section-list"] > div').first();
  const firstSectionBox = await firstSection.boundingBox();
  if (!firstSectionBox || firstSectionBox.height < 10) {
    fail(`first section box height ${firstSectionBox?.height ?? 0}px — sections not rendering`);
  } else {
    pass(`first section box height = ${firstSectionBox.height}px (sections rendering)`);
  }

  await browser.close();

  if (exitCode === 0) {
    console.log('\n\x1b[32mAll regression checks passed.\x1b[0m');
  } else {
    console.error('\n\x1b[31mRegression FAILED. Bug-5 may have re-emerged.\x1b[0m');
  }
  process.exit(exitCode);
}

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
