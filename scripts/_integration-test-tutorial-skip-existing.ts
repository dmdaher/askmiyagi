#!/usr/bin/env npx tsx
/**
 * Integration test for the skip-existing tutorial regen feature.
 * Real filesystem, real git, no mocks. Mirrors how pipeline-runner.ts
 * exercises the helpers in production.
 *
 * Run: npx tsx scripts/_integration-test-tutorial-skip-existing.ts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  partitionTutorialBatch,
  captureFileShas,
  detectModifiedFiles,
} from '../src/lib/pipeline/tutorial-skip-existing';

const SCENARIOS: { name: string; run: () => void }[] = [];
let passed = 0;
let failed = 0;
const failures: string[] = [];

function scenario(name: string, fn: () => void) {
  SCENARIOS.push({ name, run: fn });
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

function g(cwd: string, cmd: string): string {
  return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function mkWorktree(): { worktreeCwd: string; cleanup: () => void } {
  const worktreeCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tutskip-'));
  // Initialize as git repo so 'git checkout HEAD --' restore works in tests.
  g(worktreeCwd, 'git init -q');
  g(worktreeCwd, 'git config user.email test@test');
  g(worktreeCwd, 'git config user.name test');
  g(worktreeCwd, 'git commit --allow-empty -m init -q');
  return {
    worktreeCwd,
    cleanup: () => fs.rmSync(worktreeCwd, { recursive: true, force: true }),
  };
}

function writeTutorial(worktreeCwd: string, deviceId: string, id: string, content: string) {
  const dir = path.join(worktreeCwd, 'src/data/tutorials', deviceId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.ts`), content);
}

function commit(worktreeCwd: string, msg: string) {
  g(worktreeCwd, 'git add -A');
  g(worktreeCwd, `git commit -m "${msg}" -q`);
}

// ─── SCENARIO 1: First run on empty device dir → all missing ────────────────
scenario('1: first run on empty device dir partitions to all-missing', () => {
  const { worktreeCwd, cleanup } = mkWorktree();
  try {
    const result = partitionTutorialBatch(['a', 'b', 'c'], 'fresh-device', worktreeCwd);
    assert(result.existing.length === 0, `expected 0 existing, got ${result.existing.length}`);
    assert(result.missing.length === 3, `expected 3 missing, got ${result.missing.length}`);
    assert(JSON.stringify(result.missing) === '["a","b","c"]', `order preserved: ${result.missing}`);
  } finally {
    cleanup();
  }
});

// ─── SCENARIO 2: Re-run with all existing → all-existing partition ───────────
scenario('2: re-run with all files present partitions to all-existing', () => {
  const { worktreeCwd, cleanup } = mkWorktree();
  try {
    writeTutorial(worktreeCwd, 'd1', 'a', 'tut-a');
    writeTutorial(worktreeCwd, 'd1', 'b', 'tut-b');
    writeTutorial(worktreeCwd, 'd1', 'c', 'tut-c');
    commit(worktreeCwd, 'initial 3 tutorials');

    const result = partitionTutorialBatch(['a', 'b', 'c'], 'd1', worktreeCwd);
    assert(result.existing.length === 3, `expected 3 existing, got ${result.existing.length}`);
    assert(result.missing.length === 0, `expected 0 missing, got ${result.missing.length}`);
  } finally {
    cleanup();
  }
});

// ─── SCENARIO 3: Mixed (A exists, B+C missing) — most common real-world ────
scenario('3: mixed partition (a exists, b/c missing) — the "added 2 tutorials" case', () => {
  const { worktreeCwd, cleanup } = mkWorktree();
  try {
    writeTutorial(worktreeCwd, 'd2', 'a', 'tut-a-content');
    commit(worktreeCwd, 'initial tutorial a');

    const result = partitionTutorialBatch(['a', 'b', 'c'], 'd2', worktreeCwd);
    assert(JSON.stringify(result.existing) === '["a"]', `existing: ${JSON.stringify(result.existing)}`);
    assert(JSON.stringify(result.missing) === '["b","c"]', `missing: ${JSON.stringify(result.missing)}`);
  } finally {
    cleanup();
  }
});

// ─── SCENARIO 4: SHA post-check detects violation + git restores ───────────
scenario('4: SHA post-check detects agent violation + git checkout HEAD restores file', () => {
  const { worktreeCwd, cleanup } = mkWorktree();
  try {
    writeTutorial(worktreeCwd, 'd3', 'a', 'committed-content');
    commit(worktreeCwd, 'committed tutorial a');

    // Capture SHAs (simulating runner BEFORE agent invocation)
    const beforeShas = captureFileShas(['a'], 'd3', worktreeCwd);
    assert(beforeShas.has('a'), 'should have captured SHA for existing tutorial');

    // Simulate agent ignoring SKIP directive: overwrite the file
    writeTutorial(worktreeCwd, 'd3', 'a', 'TAMPERED-by-agent');

    // Post-check should detect
    const violated = detectModifiedFiles(beforeShas, 'd3', worktreeCwd);
    assert(violated.length === 1, `should detect 1 violation, got ${violated.length}`);
    assert(violated[0] === 'a', `should flag 'a', got '${violated[0]}'`);

    // Restore from git HEAD (mirrors runner's auto-restore logic)
    g(worktreeCwd, `git checkout HEAD -- 'src/data/tutorials/d3/a.ts'`);

    // Confirm restoration worked
    const restored = fs.readFileSync(path.join(worktreeCwd, 'src/data/tutorials/d3/a.ts'), 'utf-8');
    assert(restored === 'committed-content', `should be restored to original, got: '${restored}'`);

    // Verify SHAs match again after restore
    const afterShas = captureFileShas(['a'], 'd3', worktreeCwd);
    assert(afterShas.get('a') === beforeShas.get('a'), 'SHA should match original after restore');
  } finally {
    cleanup();
  }
});

// ─── SCENARIO 5: agent obeys directive → post-check reports zero violations ─
scenario('5: agent obeys directive (only writes missing) → zero post-check violations', () => {
  const { worktreeCwd, cleanup } = mkWorktree();
  try {
    writeTutorial(worktreeCwd, 'd4', 'a', 'a-original');
    writeTutorial(worktreeCwd, 'd4', 'b', 'b-original');
    commit(worktreeCwd, 'committed a and b');

    const beforeShas = captureFileShas(['a', 'b'], 'd4', worktreeCwd);

    // Simulate well-behaved agent: writes ONLY the missing c
    writeTutorial(worktreeCwd, 'd4', 'c', 'c-newly-generated');

    const violated = detectModifiedFiles(beforeShas, 'd4', worktreeCwd);
    assert(violated.length === 0, `should detect 0 violations, got ${violated.length}: ${violated}`);

    // Confirm c was created
    assert(fs.existsSync(path.join(worktreeCwd, 'src/data/tutorials/d4/c.ts')), 'c should now exist');
  } finally {
    cleanup();
  }
});

// ─── SCENARIO 6: prompt fragment construction (smoke test) ──────────────────
scenario('6: smoke — runner-side skipDirective string is well-formed for mixed batch', () => {
  const { worktreeCwd, cleanup } = mkWorktree();
  try {
    writeTutorial(worktreeCwd, 'd5', 'panel-overview', 'pov');
    writeTutorial(worktreeCwd, 'd5', 'split-keyboard', 'sk');

    const { existing, missing } = partitionTutorialBatch(
      ['panel-overview', 'split-keyboard', 'four-zone-setup'],
      'd5',
      worktreeCwd,
    );

    // Reproduce the EXACT string the runner builds at line ~2683
    const skipDirective = existing.length > 0
      ? `\n\nIMPORTANT — SKIP-EXISTING DIRECTIVE\n` +
        `These tutorials ALREADY EXIST and MUST NOT be regenerated or modified:\n` +
        existing.map((id) => `  - src/data/tutorials/d5/${id}.ts`).join('\n') + `\n\n` +
        `ONLY generate these missing tutorials: ${missing.join(', ')}\n\n` +
        `When updating index.ts: ADD imports for new tutorials, PRESERVE all existing imports.\n` +
        `When updating <device>Tutorials.test.ts: ADD entries for new tutorials, PRESERVE existing entries.\n`
      : '';

    assert(skipDirective.includes('SKIP-EXISTING DIRECTIVE'), 'directive header present');
    assert(skipDirective.includes('panel-overview.ts'), 'lists existing panel-overview');
    assert(skipDirective.includes('split-keyboard.ts'), 'lists existing split-keyboard');
    assert(skipDirective.includes('ONLY generate these missing tutorials: four-zone-setup'), 'lists missing');
    assert(!skipDirective.includes('four-zone-setup.ts'), 'does NOT list missing in the existing-files block');
    assert(skipDirective.includes('PRESERVE all existing imports'), 'index.ts guidance present');
    assert(skipDirective.includes('PRESERVE existing entries'), 'test file guidance present');
  } finally {
    cleanup();
  }
});

// ─── RUN ────────────────────────────────────────────────────────────────────
console.log(`\nRunning ${SCENARIOS.length} integration scenarios...\n`);
for (const { name, run } of SCENARIOS) {
  try {
    run();
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
