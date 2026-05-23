/**
 * One-command smoke test for the manifest-integrity + tutorial-linkage chain.
 *
 * Run from the repo root:
 *   npx tsx scripts/smoke-test-all.ts
 *
 * Exercises every layer added across PRs #103–#107:
 *   1. Post-editor validator        — every .pipeline manifest checked
 *   2. Auto-repair idempotency     — repair(repair(M)) === repair(M)
 *   3. Tutorial → control refs     — every tutorial validated against its manifest
 *   4. (Reports any DeepMind/CDJ-style orphans the validator catches)
 *
 * Exits with code 0 if everything passes, non-zero otherwise — suitable for
 * a pre-push hook or CI step.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import * as validators from '../src/lib/pipeline/checkpoint-validators';
import { repairManifest } from '../src/lib/pipeline/manifest-repair';
import { execSync } from 'child_process';

// Colors
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const PIPELINE_DIR = '.pipeline';
let totalFailures = 0;
let totalWarnings = 0;

function heading(text: string) {
  console.log(`\n${BOLD}${BLUE}━━━ ${text} ━━━${RESET}`);
}

function pass(line: string) {
  console.log(`  ${GREEN}✓${RESET} ${line}`);
}

function warn(line: string) {
  console.log(`  ${YELLOW}!${RESET} ${line}`);
  totalWarnings++;
}

function fail(line: string) {
  console.log(`  ${RED}✗${RESET} ${line}`);
  totalFailures++;
}

function info(line: string) {
  console.log(`  ${DIM}${line}${RESET}`);
}

// ── Layer 1: Post-editor validator on every .pipeline manifest ──────────────
heading('1. Post-editor validator on .pipeline manifests');

if (!existsSync(PIPELINE_DIR)) {
  fail(`No ${PIPELINE_DIR} directory — run from repo root`);
  process.exit(1);
}

const deviceDirs = readdirSync(PIPELINE_DIR).filter((name) => {
  const p = join(PIPELINE_DIR, name);
  return statSync(p).isDirectory() && existsSync(join(p, 'manifest-editor.json'));
});

if (deviceDirs.length === 0) {
  warn('No manifests found to validate');
}

for (const id of deviceDirs.sort()) {
  const path = join(PIPELINE_DIR, id, 'manifest-editor.json');
  const json = readFileSync(path, 'utf-8');
  const r = validators.validatePostEditorManifest(json);
  const errCodes = [...new Set(r.findings.filter((f) => f.severity === 'error').map((f) => f.code))];
  const warnCodes = [...new Set(r.findings.filter((f) => f.severity === 'warning').map((f) => f.code))];

  if (r.valid) {
    const note = warnCodes.length ? ` (${r.warningCount} warning${r.warningCount === 1 ? '' : 's'})` : '';
    pass(`${id.padEnd(28)}${note}`);
  } else {
    fail(`${id.padEnd(28)} — errors: ${errCodes.join(', ')}`);
    info(`         repair will handle: ${errCodes.filter(c => ['CONTAINER_ORPHAN','GROUPLABEL_ORPHAN','LABEL_ORPHAN_CONTROL','SECTION_CHILD_ORPHAN'].includes(c)).join(', ') || 'none'}`);
    info(`         needs admin:        ${errCodes.filter(c => !['CONTAINER_ORPHAN','GROUPLABEL_ORPHAN','LABEL_ORPHAN_CONTROL','SECTION_CHILD_ORPHAN'].includes(c)).join(', ') || 'none'}`);
  }
}

// ── Layer 2: Auto-repair idempotency on every manifest ───────────────────────
heading('2. Auto-repair idempotency');

for (const id of deviceDirs.sort()) {
  const path = join(PIPELINE_DIR, id, 'manifest-editor.json');
  const json = readFileSync(path, 'utf-8');
  const r1 = repairManifest(json);
  const r2 = repairManifest(JSON.stringify(r1.repaired));
  if (JSON.stringify(r1.repaired) === JSON.stringify(r2.repaired)) {
    const changes = r1.changes.length;
    const note = changes > 0 ? ` (${changes} repair${changes === 1 ? '' : 's'} on first pass)` : '';
    pass(`${id.padEnd(28)}${note}`);
  } else {
    fail(`${id.padEnd(28)} — repair is NOT idempotent (regression)`);
  }
}

// ── Layer 3: Tutorial → control ref check (delegates to existing test) ──────
heading('3. Tutorial → control references');

try {
  // Existing test file walks every tutorial + cross-references each control id.
  execSync('npx vitest run src/__tests__/tutorials/tutorialControlRefs.test.ts --reporter=dot', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
  pass('all tutorial control references resolve against committed manifests');
} catch (err) {
  const output = (err as { stdout?: Buffer; stderr?: Buffer }).stdout?.toString() ?? '';
  fail('tutorial references contain drift — re-run for details:');
  info('npx vitest run src/__tests__/tutorials/tutorialControlRefs.test.ts');
  // Surface a snippet of the failure
  const lines = output.split('\n').filter(l => l.includes('not found') || l.includes('Did you mean'));
  for (const l of lines.slice(0, 5)) info(`  ${l.trim()}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('');
const summary = totalFailures > 0
  ? `${RED}${BOLD}✗ ${totalFailures} failure${totalFailures === 1 ? '' : 's'}${RESET}`
  : `${GREEN}${BOLD}✓ all clear${RESET}`;
const warnNote = totalWarnings > 0 ? ` ${YELLOW}(${totalWarnings} warning${totalWarnings === 1 ? '' : 's'})${RESET}` : '';
console.log(`${summary}${warnNote}`);

if (totalFailures > 0) {
  console.log(`\n${DIM}Next actions:${RESET}`);
  console.log(`${DIM}  • "repair will handle" findings — clear themselves on next save once Tier 4 wiring ships${RESET}`);
  console.log(`${DIM}  • "needs admin" findings — open the editor, fix in UI, re-save${RESET}`);
}

process.exit(totalFailures > 0 ? 1 : 0);
