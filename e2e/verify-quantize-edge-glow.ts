/**
 * Targeted: QUANTIZE on cdj-3000 (rectangle button, edge-glow style).
 * Trace exactly what's happening in preview when Test LEDs is on.
 */
import { chromium } from 'playwright';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

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

  await page.goto(`${BASE}/admin/cdj-3000/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000, state: 'attached' });
  await page.waitForTimeout(1500);

  // Check QUANTIZE manifest state
  const ctrlState = await page.evaluate(() => {
    const win = window as unknown as { useEditorStore?: { getState: () => { controls: Record<string, any> } } };
    const c = win.useEditorStore?.getState().controls['QUANTIZE'];
    return c ? {
      type: c.type, shape: c.shape, hasLed: c.hasLed,
      ledStyle: c.ledStyle, ledColor: c.ledColor, ledVariant: c.ledVariant,
    } : null;
  });
  console.log(`Editor store QUANTIZE: ${JSON.stringify(ctrlState)}`);

  // Enter preview
  await page.locator('button', { hasText: /^Preview$/ }).first().click();
  await page.waitForTimeout(800);

  // Inspect QUANTIZE in preview BEFORE Test LEDs
  const beforeQ = await page.evaluate(() => {
    const el = document.querySelector('[data-control-id="QUANTIZE"]');
    if (!el) return null;
    // PanelButton renders the actual styled button as an inner motion.button
    const inner = el.querySelector('button') || el;
    const cs = window.getComputedStyle(inner);
    return {
      bg: cs.backgroundColor, border: cs.border, boxShadow: cs.boxShadow,
      width: cs.width, height: cs.height,
      tag: inner.tagName,
    };
  });
  console.log(`Preview pre-toggle QUANTIZE: ${JSON.stringify(beforeQ)}`);

  // Toggle Test LEDs
  await page.locator('button', { hasText: /Test LEDs/ }).first().click();
  await page.waitForTimeout(800);

  // Inspect QUANTIZE in preview AFTER Test LEDs
  const afterQ = await page.evaluate(() => {
    const wrapper = document.querySelector('[data-control-id="QUANTIZE"]');
    if (!wrapper) return null;
    const btn = wrapper.querySelector('button');
    if (!btn) return null;
    const cs = window.getComputedStyle(btn);
    return {
      bg: cs.backgroundColor,
      border: cs.border,
      boxShadow: cs.boxShadow,
      inlineStyleAttr: btn.getAttribute('style'),
      outerHTML: btn.outerHTML.slice(0, 800),
    };
  });
  console.log(`Preview post-toggle QUANTIZE:`);
  console.log(JSON.stringify(afterQ, null, 2));

  // Screenshot the QUANTIZE area
  const qLoc = page.locator('[data-control-id="QUANTIZE"]');
  await qLoc.scrollIntoViewIfNeeded({ timeout: 3_000 });
  const box = await qLoc.boundingBox();
  if (box) {
    const clip = { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 40), width: box.width + 80, height: box.height + 80 };
    await page.screenshot({ path: '/tmp/quantize-edge-on.png', clip });
    console.log('Screenshot saved: /tmp/quantize-edge-on.png');
  }

  await browser.close();
})();
