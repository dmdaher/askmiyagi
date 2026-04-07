/**
 * Tests that labels move with their linked controls during:
 * 1. scaleCanvas (Canvas + button in toolbar)
 * 2. moveSection (dragging a section header)
 */
import { chromium } from 'playwright';

const EDITOR_URL = 'http://localhost:3000/admin/fantom-06/editor';

async function getState(): Promise<{ controls: any; labels: any[] }> {
  const resp = await fetch('http://localhost:3000/api/pipeline/fantom-06/manifest');
  const data: any = await resp.json();
  const controls: Record<string, any> = {};
  for (const c of data.controls || []) {
    controls[c.id] = { x: c.x, y: c.y, w: c.w, h: c.h };
  }
  return { controls, labels: data.editorLabels || [] };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.control-node', { timeout: 60000 });
  console.log('Editor loaded');

  // === TEST 1: scaleCanvas ===
  console.log('\n=== TEST 1: scaleCanvas (Canvas + button) ===');
  const before = await getState();
  const linked = before.labels.filter((l: any) => l.controlId);
  console.log(`Total labels: ${before.labels.length}, linked: ${linked.length}`);

  if (linked.length === 0) {
    console.log('No linked labels — cannot verify. Skipping scale test.');
  } else {
    // Pick first 3 linked labels and record their offset from control center
    const offsetsBefore: Array<{ id: string; cx: number; cy: number; lx: number; ly: number; deltaX: number; deltaY: number }> = [];
    for (const l of linked.slice(0, 3)) {
      const c = before.controls[l.controlId];
      if (!c) continue;
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      const lx = l.x + (l.w || 60) / 2;
      const ly = l.y + l.fontSize / 2;
      offsetsBefore.push({ id: l.id, cx, cy, lx, ly, deltaX: lx - cx, deltaY: ly - cy });
    }
    console.log('Sample linked labels BEFORE scale:');
    offsetsBefore.forEach((o) => console.log(`  ${o.id}: control ctr(${o.cx.toFixed(1)}, ${o.cy.toFixed(1)}) label ctr(${o.lx.toFixed(1)}, ${o.ly.toFixed(1)}) delta(${o.deltaX.toFixed(1)}, ${o.deltaY.toFixed(1)})`));

    // Click the Canvas "+" button
    const canvasPlus = await page.$('button[title="Scale canvas up 125%"]');
    if (!canvasPlus) {
      console.log('Canvas + button not found');
    } else {
      await canvasPlus.click();
      await page.waitForTimeout(1500); // wait for auto-save
      console.log('Clicked Canvas + (125%)');

      const after = await getState();
      console.log('Sample linked labels AFTER scale (expected: delta * 1.25):');
      let allMatch = true;
      for (const before_ of offsetsBefore) {
        const l = after.labels.find((x: any) => x.id === before_.id);
        const c = l ? after.controls[l.controlId] : null;
        if (!l || !c) continue;
        const cx = c.x + c.w / 2;
        const cy = c.y + c.h / 2;
        const lx = l.x + (l.w || 60) / 2;
        const ly = l.y + l.fontSize / 2;
        const deltaX = lx - cx;
        const deltaY = ly - cy;
        // Should be ~1.25x the previous delta (±2px tolerance for rounding)
        const expectedDX = before_.deltaX * 1.25;
        const expectedDY = before_.deltaY * 1.25;
        const dxMatch = Math.abs(deltaX - expectedDX) < 3;
        const dyMatch = Math.abs(deltaY - expectedDY) < 3;
        const ok = dxMatch && dyMatch;
        if (!ok) allMatch = false;
        console.log(`  ${before_.id}: delta(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)}) expected(${expectedDX.toFixed(1)}, ${expectedDY.toFixed(1)}) ${ok ? '✓' : '✗'}`);
      }
      console.log(`\n${allMatch ? '✅ PASS' : '❌ FAIL'}: labels scaled proportionally with controls`);

      // Restore original scale for next test
      const canvasMinus = await page.$('button[title="Scale canvas down 80%"]');
      if (canvasMinus) {
        await canvasMinus.click();
        await page.waitForTimeout(1500);
      }
    }
  }

  // === TEST 2: moveSection ===
  console.log('\n=== TEST 2: moveSection (drag section header) ===');
  // Find a section drag handle — the first one
  const dragHandle = await page.$('.section-drag-handle');
  if (!dragHandle) {
    console.log('No section drag handle found');
  } else {
    const box = await dragHandle.boundingBox();
    if (!box) {
      console.log('Drag handle has no bounding box');
    } else {
      // Get section ID by finding its parent section frame
      const sectionId = await dragHandle.evaluate((el) => {
        const frame = el.closest('[class*="hover:border-white"]');
        const text = el.querySelector('span:nth-child(2)')?.textContent || '';
        return text.trim();
      });
      console.log(`Dragging section: ${sectionId}`);

      const beforeMove = await getState();
      // Find a control in this section + its label
      const sampleCtrlEntries = Object.entries(beforeMove.controls).slice(0, 3);
      const sampleLabel = beforeMove.labels.find((l: any) => l.controlId);
      if (!sampleLabel) {
        console.log('No linked labels available');
      } else {
        const cBefore = beforeMove.controls[sampleLabel.controlId];
        console.log(`Tracking: control=${sampleLabel.controlId} at (${cBefore.x}, ${cBefore.y}), label=${sampleLabel.id} at (${sampleLabel.x}, ${sampleLabel.y})`);
        console.log(`Label offset: dx=${sampleLabel.x - cBefore.x}, dy=${sampleLabel.y - cBefore.y}`);

        // Drag the section by 40px right, 20px down
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 60, startY + 30, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(1500);

        const afterMove = await getState();
        const cAfter = afterMove.controls[sampleLabel.controlId];
        const lAfter = afterMove.labels.find((l: any) => l.id === sampleLabel.id);
        if (cAfter && lAfter) {
          const ctrlDx = cAfter.x - cBefore.x;
          const ctrlDy = cAfter.y - cBefore.y;
          const labelDx = lAfter.x - sampleLabel.x;
          const labelDy = lAfter.y - sampleLabel.y;
          console.log(`\nControl moved: dx=${ctrlDx}, dy=${ctrlDy}`);
          console.log(`Label moved:   dx=${labelDx}, dy=${labelDy}`);
          const match = Math.abs(ctrlDx - labelDx) < 2 && Math.abs(ctrlDy - labelDy) < 2;
          console.log(`${match ? '✅ PASS' : '❌ FAIL'}: label followed control (deltas match)`);
        } else {
          console.log('Control or label not found after move');
        }
      }
    }
  }

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
