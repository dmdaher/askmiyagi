/**
 * Test: Can multi-group selection distribute 6 knobs + 6 zone buttons
 * to share the same 6 columns on fantom-06?
 *
 * Reality check: distributeControls treats all selected controls as a
 * flat list. If you select 12 controls spanning two rows, they get
 * distributed as 12 items — which ISN'T what you want for column alignment.
 */

import { chromium } from 'playwright';

const EDITOR_URL = 'http://localhost:3000/admin/fantom-06/editor';
const KNOBS = ['knob-1', 'knob-2', 'knob-3', 'knob-4', 'knob-5', 'knob-6', 'knob-7', 'knob-8'];
const BUTTONS = ['zone-int-ext-1', 'zone-int-ext-2', 'zone-int-ext-3', 'zone-int-ext-4', 'zone-int-ext-5', 'zone-int-ext-6', 'zone-int-ext-7', 'zone-int-ext-8'];

async function readControls(page: any, ids: string[]): Promise<Record<string, { x: number; y: number; w: number; h: number }>> {
  const resp = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline/fantom-06/manifest');
    return r.json();
  });
  const map: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const c of resp.controls || []) {
    if (ids.includes(c.id)) map[c.id] = { x: c.x, y: c.y, w: c.w, h: c.h };
  }
  return map;
}

async function clickControlById(page: any, id: string, modifiers: string[] = []) {
  const el = await page.$(`[data-control-id="${id}"]`);
  if (!el) throw new Error(`Control not found: ${id}`);
  await el.click({ force: true, modifiers } as any);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.control-node', { timeout: 60000 });
  console.log('Editor loaded');

  // Log initial positions
  const initial = await readControls(page, [...KNOBS, ...BUTTONS]);
  console.log('\n--- Initial positions ---');
  console.log('Knobs:');
  KNOBS.forEach((id) => console.log(`  ${id}: x=${initial[id]?.x?.toFixed(0)}, y=${initial[id]?.y?.toFixed(0)}, w=${initial[id]?.w}`));
  console.log('Zone Buttons:');
  BUTTONS.forEach((id) => console.log(`  ${id}: x=${initial[id]?.x?.toFixed(0)}, y=${initial[id]?.y?.toFixed(0)}, w=${initial[id]?.w}`));

  // Group the knobs
  console.log('\n--- Creating "Zone Knobs" group ---');
  await clickControlById(page, KNOBS[0]);
  await page.waitForTimeout(150);
  for (let i = 1; i < KNOBS.length; i++) {
    await clickControlById(page, KNOBS[i], ['Shift']);
    await page.waitForTimeout(100);
  }
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyG');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(400);

  // Group the buttons
  console.log('--- Creating "Zone Buttons" group ---');
  await clickControlById(page, BUTTONS[0]);
  await page.waitForTimeout(150);
  for (let i = 1; i < BUTTONS.length; i++) {
    await clickControlById(page, BUTTONS[i], ['Shift']);
    await page.waitForTimeout(100);
  }
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyG');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(400);

  // Select both groups (click knob-1, Shift+click button-1 — should select both groups)
  console.log('\n--- Selecting both groups via Shift+click ---');
  await clickControlById(page, KNOBS[0]);
  await page.waitForTimeout(300);
  await clickControlById(page, BUTTONS[0], ['Shift']);
  await page.waitForTimeout(400);

  // Count selected
  const selCount = await page.evaluate(() => {
    const nodes = document.querySelectorAll('.control-node');
    let count = 0;
    for (const n of nodes) {
      const style = n.getAttribute('style') || '';
      if (style.includes('59') && style.includes('130') && style.includes('246')) count++;
    }
    return count;
  });
  console.log(`Selected: ${selCount} (expected 16 = 8 knobs + 8 buttons)`);

  // Now try Distribute H (Cmd+Shift+H)
  console.log('\n--- Pressing Cmd+Shift+H (Distribute H) ---');
  await page.keyboard.down('Meta');
  await page.keyboard.down('Shift');
  await page.keyboard.press('KeyH');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(1500);

  const after = await readControls(page, [...KNOBS, ...BUTTONS]);
  console.log('\nAfter distribute H:');
  console.log('Knobs (y should stay ~87):');
  KNOBS.forEach((id) => console.log(`  ${id}: x=${after[id]?.x}, y=${after[id]?.y?.toFixed(0)}`));
  console.log('Zone Buttons (y should stay ~147):');
  BUTTONS.forEach((id) => console.log(`  ${id}: x=${after[id]?.x}, y=${after[id]?.y?.toFixed(0)}`));

  // Check if knob columns match button columns
  console.log('\n--- Column alignment check ---');
  let columnsMatch = true;
  for (let i = 0; i < 8; i++) {
    const kx = after[KNOBS[i]].x;
    const bx = after[BUTTONS[i]].x;
    const diff = Math.abs(kx - bx);
    const match = diff < 5;
    console.log(`  Column ${i + 1}: knob.x=${kx}, button.x=${bx}, diff=${diff.toFixed(0)}px ${match ? '✓' : '✗'}`);
    if (!match) columnsMatch = false;
  }

  console.log(`\n${columnsMatch ? '✅' : '❌'} Columns aligned: ${columnsMatch}`);

  // Check knob-to-knob gaps (should be uniform)
  const sortedKnobs = KNOBS.map((id) => after[id]).sort((a, b) => a.x - b.x);
  const knobGaps: number[] = [];
  for (let i = 1; i < sortedKnobs.length; i++) {
    knobGaps.push(sortedKnobs[i].x - (sortedKnobs[i - 1].x + sortedKnobs[i - 1].w));
  }
  console.log(`\nKnob edge-to-edge gaps: ${knobGaps.join(', ')}`);

  const sortedButtons = BUTTONS.map((id) => after[id]).sort((a, b) => a.x - b.x);
  const btnGaps: number[] = [];
  for (let i = 1; i < sortedButtons.length; i++) {
    btnGaps.push(sortedButtons[i].x - (sortedButtons[i - 1].x + sortedButtons[i - 1].w));
  }
  console.log(`Button edge-to-edge gaps: ${btnGaps.join(', ')}`);

  console.log('\n=== Verdict ===');
  console.log(`Selection worked: ${selCount === 12 ? 'YES' : 'NO'}`);
  console.log(`Columns matched: ${columnsMatch ? 'YES' : 'NO'}`);

  await browser.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
