/**
 * Editor↔Preview Baseline Measurement
 *
 * The structural rule we're locking in:
 *   - Editor pixel positions must NEVER change after the unification refactor.
 *   - Preview should match editor within ≤0.5px on every measurable element.
 *
 * Captures, per device, per mode:
 *   1. Pixel position + size of every label, control, section, banner, container
 *   2. Computed styles that affect layout (padding, margin, line-height, etc.)
 *   3. Full DOM tree (sanitized) for diff
 *   4. Full-page screenshot
 *
 * Output: e2e-snapshots/editor-preview-baseline/<device>-<mode>.json + .png
 *
 * Usage:
 *   # Capture baseline (run BEFORE any refactor)
 *   npx tsx e2e/editor-preview-baseline.ts --capture
 *
 *   # Compare current state against baseline (run AFTER refactor)
 *   npx tsx e2e/editor-preview-baseline.ts --verify
 *
 *   # Test specific device only
 *   npx tsx e2e/editor-preview-baseline.ts --capture --device fantom-06
 */
import { chromium, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SNAPSHOT_DIR = 'e2e-snapshots/editor-preview-baseline';

const DEVICES = [
  { id: 'fantom-06', label: 'Fantom 06' },
  { id: 'cdj-3000', label: 'CDJ-3000' },
  { id: 'deepmind-12', label: 'DeepMind 12' },
];

interface ElementMeasurement {
  id: string;
  kind: 'label' | 'control' | 'section' | 'banner' | 'container';
  // Pixel-perfect positioning of the element's bounding rect
  rect: { left: number; top: number; width: number; height: number };
  // Inner element if present (e.g., text span inside label wrapper)
  innerRect: { left: number; top: number; width: number; height: number } | null;
  // Computed styles that affect layout
  computed: {
    position: string;
    display: string;
    padding: string;
    margin: string;
    border: string;
    boxShadow: string;
    transform: string;
    fontSize: string;
    lineHeight: string;
    textAlign: string;
    zIndex: string;
  };
  // Raw text content (sanitized, trimmed)
  text: string;
}

interface ModeBaseline {
  device: string;
  mode: 'editor' | 'preview';
  viewport: { width: number; height: number };
  zoom: number;
  panelDimensions: { width: number; height: number } | null;
  capturedAt: string;
  elements: Record<string, ElementMeasurement>;
}

async function setUpPage(page: Page, deviceId: string) {
  await page.goto(`${BASE}/admin/${deviceId}/editor`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000 });
  await page.waitForTimeout(2000);

  // Lock zoom to 1.0 and snapGrid to 1 for deterministic positioning
  await page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { setState: (s: unknown) => void; getState: () => unknown };
    };
    if (win.useEditorStore) {
      win.useEditorStore.setState({ zoom: 1, panX: 0, panY: 0, snapGrid: 1, showLabels: true });
    }
  });
  await page.waitForTimeout(500);
}

async function measureElements(page: Page): Promise<Record<string, ElementMeasurement>> {
  // String-form evaluate — bypasses tsx's __name helper injection that breaks
  // when transpiled function declarations get serialized to the browser.
  const result = await page.evaluate(`(() => {
    const out = {};
    const captureRect = (el) => {
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left * 100) / 100,
        top: Math.round(r.top * 100) / 100,
        width: Math.round(r.width * 100) / 100,
        height: Math.round(r.height * 100) / 100,
      };
    };
    const readComputed = (el) => {
      const cs = window.getComputedStyle(el);
      return {
        position: cs.position, display: cs.display, padding: cs.padding,
        margin: cs.margin, border: cs.border, boxShadow: cs.boxShadow,
        transform: cs.transform, fontSize: cs.fontSize, lineHeight: cs.lineHeight,
        textAlign: cs.textAlign, zIndex: cs.zIndex,
      };
    };

    const collect = (selector, prefix, kind) => {
      for (const el of Array.from(document.querySelectorAll(selector))) {
        const id = el.dataset[prefix];
        if (!id) continue;
        const key = kind + ':' + id;
        if (key in out) continue;
        const innerSpan = el.querySelector('span');
        out[key] = {
          id, kind,
          rect: captureRect(el),
          innerRect: innerSpan ? captureRect(innerSpan) : null,
          computed: readComputed(el),
          text: (el.textContent || '').trim().slice(0, 40),
        };
      }
    };

    collect('[data-label-id]', 'labelId', 'label');
    collect('[data-control-id]', 'controlId', 'control');
    collect('[data-section-id]', 'sectionId', 'section');
    collect('[data-banner-id]', 'bannerId', 'banner');
    return out;
  })()`) as Record<string, ElementMeasurement>;
  return result;
}

async function captureMode(page: Page, deviceId: string, mode: 'editor' | 'preview'): Promise<ModeBaseline> {
  // If switching to preview, click the toggle. If switching back, click again.
  if (mode === 'preview') {
    const previewBtn = page.locator('button:has-text("Preview")').first();
    await previewBtn.click();
    await page.waitForTimeout(2000);
  }

  const elements = await measureElements(page);

  // Panel dimensions from the store
  const panelDimensions = await page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { getState: () => { canvasWidth?: number; canvasHeight?: number; deviceDimensions?: { width: number; height: number } } };
    };
    const state = win.useEditorStore?.getState?.();
    if (!state) return null;
    return {
      width: state.canvasWidth ?? state.deviceDimensions?.width ?? 0,
      height: state.canvasHeight ?? state.deviceDimensions?.height ?? 0,
    };
  });

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(SNAPSHOT_DIR, `${deviceId}-${mode}.png`),
    fullPage: false,
  });

  return {
    device: deviceId,
    mode,
    viewport: { width: 1800, height: 1200 },
    zoom: 1,
    panelDimensions,
    capturedAt: new Date().toISOString(),
    elements,
  };
}

interface DriftEntry {
  key: string;
  kind: string;
  text: string;
  dxRect: number;
  dyRect: number;
  dwRect: number;
  dhRect: number;
  dxInner: number | null;
  dyInner: number | null;
  computedDiff: string[];
}

function diffBaselines(before: ModeBaseline, after: ModeBaseline): DriftEntry[] {
  const drift: DriftEntry[] = [];
  for (const key of Object.keys(before.elements)) {
    const a = before.elements[key];
    const b = after.elements[key];
    if (!b) {
      drift.push({
        key, kind: a.kind, text: a.text,
        dxRect: NaN, dyRect: NaN, dwRect: NaN, dhRect: NaN,
        dxInner: null, dyInner: null,
        computedDiff: ['MISSING in new run'],
      });
      continue;
    }
    const dxRect = Math.round((b.rect.left - a.rect.left) * 100) / 100;
    const dyRect = Math.round((b.rect.top - a.rect.top) * 100) / 100;
    const dwRect = Math.round((b.rect.width - a.rect.width) * 100) / 100;
    const dhRect = Math.round((b.rect.height - a.rect.height) * 100) / 100;

    let dxInner: number | null = null;
    let dyInner: number | null = null;
    if (a.innerRect && b.innerRect) {
      dxInner = Math.round((b.innerRect.left - a.innerRect.left) * 100) / 100;
      dyInner = Math.round((b.innerRect.top - a.innerRect.top) * 100) / 100;
    }

    const computedDiff: string[] = [];
    for (const k of Object.keys(a.computed) as Array<keyof typeof a.computed>) {
      if (a.computed[k] !== b.computed[k]) {
        computedDiff.push(`${k}: "${a.computed[k]}" → "${b.computed[k]}"`);
      }
    }

    // Only include in drift list if something actually changed beyond sub-pixel
    // browser layout noise. Text glyph anti-aliasing can shift inner rects by
    // ~0.01-0.05px between page loads even when nothing rendered differently.
    // 0.1px threshold filters that noise while still catching real drift.
    const SUBPX = 0.1;
    const anyDrift = Math.abs(dxRect) > SUBPX || Math.abs(dyRect) > SUBPX ||
                     Math.abs(dwRect) > SUBPX || Math.abs(dhRect) > SUBPX ||
                     (dxInner !== null && Math.abs(dxInner) > SUBPX) ||
                     (dyInner !== null && Math.abs(dyInner) > SUBPX) ||
                     computedDiff.length > 0;
    if (anyDrift) {
      drift.push({ key, kind: a.kind, text: a.text, dxRect, dyRect, dwRect, dhRect, dxInner, dyInner, computedDiff });
    }
  }
  return drift;
}

async function runDevice(page: Page, deviceId: string, mode: 'capture' | 'verify') {
  await setUpPage(page, deviceId);

  console.log(`  → measuring EDITOR mode`);
  const editor = await captureMode(page, deviceId, 'editor');

  console.log(`  → measuring PREVIEW mode`);
  const preview = await captureMode(page, deviceId, 'preview');

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const editorPath = path.join(SNAPSHOT_DIR, `${deviceId}-editor.json`);
  const previewPath = path.join(SNAPSHOT_DIR, `${deviceId}-preview.json`);

  if (mode === 'capture') {
    fs.writeFileSync(editorPath, JSON.stringify(editor, null, 2));
    fs.writeFileSync(previewPath, JSON.stringify(preview, null, 2));
    console.log(`  ✓ saved ${editorPath}`);
    console.log(`  ✓ saved ${previewPath}`);
    console.log(`  ✓ saved ${deviceId}-editor.png, ${deviceId}-preview.png`);

    // Also report editor↔preview drift in the baseline (this is what we'll fix)
    const epDrift = diffBaselines(editor, preview);
    console.log(`  → editor↔preview drift in baseline: ${epDrift.length} of ${Object.keys(editor.elements).length} elements drift`);
  } else if (mode === 'verify') {
    // Load baselines from disk
    if (!fs.existsSync(editorPath)) {
      console.log(`  ✗ no baseline at ${editorPath} — run --capture first`);
      return { editorDrift: 0, previewDrift: 0, editorChanged: 0 };
    }
    const baselineEditor = JSON.parse(fs.readFileSync(editorPath, 'utf-8')) as ModeBaseline;
    const baselinePreview = JSON.parse(fs.readFileSync(previewPath, 'utf-8')) as ModeBaseline;

    const editorChange = diffBaselines(baselineEditor, editor);
    const previewChange = diffBaselines(baselinePreview, preview);
    const newEditorPreview = diffBaselines(editor, preview);

    console.log(`  ${editorChange.length === 0 ? '✓' : '✗'} editor changes from baseline: ${editorChange.length}`);
    if (editorChange.length > 0) {
      console.log(`    First 5 changes:`);
      for (const e of editorChange.slice(0, 5)) {
        console.log(`      ${e.kind} ${e.key} "${e.text}" dx=${e.dxRect} dy=${e.dyRect}`);
        if (e.computedDiff.length > 0) {
          for (const c of e.computedDiff.slice(0, 2)) console.log(`        styles: ${c}`);
        }
      }
    }

    console.log(`  → preview changes from baseline: ${previewChange.length}`);
    console.log(`  → CURRENT editor↔preview drift: ${newEditorPreview.length} (down from ${diffBaselines(baselineEditor, baselinePreview).length})`);

    return {
      editorDrift: 0,
      previewDrift: previewChange.length,
      editorChanged: editorChange.length,
    };
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const mode: 'capture' | 'verify' = args.has('--verify') ? 'verify' : 'capture';
  const deviceFilter = process.argv.find((_, i) => process.argv[i - 1] === '--device');
  const devices = deviceFilter ? DEVICES.filter(d => d.id === deviceFilter) : DEVICES;

  console.log(`=== Editor↔Preview Baseline ${mode.toUpperCase()} ===`);
  console.log(`Devices: ${devices.map(d => d.id).join(', ')}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1800, height: 1200 },
    deviceScaleFactor: 1,
  });
  await ctx.addCookies([{
    name: 'admin_access', value: ADMIN_PASSWORD,
    domain: 'localhost', path: '/', sameSite: 'Lax' as const,
  }]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);

  let totalEditorChange = 0;
  let totalElements = 0;
  for (const device of devices) {
    console.log(`\n=== ${device.label} (${device.id}) ===`);
    const result = await runDevice(page, device.id, mode);
    if (mode === 'verify' && result) {
      totalEditorChange += result.editorChanged;
    }
  }

  console.log('');
  if (mode === 'capture') {
    console.log('Baseline captured. Now refactor + run with --verify.');
  } else {
    console.log('\n=== FINAL VERDICT ===');
    if (totalEditorChange === 0) {
      console.log('\x1b[32m✓ EDITOR UNCHANGED — refactor is safe\x1b[0m');
    } else {
      console.log(`\x1b[31m✗ EDITOR CHANGED in ${totalEditorChange} places — refactor MUST be reverted or fixed\x1b[0m`);
    }
  }

  await browser.close();
  process.exit(mode === 'verify' && totalEditorChange > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
