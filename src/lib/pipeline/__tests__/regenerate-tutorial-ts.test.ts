/**
 * Unit tests for PR-J's tutorial regenerator. Pure-data utility, so
 * the tests fully cover string-to-string transformation + filesystem
 * round-trip via a tmpdir.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  kebabToCamel,
  deviceIdToArrayName,
  tutorialToTs,
  indexToTs,
  regenerateTutorialFiles,
} from '../regenerate-tutorial-ts';

describe('kebabToCamel', () => {
  it('converts kebab to camel', () => {
    expect(kebabToCamel('split-keyboard-zones')).toBe('splitKeyboardZones');
    expect(kebabToCamel('media-and-compatibility')).toBe('mediaAndCompatibility');
  });
  it('passes through already-camel ids', () => {
    expect(kebabToCamel('panelOverview')).toBe('panelOverview');
  });
  it('handles single segments', () => {
    expect(kebabToCamel('sampling')).toBe('sampling');
  });
});

describe('deviceIdToArrayName', () => {
  it('builds the array export identifier', () => {
    expect(deviceIdToArrayName('cdj-3000')).toBe('cdj3000Tutorials');
    expect(deviceIdToArrayName('fantom-08')).toBe('fantom08Tutorials');
    expect(deviceIdToArrayName('deepmind-12')).toBe('deepmind12Tutorials');
  });
});

describe('tutorialToTs', () => {
  it('produces a parseable TS module with the expected named export', () => {
    const out = tutorialToTs({
      id: 'media-and-compatibility',
      deviceId: 'cdj-3000',
      title: 'Media & Compatibility',
      steps: [],
    });
    expect(out).toContain(`export const mediaAndCompatibility: Tutorial =`);
    expect(out).toContain(`import { Tutorial } from '@/types/tutorial';`);
    expect(out).toContain(`AUTO-GENERATED`);
  });
  it('round-trips arbitrary tutorial data via JSON.stringify', () => {
    const t = {
      id: 'foo',
      deviceId: 'x',
      title: 'T',
      steps: [{ title: 'a', instruction: 'b', highlightControls: ['X', 'Y'] }],
    };
    const out = tutorialToTs(t);
    // Extract the JSON portion and parse it
    const match = out.match(/export const \w+: Tutorial = (\{[\s\S]*?\});\n$/);
    expect(match).toBeTruthy();
    const parsed = JSON.parse(match![1]);
    expect(parsed).toEqual(t);
  });
});

describe('indexToTs', () => {
  it('imports + exports every tutorial id', () => {
    const out = indexToTs('cdj-3000', [
      { id: 'a-b', steps: [] },
      { id: 'c-d', steps: [] },
    ]);
    expect(out).toContain(`import { aB } from './a-b';`);
    expect(out).toContain(`import { cD } from './c-d';`);
    expect(out).toContain(`export const cdj3000Tutorials: Tutorial[] = [\n  aB,\n  cD,\n];`);
    expect(out).toContain('export {\n  aB,\n  cD,\n};');
  });
  it('emits an empty array for zero tutorials', () => {
    const out = indexToTs('cdj-3000', []);
    expect(out).toContain('export const cdj3000Tutorials: Tutorial[] = [\n\n];');
  });
});

describe('regenerateTutorialFiles — filesystem round-trip', () => {
  let tmp: string;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-j-regen-'));
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writes one file per tutorial + index.ts', () => {
    const r = regenerateTutorialFiles('cdj-3000', [
      { id: 't1', deviceId: 'cdj-3000', steps: [] },
      { id: 't2', deviceId: 'cdj-3000', steps: [] },
    ], tmp);
    expect(r.ok).toBe(true);
    expect(r.tutorialCount).toBe(2);
    expect(fs.existsSync(path.join(tmp, 't1.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 't2.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'index.ts'))).toBe(true);
  });

  it('removes stale .ts files no longer in the canvas state', () => {
    // First run: 3 tutorials
    regenerateTutorialFiles('cdj-3000', [
      { id: 't1', steps: [] },
      { id: 't2', steps: [] },
      { id: 'stale', steps: [] },
    ], tmp);
    expect(fs.existsSync(path.join(tmp, 'stale.ts'))).toBe(true);

    // Second run: 'stale' dropped
    regenerateTutorialFiles('cdj-3000', [
      { id: 't1', steps: [] },
      { id: 't2', steps: [] },
    ], tmp);
    expect(fs.existsSync(path.join(tmp, 'stale.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tmp, 't1.ts'))).toBe(true);
  });

  it('is idempotent — same input produces byte-identical files', () => {
    const t = [{ id: 'media-and-compatibility', deviceId: 'cdj-3000', steps: [], title: 'T' }];
    regenerateTutorialFiles('cdj-3000', t, tmp);
    const first = fs.readFileSync(path.join(tmp, 'media-and-compatibility.ts'), 'utf-8');
    const firstIdx = fs.readFileSync(path.join(tmp, 'index.ts'), 'utf-8');
    regenerateTutorialFiles('cdj-3000', t, tmp);
    expect(fs.readFileSync(path.join(tmp, 'media-and-compatibility.ts'), 'utf-8')).toBe(first);
    expect(fs.readFileSync(path.join(tmp, 'index.ts'), 'utf-8')).toBe(firstIdx);
  });

  it('preserves non-.ts files in the output dir', () => {
    fs.writeFileSync(path.join(tmp, 'README.md'), 'hello');
    regenerateTutorialFiles('cdj-3000', [{ id: 't1', steps: [] }], tmp);
    expect(fs.existsSync(path.join(tmp, 'README.md'))).toBe(true);
  });

  it('round-trips a fix applied to tutorial text', () => {
    // This is the gold-path proof that PR-I → PR-J closes the loop:
    // an admin patches the title on the canvas; regeneration writes
    // a .ts file that contains the patched title.
    const tutorials = [{
      id: 'media-and-compatibility',
      deviceId: 'cdj-3000',
      title: 'Welcome — Supported Media (PATCHED BY PR-I)',
      steps: [],
    }];
    regenerateTutorialFiles('cdj-3000', tutorials, tmp);
    const tsContent = fs.readFileSync(path.join(tmp, 'media-and-compatibility.ts'), 'utf-8');
    expect(tsContent).toContain('PATCHED BY PR-I');
  });
});
