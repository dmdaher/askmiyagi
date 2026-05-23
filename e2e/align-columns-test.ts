/**
 * Test: Align Columns on fantom-06 — 8 knobs + 8 zone buttons
 * Verifies that after clicking "Align Columns", button center-X matches knob center-X
 */

import { chromium } from 'playwright';

const EDITOR_URL = 'http://localhost:3000/admin/fantom-06/editor';
const KNOBS = ['knob-1', 'knob-2', 'knob-3', 'knob-4', 'knob-5', 'knob-6', 'knob-7', 'knob-8'];
const BUTTONS = ['zone-int-ext-1', 'zone-int-ext-2', 'zone-int-ext-3', 'zone-int-ext-4', 'zone-int-ext-5', 'zone-int-ext-6', 'zone-int-ext-7', 'zone-int-ext-8'];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.control-node', { timeout: 60000 });
  console.log('Editor loaded');

  // Build a map of control-id → bounding box, then click via page.mouse
  const idToBox = await page.evaluate((ids) => {
    const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const id of ids) {
      const el = document.querySelector(`[data-control-id="${id}"]`);
      if (!el) continue;
      const node = el.closest('.control-node') as HTMLElement | null;
      if (!node) continue;
      const r = node.getBoundingClientRect();
      out[id] = { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return out;
  }, [...KNOBS, ...BUTTONS]);

  console.log(`Located ${Object.keys(idToBox).length} controls by ID`);
  console.log(`  knob-1: ${JSON.stringify(idToBox['knob-1'])}`);

  // Debug single-click via element handle
  const knob1Handle = await page.evaluateHandle(() => {
    const el = document.querySelector('[data-control-id="knob-1"]')?.closest('.control-node');
    return el as HTMLElement | null;
  });
  const knob1El = knob1Handle.asElement();
  if (!knob1El) throw new Error('knob-1 element not found');
  console.log('Clicking knob-1 via ElementHandle.click()');
  await (knob1El as any).click({ force: true });
  await page.waitForTimeout(500);

  const debugInfo = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.control-node');
    const selected: string[] = [];
    for (const n of nodes) {
      const s = n.getAttribute('style') || '';
      if (s.includes('rgba(59,130,246')) {
        const id = n.querySelector('[data-control-id]')?.getAttribute('data-control-id');
        if (id) selected.push(id);
      }
    }
    // Also check elementFromPoint at knob-1's location
    const k1 = document.querySelector('[data-control-id="knob-1"]')?.closest('.control-node') as HTMLElement;
    let hit = 'none';
    if (k1) {
      const r = k1.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      hit = el ? `${el.tagName}.${(el.className || '').toString().slice(0, 40)}` : 'null';
    }
    return { selected, hit };
  });
  console.log(`After single click: selected=${JSON.stringify(debugInfo.selected)}, elementAtPoint=${debugInfo.hit}`);

  // Click each using page.mouse with keyboard modifiers
  const allIds = [...KNOBS, ...BUTTONS];
  for (let i = 0; i < allIds.length; i++) {
    const id = allIds[i];
    const box = idToBox[id];
    if (!box) { console.warn(`no box for ${id}`); continue; }
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    if (i > 0) await page.keyboard.down('Shift');
    await page.mouse.click(cx, cy);
    if (i > 0) await page.keyboard.up('Shift');
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);

  // Debug: count selected with precise pattern
  const storeSel = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.control-node');
    let selected = 0;
    for (const n of nodes) {
      const style = n.getAttribute('style') || '';
      // Match the blue outline color specifically (3b82f6 or rgba 59,130,246)
      if (style.includes('rgba(59,130,246') || style.includes('rgb(59,130,246')) selected++;
    }
    return selected;
  });
  console.log(`Controls with blue outline: ${storeSel}`);

  const count = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.control-node');
    let c = 0;
    for (const n of nodes) {
      const s = n.getAttribute('style') || '';
      if (s.includes('rgba(59,130,246') || s.includes('rgb(59,130,246')) c++;
    }
    return c;
  });
  console.log(`Selected: ${count} (expected 16)`);

  // Check if Align Columns button is visible
  const alignColumnsBtn = await page.$('button[title*="Snap"]');
  if (!alignColumnsBtn) {
    console.log('❌ Align Columns button not found');
    const btnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent?.includes('Align Columns'))?.textContent || null;
    });
    console.log('Button text from DOM:', btnText);
    process.exit(1);
  }

  const btnText = await alignColumnsBtn.textContent();
  console.log(`Button found: "${btnText?.trim()}"`);

  // Click it
  await alignColumnsBtn.click();
  await page.waitForTimeout(1000);
  console.log('Align Columns clicked');

  // Fetch updated manifest
  const manifest = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline/fantom-06/manifest');
    return r.json();
  });

  const controls: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const c of manifest.controls || []) {
    if (KNOBS.includes(c.id) || BUTTONS.includes(c.id)) {
      controls[c.id] = { x: c.x, y: c.y, w: c.w, h: c.h };
    }
  }

  // Verify columns match by center X
  console.log('\n--- Column alignment check (center-X) ---');
  let allMatch = true;
  for (let i = 0; i < 8; i++) {
    const k = controls[KNOBS[i]];
    const b = controls[BUTTONS[i]];
    const kCenter = k.x + k.w / 2;
    const bCenter = b.x + b.w / 2;
    const diff = Math.abs(kCenter - bCenter);
    const match = diff < 2; // 2px tolerance for rounding
    console.log(`  Col ${i + 1}: knob center=${kCenter.toFixed(1)}, button center=${bCenter.toFixed(1)}, diff=${diff.toFixed(1)}px ${match ? '✓' : '✗'}`);
    if (!match) allMatch = false;
  }

  console.log(`\n${allMatch ? '✅ PASS' : '❌ FAIL'}: Columns aligned by center-X`);

  await page.screenshot({ path: 'e2e-screenshots/align-columns.png' });
  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
