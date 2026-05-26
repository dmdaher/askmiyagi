/**
 * Unit tests for /api/pipeline/[deviceId]/recheck-coverage
 *
 * Pure-function tests of preview + helpers + parse pipeline. The agent
 * invocation itself is exercised in the integration script
 * (scripts/_integration-test-recheck-coverage.ts).
 */
import { describe, expect, it } from 'vitest';
import { parseMatchTable, summarizeMatchTable } from '@/lib/pipeline/coverage-scorer';

describe('recheck-coverage — match-table parsing pipeline', () => {
  it('parses a typical agent-emitted match-table into structured rows', () => {
    const markdown = `# Match Table

| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| feat_001 | Touch Preview | 19 | MISSING |  |  |  |
| feat_002 | Hot Cue 8 | 26 | CONFIRMED | hot-cues | 5 | "tap HOT CUE 8 to access" |
| feat_003 | Beat Jump Memory | 31 | CONFIRMED_BY_PARENT_ONLY | beat-jump |  | (section exists) |
| feat_004 | Loop Active LED | 22 | RECLASSIFICATION | loop-indicator | 3 | "Loop Indicator lights" |
`;
    const rows = parseMatchTable(markdown);
    expect(rows).toHaveLength(4);
    expect(rows[0].matchKind).toBe('MISSING');
    expect(rows[0].featureName).toBe('Touch Preview');
    expect(rows[1].matchKind).toBe('CONFIRMED');
    expect(rows[1].tutorialId).toBe('hot-cues');
    expect(rows[2].matchKind).toBe('CONFIRMED_BY_PARENT_ONLY');
    expect(rows[3].matchKind).toBe('RECLASSIFICATION');
  });

  it('summarizes rows into counts that drive the modal display', () => {
    const markdown = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| feat_001 | A | 1 | MISSING |  |  |  |
| feat_002 | B | 2 | MISSING |  |  |  |
| feat_003 | C | 3 | CONFIRMED | t1 | 1 | "x" |
| feat_004 | D | 4 | CONFIRMED_BY_PARENT_ONLY | t2 |  | (section) |
`;
    const rows = parseMatchTable(markdown);
    const summary = summarizeMatchTable(rows);
    expect(summary.total).toBe(4);
    expect(summary.confirmed).toBe(1);
    expect(summary.missingGaps).toBe(2);
    expect(summary.parentOnlyGaps).toBe(1);
  });

  it('handles empty match-table (no features) without crashing', () => {
    const markdown = `# Match Table\n\n(none yet)\n`;
    const rows = parseMatchTable(markdown);
    expect(rows).toHaveLength(0);
    const summary = summarizeMatchTable(rows);
    expect(summary.total).toBe(0);
    expect(summary.confirmed).toBe(0);
    expect(summary.coveragePct).toBe(0); // NaN-guard
  });

  it('filters MISSING rows correctly (modal red-cards as gaps)', () => {
    const markdown = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| feat_001 | Missing-A | 1 | MISSING |  |  |  |
| feat_002 | Confirmed-B | 2 | CONFIRMED | t1 | 1 | "x" |
| feat_003 | Missing-C | 3 | MISSING |  |  |  |
`;
    const rows = parseMatchTable(markdown);
    const missing = rows.filter((r) => r.matchKind === 'MISSING');
    expect(missing).toHaveLength(2);
    expect(missing.map((r) => r.featureName)).toEqual(['Missing-A', 'Missing-C']);
  });

  it('filters PARENT_ONLY rows correctly (modal amber-cards)', () => {
    const markdown = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| feat_001 | A | 1 | CONFIRMED_BY_PARENT_ONLY | t1 |  | (section) |
| feat_002 | B | 2 | CONFIRMED | t1 | 5 | "x" |
| feat_003 | C | 3 | CONFIRMED_BY_PARENT_ONLY | t2 |  | (section) |
`;
    const rows = parseMatchTable(markdown);
    const parentOnly = rows.filter((r) => r.matchKind === 'CONFIRMED_BY_PARENT_ONLY');
    expect(parentOnly).toHaveLength(2);
  });

  it('coverage percentage calculation mirrors modal logic', () => {
    const markdown = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| feat_001 | A | 1 | CONFIRMED | t1 | 1 | "x" |
| feat_002 | B | 2 | CONFIRMED | t1 | 2 | "y" |
| feat_003 | C | 3 | CONFIRMED | t1 | 3 | "z" |
| feat_004 | D | 4 | CONFIRMED | t2 | 1 | "w" |
| feat_005 | E | 5 | MISSING |  |  |  |
`;
    const rows = parseMatchTable(markdown);
    const summary = summarizeMatchTable(rows);
    expect(summary.coveragePct).toBe(80); // 4 of 5
  });

  it('counts RECLASSIFICATION as confirmed (per coverage-scorer rule)', () => {
    const markdown = `| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
| --- | --- | --- | --- | --- | --- | --- |
| feat_001 | A | 1 | RECLASSIFICATION | t1 | 2 | "renamed" |
`;
    const rows = parseMatchTable(markdown);
    const summary = summarizeMatchTable(rows);
    expect(summary.confirmed).toBe(1);
  });

  it('round-trips with the synthetic fixture from PR #166 (80% coverage)', () => {
    // Uses the same fixture that proves the canonical scoring behavior
    const fs = require('fs');
    const path = require('path');
    const markdown = fs.readFileSync(
      path.join(process.cwd(), 'src/lib/pipeline/__tests__/fixtures/match-table-synthetic.md'),
      'utf-8',
    );
    const rows = parseMatchTable(markdown);
    expect(rows.length).toBeGreaterThan(0);
    const summary = summarizeMatchTable(rows);
    expect(summary.coveragePct).toBe(80); // per fixture comment header
  });
});
