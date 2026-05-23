/**
 * Verifies the keyboard overlap banner updates when a control's position
 * changes. Bug report (2026-05-08): "When I move a control outside of the
 * keyboard, the banner still warns that it is overlapping."
 *
 * Test strategy:
 *   1. Force overlap by moving a control INTO the keyboard area
 *   2. Confirm banner lists that control
 *   3. Move the same control OUT of the keyboard area (via store)
 *   4. Assert banner no longer lists that control
 *
 * Prereq: dev server on localhost:3000.
 *
 * Run: npx tsx e2e/verify-banner-updates-on-control-move.ts
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

  // Step 1: pick a control and move it INTO the keyboard area to force overlap.
  // Pick the first control in the store and place it at a y that's clearly
  // inside the keyboard's vertical band, with x inside the keyboard's width.
  const setupResult = await page.evaluate(`(() => {
    const store = window.useEditorStore;
    if (!store) return null;
    const s = store.getState();
    const kb = s.keyboard;
    if (!kb) return null;
    // Compute keyboard rect
    const kbX = ((kb.leftPercent || 0) / 100) * s.canvasWidth;
    const kbY = (kb.panelHeightPercent / 100) * s.canvasHeight;
    const kbW = ((kb.widthPercent || 100) / 100) * s.canvasWidth;
    // Find a control by id and move it into the keyboard area
    const controlId = Object.keys(s.controls)[0];
    if (!controlId) return null;
    const c = s.controls[controlId];
    // Place it well within the keyboard's bounding box
    const targetX = kbX + kbW / 2 - (c.w || 40) / 2;
    const targetY = kbY + 50; // 50px below keyboard top → overlap of (kbY + 50 + h) - kbY ≈ 90px
    store.setState((prev) => {
      const cur = prev.controls;
      return {
        controls: Object.assign({}, cur, {
          [controlId]: Object.assign({}, cur[controlId], { x: targetX, y: targetY }),
        }),
      };
    });
    return { controlId, kbX, kbY, kbW, targetX, targetY };
  })()`) as { controlId: string; kbX: number; kbY: number; kbW: number; targetX: number; targetY: number } | null;

  if (!setupResult) {
    fail('failed to setup overlap scenario');
    await browser.close();
    process.exit(exitCode);
  }
  const { controlId, kbX, kbY, kbW } = setupResult;
  console.log(`  Moved ${controlId} to (${setupResult.targetX.toFixed(0)}, ${setupResult.targetY.toFixed(0)}) inside keyboard rect (kbX=${kbX.toFixed(0)}, kbY=${kbY.toFixed(0)}, kbW=${kbW.toFixed(0)})`);
  await page.waitForTimeout(500);

  // Step 2: confirm banner shows that control in the overlap list
  const overlapItem = page.locator(`[data-testid="keyboard-overlap-find-${controlId}"]`);
  const count1 = await overlapItem.count();
  if (count1 > 0) {
    pass(`banner lists ${controlId} as overlapping after force-move`);
  } else {
    fail(`banner did NOT list ${controlId} after force-move into keyboard area`);
    // dump banner contents for diagnosis
    const banner = await page.locator('[data-testid="keyboard-aspect-banner"]').textContent().catch(() => null);
    console.log(`  banner text: ${banner?.slice(0, 200) ?? '(no banner rendered)'}`);
    await browser.close();
    process.exit(exitCode);
  }

  // Step 3: move the SAME control OUT of the keyboard area (high above keyboard top)
  await page.evaluate(`(() => {
    const store = window.useEditorStore;
    const s = store.getState();
    const ctrl = s.controls['${controlId}'];
    store.setState((prev) => {
      const cur = prev.controls;
      return {
        controls: Object.assign({}, cur, {
          [ctrl.id]: Object.assign({}, cur[ctrl.id], { x: 10, y: 50 }),
        }),
      };
    });
  })()`);
  await page.waitForTimeout(500);

  // Step 4: banner should no longer list this control
  const count2 = await overlapItem.count();
  if (count2 === 0) {
    pass(`banner no longer lists ${controlId} after moving out of keyboard area`);
  } else {
    fail(`BUG REPRO: banner STILL lists ${controlId} after move-out`);
    // Read store state to confirm the move actually happened
    const post = await page.evaluate(`(() => {
      const c = window.useEditorStore.getState().controls['${controlId}'];
      return { x: c.x, y: c.y, w: c.w, h: c.h };
    })()`) as { x: number; y: number; w: number; h: number };
    console.log(`  post-move store state for ${controlId}:`, post);
  }

  await browser.close();
  if (exitCode === 0) {
    console.log('\n\x1b[32mBanner correctly tracks control moves.\x1b[0m');
  } else {
    console.error('\n\x1b[31mBug confirmed — banner does not update on control move.\x1b[0m');
  }
  process.exit(exitCode);
}

run().catch((err: unknown) => { console.error(err); process.exit(1); });
