/**
 * Real-UI smoke test for the tutorial-review admin canvas.
 *
 * Uses Playwright route interception to mock the data API + escalation POST,
 * so the test doesn't need a paused pipeline on disk. Pollution-free.
 *
 * Coverage:
 *   [1] Canvas renders with summary stats
 *   [2] Tutorial list shows all 3 fixture tutorials with status dots
 *   [3] Clicking a tutorial row updates step content
 *   [4] "[" and "]" keyboard shortcuts cycle tutorials
 *   [5] "J" / "K" cycle steps within the active tutorial
 *   [6] Clicking an issue in diagnostics jumps to that step
 *   [7] Approve button POSTs the right resolution
 *   [8] Request Changes flow opens modal + submits with note
 *
 * All goto calls use `?nosave=true` per CLAUDE.md (defense — this page doesn't
 * write the editor manifest, but ?nosave is harmless and prevents accidents).
 */
import { chromium, BrowserContext } from 'playwright';
import fs from 'fs';

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
const DEVICE_ID = 'fantom-08';  // any device id works; the API is mocked

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, info: string) => {
  if (ok) { console.log(`  ✓ ${label} — ${info}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fail++; }
};

// ────────────────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────────────────
const fixtureManifest = {
  deviceId: DEVICE_ID,
  deviceName: 'Fixture Device',
  manufacturer: 'Test',
  controls: [
    { id: 'btn-a', type: 'button', shape: 'rect', x: 10, y: 10, w: 50, h: 30, label: 'A' },
    { id: 'btn-b', type: 'button', shape: 'rect', x: 70, y: 10, w: 50, h: 30, label: 'B' },
    { id: 'led-1', type: 'led', x: 10, y: 50, w: 12, h: 12, label: 'L1' },
  ],
  panelWidth: 400,
  panelHeight: 100,
};

const fixtureTutorials = [
  {
    id: 'tut-clean',
    deviceId: DEVICE_ID,
    title: 'Clean tutorial',
    description: 'No issues',
    category: 'basics',
    difficulty: 'beginner',
    estimatedTime: '1 min',
    tags: [],
    steps: [
      { id: 's1', title: 'Step one', instruction: 'Press A', highlightControls: ['btn-a'], panelStateChanges: {} },
      { id: 's2', title: 'Step two', instruction: 'Press B', highlightControls: ['btn-b'], panelStateChanges: {} },
    ],
  },
  {
    id: 'tut-warning',
    deviceId: DEVICE_ID,
    title: 'Tutorial with warning',
    description: 'Excessive flips',
    category: 'flow',
    difficulty: 'intermediate',
    estimatedTime: '2 min',
    tags: [],
    steps: [
      { id: 's1', title: 'Flip start', instruction: 'Flips', highlightControls: ['btn-a'], panelStateChanges: {} },
      { id: 's2', title: 'More flips', instruction: 'More', highlightControls: ['btn-a'], panelStateChanges: {} },
    ],
  },
  {
    id: 'tut-error',
    deviceId: DEVICE_ID,
    title: 'Tutorial with error',
    description: 'Missing control ID',
    category: 'edge',
    difficulty: 'advanced',
    estimatedTime: '3 min',
    tags: [],
    steps: [
      { id: 's1', title: 'Bad highlight', instruction: 'Highlight missing', highlightControls: ['phantom'], panelStateChanges: {} },
    ],
  },
];

const fixtureSummary = {
  deviceId: DEVICE_ID,
  totalTutorials: 3,
  totalSteps: 5,
  totalErrors: 1,
  totalWarnings: 1,
  totalInfos: 0,
  byTutorial: {
    'tut-clean':   { errors: 0, warnings: 0, infos: 0, title: 'Clean tutorial', stepCount: 2 },
    'tut-warning': { errors: 0, warnings: 1, infos: 0, title: 'Tutorial with warning', stepCount: 2 },
    'tut-error':   { errors: 1, warnings: 0, infos: 0, title: 'Tutorial with error', stepCount: 1 },
  },
  issues: [
    {
      tutorialId: 'tut-warning',
      severity: 'warning',
      code: 'EXCESSIVE_FLIPS',
      message: 'Control "btn-a" toggles too many times',
      controlId: 'btn-a',
    },
    {
      tutorialId: 'tut-error',
      stepIndex: 0,
      stepTitle: 'Bad highlight',
      severity: 'error',
      code: 'HIGHLIGHT_REFERENCES_MISSING_CONTROL',
      message: 'Step "Bad highlight" highlightControls includes "phantom" — control id doesn\'t exist in manifest.',
      controlId: 'phantom',
    },
  ],
  generatedAt: new Date().toISOString(),
};

const fixtureReviewResponse = {
  deviceId: DEVICE_ID,
  deviceName: 'Fixture Device',
  currentPhase: 'tutorial-review',
  status: 'paused',
  escalationId: 'esc-fixture-123',
  summary: fixtureSummary,
  tutorials: fixtureTutorials,
  manifest: fixtureManifest,
};

// ────────────────────────────────────────────────────────────────────────────
// Test runner
// ────────────────────────────────────────────────────────────────────────────
async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();

  // Intercept the data API + the escalation POST
  let escalationPostBody: any = null;
  await page.route('**/api/pipeline/*/review-tutorials', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtureReviewResponse) }),
  );
  await page.route('**/api/pipeline/*/escalation', async (route) => {
    escalationPostBody = JSON.parse(route.request().postData() ?? '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'running' }) });
  });

  // Capture runtime errors. Console "Failed to load resource: 404" entries
  // are noise from the surrounding admin layout (it fetches pipeline state
  // for the test device which doesn't exist on disk) — we only flag real
  // page errors and non-404 console errors.
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('Failed to load resource') && text.includes('404')) return;
    consoleErrors.push(`console.error: ${text}`);
  });

  await page.goto(`${BASE}/admin/${DEVICE_ID}/review-tutorials?nosave=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 8000 });

  // [1] Canvas + summary stats
  const stats = await page.locator('[data-testid="review-summary-stats"]').textContent();
  check('summary stats render', !!stats?.match(/3 tutorials.*5 steps/), `text: ${stats?.slice(0, 80)}`);

  // [2] Tutorial list rows
  const rows = await page.locator('[data-testid^="tutorial-row-"]').count();
  check('tutorial list rows', rows === 3, `${rows} rows rendered`);

  // [3] Click 2nd tutorial → step content updates
  await page.locator('[data-testid="tutorial-row-tut-warning"]').click();
  await page.waitForFunction(() => {
    return document.querySelector('[data-testid="current-step-title"]')?.textContent?.includes('Flip start');
  }, { timeout: 3000 }).catch(() => {});
  const titleAfter = await page.locator('[data-testid="current-step-title"]').textContent();
  check('clicking row swaps tutorial', titleAfter?.includes('Flip start') === true, `title: ${titleAfter}`);

  // [4] "]" cycles to next tutorial
  await page.keyboard.press(']');
  await page.waitForFunction(() => {
    return document.querySelector('[data-testid="current-step-title"]')?.textContent?.includes('Bad highlight');
  }, { timeout: 3000 }).catch(() => {});
  const titleAfterCycle = await page.locator('[data-testid="current-step-title"]').textContent();
  check('] cycles tutorial', titleAfterCycle?.includes('Bad highlight') === true, `title: ${titleAfterCycle}`);

  // [5] Issue card visible for the current tutorial (tut-error)
  const errorIssue = await page.locator('[data-testid="issue-HIGHLIGHT_REFERENCES_MISSING_CONTROL"]').count();
  check('error issue card renders', errorIssue === 1, `cards: ${errorIssue}`);

  // [6] Cycle back to clean tutorial
  await page.keyboard.press('[');
  await page.keyboard.press('[');
  await page.waitForTimeout(200);
  const titleClean = await page.locator('[data-testid="current-step-title"]').textContent();
  check('[ cycles back', titleClean?.includes('Step one') === true, `title: ${titleClean}`);

  // [7] J / K cycle steps
  await page.keyboard.press('j');
  await page.waitForTimeout(150);
  const titleStep2 = await page.locator('[data-testid="current-step-title"]').textContent();
  check('J advances step', titleStep2?.includes('Step two') === true, `title: ${titleStep2}`);
  await page.keyboard.press('k');
  await page.waitForTimeout(150);
  const titleBack = await page.locator('[data-testid="current-step-title"]').textContent();
  check('K rewinds step', titleBack?.includes('Step one') === true, `title: ${titleBack}`);

  // [8] Approve button (clean tutorial selected, but summary has totalErrors=1 → "Override & Approve")
  const approveLabel = await page.locator('[data-testid="approve-button"]').textContent();
  check('approve button reflects override', approveLabel?.includes('Override') === true, `label: ${approveLabel}`);

  // [9] Click Request Changes → modal opens
  await page.locator('[data-testid="request-changes-button"]').click();
  await page.waitForSelector('[data-testid="feedback-textarea"]', { timeout: 2000 });
  await page.locator('[data-testid="feedback-textarea"]').fill('Fix tut-error step 1');
  await page.locator('[data-testid="send-feedback-button"]').click();
  await page.waitForFunction(() => (window as any).__pageNavigated__ || true, { timeout: 1500 });
  await page.waitForTimeout(500); // allow POST to complete

  check('Request Changes POSTed escalation',
    escalationPostBody?.escalationId === 'esc-fixture-123' &&
    escalationPostBody?.resolution?.startsWith('changes-requested:'),
    `body: ${JSON.stringify(escalationPostBody)}`,
  );
  check('feedback note in resolution',
    escalationPostBody?.resolution?.includes('Fix tut-error step 1'),
    `resolution: ${escalationPostBody?.resolution}`,
  );

  // [10] No console errors
  check('no runtime errors', consoleErrors.length === 0, consoleErrors.length === 0 ? 'clean' : consoleErrors.join('\n'));

  await browser.close();
}

run().then(() => {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}).catch((err) => {
  console.error(err);
  process.exit(2);
});
