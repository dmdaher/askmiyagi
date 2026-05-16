/**
 * Phase 5 — real-UI smoke for MixedSelectionPanel routing.
 *
 * Verifies the PropertiesPanel renders the mixed panel when the unified
 * `selection` contains 2+ distinct types, and the breakdown text +
 * Delete button reflect the actual selection contents.
 *
 * ALL goto calls use `?nosave=true` so auto-save cannot corrupt
 * contractor data (CLAUDE.md mandate).
 */
import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';

function readAdminPassword(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const env = fs.readFileSync(
    '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.env.local',
    'utf-8',
  );
  const m = env.match(/^ADMIN_PASSWORD=(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : 'miyagi2026';
}

const ADMIN_PASSWORD = readAdminPassword();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3002';
const DEVICE_ID = process.env.TEST_DEVICE || 'fantom-06';

async function setAdminCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const check = (label: string, cond: boolean, info: string) => {
  if (cond) { console.log(`  ✓ ${label} — ${info}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fail++; }
};

async function getPanelText(page: Page, testId: string): Promise<string | null> {
  const loc = page.locator(`[data-testid="${testId}"]`);
  if (await loc.count() === 0) return null;
  return await loc.first().textContent();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  await setAdminCookie(ctx);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/${DEVICE_ID}/editor?nosave=true`, { waitUntil: 'domcontentloaded' });
  // Poll until the editor store is registered on window (handles slow
  // first-compile on fresh dev servers).
  for (let i = 0; i < 30; i++) {
    const ready = await page.evaluate(() => typeof (window as any).useEditorStore === 'function');
    if (ready) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1000);

  console.log(`\n=== Phase 5 MixedSelectionPanel routing — ${DEVICE_ID} ===\n`);

  // Ensure manifest has at least one standalone label for scenarios 3+4.
  // Pristine fantom-06 has only linked labels.
  await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const hasStandalone = (s.editorLabels || []).some((l: any) => !l.controlId);
    if (!hasStandalone && typeof s.addStandaloneLabel === 'function') {
      s.addStandaloneLabel(50, 50, 'TEST_LBL');
    }
  });
  await page.waitForTimeout(200);

  // Scenario 1: single control → SingleControlProperties (NOT mixed panel)
  console.log('[1] single control → single-type form (no mixed panel)');
  await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    s.clearSelection();
    const ctrl = Object.values(s.controls)[0] as any;
    s.setSelection([`control:${ctrl.id}`]);
  });
  await page.waitForTimeout(150);
  const panel1 = await getPanelText(page, 'mixed-selection-panel');
  check('mixed panel HIDDEN when only 1 control selected', panel1 === null, `panel=${panel1 === null ? 'absent' : 'present'}`);

  // Scenario 2: 2 controls → MultiControlProperties (NOT mixed)
  console.log('\n[2] 2 controls → multi-control form (not mixed; same type)');
  await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    s.clearSelection();
    const ctrls = Object.values(s.controls).slice(0, 2) as any[];
    s.setSelection([`control:${ctrls[0].id}`, `control:${ctrls[1].id}`]);
  });
  await page.waitForTimeout(150);
  const panel2 = await getPanelText(page, 'mixed-selection-panel');
  check('mixed panel HIDDEN when 2 same-type entities selected', panel2 === null, `panel=${panel2 === null ? 'absent' : 'present'}`);

  // Scenario 3: 1 control + 1 standalone label → MixedSelectionPanel
  console.log('\n[3] control + standalone label → MIXED panel with breakdown');
  const t3 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrl = Object.values(s.controls)[0] as any;
    const standalone = (s.editorLabels || []).find((l: any) => !l.controlId);
    if (!standalone) return null;
    s.clearSelection();
    s.setSelection([`control:${ctrl.id}`, `label:${standalone.id}`]);
    return { ctrlId: ctrl.id, labelId: standalone.id };
  });
  if (!t3) {
    console.log('  (skipped — no standalone label in this manifest)');
  } else {
    await page.waitForTimeout(150);
    const panel3 = await getPanelText(page, 'mixed-selection-panel');
    const breakdown3 = await getPanelText(page, 'mixed-selection-breakdown');
    check('mixed panel VISIBLE for control + standalone label', panel3 !== null, `panel=${panel3 === null ? 'absent' : 'present'}`);
    check('breakdown text correct', breakdown3 === '1 control, 1 label', `actual="${breakdown3}"`);

    // Verify Delete button shows up + label-count info
    const deleteBtn = page.locator('[data-testid="mixed-selection-delete"]');
    const hasDelete = await deleteBtn.count() > 0;
    check('Delete button visible (standalone label is deletable)', hasDelete, '');
    if (hasDelete) {
      const txt = await deleteBtn.first().textContent();
      check('Delete button label contains "Delete 1"', txt?.includes('Delete 1') ?? false, `text="${txt?.trim()}"`);
      check('Delete button shows "1 protected" (the control)', txt?.includes('1 protected') ?? false, `text="${txt?.trim()}"`);
    }
  }

  // Scenario 4: click Delete button → standalone label removed, control preserved
  console.log('\n[4] click Delete in mixed panel → standalone removed, control survives');
  if (t3) {
    const before = await page.evaluate(({ ctrlId, labelId }) => {
      const s = (window as any).useEditorStore.getState();
      return {
        ctrlExists: !!s.controls[ctrlId],
        labelExists: (s.editorLabels || []).some((l: any) => l.id === labelId),
      };
    }, t3);
    check('preconditions: control + label both present', before.ctrlExists && before.labelExists, '');

    await page.locator('[data-testid="mixed-selection-delete"]').first().click();
    await page.waitForTimeout(300);

    const after = await page.evaluate(({ ctrlId, labelId }) => {
      const s = (window as any).useEditorStore.getState();
      return {
        ctrlExists: !!s.controls[ctrlId],
        labelExists: (s.editorLabels || []).some((l: any) => l.id === labelId),
        sel: s.selection,
      };
    }, t3);
    check('control PRESERVED after Delete (policy)', after.ctrlExists, `ctrl exists=${after.ctrlExists}`);
    check('standalone label DELETED via Delete button', !after.labelExists, `label exists=${after.labelExists}`);
    check('control still in selection (protected entries stay)', after.sel.includes(`control:${t3.ctrlId}`), `sel=[${after.sel.join(',')}]`);
  }

  // Scenario 5: control + linked label → mixed panel shows but Delete is hidden
  console.log('\n[5] control + linked label → mixed panel, Delete hidden (nothing deletable)');
  const t5 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const linkedLbl = (s.editorLabels || []).find((l: any) => l.controlId);
    if (!linkedLbl) return null;
    const ctrlId = linkedLbl.controlId;
    // Use a DIFFERENT control (not the linked label's parent) to make mixed
    const ctrls = Object.values(s.controls) as any[];
    const otherCtrl = ctrls.find((c) => c.id !== ctrlId) ?? ctrls[0];
    s.clearSelection();
    s.setSelection([`control:${otherCtrl.id}`, `label:${linkedLbl.id}`]);
    return { ctrlId: otherCtrl.id, labelId: linkedLbl.id };
  });
  if (!t5) {
    console.log('  (skipped — no linked label in manifest)');
  } else {
    await page.waitForTimeout(150);
    const panel5 = await getPanelText(page, 'mixed-selection-panel');
    check('mixed panel VISIBLE for control + linked label', panel5 !== null, '');
    const deleteBtn = page.locator('[data-testid="mixed-selection-delete"]');
    const hasDelete = await deleteBtn.count() > 0;
    check('Delete button HIDDEN (linked label + control both protected)', !hasDelete, `hasDelete=${hasDelete}`);
  }

  // Scenario 6: regression — single label (not mixed) still goes to LabelProperties
  console.log('\n[6] regression: single standalone label → LabelProperties (not mixed)');
  const t6 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    let standalone = (s.editorLabels || []).find((l: any) => !l.controlId);
    // Regenerate if scenarios 3+4 consumed the only standalone label.
    if (!standalone && typeof s.addStandaloneLabel === 'function') {
      s.addStandaloneLabel(100, 100, 'REGRESSION_LBL');
      standalone = (window as any).useEditorStore
        .getState()
        .editorLabels.find((l: any) => !l.controlId);
    }
    s.clearSelection();
    if (standalone) {
      s.setSelection([`label:${standalone.id}`]);
      return { ok: true };
    }
    return { ok: false };
  });
  await page.waitForTimeout(150);
  if (!t6.ok) {
    console.log('  (skipped — no standalone label after deletions)');
  } else {
    const panel6 = await getPanelText(page, 'mixed-selection-panel');
    check('mixed panel HIDDEN for single label', panel6 === null, `panel=${panel6 === null ? 'absent' : 'present'}`);
  }

  console.log(`\n=== Result: ${pass} pass, ${fail} fail ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
