/**
 * Verification: section-level OOB badge.
 *
 * When ANY child control of a section is out-of-bounds (negative coords or
 * extends past canvas), the section header in Layers panel should show a
 * red badge — so contractors don't need to expand each section to find
 * stale-position controls.
 *
 * Run: npx tsx e2e/verify-section-oob-badge.ts
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const EDITOR_URL = `${BASE_URL}/admin/deepmind-12/editor`;

let exitCode = 0;
function pass(msg: string) { console.log(`\x1b[32m✓\x1b[0m ${msg}`); }
function fail(msg: string) { console.error(`\x1b[31m✗\x1b[0m ${msg}`); exitCode = 1; }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([
    { name: 'admin_access', value: ADMIN_PASSWORD, domain: 'localhost', path: '/' },
  ]);
  const page = await context.newPage();

  console.log(`Loading ${EDITOR_URL}…`);
  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const sectionListVisible = await page.locator('[data-testid="layers-section-list"]').count();
  if (sectionListVisible === 0) {
    await page.keyboard.press('l');
    await page.waitForTimeout(500);
  }

  // Capture baseline section badge count (deepmind-12 may already have
  // pre-existing OOB controls — we verify the feature *reacts* to changes).
  const sectionBadges = page.locator('[data-testid="layers-section-list"] [aria-label="Section contains out-of-bounds control"]');
  const baselineBadgeCount = await sectionBadges.count();
  console.log(`  (baseline: ${baselineBadgeCount} section(s) already have OOB children)`);

  // Move a control out of bounds (don't select — keeps section collapsed).
  // Pick a control that is currently IN-bounds so the badge count must increase.
  const movedControl: string | null = await page.evaluate(`(() => {
    const store = window.useEditorStore;
    if (!store) return null;
    const state = store.getState();
    const cw = state.canvasWidth;
    const ch = state.canvasHeight;
    for (const sectionId in state.sections) {
      const section = state.sections[sectionId];
      const childIds = section.childIds || [];
      if (childIds.length === 0) continue;
      let allIn = true;
      for (let i = 0; i < childIds.length; i++) {
        const c = state.controls[childIds[i]];
        if (!c) { allIn = false; break; }
        if (c.x < 0 || c.y < 0 || c.x + c.w > cw || c.y + c.h > ch) { allIn = false; break; }
      }
      if (allIn) {
        const controlId = childIds[0];
        store.setState(function(s) {
          const cur = s.controls;
          const updated = Object.assign({}, cur);
          updated[controlId] = Object.assign({}, cur[controlId], { x: 9999, y: 9999 });
          return { controls: updated };
        });
        return controlId;
      }
    }
    return null;
  })()`);
  if (!movedControl) {
    fail('could not find an all-in-bounds section to test against');
    await browser.close();
    process.exit(exitCode);
  }
  pass(`moved ${movedControl} to (9999, 9999) — section now contains OOB child`);
  await page.waitForTimeout(500);

  const afterMoveBadgeCount = await sectionBadges.count();
  if (afterMoveBadgeCount === baselineBadgeCount + 1) {
    pass(`section badge count went ${baselineBadgeCount} → ${afterMoveBadgeCount} (feature reactive)`);
  } else {
    fail(`expected ${baselineBadgeCount + 1} badges, got ${afterMoveBadgeCount}`);
  }

  // Move it back; badge count should return to baseline
  await page.evaluate((controlId: string) => {
    type W = Window & { useEditorStore?: { setState: (fn: (s: unknown) => unknown) => void } };
    const store = (window as unknown as W).useEditorStore!;
    store.setState((s) => {
      const cur = (s as { controls: Record<string, { x: number; y: number }> }).controls;
      return { controls: { ...cur, [controlId]: { ...cur[controlId], x: 100, y: 100 } } };
    });
  }, movedControl);
  await page.waitForTimeout(500);

  const afterRestoreBadges = await sectionBadges.count();
  if (afterRestoreBadges === baselineBadgeCount) {
    pass(`section badge count back to baseline ${baselineBadgeCount} after restore`);
  } else {
    fail(`expected ${baselineBadgeCount} badges after restore, got ${afterRestoreBadges}`);
  }

  await browser.close();
  if (exitCode === 0) console.log('\n\x1b[32mSection-level OOB badge verified.\x1b[0m');
  else console.error('\n\x1b[31mSection-level OOB badge FAILED.\x1b[0m');
  process.exit(exitCode);
}

run().catch((err: unknown) => { console.error(err); process.exit(1); });
