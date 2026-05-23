/**
 * Multi-select asymmetry reproducer.
 *
 * User report: "I select a label and then a control it multi selects but
 * doesn't work when i do control select then a label. Order matters."
 *
 * This script clicks one label and one control in BOTH orders, reading
 * the editor store state after each click, and reports the resulting
 * `selectedIds` (controls + sections array) and `selectedLabelId` so we
 * can see exactly which path clears which selection.
 *
 * Runs against the local dev server with ?nosave=true so it can't
 * corrupt contractor data (mandatory per CLAUDE.md).
 *
 * Usage:
 *   npx tsx e2e/multi-select-order.spec.ts
 *   TEST_BASE_URL=http://localhost:3001 npx tsx e2e/multi-select-order.spec.ts
 */
import { chromium, Page, BrowserContext } from 'playwright';
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
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DEVICE_ID = process.env.TEST_DEVICE || 'fantom-06';

interface StoreSnapshot {
  selectedIds: string[];
  selectedLabelId: string | null;
  selectedBannerId: string | null;
  selectedContainerId: string | null;
  // The unified MS1 field — present only if the worktree has MS1 schema landed
  selection?: string[];
}

function readStore(page: Page): Promise<StoreSnapshot> {
  return page.evaluate(() => {
    // Editor store is exposed on window for debugging (see store.ts)
    // Fallback: use the React internals if not exposed.
    const w = window as unknown as { useEditorStore?: { getState: () => Record<string, unknown> } };
    const state = w.useEditorStore?.getState?.();
    if (!state) throw new Error('editor store not on window — needs useEditorStore export');
    return {
      selectedIds: (state.selectedIds as string[]) ?? [],
      selectedLabelId: (state.selectedLabelId as string | null) ?? null,
      selectedBannerId: (state.selectedBannerId as string | null) ?? null,
      selectedContainerId: (state.selectedContainerId as string | null) ?? null,
      selection: (state.selection as string[] | undefined),
    };
  });
}

async function setAdminCookie(ctx: BrowserContext) {
  // Bypass the signin form — set the cookie directly.
  await ctx.addCookies([{
    name: 'admin_access',
    value: ADMIN_PASSWORD,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);
}

async function openEditor(page: Page, deviceId: string) {
  // ?nosave=true is the non-negotiable safety flag — CLAUDE.md mandates it
  // for any script that loads /admin/<id>/editor, otherwise the auto-save
  // subscriber can corrupt contractor data mid-hydration.
  // domcontentloaded (not networkidle) — editor has hot subscriptions.
  await page.goto(`${BASE}/admin/${deviceId}/editor?nosave=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
}

async function clearSelection(page: Page) {
  // Click the canvas background (top-left corner) — won't hit any control.
  // The PanCanvas onClick handler clears selectedIds. We also explicitly
  // clear selectedLabelId since the canvas click handler doesn't.
  await page.evaluate(() => {
    const w = window as unknown as { useEditorStore?: { getState: () => { setSelectedIds: (i: string[]) => void; setSelectedLabel?: (id: string | null) => void } } };
    const state = w.useEditorStore?.getState();
    state?.setSelectedIds([]);
    state?.setSelectedLabel?.(null);
  });
}

async function findFirstLabelId(page: Page): Promise<string | null> {
  // editorLabels is an array on the store; pick the first one that has
  // visible text content.
  return page.evaluate(() => {
    const w = window as unknown as { useEditorStore?: { getState: () => { editorLabels?: Array<{ id: string; text?: string }> } } };
    const labels = w.useEditorStore?.getState?.().editorLabels ?? [];
    const visible = labels.find((l) => (l.text ?? '').trim().length > 0);
    return visible?.id ?? null;
  });
}

async function findFirstControlId(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const w = window as unknown as { useEditorStore?: { getState: () => { controls?: Record<string, { id: string }> } } };
    const controls = w.useEditorStore?.getState?.().controls ?? {};
    const first = Object.values(controls)[0];
    return first?.id ?? null;
  });
}

async function clickLabel(page: Page, labelId: string, opts: { shift?: boolean; meta?: boolean } = {}) {
  const target = page.locator(`[data-label-id="${labelId}"]`).first();
  if (await target.count() === 0) {
    // Fall back to scrolling to it via store
    throw new Error(`label ${labelId} not in DOM — selector failed`);
  }
  await target.click({
    modifiers: opts.shift ? ['Shift'] : opts.meta ? ['Meta'] : [],
    force: true,
  });
  await page.waitForTimeout(150);
}

async function clickControl(page: Page, controlId: string, opts: { shift?: boolean; meta?: boolean } = {}) {
  const target = page.locator(`[data-control-id="${controlId}"]`).first();
  if (await target.count() === 0) {
    throw new Error(`control ${controlId} not in DOM`);
  }
  await target.click({
    modifiers: opts.shift ? ['Shift'] : opts.meta ? ['Meta'] : [],
    force: true,
  });
  await page.waitForTimeout(150);
}

function fmtState(s: StoreSnapshot): string {
  const ids = s.selectedIds.length > 0 ? s.selectedIds.join(', ') : '(none)';
  const lbl = s.selectedLabelId ?? '(none)';
  const sel = s.selection?.length ? s.selection.join(', ') : '(none)';
  return `  selectedIds=[${ids}]  selectedLabelId=${lbl}  selection=[${sel}]`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  await setAdminCookie(ctx);
  const page = await ctx.newPage();

  await openEditor(page, DEVICE_ID);

  const labelId = await findFirstLabelId(page);
  const controlId = await findFirstControlId(page);
  if (!labelId || !controlId) {
    console.error(`! could not find both a label and a control in ${DEVICE_ID}`);
    console.error(`  labelId=${labelId} controlId=${controlId}`);
    await browser.close();
    process.exit(1);
  }
  console.log(`\nTest target: device=${DEVICE_ID}, labelId=${labelId}, controlId=${controlId}\n`);

  // ── Scenario 1: label first, then plain-click control ───────────────────
  await clearSelection(page);
  console.log('[1] click label → plain click control (no modifiers)');
  await clickLabel(page, labelId);
  console.log('    after label click:', fmtState(await readStore(page)));
  await clickControl(page, controlId);
  console.log('    after control click:', fmtState(await readStore(page)));

  // ── Scenario 2: control first, then plain-click label ───────────────────
  await clearSelection(page);
  console.log('\n[2] click control → plain click label (no modifiers)');
  await clickControl(page, controlId);
  console.log('    after control click:', fmtState(await readStore(page)));
  await clickLabel(page, labelId);
  console.log('    after label click:', fmtState(await readStore(page)));

  // ── Scenario 3: label first, then SHIFT-click control ───────────────────
  await clearSelection(page);
  console.log('\n[3] click label → SHIFT-click control');
  await clickLabel(page, labelId);
  console.log('    after label click:', fmtState(await readStore(page)));
  await clickControl(page, controlId, { shift: true });
  console.log('    after shift+control click:', fmtState(await readStore(page)));

  // ── Scenario 4: control first, then SHIFT-click label ───────────────────
  await clearSelection(page);
  console.log('\n[4] click control → SHIFT-click label');
  await clickControl(page, controlId);
  console.log('    after control click:', fmtState(await readStore(page)));
  await clickLabel(page, labelId, { shift: true });
  console.log('    after shift+label click:', fmtState(await readStore(page)));

  // ── Regression assertions — exits non-zero on regression ────────────────
  // Capture final state of scenarios [3] and [4] separately so we can assert.
  await clearSelection(page);
  await clickLabel(page, labelId);
  await clickControl(page, controlId, { shift: true });
  const s3 = await readStore(page);

  await clearSelection(page);
  await clickControl(page, controlId);
  await clickLabel(page, labelId, { shift: true });
  const s4 = await readStore(page);

  const s3Ok = s3.selectedIds.includes(controlId) && s3.selectedLabelId === labelId;
  const s4Ok = s4.selectedIds.includes(controlId) && s4.selectedLabelId === labelId;
  console.log('\n=== regression assertions ===');
  console.log(`  [3] label → shift+control = both selected: ${s3Ok ? 'PASS' : 'FAIL'}`);
  console.log(`  [4] control → shift+label = both selected: ${s4Ok ? 'PASS' : 'FAIL'}`);

  await browser.close();
  if (!s3Ok || !s4Ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
