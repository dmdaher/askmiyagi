/**
 * Regression test for the "controls below keyboard wrongly flagged as
 * overlapping" bug (2026-05-08).
 *
 * Bug: overlap detection only checked `cBottom > keyboardTop`, never
 * `cTop < keyboardBottom`. So a control entirely BELOW the keyboard's
 * bottom edge (e.g., y=900 when keyboard ends at y=699) was false-flagged
 * as overlapping.
 *
 * Fix: full Y-axis rectangle intersection — both edges must cross.
 *
 * Asserts:
 *   1. Controls deep below the keyboard (cTop > kbBottom) are NOT in list
 *   2. Controls actually inside the keyboard rect ARE in list
 *   3. Moving a deep-below control to be even further below clears it
 */
import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([{ name: 'admin_access', value: 'miyagi2026', domain: 'localhost', path: '/' }]);
  const page = await context.newPage();

  await page.goto('http://localhost:3000/admin/deepmind-12/editor', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  let exitCode = 0;
  const pass = (m: string) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
  const fail = (m: string) => { console.error(`\x1b[31m✗\x1b[0m ${m}`); exitCode = 1; };

  async function getOverlap(): Promise<string[]> {
    return await page.evaluate(`Array.from(document.querySelectorAll('[data-testid^="keyboard-overlap-find-"]')).map(e => e.getAttribute('data-testid').replace('keyboard-overlap-find-', ''))`) as string[];
  }
  async function snapshot() {
    return await page.evaluate(`(() => {
      const s = window.useEditorStore.getState();
      const kb = s.keyboard;
      const kbY = (kb.panelHeightPercent / 100) * s.canvasHeight;
      const kbBottom = s.canvasHeight;
      const list = Object.keys(s.controls).map(id => {
        const c = s.controls[id];
        return { id, cTop: c.y, cBottom: c.y + c.h, isBelowKb: c.y >= kbBottom };
      });
      return { kbTop: kbY, kbBottom, list };
    })()`) as { kbTop: number; kbBottom: number; list: { id: string; cTop: number; cBottom: number; isBelowKb: boolean }[] };
  }

  const snap = await snapshot();
  console.log(`\nKeyboard rect Y: ${snap.kbTop.toFixed(0)} → ${snap.kbBottom.toFixed(0)}`);

  // Find a control we KNOW is below keyboard (cTop > kbBottom)
  const belowKb = snap.list.find(c => c.isBelowKb);
  if (!belowKb) {
    console.log('No below-keyboard control to test against. Forcing one...');
    await page.evaluate(`(() => {
      const s = window.useEditorStore.getState();
      const id = Object.keys(s.controls)[0];
      window.useEditorStore.setState({
        controls: Object.assign({}, s.controls, {
          [id]: Object.assign({}, s.controls[id], { y: ${snap.kbBottom + 50} })
        })
      });
    })()`);
    await page.waitForTimeout(500);
  }

  const overlap = await getOverlap();
  const belowFlagged = (await snapshot()).list.filter(c => c.isBelowKb && overlap.includes(c.id));
  if (belowFlagged.length === 0) {
    pass(`no below-keyboard controls flagged as overlap (kbBottom=${snap.kbBottom})`);
  } else {
    fail(`${belowFlagged.length} below-keyboard control(s) wrongly flagged: ${belowFlagged.map(c => `${c.id}(cTop=${c.cTop.toFixed(0)})`).join(', ')}`);
  }

  // Force a control to be INSIDE the keyboard rect — should be flagged
  const insideId = 'volume-knob';
  await page.evaluate(`(() => {
    const s = window.useEditorStore.getState();
    const cur = s.controls;
    const kb = s.keyboard;
    const kbY = (kb.panelHeightPercent / 100) * s.canvasHeight;
    const kbX = ((kb.leftPercent || 0) / 100) * s.canvasWidth;
    const kbW = ((kb.widthPercent || 100) / 100) * s.canvasWidth;
    window.useEditorStore.setState({
      controls: Object.assign({}, cur, {
        ['${insideId}']: Object.assign({}, cur['${insideId}'], { x: kbX + kbW/2, y: kbY + 30 })
      })
    });
  })()`);
  await page.waitForTimeout(500);
  const overlap2 = await getOverlap();
  if (overlap2.includes(insideId)) pass(`control inside keyboard rect IS flagged (${insideId})`);
  else fail(`control inside keyboard NOT flagged — false negative`);

  // Move it DEEP below — should clear
  await page.evaluate(`(() => {
    const s = window.useEditorStore.getState();
    const cur = s.controls;
    const kbBottom = s.canvasHeight;
    window.useEditorStore.setState({
      controls: Object.assign({}, cur, {
        ['${insideId}']: Object.assign({}, cur['${insideId}'], { y: kbBottom + 100 })
      })
    });
  })()`);
  await page.waitForTimeout(500);
  const overlap3 = await getOverlap();
  if (!overlap3.includes(insideId)) pass(`moved control DEEP below keyboard → cleared from list`);
  else fail(`control still flagged after moving deep below`);

  await browser.close();
  if (exitCode === 0) console.log('\n\x1b[32mAll fix checks passed.\x1b[0m');
  else console.error('\n\x1b[31mFAILED.\x1b[0m');
  process.exit(exitCode);
}

run().catch(e => { console.error(e); process.exit(1); });
