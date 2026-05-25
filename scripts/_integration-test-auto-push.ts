#!/usr/bin/env npx tsx
/**
 * Integration test for pushPhaseOutputToBackupBranch.
 * Simulates realistic pipeline scenarios using real git repos (not mocks).
 *
 * Each scenario sets up a fake repo that mirrors what a real worktree looks
 * like at a given pipeline phase, runs the helper, then asserts the resulting
 * git state.
 *
 * This file lives in scripts/ (which tsc ignores) and is invoked via npx tsx.
 * Cleanup is automatic at the end.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pushPhaseOutputToBackupBranch } from '../src/lib/pipeline/auto-push';

const SCENARIOS: { name: string; run: () => Promise<void> }[] = [];

let passed = 0;
let failed = 0;
const failures: string[] = [];

function scenario(name: string, fn: () => Promise<void>) {
  SCENARIOS.push({ name, run: fn });
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function g(cwd: string, cmd: string): string {
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function mkLocalRemotePair(): { local: string; remote: string; cleanup: () => void } {
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-'));
  const local = fs.mkdtempSync(path.join(os.tmpdir(), 'local-'));

  // Create bare remote (real GitHub-style)
  g(remote, 'git init --bare -q');

  // Create local repo with main branch + remote
  g(local, 'git init -q -b main');
  g(local, 'git config user.email test@test');
  g(local, 'git config user.name test');
  g(local, `git remote add origin ${remote}`);
  g(local, 'git commit --allow-empty -m "init" -q');
  g(local, 'git push -u origin main 2>&1 || true');

  return {
    local,
    remote,
    cleanup: () => {
      fs.rmSync(remote, { recursive: true, force: true });
      fs.rmSync(local, { recursive: true, force: true });
    },
  };
}

function writeFile(repoCwd: string, relPath: string, contents: string) {
  const full = path.join(repoCwd, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
}

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 1: First phase ever — display-build, fresh worktree, no prior pipeline branch
// ───────────────────────────────────────────────────────────────────────────
scenario('1: first display-build on a fresh worktree pushes to new pipeline/<id> branch', async () => {
  const { local, remote, cleanup } = mkLocalRemotePair();
  try {
    // Simulate display-builder agent writing 22 component files
    for (let i = 0; i < 22; i++) {
      writeFile(local, `src/components/devices/cdj-3000/display/atoms/Atom${i}.tsx`, `export default function A${i}() { return null; }\n`);
    }

    const result = pushPhaseOutputToBackupBranch({
      deviceId: 'cdj-3000',
      phase: 'phase-5-display-build',
      worktreeCwd: local,
      paths: ['src/components/devices/cdj-3000/display/'],
    });

    assert(result.kind === 'pushed', `expected pushed, got ${JSON.stringify(result)}`);
    if (result.kind === 'pushed') {
      assert(result.branch === 'pipeline/cdj-3000', `branch was ${result.branch}`);
    }

    // Verify branch exists on remote
    const remoteBranches = g(local, 'git ls-remote --heads origin');
    assert(remoteBranches.includes('refs/heads/pipeline/cdj-3000'), `remote should have pipeline/cdj-3000: ${remoteBranches}`);

    // Verify all 22 files are in the pushed commit
    const filesInCommit = g(local, `git diff-tree --no-commit-id --name-only -r $(git ls-remote origin refs/heads/pipeline/cdj-3000 | awk '{print $1}')`);
    const fileCount = filesInCommit.split('\n').filter((l) => l.includes('Atom')).length;
    assert(fileCount === 22, `expected 22 files in commit, got ${fileCount}`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 2: Tutorial-build runs AFTER display-build — both push to same pipeline/<id>
// ───────────────────────────────────────────────────────────────────────────
scenario('2: sequential phases (display-build → tutorial-build) both push to same branch', async () => {
  const { local, remote, cleanup } = mkLocalRemotePair();
  try {
    // Phase 1: display-build
    writeFile(local, 'src/components/devices/x/display/DisplayScreen.tsx', 'export default function() { return null; }\n');
    const r1 = pushPhaseOutputToBackupBranch({
      deviceId: 'x',
      phase: 'phase-5-display-build',
      worktreeCwd: local,
      paths: ['src/components/devices/x/display/'],
    });
    assert(r1.kind === 'pushed', `phase 1 should push: ${JSON.stringify(r1)}`);

    // Phase 2: tutorial-build (later in real pipeline)
    writeFile(local, 'src/data/tutorials/x/lesson1.ts', 'export const t = { id: "x" };\n');
    const r2 = pushPhaseOutputToBackupBranch({
      deviceId: 'x',
      phase: 'phase-5-tutorial-build',
      worktreeCwd: local,
      paths: ['src/data/tutorials/x/'],
    });
    assert(r2.kind === 'pushed', `phase 2 should push: ${JSON.stringify(r2)}`);

    // Verify both commits are on pipeline/x in order
    g(local, 'git fetch origin');
    const log = g(local, 'git log origin/pipeline/x --oneline');
    const lines = log.split('\n');
    assert(lines.length === 3, `expected 3 commits (init + 2 phases), got ${lines.length}: ${log}`);
    assert(lines[0].includes('tutorial-build'), `latest commit should be tutorial-build: ${lines[0]}`);
    assert(lines[1].includes('display-build'), `2nd commit should be display-build: ${lines[1]}`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 3: Re-run after no-op (phase ran twice, no new changes) — should be no-op
// ───────────────────────────────────────────────────────────────────────────
scenario('3: re-run with no new changes returns no-changes (skips empty commit)', async () => {
  const { local, cleanup } = mkLocalRemotePair();
  try {
    writeFile(local, 'src/data/tutorials/y/a.ts', 'export const a = 1;\n');
    const r1 = pushPhaseOutputToBackupBranch({
      deviceId: 'y',
      phase: 'phase-5-tutorial-build',
      worktreeCwd: local,
      paths: ['src/data/tutorials/y/'],
    });
    assert(r1.kind === 'pushed', `r1 kind=${r1.kind}`);

    // No new files written — second call should be no-op
    const r2 = pushPhaseOutputToBackupBranch({
      deviceId: 'y',
      phase: 'phase-5-tutorial-build',
      worktreeCwd: local,
      paths: ['src/data/tutorials/y/'],
    });
    assert(r2.kind === 'no-changes', `expected no-changes, got ${JSON.stringify(r2)}`);

    // Verify no empty commit was created
    const log = g(local, 'git log origin/pipeline/y --oneline');
    assert(log.split('\n').length === 2, `expected 2 commits (init + 1 phase), got ${log.split('\n').length}`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 4: Lease conflict — remote pipeline/<id> moved unexpectedly
// ───────────────────────────────────────────────────────────────────────────
scenario('4: force-with-lease ABORTS when remote pipeline/<id> moved unexpectedly', async () => {
  const { local, remote, cleanup } = mkLocalRemotePair();
  try {
    // Initial push — establishes pipeline/z on remote
    writeFile(local, 'src/data/tutorials/z/a.ts', 'export const a = 1;\n');
    const r1 = pushPhaseOutputToBackupBranch({
      deviceId: 'z', phase: 'phase-5-tutorial-build', worktreeCwd: local,
      paths: ['src/data/tutorials/z/'],
    });
    assert(r1.kind === 'pushed', `r1: ${JSON.stringify(r1)}`);

    // Simulate a human (or different agent) pushing a commit to pipeline/z FROM A DIFFERENT clone
    const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'clone-'));
    g(clone, `git clone --branch pipeline/z ${remote} . -q`);
    g(clone, 'git config user.email human@test');
    g(clone, 'git config user.name human');
    writeFile(clone, 'human-fix.txt', 'a human pushed this\n');
    g(clone, 'git add human-fix.txt');
    g(clone, 'git commit -m "human: manual fix" -q');
    g(clone, 'git push origin pipeline/z -q');
    fs.rmSync(clone, { recursive: true, force: true });

    // Local hasn't seen the human's commit. Try to auto-push another phase.
    // Should FAIL via force-with-lease (which is the correct safe behavior).
    writeFile(local, 'src/data/tutorials/z/b.ts', 'export const b = 2;\n');
    const r2 = pushPhaseOutputToBackupBranch({
      deviceId: 'z', phase: 'phase-5-display-build', worktreeCwd: local,
      paths: ['src/data/tutorials/z/'],
    });
    assert(r2.kind === 'failed', `expected failed (lease abort), got ${JSON.stringify(r2)}`);
    if (r2.kind === 'failed') {
      // Verify failure reason mentions push or stale (varies by git version)
      const lower = r2.reason.toLowerCase();
      assert(
        lower.includes('stale') || lower.includes('rejected') || lower.includes('lease') || lower.includes('non-fast-forward'),
        `failure reason should indicate lease conflict: ${r2.reason}`,
      );
    }

    // The local commit IS made (commit + add succeed; only push fails)
    const localLog = g(local, 'git log --oneline');
    assert(localLog.includes('display-build'), `local commit should exist: ${localLog}`);

    // Human's commit on remote is INTACT (not overwritten)
    g(local, 'git fetch origin pipeline/z -q');
    const remoteLog = g(local, 'git log origin/pipeline/z --oneline');
    assert(remoteLog.includes('human: manual fix'), `human commit should still be on remote: ${remoteLog}`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 5: Path that doesn't exist — should be no-changes (no files match)
// ───────────────────────────────────────────────────────────────────────────
scenario('5: path that references non-existent directory returns no-changes (no crash)', async () => {
  const { local, cleanup } = mkLocalRemotePair();
  try {
    const result = pushPhaseOutputToBackupBranch({
      deviceId: 'never-existed',
      phase: 'phase-5-display-build',
      worktreeCwd: local,
      paths: ['src/components/devices/never-existed/display/'],
    });
    assert(result.kind === 'no-changes', `expected no-changes, got ${JSON.stringify(result)}`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 6: Coexistence with the existing tutorial-pr push — auto-push to pipeline/<id>
//             does NOT interfere with a later push to the worktree's "main" branch.
// ───────────────────────────────────────────────────────────────────────────
scenario('6: auto-push to pipeline/<id> does not break the existing tutorial-pr push to HEAD', async () => {
  const { local, cleanup } = mkLocalRemotePair();
  try {
    // Phase 5: auto-push display-build to pipeline/cdj
    writeFile(local, 'src/components/devices/cdj/display/x.tsx', 'export default function() { return null; }\n');
    const r1 = pushPhaseOutputToBackupBranch({
      deviceId: 'cdj', phase: 'phase-5-display-build', worktreeCwd: local,
      paths: ['src/components/devices/cdj/display/'],
    });
    assert(r1.kind === 'pushed', `r1: ${JSON.stringify(r1)}`);

    // Simulate the EXISTING tutorial-pr push at runner line 2986: git push -u origin HEAD
    // This pushes the same commits to ALSO live on `main` (the worktree's branch).
    writeFile(local, 'src/data/tutorials/cdj/x.ts', 'export const t = {};\n');
    const r2 = pushPhaseOutputToBackupBranch({
      deviceId: 'cdj', phase: 'phase-5-tutorial-build', worktreeCwd: local,
      paths: ['src/data/tutorials/cdj/'],
    });
    assert(r2.kind === 'pushed', `r2: ${JSON.stringify(r2)}`);

    // Now simulate tutorial-pr: push HEAD to its own branch (mirrors the line 2986 behavior)
    // This must succeed without interference from our auto-push to pipeline/cdj.
    try {
      execSync('git push -u origin HEAD:feature/cdj-tutorials', {
        cwd: local, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      throw new Error(`existing tutorial-pr push pattern should still work: ${(err as Error).message}`);
    }

    // Verify BOTH branches exist on remote with the same tip
    const heads = g(local, 'git ls-remote --heads origin');
    assert(heads.includes('refs/heads/pipeline/cdj'), `pipeline/cdj should exist on remote: ${heads}`);
    assert(heads.includes('refs/heads/feature/cdj-tutorials'), `feature/cdj-tutorials should exist: ${heads}`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 7: Helper does NOT touch worktree's checkout state
//             (doesn't change current branch, doesn't leave uncommitted state)
// ───────────────────────────────────────────────────────────────────────────
scenario('7: helper leaves worktree on the same branch as before, status clean afterward', async () => {
  const { local, cleanup } = mkLocalRemotePair();
  try {
    const beforeBranch = g(local, 'git rev-parse --abbrev-ref HEAD');
    writeFile(local, 'src/data/tutorials/w/x.ts', 'export const t = {};\n');

    pushPhaseOutputToBackupBranch({
      deviceId: 'w', phase: 'phase-5-tutorial-build', worktreeCwd: local,
      paths: ['src/data/tutorials/w/'],
    });

    const afterBranch = g(local, 'git rev-parse --abbrev-ref HEAD');
    assert(beforeBranch === afterBranch, `branch changed: ${beforeBranch} → ${afterBranch}`);

    const status = g(local, 'git status --porcelain');
    assert(status === '', `working tree should be clean afterward, got: ${status}`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// SCENARIO 8: Push includes ONLY the specified paths (does not commit unrelated worktree changes)
// ───────────────────────────────────────────────────────────────────────────
scenario('8: helper commits ONLY explicit paths, leaves other worktree changes alone', async () => {
  const { local, cleanup } = mkLocalRemotePair();
  try {
    // Simulate the worktree having OTHER uncommitted state (e.g. modified manifest from a prior phase)
    writeFile(local, '.pipeline/x/manifest.json', '{"unrelated":"data"}\n');
    writeFile(local, 'src/components/devices/x/display/x.tsx', 'export default function() { return null; }\n');

    const result = pushPhaseOutputToBackupBranch({
      deviceId: 'x', phase: 'phase-5-display-build', worktreeCwd: local,
      paths: ['src/components/devices/x/display/'],
    });
    assert(result.kind === 'pushed', `r: ${JSON.stringify(result)}`);

    // Verify the unrelated file is NOT in the commit
    g(local, 'git fetch origin');
    const filesInCommit = g(local, 'git show --name-only origin/pipeline/x --pretty=format:""').trim();
    assert(!filesInCommit.includes('.pipeline/x/manifest.json'), `unrelated file should NOT be in commit: ${filesInCommit}`);
    assert(filesInCommit.includes('src/components/devices/x/display/x.tsx'), `display file should be in commit: ${filesInCommit}`);

    // The unrelated file is still in the worktree as untracked
    // (git porcelain collapses untracked subdirs to the parent dir; use -uall to see the file path)
    const status = g(local, 'git status --porcelain -uall');
    assert(status.includes('.pipeline/x/manifest.json'), `unrelated file should still be present in worktree: ${status}`);
    // Defense-in-depth: also verify on disk
    assert(fs.existsSync(path.join(local, '.pipeline/x/manifest.json')), `unrelated file should still exist on disk`);
  } finally {
    cleanup();
  }
});

// ───────────────────────────────────────────────────────────────────────────
// RUN
// ───────────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\nRunning ${SCENARIOS.length} integration scenarios...\n`);
  for (const { name, run } of SCENARIOS) {
    try {
      await run();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}`);
      console.log(`     ${err instanceof Error ? err.message : String(err)}`);
      failed++;
      failures.push(name);
    }
  }
  console.log(`\n${passed}/${SCENARIOS.length} scenarios passed${failed > 0 ? `, ${failed} failed` : ''}.\n`);
  if (failures.length > 0) {
    console.log('FAILED:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
})();
