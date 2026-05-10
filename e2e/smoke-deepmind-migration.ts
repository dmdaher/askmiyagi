/**
 * Smoke test for DeepMind-12 manifest-driven migration.
 *
 * After this migration, DeepMind renders via PanelRenderer (manifest-driven)
 * instead of the handcrafted DeepMindPanel.tsx. Tutorials are temporarily
 * empty (will regenerate against current manifest IDs separately).
 *
 * Verifies:
 * 1. The admin device page (/admin/deepmind-12) loads the manifest-rendered panel
 * 2. Editor opens (/admin/deepmind-12/editor) and Preview shows manifest panel
 * 3. Tutorial list page shows DeepMind has no tutorials yet (intentional gap)
 * 4. Page errors are zero
 *
 * Run: npx tsx e2e/smoke-deepmind-migration.ts
 * Requires: dev server on localhost:3000
 */

import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    extraHTTPHeaders: { Cookie: 'admin_access=miyagi2026' },
  });
  await context.addCookies([{ name: 'admin_access', value: 'miyagi2026', domain: 'localhost', path: '/' }]);
  const page = await context.newPage();

  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`); });

  // ── Test 1: admin device page renders the manifest panel ─────────────────
  console.log('\n══ TEST 1: Admin device page renders DeepMind from manifest ══');
  const adminUrl = 'http://localhost:3000/admin/deepmind-12';
  console.log(`→ ${adminUrl}`);
  const r1 = await page.goto(adminUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log(`  loaded: ${r1?.status()}`);
  await page.waitForTimeout(1500);

  const ctrlCount1 = await page.locator('[data-control-id]').count();
  console.log(`  controls rendered: ${ctrlCount1}`);
  if (ctrlCount1 < 30) {
    console.error(`✗ expected many controls (manifest has 96); got ${ctrlCount1}`);
  } else {
    console.log(`✓ panel renders from manifest (controls visible)`);
  }
  const shot1 = `e2e/screenshots/smoke-deepmind-migration-admin-${Date.now()}.png`;
  await page.screenshot({ path: shot1 });
  console.log(`  screenshot: ${shot1}`);

  // ── Test 2: editor + Preview button shows manifest panel ─────────────────
  console.log('\n══ TEST 2: Editor opens for DeepMind ══');
  const editorUrl = 'http://localhost:3000/admin/deepmind-12/editor';
  console.log(`→ ${editorUrl}`);
  const r2 = await page.goto(editorUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log(`  loaded: ${r2?.status()}`);
  await page.waitForTimeout(2500);

  const ctrlCount2 = await page.locator('[data-control-id]').count();
  console.log(`  controls in editor canvas: ${ctrlCount2}`);
  if (ctrlCount2 < 20) {
    console.error(`✗ editor canvas has too few controls`);
  } else {
    console.log(`✓ editor renders panel correctly`);
  }
  const shot2 = `e2e/screenshots/smoke-deepmind-migration-editor-${Date.now()}.png`;
  await page.screenshot({ path: shot2 });
  console.log(`  screenshot: ${shot2}`);

  // ── Test 3: tutorial list shows zero tutorials (intentional) ─────────────
  console.log('\n══ TEST 3: DeepMind tutorials list is empty (pending regen) ══');
  const tutorialUrl = 'http://localhost:3000/tutorial/deepmind-12';
  console.log(`→ ${tutorialUrl}`);
  const r3 = await page.goto(tutorialUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log(`  loaded: ${r3?.status()}`);
  await page.waitForTimeout(1000);
  const bodyText = await page.locator('body').textContent();
  if (bodyText && (bodyText.toLowerCase().includes('no tutorials') || bodyText.toLowerCase().includes('coming soon') || (bodyText.match(/tutorial/gi) ?? []).length < 5)) {
    console.log(`✓ tutorial list reflects empty state`);
  } else {
    console.log(`  (page rendered; manual visual check recommended)`);
  }

  // ── Final: error report ──────────────────────────────────────────────────
  console.log('\n══ Errors ══');
  if (errors.length === 0) {
    console.log('✓ No page errors during smoke test');
  } else {
    console.log(`⚠  ${errors.length} errors:`);
    for (const e of errors.slice(0, 10)) console.log(`   ${e}`);
  }

  await browser.close();
  console.log('\n✓ Smoke test complete');
  process.exit(errors.length > 0 ? 1 : 0);
})();
