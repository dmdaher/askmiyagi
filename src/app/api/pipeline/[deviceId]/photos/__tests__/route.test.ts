/**
 * Unit tests for the photo-search-dir builder used by
 * /api/pipeline/[deviceId]/photos.
 *
 * Background: prior to this change, the route only searched
 *   docs/<manufacturer>/<deviceId>/photos
 *   docs/<manufacturer>/<deviceName>/photos
 *   .worktrees/<deviceId>/docs/<manufacturer>/<deviceId>/photos
 *   docs/<manufacturer-no-spaces>/<deviceId>/photos
 * Brand-new devices whose photos still lived at .pipeline/<id>/input/photos/
 * (where preflight puts them) showed `{"photos":[]}` in the editor — see
 * the dj-ddj-rev1 incident on 2026-05-28.
 *
 * The fallback to .pipeline/<id>/input/photos/ closes that gap. These
 * tests pin the search order so future refactors don't accidentally
 * re-introduce the bug.
 */
import { describe, expect, it } from 'vitest';
import path from 'path';
import { buildPhotoSearchDirs } from '../dirs';

describe('buildPhotoSearchDirs', () => {
  it('includes the .pipeline/<id>/input/photos fallback (regression: dj-ddj-rev1)', () => {
    const dirs = buildPhotoSearchDirs('dj-ddj-rev1', 'Pioneer', 'DJ DDJ-REV1');
    expect(dirs).toContain(path.join('.pipeline', 'dj-ddj-rev1', 'input', 'photos'));
  });

  it('puts .pipeline/ fallback LAST so docs/ takes precedence', () => {
    const dirs = buildPhotoSearchDirs('cdj-3000', 'Pioneer', 'CDJ-3000');
    const pipelineIdx = dirs.indexOf(path.join('.pipeline', 'cdj-3000', 'input', 'photos'));
    const docsIdx = dirs.indexOf(path.join('docs', 'Pioneer', 'CDJ-3000', 'photos'));
    expect(pipelineIdx).toBeGreaterThan(docsIdx);
    expect(pipelineIdx).toBe(dirs.length - 1); // truly last
  });

  it('preserves the original 4 search paths', () => {
    const dirs = buildPhotoSearchDirs('test-device', 'TestCo', 'Test Device');
    expect(dirs).toContain(path.join('docs', 'TestCo', 'test-device', 'photos'));
    expect(dirs).toContain(path.join('docs', 'TestCo', 'Test Device', 'photos'));
    expect(dirs).toContain(
      path.join('.worktrees', 'test-device', 'docs', 'TestCo', 'test-device', 'photos'),
    );
    expect(dirs).toContain(path.join('docs', 'TestCo', 'test-device', 'photos'));
  });

  it('strips spaces from manufacturer for the no-spaces variant', () => {
    const dirs = buildPhotoSearchDirs('dev-1', 'Pioneer DJ', 'Some Device');
    expect(dirs).toContain(path.join('docs', 'PioneerDJ', 'dev-1', 'photos'));
  });

  it('returns at least 5 distinct dirs total (4 original + 1 fallback)', () => {
    const dirs = buildPhotoSearchDirs('any-device', 'AnyMfr', 'Any Device');
    expect(dirs.length).toBeGreaterThanOrEqual(5);
  });
});
