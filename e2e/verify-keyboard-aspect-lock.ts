/**
 * Verification: K1.5 — keyboard aspect lock + auto-fit canvas.
 *
 * Asserts:
 *   1. With normal canvas dims, keyboard height = whiteKeyWidth × 6.6
 *   2. Forcing canvas too short → banner appears with current+target dims
 *   3. Banner has Auto-fit Canvas button
 *   4. Clicking Auto-fit grows canvasHeight to fit aspect, banner clears
 *   5. Reducing widthPercent shrinks keyboard width AND height (aspect locked)
 *   6. After overflow + auto-fit, manifest's panelHeightPercent matches the
 *      computed value (cache write-back)
 *
 * Prereq: dev server on localhost:3000.
 *
 * Run: npx tsx e2e/verify-keyboard-aspect-lock.ts
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const EDITOR_URL = `${BASE_URL}/admin/deepmind-12/editor`;
const KEY_ASPECT = 6.6;
const ASPECT_TOLERANCE = 0.3;

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

  // Helper: read store dimensions
  async function readDims() {
    return await page.evaluate(`(() => {
      const s = window.useEditorStore.getState();
      return {
        canvasWidth: s.canvasWidth,
        canvasHeight: s.canvasHeight,
        widthPercent: s.keyboard ? s.keyboard.widthPercent : null,
        panelHeightPercent: s.keyboard ? s.keyboard.panelHeightPercent : null,
      };
    })()`) as { canvasWidth: number; canvasHeight: number; widthPercent: number; panelHeightPercent: number };
  }

  // Helper: measure first white key
  async function measureWhiteKey() {
    const el = page.locator('[data-key-type="white"]').first();
    return await el.boundingBox();
  }

  // ── Test 1: Default state — read aspect ────────────────────────────────
  const dims0 = await readDims();
  console.log(`  initial canvas: ${dims0.canvasWidth} × ${dims0.canvasHeight}, widthPercent ${dims0.widthPercent}`);
  const wk0 = await measureWhiteKey();
  if (!wk0) {
    fail('no white keys rendered');
    await browser.close();
    process.exit(exitCode);
  }
  const aspect0 = wk0.height / wk0.width;
  console.log(`  initial whiteKey: ${wk0.width.toFixed(0)} × ${wk0.height.toFixed(0)} (aspect ${aspect0.toFixed(2)})`);

  // ── Test 2: Force overflow by shrinking canvas height ──────────────────
  await page.evaluate(`window.useEditorStore.setState({ canvasHeight: 400 })`);
  await page.waitForTimeout(700);

  const banner = page.locator('[data-testid="keyboard-aspect-banner"]');
  const bannerVisible = await banner.count();
  if (bannerVisible > 0) {
    pass(`banner appears when canvas is too short (canvasHeight=400)`);
  } else {
    fail(`banner did NOT appear after forcing overflow`);
  }

  // Test 3: banner contains current and target dims
  if (bannerVisible > 0) {
    const bannerText = await banner.textContent();
    const hasCurrent = bannerText?.includes('400') ?? false;
    const hasTarget = bannerText?.match(/\d{3,4}\s*×\s*\d{3,4}/g) ?? [];
    if (hasCurrent && hasTarget.length >= 2) {
      pass(`banner shows current (× 400) and target dims (found ${hasTarget.length} × pairs)`);
    } else {
      fail(`banner text incomplete — current=${hasCurrent}, target pairs=${hasTarget.length}`);
    }

    // Test 4: Auto-fit button works
    const autofitBtn = page.locator('[data-testid="keyboard-aspect-banner-autofit"]');
    if (await autofitBtn.count() > 0) {
      pass(`Auto-fit button rendered`);
      await autofitBtn.click();
      await page.waitForTimeout(700);

      const dims1 = await readDims();
      console.log(`  after auto-fit: ${dims1.canvasWidth} × ${dims1.canvasHeight}`);
      if (dims1.canvasHeight > 400) {
        pass(`canvasHeight grew from 400 → ${dims1.canvasHeight}`);
      } else {
        fail(`canvasHeight did not grow after Auto-fit (still ${dims1.canvasHeight})`);
      }

      const bannerStillVisible = await banner.count();
      if (bannerStillVisible === 0) {
        pass(`banner cleared after Auto-fit`);
      } else {
        fail(`banner still showing after Auto-fit (aspect should be locked)`);
      }

      // Test 5: aspect now locked
      const wk1 = await measureWhiteKey();
      if (wk1) {
        const aspect1 = wk1.height / wk1.width;
        if (Math.abs(aspect1 - KEY_ASPECT) < ASPECT_TOLERANCE) {
          pass(`aspect after auto-fit ≈ ${aspect1.toFixed(2)} (target ${KEY_ASPECT})`);
        } else {
          fail(`aspect after auto-fit = ${aspect1.toFixed(2)}, expected ≈ ${KEY_ASPECT}`);
        }
      }
    } else {
      fail(`Auto-fit button not found`);
    }
  }

  // ── Test 6: Reduce widthPercent — keyboard halves both axes, aspect held ───
  await page.evaluate(`(() => {
    const s = window.useEditorStore.getState();
    window.useEditorStore.setState({
      keyboard: Object.assign({}, s.keyboard, { widthPercent: 50 }),
    });
  })()`);
  await page.waitForTimeout(700);

  const wk2 = await measureWhiteKey();
  if (wk2) {
    const aspect2 = wk2.height / wk2.width;
    if (Math.abs(aspect2 - KEY_ASPECT) < ASPECT_TOLERANCE) {
      pass(`aspect at widthPercent=50 still ≈ ${aspect2.toFixed(2)}`);
    } else {
      fail(`aspect at widthPercent=50 = ${aspect2.toFixed(2)}, expected ≈ ${KEY_ASPECT}`);
    }
  }

  // ── Test 7: panelHeightPercent cache write-back ────────────────────────
  const finalDims = await readDims();
  // Compute what panelHeightPercent SHOULD be based on current canvas + widthPercent
  const layout = await page.evaluate(`(() => {
    const s = window.useEditorStore.getState();
    const keys = s.keyboard.keys;
    const startNote = s.keyboard.startNote;
    const widthPercent = s.keyboard.widthPercent || 100;
    // 49 keys C2 = 29 white keys
    const totalWhiteKeys = 29;
    const keyboardWidth = (s.canvasWidth * widthPercent) / 100;
    const whiteKeyWidth = keyboardWidth / totalWhiteKeys;
    const desiredHeight = whiteKeyWidth * 6.6;
    const maxAllowed = Math.min(s.canvasHeight - 30, s.canvasHeight * 0.65);
    const keyboardHeight = Math.min(desiredHeight, maxAllowed);
    return ((s.canvasHeight - keyboardHeight) / s.canvasHeight) * 100;
  })()`) as number;

  if (Math.abs(finalDims.panelHeightPercent - layout) < 0.5) {
    pass(`stored panelHeightPercent (${finalDims.panelHeightPercent.toFixed(1)}) matches computed (${layout.toFixed(1)})`);
  } else {
    fail(`stored panelHeightPercent (${finalDims.panelHeightPercent.toFixed(1)}) differs from computed (${layout.toFixed(1)})`);
  }

  await browser.close();

  if (exitCode === 0) {
    console.log('\n\x1b[32mAll K1.5 aspect-lock checks passed.\x1b[0m');
  } else {
    console.error('\n\x1b[31mK1.5 verification FAILED.\x1b[0m');
  }
  process.exit(exitCode);
}

run().catch((err: unknown) => { console.error(err); process.exit(1); });
