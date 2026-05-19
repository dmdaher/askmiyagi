/**
 * Tests for the reviewer-prose verdict synthesizer.
 *
 * The synth is the difference between "admin manually patches state.json" and
 * "pipeline continues automatically" when the reviewer SOUL bug fires. These
 * tests pin the strict guards so a future refactor can't accidentally widen
 * the criteria and create a false-approval risk.
 */
import { describe, it, expect } from 'vitest';
import { synthesizeReviewerVerdict } from '@/lib/pipeline/reviewer-prose-synth';

const baseInput = {
  output: '',
  expectedBatchId: 'batch-c',
  exitCode: 0,
  wallMs: 120_000,
  costUsd: 1.5,
};

describe('synthesizeReviewerVerdict', () => {
  describe('strict guards — refuses to synth when guards fail', () => {
    it('refuses on non-zero exit', () => {
      const r = synthesizeReviewerVerdict({ ...baseInput, exitCode: 1 });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/non-zero/);
    });

    it('refuses when wall time < 60s', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        wallMs: 30_000,
        output: 'Verdict: APPROVED for batch C',
      });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/wall time/);
    });

    it('refuses when cost < $0.50', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        costUsd: 0.1,
        output: 'Verdict: APPROVED for batch C',
      });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/cost/);
    });

    it('refuses when no Verdict: line is present', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: 'The tutorials look great for batch C.',
      });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/no explicit/);
    });

    it('refuses when batchId is missing near verdict', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: 'Verdict: APPROVED.\n\nThis is a long passing review of some tutorials.',
      });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/batchId/);
    });

    it('refuses when batchId is far from verdict (>200 chars)', () => {
      const filler = 'word '.repeat(50);  // ~250 chars
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: `Verdict: APPROVED. ${filler} Batch C contents looked great.`,
      });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/batchId/);
    });

    it('refuses when APPROVED but body contains REJECTED keywords', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: `Verdict: APPROVED for batch C. However, several critical issues were found.`,
      });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/rejection keywords/);
    });

    it('refuses when APPROVED but body says REVISIONS NEEDED', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: `Verdict: APPROVED for batch C. On reflection, REVISIONS NEEDED.`,
      });
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/rejection keywords/);
    });
  });

  describe('successful synth — all guards pass', () => {
    it('synthesizes APPROVED from explicit "Verdict: APPROVED" + batchId', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: '## Batch C Review\n\nVerdict: APPROVED\n\nAll tutorials clean.',
      });
      expect(r.synthesized).toBe(true);
      expect(r.verdict).toBe('APPROVED');
      expect(r.evidence).toMatch(/APPROVED/);
    });

    it('synthesizes APPROVED from "Verdict: SHIP" alias (cdj-3000 batch-a pattern)', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        expectedBatchId: 'batch-a',
        output: '# Batch A Review — CDJ-3000\n\n**Verdict: SHIP** — All clean.',
      });
      expect(r.synthesized).toBe(true);
      expect(r.verdict).toBe('APPROVED');
    });

    it('synthesizes APPROVED from "Verdict: PASS" alias', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: 'Batch C check — Verdict: PASS',
      });
      expect(r.synthesized).toBe(true);
      expect(r.verdict).toBe('APPROVED');
    });

    it('synthesizes REJECTED when verdict explicit + batchId match', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: 'Batch C verdict: REJECTED — major issues with tutorial T05.',
      });
      expect(r.synthesized).toBe(true);
      expect(r.verdict).toBe('REJECTED');
    });

    it('handles markdown bold formatting (**Verdict: APPROVED**)', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: '# Batch C Audit\n\n**Verdict: APPROVED** — looks good.',
      });
      expect(r.synthesized).toBe(true);
      expect(r.verdict).toBe('APPROVED');
    });
  });

  describe('regression guards — defends against false-positive cases', () => {
    it('refuses "Verdict: REVISIONS NEEDED" (not a valid clean-pass alias)', () => {
      // Tonight's actual cdj-3000 batch-c case
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        output: 'Batch C Review — Verdict: REVISIONS NEEDED (3 minor nits).',
      });
      expect(r.synthesized).toBe(false);
    });

    it('refuses when verdict is for a different batch (wrong batchId near)', () => {
      const r = synthesizeReviewerVerdict({
        ...baseInput,
        expectedBatchId: 'batch-c',
        output: 'Looking at the recent context: Verdict: APPROVED for batch B. Currently I am preparing to look at C.',
      });
      // "batch B" near verdict, not "batch C" → refuses
      expect(r.synthesized).toBe(false);
      expect(r.reason).toMatch(/batchId/);
    });
  });
});
