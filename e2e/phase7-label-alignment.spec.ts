/**
 * Phase 7 — real-UI smoke for label alignment with auto-anchor logic.
 *
 * Scenarios:
 *  [1] 1 control + 2 standalone labels → Align Top → labels match control top, control stays
 *  [2] 3+ standalone labels only → Align Top → bbox mode (topmost wins)
 *  [3] Distribute 3 standalone labels horizontally → middle one centers
 *  [4] Linked labels in selection → skipped + "N linked skipped" hint visible
 *  [5] 2+ standalone labels → MixedSelectionPanel routing works (single-type)
 *  [6] Anchor hint visible only when controls are with standalone labels
 *
 * ALL goto calls use `?nosave=true` (CLAUDE.md mandate).
 */
import { chromium, BrowserContext, Page } from 'playwright';
import fs from 'fs';

function readPwd(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const env = fs.readFileSync(
    '/Users/devin/Documents/Fun & Stuff/Music/Music Studio/askmiyagi/.env.local',
    'utf-8',
  );
  const m = env.match(/^ADMIN_PASSWORD=(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : 'miyagi2026';
}

const ADMIN_PASSWORD = readPwd();
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.env.TEST_DEVICE || 'fantom-06';

async function setCookie(ctx: BrowserContext) {
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }]);
}

let pass = 0, fail = 0;
const check = (l: string, c: boolean, i: string) => {
  if (c) { console.log(`  ✓ ${l} — ${i}`); pass++; }
  else { console.log(`  ✗ ${l} — ${i}`); fail++; }
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  await setCookie(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/${DEVICE_ID}/editor?nosave=true`, { waitUntil: 'load', timeout: 60000 });
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(() => typeof (window as any).useEditorStore === 'function')) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1500);

  console.log(`\n=== Phase 7 — label alignment + distribute — ${DEVICE_ID} ===\n`);

  // Helper: ensure manifest has 3+ standalone labels for tests.
  await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const standalone = (s.editorLabels || []).filter((l: any) => !l.controlId);
    if (standalone.length < 3 && typeof s.addStandaloneLabel === 'function') {
      const needed = 3 - standalone.length;
      for (let i = 0; i < needed; i++) {
        s.addStandaloneLabel(100 + i * 80, 300 + i * 20, `TEST_LBL_${i}`);
      }
    }
  });
  await page.waitForTimeout(200);

  // ── Scenario 1: 1 control + 2 standalone labels → Align Top → control anchors
  console.log('[1] 1 control + 2 standalone labels → Align Top → labels match control, control stays');
  const t1 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrls = Object.values(s.controls) as any[];
    const labels = (s.editorLabels || []).filter((l: any) => !l.controlId);
    if (!ctrls[0] || labels.length < 2) return null;
    const c = ctrls[0];
    const l1 = labels[0];
    const l2 = labels[1];
    s.clearSelection();
    s.setSelection([`control:${c.id}`, `label:${l1.id}`, `label:${l2.id}`]);
    return {
      ctrlId: c.id,
      label1Id: l1.id,
      label2Id: l2.id,
      ctrlY: c.y,
      lbl1YBefore: l1.y,
      lbl2YBefore: l2.y,
    };
  });
  if (!t1) {
    console.log('  (skipped — not enough entities)');
  } else {
    await page.waitForTimeout(200);
    // Click Align Top button
    await page.locator('[data-testid="align-top"]').click();
    await page.waitForTimeout(300);
    const after1 = await page.evaluate(({ ctrlId, label1Id, label2Id }) => {
      const s = (window as any).useEditorStore.getState();
      const c = s.controls[ctrlId];
      const l1 = s.editorLabels.find((l: any) => l.id === label1Id);
      const l2 = s.editorLabels.find((l: any) => l.id === label2Id);
      return { ctrlY: c.y, lbl1Y: l1.y, lbl2Y: l2.y };
    }, t1);
    check('control did NOT move (anchor mode)', after1.ctrlY === t1.ctrlY, `before=${t1.ctrlY} after=${after1.ctrlY}`);
    check('label 1 moved to control top', after1.lbl1Y === t1.ctrlY, `target=${t1.ctrlY} actual=${after1.lbl1Y}`);
    check('label 2 moved to control top', after1.lbl2Y === t1.ctrlY, `target=${t1.ctrlY} actual=${after1.lbl2Y}`);
  }

  // ── Scenario 2: 3+ standalone labels only → bbox mode
  console.log('\n[2] 3 standalone labels only → Align Top → bbox mode (topmost wins)');
  const t2 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const standalone = (s.editorLabels || []).filter((l: any) => !l.controlId);
    if (standalone.length < 3) return null;
    s.clearSelection();
    const labels = standalone.slice(0, 3);
    s.setSelection(labels.map((l: any) => `label:${l.id}`));
    return {
      ids: labels.map((l: any) => l.id),
      ysBefore: labels.map((l: any) => l.y),
    };
  });
  if (!t2) {
    console.log('  (skipped — not enough standalone labels)');
  } else {
    await page.waitForTimeout(200);
    await page.locator('[data-testid="align-top"]').click();
    await page.waitForTimeout(300);
    const after2 = await page.evaluate(({ ids }) => {
      const s = (window as any).useEditorStore.getState();
      return ids.map((id: string) => s.editorLabels.find((l: any) => l.id === id).y);
    }, t2);
    const target = Math.min(...t2.ysBefore);
    check('all 3 labels at topmost Y (bbox mode)', after2.every((y: number) => y === target), `target=${target} actual=${after2.join(',')}`);
  }

  // ── Scenario 3: Distribute 3 standalone labels horizontally
  console.log('\n[3] Distribute 3 standalone labels horizontally → middle centers');
  const t3 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const standalone = (s.editorLabels || []).filter((l: any) => !l.controlId);
    if (standalone.length < 3) return null;
    // Spread them out at deliberately uneven X positions
    s.clearSelection();
    const ids = standalone.slice(0, 3).map((l: any) => l.id);
    // Pre-set positions for predictable test
    const editorLabels = s.editorLabels.map((l: any) => {
      if (l.id === ids[0]) return { ...l, x: 100, y: 400 };
      if (l.id === ids[1]) return { ...l, x: 250, y: 400 }; // off-center
      if (l.id === ids[2]) return { ...l, x: 500, y: 400 };
      return l;
    });
    (window as any).useEditorStore.setState({ editorLabels });
    s.setSelection(ids.map((id: string) => `label:${id}`));
    return { ids };
  });
  if (!t3) {
    console.log('  (skipped — not enough standalone labels)');
  } else {
    await page.waitForTimeout(200);
    await page.locator('[data-testid="distribute-horizontal"]').click();
    await page.waitForTimeout(300);
    const after3 = await page.evaluate(({ ids }) => {
      const s = (window as any).useEditorStore.getState();
      return ids.map((id: string) => s.editorLabels.find((l: any) => l.id === id).x);
    }, t3);
    // Middle should be at 300 (midpoint of 100 and 500). Endpoints unchanged.
    check('first label stays at 100', after3[0] === 100, `actual=${after3[0]}`);
    check('middle label distributed to 300', after3[1] === 300, `actual=${after3[1]}`);
    check('last label stays at 500', after3[2] === 500, `actual=${after3[2]}`);
  }

  // ── Scenario 4: Linked label in selection → "N linked skipped" visible
  console.log('\n[4] Linked label in selection → "N linked skipped" hint visible');
  const t4 = await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const linked = (s.editorLabels || []).find((l: any) => l.controlId);
    const standalone = (s.editorLabels || []).find((l: any) => !l.controlId);
    const ctrl = Object.values(s.controls)[0] as any;
    if (!linked || !standalone || !ctrl) return null;
    s.clearSelection();
    s.setSelection([`control:${ctrl.id}`, `label:${linked.id}`, `label:${standalone.id}`]);
    return true;
  });
  if (!t4) {
    console.log('  (skipped — no linked label found)');
  } else {
    await page.waitForTimeout(300);
    const hintVisible = await page.locator('[data-testid="mixed-selection-linked-skipped"]').count();
    check('"linked skipped" hint visible when linked label in selection', hintVisible > 0, `count=${hintVisible}`);
  }

  // ── Scenario 5: Multi-label-only selection routes to MixedSelectionPanel
  console.log('\n[5] 2+ standalone labels (no controls) → MixedSelectionPanel shows');
  await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const standalone = (s.editorLabels || []).filter((l: any) => !l.controlId);
    s.clearSelection();
    s.setSelection(standalone.slice(0, 2).map((l: any) => `label:${l.id}`));
  });
  await page.waitForTimeout(200);
  const panelVisible = await page.locator('[data-testid="mixed-selection-panel"]').count();
  check('MixedSelectionPanel shows for 2+ standalone labels', panelVisible > 0, `count=${panelVisible}`);

  // ── Scenario 6: Anchor hint only when controls + labels are mixed
  console.log('\n[6] Anchor hint only when controls + standalone labels mixed');
  // Pure-label selection → no hint
  const hintHiddenForLabelsOnly = await page.locator('[data-testid="mixed-selection-anchor-hint"]').count();
  check('anchor hint HIDDEN for pure-label selection', hintHiddenForLabelsOnly === 0, `count=${hintHiddenForLabelsOnly}`);

  // Switch to control + label
  await page.evaluate(() => {
    const s = (window as any).useEditorStore.getState();
    const ctrl = Object.values(s.controls)[0] as any;
    const standalone = (s.editorLabels || []).find((l: any) => !l.controlId);
    s.clearSelection();
    if (ctrl && standalone) {
      s.setSelection([`control:${ctrl.id}`, `label:${standalone.id}`]);
    }
  });
  await page.waitForTimeout(200);
  const hintVisible6 = await page.locator('[data-testid="mixed-selection-anchor-hint"]').count();
  check('anchor hint VISIBLE for control + standalone label', hintVisible6 > 0, `count=${hintVisible6}`);

  console.log(`\n=== Result: ${pass} pass, ${fail} fail ===`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
