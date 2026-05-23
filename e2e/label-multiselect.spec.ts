/**
 * Phase 3 — label multi-select via shift-click.
 *
 * User reported: "can't multi select labels both standalone and linked".
 * Pre-Phase 2/3, selectedLabelId was a single slot, so clicking label B
 * replaced label A's selection.
 *
 * Post-Phase 2/3, the unified `selection` array holds `label:<id>`
 * entries; shift-click toggles each in/out. Both linked AND standalone
 * labels work because `selection` is type-agnostic.
 */
import { chromium, BrowserContext } from 'playwright';
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
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const DEVICE_ID = process.env.TEST_DEVICE || 'fantom-06';

async function setAdminCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

interface StoreState {
  selectedIds: string[];
  selectedLabelId: string | null;
  selection: string[];
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  await setAdminCookie(ctx);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/${DEVICE_ID}/editor?nosave=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // Pick any TWO labels (don't care if linked or standalone — multi
  // should work for both kinds equally).
  const targets = await page.evaluate(() => {
    const w = window as any;
    const labels = w.useEditorStore.getState().editorLabels || [];
    return labels.slice(0, 3).map((l: any) => ({ id: l.id, controlId: l.controlId }));
  });

  if (targets.length < 2) {
    console.error('Need ≥ 2 labels for this test, found', targets.length);
    await browser.close();
    process.exit(1);
  }

  console.log(`\nTarget labels: ${targets.map((t: any) => `${t.id}${t.controlId ? '(linked)' : '(standalone)'}`).join(', ')}\n`);

  const readState = async (): Promise<StoreState> => page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    return {
      selectedIds: s.selectedIds,
      selectedLabelId: s.selectedLabelId,
      selection: s.selection,
    };
  });

  const clickLabel = async (id: string, shift = false) => {
    await page.locator(`[data-label-id="${id}"]`).first().click({
      modifiers: shift ? ['Shift'] : [],
      force: true,
    });
    await page.waitForTimeout(150);
  };

  const clearAll = () => page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    s.clearSelection?.();
  });

  let pass = 0, fail = 0;
  const check = (label: string, cond: boolean, info: string) => {
    if (cond) { console.log(`  ✓ ${label} — ${info}`); pass++; }
    else { console.log(`  ✗ ${label} — ${info}`); fail++; }
  };

  // ── Scenario 1: plain click → single label selected, replaces prior
  await clearAll();
  await clickLabel(targets[0].id);
  let s = await readState();
  console.log('[1] plain click on label A');
  check('selection has label A', s.selection.includes(`label:${targets[0].id}`), `selection=[${s.selection.join(', ')}]`);
  check('selectedLabelId === A (legacy sync)', s.selectedLabelId === targets[0].id, `legacy=${s.selectedLabelId}`);

  await clickLabel(targets[1].id);
  s = await readState();
  console.log('[1b] plain click on label B — replaces');
  check('selection has only label B', s.selection.length === 1 && s.selection.includes(`label:${targets[1].id}`), `selection=[${s.selection.join(', ')}]`);

  // ── Scenario 2: shift-click adds — THE FIX
  await clearAll();
  await clickLabel(targets[0].id);
  await clickLabel(targets[1].id, true);
  s = await readState();
  console.log('\n[2] click A, shift-click B — multi-select');
  check('selection has BOTH A and B', s.selection.includes(`label:${targets[0].id}`) && s.selection.includes(`label:${targets[1].id}`), `selection=[${s.selection.join(', ')}]`);
  check('selectedLabelId is null (multi-label state)', s.selectedLabelId === null, `legacy=${s.selectedLabelId}`);

  // ── Scenario 3: shift-click again removes (toggle)
  await clickLabel(targets[1].id, true);
  s = await readState();
  console.log('\n[3] shift-click B again — toggle removes');
  check('selection has only A', s.selection.length === 1 && s.selection.includes(`label:${targets[0].id}`), `selection=[${s.selection.join(', ')}]`);

  // ── Scenario 4: third label via shift adds (3-way select)
  if (targets[2]) {
    await clickLabel(targets[1].id, true); // re-add B
    await clickLabel(targets[2].id, true); // add C
    s = await readState();
    console.log('\n[4] click A, shift+B, shift+C — 3 labels selected');
    check('selection has all 3', s.selection.length === 3, `selection=[${s.selection.join(', ')}]`);
  }

  // ── Scenario 5: CROSS-TYPE DESELECT (the bug the user reported)
  // Click a label, then plain-click a control. The label MUST deselect
  // (selection array cleared by setSelectedIds since the click was a
  // plain REPLACE, not a shift-ADD).
  const controlId = await page.evaluate(() => {
    const w = window as any;
    const ctrls = w.useEditorStore.getState().controls || {};
    return Object.keys(ctrls)[0];
  });
  if (controlId) {
    await clearAll();
    await clickLabel(targets[0].id);
    let preState = await readState();
    console.log('\n[5] click label → plain-click control deselects label');
    check('precondition: label A selected', preState.selection.includes(`label:${targets[0].id}`), `selection=[${preState.selection.join(', ')}]`);

    // Plain-click on the control (no shift)
    await page.locator(`[data-control-id="${controlId}"]`).first().click({ force: true });
    await page.waitForTimeout(200);
    s = await readState();
    check('label NOT in selection after control click', !s.selection.includes(`label:${targets[0].id}`), `selection=[${s.selection.join(', ')}]`);
    check('selectedLabelId is null after control click', s.selectedLabelId === null, `legacy=${s.selectedLabelId}`);
    check('control IS in selectedIds (legacy)', s.selectedIds.includes(controlId), `selectedIds=[${s.selectedIds.join(', ')}]`);
  }

  // ── Scenario 6: inverse — click control, plain-click label deselects control
  if (controlId) {
    await clearAll();
    await page.locator(`[data-control-id="${controlId}"]`).first().click({ force: true });
    await page.waitForTimeout(150);
    let preState = await readState();
    console.log('\n[6] click control → plain-click label deselects control');
    check('precondition: control selected', preState.selectedIds.includes(controlId), `selectedIds=[${preState.selectedIds.join(', ')}]`);

    await clickLabel(targets[0].id);
    s = await readState();
    check('control NOT in selectedIds after label click', !s.selectedIds.includes(controlId), `selectedIds=[${s.selectedIds.join(', ')}]`);
    check('label IS in selection', s.selection.includes(`label:${targets[0].id}`), `selection=[${s.selection.join(', ')}]`);
  }

  console.log(`\n=== Result: ${pass} pass, ${fail} fail ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
