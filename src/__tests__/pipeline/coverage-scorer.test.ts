import { describe, it, expect } from 'vitest';
import { scoreCoverage, buildDirectivesFromVerdict } from '../../lib/pipeline/coverage-scorer';

// Helper: build a synthetic auditor markdown checkpoint
function makeCheckpoint(opts: {
  verdict?: string;
  score?: number;
  inventory?: number;
  curriculum?: number;
  dependency?: number;
  composite?: number;
  criticalGaps?: { name: string; pages: string }[];
  moderateGaps?: { name: string; pages: string }[];
  minorGaps?: { name: string; pages: string }[];
}): string {
  const lines: string[] = ['---'];
  if (opts.verdict) lines.push(`verdict: ${opts.verdict}`);
  if (opts.score != null) lines.push(`score: ${opts.score}`);
  lines.push('---', '');
  if (opts.inventory != null || opts.curriculum != null || opts.composite != null) {
    lines.push('## Score Breakdown', '');
    lines.push('| Metric | Score |');
    lines.push('|--------|-------|');
    if (opts.inventory != null) lines.push(`| Inventory coverage | ${opts.inventory} / 10 |`);
    if (opts.curriculum != null) lines.push(`| Curriculum coverage | ${opts.curriculum} / 10 |`);
    if (opts.dependency != null) lines.push(`| Dependency correctness | ${opts.dependency} / 10 |`);
    if (opts.composite != null) lines.push(`| **Composite** | **${opts.composite} / 10** |`);
    lines.push('');
  }
  if (opts.criticalGaps && opts.criticalGaps.length > 0) {
    lines.push('## Critical Gaps Blocking Approval', '');
    opts.criticalGaps.forEach((g, i) => {
      lines.push(`${i + 1}. **${g.name}** (${g.pages}) — placeholder description.`);
    });
    lines.push('');
  }
  if (opts.moderateGaps && opts.moderateGaps.length > 0) {
    lines.push('## Moderate Gaps', '');
    opts.moderateGaps.forEach((g, i) => {
      lines.push(`${i + 1}. **${g.name}** (${g.pages}) — should-fix.`);
    });
    lines.push('');
  }
  if (opts.minorGaps && opts.minorGaps.length > 0) {
    lines.push('## Minor Gaps', '');
    opts.minorGaps.forEach((g, i) => {
      lines.push(`${i + 1}. **${g.name}** (${g.pages}) — nice-to-have.`);
    });
    lines.push('');
  }
  return lines.join('\n');
}

describe('scoreCoverage', () => {
  describe('APPROVED', () => {
    it('returns APPROVED when coverage ≥ 95% and no critical gaps', () => {
      const md = makeCheckpoint({ inventory: 9.6, composite: 9.6, moderateGaps: [{ name: 'X', pages: 'p.50' }] });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('APPROVED');
      expect(v.shouldAutoRetry).toBe(false);
    });

    it('returns APPROVED on a perfectly clean checkpoint', () => {
      const md = makeCheckpoint({ inventory: 10, composite: 10 });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('APPROVED');
    });
  });

  describe('APPROVED_WITH_WARNINGS', () => {
    it('returns APPROVED_WITH_WARNINGS for solid but imperfect curricula', () => {
      const md = makeCheckpoint({
        inventory: 9.2,
        composite: 9.2,
        moderateGaps: [
          { name: 'A', pages: 'p.10' },
          { name: 'B', pages: 'p.20' },
          { name: 'C', pages: 'p.30' },
          { name: 'D', pages: 'p.40' },
        ],
      });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('APPROVED_WITH_WARNINGS');
      expect(v.shouldAutoRetry).toBe(false);
    });
  });

  describe('REJECTED with auto-retry', () => {
    it('returns REJECTED + shouldAutoRetry=true on critical gaps with cited pages', () => {
      const md = makeCheckpoint({
        inventory: 9.3,
        composite: 8.8,
        criticalGaps: [
          { name: 'Poly Chord Wizard', pages: 'pp. 70-72' },
          { name: 'Poly Chain', pages: 'pp. 76-77' },
        ],
      });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('REJECTED');
      expect(v.shouldAutoRetry).toBe(true);
      expect(v.criticalGaps).toHaveLength(2);
      expect(v.criticalGaps[0].feature).toBe('Poly Chord Wizard');
    });

    it('REJECTS when inventory coverage drops below 9.0 even without critical gaps', () => {
      const md = makeCheckpoint({ inventory: 8.5, composite: 8.5 });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('REJECTED');
      expect(v.shouldAutoRetry).toBe(true);
    });

    it('REJECTS when moderate gaps exceed threshold', () => {
      const tooMany = Array.from({ length: 10 }, (_, i) => ({ name: `mod${i}`, pages: `p.${i}` }));
      const md = makeCheckpoint({ inventory: 9.2, composite: 9.2, moderateGaps: tooMany });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('REJECTED');
      expect(v.shouldAutoRetry).toBe(true);
    });
  });

  describe('CRITICAL — auto-retry now allowed (Phase 3a 2026-05-26)', () => {
    it('CRITICAL when inventory below 6.0 — shouldAutoRetry=true post-Phase-3a', () => {
      const md = makeCheckpoint({ inventory: 5.5, composite: 5.5 });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('CRITICAL');
      // CHANGED 2026-05-26: was false (escalate-only). Now true so devices like
      // CDJ-3000 at 55% can self-heal via the retry loop. MAX_AUDIT_RETRIES cap
      // + strict convergence checks (lostFeatures, stillMissingDirectives)
      // prevent runaway loops.
      expect(v.shouldAutoRetry).toBe(true);
    });

    it('CRITICAL when > 3 critical gaps', () => {
      const md = makeCheckpoint({
        inventory: 9.3,
        composite: 8.5,
        criticalGaps: [
          { name: 'A', pages: 'p.10' },
          { name: 'B', pages: 'p.20' },
          { name: 'C', pages: 'p.30' },
          { name: 'D', pages: 'p.40' },
        ],
      });
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('CRITICAL');
      expect(v.shouldAutoRetry).toBe(false);
    });
  });

  describe('convergence check', () => {
    it('marks regressed=true when retry introduces NEW critical gaps', () => {
      const md = makeCheckpoint({
        inventory: 9.2,
        composite: 8.8,
        criticalGaps: [
          { name: 'gap-A', pages: 'p.10' },
          { name: 'gap-NEW', pages: 'p.99' }, // new this round
        ],
      });
      const v = scoreCoverage(md, { previousCriticalGapFeatures: ['gap-A', 'gap-B'] });
      expect(v.regressed).toBe(true);
      // Regression escalates (no auto-retry) even though normally it would
      expect(v.shouldAutoRetry).toBe(false);
    });

    it('does NOT mark regressed when retry only resolves prior gaps', () => {
      const md = makeCheckpoint({
        inventory: 9.2,
        composite: 8.8,
        criticalGaps: [{ name: 'gap-A', pages: 'p.10' }],
      });
      const v = scoreCoverage(md, { previousCriticalGapFeatures: ['gap-A', 'gap-B', 'gap-C'] });
      expect(v.regressed).toBe(false);
      expect(v.shouldAutoRetry).toBe(true);
    });

    it('does NOT flag regression on first run (no previous gaps)', () => {
      const md = makeCheckpoint({
        inventory: 9.2,
        composite: 8.8,
        criticalGaps: [{ name: 'gap-A', pages: 'p.10' }],
      });
      const v = scoreCoverage(md);
      expect(v.regressed).toBe(false);
    });
  });

  describe('parsing edge cases', () => {
    it('handles missing score breakdown by falling back to 0', () => {
      const md = '---\nverdict: REJECTED\n---\n\nNo scores.';
      const v = scoreCoverage(md);
      expect(v.verdict).toBe('CRITICAL'); // 0 < 6.0
    });

    it('parses gaps with dash-bullets too (not just numbered)', () => {
      const md = `## Critical Gaps\n- **Feature X** (p. 50) — description\n`;
      const v = scoreCoverage(md);
      expect(v.criticalGaps).toHaveLength(1);
      expect(v.criticalGaps[0].feature).toBe('Feature X');
    });
  });

  describe('buildDirectivesFromVerdict', () => {
    it('writes critical + moderate gaps to the directives output', () => {
      const md = makeCheckpoint({
        inventory: 9.0,
        composite: 8.8,
        criticalGaps: [{ name: 'Poly Chain', pages: 'pp. 76-77' }],
        moderateGaps: [{ name: 'Favorites', pages: 'p. 120' }],
      });
      const v = scoreCoverage(md);
      const directives = buildDirectivesFromVerdict(v);
      expect(directives).toContain('Critical Gaps (MUST cover)');
      expect(directives).toContain('Poly Chain');
      expect(directives).toContain('Moderate Gaps');
      expect(directives).toContain('Favorites');
      expect(directives).toContain('pp. 76-77');
    });
  });

  // ─── Phase 3a: grandfather, CRITICAL auto-retry, strict convergence ──────

  // Helper: synthesize a match-table.md fixture from a list of features
  function makeMatchTable(rows: { id: string; kind: 'CONFIRMED' | 'MISSING' | 'CONFIRMED_BY_PARENT_ONLY' }[]): string {
    const header = '| feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |\n| --- | --- | --- | --- | --- | --- | --- |';
    const body = rows.map(r =>
      `| ${r.id} | ${r.id} display | 42 | ${r.kind} | t-1 | s-1 | "..." |`
    ).join('\n');
    return `${header}\n${body}`;
  }

  describe('Phase 3a — grandfather list', () => {
    it('fantom-08 bypasses gate even at 30% coverage', () => {
      const md = makeCheckpoint({ inventory: 3.0, composite: 3.0 });
      const matchTable = makeMatchTable([
        { id: 'a', kind: 'CONFIRMED' },
        { id: 'b', kind: 'MISSING' },
        { id: 'c', kind: 'MISSING' },
        { id: 'd', kind: 'MISSING' },
      ]);
      const v = scoreCoverage(md, { matchTableMarkdown: matchTable }, 'fantom-08');
      expect(v.verdict).toBe('APPROVED_WITH_WARNINGS');
      expect(v.shouldAutoRetry).toBe(false);
      expect(v.reason).toContain('grandfathered');
    });

    it('non-grandfathered device at 30% coverage gets CRITICAL auto-retry', () => {
      const md = makeCheckpoint({ inventory: 3.0, composite: 3.0 });
      const matchTable = makeMatchTable([
        { id: 'a', kind: 'CONFIRMED' },
        { id: 'b', kind: 'MISSING' },
        { id: 'c', kind: 'MISSING' },
        { id: 'd', kind: 'MISSING' },
      ]);
      const v = scoreCoverage(md, { matchTableMarkdown: matchTable }, 'cdj-3000');
      expect(v.verdict).toBe('CRITICAL');
      expect(v.shouldAutoRetry).toBe(true); // CHANGED in Phase 3a — was false
    });

    it('no deviceId passed → behaves as non-grandfathered (CRITICAL auto-retry)', () => {
      const md = makeCheckpoint({ inventory: 3.0, composite: 3.0 });
      const v = scoreCoverage(md, {});
      expect(v.verdict).toBe('CRITICAL');
      expect(v.shouldAutoRetry).toBe(true);
    });
  });

  describe('Phase 3a — CRITICAL auto-retry behavior', () => {
    it('CDJ-3000 at 55% (CRITICAL) gets shouldAutoRetry=true', () => {
      const md = makeCheckpoint({ inventory: 5.5, composite: 5.5 });
      const v = scoreCoverage(md, {}, 'cdj-3000');
      expect(v.verdict).toBe('CRITICAL');
      expect(v.shouldAutoRetry).toBe(true);
    });

    it('REJECTED at 85% still auto-retries (existing behavior preserved)', () => {
      const md = makeCheckpoint({ inventory: 8.5, composite: 8.5 });
      const v = scoreCoverage(md, {}, 'cdj-3000');
      expect(v.verdict).toBe('REJECTED');
      expect(v.shouldAutoRetry).toBe(true);
    });

    it('APPROVED_WITH_WARNINGS at 92% does not auto-retry', () => {
      const md = makeCheckpoint({ inventory: 9.2, composite: 9.2 });
      const v = scoreCoverage(md, {}, 'cdj-3000');
      expect(v.verdict).toBe('APPROVED_WITH_WARNINGS');
      expect(v.shouldAutoRetry).toBe(false);
    });

    it('APPROVED clean at 96% does not auto-retry', () => {
      const md = makeCheckpoint({ inventory: 9.6, composite: 9.6 });
      const v = scoreCoverage(md, {}, 'cdj-3000');
      expect(v.verdict).toBe('APPROVED');
      expect(v.shouldAutoRetry).toBe(false);
    });
  });

  describe('Phase 3a — strict convergence checks', () => {
    it('halts when retry REMOVES previously CONFIRMED features (shuffle without filling)', () => {
      const md = makeCheckpoint({ inventory: 8.0, composite: 8.0 });
      // Current run: only feature-a is CONFIRMED, b lost
      const matchTable = makeMatchTable([
        { id: 'feature-a', kind: 'CONFIRMED' },
        { id: 'new-c', kind: 'CONFIRMED' },
        { id: 'feature-b', kind: 'MISSING' }, // was confirmed before, now missing
      ]);
      const v = scoreCoverage(md, {
        matchTableMarkdown: matchTable,
        previousConfirmedFeatures: ['feature-a', 'feature-b'],
      }, 'cdj-3000');
      expect(v.verdict).toBe('REJECTED');
      expect(v.shouldAutoRetry).toBe(false); // halt loop
      expect(v.regressed).toBe(true);
      expect(v.reason).toContain('REMOVED');
      expect(v.reason).toContain('feature-b');
    });

    it('halts when retry does NOT fill directive (critical gap) from previous run', () => {
      const md = makeCheckpoint({
        inventory: 8.0, composite: 8.0,
        criticalGaps: [{ name: 'unfilled-gap', pages: 'p. 99' }],
      });
      const matchTable = makeMatchTable([
        { id: 'unfilled-gap', kind: 'MISSING' }, // directive said cover this, still missing
        { id: 'something-else', kind: 'CONFIRMED' },
      ]);
      const v = scoreCoverage(md, {
        matchTableMarkdown: matchTable,
        previousCriticalGapFeatures: ['unfilled-gap'],
      }, 'cdj-3000');
      expect(v.verdict).toBe('REJECTED');
      expect(v.shouldAutoRetry).toBe(false);
      expect(v.regressed).toBe(true);
      expect(v.reason).toContain('did not fill');
      expect(v.reason).toContain('unfilled-gap');
    });

    it('allows retry to proceed when previous CONFIRMED features still confirmed + no regression', () => {
      const md = makeCheckpoint({ inventory: 8.0, composite: 8.0 });
      const matchTable = makeMatchTable([
        { id: 'feature-a', kind: 'CONFIRMED' },
        { id: 'feature-b', kind: 'CONFIRMED' },
        { id: 'new-feature-c', kind: 'CONFIRMED' },
        { id: 'still-missing-d', kind: 'MISSING' },
      ]);
      const v = scoreCoverage(md, {
        matchTableMarkdown: matchTable,
        previousConfirmedFeatures: ['feature-a', 'feature-b'],
      }, 'cdj-3000');
      expect(v.verdict).toBe('REJECTED');
      expect(v.shouldAutoRetry).toBe(true); // normal auto-retry, not regressed
      expect(v.regressed).toBe(false);
    });
  });
});
