import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Phase 9 — preflight manual durability.
 *
 * Locks in the path-resolution invariant that the dj-xdj-rr / minimoog
 * preflight bug violated: when the agent downloads PDFs into the
 * worktree's `docs/<vendor>/<device>/` directory, the runner must copy
 * them to durable `.pipeline/<id>/input/manuals/` storage AND update
 * `state.manualPaths` to point at the durable location.
 *
 * Pre-fix: `path.resolve(manualPath)` resolved worktree-relative paths
 * against `process.cwd()` (main repo), so `fs.existsSync` returned
 * false and the copy silently skipped. Durable storage stayed empty.
 *
 * These tests model the staging logic without invoking the full
 * runner — they verify the path-resolution + copy + state-update
 * sequence in isolation.
 */

let tmpRoot: string;
let mainCwd: string;
let worktreeCwd: string;
let durableManualsDir: string;
let agentDownloadDir: string;
const deviceId = 'test-device';
const manufacturer = 'TestVendor';

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-staging-'));
  mainCwd = path.join(tmpRoot, 'main-repo');
  worktreeCwd = path.join(tmpRoot, 'main-repo', '.worktrees', deviceId);
  durableManualsDir = path.join(mainCwd, '.pipeline', deviceId, 'input', 'manuals');
  agentDownloadDir = path.join(worktreeCwd, 'docs', manufacturer, deviceId);

  fs.mkdirSync(mainCwd, { recursive: true });
  fs.mkdirSync(worktreeCwd, { recursive: true });
  fs.mkdirSync(agentDownloadDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

/**
 * Replicates the fixed staging block from `scripts/pipeline-runner.ts`
 * (post-Phase-9). Operates on real fs so we catch path-resolution bugs.
 */
function stageManualsToDurable(state: { manualPaths: string[] }, worktree: string, manualsDestDir: string, mainCwdForResolve: string): { manualPaths: string[]; staged: string[]; skipped: string[] } {
  fs.mkdirSync(manualsDestDir, { recursive: true });
  const durableManualPaths: string[] = [];
  const staged: string[] = [];
  const skipped: string[] = [];

  for (const manualPath of state.manualPaths) {
    const absSource = path.resolve(worktree, manualPath);
    if (fs.existsSync(absSource)) {
      const cleanName = path.basename(manualPath);
      const durableAbsDest = path.join(manualsDestDir, cleanName);
      fs.copyFileSync(absSource, durableAbsDest);
      durableManualPaths.push(path.relative(mainCwdForResolve, durableAbsDest));
      staged.push(cleanName);
    } else {
      skipped.push(manualPath);
    }
  }

  return {
    manualPaths: durableManualPaths.length > 0 ? durableManualPaths : state.manualPaths,
    staged,
    skipped,
  };
}

describe('Phase 9 — preflight manual durability', () => {
  it('copies a worktree-relative PDF to durable storage', () => {
    // Simulate agent downloading a manual into the worktree's docs/ dir
    const pdfName = 'XDJ-RR_manual_en.pdf';
    const pdfWorktreeAbs = path.join(agentDownloadDir, pdfName);
    fs.writeFileSync(pdfWorktreeAbs, 'PDF-1.6 (mock)');

    // state.manualPaths is set worktree-relative (matches line 547 in runner)
    const worktreeRelPath = path.relative(worktreeCwd, pdfWorktreeAbs);
    const state = { manualPaths: [worktreeRelPath] };

    const result = stageManualsToDurable(state, worktreeCwd, durableManualsDir, mainCwd);

    expect(result.staged).toEqual([pdfName]);
    expect(result.skipped).toEqual([]);
    expect(fs.existsSync(path.join(durableManualsDir, pdfName))).toBe(true);
    expect(result.manualPaths[0]).toBe(path.relative(mainCwd, path.join(durableManualsDir, pdfName)));
  });

  it('updates state.manualPaths to durable location after staging', () => {
    const pdfName = 'manual.pdf';
    fs.writeFileSync(path.join(agentDownloadDir, pdfName), 'PDF');
    const state = { manualPaths: [path.relative(worktreeCwd, path.join(agentDownloadDir, pdfName))] };

    const result = stageManualsToDurable(state, worktreeCwd, durableManualsDir, mainCwd);

    // The path should now be relative to mainCwd, pointing at durable storage
    expect(result.manualPaths[0]).toContain('.pipeline');
    expect(result.manualPaths[0]).toContain('input');
    expect(result.manualPaths[0]).toContain('manuals');
    expect(result.manualPaths[0]).toContain(pdfName);
    // Must NOT contain 'docs/' (the old worktree-only path)
    expect(result.manualPaths[0]).not.toContain('docs');
  });

  it('regression: BUG REPRO — naive path.resolve(manualPath) without worktreeCwd fails', () => {
    // This test documents the pre-fix bug so it can never come back silently.
    const pdfName = 'manual.pdf';
    fs.writeFileSync(path.join(agentDownloadDir, pdfName), 'PDF');
    const worktreeRelPath = path.relative(worktreeCwd, path.join(agentDownloadDir, pdfName));

    // Old buggy resolution (resolves against process.cwd, NOT worktreeCwd)
    const buggyAbsSource = path.resolve(worktreeRelPath);
    // The buggy path resolves to a location that doesn't exist
    expect(fs.existsSync(buggyAbsSource)).toBe(false);

    // The correct resolution does exist
    const correctAbsSource = path.resolve(worktreeCwd, worktreeRelPath);
    expect(fs.existsSync(correctAbsSource)).toBe(true);
  });

  it('handles multiple manuals — all get staged', () => {
    const pdfs = ['main.pdf', 'service.pdf', 'quickstart.pdf'];
    pdfs.forEach((p) => fs.writeFileSync(path.join(agentDownloadDir, p), 'PDF'));
    const state = {
      manualPaths: pdfs.map((p) => path.relative(worktreeCwd, path.join(agentDownloadDir, p))),
    };

    const result = stageManualsToDurable(state, worktreeCwd, durableManualsDir, mainCwd);

    expect(result.staged.sort()).toEqual(pdfs.sort());
    for (const p of pdfs) {
      expect(fs.existsSync(path.join(durableManualsDir, p))).toBe(true);
    }
  });

  it('skips missing source files without crashing', () => {
    const state = { manualPaths: ['docs/Vendor/device/nonexistent.pdf'] };
    const result = stageManualsToDurable(state, worktreeCwd, durableManualsDir, mainCwd);

    expect(result.staged).toEqual([]);
    expect(result.skipped).toEqual(['docs/Vendor/device/nonexistent.pdf']);
    // State paths preserved when nothing was staged (so resume retries can find them)
    expect(result.manualPaths).toEqual(['docs/Vendor/device/nonexistent.pdf']);
  });

  it('mixed: some staged, some missing — only successfully-staged paths replace state', () => {
    fs.writeFileSync(path.join(agentDownloadDir, 'real.pdf'), 'PDF');
    const state = {
      manualPaths: [
        path.relative(worktreeCwd, path.join(agentDownloadDir, 'real.pdf')),
        'docs/Vendor/device/missing.pdf',
      ],
    };

    const result = stageManualsToDurable(state, worktreeCwd, durableManualsDir, mainCwd);

    expect(result.staged).toEqual(['real.pdf']);
    expect(result.skipped).toEqual(['docs/Vendor/device/missing.pdf']);
    // Only the durable path replaces state (missing one drops out)
    expect(result.manualPaths.length).toBe(1);
    expect(result.manualPaths[0]).toContain('real.pdf');
  });

  it('survives worktree cleanup — manual stays at durable location', () => {
    const pdfName = 'manual.pdf';
    fs.writeFileSync(path.join(agentDownloadDir, pdfName), 'PDF');
    const state = { manualPaths: [path.relative(worktreeCwd, path.join(agentDownloadDir, pdfName))] };

    stageManualsToDurable(state, worktreeCwd, durableManualsDir, mainCwd);

    // Simulate the runner's worktree cleanup step
    fs.rmSync(worktreeCwd, { recursive: true });

    // Durable manual still there
    expect(fs.existsSync(path.join(durableManualsDir, pdfName))).toBe(true);
  });
});
