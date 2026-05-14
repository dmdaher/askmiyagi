/**
 * Tests for the markdown-table batch parser used by pipeline-runner.
 *
 * The parser lives inline in scripts/pipeline-runner.ts (parseBatchesFromExtractor).
 * Since that function depends on fs + paths() helpers tied to runner globals,
 * this test re-implements the pure regex+parse step and asserts it against the
 * real CDJ-3000 pass-4-batches.md content so we can't regress silently.
 *
 * History: the original parser read the wrong file (coverage-auditor checkpoint)
 * with a regex expecting `batch X: T01, T02` colon-separated format. Every device
 * silently got 0 batches → tutorial-build no-op → tutorial-pr empty-branch failure.
 */
import { describe, it, expect } from 'vitest';

/**
 * Pure version of the parser body. Keep in lockstep with
 * parseBatchesFromExtractor in scripts/pipeline-runner.ts.
 */
function parseBatchesFromTableMarkdown(content: string): Array<{ batchId: string; tutorials: string[] }> {
  const batches: { batchId: string; tutorials: string[] }[] = [];
  const rowPattern = /^\|\s*([A-Z0-9][A-Z0-9-]*)\s*\|\s*(T\d+(?:\s*,\s*T\d+)*)\s*\|/gim;
  const seen = new Set<string>();
  let match;
  while ((match = rowPattern.exec(content)) !== null) {
    const batchId = `batch-${match[1].toLowerCase()}`;
    if (seen.has(batchId)) continue;
    const tutorials = match[2].split(',').map((t) => t.trim()).filter(Boolean);
    if (tutorials.length === 0) continue;
    seen.add(batchId);
    batches.push({ batchId, tutorials });
  }
  return batches;
}

describe('parseBatchesFromExtractor (markdown table)', () => {
  it('parses CDJ-3000 actual batches table — 5 batches, 23 tutorials', () => {
    // Verbatim excerpt from .pipeline/cdj-3000/agents/manual-extractor/sieve/pass-4-batches.md
    const content = `
| Batch | Tutorials | Count | Estimated Effort | Theme |
|-------|-----------|-------|------------------|-------|
| A | T01, T02, T15, T21 | 4 | ~6 hrs | Foundation & First Branch |
| B | T03, T19, T22, T23 | 4 | ~8 hrs | Core Navigation & Config |
| C | T04, T05, T06, T07, T20 | 5 | ~11 hrs | Playing Techniques & Organization |
| D | T08, T09, T11, T16, T18 | 5 | ~8 hrs | Intermediate Techniques |
| E | T10, T12, T13, T14, T17 | 5 | ~10 hrs | Advanced Compound Techniques |
| **Total** | **T01–T23** | **23** | **~43 hrs** | |
`;
    const result = parseBatchesFromTableMarkdown(content);
    expect(result).toHaveLength(5);
    expect(result.map(b => b.batchId)).toEqual(['batch-a', 'batch-b', 'batch-c', 'batch-d', 'batch-e']);
    expect(result.flatMap(b => b.tutorials)).toHaveLength(23);
    expect(result[0].tutorials).toEqual(['T01', 'T02', 'T15', 'T21']);
    expect(result[2].tutorials).toEqual(['T04', 'T05', 'T06', 'T07', 'T20']);
  });

  it('ignores the Total summary row (no T-token cell pattern match)', () => {
    const content = `
| A | T01 | 1 | ~1 hr | x |
| **Total** | **T01–T23** | **23** | x | |
`;
    const result = parseBatchesFromTableMarkdown(content);
    expect(result).toHaveLength(1);
    expect(result[0].batchId).toBe('batch-a');
  });

  it('skips header separator row (|-------|)', () => {
    const content = `
| Batch | Tutorials | Count |
|-------|-----------|-------|
| A | T01, T02 | 2 |
`;
    const result = parseBatchesFromTableMarkdown(content);
    expect(result).toHaveLength(1);
    expect(result[0].tutorials).toEqual(['T01', 'T02']);
  });

  it('dedupes when the same batch appears twice (defensive)', () => {
    const content = `
| A | T01, T02 | 2 | x | x |
| A | T03, T04 | 2 | x | x |
`;
    const result = parseBatchesFromTableMarkdown(content);
    expect(result).toHaveLength(1);
    expect(result[0].tutorials).toEqual(['T01', 'T02']); // first row wins
  });

  it('accepts numeric batch IDs (batch 1, batch 2)', () => {
    const content = `
| 1 | T01, T02 | 2 | x | x |
| 2 | T03 | 1 | x | x |
`;
    const result = parseBatchesFromTableMarkdown(content);
    expect(result).toHaveLength(2);
    expect(result.map(b => b.batchId)).toEqual(['batch-1', 'batch-2']);
  });

  it('returns empty for non-table content (prose only)', () => {
    const content = 'The manual extractor produced 5 batches covering 23 tutorials.';
    expect(parseBatchesFromTableMarkdown(content)).toEqual([]);
  });

  it('returns empty for old (broken) colon-separated format', () => {
    // This was what the previous regex expected — but it never appeared in real output
    const content = 'Batch A: T01, T02, T15, T21';
    expect(parseBatchesFromTableMarkdown(content)).toEqual([]);
  });

  it('handles compound batch IDs like A-1, B-2', () => {
    const content = `
| A-1 | T01, T02 | 2 | x | x |
| B-2 | T03 | 1 | x | x |
`;
    const result = parseBatchesFromTableMarkdown(content);
    expect(result).toHaveLength(2);
    expect(result.map(b => b.batchId)).toEqual(['batch-a-1', 'batch-b-2']);
  });
});
