/**
 * Tests for the shared batch parser (src/lib/pipeline/parse-batches.ts).
 *
 * Mirrors the regression-guard coverage from the original parseBatchesFromExtractor
 * fix (commit 9340015) so future refactors of the shared module stay safe.
 *
 * The cdj-3000 bug story: parseBatchesFromAuditor() silently returned [] for
 * months due to wrong file + wrong regex + silent try/catch. Tutorial-build
 * ran with 0 batches → produced 0 tutorials → tutorial-pr failed. These tests
 * ensure the format the auditor actually writes is correctly parsed.
 */
import { describe, it, expect } from 'vitest';
import { parseBatchesFromMarkdown } from '@/lib/pipeline/parse-batches';

describe('parseBatchesFromMarkdown', () => {
  it('parses the real cdj-3000 5-batch / 23-tutorial table', () => {
    const content = `# PASS 4 — Batch Plan (CDJ-3000)

## Batch Summary

| Batch | Tutorials | Count | Estimated Effort | Theme |
|-------|-----------|-------|------------------|-------|
| A | T01, T02, T15, T21 | 4 | ~6 hrs | Foundation & First Branch |
| B | T03, T19, T22, T23 | 4 | ~8 hrs | Core Navigation & Config |
| C | T04, T05, T06, T07, T20 | 5 | ~11 hrs | Playing Techniques |
| D | T08, T09, T11, T16, T18 | 5 | ~8 hrs | Intermediate |
| E | T10, T12, T13, T14, T17 | 5 | ~10 hrs | Advanced |
| **Total** | **T01–T23** | **23** | **~43 hrs** | |
`;
    const result = parseBatchesFromMarkdown(content);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ batchId: 'batch-a', tutorials: ['T01', 'T02', 'T15', 'T21'] });
    expect(result[4]).toEqual({ batchId: 'batch-e', tutorials: ['T10', 'T12', 'T13', 'T14', 'T17'] });
  });

  it('ignores the header separator row (no T-tokens)', () => {
    const content = `| Batch | Tutorials | Count |
|-------|-----------|-------|
| A | T01, T02 | 2 |
`;
    expect(parseBatchesFromMarkdown(content)).toHaveLength(1);
  });

  it('ignores the Total summary row (T01–T23 has no comma-separated tokens)', () => {
    const content = `| A | T01, T02 | 2 |
| **Total** | **T01–T23** | **23** |
`;
    const result = parseBatchesFromMarkdown(content);
    expect(result).toHaveLength(1);
    expect(result[0].batchId).toBe('batch-a');
  });

  it('dedupes duplicate batch IDs (first wins)', () => {
    const content = `| A | T01, T02 | 2 |
| A | T03, T04 | 2 |
`;
    const result = parseBatchesFromMarkdown(content);
    expect(result).toHaveLength(1);
    expect(result[0].tutorials).toEqual(['T01', 'T02']);
  });

  it('supports numeric batch IDs', () => {
    const content = `| 1 | T01, T02 | 2 |
| 2 | T03, T04 | 2 |
`;
    const result = parseBatchesFromMarkdown(content);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.batchId)).toEqual(['batch-1', 'batch-2']);
  });

  it('supports compound batch IDs (A-1, B-2)', () => {
    const content = `| A-1 | T01 | 1 |
| B-2 | T02 | 1 |
`;
    const result = parseBatchesFromMarkdown(content);
    expect(result.map(r => r.batchId)).toEqual(['batch-a-1', 'batch-b-2']);
  });

  it('returns [] for the OLD broken colon-prose format (regression guard)', () => {
    // This is the format the parser USED to expect before commit 9340015.
    // If this test ever starts passing, someone reverted that fix.
    const content = `batch A: T01, T02
batch B: T03, T04
`;
    expect(parseBatchesFromMarkdown(content)).toEqual([]);
  });

  it('returns [] for empty input', () => {
    expect(parseBatchesFromMarkdown('')).toEqual([]);
    expect(parseBatchesFromMarkdown('# Just a heading')).toEqual([]);
  });

  it('handles whitespace variations in the table cells', () => {
    const content = `|A|T01,T02|2|
| B  |  T03 ,  T04  | 2 |
`;
    const result = parseBatchesFromMarkdown(content);
    expect(result).toHaveLength(2);
    expect(result[0].tutorials).toEqual(['T01', 'T02']);
    expect(result[1].tutorials).toEqual(['T03', 'T04']);
  });

  it('is idempotent — calling twice yields identical output (regex lastIndex reset)', () => {
    const content = `| A | T01 | 1 |\n| B | T02 | 1 |\n`;
    const first = parseBatchesFromMarkdown(content);
    const second = parseBatchesFromMarkdown(content);
    expect(first).toEqual(second);
  });
});
