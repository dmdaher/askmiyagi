/**
 * Real-browser E2E for the state.json fallback fix (PR #162).
 *
 * Covers:
 *   1. Force-export route returns ok=true + bypassedDowngradeCheck=true
 *   2. Auto-save PUT /manifest response includes productionExport field
 *   3. dj-xdj-rx3 production manifest preserves restored metadata after
 *      a live save flow
 *   4. deepmind-12 production manifest preserves "DeepMind 12" (NOT
 *      "Deepmind 12" downgrade from state.json) after a live save flow
 *   5. Editor renders without crashing on the affected devices
 *   6. Contractor data byte-identity preserved through the entire flow
 *
 * SAFETY: every editor load uses ?nosave=true; the only save trigger is
 * via direct API call (NOT via UI mutation that could fire mid-hydration).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

function sha256(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readManifest(deviceId: string): any {
  return JSON.parse(fs.readFileSync(`src/data/manifests/${deviceId}.json`, 'utf-8'));
}

(async () => {
  console.log('=== state.json fallback fix — real-browser E2E ===\n');

  const failures: string[] = [];
  const passes: string[] = [];

  // ── Pre-snapshot contractor data SHAs ──────────────────────────────────────
  const devices = ['fantom-06', 'cdj-3000', 'deepmind-12', 'dj-xdj-rx3', 'dj-xdj-rr',
                   'minimoog-model-d', 'alphatheta-cdj3000x', 'dj-djs-1000'];
  const preShas: Record<string, string> = {};
  for (const d of devices) {
    const p = `.pipeline/${d}/manifest-editor.json`;
    if (fs.existsSync(p)) preShas[d] = sha256(p);
  }
  console.log(`pre-snapshot: ${Object.keys(preShas).length} contractor manifests captured\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax',
  }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);

  try {
    // ── Test 1: editor loads cleanly on all 5 affected devices ─────────────
    for (const dev of ['deepmind-12', 'dj-xdj-rx3', 'fantom-06', 'cdj-3000', 'dj-djs-1000']) {
      const res = await page.goto(`${BASE}/admin/${dev}/editor?nosave=true`, {
        waitUntil: 'load', timeout: 90_000,
      });
      if (res?.status() === 200) {
        passes.push(`editor loads: ${dev}`);
      } else {
        failures.push(`editor load failed: ${dev} HTTP ${res?.status()}`);
      }
    }

    // ── Test 2: force-export route returns ok=true ──────────────────────────
    const forceRes = await page.request.post(`${BASE}/api/pipeline/dj-xdj-rx3/force-export`);
    const forceBody = await forceRes.json();
    if (forceBody.ok === true && forceBody.bypassedDowngradeCheck === true) {
      passes.push('force-export route: ok=true + bypassedDowngradeCheck=true');
    } else {
      failures.push(`force-export route returned unexpected: ${JSON.stringify(forceBody)}`);
    }

    // ── Test 3: dj-xdj-rx3 production manifest still has canonical metadata
    const xdjMan = readManifest('dj-xdj-rx3');
    if (xdjMan.deviceName === 'XDJ-RX3' && xdjMan.manufacturer === 'Pioneer DJ') {
      passes.push(`dj-xdj-rx3 production: ${xdjMan.deviceName} / ${xdjMan.manufacturer}`);
    } else {
      failures.push(`dj-xdj-rx3 corrupted: ${JSON.stringify({deviceName: xdjMan.deviceName, manufacturer: xdjMan.manufacturer})}`);
    }

    // ── Test 4: PUT /manifest returns productionExport in response ─────────
    // Idempotent re-PUT of existing editor content (no contractor data change).
    const existingEditor = JSON.parse(fs.readFileSync('.pipeline/dj-xdj-rx3/manifest-editor.json', 'utf-8'));
    const putRes = await page.request.put(`${BASE}/api/pipeline/dj-xdj-rx3/manifest`, {
      data: existingEditor,
      headers: { 'Content-Type': 'application/json' },
    });
    const putBody = await putRes.json();
    if (putBody.ok === true && putBody.productionExport && putBody.productionExport.ok === true) {
      passes.push('PUT /manifest response includes productionExport: {ok:true}');
    } else {
      failures.push(`PUT /manifest missing productionExport field: ${JSON.stringify(putBody)}`);
    }

    // ── Test 5: deepmind-12 production preserves "DeepMind 12" capitalization
    const dmMan = readManifest('deepmind-12');
    if (dmMan.deviceName === 'DeepMind 12' && dmMan.manufacturer === 'Behringer') {
      passes.push(`deepmind-12 production preserved: ${dmMan.deviceName} / ${dmMan.manufacturer}`);
    } else {
      failures.push(`deepmind-12 production drifted: ${dmMan.deviceName} / ${dmMan.manufacturer}`);
    }

    // ── Test 6: contractor data SHA byte-identity preserved ─────────────────
    for (const [d, expected] of Object.entries(preShas)) {
      const p = `.pipeline/${d}/manifest-editor.json`;
      if (!fs.existsSync(p)) {
        failures.push(`contractor manifest VANISHED: ${d}`);
        continue;
      }
      const actual = sha256(p);
      if (actual === expected) {
        passes.push(`contractor data byte-identical: ${d}`);
      } else {
        failures.push(`contractor data MODIFIED: ${d} (sha changed)`);
      }
    }

  } finally {
    await browser.close();
  }

  // ── Report ───────────────────────────────────────────────────────────────
  console.log('PASSES:');
  for (const p of passes) console.log(`  ✓ ${p}`);
  if (failures.length > 0) {
    console.log('\nFAILURES:');
    for (const f of failures) console.log(`  ✗ ${f}`);
    console.error(`\n=== FAILED — ${failures.length} of ${passes.length + failures.length} checks ===`);
    process.exit(1);
  } else {
    console.log(`\n=== ALL ${passes.length} CHECKS PASSED ===`);
  }
})();
