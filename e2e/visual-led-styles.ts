/**
 * EP9 — Real-flow visual test for the 5 LED-style pills.
 *
 * Loads the deepmind-12 editor with ?nosave=true (no contractor data
 * touched), selects a button-typed control, cycles each of the 5 LED
 * pills (None / Dot / Face / Label / Edge), asserts that the store's
 * `ledStyle` field flipped accordingly, and saves one screenshot per
 * style to /tmp/ep9-led-<style>.png for manual visual inspection.
 *
 * Pass criteria:
 *   - Every pill click changes `ledStyle` to the expected value
 *   - The Slider/button DOM updates (data-control-id wrapper exists)
 *   - No exceptions thrown
 */
import { chromium } from 'playwright';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = 'deepmind-12';

interface ExpectedPill {
  label: string;       // visible button text
  titleFragment: string; // unique substring of title attribute (robust selector)
  storeValue: string | null; // expected ledStyle in store after click
}

const PILLS: ExpectedPill[] = [
  { label: 'None', titleFragment: 'No LED', storeValue: null },
  { label: 'Dot', titleFragment: 'Separate small LED', storeValue: 'dot' },
  { label: 'Face', titleFragment: 'Whole button face', storeValue: 'face' },
  { label: 'Label', titleFragment: 'Only the label/text', storeValue: 'label-backlit' },
  { label: 'Edge', titleFragment: 'Border/ring lights up', storeValue: 'edge-glow' },
];

async function findFirstButtonControl(page: import('playwright').Page): Promise<string | null> {
  return page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { controls: Record<string, { id: string; type: string }> } };
    };
    const controls = win.useEditorStore?.getState().controls ?? {};
    for (const ctrl of Object.values(controls)) {
      if (ctrl.type === 'button' || ctrl.type === 'pad') return ctrl.id;
    }
    return null;
  });
}

async function getLedStyle(page: import('playwright').Page, controlId: string): Promise<string | null | undefined> {
  return page.evaluate((id) => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { controls: Record<string, { ledStyle?: string | null }> } };
    };
    return win.useEditorStore?.getState().controls[id]?.ledStyle ?? null;
  }, controlId);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1800, height: 1200 },
    deviceScaleFactor: 1,
  });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);

  await page.goto(`${BASE}/admin/${DEVICE}/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  const controlId = await findFirstButtonControl(page);
  if (!controlId) {
    console.error('No button/pad control found on deepmind-12');
    await browser.close();
    process.exit(1);
  }
  console.log(`Testing LED pills on control: ${controlId}`);

  // Select the control on the canvas
  const ctrlLocator = page.locator(`[data-control-id="${controlId}"]`);
  await ctrlLocator.scrollIntoViewIfNeeded({ timeout: 5_000 });
  const box = await ctrlLocator.boundingBox();
  if (!box) throw new Error(`No bbox for ${controlId}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);

  let allPassed = true;
  for (const pill of PILLS) {
    // Match by title attribute — each pill's title is unique.
    const pillBtn = page.locator(`button[title*="${pill.titleFragment}"]`).first();
    await pillBtn.click({ timeout: 5_000 });
    await page.waitForTimeout(300);

    const actual = await getLedStyle(page, controlId);
    const ok = actual === pill.storeValue;
    console.log(`  ${ok ? '✓' : '✗'} pill "${pill.label}" → ledStyle=${actual ?? 'null'} (expected ${pill.storeValue ?? 'null'})`);
    if (!ok) allPassed = false;

    // Capture the control region for visual review
    const clip = {
      x: Math.max(0, box.x - 50),
      y: Math.max(0, box.y - 50),
      width: box.width + 100,
      height: box.height + 100,
    };
    await page.screenshot({ path: `/tmp/ep9-led-${pill.storeValue ?? 'none'}.png`, clip });
  }

  await browser.close();
  if (!allPassed) {
    console.error('FAIL — some pill clicks did not update ledStyle as expected');
    process.exit(1);
  }
  console.log('PASS — all 5 LED pills update store state correctly');
})();
