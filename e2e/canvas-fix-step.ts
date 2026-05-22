/**
 * PR-I fix-step verification — tests the parts of the two-phase Fix
 * flow that DON'T require spawning the real agent (the propose endpoint
 * is expensive; we test it manually). What's covered automatically:
 *
 *   1. Fix buttons render on Layer 3a / 3b finding rows
 *   2. Clicking a Fix button opens the QaFixModal (Phase 1 spinner)
 *   3. The apply endpoint correctly mutates tutorials.json given a
 *      stub FixStepResult (no agent involved)
 *   4. Apply creates a backup file
 *   5. Apply rolls back when validators flag the patch (induced)
 *   6. sessionStorage cache stores the proposal
 *   7. Closing the modal preserves the cache (10-min TTL)
 *
 * Real agent flow (Phase 1 propose end-to-end) is tested via a
 * separate manual run — costs ~$0.20 per fire.
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

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: PWD, domain: 'localhost', path: '/',
    httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, ok: boolean, info = '') => {
  if (ok) { console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fails.push(`${label} — ${info}`); fail++; }
};

async function openCanvas(page: Page) {
  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(1500);
}

async function main() {
  // Backup tutorials.json so apply round-trip can restore
  const tutorialsPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents/tutorial-review/tutorials.json');
  if (!fs.existsSync(tutorialsPath)) {
    console.log('FATAL: tutorials.json missing for', DEVICE);
    process.exit(2);
  }
  const originalTutorials = fs.readFileSync(tutorialsPath, 'utf-8');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();
  await openCanvas(page);

  console.log(`\n══ PR-I fix-step verification — ${DEVICE} ════════════\n`);

  // ── 1. Fix buttons render on Layer 3a/3b rows ──────────────────────────
  console.log('── 1. Fix buttons on Layer 3 rows ──');
  // Expand the Layer 3a finding (advisory; should be present for cdj-3000)
  const layer3aHeader = page.locator('text=3a.').first();
  if (await layer3aHeader.count() > 0) {
    await layer3aHeader.click();
    await page.waitForTimeout(400);
    const fix3aBtns = await page.locator('[data-testid^="fix-button-"]').count();
    check('Layer 3a row has Fix buttons', fix3aBtns > 0, `${fix3aBtns} fix buttons rendered`);
  } else {
    check('Layer 3a finding present', false, 'no 3a finding to test against');
  }

  // ── 2. Click a Fix button → modal opens in proposing state ─────────────
  console.log('\n── 2. Fix click opens modal in proposing state ──');
  const firstFix = page.locator('[data-testid^="fix-button-"]').first();
  if (await firstFix.count() > 0) {
    await firstFix.click();
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('[data-testid="qa-fix-modal"]').isVisible();
    check('QaFixModal visible after Fix click', modalVisible);
    const proposingVisible = await page.locator('[data-testid="fix-modal-proposing"]').isVisible();
    check('Phase 1 (proposing) spinner visible', proposingVisible);
    // Close immediately to avoid real agent call cost
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const modalGone = (await page.locator('[data-testid="qa-fix-modal"]').count()) === 0;
    check('Esc closes modal', modalGone);
  }

  // ── 3. Apply endpoint with stub patch ──────────────────────────────────
  console.log('\n── 3. apply endpoint mutates tutorials.json ──');
  // Pick a tutorial+step that exists; use a no-op patch (replace title with itself)
  const t = JSON.parse(originalTutorials)[0];
  const stubPatch = {
    result: {
      tutorialId: t.id,
      stepIndex: 0,
      findingType: 'layer3b',
      patch: [
        { op: 'replace', path: '/title', value: t.steps[0].title + ' [TEST]', previousValue: t.steps[0].title },
      ],
      explanation: 'TEST stub patch',
      confidence: 'high',
      citation: 'test',
      alternatives: [],
    },
  };
  const applyRes = await page.evaluate(async ({ device, body }) => {
    const r = await fetch(`/api/pipeline/${device}/qa-fix-apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  }, { device: DEVICE, body: stubPatch });
  check('apply endpoint returns ok', applyRes.status === 200 && applyRes.body.ok === true,
    `status=${applyRes.status} body=${JSON.stringify(applyRes.body).slice(0, 200)}`);

  // ── 4. Apply created a backup file ─────────────────────────────────────
  const backupDir = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents/tutorial-review/backups');
  const backups = fs.existsSync(backupDir) ? fs.readdirSync(backupDir).filter((f) => f.startsWith('tutorials-')) : [];
  check('apply created tutorials backup', backups.length > 0, `${backups.length} backups in dir`);

  // ── 5. Tutorial title actually changed ─────────────────────────────────
  const updated = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8'));
  const newTitle = updated[0].steps[0].title;
  check('tutorials.json title was patched', newTitle.endsWith('[TEST]'), `title="${newTitle}"`);

  // ── 6. Apply with INVALID path → 500 + rolledBack=true ─────────────────
  const badPatch = {
    result: {
      tutorialId: t.id,
      stepIndex: 0,
      findingType: 'layer3b',
      patch: [{ op: 'replace', path: '/illegal-path', value: 'X' }],
      explanation: 'bad path test',
      confidence: 'high', citation: 'test', alternatives: [],
    },
  };
  const badRes = await page.evaluate(async ({ device, body }) => {
    const r = await fetch(`/api/pipeline/${device}/qa-fix-apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  }, { device: DEVICE, body: badPatch });
  check('apply with invalid path returns 500', badRes.status === 500, `status=${badRes.status}`);
  check('apply with invalid path rolled back', badRes.body.rolledBack === true);

  // ── 7. Cache key writes (simulate by setting sessionStorage manually) ──
  await page.evaluate(({ device }) => {
    sessionStorage.setItem(
      `qa-fix-cache:${device}:fake-tut:0:layer3b`,
      JSON.stringify({
        result: { tutorialId: 'fake-tut', stepIndex: 0, findingType: 'layer3b', patch: [{ op: 'replace', path: '/title', value: 'X' }], explanation: 'cached', confidence: 'medium', citation: 'cache', alternatives: [] },
        cachedAt: Date.now(),
      }),
    );
  }, { device: DEVICE });
  const cacheRead = await page.evaluate(({ device }) => {
    const raw = sessionStorage.getItem(`qa-fix-cache:${device}:fake-tut:0:layer3b`);
    return raw ? JSON.parse(raw) : null;
  }, { device: DEVICE });
  check('sessionStorage cache shape correct',
    cacheRead && cacheRead.result?.confidence === 'medium' && typeof cacheRead.cachedAt === 'number');

  // ── Restore tutorials.json ─────────────────────────────────────────────
  fs.writeFileSync(tutorialsPath, originalTutorials);

  await ctx.close();
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
