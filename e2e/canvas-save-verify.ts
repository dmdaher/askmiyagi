/**
 * Verify whether Canvas +/- button clicks trigger auto-save.
 * Strategy: click the BIG toolbar button (not a tiny control) and check file mtime.
 */
import { chromium } from 'playwright';
import { statSync } from 'fs';

const EDITOR_URL = 'http://localhost:3000/admin/fantom-06/editor';
const MANIFEST_PATH = '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.pipeline/fantom-06/manifest-editor.json';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.control-node', { timeout: 60000 });
  console.log('Editor loaded');

  // Capture mtime BEFORE click
  const beforeMtime = statSync(MANIFEST_PATH).mtime.getTime();
  console.log(`manifest-editor.json mtime BEFORE: ${new Date(beforeMtime).toISOString()}`);

  // Wait a moment for initial load to settle (isFirstChange flag)
  await page.waitForTimeout(1500);

  // Click the Canvas + button — title attribute lookup
  const canvasPlus = await page.$('button[title="Scale canvas up 125%"]');
  if (!canvasPlus) {
    console.log('Canvas + button NOT FOUND');
    await browser.close();
    process.exit(1);
  }

  const box = await canvasPlus.boundingBox();
  console.log(`Canvas + button found at: ${JSON.stringify(box)}`);

  await canvasPlus.click();
  console.log('Clicked Canvas +');

  // Wait for 800ms debounce + processing
  await page.waitForTimeout(2000);

  // Check mtime AFTER click
  const afterMtime = statSync(MANIFEST_PATH).mtime.getTime();
  console.log(`manifest-editor.json mtime AFTER: ${new Date(afterMtime).toISOString()}`);

  const didSave = afterMtime > beforeMtime;
  console.log(`\n${didSave ? '✅ PASS' : '❌ FAIL'}: Canvas + ${didSave ? 'DID' : 'did NOT'} trigger auto-save`);

  // Also check for canvas size change
  const canvasWidthBefore = await page.evaluate(async () => {
    const r = await fetch('/api/pipeline/fantom-06/manifest');
    const d: any = await r.json();
    return d.canvasWidth;
  });
  console.log(`canvasWidth from API: ${canvasWidthBefore}`);

  // Undo to restore state
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(1500);

  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
