#!/usr/bin/env npx tsx
/**
 * Integration test for the recheck-coverage feature.
 *
 * Exercises the parse + summarize pipeline against a SYNTHETIC match-table
 * (no real agent invocation — that costs $$ and requires a real device).
 * Real-agent end-to-end is reserved for the manual smoke step in the plan.
 *
 * Run: npx tsx scripts/_integration-test-recheck-coverage.ts
 */

import fs from 'fs';
import path from 'path';
import {
  parseMatchTable,
  summarizeMatchTable,
  type MatchRow,
} from '../src/lib/pipeline/coverage-scorer';

let pass = 0; let fail = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail = '') {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name} ${detail}`); fail++; failures.push(name); }
}

console.log('\nRunning recheck-coverage integration scenarios...\n');

// ─── SCENARIO 1: Round-trip the existing synthetic fixture ──────────────────
{
  const fixturePath = path.join(process.cwd(), 'src/lib/pipeline/__tests__/fixtures/match-table-synthetic.md');
  if (!fs.existsSync(fixturePath)) {
    check('1: synthetic fixture exists', false, `expected at ${fixturePath}`);
  } else {
    const markdown = fs.readFileSync(fixturePath, 'utf-8');
    const rows = parseMatchTable(markdown);
    const summary = summarizeMatchTable(rows);
    check('1a: fixture parses to expected row count (10)', rows.length === 10, `got ${rows.length}`);
    check('1b: fixture summarizes to 80% coverage', summary.coveragePct === 80, `got ${summary.coveragePct}`);
    check('1c: 1 MISSING gap detected', summary.missingGaps === 1, `got ${summary.missingGaps}`);
    check('1d: 1 PARENT_ONLY gap detected', summary.parentOnlyGaps === 1, `got ${summary.parentOnlyGaps}`);
    check('1e: 8 confirmed (CONFIRMED + RECLASSIFICATION)', summary.confirmed === 8, `got ${summary.confirmed}`);
  }
}

// ─── SCENARIO 2: Realistic auditor output (mixed) ────────────────────────────
{
  const synthetic = `# Match Table — CDJ-3000 audit

| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | Power On | 5 | CONFIRMED | basics | 1 | "Press POWER" |
| 2.3 | Touch Preview | 19 | MISSING |  |  |  |
| 2.5 | Source Select | 13 | CONFIRMED | browse | 2 | "Tap SOURCE" |
| 3.5 | Cue Point Sampler | 22 | CONFIRMED_BY_PARENT_ONLY | cue-points |  | (section exists, no specific step) |
| 4.2 | Loop Out | 31 | RECLASSIFICATION | loops | 2 | "(workflow vs parameter)" |
| 5.7 | Active Loop Save | 56 | MISSING |  |  |  |
`;
  const rows = parseMatchTable(synthetic);
  const summary = summarizeMatchTable(rows);
  check('2a: parses realistic mixed output (6 rows)', rows.length === 6, `got ${rows.length}`);
  check('2b: 2 MISSING detected', summary.missingGaps === 2, `got ${summary.missingGaps}`);
  check('2c: confirmed = CONFIRMED (2) + RECLASSIFICATION (1) = 3', summary.confirmed === 3, `got ${summary.confirmed}`);
  check('2d: 1 PARENT_ONLY', summary.parentOnlyGaps === 1, `got ${summary.parentOnlyGaps}`);
  // 3 confirmed / 6 total = 50%
  check('2e: coverage = 50%', summary.coveragePct === 50, `got ${summary.coveragePct}`);
}

// ─── SCENARIO 3: All-confirmed (no gaps — "you're done" state) ──────────────
{
  const noGaps = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | A | 1 | CONFIRMED | t1 | 1 | "x" |
| 1.2 | B | 2 | CONFIRMED | t1 | 2 | "y" |
| 1.3 | C | 3 | CONFIRMED | t2 | 1 | "z" |
`;
  const rows = parseMatchTable(noGaps);
  const summary = summarizeMatchTable(rows);
  check('3a: all-confirmed parses', rows.length === 3);
  check('3b: 100% coverage', summary.coveragePct === 100, `got ${summary.coveragePct}`);
  check('3c: zero missing', summary.missingGaps === 0);
  check('3d: zero parent-only', summary.parentOnlyGaps === 0);
  // The modal renders the "no gaps found" empty state when both lists are empty
  const missing = rows.filter((r) => r.matchKind === 'MISSING');
  const parentOnly = rows.filter((r) => r.matchKind === 'CONFIRMED_BY_PARENT_ONLY');
  check('3e: modal would render "no gaps" state', missing.length === 0 && parentOnly.length === 0);
}

// ─── SCENARIO 4: Malformed rows are silently skipped (defensive) ─────────────
{
  const malformed = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | Good | 1 | CONFIRMED | t1 | 1 | "x" |
| 2.1 | TooFewCells | CONFIRMED |
| 3.1 | UnknownKind | 3 | BANANA | t2 | 1 | "x" |
| 4.1 | AnotherGood | 4 | MISSING |  |  |  |
`;
  const rows = parseMatchTable(malformed);
  check('4: malformed rows dropped, valid rows preserved', rows.length === 2, `got ${rows.length}: ${rows.map((r) => r.featureName).join(',')}`);
}

// ─── SCENARIO 5: Modal data-shape contract (rows have all required fields) ──
{
  const markdown = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| F.1 | TestFeature | 99 | MISSING |  |  |  |
`;
  const rows = parseMatchTable(markdown);
  const row: MatchRow = rows[0];
  check('5a: featureId present', row.featureId === 'F.1');
  check('5b: featureName present', row.featureName === 'TestFeature');
  check('5c: page present', row.page === '99');
  check('5d: matchKind present', row.matchKind === 'MISSING');
}

console.log(`\n${pass}/${pass + fail} integration assertions passed${fail > 0 ? `, ${fail} failed` : ''}\n`);
if (failures.length > 0) {
  console.log('FAILED:');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
