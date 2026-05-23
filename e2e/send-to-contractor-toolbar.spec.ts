/**
 * Real-UI smoke for the always-visible Send-to-Contractor toolbar button.
 *
 * Validates:
 *   [1] Button rendered alongside the tab row on every pipeline detail page
 *   [2] Disabled (not hidden) when pipeline is BEFORE layout-engine
 *   [3] Enabled when pipeline is AT or PAST layout-engine
 *   [4] Click opens the "Send to Contractor" modal
 *
 * Uses Playwright route interception so we don't depend on pipeline state
 * on disk for the test device.
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
const DEVICE_ID = 'send-toolbar-test';

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

function fakePipelineState(currentPhase: string) {
  return {
    deviceId: DEVICE_ID,
    deviceName: 'Send Toolbar Test',
    manufacturer: 'Test',
    manualPaths: [],
    currentPhase,
    status: 'running',
    branch: 'feature/test',
    createdAt: '2026-05-18T00:00:00Z',
    updatedAt: '2026-05-18T00:00:00Z',
    phases: [],
    sections: [],
    tutorialBatches: [],
    escalations: [],
    activeEscalation: null,
    totalCostUsd: 0,
    totalActualCostUsd: 0,
    totalTokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
    budgetCapUsd: 1000,
    subscription: null,
    burnRate: null,
    runnerPid: null,
    childPid: null,
    worktreePath: null,
    extractionProgress: null,
    strikeTracker: {},
    lastCheckpoint: { phase: currentPhase, subStep: 'start' },
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();

  // Mock the pipeline state API. Toggle currentPhase between tests by
  // re-routing with new payloads.
  let phaseToReturn = 'phase-preflight';
  await page.route('**/api/pipeline/send-toolbar-test*', (route) => {
    const url = route.request().url();
    if (url.includes('/escalation') || url.includes('/recover') || url.includes('/send-to-hosted')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakePipelineState(phaseToReturn)),
    });
  });
  // Mock SSE endpoint
  await page.route('**/api/pipeline/send-toolbar-test/logs**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }),
  );

  // [1] BEFORE layout-engine — button should render and be disabled
  phaseToReturn = 'phase-preflight';
  await page.goto(`${BASE}/admin/${DEVICE_ID}?nosave=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="send-to-contractor-toolbar"]', { timeout: 8000 });

  const btn = page.locator('[data-testid="send-to-contractor-toolbar"]');
  const visible = await btn.isVisible();
  const disabledEarly = await btn.isDisabled();
  check('toolbar button renders before editor-ready', visible, `visible=${visible}`);
  check('toolbar button disabled before editor-ready', disabledEarly, `disabled=${disabledEarly}`);

  // [2] AT layout-engine — should be enabled
  phaseToReturn = 'phase-0-layout-engine';
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="send-to-contractor-toolbar"]', { timeout: 8000 });
  // Brief wait for store to refresh
  await page.waitForTimeout(500);
  const disabledAtLE = await page.locator('[data-testid="send-to-contractor-toolbar"]').isDisabled();
  check('toolbar button enabled at layout-engine', !disabledAtLE, `disabled=${disabledAtLE}`);

  // [3] PAST layout-engine (tutorial-build) — still enabled
  phaseToReturn = 'phase-5-tutorial-build';
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="send-to-contractor-toolbar"]', { timeout: 8000 });
  await page.waitForTimeout(500);
  const disabledLate = await page.locator('[data-testid="send-to-contractor-toolbar"]').isDisabled();
  check('toolbar button enabled past layout-engine', !disabledLate, `disabled=${disabledLate}`);

  // [4] Click opens the modal
  await page.locator('[data-testid="send-to-contractor-toolbar"]').click();
  await page.waitForTimeout(300);
  const modalVisible = await page.locator('h3:has-text("Send to Contractor")').isVisible();
  check('clicking toolbar button opens modal', modalVisible, `modal=${modalVisible}`);

  await browser.close();
}

run().then(() => {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}).catch((err) => {
  console.error(err);
  process.exit(2);
});
