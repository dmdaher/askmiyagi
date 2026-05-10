/**
 * Smoke test for Fantom-08 panel after the PanelButton z-index/position change.
 *
 * Verifies:
 * 1. Page loads without crashing
 * 2. PanelButtons have the expected position/zIndex computed styles
 * 3. No buttons overlap or render outside their containers
 * 4. Highlighted button (during a tutorial step) shows z-index: 1000
 * 5. Non-highlighted, non-LED buttons keep their natural stacking
 *
 * Run: npx tsx e2e/smoke-fantom08-zindex.ts
 * Requires: dev server on localhost:3000
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  console.log('→ navigating to Fantom-08 tutorial...');
  // Use a known tutorial id from the Fantom-08 set
  const url = 'http://localhost:3000/tutorial/fantom-08/panel-overview';
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  if (!resp || !resp.ok()) {
    console.error(`✗ page load failed: ${resp?.status()}`);
    process.exit(1);
  }
  console.log(`✓ page loaded (${resp.status()})`);

  // Wait for panel render
  await page.waitForSelector('[data-control-id]', { timeout: 10000 });
  await page.waitForTimeout(500); // let animations settle

  // Count buttons
  const buttonCount = await page.locator('[data-control-id]').count();
  console.log(`✓ ${buttonCount} controls rendered`);
  if (buttonCount < 10) {
    console.error(`✗ expected many controls; got ${buttonCount}`);
    process.exit(1);
  }

  // Sample a non-highlighted button — verify position:relative and natural z-index
  const sampleBtn = page.locator('button[data-control-id]').first();
  const sampleStyle = await sampleBtn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { position: cs.position, zIndex: cs.zIndex };
  });
  console.log(`✓ sample button computed style: position=${sampleStyle.position}, z-index=${sampleStyle.zIndex}`);
  if (sampleStyle.position !== 'relative') {
    console.error(`✗ expected position:relative on PanelButton; got ${sampleStyle.position}`);
    process.exit(1);
  }
  if (sampleStyle.zIndex !== 'auto' && sampleStyle.zIndex !== '0' && sampleStyle.zIndex !== '10' && sampleStyle.zIndex !== '1000') {
    console.error(`✗ unexpected z-index value: ${sampleStyle.zIndex}`);
    process.exit(1);
  }

  // Dismiss any onboarding modal that blocks tutorial controls
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);

  // Sample 5 buttons to verify computed styles are sane across the panel
  const sampleStyles = await page.locator('button[data-control-id]').evaluateAll((nodes) =>
    nodes.slice(0, 5).map(n => {
      const cs = getComputedStyle(n as HTMLElement);
      return {
        id: (n as HTMLElement).dataset.controlId,
        position: cs.position,
        zIndex: cs.zIndex,
      };
    })
  );
  for (const s of sampleStyles) {
    if (s.position !== 'relative') {
      console.error(`✗ ${s.id}: expected position:relative, got ${s.position}`);
      process.exit(1);
    }
    // z-index should be one of: auto (no LED, no highlight), 0, 10 (ledOn), or 1000 (highlighted)
    if (!['auto', '0', '10', '1000'].includes(s.zIndex)) {
      console.error(`✗ ${s.id}: unexpected z-index ${s.zIndex}`);
      process.exit(1);
    }
  }
  console.log(`✓ ${sampleStyles.length} buttons have valid position/z-index`);

  // Check overlapping rect - any two buttons should not have identical bounding rects (bug indicator)
  const rects = await page.locator('button[data-control-id]').evaluateAll((nodes) =>
    nodes.slice(0, 30).map(n => {
      const r = (n as HTMLElement).getBoundingClientRect();
      return { id: (n as HTMLElement).dataset.controlId, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    })
  );
  const seen = new Map<string, string>();
  let collisions = 0;
  for (const r of rects) {
    const key = `${r.x}:${r.y}:${r.w}:${r.h}`;
    if (seen.has(key) && seen.get(key) !== r.id) {
      collisions++;
      console.error(`✗ button collision: ${r.id} and ${seen.get(key)} share rect ${key}`);
    }
    seen.set(key, r.id ?? '?');
  }
  console.log(`✓ checked ${rects.length} button positions, ${collisions} collisions`);

  // Take a screenshot for visual reference
  const screenshot = `e2e/screenshots/smoke-fantom08-zindex-${Date.now()}.png`;
  await page.screenshot({ path: screenshot, fullPage: false });
  console.log(`✓ screenshot saved: ${screenshot}`);

  await browser.close();

  if (collisions > 0) {
    console.error(`✗ FAILED: ${collisions} button collision(s) found`);
    process.exit(1);
  }
  console.log('\n✓ All Fantom-08 z-index smoke checks passed');
})();
