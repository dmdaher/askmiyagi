/**
 * Unit tests for loadValidControlIds — the manifest-source-resolution helper
 * extracted from src/__tests__/tutorials/tutorialControlRefs.test.ts so the
 * pipeline's tutorial-review pause can reuse it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadValidControlIds } from '@/lib/tutorial/loadValidControlIds';

describe('loadValidControlIds', () => {
  let tmpRoot: string;
  let manifestsDir: string;
  let pipelineDir: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lvci-'));
    manifestsDir = path.join(tmpRoot, 'manifests');
    pipelineDir = path.join(tmpRoot, 'pipeline');
    fs.mkdirSync(manifestsDir, { recursive: true });
    fs.mkdirSync(pipelineDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  function writeCommittedManifest(deviceId: string, ids: string[]) {
    fs.writeFileSync(
      path.join(manifestsDir, `${deviceId}.json`),
      JSON.stringify({ controls: ids.map(id => ({ id })) }),
    );
  }

  function writePipelineManifest(deviceId: string, ids: string[]) {
    const file = path.join(pipelineDir, deviceId, 'manifest.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ controls: ids.map(id => ({ id })) }));
  }

  it('loads control IDs from committed manifest when present', async () => {
    writeCommittedManifest('test-device', ['c1', 'c2', 'c3']);
    const ids = await loadValidControlIds('test-device', { manifestsDir, pipelineDir });
    expect(ids).toEqual(new Set(['c1', 'c2', 'c3']));
  });

  it('falls back to pipeline manifest when committed missing', async () => {
    writePipelineManifest('test-device', ['p1', 'p2']);
    const ids = await loadValidControlIds('test-device', { manifestsDir, pipelineDir });
    expect(ids).toEqual(new Set(['p1', 'p2']));
  });

  it('prefers pipeline manifest when preferPipelineManifest: true', async () => {
    writeCommittedManifest('test-device', ['committed']);
    writePipelineManifest('test-device', ['in-progress-1', 'in-progress-2']);
    const ids = await loadValidControlIds('test-device', {
      manifestsDir,
      pipelineDir,
      preferPipelineManifest: true,
    });
    expect(ids).toEqual(new Set(['in-progress-1', 'in-progress-2']));
  });

  it('returns null when no source exists and no panel-layout module', async () => {
    const ids = await loadValidControlIds('totally-fake-device', { manifestsDir, pipelineDir });
    expect(ids).toBeNull();
  });

  it('handles malformed manifest JSON by falling through to next source', async () => {
    fs.writeFileSync(path.join(manifestsDir, 'test-device.json'), '{not-json');
    writePipelineManifest('test-device', ['fallback']);
    const ids = await loadValidControlIds('test-device', { manifestsDir, pipelineDir });
    expect(ids).toEqual(new Set(['fallback']));
  });

  it('ignores manifest without controls array', async () => {
    fs.writeFileSync(
      path.join(manifestsDir, 'test-device.json'),
      JSON.stringify({ notControls: [] }),
    );
    writePipelineManifest('test-device', ['fallback']);
    const ids = await loadValidControlIds('test-device', { manifestsDir, pipelineDir });
    expect(ids).toEqual(new Set(['fallback']));
  });
});
