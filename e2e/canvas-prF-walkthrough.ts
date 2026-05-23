/**
 * Full tutorial walkthrough — for every step of every tutorial, verify
 * that the controls listed in `highlightControls` are actually showing the
 * framer-motion glow in the rendered panel.
 *
 * Output per step:
 *   - PASS/FAIL per expected control
 *   - cropped screenshot of the panel preview area saved to
 *     /tmp/canvas-prF-walkthrough/<tutorial-id>/step-<NN>.png
 *
 * Output summary:
 *   - markdown report at /tmp/canvas-prF-walkthrough/REPORT.md
 *   - per-tutorial pass/fail counts in console
 *
 * Run: npx tsx e2e/canvas-prF-walkthrough.ts
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
const OUT_DIR = '/tmp/canvas-prF-walkthrough';

interface TutorialStep {
  id: string;
  title?: string;
  instruction?: string;
  highlightControls?: string[];
}
interface Tutorial {
  id: string;
  title: string;
  steps: TutorialStep[];
}

interface StepResult {
  tutorialId: string;
  stepIndex: number;
  stepTitle: string;
  expected: string[];
  litUp: string[];      // of expected, which actually glowed
  unexpected: string[]; // controls glowing that WEREN'T in expected
  screenshotPath: string;
}

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

async function navigateToCanvas(page: Page) {
  await page.goto(`${BASE}/admin/${DEVICE_ID}/review-tutorials`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(800);
}

async function getGlowingControls(page: Page, expectedIds: string[] = []): Promise<string[]> {
  // Framer-motion's animation runs on EVERY rendered element regardless of
  // viewport, but its values only commit to computed style once it starts
  // ticking. For controls off-screen at navigation time, we briefly scroll
  // each expected control into view to ensure framer has applied at least
  // one keyframe.
  //
  // Body is plain JS string to avoid tsx __name injection issues.
  if (expectedIds.length > 0) {
    await page.evaluate(`(function(ids) {
      var scroll = document.querySelector('[data-testid="panel-preview-scroll"]');
      if (!scroll) return;
      // Find the bottom-most expected control; scrollIntoView once is enough
      // (framer keyframes apply globally; only need any one to be visible).
      var maxBottom = 0;
      var target = null;
      for (var i = 0; i < ids.length; i++) {
        var el = document.querySelector('[data-control-id="' + ids[i] + '"]');
        if (!el) continue;
        var r = el.getBoundingClientRect();
        if (r.bottom > maxBottom) { maxBottom = r.bottom; target = el; }
      }
      if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' });
    })(${JSON.stringify(expectedIds)})`);
    await page.waitForTimeout(500);
  }
  return await page.evaluate(`(function() {
    var lit = new Set();
    var seen = new Set();
    var roots = document.querySelectorAll('[data-control-id]');
    for (var r = 0; r < roots.length; r++) {
      var root = roots[r];
      var id = root.getAttribute('data-control-id');
      if (!id) continue;
      var stack = [root];
      while (stack.length) {
        var node = stack.pop();
        if (seen.has(node)) continue;
        seen.add(node);
        var cs = getComputedStyle(node);
        if (cs.boxShadow && cs.boxShadow.indexOf('170, 255') !== -1) {
          lit.add(id);
          break;
        }
        // Also check inline zIndex 1000 (PanelButton highlight signal that
        // persists regardless of animation state).
        if (node.style && node.style.zIndex === '1000') {
          lit.add(id);
          break;
        }
        for (var i = 0; i < node.children.length; i++) {
          var child = node.children[i];
          if (child.hasAttribute('data-control-id') && child !== root) continue;
          stack.push(child);
        }
      }
    }
    return Array.from(lit);
  })()`) as string[];
}

async function captureStep(page: Page): Promise<Buffer> {
  // Crop to the panel preview area + step content for context
  const scroll = page.locator('[data-testid="panel-preview-scroll"]');
  const bb = await scroll.boundingBox();
  if (!bb) return await page.screenshot();
  return await page.screenshot({
    clip: {
      x: Math.max(0, bb.x),
      y: Math.max(0, bb.y),
      width: Math.min(bb.width, 1400),
      height: Math.min(bb.height + 280, 800), // include progressbar + step content below
    },
  });
}

async function main() {
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Fetch tutorials.json directly for ground-truth highlightControls
  const tutorialsJson = JSON.parse(fs.readFileSync(
    `/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi-wt-pre/.pipeline/${DEVICE_ID}/agents/tutorial-review/tutorials.json`,
    'utf-8',
  )) as Tutorial[];

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();

  page.on('pageerror', (err) => console.error(`  ! page error: ${err.message}`));

  await navigateToCanvas(page);

  const results: StepResult[] = [];
  let totalSteps = 0;
  let totalExpected = 0;
  let totalLit = 0;
  let totalUnexpected = 0;

  for (const tutorial of tutorialsJson) {
    const tutDir = path.join(OUT_DIR, tutorial.id);
    fs.mkdirSync(tutDir, { recursive: true });
    console.log(`\n══ ${tutorial.id} ──── (${tutorial.steps.length} steps)`);

    // Click the sidebar row to switch tutorial
    await page.locator(`[data-testid="tutorial-row-${tutorial.id}"]`).click();
    await page.waitForTimeout(500);

    for (let i = 0; i < tutorial.steps.length; i++) {
      const step = tutorial.steps[i];
      const expected = step.highlightControls ?? [];
      const stepNum = String(i + 1).padStart(2, '0');

      // Jump via dot — guarantees the store has settled on this step
      const dot = page.locator(`[data-testid="progress-dot-${i}"]`);
      const dotCount = await dot.count();
      if (dotCount === 0) {
        console.log(`  step ${stepNum} — dot missing`);
        continue;
      }
      await dot.click();
      // Wait for framer animation to apply box-shadow
      await page.waitForTimeout(550);

      const glowing = await getGlowingControls(page, expected);
      const litExpected = expected.filter((id) => glowing.includes(id));
      const unexpected = glowing.filter((id) => !expected.includes(id));

      const screenshotPath = path.join(tutDir, `step-${stepNum}.png`);
      const png = await captureStep(page);
      fs.writeFileSync(screenshotPath, png);

      const allLit = expected.length > 0 && litExpected.length === expected.length;
      const symbol = expected.length === 0
        ? '·'
        : allLit && unexpected.length === 0
          ? '✓'
          : allLit
            ? '!'  // expected glow but also unexpected glow
            : '✗';
      const expectedStr = expected.join(', ') || '(none)';
      const litStr = litExpected.length === expected.length
        ? 'all'
        : `${litExpected.length}/${expected.length}`;
      const unexStr = unexpected.length ? ` [+ unexpected: ${unexpected.join(', ')}]` : '';
      console.log(`  ${symbol} step ${stepNum}: ${litStr} of expected${unexStr} · exp=[${expectedStr}]`);

      results.push({
        tutorialId: tutorial.id,
        stepIndex: i,
        stepTitle: step.title ?? '',
        expected,
        litUp: litExpected,
        unexpected,
        screenshotPath,
      });

      totalSteps++;
      totalExpected += expected.length;
      totalLit += litExpected.length;
      totalUnexpected += unexpected.length;
    }
  }

  await browser.close();

  // Write markdown report
  const lines: string[] = [];
  lines.push(`# Tutorial walkthrough — ${DEVICE_ID}`);
  lines.push('');
  lines.push(`Steps walked: ${totalSteps}`);
  lines.push(`Expected highlights: ${totalExpected}, lit up: ${totalLit} (${totalExpected ? ((totalLit / totalExpected) * 100).toFixed(1) : 0}%)`);
  lines.push(`Unexpected highlights: ${totalUnexpected}`);
  lines.push('');
  lines.push('## Per-step results');
  lines.push('');
  lines.push('| Tutorial | Step | Title | Expected | Lit up | Unexpected | Verdict |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of results) {
    const verdict = r.expected.length === 0
      ? '—'
      : r.litUp.length === r.expected.length && r.unexpected.length === 0
        ? '✅'
        : r.litUp.length === r.expected.length
          ? '⚠️ extra'
          : '❌';
    const screenshotRel = path.relative(OUT_DIR, r.screenshotPath);
    lines.push(`| ${r.tutorialId} | ${r.stepIndex + 1} | ${(r.stepTitle || '').replace(/\|/g, '\\|')} | ${r.expected.join(', ') || '—'} | ${r.litUp.join(', ') || '—'} | ${r.unexpected.join(', ') || '—'} | ${verdict} [📷](${screenshotRel}) |`);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'REPORT.md'), lines.join('\n'));

  console.log('\n══════════════════════════════════════════');
  console.log(`Totals: ${totalSteps} steps · ${totalLit}/${totalExpected} expected highlights lit (${totalExpected ? ((totalLit / totalExpected) * 100).toFixed(1) : 0}%) · ${totalUnexpected} unexpected`);
  console.log(`Report: ${path.join(OUT_DIR, 'REPORT.md')}`);
  console.log(`Screenshots in: ${OUT_DIR}/<tutorial-id>/step-NN.png`);
  process.exit(totalLit === totalExpected ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});
