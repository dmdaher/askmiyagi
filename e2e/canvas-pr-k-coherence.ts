/**
 * PR-K verification — assess-coherence + Layer 5 + tutorial-level patch.
 *
 * No real agent calls (would cost ~$0.20 per Assess click). Tests:
 *   A. Layer 5 panel renders + can be toggled open
 *   B. GET /qa-assess-coherence returns empty when no cache exists
 *   C. Seed coherence-cache.json + Layer 5 renders the cached score
 *   D. qa-fix-apply dispatches layer5 to applyTutorialFixPatch:
 *      D1. /steps/<idx> replace mutates tutorials.json
 *      D2. /steps/<idx> remove drops the step
 *      D3. /steps/- append adds a step
 *      D4. invalid /steps path rolls back
 *   E. Cumulative-state still gates layer5 patches (PR-L integration)
 *      E1. A layer5 patch that introduces unknown highlight → 409 rollback
 */
import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

function readPwd(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  try {
    const env = fs.readFileSync(
      '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.env.local', 'utf-8');
    const m = env.match(/^ADMIN_PASSWORD=(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : 'miyagi2026';
  } catch { return 'miyagi2026'; }
}

const PWD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';
const REPO_ROOT = '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi-wt-pre';

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, ok: boolean, info = '') => {
  if (ok) { console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fails.push(`${label} — ${info}`); fail++; }
};

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: PWD, domain: 'localhost', path: '/',
    httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

async function openCanvas(page: Page) {
  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(1200);
}

async function main() {
  console.log(`\n══ PR-K verification — ${DEVICE} ════════════\n`);

  const tutorialsPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents/tutorial-review/tutorials.json');
  const cachePath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents/tutorial-review/coherence-cache.json');
  if (!fs.existsSync(tutorialsPath)) {
    console.log(`FATAL: tutorials.json missing for ${DEVICE}`);
    process.exit(2);
  }
  const originalTutorials = fs.readFileSync(tutorialsPath, 'utf-8');
  const originalCache = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, 'utf-8') : null;
  const tArr = JSON.parse(originalTutorials);
  const firstId = tArr[0].id;
  const firstTitle = tArr[0].title;

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();

  try {
    // ── A. Layer 5 panel renders + toggles open ──────────────────────────
    console.log('── A. Layer 5 panel renders ──');
    await openCanvas(page);
    check('layer5-panel mounted', await page.locator('[data-testid="layer5-panel"]').count() > 0);
    const toggle = page.locator('[data-testid="layer5-toggle"]');
    await toggle.click();
    await page.waitForTimeout(500);
    const firstRow = page.locator(`[data-testid="layer5-row-${firstId}"]`);
    check(`layer5 row for first tutorial visible`, await firstRow.isVisible());
    const assessBtn = page.locator(`[data-testid="layer5-assess-${firstId}"]`);
    check(`Assess button rendered for ${firstId}`, await assessBtn.isVisible());

    // ── B. GET /qa-assess-coherence with no cache returns cached:false ──
    console.log('\n── B. GET endpoint returns cached:false initially ──');
    // Clear any pre-existing cache for clean test
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    const initialGet = await page.evaluate(async ({ device, tutorialId }) => {
      const r = await fetch(`/api/pipeline/${device}/qa-assess-coherence?tutorialId=${encodeURIComponent(tutorialId)}`);
      return { status: r.status, body: await r.json() };
    }, { device: DEVICE, tutorialId: firstId });
    check('GET with no cache returns ok', initialGet.status === 200);
    check('GET reports cached:false', initialGet.body.cached === false);

    // ── C. Seed coherence-cache.json + Layer 5 renders the score ────────
    console.log('\n── C. Seeded cache renders score badge ──');
    const tutorialsMtime = fs.statSync(tutorialsPath).mtime.getTime();
    const seedCache = {
      [firstId]: {
        tutorialId: firstId,
        tutorialsMtime,
        cachedAt: Date.now(),
        result: {
          tutorialId: firstId,
          coherenceScore: 4,
          verdict: 'pass',
          citations: ['p.12', 'p.15'],
          findings: [
            {
              severity: 'warn',
              stepIndex: 0,
              message: 'Minor wording issue on step 1 — PR-K test seed.',
              suggestedFix: [
                { op: 'replace', path: '/steps/0/instruction', value: 'Updated by PR-K test' },
              ],
            },
          ],
          summary: 'PR-K test-seeded coherence result.',
          confidence: 'high',
        },
      },
    };
    fs.writeFileSync(cachePath, JSON.stringify(seedCache, null, 2));

    await openCanvas(page);
    await page.locator('[data-testid="layer5-toggle"]').click();
    await page.waitForTimeout(800); // give the pre-fetch loop a tick
    const rowText = await page.locator(`[data-testid="layer5-row-${firstId}"]`).textContent();
    check('score badge shows 4/5', rowText?.includes('4/5') ?? false, rowText?.slice(0, 100));
    check('verdict shows pass', rowText?.includes('pass') ?? false);

    // Expand the row to see findings
    await page.locator(`[data-testid="layer5-row-${firstId}"] button`).first().click();
    await page.waitForTimeout(300);
    const fixBtnSelector = `[data-testid="layer5-fix-${firstId}-0-0"]`;
    check('Layer 5 finding Fix button rendered', await page.locator(fixBtnSelector).count() > 0);

    // ── D. qa-fix-apply dispatches layer5 patches ────────────────────────
    console.log('\n── D. qa-fix-apply dispatches layer5 → applyTutorialFixPatch ──');

    // D1: /steps/<idx>/instruction (nested scalar via tutorial-level dispatch)
    try {
      const patch1 = {
        result: {
          tutorialId: firstId,
          stepIndex: 0,
          findingType: 'layer5',
          patch: [
            { op: 'replace', path: '/steps/0/instruction', value: 'PR-K-DISPATCH-TEST' },
          ],
          explanation: 'PR-K dispatch test',
          confidence: 'high', citation: 'test', alternatives: [],
        },
      };
      const res = await page.evaluate(async ({ device, body }) => {
        const r = await fetch(`/api/pipeline/${device}/qa-fix-apply`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return { status: r.status, body: await r.json() };
      }, { device: DEVICE, body: patch1 });
      check('D1: nested scalar via tutorial dispatch returns 200', res.status === 200 && res.body.ok === true,
        `status=${res.status}`);
      const updated = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8'));
      check('D1: tutorials.json got patched', updated[0].steps[0].instruction === 'PR-K-DISPATCH-TEST');
    } finally {
      fs.writeFileSync(tutorialsPath, originalTutorials);
    }

    // D2: /steps/<idx> remove (whole step deletion)
    try {
      const patch2 = {
        result: {
          tutorialId: firstId,
          stepIndex: 0,
          findingType: 'layer5',
          patch: [{ op: 'remove', path: '/steps/0' }],
          explanation: 'PR-K remove test',
          confidence: 'high', citation: 'test', alternatives: [],
        },
      };
      const res = await page.evaluate(async ({ device, body }) => {
        const r = await fetch(`/api/pipeline/${device}/qa-fix-apply`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return { status: r.status, body: await r.json() };
      }, { device: DEVICE, body: patch2 });
      check('D2: /steps/<idx> remove returns 200', res.status === 200 && res.body.ok === true,
        `status=${res.status}`);
      const updated = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8'));
      check('D2: step was removed', updated[0].steps.length === tArr[0].steps.length - 1);
    } finally {
      fs.writeFileSync(tutorialsPath, originalTutorials);
    }

    // D3: /steps/- append (whole step insert)
    try {
      const patch3 = {
        result: {
          tutorialId: firstId,
          stepIndex: 0,
          findingType: 'layer5',
          patch: [{
            op: 'add', path: '/steps/-',
            value: {
              id: 'pr-k-appended', title: 'Appended', instruction: 'New tail step',
              highlightControls: [], panelStateChanges: {},
            },
          }],
          explanation: 'PR-K append test',
          confidence: 'high', citation: 'test', alternatives: [],
        },
      };
      const res = await page.evaluate(async ({ device, body }) => {
        const r = await fetch(`/api/pipeline/${device}/qa-fix-apply`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return { status: r.status, body: await r.json() };
      }, { device: DEVICE, body: patch3 });
      check('D3: /steps/- append returns 200', res.status === 200 && res.body.ok === true,
        `status=${res.status}`);
      const updated = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8'));
      const lastStep = updated[0].steps[updated[0].steps.length - 1];
      check('D3: step appended', lastStep.id === 'pr-k-appended');
    } finally {
      fs.writeFileSync(tutorialsPath, originalTutorials);
    }

    // D4: invalid path → rollback
    try {
      const patchBad = {
        result: {
          tutorialId: firstId,
          stepIndex: 0,
          findingType: 'layer5',
          patch: [{ op: 'replace', path: '/title', value: 'X' }], // non-/steps path
          explanation: 'PR-K bad path test',
          confidence: 'high', citation: 'test', alternatives: [],
        },
      };
      const res = await page.evaluate(async ({ device, body }) => {
        const r = await fetch(`/api/pipeline/${device}/qa-fix-apply`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return { status: r.status, body: await r.json() };
      }, { device: DEVICE, body: patchBad });
      check('D4: invalid layer5 path returns 500', res.status === 500, `status=${res.status}`);
      check('D4: rolledBack=true', res.body.rolledBack === true);
      const fileAfter = fs.readFileSync(tutorialsPath, 'utf-8');
      check('D4: tutorials.json unchanged after rollback', fileAfter === originalTutorials);
    } finally {
      fs.writeFileSync(tutorialsPath, originalTutorials);
    }

    // ── E. Cumulative-state still gates layer5 (PR-L integration) ────────
    console.log('\n── E. PR-L cumulative-state still gates layer5 patches ──');
    try {
      const badStep = {
        op: 'add', path: '/steps/0',
        value: {
          id: 'pr-k-ghost', title: 'Ghost', instruction: 'Test',
          // This will fail cumulative-state: ghost control in highlightControls
          highlightControls: ['__PR_K_GHOST_CTRL__'],
          panelStateChanges: {},
        },
      };
      const patchE1 = {
        result: {
          tutorialId: firstId,
          stepIndex: 0,
          findingType: 'layer5',
          patch: [badStep],
          explanation: 'PR-K cumulative-state guard test',
          confidence: 'high', citation: 'test', alternatives: [],
        },
      };
      const res = await page.evaluate(async ({ device, body }) => {
        const r = await fetch(`/api/pipeline/${device}/qa-fix-apply`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return { status: r.status, body: await r.json() };
      }, { device: DEVICE, body: patchE1 });
      check('E1: cumulative-state violation → 409', res.status === 409, `status=${res.status}`);
      check('E1: violations array includes ghost control',
        Array.isArray(res.body.violations) && JSON.stringify(res.body.violations).includes('__PR_K_GHOST_CTRL__'));
      check('E1: rolledBack=true', res.body.rolledBack === true);
    } finally {
      fs.writeFileSync(tutorialsPath, originalTutorials);
    }

  } finally {
    // Restore cache to original state
    if (originalCache !== null) {
      fs.writeFileSync(cachePath, originalCache);
    } else if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
    fs.writeFileSync(tutorialsPath, originalTutorials);
    await ctx.close();
    await browser.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
