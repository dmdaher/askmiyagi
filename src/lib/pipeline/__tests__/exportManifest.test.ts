/**
 * Tests for `exportManifest` — the shared export logic invoked by
 * the manifest PUT (auto-export on save), the existing export-manifest
 * route (manual override), and pull-from-hosted.
 *
 * Uses a tmpdir with fixture .pipeline/<deviceId>/ files. No real
 * contractor data touched.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Import dynamically so we can chdir into the tmpdir first.
let exportManifest: (deviceId: string) => any;

const TEST_DEVICE = 'sentinel-device';

let tmpdir: string;
let originalCwd: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-manifest-test-'));
  process.chdir(tmpdir);
  // Re-import to pick up the new cwd
  exportManifest = (await import('../exportManifest?t=' + Date.now())).exportManifest;
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpdir, { recursive: true, force: true });
});

function setupDevice(deviceId: string, editorData: any, mainManifest?: any) {
  const dir = path.join(tmpdir, '.pipeline', deviceId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest-editor.json'), JSON.stringify(editorData));
  if (mainManifest) {
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(mainManifest));
  }
}

function readProductionManifest(deviceId: string): any {
  const p = path.join(tmpdir, 'src', 'data', 'manifests', `${deviceId}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('exportManifest — missing source', () => {
  it('returns ok=false when no editor manifest exists', () => {
    const r = exportManifest('nonexistent-device');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('No editor manifest');
  });
});

describe('exportManifest — basic export', () => {
  it('reads .pipeline/<id>/manifest-editor.json and writes src/data/manifests/<id>.json', () => {
    setupDevice(TEST_DEVICE, {
      deviceId: TEST_DEVICE,
      deviceName: 'Sentinel',
      manufacturer: 'TestCo',
      canvasWidth: 1200,
      canvasHeight: 800,
      controlScale: 1,
      sections: { 'sec-1': { id: 'sec-1', x: 0, y: 0, w: 100, h: 100 } },
      controls: { 'ctrl-1': { id: 'ctrl-1', type: 'button', label: 'PLAY', x: 10, y: 10, w: 50, h: 50, shape: 'circle' } },
      editorLabels: [{ id: 'lbl-1', text: 'play', x: 30, y: 70, fontSize: 8, controlId: 'ctrl-1' }],
    });

    const r = exportManifest(TEST_DEVICE);
    expect(r.ok).toBe(true);
    expect(r.controls).toBe(1);
    expect(r.sections).toBe(1);
    expect(r.labels).toBe(1);

    const prod = readProductionManifest(TEST_DEVICE);
    expect(prod.deviceId).toBe(TEST_DEVICE);
    expect(prod.deviceName).toBe('Sentinel');
    expect(prod.manufacturer).toBe('TestCo');
    expect(prod.controls).toHaveLength(1);
    expect(prod.controls[0].id).toBe('ctrl-1');
    expect(prod.controls[0].shape).toBe('circle');
    expect(prod.editorLabels).toHaveLength(1);
    expect(prod.editorLabels[0].controlId).toBe('ctrl-1');
  });
});

describe('exportManifest — production allowlist (editor-only fields stripped)', () => {
  it('strips locked, resizeLocked, ledOn, spatialNeighbors (editor-only fields)', () => {
    setupDevice(TEST_DEVICE, {
      deviceId: TEST_DEVICE,
      canvasWidth: 800,
      canvasHeight: 600,
      sections: {},
      controls: {
        'ctrl-1': {
          id: 'ctrl-1',
          type: 'button',
          label: 'X',
          x: 0,
          y: 0,
          w: 30,
          h: 30,
          locked: true,             // editor-only — should be stripped
          resizeLocked: true,        // editor-only — should be stripped
          ledOn: true,               // editor-only design-time field — stripped (tutorials drive runtime LED state)
          spatialNeighbors: { above: null, below: null, left: null, right: null }, // pipeline enrichment — stripped
          functionalGroup: 'g',      // pipeline enrichment — stripped
          shape: 'circle',           // production allowlist — kept
          ledColor: '#22c55e',       // production allowlist — kept
        },
      },
      editorLabels: [],
    });

    const r = exportManifest(TEST_DEVICE);
    expect(r.ok).toBe(true);
    const ctrl = readProductionManifest(TEST_DEVICE).controls[0];
    expect(ctrl.locked).toBeUndefined();
    expect(ctrl.resizeLocked).toBeUndefined();
    expect(ctrl.ledOn).toBeUndefined();
    expect(ctrl.spatialNeighbors).toBeUndefined();
    expect(ctrl.functionalGroup).toBeUndefined();
    // Production fields preserved
    expect(ctrl.shape).toBe('circle');
    expect(ctrl.ledColor).toBe('#22c55e');
  });
});

describe('exportManifest — merge with pipeline manifest', () => {
  it('pulls groupLabels from pipeline manifest.json when editor doesnt have them', () => {
    setupDevice(
      TEST_DEVICE,
      {
        deviceId: TEST_DEVICE,
        canvasWidth: 800,
        canvasHeight: 600,
        sections: {},
        controls: {},
        editorLabels: [],
      },
      {
        groupLabels: [{ id: 'gl-1', text: 'OSC', position: 'above', controlIds: [] }],
        keyboard: null,
      },
    );

    // Run the export, then read the production manifest
    const r = exportManifest(TEST_DEVICE);
    expect(r.ok).toBe(true);
    const prod = readProductionManifest(TEST_DEVICE);
    expect(prod.groupLabels).toHaveLength(1);
    expect(prod.groupLabels[0].text).toBe('OSC');
  });
});

describe('exportManifest — array vs dict shape compatibility', () => {
  it('handles controls/sections in DICT shape (Record<id, Def>)', () => {
    setupDevice(TEST_DEVICE, {
      deviceId: TEST_DEVICE,
      canvasWidth: 800,
      canvasHeight: 600,
      sections: { 's1': { id: 's1', x: 0, y: 0, w: 100, h: 100 } },
      controls: { 'c1': { id: 'c1', type: 'button', label: 'X', x: 0, y: 0, w: 30, h: 30 } },
      editorLabels: [],
    });
    const r = exportManifest(TEST_DEVICE);
    expect(r.ok).toBe(true);
    expect(r.controls).toBe(1);
    expect(r.sections).toBe(1);
  });

  it('handles controls/sections in ARRAY shape (after API normalization)', () => {
    setupDevice(TEST_DEVICE, {
      deviceId: TEST_DEVICE,
      canvasWidth: 800,
      canvasHeight: 600,
      sections: [{ id: 's1', x: 0, y: 0, w: 100, h: 100 }],
      controls: [{ id: 'c1', type: 'button', label: 'X', x: 0, y: 0, w: 30, h: 30 }],
      editorLabels: [],
    });
    const r = exportManifest(TEST_DEVICE);
    expect(r.ok).toBe(true);
    expect(r.controls).toBe(1);
    expect(r.sections).toBe(1);
  });
});

describe('exportManifest — idempotent', () => {
  it('running twice produces identical output', () => {
    setupDevice(TEST_DEVICE, {
      deviceId: TEST_DEVICE,
      canvasWidth: 800,
      canvasHeight: 600,
      sections: { 's1': { id: 's1', x: 0, y: 0, w: 100, h: 100 } },
      controls: { 'c1': { id: 'c1', type: 'button', label: 'X', x: 0, y: 0, w: 30, h: 30 } },
      editorLabels: [{ id: 'l1', text: 'A', x: 0, y: 0, fontSize: 8 }],
    });
    exportManifest(TEST_DEVICE);
    const first = JSON.parse(fs.readFileSync(path.join(tmpdir, 'src/data/manifests', `${TEST_DEVICE}.json`), 'utf-8'));
    exportManifest(TEST_DEVICE);
    const second = JSON.parse(fs.readFileSync(path.join(tmpdir, 'src/data/manifests', `${TEST_DEVICE}.json`), 'utf-8'));
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
