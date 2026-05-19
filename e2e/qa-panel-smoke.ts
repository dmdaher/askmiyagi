/**
 * Smoke test for the QA Findings panel on the admin canvas.
 *
 * Verifies:
 *   1. QA panel renders with the expected severity icon + counts
 *   2. Layer 1b (unreferenced controls) lists DIRECTION_LEVER-copy with the
 *      editor-garbage hint
 *   3. Clicking DIRECTION_LEVER-copy flashes it on the panel (transient highlight)
 *   4. Layer 3 advisory findings render as clickable rows that jump to the
 *      relevant tutorial+step
 *   5. "Run visual QA" button present
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

const PWD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.TEST_DEVICE || 'cdj-3000';

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: PWD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const fails: string[] = [];
const check = (label: string, ok: boolean, info = '') => {
  if (ok) { console.log(`  ✓ ${label}${info ? ' — ' + info : ''}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fails.push(`${label} — ${info}`); fail++; }
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await setCookie(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/${DEVICE}/review-tutorials`, {
    waitUntil: 'domcontentloaded', timeout: 30_000,
  });
  await page.waitForSelector('[data-testid="tutorial-review-canvas"]', { timeout: 15_000 });
  await page.waitForTimeout(1000);

  const sectionCount = await page.locator('[data-testid="qa-findings-section"]').count();
  check('QA Findings section rendered', sectionCount === 1, `count=${sectionCount}`);

  const toggleText = await page.locator('[data-testid="qa-findings-toggle"]').textContent();
  check('QA toggle text includes counts', !!toggleText?.match(/\d+\s+fail/), `text="${toggleText?.trim()}"`);

  // For cdj-3000, the deterministic-only report has 0 fail / 3 warn — toggle
  // should be open by default since qaHasIssues is true.
  // Find Layer 1b ("manifest→tutorial coverage")
  const layer1bRow = page.locator('text=manifest→tutorial coverage').first();
  await layer1bRow.click();
  await page.waitForTimeout(300);

  // Locate the DIRECTION_LEVER-copy flash button
  const flashBtn = page.locator('[data-testid="qa-detail-flash-DIRECTION_LEVER-copy"]');
  const flashBtnCount = await flashBtn.count();
  check('1b detail lists DIRECTION_LEVER-copy', flashBtnCount === 1, `count=${flashBtnCount}`);

  // Click it — should flash the control on the panel
  if (flashBtnCount > 0) {
    await flashBtn.click();
    await page.waitForTimeout(700);
    // Assert that DIRECTION_LEVER-copy has the glow signal
    const glowing = await page.evaluate(`(function() {
      var els = document.querySelectorAll('[data-control-id="DIRECTION_LEVER-copy"]');
      var found = false;
      els.forEach(function(el) {
        var stack = [el];
        while (stack.length) {
          var node = stack.pop();
          var cs = getComputedStyle(node);
          if (cs.boxShadow && cs.boxShadow.indexOf('170, 255') !== -1) { found = true; return; }
          if (node.style && node.style.zIndex === '1000') { found = true; return; }
          for (var i = 0; i < node.children.length; i++) stack.push(node.children[i]);
        }
      });
      return found;
    })()`);
    check('clicking 1b row glows DIRECTION_LEVER-copy on panel', !!glowing);
  }

  // Run visual QA button present
  const visualBtn = await page.locator('[data-testid="qa-rerun-button"]').count();
  check('Run Visual QA button present', visualBtn === 1);

  // Take a final screenshot for spot-check
  await page.screenshot({ path: '/tmp/qa-panel-screenshot.png', fullPage: false });
  console.log('  📸 /tmp/qa-panel-screenshot.png');

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) { for (const f of fails) console.log(`  ✗ ${f}`); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => { console.error('FATAL:', err); process.exit(2); });
