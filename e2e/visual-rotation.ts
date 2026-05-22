/**
 * EP9 — Real-flow rotation test.
 *
 * Loads deepmind-12 editor with ?nosave=true and exercises:
 *   - Cardinal rotation buttons (0, 90, 180, 270) on a slider — asserts
 *     that 0→90 (and 0→270) auto-swaps w↔h (EP6-B per-control flip)
 *     while 0→180 keeps the bbox vertical
 *   - Custom angle input (typed value, e.g., 45°) — asserts arbitrary
 *     rotation persists and does NOT swap the bbox
 *   - Shift+Alt+R shortcut — asserts each press rotates selection by 90°
 *
 * Pass criteria:
 *   - Every action lands the expected rotation value in the store
 *   - Cardinal-cross transitions on faders/sliders swap w↔h
 *   - Non-cardinal angles leave the bbox unchanged
 *   - The keyboard shortcut works when input focus is on the canvas
 */
import { chromium } from 'playwright';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = 'deepmind-12';

interface ControlState {
  rotation: number;
  w: number;
  h: number;
  type: string;
}

async function getCtrl(page: import('playwright').Page, controlId: string): Promise<ControlState | null> {
  return page.evaluate((id) => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { controls: Record<string, ControlState> } };
    };
    const c = win.useEditorStore?.getState().controls[id];
    return c ? { rotation: c.rotation ?? 0, w: c.w, h: c.h, type: c.type } : null;
  }, controlId);
}

async function findSliderWithRotation0(page: import('playwright').Page): Promise<string | null> {
  return page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { controls: Record<string, { id: string; type: string; rotation?: number }> } };
    };
    const controls = win.useEditorStore?.getState().controls ?? {};
    for (const c of Object.values(controls)) {
      if ((c.type === 'slider' || c.type === 'fader') && (c.rotation ?? 0) === 0) return c.id;
    }
    return null;
  });
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

  const controlId = await findSliderWithRotation0(page);
  if (!controlId) {
    console.error('No slider with rotation=0 found — every fader on deepmind-12 has been rotated. Use an untouched device.');
    await browser.close();
    process.exit(1);
  }
  console.log(`Testing rotation on slider: ${controlId}`);

  const before = await getCtrl(page, controlId);
  if (!before) throw new Error('No control state');
  console.log(`  initial: w=${before.w}, h=${before.h}, rotation=${before.rotation}`);

  // Select control
  const locator = page.locator(`[data-control-id="${controlId}"]`);
  await locator.scrollIntoViewIfNeeded({ timeout: 5_000 });
  const box = await locator.boundingBox();
  if (!box) throw new Error('No bbox');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);

  let allPassed = true;

  // Scope the rotation quick-button locators to the "Rotate" row in
  // Properties panel — unambiguous regardless of other "0°" text on page.
  const rotationRow = page.locator('div').filter({
    has: page.locator('label').filter({ hasText: /^Rotate$/ }),
  }).first();
  const rotateBtn = (deg: number) =>
    rotationRow.locator('button').filter({ hasText: new RegExp(`^${deg}°$`) }).first();

  const cardinalTest = async (deg: number, expW: number, expH: number, label: string) => {
    await rotateBtn(deg).click({ timeout: 5_000 });
    await page.waitForTimeout(350);
    const s = await getCtrl(page, controlId);
    if (!s) throw new Error('lost control');
    const ok = s.rotation === deg && s.w === expW && s.h === expH;
    console.log(`  ${ok ? '✓' : '✗'} ${label}: rotation=${s.rotation}, w=${s.w} (expected ${expW}), h=${s.h} (expected ${expH})`);
    return ok;
  };

  // 0 → 90 swap; 90 → 180 swap-back; 180 → 270 swap; 270 → 0 swap-back
  if (!await cardinalTest(90, before.h, before.w, '0→90')) allPassed = false;
  if (!await cardinalTest(180, before.w, before.h, '90→180')) allPassed = false;
  if (!await cardinalTest(270, before.h, before.w, '180→270')) allPassed = false;
  if (!await cardinalTest(0, before.w, before.h, '270→0')) allPassed = false;

  // --- Test 5: Custom angle 45° should NOT swap bbox ---
  // Find the rotation custom input by searching the document directly.
  // There's only one input[type=number] with "Custom rotation angle" title
  // (assigned in RotationInput component).
  const customInput = page.locator('input[title*="Custom rotation angle"]').first();
  await customInput.click({ timeout: 5_000 });
  await customInput.fill('45');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  let s = await getCtrl(page, controlId);
  if (!s) throw new Error('lost control');
  const test5 = s.rotation === 45 && s.w === before.w && s.h === before.h;
  console.log(`  ${test5 ? '✓' : '✗'} 0→45 (custom): rotation=${s.rotation}, w=${s.w} (expected ${before.w}), h=${s.h} (expected ${before.h})`);
  if (!test5) allPassed = false;

  // Reset to 0 (still in-memory only, ?nosave=true) so test 6 starts clean
  await customInput.fill('0');
  await customInput.press('Enter');
  await page.waitForTimeout(250);

  // --- Test 6: Shift+Alt+R rotates 90° CW ---
  // Move focus off the input first.
  await page.click('body');
  await page.waitForTimeout(200);
  // Re-select the control so the keyboard shortcut targets it
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await page.keyboard.press('Shift+Alt+R');
  await page.waitForTimeout(300);
  s = await getCtrl(page, controlId);
  if (!s) throw new Error('lost control');
  const test6 = s.rotation === 90 && s.w === before.h && s.h === before.w;
  console.log(`  ${test6 ? '✓' : '✗'} Shift+Alt+R on 0: rotation=${s.rotation}, w=${s.w} (expected ${before.h}), h=${s.h} (expected ${before.w})`);
  if (!test6) allPassed = false;

  await browser.close();
  if (!allPassed) {
    console.error('FAIL — rotation behavior diverges from expected');
    process.exit(1);
  }
  console.log('PASS — all rotation behaviors verified');
})();
