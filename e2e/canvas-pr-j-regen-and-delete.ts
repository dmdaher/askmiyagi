/**
 * PR-J verification — two surfaces:
 *
 *   A. .ts regeneration (the path that unblocks PR-I)
 *      - Inject a known-string title into tutorials.json
 *      - Call regenerateTutorialsFromCanvas() directly
 *      - Assert src/data/tutorials/<id>/<tid>.ts contains the string
 *      - Assert index.ts imports it
 *      - Restore tutorials.json
 *
 *   B. Orphan-delete endpoint
 *      - Add a throwaway control to manifest-editor.json
 *      - DELETE /api/pipeline/<id>/manifest-control/<controlId>
 *      - Assert control removed, backup file written
 *      - Restore manifest-editor.json
 *
 * Both surfaces are exercised without spawning real agents and without
 * relying on the pipeline-runner subprocess (the doTutorialPR change
 * is unit-tested via the underlying regenerator + integration-tested
 * here via the same regenerator directly).
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

async function main() {
  console.log(`\n══ PR-J verification — ${DEVICE} ════════════\n`);

  // ─────────────────────────────────────────────────────────────────────
  // A. Tutorial regeneration round-trip (unit + filesystem)
  // ─────────────────────────────────────────────────────────────────────
  console.log('── A. .ts regeneration from canvas state ──');

  const tutorialsJsonPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'agents/tutorial-review/tutorials.json');
  if (!fs.existsSync(tutorialsJsonPath)) {
    check('tutorials.json present', false, `missing at ${tutorialsJsonPath}`);
    process.exit(2);
  }
  const originalTutorials = fs.readFileSync(tutorialsJsonPath, 'utf-8');

  // Inject a recognizable marker into the FIRST tutorial's title
  const marker = `[PR-J-MARK-${Date.now()}]`;
  const tutorials = JSON.parse(originalTutorials) as Array<{ id: string; title: string }>;
  const firstId = tutorials[0].id;
  const originalTitle = tutorials[0].title;
  tutorials[0].title = `${originalTitle} ${marker}`;
  fs.writeFileSync(tutorialsJsonPath, JSON.stringify(tutorials, null, 2));

  // Run regen directly via tsx (same call doTutorialPR will make)
  const outDir = path.join(REPO_ROOT, 'src/data/tutorials', DEVICE);
  const outDirExisted = fs.existsSync(outDir);
  // Snapshot existing dir if any so we can restore
  const preExistingFiles = outDirExisted ? fs.readdirSync(outDir).sort() : [];

  try {
    const { regenerateTutorialsFromCanvas } = await import(path.join(REPO_ROOT, 'src/lib/pipeline/regenerate-tutorial-ts'));
    const r = regenerateTutorialsFromCanvas({ deviceId: DEVICE, repoRoot: REPO_ROOT });
    check('regenerateTutorialsFromCanvas returns ok', r.ok === true, JSON.stringify({ tutorialCount: r.tutorialCount, error: r.error }));

    const firstTsPath = path.join(outDir, `${firstId}.ts`);
    check(`<firstId>.ts written`, fs.existsSync(firstTsPath), firstTsPath);

    if (fs.existsSync(firstTsPath)) {
      const ts = fs.readFileSync(firstTsPath, 'utf-8');
      check('regenerated .ts contains the canvas patch marker', ts.includes(marker), `looking for "${marker}"`);
      check('regenerated .ts has Tutorial import', ts.includes(`import { Tutorial } from '@/types/tutorial';`));
      check('regenerated .ts has the AUTO-GENERATED warning header', ts.includes('AUTO-GENERATED'));
    }

    const indexPath = path.join(outDir, 'index.ts');
    check('index.ts written', fs.existsSync(indexPath));
    if (fs.existsSync(indexPath)) {
      const idx = fs.readFileSync(indexPath, 'utf-8');
      check('index.ts imports the regenerated file', idx.includes(`from './${firstId}';`));
      const expectedArrayName = `${DEVICE.replace(/-([a-z0-9])/g, (_: string, c: string) => c.toUpperCase())}Tutorials`;
      check(`index.ts exports ${expectedArrayName}`, idx.includes(`export const ${expectedArrayName}`));
    }

    // Re-run is byte-identical
    const beforeBytes = fs.readFileSync(firstTsPath, 'utf-8');
    regenerateTutorialsFromCanvas({ deviceId: DEVICE, repoRoot: REPO_ROOT });
    const afterBytes = fs.readFileSync(firstTsPath, 'utf-8');
    check('re-run is byte-identical (idempotent)', beforeBytes === afterBytes);
  } finally {
    // Restore tutorials.json
    fs.writeFileSync(tutorialsJsonPath, originalTutorials);

    // Restore the tutorials/<DEVICE>/ dir to its prior state. If it didn't
    // exist before, remove it. Otherwise, remove anything we created and
    // restore the pre-existing file list (we don't have their content
    // snapshotted, but we know they existed — if any are missing now,
    // we leave the regen output in place to avoid data loss in the
    // ambiguous case).
    if (!outDirExisted) {
      fs.rmSync(outDir, { recursive: true, force: true });
    } else {
      const nowFiles = fs.readdirSync(outDir).sort();
      const toRemove = nowFiles.filter((f) => !preExistingFiles.includes(f));
      for (const f of toRemove) {
        fs.unlinkSync(path.join(outDir, f));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // B. Orphan delete endpoint
  // ─────────────────────────────────────────────────────────────────────
  console.log('\n── B. orphan delete endpoint ──');

  const editorPath = path.join(REPO_ROOT, '.pipeline', DEVICE, 'manifest-editor.json');
  if (!fs.existsSync(editorPath)) {
    check('manifest-editor.json present', false, `missing at ${editorPath}`);
  } else {
    const originalManifest = fs.readFileSync(editorPath, 'utf-8');
    const manifest = JSON.parse(originalManifest);
    const throwawayId = `PR-J-TEST-CONTROL-${Date.now()}`;

    // Insert a throwaway control. Handle both Record and Array shapes.
    if (Array.isArray(manifest.controls)) {
      manifest.controls.push({ id: throwawayId, type: 'button', x: 0, y: 0, w: 10, h: 10 });
    } else if (typeof manifest.controls === 'object' && manifest.controls !== null) {
      manifest.controls[throwawayId] = { id: throwawayId, type: 'button', x: 0, y: 0, w: 10, h: 10 };
    } else {
      check('manifest.controls is mutable', false, `controls is ${typeof manifest.controls}`);
      fs.writeFileSync(editorPath, originalManifest);
      process.exit(1);
    }
    fs.writeFileSync(editorPath, JSON.stringify(manifest, null, 2));

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext();
    await setCookie(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });

    try {
      const res = await page.evaluate(async ({ device, ctrl }) => {
        const r = await fetch(`/api/pipeline/${device}/manifest-control/${encodeURIComponent(ctrl)}`, {
          method: 'DELETE',
        });
        return { status: r.status, body: await r.json() };
      }, { device: DEVICE, ctrl: throwawayId });

      check('DELETE returns 200 ok', res.status === 200 && res.body.ok === true,
        `status=${res.status} body=${JSON.stringify(res.body).slice(0, 200)}`);
      check('response confirms deletedControlId', res.body.deletedControlId === throwawayId);

      const afterManifest = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
      const stillThere = Array.isArray(afterManifest.controls)
        ? afterManifest.controls.some((c: { id: string }) => c.id === throwawayId)
        : Boolean(afterManifest.controls?.[throwawayId]);
      check('control removed from manifest-editor.json', !stillThere);

      const backupDir = path.join(REPO_ROOT, '.pipeline', DEVICE, 'backups');
      const backups = fs.existsSync(backupDir)
        ? fs.readdirSync(backupDir).filter((f) => f.includes('delete-orphan'))
        : [];
      check('delete-orphan backup file created', backups.length > 0, `${backups.length} backups`);

      // DELETE of a non-existent control → 404
      const missingRes = await page.evaluate(async ({ device }) => {
        const r = await fetch(`/api/pipeline/${device}/manifest-control/__NEVER_EXISTED__`, { method: 'DELETE' });
        return { status: r.status, body: await r.json() };
      }, { device: DEVICE });
      check('DELETE non-existent control returns 404', missingRes.status === 404, `status=${missingRes.status}`);
    } finally {
      fs.writeFileSync(editorPath, originalManifest);
      await ctx.close();
      await browser.close();
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) for (const f of fails) console.log(`  ✗ ${f}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(2); });
