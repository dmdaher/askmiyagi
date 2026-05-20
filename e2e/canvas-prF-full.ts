/**
 * Comprehensive end-to-end test for the tutorial-review canvas (PR-F).
 *
 * Coverage:
 *   1. Page loads, canvas renders, no console/page errors
 *   2. Manifest renders (controls present in DOM)
 *   3. Panel scrolls vertically (cdj-3000 panel taller than 900px viewport)
 *   4. ProgressBar dots: count matches step count, clickable, jumps step
 *   5. J / K keyboard navigation
 *   6. [ / ] tutorial cycling
 *   7. Step content updates (title + instruction) on nav
 *   8. StepContent details toggle works (chevron expand/collapse)
 *   9. NavigationControls Prev/Next buttons work + disabled at boundaries
 *  10. Fit-to-viewport toggle: shrinks panel when on, native when off
 *  11. Manifest stale banner: respects API response (hidden when no warning)
 *  12. Reviewer notes section: hidden when empty, present when populated
 *  13. Tutorial switch resets step index to 1 (premortem #2 verification)
 *  14. Highlighted controls present in DOM at expected steps
 *  15. Esc returns to /admin/<deviceId>
 *  16. Multiple viewports: 1400×900 and 1366×768 (admin laptop)
 *  17. Full-page screenshots saved for visual review
 *
 * Run:
 *   npx tsx e2e/canvas-prF-full.ts
 */
import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

function readPwd(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  try {
    const env = fs.readFileSync(
      '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.env.local',
      'utf-8',
    );
    const m = env.match(/^ADMIN_PASSWORD=(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : 'miyagi2026';
  } catch { return 'miyagi2026'; }
}

const ADMIN_PASSWORD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.env.TEST_DEVICE || 'cdj-3000';
const SCREENSHOT_DIR = '/tmp/canvas-prF';

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0;
let fail = 0;
const failures: string[] = [];
function check(label: string, ok: boolean, info: string = '') {
  if (ok) {
    console.log(`  ✓ ${label}${info ? ` — ${info}` : ''}`);
    pass++;
  } else {
    console.log(`  ✗ ${label} — ${info}`);
    failures.push(`${label} — ${info}`);
    fail++;
  }
}

async function snap(page: Page, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: false });
}

async function navigateToCanvas(page: Page, errors: { console: string[]; pageErrors: string[]; failedRequests: string[] }) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.console.push(msg.text());
  });
  page.on('pageerror', (err) => errors.pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (/favicon|sourceMappingURL|analytics/i.test(url)) return;
    errors.failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText}`);
  });
  await page.goto(`${BASE}/admin/${DEVICE_ID}/review-tutorials`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(800); // let framer animations settle
}

async function runSection(name: string, fn: () => Promise<void>) {
  console.log(`\n── ${name} ──────────────────────────`);
  await fn();
}

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // ───── PASS 1: 1400×900 (standard admin viewport) ─────
  console.log('\n═══ Pass 1: 1400×900 ═══');
  const ctx1 = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx1);
  const page = await ctx1.newPage();
  const errors = { console: [] as string[], pageErrors: [] as string[], failedRequests: [] as string[] };

  await navigateToCanvas(page, errors);
  await snap(page, '01-initial');

  // ───── 1. Page renders ─────────────────────────────────────────────────
  await runSection('1. Page renders', async () => {
    const visible = await page.locator('[data-testid="tutorial-review-canvas"]').isVisible();
    check('canvas visible', visible);
    const notReady = await page.locator('text=Tutorial review not ready').isVisible().catch(() => false);
    check('no "not ready" overlay', !notReady);
    const deviceName = await page.locator('[data-testid="review-device-name"]').textContent();
    check('device name shows CDJ', !!deviceName?.toLowerCase().includes('cdj'), `text="${deviceName?.trim()}"`);
  });

  // ───── 2. Manifest renders (controls in DOM) ──────────────────────────
  await runSection('2. Manifest renders', async () => {
    const controlCount = await page.locator('[data-control-id]').count();
    check('controls rendered', controlCount > 40, `${controlCount} controls`);
    // jog wheel is the visual heart of cdj-3000 — case-insensitive match
    const jogPresent = await page.locator('[data-control-id*="jog" i]').count();
    check('jog wheel present', jogPresent > 0, `${jogPresent} jog elements`);
  });

  // ───── 3. Panel vertical scroll ───────────────────────────────────────
  await runSection('3. Panel vertical scroll', async () => {
    const scroll = page.locator('[data-testid="panel-preview-scroll"]');
    const before = await scroll.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
    }));
    check('scroll container is scrollable', before.scrollHeight > before.clientHeight,
      `scrollH=${before.scrollHeight}, clientH=${before.clientHeight}`);

    // Scroll down via direct setter + scroll event dispatch
    await scroll.evaluate((el) => {
      el.scrollTop = 400;
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(400);
    const after = await scroll.evaluate((el) => el.scrollTop);
    check('scroll moves panel', after > 100, `scrollTop=${after}`);

    await scroll.evaluate((el) => { el.scrollTop = 0; });
    await page.waitForTimeout(200);
  });

  // ───── 4. ProgressBar dots ────────────────────────────────────────────
  await runSection('4. ProgressBar dots', async () => {
    const dotCount = await page.locator('[data-testid^="progress-dot-"]').count();
    const stepNumText = await page.locator('[data-testid="current-step-num"]').textContent();
    const totalMatch = stepNumText?.match(/of\s+(\d+)|\/\s+(\d+)/);
    const reportedTotal = totalMatch ? Number(totalMatch[1] || totalMatch[2]) : 0;
    check('dots count == reported total steps', dotCount === reportedTotal,
      `dots=${dotCount}, reported=${reportedTotal}, text="${stepNumText?.trim()}"`);

    // Click last dot → step should jump to last
    if (dotCount > 1) {
      await page.locator(`[data-testid="progress-dot-${dotCount - 1}"]`).click();
      await page.waitForTimeout(300);
      const newStepText = await page.locator('[data-testid="current-step-num"]').textContent();
      check('clicking last dot jumps to last step',
        newStepText?.includes(`${dotCount} /`) || newStepText?.includes(`${dotCount} of`) || false,
        `text="${newStepText?.trim()}"`);
      await snap(page, '02-last-step-via-dot');

      // Click first dot → back to step 1
      await page.locator('[data-testid="progress-dot-0"]').click();
      await page.waitForTimeout(300);
      const backText = await page.locator('[data-testid="current-step-num"]').textContent();
      check('clicking first dot returns to step 1',
        backText?.match(/^Step\s+1\s+/) !== null,
        `text="${backText?.trim()}"`);
    }
  });

  // ───── 5. J / K keyboard nav ──────────────────────────────────────────
  await runSection('5. J / K keyboard nav', async () => {
    await page.locator('body').focus();
    const startText = await page.locator('[data-testid="current-step-num"]').textContent();
    await page.keyboard.press('j');
    await page.waitForTimeout(250);
    const afterJ = await page.locator('[data-testid="current-step-num"]').textContent();
    check('J advances step', afterJ !== startText, `before="${startText?.trim()}" after="${afterJ?.trim()}"`);

    await page.keyboard.press('k');
    await page.waitForTimeout(250);
    const afterK = await page.locator('[data-testid="current-step-num"]').textContent();
    check('K reverses step', afterK === startText, `back="${afterK?.trim()}"`);
  });

  // ───── 6. Tutorial cycling [ / ] ──────────────────────────────────────
  await runSection('6. Tutorial cycling', async () => {
    const beforeRow = await page.locator('[data-active="true"][data-testid^="tutorial-row-"]').getAttribute('data-testid');
    await page.keyboard.press(']');
    await page.waitForTimeout(400);
    const afterRow = await page.locator('[data-active="true"][data-testid^="tutorial-row-"]').getAttribute('data-testid');
    check('] advances tutorial', beforeRow !== afterRow, `${beforeRow} → ${afterRow}`);

    // Premortem #2: step index must reset to 1 on tutorial switch
    const stepAfterSwitch = await page.locator('[data-testid="current-step-num"]').textContent();
    check('step resets to 1 on tutorial switch',
      stepAfterSwitch?.match(/^Step\s+1\s+/) !== null,
      `text="${stepAfterSwitch?.trim()}"`);

    await page.keyboard.press('[');
    await page.waitForTimeout(400);
  });

  // ───── 7. Step content updates ────────────────────────────────────────
  await runSection('7. Step content updates', async () => {
    await page.locator('[data-testid="progress-dot-0"]').click();
    await page.waitForTimeout(300);
    const wrap1 = page.locator('[data-testid="step-content-wrapper"]');
    const title1 = await wrap1.locator('h3').first().textContent();
    const instr1 = await wrap1.locator('p').first().textContent();

    await page.locator('[data-testid="progress-dot-1"]').click().catch(() => { /* tutorial may have 1 step */ });
    await page.waitForTimeout(300);
    const title2 = await wrap1.locator('h3').first().textContent().catch(() => null);
    const instr2 = await wrap1.locator('p').first().textContent().catch(() => null);
    check('title or instruction changes between step 1 and 2',
      title1 !== title2 || instr1 !== instr2,
      `t1="${title1?.slice(0,30)}" t2="${title2?.slice(0,30)}"`);
    await snap(page, '03-step-2');
  });

  // ───── 8. Details toggle ──────────────────────────────────────────────
  await runSection('8. Details toggle', async () => {
    // Find a step on any tutorial that has details. Iterate until we find one.
    let toggleFound = false;
    for (let i = 0; i < 8 && !toggleFound; i++) {
      const btn = page.locator('button:has-text("Hide details"), button:has-text("Show details")').first();
      if (await btn.count() > 0) {
        const before = await btn.textContent();
        await btn.click();
        await page.waitForTimeout(300);
        const after = await btn.textContent();
        check('details button toggles label', before !== after, `${before} → ${after}`);
        toggleFound = true;
        break;
      }
      await page.keyboard.press('j');
      await page.waitForTimeout(200);
    }
    if (!toggleFound) {
      console.log('  · no step with details encountered in first 8 steps — skipped');
    }
  });

  // ───── 9. Prev/Next button disabled states ────────────────────────────
  await runSection('9. NavigationControls disabled states', async () => {
    await page.locator('[data-testid="progress-dot-0"]').click();
    await page.waitForTimeout(300);
    // NavigationControls' Back is unique: it's inside the step-content-wrapper
    // sibling area and has exact text "Back" (no arrows, no other adornment).
    const navBack = page.getByRole('button', { name: 'Back', exact: true });
    const backDisabled = await navBack.isDisabled();
    check('NavigationControls Back disabled at step 1', backDisabled);

    const dotCount = await page.locator('[data-testid^="progress-dot-"]').count();
    await page.locator(`[data-testid="progress-dot-${dotCount - 1}"]`).click();
    await page.waitForTimeout(300);
    const navNext = page.getByRole('button', { name: 'Next', exact: true });
    const nextDisabled = await navNext.isDisabled();
    check('NavigationControls Next disabled at last step', nextDisabled);
  });

  // ───── 10. Scale control (editor-parity − / + / % / ⤢) ────────────
  // PR-G-rev replaced the slider + Fit button with editor's exact
  // pattern. Detailed tests live in e2e/canvas-scale.ts; smoke-check
  // the − button (×0.8) + percent-reset round-trip here.
  await runSection('10. Scale control (− button + percent reset)', async () => {
    const wrapper = page.locator('[data-testid="panel-scaled-wrapper"]');
    // Reset to 100% before this test (auto-fit / other tests may have set a scale)
    await page.locator('[data-testid="scale-percent"]').click();
    await page.waitForTimeout(200);
    const before = await wrapper.boundingBox();

    await page.locator('[data-testid="scale-minus"]').click();
    await page.waitForTimeout(400);
    const after = await wrapper.boundingBox();
    check('panel shrinks after − (×0.8)',
      (after?.width ?? 0) < (before?.width ?? Infinity),
      `before w=${before?.width?.toFixed(0)}, after w=${after?.width?.toFixed(0)}`);
    await snap(page, '04-scale-minus');

    // Reset → click % label
    await page.locator('[data-testid="scale-percent"]').click();
    await page.waitForTimeout(400);
    const back = await wrapper.boundingBox();
    check('panel returns to 100% on percent click',
      Math.abs((back?.width ?? 0) - (before?.width ?? 0)) < 5,
      `native w=${before?.width?.toFixed(0)}, back w=${back?.width?.toFixed(0)}`);
  });

  // ───── 11. Manifest stale banner ──────────────────────────────────────
  await runSection('11. Manifest stale banner', async () => {
    const banner = await page.locator('[data-testid="manifest-stale-banner"]').count();
    // cdj-3000 freshness: should not show (auto-export ran)
    check('banner absent when manifest in sync', banner === 0, `banner count=${banner}`);
  });

  // ───── 12. Reviewer notes section ─────────────────────────────────────
  await runSection('12. Reviewer notes section', async () => {
    const section = await page.locator('[data-testid="reviewer-notes-section"]').count();
    // cdj-3000 has no batch-*-review.md files written — should be hidden
    check('reviewer notes hidden when empty', section === 0, `section count=${section}`);
  });

  // ───── 13. Highlighted controls — actual light-up verification ────────
  await runSection('13. Highlighted controls (does the panel actually light up?)', async () => {
    // shortcut-and-my-settings tutorial highlights different controls each step:
    //   step 1: SHORTCUT          step 2: TOUCH_DISPLAY
    //   step 3: SOURCE            step 4: TOUCH_DISPLAY
    //   step 5: TOUCH_DISPLAY + SD_SLOT + USB_PORT
    // Highlighted controls get inline style.zIndex='1000' via framer-motion's
    // highlightAnimation (see PanelButton.tsx:252). Reliable signal.
    await page.locator('[data-testid="tutorial-row-shortcut-and-my-settings"]').click();
    await page.waitForTimeout(500);

    const expected: Array<[number, string[]]> = [
      [0, ['SHORTCUT']],
      [1, ['TOUCH_DISPLAY']],
      [2, ['SOURCE']],
      [4, ['TOUCH_DISPLAY', 'SD_SLOT', 'USB_PORT']],
    ];

    for (const [stepIdx, ids] of expected) {
      const dotExists = await page.locator(`[data-testid="progress-dot-${stepIdx}"]`).count();
      if (!dotExists) continue;
      await page.locator(`[data-testid="progress-dot-${stepIdx}"]`).click();
      await page.waitForTimeout(450);

      for (const ctrlId of ids) {
        const node = page.locator(`[data-control-id="${ctrlId}"]`);
        const count = await node.count();
        if (count === 0) {
          check(`step ${stepIdx + 1}: control ${ctrlId} exists in DOM`, false, 'control not rendered');
          continue;
        }
        // Highlight signal: framer-motion animates box-shadow to the blue
        // `rgba(0, 170, 255, *)` glow on ALL highlighted control variants
        // (PanelButton sets z-1000 + glow, Port/TouchDisplay/Knob just glow).
        // Check the element OR any descendant for that color in box-shadow
        // OR z-index 1000.
        const litUp = await page.evaluate((id) => {
          const els = document.querySelectorAll(`[data-control-id="${id}"]`);
          for (const el of els) {
            // Walk this subtree
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
            let node: Element | null = el;
            while (node) {
              const cs = getComputedStyle(node as HTMLElement);
              if (cs.zIndex === '1000') return true;
              if (cs.boxShadow && cs.boxShadow.includes('170, 255')) return true;
              node = walker.nextNode() as Element | null;
            }
          }
          return false;
        }, ctrlId);
        check(`step ${stepIdx + 1}: ${ctrlId} is highlighted (glow visible)`, litUp);
      }
      if (stepIdx === 0) await snap(page, '05-highlights-step-1');
      if (stepIdx === 4) await snap(page, '06-highlights-step-5-multi');
    }
  });

  // ───── 14. Approve / Request Changes buttons ──────────────────────────
  await runSection('14. Action buttons', async () => {
    const approve = await page.locator('[data-testid="approve-button"]').isVisible();
    check('Approve button visible', approve);
    const changes = await page.locator('[data-testid="request-changes-button"]').isVisible();
    check('Request Changes button visible', changes);
    // Don't click — that'd resume the pipeline
  });

  // ───── 15. Esc → /admin ──────────────────────────────────────────────
  await runSection('15. Esc returns to admin', async () => {
    // Reset focus + dispatch keydown directly on window so the listener
    // fires deterministically regardless of which control was focused
    // last. (Focus-then-press is brittle with the Scale toolbar present.)
    await page.evaluate(() => {
      const ae = document.activeElement as HTMLElement | null;
      if (ae && ae !== document.body) ae.blur();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await page.waitForTimeout(1200);
    const url = page.url();
    check('navigated away from review canvas',
      !url.includes('/review-tutorials'),
      `url=${url}`);
  });

  // ───── 16. Console / page error hygiene ───────────────────────────────
  await runSection('16. No console errors / page errors / failed requests', async () => {
    const hydration = errors.console.filter((e) =>
      /hydration|hydrated.*didn't match|Text content does not match|server.*rendered HTML/i.test(e));
    check('no hydration errors', hydration.length === 0,
      hydration.length === 0 ? '' : hydration.slice(0, 2).join(' | '));

    // tolerate framer-motion + nextjs dev noise
    const realConsoleErrors = errors.console.filter((e) =>
      !/Download the React DevTools|framer-motion|HMR|Fast Refresh/i.test(e));
    check('no console errors', realConsoleErrors.length === 0,
      realConsoleErrors.length === 0 ? '' : `${realConsoleErrors.length} errors: ${realConsoleErrors.slice(0, 3).join(' | ')}`);

    check('no page errors', errors.pageErrors.length === 0,
      errors.pageErrors.length === 0 ? '' : errors.pageErrors.slice(0, 2).join(' | '));

    check('no failed requests', errors.failedRequests.length === 0,
      errors.failedRequests.length === 0 ? '' : errors.failedRequests.slice(0, 2).join(' | '));
  });

  await ctx1.close();

  // ───── PASS 2: 1366×768 (laptop) ─────────
  console.log('\n═══ Pass 2: 1366×768 (laptop viewport) ═══');
  const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await setCookie(ctx2);
  const page2 = await ctx2.newPage();
  const errors2 = { console: [] as string[], pageErrors: [] as string[], failedRequests: [] as string[] };
  await navigateToCanvas(page2, errors2);
  await snap(page2, '07-laptop-native');

  await runSection('Laptop: panel fits at small viewport (auto-fit default)', async () => {
    // PR-G-rev: no explicit auto-fit button. The first-visit default is
    // computed by computeAutoFit and applied automatically.
    await page2.waitForTimeout(500);
    await snap(page2, '08-laptop-fit-on');
    const wrapper = page2.locator('[data-testid="panel-scaled-wrapper"]');
    const bb = await wrapper.boundingBox();
    check('panel fits in viewport at small viewport',
      (bb?.width ?? Infinity) <= 1366,
      `panel ${bb?.width?.toFixed(0)}×${bb?.height?.toFixed(0)}`);
  });

  await runSection('Laptop: ProgressBar dots still clickable', async () => {
    const dotCount = await page2.locator('[data-testid^="progress-dot-"]').count();
    check('dots present at small viewport', dotCount > 0, `${dotCount} dots`);
    if (dotCount > 1) {
      const dot1 = page2.locator('[data-testid="progress-dot-1"]');
      const bb = await dot1.boundingBox();
      check('dot click target ≥ 16px',
        (bb?.width ?? 0) >= 16 && (bb?.height ?? 0) >= 16,
        `dot ${bb?.width?.toFixed(0)}×${bb?.height?.toFixed(0)}`);
    }
  });

  await ctx2.close();
  await browser.close();
}

main().then(() => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log('\nFAILURES:');
    failures.forEach((f) => console.log(`  ✗ ${f}`));
  }
  console.log(`\nScreenshots in ${SCREENSHOT_DIR}/`);
  process.exit(fail > 0 ? 1 : 0);
}).catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});
