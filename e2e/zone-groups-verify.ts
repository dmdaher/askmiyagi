/**
 * Cross-group distribution test — reads absolute positions from Zustand store
 * (not DOM transforms which are relative to section containers).
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.argv[2] || 'cdj-3000';
const EDITOR_URL = `${BASE_URL}/admin/${DEVICE_ID}/editor`;
const SCREENSHOT_DIR = path.resolve(__dirname, '../e2e-screenshots/zone-groups');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.control-node', { timeout: 60000 });
  console.log('Editor loaded');

  const controlNodes = await page.$$('.control-node');
  console.log(`Found ${controlNodes.length} controls`);

  // Select 4, group, select 4 more, group
  await controlNodes[0].click({ force: true });
  await page.waitForTimeout(150);
  for (let i = 1; i < 4; i++) {
    await controlNodes[i].click({ force: true, modifiers: ['Shift'] });
    await page.waitForTimeout(100);
  }
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyG');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(300);

  await controlNodes[4].click({ force: true });
  await page.waitForTimeout(150);
  for (let i = 5; i < 8; i++) {
    await controlNodes[i].click({ force: true, modifiers: ['Shift'] });
    await page.waitForTimeout(100);
  }
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyG');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(300);

  console.log('Two groups created (4 controls each)');

  // Cross-group selection
  await controlNodes[0].click({ force: true });
  await page.waitForTimeout(300);
  await controlNodes[4].click({ force: true, modifiers: ['Shift'] });
  await page.waitForTimeout(400);

  // Read store state via selected ids + data-control-ids + inline style reads
  // The controls have [data-control-id] — find their stored x/w by extracting from Rnd inline styles
  const readStoreState = async () => {
    return page.evaluate(() => {
      // Get selected IDs
      const nodes = document.querySelectorAll('.control-node');
      const selectedIds: string[] = [];
      for (const n of nodes) {
        const style = n.getAttribute('style') || '';
        if (style.includes('59') && style.includes('130') && style.includes('246')) {
          const id = n.querySelector('[data-control-id]')?.getAttribute('data-control-id');
          if (id) selectedIds.push(id);
        }
      }
      return { selectedIds };
    });
  };

  // Actually, the most reliable way: read manifest-editor.json state via API
  const { selectedIds } = await readStoreState();
  console.log(`${selectedIds.length} controls selected:`, selectedIds);

  // Fetch the current manifest to read positions
  const getAbsolutePositions = async (ids: string[]) => {
    const resp = await page.evaluate(async (deviceId: string) => {
      const r = await fetch(`/api/pipeline/${deviceId}/manifest`);
      const j = await r.json();
      return j;
    }, DEVICE_ID);
    const controls = (resp.controls || []) as Array<{ id: string; x: number; y: number; w: number; h: number }>;
    const map: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const c of controls) {
      if (ids.includes(c.id)) {
        map[c.id] = { x: c.x, y: c.y, w: c.w, h: c.h };
      }
    }
    return map;
  };

  // Set Gap H = 20
  const gapHInput = await page.$('input[type="number"][title*="Horizontal"]');
  if (!gapHInput) { console.error('Gap H input not found'); process.exit(1); }

  console.log('\n--- Testing Gap H = 20 ---');
  await gapHInput.click();
  await gapHInput.fill('20');
  await gapHInput.press('Tab');
  await page.waitForTimeout(1000); // Wait for auto-save to persist

  const positions = await getAbsolutePositions(selectedIds);
  const sorted = selectedIds
    .map((id) => ({ id, ...positions[id] }))
    .filter((p) => p.x !== undefined)
    .sort((a, b) => a.x - b.x);

  console.log('Absolute positions (from store):');
  sorted.forEach((p) => console.log(`  ${p.id}: x=${p.x}, w=${p.w}, right=${p.x + p.w}`));

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i].x - (sorted[i - 1].x + sorted[i - 1].w));
  }
  console.log(`Edge-to-edge gaps: ${gaps.join(', ')}`);

  const expected = 20;
  const allCorrect = gaps.every((g) => Math.abs(g - expected) < 2);
  console.log(`All gaps ≈ ${expected}px: ${allCorrect ? '✅ PASS' : '❌ FAIL'}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'store-verified-20.png') });

  // Test Gap H = 50
  console.log('\n--- Testing Gap H = 50 ---');
  await gapHInput.click();
  await gapHInput.fill('50');
  await gapHInput.press('Tab');
  await page.waitForTimeout(1000);

  const positions50 = await getAbsolutePositions(selectedIds);
  const sorted50 = selectedIds
    .map((id) => ({ id, ...positions50[id] }))
    .filter((p) => p.x !== undefined)
    .sort((a, b) => a.x - b.x);

  const gaps50: number[] = [];
  for (let i = 1; i < sorted50.length; i++) {
    gaps50.push(sorted50[i].x - (sorted50[i - 1].x + sorted50[i - 1].w));
  }
  console.log(`Gaps at 50px: ${gaps50.join(', ')}`);
  const allCorrect50 = gaps50.every((g) => Math.abs(g - 50) < 2);
  console.log(`All gaps ≈ 50px: ${allCorrect50 ? '✅ PASS' : '❌ FAIL'}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'store-verified-50.png') });

  console.log('\n=== Summary ===');
  console.log(`Multi-group selection: ${selectedIds.length === 8 ? '✅' : '❌'}`);
  console.log(`Gap H = 20: ${allCorrect ? '✅' : '❌'}`);
  console.log(`Gap H = 50: ${allCorrect50 ? '✅' : '❌'}`);

  await browser.close();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
