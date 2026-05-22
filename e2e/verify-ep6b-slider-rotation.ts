/**
 * EP6-B verification — confirm slider re-lays out natively horizontal
 * when rotation === 90.
 *
 * Loads deepmind-12 editor with ?nosave=true so no contractor data is
 * touched. Selects arp-rate slider, screenshots at rotation=0, clicks
 * the 90° quick rotate button, screenshots at rotation=90.
 *
 * Output: /tmp/ep6b-slider-{before,after}.png
 */
import { chromium } from 'playwright';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = 'http://localhost:3000';
const DEVICE = 'deepmind-12';
const CONTROL = 'arp-gate-time'; // type: slider, rotation: 0 (untouched in current testing)

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1800, height: 1200 },
    deviceScaleFactor: 2,
  });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);

  // Load editor with autosave disabled (safe — no manifest writes)
  await page.goto(`${BASE}/admin/${DEVICE}/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  // Wait for ANY control to render — then we know the editor has mounted
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1000);

  // Locate and scroll the slider into view
  const sliderLocator = page.locator(`[data-control-id="${CONTROL}"]`);
  await sliderLocator.waitFor({ state: 'attached', timeout: 30_000 });
  await sliderLocator.scrollIntoViewIfNeeded({ timeout: 5_000 });
  await page.waitForTimeout(300);

  const box = await sliderLocator.boundingBox();
  if (!box) throw new Error('No bbox for arp-rate');
  console.log(`arp-rate bbox @ rotation=0: x=${box.x.toFixed(1)}, y=${box.y.toFixed(1)}, w=${box.width.toFixed(1)}, h=${box.height.toFixed(1)}`);

  // Click to select (in the middle of the slider)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);

  // Screenshot tightly around the slider — pad 40px each side
  const clipBefore = {
    x: Math.max(0, box.x - 40),
    y: Math.max(0, box.y - 40),
    width: box.width + 80,
    height: box.height + 80,
  };
  await page.screenshot({ path: '/tmp/ep6b-slider-before.png', clip: clipBefore });
  console.log('Screenshot before (rotation=0) saved');

  // Count and list ALL buttons containing "90°" so we can see which to click
  const allRotateButtons = await page.locator('button:has-text("90°")').all();
  console.log(`Found ${allRotateButtons.length} button(s) with "90°" text`);
  for (let i = 0; i < allRotateButtons.length; i++) {
    const b = await allRotateButtons[i].boundingBox();
    const txt = await allRotateButtons[i].textContent();
    console.log(`  [${i}] text="${txt?.trim()}" bbox=${b ? `(${b.x.toFixed(0)},${b.y.toFixed(0)},${b.width.toFixed(0)}×${b.height.toFixed(0)})` : 'null'}`);
  }

  // Click the LAST one (the rotation row is in Properties Panel, rendered later)
  const rotateButton = allRotateButtons[allRotateButtons.length - 1];
  await rotateButton.click({ timeout: 5000 });
  await page.waitForTimeout(800);

  // Verify rotation actually changed via the store
  const postState = await page.evaluate((controlId) => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { controls: Record<string, { rotation?: number; w?: number; h?: number; type?: string }> } };
    };
    const c = win.useEditorStore?.getState().controls[controlId];
    return c ? { rotation: c.rotation, w: c.w, h: c.h, type: c.type } : null;
  }, CONTROL);
  console.log(`arp-rate after click: ${JSON.stringify(postState)}`);

  // Dump DOM structure of the slider to see what actually rendered
  const sliderDom = await page.evaluate((controlId) => {
    const el = document.querySelector(`[data-control-id="${controlId}"]`);
    if (!el) return null;
    return {
      outerHTML: el.outerHTML.slice(0, 600),
      childCount: el.children.length,
      firstChildClass: el.children[0]?.className ?? '(none)',
    };
  }, CONTROL);
  console.log('--- Slider DOM after rotation ---');
  console.log(JSON.stringify(sliderDom, null, 2));

  // Re-measure the slider's bbox post-rotation
  const boxAfter = await sliderLocator.boundingBox();
  if (!boxAfter) throw new Error('No bbox for arp-rate after rotation');
  console.log(`arp-rate bbox @ rotation=90: x=${boxAfter.x.toFixed(1)}, y=${boxAfter.y.toFixed(1)}, w=${boxAfter.width.toFixed(1)}, h=${boxAfter.height.toFixed(1)}`);

  // Same clip area to compare apples-to-apples
  await page.screenshot({ path: '/tmp/ep6b-slider-after.png', clip: clipBefore });
  console.log('Screenshot after (rotation=90) saved');

  await browser.close();

  // Sanity check: if EP6-B worked, the slider's bbox should be wider+shorter
  // than at rotation=0. But because the slider's bbox is the OUTER WRAPPER
  // (data-control-id) which is its containing react-rnd cell, the bbox of
  // the wrapper STAYS the same (16-wide × 217-tall for arp-rate). What
  // changes is the VISUAL — internal rendering — and that we'll see in the
  // screenshots.
  if (Math.abs(boxAfter.width - box.width) < 1 && Math.abs(boxAfter.height - box.height) < 1) {
    console.log('Outer wrapper bbox unchanged (expected — react-rnd cell stays vertical until contractor resizes)');
  } else {
    console.log(`⚠ Wrapper bbox shifted: ${box.width}×${box.height} → ${boxAfter.width}×${boxAfter.height}`);
  }
  console.log('Visual difference (vertical fader → horizontal fader inside the same bbox) should be visible in the screenshots.');
})();
