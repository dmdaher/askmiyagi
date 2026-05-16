/**
 * Phase 4 — real-UI Playwright e2e for entity-agnostic operations.
 *
 * Tests the actual browser behavior (not just store actions in isolation):
 *  - REAL mouse drag on labels — does the drag handler call moveSelection
 *    when 2+ entities are selected?
 *  - REAL mouse drag on controls (via Rnd) — same question
 *  - REAL Delete keypress — does the keyboard handler dispatch right?
 *  - Cross-type combinations: control + label, label + label, mixed
 *
 * ALL goto calls use `?nosave=true` so auto-save can't corrupt
 * contractor data (CLAUDE.md mandate).
 *
 * Runs against the wt-phase-4 dev server on :3001.
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
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const DEVICE_ID = process.env.TEST_DEVICE || 'fantom-06';

async function setAdminCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

interface StoreSnapshot {
  selection: string[];
  selectedIds: string[];
  selectedLabelId: string | null;
  controls: Record<string, { x: number; y: number; id: string }>;
  editorLabels: Array<{ id: string; x: number; y: number; controlId?: string | null }>;
}

const readStore = (page: Page): Promise<StoreSnapshot> => page.evaluate(() => {
  const s = (window as any).useEditorStore.getState();
  return {
    selection: s.selection,
    selectedIds: s.selectedIds,
    selectedLabelId: s.selectedLabelId,
    controls: Object.fromEntries(
      Object.entries(s.controls).map(([k, v]: [string, any]) => [k, { x: v.x, y: v.y, id: v.id }]),
    ),
    editorLabels: (s.editorLabels || []).map((l: any) => ({ id: l.id, x: l.x, y: l.y, controlId: l.controlId })),
  };
});

let pass = 0, fail = 0;
const check = (label: string, cond: boolean, info: string) => {
  if (cond) { console.log(`  ✓ ${label} — ${info}`); pass++; }
  else { console.log(`  ✗ ${label} — ${info}`); fail++; }
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  await setAdminCookie(ctx);
  const page = await ctx.newPage();

  // CRITICAL: ?nosave=true so auto-save can't corrupt contractor data
  await page.goto(`${BASE}/admin/${DEVICE_ID}/editor?nosave=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log(`\n=== Phase 4 cross-type drag + delete (real UI) — ${DEVICE_ID} ===\n`);

  // Set snap=1 so drag deltas are predictable (no snap rounding adds confusion)
  await page.evaluate(() => {
    (window as any).useEditorStore.setState({ snapGrid: 1 });
  });

  // ── Scenario 1: mixed selection (1 control + 2 labels), drag the LABEL,
  //                all three should move by the same dx/dy
  console.log('[1] mixed: 1 control + 2 labels, drag a label — all 3 move in lockstep');
  // Reset selection
  await page.evaluate(() => (window as any).useEditorStore.getState().clearSelection());
  // Pick targets — first control + first 2 labels
  const targets = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrl = Object.values(s.controls)[0] as any;
    const labels = (s.editorLabels || []).slice(0, 2) as any[];
    return { ctrlId: ctrl.id, label1Id: labels[0]?.id, label2Id: labels[1]?.id };
  });
  if (!targets.ctrlId || !targets.label1Id || !targets.label2Id) {
    console.error('not enough entities for test, aborting');
    process.exit(1);
  }

  // Build selection via the store's primitives (bypass click flake)
  await page.evaluate(({ ctrlId, label1Id, label2Id }) => {
    const s = (window as any).useEditorStore.getState();
    s.setSelection([`control:${ctrlId}`, `label:${label1Id}`, `label:${label2Id}`]);
  }, targets);

  const before = await readStore(page);
  const ctrlBefore = before.controls[targets.ctrlId];
  const lbl1Before = before.editorLabels.find((l: any) => l.id === targets.label1Id)!;
  const lbl2Before = before.editorLabels.find((l: any) => l.id === targets.label2Id)!;
  console.log(`    before: ctrl=(${ctrlBefore.x},${ctrlBefore.y}) lbl1=(${lbl1Before.x},${lbl1Before.y}) lbl2=(${lbl2Before.x},${lbl2Before.y})`);

  // Do a REAL mouse drag on label1: simulate mousedown → mousemove → mouseup
  // via Playwright's mouse API (not click which doesn't drag)
  const lbl1El = page.locator(`[data-label-id="${targets.label1Id}"]`).first();
  const box = await lbl1El.boundingBox();
  if (!box) { console.error('label1 not in viewport'); process.exit(1); }

  // Drag by +50px right, +30px down
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Multiple intermediate steps so React drag handler picks up movement
  await page.mouse.move(startX + 25, startY + 15, { steps: 3 });
  await page.mouse.move(startX + 50, startY + 30, { steps: 3 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  const after = await readStore(page);
  const ctrlAfter = after.controls[targets.ctrlId];
  const lbl1After = after.editorLabels.find((l: any) => l.id === targets.label1Id)!;
  const lbl2After = after.editorLabels.find((l: any) => l.id === targets.label2Id)!;
  console.log(`    after:  ctrl=(${ctrlAfter.x},${ctrlAfter.y}) lbl1=(${lbl1After.x},${lbl1After.y}) lbl2=(${lbl2After.x},${lbl2After.y})`);

  const ctrlDx = ctrlAfter.x - ctrlBefore.x;
  const ctrlDy = ctrlAfter.y - ctrlBefore.y;
  const lbl1Dx = lbl1After.x - lbl1Before.x;
  const lbl1Dy = lbl1After.y - lbl1Before.y;
  const lbl2Dx = lbl2After.x - lbl2Before.x;
  const lbl2Dy = lbl2After.y - lbl2Before.y;

  check('label1 moved (it was dragged)', lbl1Dx !== 0 || lbl1Dy !== 0, `dx=${lbl1Dx} dy=${lbl1Dy}`);
  check('label2 moved with label1 (lockstep — cross-type drag)', lbl2Dx === lbl1Dx && lbl2Dy === lbl1Dy, `lbl1 dx=${lbl1Dx},dy=${lbl1Dy} lbl2 dx=${lbl2Dx},dy=${lbl2Dy}`);
  check('control moved with labels (cross-type drag)', ctrlDx === lbl1Dx && ctrlDy === lbl1Dy, `ctrl dx=${ctrlDx},dy=${ctrlDy} vs lbl1 dx=${lbl1Dx},dy=${lbl1Dy}`);

  // ── Scenario 2: real Delete key with mixed selection
  console.log('\n[2] mixed: 1 control + 2 labels, press Delete — controls actually get deleted today (existing behavior)');
  // Re-set selection (drag may have changed it)
  await page.evaluate(({ ctrlId, label1Id }) => {
    const s = (window as any).useEditorStore.getState();
    s.setSelection([`control:${ctrlId}`, `label:${label1Id}`]);
  }, targets);

  const preDelete = await readStore(page);
  const ctrlExistedBefore = preDelete.controls[targets.ctrlId] !== undefined;
  const lblExistedBefore = preDelete.editorLabels.some((l: any) => l.id === targets.label1Id);

  // Real Delete keypress
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);

  const postDelete = await readStore(page);
  const ctrlExistsAfter = postDelete.controls[targets.ctrlId] !== undefined;
  const lblExistsAfter = postDelete.editorLabels.some((l: any) => l.id === targets.label1Id);
  check('precondition: control existed before delete', ctrlExistedBefore, '');
  check('precondition: label existed before delete', lblExistedBefore, '');
  check('label was deleted via keyboard', !lblExistsAfter, `label1 still exists=${lblExistsAfter}`);
  check('control was deleted via keyboard (current behavior)', !ctrlExistsAfter, `control still exists=${ctrlExistsAfter}`);
  check('selection cleared after delete', postDelete.selection.length === 0, `selection=[${postDelete.selection.join(',')}]`);

  // ── Scenario 3: Undo restores everything in ONE step
  console.log('\n[3] Undo after multi-delete — restores everything in 1 step');
  await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    s.undo();
  });
  await page.waitForTimeout(200);
  const postUndo = await readStore(page);
  check('control restored by 1 undo', postUndo.controls[targets.ctrlId] !== undefined, '');
  check('label restored by 1 undo', postUndo.editorLabels.some((l: any) => l.id === targets.label1Id), '');

  // ── Scenario 4: same-type multi-control drag should still work (legacy regression)
  console.log('\n[4] legacy: select 2 controls (no labels), drag one — both move (moveSelectedControls path)');
  await page.evaluate(() => (window as any).useEditorStore.getState().clearSelection());
  const twoControls = await page.evaluate(() => {
    const ctrls = Object.values((window as any).useEditorStore.getState().controls).slice(0, 2) as any[];
    return { a: ctrls[0].id, b: ctrls[1].id };
  });
  // Use legacy setSelectedIds to set up
  await page.evaluate(({ a, b }) => {
    (window as any).useEditorStore.getState().setSelectedIds([a, b]);
  }, twoControls);

  const lcBefore = await readStore(page);
  const aBefore = lcBefore.controls[twoControls.a];
  const bBefore = lcBefore.controls[twoControls.b];

  // Drag control A via Rnd handle — find its data-control-id wrapper and drag
  const ctrlEl = page.locator(`[data-control-id="${twoControls.a}"]`).first();
  const ctrlBox = await ctrlEl.boundingBox();
  if (ctrlBox) {
    await page.mouse.move(ctrlBox.x + 5, ctrlBox.y + 5);
    await page.mouse.down();
    await page.mouse.move(ctrlBox.x + 25, ctrlBox.y + 15, { steps: 3 });
    await page.mouse.move(ctrlBox.x + 45, ctrlBox.y + 25, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const lcAfter = await readStore(page);
    const aAfter = lcAfter.controls[twoControls.a];
    const bAfter = lcAfter.controls[twoControls.b];
    const aDx = aAfter.x - aBefore.x;
    const bDx = bAfter.x - bBefore.x;
    const aDy = aAfter.y - aBefore.y;
    const bDy = bAfter.y - bBefore.y;
    check('control A moved (dragged)', aDx !== 0 || aDy !== 0, `dx=${aDx} dy=${aDy}`);
    check('control B moved with A (legacy moveSelectedControls)', bDx === aDx && bDy === aDy, `A=(${aDx},${aDy}) B=(${bDx},${bDy})`);
  } else {
    console.log('  (skipped — control not in viewport)');
  }

  console.log(`\n=== Result: ${pass} pass, ${fail} fail ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
