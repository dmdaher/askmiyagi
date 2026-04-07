/**
 * Test: Align Columns with zone buttons (w=107) + zone sliders (w=60-63)
 * User reports sliders shift right, not matching buttons visually
 */
import { chromium } from 'playwright';

const EDITOR_URL = 'http://localhost:3000/admin/fantom-06/editor';
const BUTTONS = ['zone-int-ext-1','zone-int-ext-2','zone-int-ext-3','zone-int-ext-4','zone-int-ext-5','zone-int-ext-6','zone-int-ext-7','zone-int-ext-8'];
const SLIDERS = ['slider-1','slider-2','slider-3','slider-4','slider-5','slider-6','slider-7','slider-8'];

async function readPositions() {
  const resp = await fetch('http://localhost:3000/api/pipeline/fantom-06/manifest');
  const data: any = await resp.json();
  const controls: Record<string, any> = {};
  for (const c of data.controls || []) {
    if (BUTTONS.includes(c.id) || SLIDERS.includes(c.id)) {
      controls[c.id] = { x: c.x, y: c.y, w: c.w, h: c.h };
    }
  }
  return controls;
}

async function run() {
  // 1. BEFORE positions
  const before = await readPositions();
  console.log('=== BEFORE ===');
  console.log('Button centers vs Slider centers:');
  console.log(`Col | btn x | btn w | btn ctr | slider x | slider w | slider ctr | diff`);
  for (let i = 0; i < 8; i++) {
    const b = before[BUTTONS[i]];
    const s = before[SLIDERS[i]];
    const bc = b.x + b.w / 2;
    const sc = s.x + s.w / 2;
    console.log(`${i+1}   | ${b.x.toFixed(0).padStart(5)} | ${String(b.w).padStart(5)} | ${bc.toFixed(1).padStart(7)} | ${s.x.toFixed(0).padStart(8)} | ${String(s.w).padStart(8)} | ${sc.toFixed(1).padStart(10)} | ${(bc-sc).toFixed(1)}`);
  }

  // 2. Open editor and run Align Columns
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.control-node', { timeout: 60000 });

  // Select all 16 by clicking their .control-node wrappers
  const ids = [...BUTTONS, ...SLIDERS];
  await page.evaluate((allIds) => {
    // Use window.dispatchEvent via custom React-compatible click
    // Actually, set selectedIds directly via store if exposed — try finding it
    const nodes = document.querySelectorAll('.control-node');
    const matched: HTMLElement[] = [];
    for (const n of nodes) {
      const id = n.querySelector('[data-control-id]')?.getAttribute('data-control-id');
      if (id && allIds.includes(id)) matched.push(n as HTMLElement);
    }
    return matched.length;
  }, ids).then((count) => console.log(`\nMatched ${count} control-node elements`));

  // Click each via Playwright's clicks with explicit bbox
  const boxes = await page.evaluate((allIds) => {
    const out: Record<string, { x: number; y: number }> = {};
    const nodes = document.querySelectorAll('.control-node');
    for (const n of nodes) {
      const id = n.querySelector('[data-control-id]')?.getAttribute('data-control-id');
      if (!id || !allIds.includes(id)) continue;
      const r = (n as HTMLElement).getBoundingClientRect();
      out[id] = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return out;
  }, ids);

  for (let i = 0; i < ids.length; i++) {
    const b = boxes[ids[i]];
    if (!b) continue;
    if (i > 0) await page.keyboard.down('Shift');
    await page.mouse.click(b.x, b.y);
    if (i > 0) await page.keyboard.up('Shift');
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);

  // Count selected
  const selCount = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.control-node');
    let c = 0;
    for (const n of nodes) {
      const s = n.getAttribute('style') || '';
      if (s.includes('rgba(59,130,246')) c++;
    }
    return c;
  });
  console.log(`Selected: ${selCount} (expected 16)`);

  // Find and click Align Columns button
  const btn = await page.$('button[title*="Snap"][title*="rows"]');
  if (!btn) {
    console.log('Align Columns button not found — listing visible buttons:');
    const visible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map((b) => b.textContent?.trim())
        .filter((t) => t && t.length < 50);
    });
    console.log(visible);
    await browser.close();
    return;
  }

  const btnText = await btn.textContent();
  console.log(`Clicking: "${btnText?.trim()}"`);
  await btn.click();
  await page.waitForTimeout(1000);

  // 3. AFTER positions
  const after = await readPositions();
  console.log('\n=== AFTER Align Columns ===');
  console.log(`Col | btn x | btn ctr | slider x | slider ctr | diff | slider delta`);
  for (let i = 0; i < 8; i++) {
    const b = after[BUTTONS[i]];
    const s = after[SLIDERS[i]];
    const bc = b.x + b.w / 2;
    const sc = s.x + s.w / 2;
    const prevS = before[SLIDERS[i]];
    const dx = s.x - prevS.x;
    console.log(`${i+1}   | ${b.x.toFixed(0).padStart(5)} | ${bc.toFixed(1).padStart(7)} | ${s.x.toFixed(0).padStart(8)} | ${sc.toFixed(1).padStart(10)} | ${(bc-sc).toFixed(1)} | ${dx > 0 ? '+' : ''}${dx.toFixed(0)}px`);
  }

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
