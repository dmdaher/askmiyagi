/**
 * Tests for the feature-level match-table extension to coverage-scorer.
 *
 * Background: the coverage-auditor agent used to do section-level matching
 * (credited a tutorial for covering all sub-features of a section, even if
 * no step taught them). The fix is feature-level matching, emitting a
 * machine-readable `match-table.md` that the scorer parses to recompute
 * the authoritative coverage percentage.
 *
 * These tests verify:
 *   1. New format (with match-table.md) → scorer parses correctly
 *   2. Old format (no match-table) → backward-compat fallback to frontmatter
 *   3. Match-table-recomputed vs frontmatter disagreement → warning emitted
 *   4. NaN guard: empty match-table → coverage = 0, not NaN
 *   5. CONFIRMED_BY_PARENT_ONLY counted as gap (per spec)
 *   6. parseMatchTable handles malformed/header rows gracefully
 *
 * See: `.claude/agents/coverage-auditor.md` Phase 2 §1 for the contract.
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseMatchTable,
  summarizeMatchTable,
  scoreCoverage,
} from '../coverage-scorer';

const fixturesDir = path.join(__dirname, 'fixtures');
const syntheticCheckpoint = fs.readFileSync(path.join(fixturesDir, 'checkpoint-synthetic.md'), 'utf-8');
const syntheticMatchTable = fs.readFileSync(path.join(fixturesDir, 'match-table-synthetic.md'), 'utf-8');

describe('parseMatchTable', () => {
  it('parses all 4 match_kinds + counts rows correctly', () => {
    const rows = parseMatchTable(syntheticMatchTable);
    // 10 features in the fixture
    expect(rows).toHaveLength(10);
    // Verify each kind appears
    const kinds = rows.map((r) => r.matchKind);
    expect(kinds.filter((k) => k === 'CONFIRMED')).toHaveLength(7);
    expect(kinds.filter((k) => k === 'RECLASSIFICATION')).toHaveLength(1);
    expect(kinds.filter((k) => k === 'CONFIRMED_BY_PARENT_ONLY')).toHaveLength(1);
    expect(kinds.filter((k) => k === 'MISSING')).toHaveLength(1);
  });

  it('preserves feature_id, name, page, tutorial_id, step_id, evidence_quote', () => {
    const rows = parseMatchTable(syntheticMatchTable);
    const sampler = rows.find((r) => r.featureId === '3.5');
    expect(sampler).toBeDefined();
    expect(sampler?.featureName).toBe('Cue Point Sampler');
    expect(sampler?.page).toBe('22');
    expect(sampler?.matchKind).toBe('CONFIRMED_BY_PARENT_ONLY');
    expect(sampler?.tutorialId).toBe('cue-points');
    expect(sampler?.stepId).toBe('');
  });

  it('returns empty list for empty input', () => {
    expect(parseMatchTable('')).toEqual([]);
  });

  it('skips header rows and separator rows', () => {
    const headerOnly = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
`;
    expect(parseMatchTable(headerOnly)).toEqual([]);
  });

  it('skips malformed rows (fewer than 7 columns)', () => {
    const malformed = `| f1 | name | page | CONFIRMED | tut | step |`;
    expect(parseMatchTable(malformed)).toEqual([]);
  });

  it('drops rows with unknown match_kind values', () => {
    const unknown = `| f1 | name | page | INVALID_KIND | tut | step | quote |`;
    expect(parseMatchTable(unknown)).toEqual([]);
  });
});

describe('summarizeMatchTable', () => {
  it('counts CONFIRMED + RECLASSIFICATION as confirmed', () => {
    const rows = parseMatchTable(syntheticMatchTable);
    const summary = summarizeMatchTable(rows);
    expect(summary.total).toBe(10);
    expect(summary.confirmed).toBe(8); // 7 CONFIRMED + 1 RECLASSIFICATION
    expect(summary.parentOnlyGaps).toBe(1);
    expect(summary.missingGaps).toBe(1);
    expect(summary.coveragePct).toBe(80); // 8/10 = 80%
  });

  it('NaN-guarded: empty table returns coveragePct = 0', () => {
    const summary = summarizeMatchTable([]);
    expect(summary.coveragePct).toBe(0);
    expect(Number.isNaN(summary.coveragePct)).toBe(false);
    expect(summary.total).toBe(0);
  });

  it('100% case: all CONFIRMED', () => {
    const rows = parseMatchTable(syntheticMatchTable).filter((r) => r.matchKind === 'CONFIRMED');
    const summary = summarizeMatchTable(rows);
    expect(summary.coveragePct).toBe(100);
    expect(summary.confirmed).toBe(7);
    expect(summary.missingGaps).toBe(0);
  });

  it('all CONFIRMED_BY_PARENT_ONLY counts as 0% coverage (parent-only is a gap)', () => {
    // Synthesize: 3 features all CONFIRMED_BY_PARENT_ONLY → 0% confirmed
    const parentOnly = parseMatchTable(syntheticMatchTable).filter((r) => r.matchKind === 'CONFIRMED_BY_PARENT_ONLY');
    // Only 1 in fixture; replicate logically
    const summary = summarizeMatchTable([...parentOnly, ...parentOnly, ...parentOnly]);
    expect(summary.confirmed).toBe(0);
    expect(summary.parentOnlyGaps).toBe(3);
    expect(summary.coveragePct).toBe(0);
  });
});

describe('scoreCoverage — new match-table integration', () => {
  it('uses match-table coverage as authoritative when provided', () => {
    // Fixture: frontmatter says 90.0%, match-table true coverage is 80.0%
    const result = scoreCoverage(syntheticCheckpoint, { matchTableMarkdown: syntheticMatchTable });
    expect(result.matchTable).toBeDefined();
    expect(result.matchTable?.coveragePct).toBe(80);
    expect(result.matchTable?.confirmed).toBe(8);
    expect(result.matchTable?.total).toBe(10);
  });

  it('emits matchTableWarning when frontmatter and table disagree by > 0.5', () => {
    // Frontmatter score=9.0 (90%) vs matchTable 80% → disagreement is 1.0/10
    const result = scoreCoverage(syntheticCheckpoint, { matchTableMarkdown: syntheticMatchTable });
    expect(result.matchTableWarning).toBeDefined();
    expect(result.matchTableWarning).toContain('match-table recomputed');
    expect(result.matchTableWarning).toContain('Using match-table as authoritative');
  });

  it('uses match-table coverage to drive verdict (drops 90→80% across REJECT threshold)', () => {
    // Frontmatter alone (90.0% = 9.0/10) → above REJECT_INVENTORY (9.0) — would APPROVED_WITH_WARNINGS
    // With match-table (80.0% = 8.0/10) → BELOW REJECT_INVENTORY → REJECTED
    const result = scoreCoverage(syntheticCheckpoint, { matchTableMarkdown: syntheticMatchTable });
    expect(result.verdict).toBe('REJECTED');
    expect(result.reason).toContain('below REJECT threshold');
  });

  it('backward compat: missing match-table falls back to frontmatter', () => {
    // No matchTableMarkdown → uses old behavior (frontmatter score 9.0 = APPROVED_WITH_WARNINGS)
    const result = scoreCoverage(syntheticCheckpoint);
    expect(result.matchTable).toBeUndefined();
    expect(result.matchTableWarning).toBeUndefined();
    // 9.0/10 == 90% inventory coverage; 2 moderate gaps. Falls into APPROVED_WITH_WARNINGS.
    expect(['APPROVED_WITH_WARNINGS', 'APPROVED']).toContain(result.verdict);
  });

  it('backward compat: empty string matchTable also falls back', () => {
    const result = scoreCoverage(syntheticCheckpoint, { matchTableMarkdown: '' });
    expect(result.matchTable).toBeUndefined();
  });

  it('backward compat: null matchTable falls back', () => {
    const result = scoreCoverage(syntheticCheckpoint, { matchTableMarkdown: null });
    expect(result.matchTable).toBeUndefined();
  });

  it('no warning when frontmatter and matchTable agree (within 0.5)', () => {
    // Build a frontmatter that says 80% (same as match table)
    const alignedCheckpoint = syntheticCheckpoint.replace('score: 9.0', 'score: 8.0').replace('| Inventory coverage | 9.0 / 10 |', '| Inventory coverage | 8.0 / 10 |');
    const result = scoreCoverage(alignedCheckpoint, { matchTableMarkdown: syntheticMatchTable });
    expect(result.matchTableWarning).toBeUndefined();
  });
});

describe('scoreCoverage — edge cases with match-table', () => {
  it('empty match-table input → no table summary, fallback to frontmatter', () => {
    // An effectively-empty table (just header) should be treated as "no match table provided"
    const headerOnly = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
`;
    const result = scoreCoverage(syntheticCheckpoint, { matchTableMarkdown: headerOnly });
    expect(result.matchTable).toBeUndefined();
  });

  it('all-MISSING match-table with high-LLM-score → MATCH_TABLE_CONFLICT (Defense B PR #181)', () => {
    // Synthetic checkpoint says inventory=9.0 (90%). All-MISSING match-table
    // says 0%. 90pp delta → catastrophic → halt instead of triggering
    // self-heal on corrupt data. CDJ-3000 incident regression test.
    const allMissing = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| f1 | Foo | 1 | MISSING |  |  |  |
| f2 | Bar | 2 | MISSING |  |  |  |
| f3 | Baz | 3 | MISSING |  |  |  |
`;
    const result = scoreCoverage(syntheticCheckpoint, { matchTableMarkdown: allMissing });
    expect(result.matchTable?.coveragePct).toBe(0);
    expect(result.verdict).toBe('MATCH_TABLE_CONFLICT');
    expect(result.shouldAutoRetry).toBe(false);
  });

  it('all-MISSING match-table WITHOUT LLM frontmatter → CRITICAL (no conflict possible)', () => {
    // Empty checkpoint (no frontmatter inventory) → no source to disagree
    // with match-table → falls through to standard CRITICAL verdict.
    const allMissing = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| f1 | Foo | 1 | MISSING |  |  |  |
| f2 | Bar | 2 | MISSING |  |  |  |
| f3 | Baz | 3 | MISSING |  |  |  |
`;
    const emptyCheckpoint = '---\nagent: coverage-auditor\nphase: 4\n---\n# Empty';
    const result = scoreCoverage(emptyCheckpoint, { matchTableMarkdown: allMissing });
    expect(result.matchTable?.coveragePct).toBe(0);
    expect(result.verdict).toBe('CRITICAL');
  });

  it('100% CONFIRMED match-table → APPROVED', () => {
    const allConfirmed = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| f1 | Foo | 1 | CONFIRMED | tut | step-1 | Press FOO |
| f2 | Bar | 2 | CONFIRMED | tut | step-2 | Press BAR |
| f3 | Baz | 3 | CONFIRMED | tut | step-3 | Press BAZ |
`;
    // Need a clean checkpoint with no critical/moderate gaps for APPROVED
    const cleanCheckpoint = syntheticCheckpoint
      .replace('## Moderate Gaps\n\n1. **Cue Point Sampler** (p. 22) — section covered but no specific step\n2. **Active Loop save** (p. 56) — not in extractor inventory', '## Moderate Gaps\n\n(none)');
    const result = scoreCoverage(cleanCheckpoint, { matchTableMarkdown: allConfirmed });
    expect(result.matchTable?.coveragePct).toBe(100);
    expect(['APPROVED', 'APPROVED_WITH_WARNINGS']).toContain(result.verdict);
  });
});

// ─── PR-X1: MENTIONED_NOT_TAUGHT bar ──────────────────────────────────────────
//
// New match_kind for features that appear in tutorial prose but fail the
// 4-rule TAUGHT bar (dedicated step + highlights/panelStateChanges +
// consequence + WHY). Treated as a gap (not confirmed). Existing CONFIRMED /
// CONFIRMED_BY_PARENT_ONLY / MISSING / RECLASSIFICATION behavior unchanged.
// ──────────────────────────────────────────────────────────────────────────────
describe('PR-X1 — MENTIONED_NOT_TAUGHT match_kind', () => {
  it('parseMatchTable accepts MENTIONED_NOT_TAUGHT rows', () => {
    const md = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| f1 | Emergency Loop | 56 | MENTIONED_NOT_TAUGHT | advanced-loops | step-8 | mentioned in details — no dedicated step |
| f2 | Phase Meter | 80 | MENTIONED_NOT_TAUGHT | shortcuts | step-2 | named but no highlights/panelStateChanges |
`;
    const rows = parseMatchTable(md);
    expect(rows).toHaveLength(2);
    expect(rows[0].matchKind).toBe('MENTIONED_NOT_TAUGHT');
    expect(rows[1].matchKind).toBe('MENTIONED_NOT_TAUGHT');
  });

  it('summarizeMatchTable counts MENTIONED_NOT_TAUGHT as gap (not confirmed)', () => {
    const md = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| f1 | Taught | 1 | CONFIRMED | t | s | hands-on |
| f2 | Mentioned | 2 | MENTIONED_NOT_TAUGHT | t | s | named only |
| f3 | Section | 3 | CONFIRMED_BY_PARENT_ONLY |  |  |  |
| f4 | Gone | 4 | MISSING |  |  |  |
`;
    const summary = summarizeMatchTable(parseMatchTable(md));
    expect(summary.total).toBe(4);
    expect(summary.confirmed).toBe(1); // only the CONFIRMED row
    expect(summary.mentionedNotTaughtGaps).toBe(1);
    expect(summary.parentOnlyGaps).toBe(1);
    expect(summary.missingGaps).toBe(1);
    expect(summary.coveragePct).toBe(25); // 1/4
  });

  it('mixed match-table: coveragePct only counts CONFIRMED + RECLASSIFICATION', () => {
    const md = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| a | A | 1 | CONFIRMED | t | s | x |
| b | B | 2 | CONFIRMED | t | s | x |
| c | C | 3 | RECLASSIFICATION | t | s | x |
| d | D | 4 | MENTIONED_NOT_TAUGHT | t | s | x |
| e | E | 5 | MENTIONED_NOT_TAUGHT | t | s | x |
`;
    const summary = summarizeMatchTable(parseMatchTable(md));
    expect(summary.confirmed).toBe(3); // 2 CONFIRMED + 1 RECLASSIFICATION
    expect(summary.mentionedNotTaughtGaps).toBe(2);
    expect(summary.coveragePct).toBe(60); // 3/5
  });

  it('backward compat: match-tables without MENTIONED_NOT_TAUGHT still summarize with 0 count', () => {
    const md = `
| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| f1 | Foo | 1 | CONFIRMED | t | s | x |
| f2 | Bar | 2 | MISSING |  |  |  |
`;
    const summary = summarizeMatchTable(parseMatchTable(md));
    expect(summary.mentionedNotTaughtGaps).toBe(0);
    expect(summary.confirmed).toBe(1);
    expect(summary.missingGaps).toBe(1);
  });

  it('unknown match_kind still dropped (validKinds gate)', () => {
    const md = `| f1 | name | page | INVENTED_KIND | tut | step | quote |`;
    expect(parseMatchTable(md)).toEqual([]);
  });
});
