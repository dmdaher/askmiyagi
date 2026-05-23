/**
 * Canvas QA — Layer 2 only (visual highlight verification).
 *
 * Lighter sibling of canvas-qa-suite.ts. Runs the Playwright walkthrough,
 * captures per-step glow assertions, emits a JSON line `__QA_RESULTS__ {...}`
 * on stdout so the qa-rerun API route can parse and merge into qa-report.json.
 *
 * Also writes per-step screenshots to /tmp/canvas-qa/<device>/<tut>/step-NN.png.
 *
 * Run: TEST_DEVICE=cdj-3000 OUTPUT_JSON=1 npx tsx e2e/canvas-qa-visual-only.ts
 */
import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';
const REPO_ROOT = '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi-wt-pre';
const OUT_DIR = `/tmp/canvas-qa/${DEVICE}`;

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

interface TutorialStep { title?: string; highlightControls?: string[]; }
interface Tutorial { id: string; title: string; steps: TutorialStep[]; }

interface VisualStepResult {
  tutorialId: string; stepIndex: number; stepTitle: string;
  expected: string[]; litUp: string[]; unexpected: string[];
}

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

async function getGlowingControls(page: Page, expectedIds: string[]): Promise<string[]> {
  if (expectedIds.length > 0) {
    await page.evaluate(`(function(ids) {
      var maxBottom = 0, target = null;
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
        if (cs.boxShadow && cs.boxShadow.indexOf('170, 255') !== -1) { lit.add(id); break; }
        if (node.style && node.style.zIndex === '1000') { lit.add(id); break; }
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

async function main() {
  const tutorialsJsonPath = path.join(
    REPO_ROOT, '.pipeline', DEVICE, 'agents', 'tutorial-review', 'tutorials.json',
  );
  const tutorials: Tutorial[] = JSON.parse(fs.readFileSync(tutorialsJsonPath, 'utf-8'));

  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, {
    waitUntil: 'domcontentloaded', timeout: 30_000,
  });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 30_000 });
  await page.waitForTimeout(800);

  const stepResults: VisualStepResult[] = [];

  for (const tut of tutorials) {
    const tutDir = path.join(OUT_DIR, tut.id);
    fs.mkdirSync(tutDir, { recursive: true });
    await page.locator(`[data-testid="tutorial-row-${tut.id}"]`).click();
    await page.waitForTimeout(500);
    for (let i = 0; i < tut.steps.length; i++) {
      const step = tut.steps[i];
      const expected = step.highlightControls ?? [];
      const stepNum = String(i + 1).padStart(2, '0');
      const dot = page.locator(`[data-testid="progress-dot-${i}"]`);
      if ((await dot.count()) === 0) continue;
      await dot.click();
      await page.waitForTimeout(550);
      const glowing = await getGlowingControls(page, expected);
      const litExpected = expected.filter((id) => glowing.includes(id));
      const unexpected = glowing.filter((id) => !expected.includes(id));

      // Cropped screenshot
      try {
        const scroll = page.locator('[data-testid="panel-preview-scroll"]');
        const bb = await scroll.boundingBox();
        if (bb) {
          await page.screenshot({
            path: path.join(tutDir, `step-${stepNum}.png`),
            clip: {
              x: Math.max(0, bb.x), y: Math.max(0, bb.y),
              width: Math.min(bb.width, 1400),
              height: Math.min(bb.height + 280, 800),
            },
          });
        }
      } catch { /* screenshot is best-effort */ }

      stepResults.push({
        tutorialId: tut.id, stepIndex: i, stepTitle: step.title ?? '',
        expected, litUp: litExpected, unexpected,
      });
    }
  }
  await browser.close();

  const totalExpected = stepResults.reduce((s, r) => s + r.expected.length, 0);
  const totalLit = stepResults.reduce((s, r) => s + r.litUp.length, 0);
  const totalUnexpected = stepResults.reduce((s, r) => s + r.unexpected.length, 0);
  const failedSteps = stepResults.filter(
    (r) => r.expected.length > 0 && (r.litUp.length < r.expected.length || r.unexpected.length > 0),
  );

  const results = [
    {
      layer: 2,
      name: '2a. expected highlights actually glow',
      severity: (totalLit === totalExpected ? 'ok' : 'fail') as 'ok' | 'fail',
      message: `${totalLit}/${totalExpected} expected highlights lit (${totalExpected ? ((totalLit / totalExpected) * 100).toFixed(1) : 0}%)`,
      details: failedSteps
        .filter((r) => r.litUp.length < r.expected.length)
        .map((r) => ({
          tutorial: r.tutorialId,
          step: r.stepIndex + 1,
          control: r.expected.filter((e) => !r.litUp.includes(e)).join(', '),
          label: null,
        })),
    },
    {
      layer: 2,
      name: '2b. no unexpected glows',
      severity: (totalUnexpected === 0 ? 'ok' : 'fail') as 'ok' | 'fail',
      message: `${totalUnexpected} unexpected glow events across ${stepResults.length} steps`,
      details: failedSteps
        .filter((r) => r.unexpected.length > 0)
        .map((r) => ({
          tutorial: r.tutorialId,
          step: r.stepIndex + 1,
          control: r.unexpected.join(', '),
          label: null,
        })),
    },
  ];

  // Pipe-friendly machine-readable marker for the API parser
  if (process.env.OUTPUT_JSON === '1') {
    console.log(`__QA_RESULTS__ ${JSON.stringify({ results, stepResults })}`);
  } else {
    console.log(`${totalLit}/${totalExpected} lit, ${totalUnexpected} unexpected`);
  }
  process.exit(results.some((r) => r.severity === 'fail') ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});
