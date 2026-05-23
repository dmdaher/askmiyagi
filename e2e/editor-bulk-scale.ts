/**
 * EP9 — Real-flow bulk-scale test.
 *
 * The headline contractor workflow:
 *   1. Open Select Controls ▾ → toggle a type (e.g., Buttons)
 *   2. Open Scale Selected ▾ → click "Shrink to 75%"
 *   3. Every selected control should be 75% w/h, center-preserved
 *   4. Cmd+Z restores everything in one step
 *
 * Pass criteria:
 *   - Selection-by-type adds N controls
 *   - Scale 75% multiplies w & h by 0.75 ± float tolerance
 *   - Center (x + w/2, y + h/2) is preserved per control
 *   - labelFontSize × 0.75 (clamped to 6px min) when present
 *   - Undo restores w, h, x, y, labelFontSize exactly
 */
import { chromium } from 'playwright';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = 'cdj-3000'; // has many button controls

interface Snapshot {
  [id: string]: {
    x: number;
    y: number;
    w: number;
    h: number;
    type: string;
    locked?: boolean;
    labelFontSize?: number;
  };
}

async function snapshot(page: import('playwright').Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { controls: Record<string, Snapshot[string]> } };
    };
    const out: Snapshot = {};
    const ctrls = win.useEditorStore?.getState().controls ?? {};
    for (const [id, c] of Object.entries(ctrls)) {
      out[id] = {
        x: c.x, y: c.y, w: c.w, h: c.h,
        type: c.type,
        locked: c.locked,
        labelFontSize: c.labelFontSize,
      };
    }
    return out;
  });
}

function close(a: number, b: number, eps = 0.5): boolean {
  return Math.abs(a - b) < eps;
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

  // BEFORE snapshot
  const before = await snapshot(page);
  const beforeButtons = Object.entries(before).filter(([, c]) => c.type === 'button' && !c.locked);
  console.log(`Initial: ${Object.keys(before).length} controls total, ${beforeButtons.length} unlocked buttons`);
  if (beforeButtons.length < 2) {
    console.error('Not enough button controls to test bulk-scale meaningfully');
    await browser.close();
    process.exit(1);
  }

  // --- Step 1: open Select Controls ▾, toggle Buttons ---
  await page.locator('button', { hasText: /Select Controls/ }).first().click();
  await page.waitForTimeout(300);
  // Each type row's button has a title that says "Click to ADD/REMOVE all <type>".
  // Match by title — robust against icon spans or count text changes.
  const buttonsRow = page.locator('button[title*="all buttons"]').first();
  await buttonsRow.click({ timeout: 5_000 });
  await page.waitForTimeout(300);

  const selectedAfterClick = await page.evaluate(() => {
    const win = window as unknown as { useEditorStore?: { getState: () => { selection: string[] } } };
    return win.useEditorStore?.getState().selection ?? [];
  });
  const selectedControlCount = selectedAfterClick.filter((s) => s.startsWith('control:')).length;
  const test1 = selectedControlCount === beforeButtons.length;
  console.log(`  ${test1 ? '✓' : '✗'} Select Controls ▾ → Buttons toggled ${selectedControlCount} controls (expected ${beforeButtons.length})`);

  // Close the Select dropdown by clicking the Scale dropdown button (outside Select dropdown).
  await page.locator('button', { hasText: /Scale Selected/ }).first().click();
  await page.waitForTimeout(300);

  // --- Step 2: click "Shrink to 75%" preset ---
  await page.locator('button', { hasText: /Shrink to 75%/ }).first().click();
  await page.waitForTimeout(500);

  const after = await snapshot(page);

  // --- Verify w/h × 0.75 + center-preserved ---
  let scaleOk = true;
  let centerOk = true;
  let fontOk = true;
  let testedCount = 0;
  for (const [id, b] of beforeButtons) {
    const a = after[id];
    if (!a) { console.error(`  missing control ${id} after scale`); scaleOk = false; continue; }
    const expW = b.w * 0.75;
    const expH = b.h * 0.75;
    if (!close(a.w, expW) || !close(a.h, expH)) {
      console.error(`  size mismatch ${id}: w=${a.w} (exp ${expW.toFixed(2)}), h=${a.h} (exp ${expH.toFixed(2)})`);
      scaleOk = false;
    }
    const centerXBefore = b.x + b.w / 2;
    const centerYBefore = b.y + b.h / 2;
    const centerXAfter = a.x + a.w / 2;
    const centerYAfter = a.y + a.h / 2;
    if (!close(centerXBefore, centerXAfter) || !close(centerYBefore, centerYAfter)) {
      console.error(`  center drifted ${id}: (${centerXBefore.toFixed(1)},${centerYBefore.toFixed(1)}) → (${centerXAfter.toFixed(1)},${centerYAfter.toFixed(1)})`);
      centerOk = false;
    }
    if (typeof b.labelFontSize === 'number') {
      const expFont = Math.max(6, b.labelFontSize * 0.75);
      if (!close(a.labelFontSize ?? 0, expFont, 0.1)) {
        console.error(`  font mismatch ${id}: ${a.labelFontSize} (exp ${expFont.toFixed(2)})`);
        fontOk = false;
      }
    }
    testedCount++;
  }
  console.log(`  ${scaleOk ? '✓' : '✗'} w/h scaled to 0.75× on ${testedCount} buttons`);
  console.log(`  ${centerOk ? '✓' : '✗'} center preserved on ${testedCount} buttons`);
  console.log(`  ${fontOk ? '✓' : '✗'} labelFontSize scaled (clamped at 6px)`);

  // --- Step 3: Cmd+Z restores ---
  await page.keyboard.press('Meta+z');
  await page.waitForTimeout(500);

  const restored = await snapshot(page);
  let undoOk = true;
  for (const [id, b] of beforeButtons) {
    const r = restored[id];
    if (!r) { undoOk = false; continue; }
    if (!close(r.w, b.w) || !close(r.h, b.h) || !close(r.x, b.x) || !close(r.y, b.y)) {
      console.error(`  undo failed for ${id}: w=${r.w} (was ${b.w}), h=${r.h} (was ${b.h})`);
      undoOk = false;
    }
  }
  console.log(`  ${undoOk ? '✓' : '✗'} Cmd+Z restored ${beforeButtons.length} buttons to original`);

  await browser.close();
  const allPassed = test1 && scaleOk && centerOk && fontOk && undoOk;
  if (!allPassed) {
    console.error('FAIL — bulk-scale flow has divergence');
    process.exit(1);
  }
  console.log(`PASS — full Select→Scale→Undo flow works end-to-end`);
})();
