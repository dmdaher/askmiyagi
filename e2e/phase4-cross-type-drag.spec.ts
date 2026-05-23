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

  // ── Scenario 2: real Delete key with mixed selection — POLICY:
  //   * Controls are NEVER deletable (pipeline-generated, protected)
  //   * Linked labels are NEVER deletable (belong to their control)
  //   * Standalone labels + banners ARE deletable
  console.log('\n[2] mixed: control + label, press Delete — control protected, linked label protected, standalone label deleted');

  // Find a standalone label specifically (one with no controlId) so we can
  // verify it gets deleted while the control is preserved.
  const standaloneLabelId = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const lbls = (s.editorLabels || []) as any[];
    return lbls.find((l) => !l.controlId)?.id ?? null;
  });

  // Re-set selection with the standalone label (if one exists)
  await page.evaluate(({ ctrlId, label1Id, standaloneId }) => {
    const s = (window as any).useEditorStore.getState();
    const labelToTest = standaloneId ?? label1Id;
    s.setSelection([`control:${ctrlId}`, `label:${labelToTest}`]);
  }, { ...targets, standaloneId: standaloneLabelId });

  const testLabelId = standaloneLabelId ?? targets.label1Id;
  const isStandalone = standaloneLabelId !== null;

  const preDelete = await readStore(page);
  const ctrlExistedBefore = preDelete.controls[targets.ctrlId] !== undefined;
  const lblExistedBefore = preDelete.editorLabels.some((l: any) => l.id === testLabelId);

  // Real Delete keypress
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);

  const postDelete = await readStore(page);
  const ctrlExistsAfter = postDelete.controls[targets.ctrlId] !== undefined;
  const lblExistsAfter = postDelete.editorLabels.some((l: any) => l.id === testLabelId);
  check('precondition: control existed before delete', ctrlExistedBefore, '');
  check('precondition: label existed before delete', lblExistedBefore, '');
  check('control PROTECTED from delete (policy)', ctrlExistsAfter, `control still exists=${ctrlExistsAfter}`);
  if (isStandalone) {
    check('standalone label deleted via keyboard', !lblExistsAfter, `label still exists=${lblExistsAfter}`);
  } else {
    check('linked label PROTECTED from delete (policy)', lblExistsAfter, `linked label preserved=${lblExistsAfter}`);
  }

  // ── Scenario 3: Undo — only meaningful if something was deleted
  console.log('\n[3] Undo — restores any deleted standalone entries');
  if (isStandalone && !lblExistsAfter) {
    await page.evaluate(() => {
      const s = (window as any).useEditorStore.getState();
      s.undo();
    });
    await page.waitForTimeout(200);
    const postUndo = await readStore(page);
    check('standalone label restored by 1 undo', postUndo.editorLabels.some((l: any) => l.id === testLabelId), '');
  } else {
    console.log('  (no deletion occurred — undo not applicable in this manifest)');
  }

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

  // ── Scenario 5: drag the CONTROL when control + 2 labels are selected.
  // User reported: "if i multi select a standalone label + a control and
  // move them somewhere, only the control moves". Tests the inverse of
  // scenario [1] — drag entry is a control, not a label.
  console.log('\n[5] mixed: control + 2 labels — drag the CONTROL — all 3 move (the bug user reported)');
  await page.evaluate(() => (window as any).useEditorStore.getState().clearSelection());
  // Pick fresh targets (some might have been deleted in [2])
  const t5 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrls = Object.values(s.controls) as any[];
    const labels = (s.editorLabels || []) as any[];
    const ctrl = ctrls.find((c) => !labels.some((l) => l.controlId === c.id)) ?? ctrls[0];
    // Find TWO distinct labels that are not linked to our chosen ctrl.
    // Prefer standalone, but fall back to any-other-control label provided
    // the two ids are different (avoids the "same label picked twice" bug).
    const standalone = labels.filter((l) => !l.controlId);
    const otherLinked = labels.filter((l) => l.controlId && l.controlId !== ctrl?.id);
    const pool = [...standalone, ...otherLinked];
    const distinct: any[] = [];
    for (const l of pool) {
      if (distinct.length === 2) break;
      if (!distinct.some((d) => d.id === l.id)) distinct.push(l);
    }
    return {
      ctrlId: ctrl?.id,
      label1: distinct[0]?.id,
      label2: distinct[1]?.id,
    };
  });
  if (t5.ctrlId && t5.label1 && t5.label2 && t5.label1 !== t5.label2) {
    await page.evaluate(({ ctrlId, label1, label2 }) => {
      (window as any).useEditorStore.getState().setSelection([`control:${ctrlId}`, `label:${label1}`, `label:${label2}`]);
    }, t5);

    const before5 = await readStore(page);
    const ctrlBefore = before5.controls[t5.ctrlId];
    const lbl1Before = before5.editorLabels.find((l: any) => l.id === t5.label1)!;
    const lbl2Before = before5.editorLabels.find((l: any) => l.id === t5.label2)!;
    console.log(`    before: ctrl=(${ctrlBefore.x},${ctrlBefore.y}) lbl1=(${lbl1Before.x},${lbl1Before.y}) lbl2=(${lbl2Before.x},${lbl2Before.y})`);

    // Drag the control (NOT a label this time) via Rnd
    const ctrlEl = page.locator(`[data-control-id="${t5.ctrlId}"]`).first();
    const cBox = await ctrlEl.boundingBox();
    if (cBox) {
      await page.mouse.move(cBox.x + 5, cBox.y + 5);
      await page.mouse.down();
      await page.mouse.move(cBox.x + 25, cBox.y + 15, { steps: 3 });
      await page.mouse.move(cBox.x + 45, cBox.y + 25, { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(300);

      const after5 = await readStore(page);
      const ctrlAfter = after5.controls[t5.ctrlId];
      const lbl1After = after5.editorLabels.find((l: any) => l.id === t5.label1)!;
      const lbl2After = after5.editorLabels.find((l: any) => l.id === t5.label2)!;
      console.log(`    after:  ctrl=(${ctrlAfter.x},${ctrlAfter.y}) lbl1=(${lbl1After.x},${lbl1After.y}) lbl2=(${lbl2After.x},${lbl2After.y})`);

      const ctrlDx = ctrlAfter.x - ctrlBefore.x;
      const lbl1Dx = lbl1After.x - lbl1Before.x;
      const lbl2Dx = lbl2After.x - lbl2Before.x;
      check('control moved (it was dragged)', ctrlDx !== 0, `dx=${ctrlDx}`);
      check('label1 moved with control (the user-reported bug)', Math.abs(lbl1Dx - ctrlDx) < 2, `ctrl dx=${ctrlDx} lbl1 dx=${lbl1Dx}`);
      check('label2 moved with control', Math.abs(lbl2Dx - ctrlDx) < 2, `ctrl dx=${ctrlDx} lbl2 dx=${lbl2Dx}`);
    }
  } else {
    console.log('  (skipped — not enough entities)');
  }

  // ── Scenario 6: user-reported regression — multi-select via the legacy
  // setSelectedIds path (i.e. shift-click on a 2nd control), THEN add a
  // standalone label via toggleSelection, THEN drag a control. Label
  // must move with the controls. This is the exact path the user hit
  // in the browser that scenario [5] didn't cover (scenario [5] sets
  // selection via setSelection() directly, bypassing the legacy path).
  console.log('\n[6] legacy-path: setSelectedIds([A,B]) → toggleSelection(label:X) → drag A — all 3 move');
  await page.evaluate(() => (window as any).useEditorStore.getState().clearSelection());
  const t6 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrls = Object.values(s.controls) as any[];
    const labels = (s.editorLabels || []) as any[];
    const standalone = labels.filter((l) => !l.controlId);
    // Pick 2 controls NOT linked to our chosen label, and 1 standalone label
    const labelId = standalone[0]?.id;
    const candidates = ctrls.filter((c) => c.id !== labelId);
    return {
      ctrlA: candidates[0]?.id,
      ctrlB: candidates[1]?.id,
      labelX: labelId,
    };
  });
  if (t6.ctrlA && t6.ctrlB && t6.labelX) {
    // Exercise the SAME paths the browser uses:
    //   1. setSelectedIds([A]) — plain click on control A
    //   2. setSelectedIds([A, B]) — shift-click on control B
    //   3. toggleSelection('label:X') — shift-click on label
    await page.evaluate(({ a, b, lbl }) => {
      const s = (window as any).useEditorStore.getState();
      s.setSelectedIds([a]);
      s.setSelectedIds([a, b]);
      s.toggleSelection(`label:${lbl}`);
    }, { a: t6.ctrlA, b: t6.ctrlB, lbl: t6.labelX });

    const sel6 = await page.evaluate(() => (window as any).useEditorStore.getState().selection);
    console.log(`    unified selection after multi-select: [${sel6.join(', ')}]`);

    const before6 = await readStore(page);
    const aBefore = before6.controls[t6.ctrlA];
    const bBefore = before6.controls[t6.ctrlB];
    const lblBefore = before6.editorLabels.find((l: any) => l.id === t6.labelX)!;
    console.log(`    before: A=(${aBefore.x},${aBefore.y}) B=(${bBefore.x},${bBefore.y}) lbl=(${lblBefore.x},${lblBefore.y})`);

    const aEl = page.locator(`[data-control-id="${t6.ctrlA}"]`).first();
    const aBox = await aEl.boundingBox();
    if (aBox) {
      await page.mouse.move(aBox.x + 5, aBox.y + 5);
      await page.mouse.down();
      await page.mouse.move(aBox.x + 25, aBox.y + 15, { steps: 3 });
      await page.mouse.move(aBox.x + 45, aBox.y + 25, { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(300);

      const after6 = await readStore(page);
      const aAfter = after6.controls[t6.ctrlA];
      const bAfter = after6.controls[t6.ctrlB];
      const lblAfter = after6.editorLabels.find((l: any) => l.id === t6.labelX)!;
      console.log(`    after:  A=(${aAfter.x},${aAfter.y}) B=(${bAfter.x},${bAfter.y}) lbl=(${lblAfter.x},${lblAfter.y})`);

      const aDx = aAfter.x - aBefore.x;
      const bDx = bAfter.x - bBefore.x;
      const lblDx = lblAfter.x - lblBefore.x;
      check('control A moved (dragged)', aDx !== 0, `dx=${aDx}`);
      check('control B moved with A', Math.abs(bDx - aDx) < 2, `A dx=${aDx} B dx=${bDx}`);
      check('LABEL moved with controls (the regression fix)', Math.abs(lblDx - aDx) < 2, `A dx=${aDx} lbl dx=${lblDx}`);
    }
  } else {
    console.log('  (skipped — manifest has no standalone label)');
  }

  // ── Scenario 7: regression check — clicking a control AFTER selecting
  // a label must clear the label's outline. This is the original bug
  // that setSelectedIds: selection=[] was added to fix; verify our new
  // mirror-not-wipe behavior still clears label entries from selection.
  console.log('\n[7] regression: select label → click control → label outline must clear');
  await page.evaluate(() => (window as any).useEditorStore.getState().clearSelection());
  const t7 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrl = Object.values(s.controls)[0] as any;
    const lbl = (s.editorLabels || []).find((l: any) => !l.controlId) ?? (s.editorLabels || [])[0];
    return { ctrlId: ctrl?.id, labelId: lbl?.id };
  });
  if (t7.ctrlId && t7.labelId) {
    await page.evaluate(({ labelId }) => {
      (window as any).useEditorStore.getState().setSelection([`label:${labelId}`]);
    }, t7);
    const midSel = await page.evaluate(() => (window as any).useEditorStore.getState().selection);
    check('label is selected (precondition)', midSel.includes(`label:${t7.labelId}`), `selection=[${midSel.join(',')}]`);

    // Now simulate plain-click on a control via legacy path
    await page.evaluate(({ ctrlId }) => {
      (window as any).useEditorStore.getState().setSelectedIds([ctrlId]);
    }, t7);

    const finalSel = await page.evaluate(() => (window as any).useEditorStore.getState().selection);
    check('label entry CLEARED from unified selection', !finalSel.includes(`label:${t7.labelId}`), `selection=[${finalSel.join(',')}]`);
    check('control entry PRESENT in unified selection (the new mirror)', finalSel.includes(`control:${t7.ctrlId}`), `selection=[${finalSel.join(',')}]`);
  }

  // ── Scenario 8: user-reported bug — select LABEL first, then shift-click
  // a control, then drag the control. Order should not matter; the label
  // should follow. Today this fails because toggleSelected (the shift-
  // click-on-control writer) only updates legacy selectedIds and never
  // touches the unified `selection` array. Fix: route toggleSelected
  // through the unified toggleSelection.
  console.log('\n[8] order-flip: setSelection([label:X]) → toggleSelected(ctrlA) → drag ctrlA — both move');
  await page.evaluate(() => (window as any).useEditorStore.getState().clearSelection());
  const t8 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrls = Object.values(s.controls) as any[];
    const labels = (s.editorLabels || []) as any[];
    const standalone = labels.filter((l) => !l.controlId);
    const ctrl = ctrls.find((c) => !labels.some((l) => l.controlId === c.id)) ?? ctrls[0];
    return { ctrlId: ctrl?.id, labelId: standalone[0]?.id };
  });
  if (t8.ctrlId && t8.labelId) {
    // Exercise EXACTLY the paths the user's click sequence hits:
    //   1. plain click on standalone label → setSelection(['label:X'])
    //   2. shift-click on control → toggleSelected(controlId)
    await page.evaluate(({ ctrlId, labelId }) => {
      const s = (window as any).useEditorStore.getState();
      s.setSelection([`label:${labelId}`]);
      s.toggleSelected(ctrlId);
    }, t8);

    const sel8 = await page.evaluate(() => (window as any).useEditorStore.getState().selection);
    console.log(`    unified selection: [${sel8.join(', ')}]`);

    const before8 = await readStore(page);
    const cBefore = before8.controls[t8.ctrlId];
    const lBefore = before8.editorLabels.find((l: any) => l.id === t8.labelId)!;
    console.log(`    before: ctrl=(${cBefore.x},${cBefore.y}) lbl=(${lBefore.x},${lBefore.y})`);

    const cEl = page.locator(`[data-control-id="${t8.ctrlId}"]`).first();
    const cBox = await cEl.boundingBox();
    if (cBox) {
      await page.mouse.move(cBox.x + 5, cBox.y + 5);
      await page.mouse.down();
      await page.mouse.move(cBox.x + 25, cBox.y + 15, { steps: 3 });
      await page.mouse.move(cBox.x + 45, cBox.y + 25, { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(300);

      const after8 = await readStore(page);
      const cAfter = after8.controls[t8.ctrlId];
      const lAfter = after8.editorLabels.find((l: any) => l.id === t8.labelId)!;
      console.log(`    after:  ctrl=(${cAfter.x},${cAfter.y}) lbl=(${lAfter.x},${lAfter.y})`);

      const cDx = cAfter.x - cBefore.x;
      const lDx = lAfter.x - lBefore.x;
      check('control moved (dragged)', cDx !== 0, `dx=${cDx}`);
      check('LABEL moved with control (order-flip bug fix)', Math.abs(lDx - cDx) < 2, `ctrl dx=${cDx} lbl dx=${lDx}`);
    }
  } else {
    console.log('  (skipped — no standalone label or all controls have linked labels)');
  }

  // ── Scenario 9: ONE drag = ONE undo (user-reported regression)
  // Tests the contract directly: moveSelection() called multiple times
  // (simulating per-mousemove invocations during a drag) must NOT add
  // snapshots — that's the caller's responsibility at drag-start.
  // Pre-fix: each moveSelection() pushed a snapshot → N snapshots per
  // drag → N undo presses to revert. Post-fix: zero internal snapshots.
  console.log('\n[9] moveSelection no longer snapshots internally (drag = ONE undo)');
  const t9 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrls = Object.values(s.controls) as any[];
    const labels = (s.editorLabels || []) as any[];
    const standalone = labels.filter((l) => !l.controlId);
    let label = standalone[0];
    if (!label && typeof s.addStandaloneLabel === 'function') {
      const id = s.addStandaloneLabel(60, 60, 'UNDO_TEST');
      label = (window as any).useEditorStore.getState().editorLabels.find((l: any) => l.id === id);
    }
    if (!label || !ctrls[0]) return null;

    // Set up selection
    s.clearSelection();
    s.setSelection([`control:${ctrls[0].id}`, `label:${label.id}`]);

    // CAPTURE: snapshot count before any "drag"
    const pastBefore = (window as any).useEditorStore.getState().past?.length ?? 0;

    // SIMULATE a drag's per-frame moveSelection calls (what LabelLayer does)
    for (let i = 0; i < 20; i++) {
      (window as any).useEditorStore.getState().moveSelection(1, 0);
    }

    // CAPTURE: snapshot count after 20 per-frame calls
    const pastAfter = (window as any).useEditorStore.getState().past?.length ?? 0;

    return { pastBefore, pastAfter, delta: pastAfter - pastBefore };
  });
  if (t9) {
    console.log(`    past.length before 20 moveSelection calls: ${t9.pastBefore}`);
    console.log(`    past.length after  20 moveSelection calls: ${t9.pastAfter}`);
    check('moveSelection adds ZERO snapshots when called per-frame', t9.delta === 0, `delta=${t9.delta} (was 20+ pre-fix)`);
  } else {
    console.log('  (skipped — could not set up test fixture)');
  }

  console.log(`\n=== Result: ${pass} pass, ${fail} fail ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
