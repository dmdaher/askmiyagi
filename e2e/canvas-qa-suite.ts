/**
 * Canvas QA Suite — Control ↔ Tutorial Linkage validation.
 *
 * See docs/canvas-qa-framework.md for the design + premortem.
 *
 * 5 layers:
 *   1. Reference integrity (manifest ↔ tutorial highlight IDs, both ways)
 *   2. Visual highlight verification (Playwright)
 *   3. Semantic coherence (label appears in step text iff in highlightControls)
 *   4. Visual sample screenshots
 *   5. Cumulative state integrity (TODO: hook tutorial-validators)
 *
 * Run: npx tsx e2e/canvas-qa-suite.ts
 * Env: TEST_DEVICE=cdj-3000  TEST_BASE_URL=http://localhost:3000
 *
 * Exit code 0 = all hard-fail layers (1+2) passed.
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

interface TutorialStep {
  id: string;
  title?: string;
  instruction?: string;
  details?: string;
  tipText?: string;
  highlightControls?: string[];
  panelStateChanges?: Record<string, unknown>;
}
interface Tutorial {
  id: string;
  title: string;
  steps: TutorialStep[];
}
interface ManifestControl {
  id: string;
  type: string;
  label?: string;
  shape?: string;
  editorPosition?: { x: number; y: number; w: number; h: number };
}
interface Manifest {
  panelWidth: number;
  panelHeight: number;
  controls: ManifestControl[];
}

interface FrameworkResult {
  layer: number;
  name: string;
  severity: 'fail' | 'warn' | 'ok';
  message: string;
  details?: unknown;
}

function loadManifest(): Manifest {
  const p = path.join(REPO_ROOT, 'src', 'data', 'manifests', `${DEVICE}.json`);
  if (!fs.existsSync(p)) throw new Error(`Manifest not found at ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function loadTutorials(): Tutorial[] {
  const p = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents', 'tutorial-review', 'tutorials.json');
  if (!fs.existsSync(p)) throw new Error(`Tutorials not found at ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// ── Layer 1: Reference Integrity ────────────────────────────────────────
function layer1(manifest: Manifest, tutorials: Tutorial[]): FrameworkResult[] {
  const results: FrameworkResult[] = [];
  const manifestIds = new Set(manifest.controls.map((c) => c.id));
  const referencedIds = new Set<string>();
  const refCount = new Map<string, number>();
  for (const tut of tutorials) {
    for (const step of tut.steps) {
      for (const id of (step.highlightControls ?? [])) {
        referencedIds.add(id);
        refCount.set(id, (refCount.get(id) ?? 0) + 1);
      }
    }
  }

  // 1a. Every tutorial-referenced ID must exist in manifest
  const missingFromManifest = [...referencedIds].filter((id) => !manifestIds.has(id));
  if (missingFromManifest.length > 0) {
    results.push({
      layer: 1, name: '1a. tutorial→manifest reference integrity',
      severity: 'fail',
      message: `${missingFromManifest.length} tutorial highlightControls IDs missing from manifest`,
      details: missingFromManifest,
    });
  } else {
    results.push({
      layer: 1, name: '1a. tutorial→manifest reference integrity',
      severity: 'ok',
      message: `all ${referencedIds.size} tutorial-referenced IDs exist in manifest`,
    });
  }

  // 1b. Every manifest control should appear in at least one tutorial (warn-only)
  const unreferenced = [...manifestIds].filter((id) => !referencedIds.has(id));
  results.push({
    layer: 1, name: '1b. manifest→tutorial coverage',
    severity: unreferenced.length > 0 ? 'warn' : 'ok',
    message: `${manifestIds.size - unreferenced.length} of ${manifestIds.size} controls referenced by tutorials (${unreferenced.length} unreferenced)`,
    details: unreferenced,
  });

  return results;
}

// ── Layer 2: Visual Highlight (delegated to walkthrough) ────────────────
async function navigateToCanvas(page: Page) {
  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, {
    waitUntil: 'domcontentloaded', timeout: 30_000,
  });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 30_000 });
  await page.waitForTimeout(800);
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

interface VisualStepResult {
  tutorialId: string;
  stepIndex: number;
  stepTitle: string;
  expected: string[];
  litUp: string[];
  unexpected: string[];
  screenshotPath: string;
}

async function captureStep(page: Page): Promise<Buffer> {
  const scroll = page.locator('[data-testid="panel-preview-scroll"]');
  const bb = await scroll.boundingBox();
  if (!bb) return await page.screenshot();
  return await page.screenshot({
    clip: {
      x: Math.max(0, bb.x), y: Math.max(0, bb.y),
      width: Math.min(bb.width, 1400),
      height: Math.min(bb.height + 280, 800),
    },
  });
}

async function layer2(tutorials: Tutorial[]): Promise<{ results: FrameworkResult[]; stepResults: VisualStepResult[] }> {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();
  await navigateToCanvas(page);

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

      const screenshotPath = path.join(tutDir, `step-${stepNum}.png`);
      fs.writeFileSync(screenshotPath, await captureStep(page));

      stepResults.push({
        tutorialId: tut.id, stepIndex: i, stepTitle: step.title ?? '',
        expected, litUp: litExpected, unexpected, screenshotPath,
      });
    }
  }
  await browser.close();

  const totalExpected = stepResults.reduce((s, r) => s + r.expected.length, 0);
  const totalLit = stepResults.reduce((s, r) => s + r.litUp.length, 0);
  const totalUnexpected = stepResults.reduce((s, r) => s + r.unexpected.length, 0);
  const failedSteps = stepResults.filter((r) => r.expected.length > 0 && (r.litUp.length < r.expected.length || r.unexpected.length > 0));

  const results: FrameworkResult[] = [
    {
      layer: 2, name: '2a. expected highlights actually glow',
      severity: totalLit === totalExpected ? 'ok' : 'fail',
      message: `${totalLit}/${totalExpected} expected highlights lit (${totalExpected ? ((totalLit/totalExpected)*100).toFixed(1) : 0}%)`,
      details: failedSteps.filter((r) => r.litUp.length < r.expected.length).map((r) => ({
        tutorial: r.tutorialId, step: r.stepIndex + 1, missing: r.expected.filter((e) => !r.litUp.includes(e)),
      })),
    },
    {
      layer: 2, name: '2b. no unexpected glows (state leak / wrong control)',
      severity: totalUnexpected === 0 ? 'ok' : 'fail',
      message: `${totalUnexpected} unexpected glow events across ${stepResults.length} steps`,
      details: failedSteps.filter((r) => r.unexpected.length > 0).map((r) => ({
        tutorial: r.tutorialId, step: r.stepIndex + 1, unexpected: r.unexpected,
      })),
    },
  ];
  return { results, stepResults };
}

// ── Layer 3: Semantic Coherence ─────────────────────────────────────────
// Heuristic: tokenize step text, build a label→id index, look for matches.
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[\/\-_]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function controlSearchTerms(c: ManifestControl): string[] {
  // Build the set of "tokens that mean this control" — id, label, label
  // pieces. Bias against generic words ("up", "back", "in") by requiring
  // at least 4 chars, except when the id is short and unique.
  const out = new Set<string>();
  out.add(c.id.toLowerCase());
  if (c.label) {
    const labelTokens = tokenize(c.label);
    for (const t of labelTokens) if (t.length >= 4) out.add(t);
    // Whole label
    out.add(c.label.toLowerCase().replace(/[\/\-_]/g, ' ').trim());
  }
  return [...out];
}

function layer3(manifest: Manifest, tutorials: Tutorial[]): FrameworkResult[] {
  const results: FrameworkResult[] = [];
  const controlsById = new Map(manifest.controls.map((c) => [c.id, c]));

  // Build label→id reverse index
  const termToIds = new Map<string, Set<string>>();
  for (const c of manifest.controls) {
    for (const term of controlSearchTerms(c)) {
      if (!termToIds.has(term)) termToIds.set(term, new Set());
      termToIds.get(term)!.add(c.id);
    }
  }

  const mentionedNotHighlighted: Array<{ tutorial: string; step: number; control: string; }> = [];
  const highlightedNotMentioned: Array<{ tutorial: string; step: number; control: string; }> = [];

  for (const tut of tutorials) {
    for (let i = 0; i < tut.steps.length; i++) {
      const step = tut.steps[i];
      const expected = new Set(step.highlightControls ?? []);
      const text = [step.title, step.instruction, step.details, step.tipText]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const tokens = new Set(tokenize(text));
      // Also add common multi-word labels
      const lowerText = ' ' + text + ' ';

      // For each manifest control, decide if mentioned
      const mentioned = new Set<string>();
      for (const c of manifest.controls) {
        const terms = controlSearchTerms(c);
        const found = terms.some((t) =>
          t.includes(' ')
            ? lowerText.includes(' ' + t + ' ') || lowerText.includes(' ' + t + '.') || lowerText.includes(' ' + t + ',')
            : tokens.has(t)
        );
        if (found) mentioned.add(c.id);
      }

      for (const id of mentioned) {
        if (!expected.has(id)) {
          mentionedNotHighlighted.push({ tutorial: tut.id, step: i + 1, control: id });
        }
      }
      for (const id of expected) {
        if (!mentioned.has(id)) {
          highlightedNotMentioned.push({ tutorial: tut.id, step: i + 1, control: id });
        }
      }
    }
  }

  results.push({
    layer: 3, name: '3a. step text mentions control NOT in highlightControls',
    severity: 'warn',
    message: `${mentionedNotHighlighted.length} cases (advisory — could be contextual mentions)`,
    details: mentionedNotHighlighted,
  });
  results.push({
    layer: 3, name: '3b. highlightControls entry NOT mentioned in step text',
    severity: 'warn',
    message: `${highlightedNotMentioned.length} cases (advisory — could be visual-only emphasis)`,
    details: highlightedNotMentioned,
  });

  return results;
}

// ── Report assembly ─────────────────────────────────────────────────────
function writeReport(
  manifest: Manifest, tutorials: Tutorial[],
  results: FrameworkResult[], stepResults: VisualStepResult[],
) {
  const lines: string[] = [];
  lines.push(`# Canvas QA Report — ${DEVICE}`);
  lines.push('');
  lines.push(`- Manifest: ${manifest.controls.length} controls, ${manifest.panelWidth}×${manifest.panelHeight}px`);
  lines.push(`- Tutorials: ${tutorials.length}, ${tutorials.reduce((s, t) => s + t.steps.length, 0)} steps`);
  lines.push(`- Run: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Layer summary');
  lines.push('');
  lines.push('| Layer | Check | Severity | Result |');
  lines.push('|---|---|---|---|');
  for (const r of results) {
    const sym = r.severity === 'fail' ? '🔴 FAIL' : r.severity === 'warn' ? '🟡 WARN' : '🟢 OK';
    lines.push(`| ${r.layer} | ${r.name} | ${sym} | ${r.message} |`);
  }
  lines.push('');

  // Detail sections per non-ok layer
  for (const r of results) {
    if (r.severity === 'ok' || !r.details) continue;
    lines.push(`### ${r.name} (${r.severity})`);
    lines.push('');
    if (Array.isArray(r.details)) {
      if (r.details.length === 0) { lines.push('_(none)_'); lines.push(''); continue; }
      if (typeof r.details[0] === 'string') {
        for (const d of r.details as string[]) lines.push(`- \`${d}\``);
      } else {
        const keys = Object.keys(r.details[0] as object);
        lines.push('| ' + keys.join(' | ') + ' |');
        lines.push('|' + keys.map(() => '---').join('|') + '|');
        for (const d of r.details as Array<Record<string, unknown>>) {
          lines.push('| ' + keys.map((k) => JSON.stringify(d[k]).replace(/^"|"$/g, '')).join(' | ') + ' |');
        }
      }
    }
    lines.push('');
  }

  // Per-step table
  lines.push('## Per-step visual verification (Layer 2)');
  lines.push('');
  lines.push('| Tutorial | Step | Title | Expected | Lit | Unexpected | Verdict |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const r of stepResults) {
    const verdict = r.expected.length === 0 ? '—'
      : r.litUp.length === r.expected.length && r.unexpected.length === 0 ? '✅'
      : '❌';
    const rel = path.relative(OUT_DIR, r.screenshotPath);
    lines.push(`| ${r.tutorialId} | ${r.stepIndex + 1} | ${(r.stepTitle || '').replace(/\|/g, '\\|').slice(0, 60)} | ${r.expected.join(', ') || '—'} | ${r.litUp.join(', ') || '—'} | ${r.unexpected.join(', ') || '—'} | ${verdict} [📷](${rel}) |`);
  }

  const reportPath = path.join(OUT_DIR, 'REPORT.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
  return reportPath;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n══ Canvas QA Suite — ${DEVICE} ══════════════════════\n`);

  const manifest = loadManifest();
  const tutorials = loadTutorials();
  const allResults: FrameworkResult[] = [];

  console.log('── Layer 1: Reference Integrity ─────────────');
  const l1 = layer1(manifest, tutorials);
  for (const r of l1) {
    const sym = r.severity === 'fail' ? '🔴' : r.severity === 'warn' ? '🟡' : '🟢';
    console.log(`  ${sym} ${r.name}: ${r.message}`);
  }
  allResults.push(...l1);

  console.log('\n── Layer 2: Visual Highlight Verification ───');
  const l2 = await layer2(tutorials);
  for (const r of l2.results) {
    const sym = r.severity === 'fail' ? '🔴' : r.severity === 'warn' ? '🟡' : '🟢';
    console.log(`  ${sym} ${r.name}: ${r.message}`);
  }
  allResults.push(...l2.results);

  console.log('\n── Layer 3: Semantic Coherence ──────────────');
  const l3 = layer3(manifest, tutorials);
  for (const r of l3) {
    const sym = r.severity === 'fail' ? '🔴' : r.severity === 'warn' ? '🟡' : '🟢';
    console.log(`  ${sym} ${r.name}: ${r.message}`);
  }
  allResults.push(...l3);

  const reportPath = writeReport(manifest, tutorials, allResults, l2.stepResults);
  console.log(`\nReport: ${reportPath}`);
  console.log(`Screenshots: ${OUT_DIR}/<tutorial-id>/step-NN.png`);

  const hardFails = allResults.filter((r) => r.severity === 'fail');
  if (hardFails.length > 0) {
    console.log(`\n🔴 ${hardFails.length} hard failure(s).`);
    process.exit(1);
  }
  const warns = allResults.filter((r) => r.severity === 'warn');
  console.log(`\n🟢 All hard-fail layers pass. ${warns.length} advisory warning(s) for review.`);
  process.exit(0);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
