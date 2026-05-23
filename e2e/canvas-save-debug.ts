/**
 * Debug: trace WHY Canvas +/- might or might not trigger auto-save.
 */
import { chromium } from 'playwright';
import { statSync } from 'fs';

const EDITOR_URL = 'http://localhost:3000/admin/fantom-06/editor';
const MANIFEST_PATH = '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.pipeline/fantom-06/manifest-editor.json';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Capture console logs and network requests
  page.on('console', (msg) => console.log('BROWSER:', msg.text()));
  const puts: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'PUT' && req.url().includes('/manifest')) {
      puts.push(new Date().toISOString());
      console.log('PUT request fired to', req.url());
    }
  });

  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.control-node', { timeout: 60000 });
  console.log('Editor loaded');

  // Read initial canvasWidth from editor's live state via API
  const before = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline/fantom-06/manifest');
    const d: any = await r.json();
    return { canvasWidth: d.canvasWidth, canvasHeight: d.canvasHeight };
  });
  console.log(`BEFORE: canvasWidth=${before.canvasWidth}, canvasHeight=${before.canvasHeight}`);

  const beforeMtime = statSync(MANIFEST_PATH).mtime.getTime();
  console.log(`File mtime BEFORE: ${new Date(beforeMtime).toISOString()}`);

  // Wait for initial auto-save first-change to fire & complete
  await page.waitForTimeout(2500);

  // Click Canvas + — record timestamp
  const canvasPlus = await page.$('button[title="Scale canvas up 125%"]');
  if (!canvasPlus) throw new Error('button not found');
  console.log('\n>>> Clicking Canvas +');
  const clickTime = Date.now();
  await canvasPlus.click();

  // Wait for debounce (800ms) + processing
  await page.waitForTimeout(2000);

  const afterMtime = statSync(MANIFEST_PATH).mtime.getTime();
  console.log(`\nFile mtime AFTER: ${new Date(afterMtime).toISOString()}`);
  console.log(`PUT requests after click: ${puts.filter(t => new Date(t).getTime() > clickTime).length}`);

  const after = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline/fantom-06/manifest');
    const d: any = await r.json();
    return { canvasWidth: d.canvasWidth, canvasHeight: d.canvasHeight };
  });
  console.log(`AFTER: canvasWidth=${after.canvasWidth}, canvasHeight=${after.canvasHeight}`);
  console.log(`Expected canvasWidth: ${Math.round(before.canvasWidth * 1.25)} (was ${before.canvasWidth} * 1.25)`);

  // Did the in-memory state update?
  const inMemory = await page.evaluate(() => {
    // Find the Zustand store exposed on window or via React devtools
    // Fall back to reading canvas size from DOM
    const canvas = document.querySelector('[style*="transformOrigin"]') as HTMLElement;
    if (!canvas) return null;
    return { width: canvas.style.width, height: canvas.style.height };
  });
  console.log(`DOM canvas size: ${JSON.stringify(inMemory)}`);

  await browser.close();

  console.log('\n=== VERDICT ===');
  if (afterMtime > beforeMtime) {
    console.log('✅ File mtime updated — auto-save IS working');
  } else if (after.canvasWidth !== before.canvasWidth) {
    console.log('⚠️  State changed but file did NOT update — auto-save NOT firing');
  } else {
    console.log('❌ State did NOT change — scaleCanvas not running OR click did not register');
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
