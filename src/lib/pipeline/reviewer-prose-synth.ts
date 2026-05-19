/**
 * Reviewer-prose synthesis — recover an APPROVED/REJECTED verdict from a
 * reviewer agent's stdout when the agent forgot to write checkpoint.md.
 *
 * Discovered during cdj-3000 2026-05-18: the tutorial-reviewer SOUL didn't
 * mandate writing checkpoint frontmatter, so 4 of 5 batches' reviewers exited
 * cleanly without a verdict — runner read no verdict → falsely-rejected the
 * batch → manual JSON patching to recover. The SOUL fix (PR-D) prevents this
 * for fresh worktrees, but existing worktrees stay broken until regen. This
 * module bridges the transition.
 *
 * STRICT GUARDS (all must pass) for auto-synth to declare APPROVED:
 *   1. exit code 0
 *   2. wall time > 60s (real reviews take time; fast-exit suggests bug)
 *   3. cost > $0.50 (real reviews cost money; cheap suggests no real work)
 *   4. stdout contains explicit `Verdict: <APPROVED|SHIP|PASS|SHIPPED>` pattern
 *   5. stdout DOES NOT contain `REJECTED|REVISIONS NEEDED|critical|FAIL`
 *   6. expected batchId appears in stdout within 200 chars of the verdict
 *      (proves reviewer was reviewing THIS batch, not narrating a previous one)
 *
 * If ANY guard fails, return { synthesized: false } and let the runner pause
 * for admin via GATE 4. Synth never bypasses human judgment when ambiguous.
 */

export interface SynthInput {
  /** Full reviewer stdout (joined lines). */
  output: string;
  /** Expected batchId for the batch being reviewed. */
  expectedBatchId: string;
  /** Agent exit code. */
  exitCode: number;
  /** Wall-clock runtime of the reviewer invocation, ms. */
  wallMs: number;
  /** Reported cost from cost tracker, USD. */
  costUsd: number;
}

export interface SynthResult {
  synthesized: boolean;
  verdict?: 'APPROVED' | 'REJECTED';
  reason: string;
  /** Snippet of the verdict line from stdout, for audit. */
  evidence?: string;
}

// Tunable guards
const MIN_WALL_MS = 60_000;
const MIN_COST_USD = 0.5;
const BATCHID_PROXIMITY_CHARS = 200;

// Verdict regex: anchored to Verdict: keyword, allows markdown bold (**),
// requires whitespace around. SHIP/SHIPPED/PASS aliased to APPROVED.
const VERDICT_PATTERN =
  /verdict\s*:\s*\**\s*(APPROVED|REJECTED|SHIP|SHIPPED|PASS|FAIL)\b/i;

// If any of these appear in stdout, the reviewer found problems — never
// auto-synth APPROVED regardless of the Verdict: line (could be a header
// that's later contradicted by the body).
// Allows plurals (s?) and common phrasings.
const REJECTION_KEYWORDS =
  /\b(REJECTED|REVISIONS\s+NEEDED|critical\s+(?:issue|error|failure)s?|FAIL)\b/i;

export function synthesizeReviewerVerdict(input: SynthInput): SynthResult {
  // Guard 1: clean exit
  if (input.exitCode !== 0) {
    return { synthesized: false, reason: `exit code ${input.exitCode} (non-zero)` };
  }

  // Guard 2: minimum wall time (filter out fast-exit bugs)
  if (input.wallMs < MIN_WALL_MS) {
    return {
      synthesized: false,
      reason: `wall time ${Math.round(input.wallMs / 1000)}s below ${MIN_WALL_MS / 1000}s threshold (suggests reviewer didn't do real work)`,
    };
  }

  // Guard 3: minimum cost (filter out "ran but did nothing")
  if (input.costUsd < MIN_COST_USD) {
    return {
      synthesized: false,
      reason: `cost $${input.costUsd.toFixed(2)} below $${MIN_COST_USD} threshold (suggests reviewer didn't do real work)`,
    };
  }

  // Guard 4: explicit Verdict: pattern present
  const verdictMatch = VERDICT_PATTERN.exec(input.output);
  if (!verdictMatch) {
    return {
      synthesized: false,
      reason: 'no explicit `Verdict: ...` line found in reviewer prose',
    };
  }
  const verdictRaw = verdictMatch[1].toUpperCase();
  const verdictNormalized: 'APPROVED' | 'REJECTED' =
    verdictRaw === 'SHIP' || verdictRaw === 'SHIPPED' || verdictRaw === 'PASS'
      ? 'APPROVED'
      : verdictRaw === 'FAIL'
        ? 'REJECTED'
        : (verdictRaw as 'APPROVED' | 'REJECTED');

  // Guard 5: no rejection keywords elsewhere in body
  // (only applies when verdict is APPROVED — REJECTED is consistent with itself)
  if (verdictNormalized === 'APPROVED') {
    const matchIdx = verdictMatch.index;
    const bodyAfter = input.output.slice(matchIdx + verdictMatch[0].length);
    if (REJECTION_KEYWORDS.test(bodyAfter)) {
      return {
        synthesized: false,
        reason: 'reviewer wrote APPROVED verdict but body contains rejection keywords (likely "approved but with X concerns")',
        evidence: verdictMatch[0],
      };
    }
  }

  // Guard 6: expected batchId within proximity of verdict
  const matchIdx = verdictMatch.index;
  const windowStart = Math.max(0, matchIdx - BATCHID_PROXIMITY_CHARS);
  const windowEnd = matchIdx + verdictMatch[0].length + BATCHID_PROXIMITY_CHARS;
  const window = input.output.slice(windowStart, windowEnd);
  // Accept either "batch-a" or "batch A" or "Batch A" near the verdict
  const batchLetter = input.expectedBatchId.replace(/^batch-/, '');
  const batchIdPattern = new RegExp(
    `batch[\\s-]+(${batchLetter}|${batchLetter.toUpperCase()})\\b`,
    'i',
  );
  if (!batchIdPattern.test(window)) {
    return {
      synthesized: false,
      reason: `expected batchId "${input.expectedBatchId}" not found within ${BATCHID_PROXIMITY_CHARS} chars of verdict (reviewer may be narrating a different batch)`,
      evidence: verdictMatch[0],
    };
  }

  // All guards pass — synthesize
  return {
    synthesized: true,
    verdict: verdictNormalized,
    reason: `prose verdict "${verdictMatch[0]}" matches expected batch "${input.expectedBatchId}" with no contradicting body language`,
    evidence: verdictMatch[0],
  };
}
