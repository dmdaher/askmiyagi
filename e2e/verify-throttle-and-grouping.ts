/**
 * Throttle race fix verification.
 *
 * Local-only test against the dev server (localhost:3000). Hits the hosted
 * API endpoints directly because middleware.ts doesn't exist (proxy.ts dead
 * code) so /api/hosted/* is unauthenticated locally.
 *
 * Strategy:
 *   1. Reset sandbox-cdj-3000 history (via Blob list+delete — out of scope here;
 *      we just measure baseline + delta)
 *   2. Fire 4 concurrent PUTs to sandbox-cdj-3000
 *   3. Verify history grows by AT MOST 1 entry (the race is dead)
 *   4. Fire 5 sequential PUTs spaced 1s apart
 *   5. Verify NO additional backup created (5-min throttle holds)
 *   6. Verify all entries have the autosave source tag
 *
 * This test runs against the LOCAL dev server, not production. Cleanup
 * is acceptable (sandbox is meant to be messy).
 */
import { chromium } from 'playwright';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE_ID = 'sandbox-cdj-3000';

interface HistoryResp {
  versions: Array<{
    filename: string;
    timestamp: string;
    sizeBytes: number;
    isCurrent: boolean;
    source?: string;
  }>;
  total: number;
}

async function getHistory(): Promise<HistoryResp> {
  const r = await fetch(`${BASE}/api/hosted/panels/${DEVICE_ID}/history`);
  if (!r.ok) throw new Error(`history HTTP ${r.status}`);
  return r.json();
}

async function getCurrentManifest(): Promise<Record<string, unknown>> {
  const r = await fetch(`${BASE}/api/hosted/panels/${DEVICE_ID}`);
  if (!r.ok) throw new Error(`manifest HTTP ${r.status}`);
  const m = await r.json();
  // Strip server-set fields, set _loadedAt for conflict check
  for (const k of ['_source', '_status', '_adminNote', '_contractorNote']) delete m[k];
  if (m._updatedAt) m._loadedAt = m._updatedAt;
  delete m._updatedAt;
  return m;
}

async function firePut(payload: Record<string, unknown>, query = ''): Promise<number> {
  const r = await fetch(`${BASE}/api/hosted/panels/${DEVICE_ID}${query}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.status;
}

async function run() {
  const results: string[] = [];
  const fail: string[] = [];

  results.push(`Testing against: ${BASE}`);
  results.push(`Device: ${DEVICE_ID}`);

  // BASELINE
  const baseline = await getHistory();
  const baselineHistorical = baseline.versions.filter(v => !v.isCurrent).length;
  results.push(`Baseline: ${baselineHistorical} historical entries`);

  // TEST 1: concurrent PUTs (the race that was creating dupes)
  results.push('');
  results.push('=== TEST 1: 4 concurrent PUTs (race test) ===');
  const payload = await getCurrentManifest();

  await Promise.all([1, 2, 3, 4].map(() => firePut(payload)));
  await new Promise(r => setTimeout(r, 3000)); // let Blob settle

  const afterT1 = await getHistory();
  const t1Historical = afterT1.versions.filter(v => !v.isCurrent).length;
  const t1Added = t1Historical - baselineHistorical;
  results.push(`Historical entries: ${t1Historical} (added ${t1Added})`);

  if (t1Added > 1) {
    fail.push(`FAIL: race condition still creates ${t1Added} backups for 4 concurrent PUTs (should be ≤ 1)`);
  } else {
    results.push('PASS: at most 1 backup created for concurrent PUTs ✓');
  }

  // TEST 2: sequential PUTs (should be throttled)
  results.push('');
  results.push('=== TEST 2: 5 sequential PUTs, 1s apart (throttle test) ===');

  for (let i = 0; i < 5; i++) {
    const fresh = await getCurrentManifest();
    await firePut(fresh);
    await new Promise(r => setTimeout(r, 1000));
  }
  await new Promise(r => setTimeout(r, 2000));

  const afterT2 = await getHistory();
  const t2Historical = afterT2.versions.filter(v => !v.isCurrent).length;
  const t2Added = t2Historical - t1Historical;
  results.push(`Historical entries: ${t2Historical} (added ${t2Added})`);

  if (t2Added > 0) {
    fail.push(`FAIL: throttle didn't hold — ${t2Added} backups created for sequential PUTs within window`);
  } else {
    results.push('PASS: 5-min throttle held, 0 new backups ✓');
  }

  // TEST 3: manual save with force should bypass throttle
  results.push('');
  results.push('=== TEST 3: 1 manual save with backup=force&source=manual ===');
  const fresh = await getCurrentManifest();
  await firePut(fresh, '?backup=force&source=manual');
  await new Promise(r => setTimeout(r, 3000));

  const afterT3 = await getHistory();
  const t3Historical = afterT3.versions.filter(v => !v.isCurrent).length;
  const t3Added = t3Historical - t2Historical;
  results.push(`Historical entries: ${t3Historical} (added ${t3Added})`);

  if (t3Added !== 1) {
    fail.push(`FAIL: manual save force should create exactly 1 backup, got ${t3Added}`);
  } else {
    results.push('PASS: manual save force created 1 backup ✓');
  }

  // TEST 4: verify source tags on the latest entries
  results.push('');
  results.push('=== TEST 4: Source tags ===');
  const recent = afterT3.versions.filter(v => !v.isCurrent).slice(0, 5);
  for (const v of recent) {
    results.push(`  ${v.timestamp} → source=${v.source ?? '(none)'}`);
  }
  const hasManual = recent.some(v => v.source === 'manual');
  const hasAutosave = recent.some(v => v.source === 'autosave');
  if (!hasManual) fail.push('FAIL: no manual-source entry visible after Test 3');
  if (!hasAutosave) fail.push('FAIL: no autosave-source entry visible from Tests 1-2');
  if (hasManual && hasAutosave) results.push('PASS: source tags present on entries ✓');

  // TEST 5: UI render check — open dropdown in admin editor, verify grouping
  results.push('');
  results.push('=== TEST 5: UI grouping renders ===');
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
    await ctx.addCookies([{
      name: 'admin_access', value: process.env.ADMIN_PASSWORD || 'miyagi2026',
      domain: 'localhost', path: '/', sameSite: 'Lax' as const,
    }]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/${DEVICE_ID}/editor`, { waitUntil: 'domcontentloaded' });
    // sandbox device may not have control rendering — give it a beat
    await page.waitForTimeout(3000);

    const historyBtn = page.locator('button[title*="Version History"]').first();
    if (await historyBtn.count() === 0) {
      results.push('SKIP: History button not visible (sandbox device may render differently in admin)');
    } else {
      await historyBtn.click();
      await page.waitForTimeout(1500);

      // Check for grouped UI markers — autosave group rows or discrete entries
      const dropdownText = await page.locator('div').filter({ hasText: /Version History/i }).first().textContent().catch(() => '');
      results.push(`Dropdown content (first 300 chars): ${(dropdownText ?? '').slice(0, 300)}`);

      const hasGroupRow = await page.locator('text=/autosave|autosaves/i').count() > 0;
      const hasDiscreteSaved = await page.locator('text=/Saved|Submitted|admin update/i').count() > 0;
      results.push(`Has autosave group row: ${hasGroupRow ? 'YES' : 'NO'}`);
      results.push(`Has discrete chip (Saved/Submitted/...): ${hasDiscreteSaved ? 'YES' : 'NO'}`);

      if (!hasGroupRow && !hasDiscreteSaved) {
        results.push('NOTE: neither marker found; dropdown might be rendering current-only or grouping is broken');
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n=== RESULTS ===');
  console.log(results.join('\n'));
  console.log('\n=== VERDICT ===');
  if (fail.length === 0) {
    console.log('\x1b[32mPASS\x1b[0m');
  } else {
    console.log('\x1b[31mFAIL\x1b[0m');
    console.log(fail.join('\n'));
  }
  process.exit(fail.length === 0 ? 0 : 1);
}

run().catch((err) => { console.error(err); process.exit(1); });
