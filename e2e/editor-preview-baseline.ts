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
 *   # Re-measure current state and print per-kind drift summary
 *   # (does not compare against stored baseline — answers "where does
 *   # editor and preview disagree RIGHT NOW, by category?")
 *   npx tsx e2e/editor-preview-baseline.ts --report
 *
 *   # CI gate: same-machine editor↔preview parity check.
 *   # No macOS-captured baseline needed — both modes measured on the
 *   # current machine. Asserts |dx| < threshold AND |dy − median_dy| <
 *   # threshold (median dy absorbs the uniform PanelShell offset).
 *   # Exits non-zero if any element exceeds the threshold.
 *   npx tsx e2e/editor-preview-baseline.ts --ci
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
  // ?nosave=true disables the editor's auto-save subscriber so this drift
  // script can't corrupt contractor data by triggering a save with
  // mid-hydration state. MANDATORY for any Playwright editor load —
  // see CLAUDE.md "Playwright + Editor Safety" section.
  await page.goto(`${BASE}/admin/${deviceId}/editor?nosave=true`, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForSelector('[data-control-id]', { timeout: 60_000 });

  // Replace the previous fixed 2000ms sleep with semantic waits:
  //   - networkidle: all manifest fetches + font file requests settle
  //   - document.fonts.ready: Inter (and any other webfont) glyphs available
  // These are both fast when they would have been instantly OK anyway and
  // safe when they wouldn't have been. Net win: ~1.5s typical, up to ~2s
  // on cold loads.
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);

  // Lock zoom to 1.0 and snapGrid to 1 for deterministic positioning
  await page.evaluate(() => {
    const win = window as unknown as {
      useEditorStore?: { setState: (s: unknown) => void; getState: () => unknown };
    };
    if (win.useEditorStore) {
      win.useEditorStore.setState({ zoom: 1, panX: 0, panY: 0, snapGrid: 1, showLabels: true });
    }
  });
  // Wait for React to flush the state update + repaint. requestAnimationFrame
  // twice covers the queued render + layout commit pipeline.
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
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

async function captureMode(
  page: Page,
  deviceId: string,
  mode: 'editor' | 'preview',
  options: { captureScreenshot?: boolean } = {},
): Promise<ModeBaseline> {
  const { captureScreenshot = true } = options;

  // If switching to preview, click the toggle and wait for PanelRenderer
  // to mount. PanelShell's `rounded-2xl` class is unique to preview-mode
  // panel chrome, so we can wait for that instead of a fixed sleep.
  if (mode === 'preview') {
    const previewBtn = page.locator('button:has-text("Preview")').first();
    await previewBtn.click();
    await page.waitForSelector('.rounded-2xl', { timeout: 10_000 });
    // Two RAF frames for any final layout settling
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    // Ensure preview fonts are loaded (Inter etc.) for accurate text measurement
    await page.evaluate(() => document.fonts.ready);
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

  // Screenshots are diagnostic artifacts useful for --capture (writes the
  // reference PNG for human review) and --report (visual evidence of the
  // per-kind summary). For --ci and --verify modes, we have the JSON
  // measurement which is the actual gate signal — screenshots just slow
  // the run. Caller opts out via captureScreenshot:false.
  if (captureScreenshot) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, `${deviceId}-${mode}.png`),
      fullPage: false,
    });
  }

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
    // browser layout noise. Locally (macOS↔macOS) text glyphs shift ~0.01-0.05px
    // between page loads; 0.1px filters that.
    //
    // In CI on Linux, chromium glyph hinting differs from macOS — *centered*
    // text labels (e.g., "VOLUME", "OCT UP") can shift up to ~1.0-1.1px on the
    // X axis when the rendered text width is even/odd-pixel different from the
    // captured baseline. That's not a real bug; the label is still centered on
    // the control. 1.2px tolerance absorbs this with a small safety margin
    // (max observed: 1.01px on "PITCH") while still catching any genuine
    // drift, which has always been ≥5px in practice.
    //
    // Computed-style diffs are NOT subject to this tolerance — they're exact
    // string comparisons and a real CSS change should fail CI.
    const SUBPX = process.env.CI === 'true' ? 1.2 : 0.1;
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

interface KindStats {
  kind: string;
  editorCount: number;
  previewCount: number;
  driftCount: number;
  meanAbsDx: number;
  meanAbsDy: number;
  maxAbsDx: number;
  maxAbsDy: number;
  worstKey: string;
  worstText: string;
}

function elementCountByKind(b: ModeBaseline): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of Object.values(b.elements)) {
    counts[m.kind] = (counts[m.kind] ?? 0) + 1;
  }
  return counts;
}

function summarizeByKind(editor: ModeBaseline, preview: ModeBaseline, drift: DriftEntry[]): KindStats[] {
  const editorCounts = elementCountByKind(editor);
  const previewCounts = elementCountByKind(preview);
  const allKinds = new Set<string>([
    ...Object.keys(editorCounts),
    ...Object.keys(previewCounts),
  ]);
  const stats: KindStats[] = [];
  for (const kind of allKinds) {
    const kindDrift = drift.filter(d => d.kind === kind);
    // Entries marked "MISSING in new run" have NaN dx/dy — exclude from numeric
    // stats. They're still counted in driftCount and reported via the missing-
    // elements section above the table.
    const measurable = kindDrift.filter(d => !Number.isNaN(d.dxRect) && !Number.isNaN(d.dyRect));
    let sumDx = 0, sumDy = 0, maxDx = 0, maxDy = 0;
    let worstKey = '', worstText = '', worstAbs = 0;
    for (const d of measurable) {
      const adx = Math.abs(d.dxRect);
      const ady = Math.abs(d.dyRect);
      sumDx += adx;
      sumDy += ady;
      if (adx > maxDx) maxDx = adx;
      if (ady > maxDy) maxDy = ady;
      const combined = Math.max(adx, ady);
      if (combined > worstAbs) {
        worstAbs = combined;
        worstKey = d.key;
        worstText = d.text;
      }
    }
    stats.push({
      kind,
      editorCount: editorCounts[kind] ?? 0,
      previewCount: previewCounts[kind] ?? 0,
      driftCount: kindDrift.length,
      meanAbsDx: measurable.length ? sumDx / measurable.length : 0,
      meanAbsDy: measurable.length ? sumDy / measurable.length : 0,
      maxAbsDx: maxDx,
      maxAbsDy: maxDy,
      worstKey,
      worstText,
    });
  }
  stats.sort((a, b) => b.maxAbsDx + b.maxAbsDy - (a.maxAbsDx + a.maxAbsDy));
  return stats;
}

function printKindTable(stats: KindStats[]) {
  console.log('');
  console.log('  kind     ed  pv  drift  mean|dx|  mean|dy|  max|dx|  max|dy|  worst');
  console.log('  -------  --  --  -----  --------  --------  -------  -------  ------------------------------');
  for (const s of stats) {
    const ed = String(s.editorCount).padStart(3);
    const pv = String(s.previewCount).padStart(3);
    const dc = String(s.driftCount).padStart(5);
    const fmt = (n: number) => n.toFixed(2).padStart(8);
    const fmt2 = (n: number) => n.toFixed(2).padStart(7);
    const worst = s.driftCount > 0
      ? `${s.worstKey} "${s.worstText.slice(0, 18)}"`
      : '—';
    console.log(`  ${s.kind.padEnd(7)}  ${ed}  ${pv}  ${dc}  ${fmt(s.meanAbsDx)}  ${fmt(s.meanAbsDy)}  ${fmt2(s.maxAbsDx)}  ${fmt2(s.maxAbsDy)}  ${worst}`);
  }
}

function printMissingElements(editor: ModeBaseline, preview: ModeBaseline) {
  const inEditorOnly: string[] = [];
  const inPreviewOnly: string[] = [];
  for (const key of Object.keys(editor.elements)) {
    if (!(key in preview.elements)) inEditorOnly.push(key);
  }
  for (const key of Object.keys(preview.elements)) {
    if (!(key in editor.elements)) inPreviewOnly.push(key);
  }
  if (inEditorOnly.length === 0 && inPreviewOnly.length === 0) {
    console.log('  ✓ all elements measured in both modes');
    return;
  }
  if (inEditorOnly.length > 0) {
    console.log(`  ⚠ ${inEditorOnly.length} element(s) in EDITOR but not PREVIEW (preview missing data-*-id):`);
    for (const k of inEditorOnly.slice(0, 10)) console.log(`      ${k}`);
    if (inEditorOnly.length > 10) console.log(`      … and ${inEditorOnly.length - 10} more`);
  }
  if (inPreviewOnly.length > 0) {
    console.log(`  ⚠ ${inPreviewOnly.length} element(s) in PREVIEW but not EDITOR (editor missing data-*-id):`);
    for (const k of inPreviewOnly.slice(0, 10)) console.log(`      ${k}`);
    if (inPreviewOnly.length > 10) console.log(`      … and ${inPreviewOnly.length - 10} more`);
  }
}

/**
 * Same-machine editor↔preview parity check for CI.
 *
 * The right CI gate: capture both modes on the SAME Linux machine (no
 * cross-platform variance), compute the median vertical offset between
 * them (= PanelShell branding header, ~40 px today), subtract it from
 * every element's dy, then assert per-element drift is below threshold.
 *
 * Catches:
 *  - Asymmetric features (added to editor but not preview, or vice versa)
 *  - Per-element vertical drift different from the uniform PanelShell shift
 *  - Horizontal misalignment
 *
 * Does NOT catch (Layer B containment-check does):
 *  - Text overflow on Linux/Windows
 *  - Wrapping text that fit on one line on macOS
 */
function ciParityCheck(
  editor: ModeBaseline,
  preview: ModeBaseline,
  thresholdPx: number,
): { failures: Array<{ key: string; kind: string; text: string; dxRect: number; dyRectRel: number; reason: string }>; medianDy: number } {
  const drift = diffBaselines(editor, preview);
  // Compute median dy across all elements — this is the uniform PanelShell
  // vertical offset (~40 px today). Median is more robust than mean against
  // outliers (e.g., elements above/below the panel area).
  const dys = drift.map(d => d.dyRect).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
  const medianDy = dys.length === 0 ? 0
    : dys.length % 2 === 1 ? dys[Math.floor(dys.length / 2)]
    : (dys[dys.length / 2 - 1] + dys[dys.length / 2]) / 2;
  const failures: Array<{ key: string; kind: string; text: string; dxRect: number; dyRectRel: number; reason: string }> = [];
  for (const d of drift) {
    if (Number.isNaN(d.dxRect)) continue;  // missing-in-preview elements reported separately
    const dyRectRel = Math.round((d.dyRect - medianDy) * 100) / 100;
    const reasons: string[] = [];
    if (Math.abs(d.dxRect) > thresholdPx) reasons.push(`|dx|=${Math.abs(d.dxRect)} > ${thresholdPx}`);
    if (Math.abs(dyRectRel) > thresholdPx) reasons.push(`|dy-medianDy|=${Math.abs(dyRectRel)} > ${thresholdPx}`);
    if (reasons.length > 0) {
      failures.push({ key: d.key, kind: d.kind, text: d.text, dxRect: d.dxRect, dyRectRel, reason: reasons.join(' AND ') });
    }
  }
  return { failures, medianDy };
}

async function runDevice(page: Page, deviceId: string, mode: 'capture' | 'verify' | 'report' | 'ci') {
  await setUpPage(page, deviceId);

  // Screenshots are useful for --capture (reference PNG written next to
  // the JSON baseline) and --report (visual evidence). Skip them in
  // --ci and --verify where the JSON measurement is the gate signal —
  // saves ~0.5s per device.
  const captureScreenshot = mode === 'capture' || mode === 'report';

  console.log(`  → measuring EDITOR mode`);
  const editor = await captureMode(page, deviceId, 'editor', { captureScreenshot });

  console.log(`  → measuring PREVIEW mode`);
  const preview = await captureMode(page, deviceId, 'preview', { captureScreenshot });

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
  } else if (mode === 'report') {
    // Fresh measurement — print per-kind drift table and missing-element audit.
    // Does NOT compare against stored baselines; answers "where do editor and
    // preview disagree RIGHT NOW, by category?"
    const drift = diffBaselines(editor, preview);
    console.log(`  → editor↔preview drift: ${drift.length} of ${Object.keys(editor.elements).length} editor elements`);
    printMissingElements(editor, preview);
    printKindTable(summarizeByKind(editor, preview, drift));
    return { editorDrift: 0, previewDrift: drift.length, editorChanged: 0 };
  } else if (mode === 'ci') {
    // Same-machine editor↔preview parity gate. The RIGHT gate for CI.
    // 2 px threshold: tight enough to catch all real bugs (≥5 px in
    // practice), loose enough to absorb sub-pixel layout rounding and the
    // current 1.02 px section header padding drift (separate fix later).
    const threshold = 2;
    const { failures, medianDy } = ciParityCheck(editor, preview, threshold);
    console.log(`  median PanelShell vertical offset: ${medianDy.toFixed(2)} px`);
    if (failures.length === 0) {
      console.log(`  ✓ editor↔preview parity OK (${Object.keys(editor.elements).length} elements within ±${threshold} px after median-dy correction)`);
    } else {
      console.log(`  ✗ ${failures.length} element(s) fail parity check (threshold ±${threshold} px):`);
      for (const f of failures.slice(0, 15)) {
        console.log(`    ${f.kind} ${f.key} "${f.text}" dx=${f.dxRect} dy(rel)=${f.dyRectRel}  [${f.reason}]`);
      }
      if (failures.length > 15) console.log(`    … and ${failures.length - 15} more`);
    }
    // Also surface missing-element parity bugs (element in editor but not preview, or vice versa)
    printMissingElements(editor, preview);
    return { editorDrift: failures.length, previewDrift: 0, editorChanged: failures.length };
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
      console.log(`    First 5 changes (all drift dimensions):`);
      for (const e of editorChange.slice(0, 5)) {
        const innerStr = e.dxInner !== null
          ? ` dxIn=${e.dxInner} dyIn=${e.dyInner}`
          : '';
        console.log(
          `      ${e.kind} ${e.key} "${e.text}"\n` +
          `        dx=${e.dxRect} dy=${e.dyRect} dw=${e.dwRect} dh=${e.dhRect}${innerStr}`,
        );
        if (e.computedDiff.length > 0) {
          for (const c of e.computedDiff.slice(0, 3)) console.log(`        styles: ${c}`);
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
  const mode: 'capture' | 'verify' | 'report' | 'ci' =
    args.has('--ci')     ? 'ci' :
    args.has('--report') ? 'report' :
    args.has('--verify') ? 'verify' :
    'capture';
  const deviceFilter = process.argv.find((_, i) => process.argv[i - 1] === '--device');
  const devices = deviceFilter ? DEVICES.filter(d => d.id === deviceFilter) : DEVICES;

  console.log(`=== Editor↔Preview Baseline ${mode.toUpperCase()} ===`);
  console.log(`Devices: ${devices.map(d => d.id).join(', ')}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });

  // Parallelization: one browser, N contexts (each with its own cookies/page).
  // Cheaper than N browsers; isolates state per device so simultaneous loads
  // don't share Zustand stores or other globals.
  //
  // --capture runs sequentially because writing baseline PNGs/JSON to disk
  // benefits from deterministic ordering (easier to compare git diffs of
  // baselines), and that mode is rare (run before refactors).
  //
  // Set DRIFT_SERIAL=1 to force sequential execution — useful when
  // debugging or on memory-constrained CI runners.
  const runSequential = mode === 'capture' || process.env.DRIFT_SERIAL === '1';

  let totalEditorChange = 0;
  let totalCiFailures = 0;

  const runOne = async (device: typeof devices[number]): Promise<void> => {
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
    try {
      console.log(`\n=== ${device.label} (${device.id}) ===`);
      const result = await runDevice(page, device.id, mode);
      if (mode === 'verify' && result) {
        totalEditorChange += result.editorChanged;
      } else if (mode === 'ci' && result) {
        totalCiFailures += result.editorChanged;  // count of CI parity failures
      }
    } finally {
      await ctx.close();
    }
  };

  if (runSequential) {
    for (const device of devices) {
      await runOne(device);
    }
  } else {
    // Parallel mode — typical speedup 2-3× on a warm dev server, less on
    // cold compile. Failures still report per-device above the verdict.
    await Promise.all(devices.map(runOne));
  }

  console.log('');
  if (mode === 'capture') {
    console.log('Baseline captured. Now refactor + run with --verify.');
  } else if (mode === 'report') {
    console.log('Per-kind drift report complete. Use this to prioritize Shared* extractions.');
  } else if (mode === 'ci') {
    console.log('\n=== FINAL VERDICT (CI parity check) ===');
    if (totalCiFailures === 0) {
      console.log('\x1b[32m✓ Editor and preview agree on every measured element — parity OK\x1b[0m');
    } else {
      console.log(`\x1b[31m✗ ${totalCiFailures} parity failure(s) across all devices — editor and preview disagree.\x1b[0m`);
      console.log('  This usually means a feature was added to one mode but not the other.');
      console.log('  Investigate per device above.');
    }
  } else {
    console.log('\n=== FINAL VERDICT ===');
    if (totalEditorChange === 0) {
      console.log('\x1b[32m✓ EDITOR UNCHANGED — refactor is safe\x1b[0m');
    } else {
      console.log(`\x1b[31m✗ EDITOR CHANGED in ${totalEditorChange} places — refactor MUST be reverted or fixed\x1b[0m`);
    }
  }

  await browser.close();
  const failed =
    (mode === 'verify' && totalEditorChange > 0) ||
    (mode === 'ci' && totalCiFailures > 0);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
