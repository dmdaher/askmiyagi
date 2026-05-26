import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  partitionTutorialBatch,
  captureFileShas,
  detectModifiedFiles,
} from '../tutorial-skip-existing';

let tmpRoot: string;
const DEVICE_ID = 'test-device';

function tutorialDir(): string {
  return path.join(tmpRoot, 'src/data/tutorials', DEVICE_ID);
}

function createTutorialFile(id: string, content = `// stub tutorial ${id}\n`): void {
  fs.mkdirSync(tutorialDir(), { recursive: true });
  fs.writeFileSync(path.join(tutorialDir(), `${id}.ts`), content);
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skip-existing-test-'));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('partitionTutorialBatch', () => {
  it('returns all-missing when device dir does not exist', () => {
    const result = partitionTutorialBatch(['a', 'b', 'c'], DEVICE_ID, tmpRoot);
    expect(result.existing).toEqual([]);
    expect(result.missing).toEqual(['a', 'b', 'c']);
  });

  it('returns all-existing when every file is on disk', () => {
    createTutorialFile('a');
    createTutorialFile('b');
    createTutorialFile('c');
    const result = partitionTutorialBatch(['a', 'b', 'c'], DEVICE_ID, tmpRoot);
    expect(result.existing).toEqual(['a', 'b', 'c']);
    expect(result.missing).toEqual([]);
  });

  it('returns mixed when some exist and some do not', () => {
    createTutorialFile('a');
    createTutorialFile('c');
    const result = partitionTutorialBatch(['a', 'b', 'c'], DEVICE_ID, tmpRoot);
    expect(result.existing).toEqual(['a', 'c']);
    expect(result.missing).toEqual(['b']);
  });

  it('preserves order of input ids in both partitions', () => {
    createTutorialFile('b');
    const result = partitionTutorialBatch(['c', 'a', 'b'], DEVICE_ID, tmpRoot);
    expect(result.existing).toEqual(['b']);
    expect(result.missing).toEqual(['c', 'a']);
  });

  it('handles empty batch (returns both arrays empty, no crash)', () => {
    const result = partitionTutorialBatch([], DEVICE_ID, tmpRoot);
    expect(result.existing).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it('handles kebab-case tutorial ids (e.g. split-keyboard-zones)', () => {
    createTutorialFile('split-keyboard-zones');
    const result = partitionTutorialBatch(['split-keyboard-zones', 'panel-overview'], DEVICE_ID, tmpRoot);
    expect(result.existing).toEqual(['split-keyboard-zones']);
    expect(result.missing).toEqual(['panel-overview']);
  });
});

describe('captureFileShas', () => {
  it('captures SHAs only for files that exist (skips missing ones silently)', () => {
    createTutorialFile('a', 'content-a');
    // 'b' intentionally not created
    const shas = captureFileShas(['a', 'b'], DEVICE_ID, tmpRoot);
    expect(shas.has('a')).toBe(true);
    expect(shas.has('b')).toBe(false);
    expect(shas.size).toBe(1);
  });

  it('produces stable SHA for unchanged file content', () => {
    createTutorialFile('a', 'stable-content');
    const shas1 = captureFileShas(['a'], DEVICE_ID, tmpRoot);
    const shas2 = captureFileShas(['a'], DEVICE_ID, tmpRoot);
    expect(shas1.get('a')).toBe(shas2.get('a'));
  });

  it('produces different SHA for different content', () => {
    createTutorialFile('a', 'first');
    const shas1 = captureFileShas(['a'], DEVICE_ID, tmpRoot);
    createTutorialFile('a', 'second');
    const shas2 = captureFileShas(['a'], DEVICE_ID, tmpRoot);
    expect(shas1.get('a')).not.toBe(shas2.get('a'));
  });

  it('returns empty map for empty input', () => {
    const shas = captureFileShas([], DEVICE_ID, tmpRoot);
    expect(shas.size).toBe(0);
  });
});

describe('detectModifiedFiles', () => {
  it('returns empty when no files changed', () => {
    createTutorialFile('a', 'unchanged');
    createTutorialFile('b', 'also-unchanged');
    const before = captureFileShas(['a', 'b'], DEVICE_ID, tmpRoot);
    const modified = detectModifiedFiles(before, DEVICE_ID, tmpRoot);
    expect(modified).toEqual([]);
  });

  it('detects modified file (content changed between snapshots)', () => {
    createTutorialFile('a', 'original');
    const before = captureFileShas(['a'], DEVICE_ID, tmpRoot);
    createTutorialFile('a', 'tampered');
    const modified = detectModifiedFiles(before, DEVICE_ID, tmpRoot);
    expect(modified).toEqual(['a']);
  });

  it('detects deleted file as a violation', () => {
    createTutorialFile('a', 'will-be-deleted');
    const before = captureFileShas(['a'], DEVICE_ID, tmpRoot);
    fs.unlinkSync(path.join(tutorialDir(), 'a.ts'));
    const modified = detectModifiedFiles(before, DEVICE_ID, tmpRoot);
    expect(modified).toEqual(['a']);
  });

  it('returns only the changed ids when some changed and others did not', () => {
    createTutorialFile('a', 'a-original');
    createTutorialFile('b', 'b-original');
    createTutorialFile('c', 'c-original');
    const before = captureFileShas(['a', 'b', 'c'], DEVICE_ID, tmpRoot);
    createTutorialFile('b', 'b-tampered'); // only b changed
    const modified = detectModifiedFiles(before, DEVICE_ID, tmpRoot);
    expect(modified).toEqual(['b']);
  });

  it('returns empty when before-map is empty (no files were captured)', () => {
    const before = captureFileShas([], DEVICE_ID, tmpRoot);
    const modified = detectModifiedFiles(before, DEVICE_ID, tmpRoot);
    expect(modified).toEqual([]);
  });
});
