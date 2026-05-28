/**
 * Coverage Scorer — deterministic verdict from the coverage-auditor's output.
 *
 * The auditor LLM produces structured findings (independent feature list,
 * gap categorization, page citations). This script applies CODIFIED
 * thresholds to those findings to decide the verdict — no more LLM
 * inventing approval criteria on the fly.
 *
 * Why split: the LLM is good at perception (reading the manual, identifying
 * features, judging significance) and bad at arithmetic (computing coverage
 * %, comparing thresholds, applying same rules consistently across runs).
 * This file handles the arithmetic.
 *
 * Single source of truth for verdict thresholds. Caller (pipeline runner)
 * reads the auditor's checkpoint.md, calls scoreCoverage(), gets a
 * deterministic verdict + the directives to feed back to the extractor.
 *
 * Origin: 2026-05-10.
 */

export type CoverageVerdict = 'CRITICAL' | 'REJECTED' | 'APPROVED_WITH_WARNINGS' | 'APPROVED' | 'MATCH_TABLE_CONFLICT';

/** match-table.md row kinds. See `.claude/agents/coverage-auditor.md` Phase 2 §1.
 *  MENTIONED_NOT_TAUGHT: feature appears in a tutorial's prose but the step
 *  lacks the 4 TAUGHT criteria (dedicated step, highlights+panelStateChanges,
 *  visible consequence, WHY explanation). Counts as a gap. */
export type MatchKind =
  | 'CONFIRMED'
  | 'CONFIRMED_BY_PARENT_ONLY'
  | 'MENTIONED_NOT_TAUGHT'
  | 'MISSING'
  | 'RECLASSIFICATION';

export interface MatchRow {
  featureId: string;
  featureName: string;
  page: string;
  matchKind: MatchKind;
  tutorialId: string;
  stepId: string;
  evidenceQuote: string;
}

export interface MatchTableSummary {
  total: number;
  confirmed: number;            // CONFIRMED + RECLASSIFICATION (both indicate a tutorial teaches it)
  parentOnlyGaps: number;       // CONFIRMED_BY_PARENT_ONLY (section covered, feature not specifically taught)
  mentionedNotTaughtGaps: number; // MENTIONED_NOT_TAUGHT (feature appears in prose but step lacks hands-on practice)
  missingGaps: number;          // MISSING (neither section nor feature covered)
  /** Recomputed `confirmed / total * 100`. NaN-guarded: returns 0 when total = 0. */
  coveragePct: number;
}

export interface CoverageGap {
  feature: string;
  pages: string;       // raw page citation, e.g. "pp. 70-72" or "p.117"
  severity: 'critical' | 'moderate' | 'minor';
  rawLine: string;     // for forensics / retry feedback
}

export interface ScoreBreakdown {
  inventoryCoverage: number | null;     // 0-10
  curriculumCoverage: number | null;    // 0-10
  dependencyCorrectness: number | null; // 0-10
  composite: number | null;             // 0-10
}

export interface ScoredVerdict {
  verdict: CoverageVerdict;
  reason: string;
  scores: ScoreBreakdown;
  criticalGaps: CoverageGap[];
  moderateGaps: CoverageGap[];
  minorGaps: CoverageGap[];
  /** True ↔ pipeline should roll back to extraction with directives (auto-retry). */
  shouldAutoRetry: boolean;
  /** Convergence flag: true when this gap set differs from previous in a way
   *  that suggests the extractor regressed (introduced new gaps). */
  regressed: boolean;
  /** Present when `match-table.md` was provided. Authoritative coverage source
   *  per the agent prompt's feature-level matching contract. When present, the
   *  recomputed `coveragePct` overrides any frontmatter `coverage_pct` the
   *  auditor self-reported (with a warning if they disagree by > 0.5%). */
  matchTable?: MatchTableSummary;
  /** Non-null when frontmatter coverage_pct and match-table-recomputed
   *  coveragePct disagree by > 0.5 percentage points. Human-readable; the
   *  pipeline runner can surface this to the admin or log it. */
  matchTableWarning?: string;
}

// ── Grandfather list ────────────────────────────────────────────────────────
//
// Devices in this list are NEVER subjected to coverage-gate auto-retry.
// Their checkpoint stays informative (verdict + score still computed) but the
// pipeline always advances with APPROVED_WITH_WARNINGS regardless of coverage.
//
// Why grandfather: these devices were built BEFORE the gate existed and have
// hand-curated tutorials that already meet quality bars (Fantom-08 has 60
// tutorials covering 100% of the manual per memory). Re-running the gate
// against them now would trigger unnecessary auto-retries.
//
// Only `fantom-08` qualifies. All other devices (cdj-3000, deepmind-12, +
// any future device) are subject to the full gate including auto-retry.

const GRANDFATHERED_DEVICES = new Set(['fantom-08']);

// ── Verdict thresholds — codified, not LLM-invented ─────────────────────────

const THRESHOLDS = {
  // Inventory coverage % (score on 0-10 scale where 9.0 = 90%)
  CRITICAL_INVENTORY: 6.0,            // < 60% coverage → CRITICAL (re-extract from scratch)
  REJECT_INVENTORY: 9.0,              // < 90% → REJECTED (auto-retry)
  WARN_INVENTORY: 9.5,                // < 95% → APPROVED_WITH_WARNINGS
  // Critical gap counts
  CRITICAL_GAP_COUNT_CRITICAL: 3,     // > 3 critical gaps → CRITICAL
  CRITICAL_GAP_COUNT_REJECT: 0,       // > 0 critical gaps with cited pages → REJECTED
  // Moderate gap counts
  MODERATE_GAP_COUNT_REJECT: 8,       // > 8 moderate gaps → REJECTED
  MODERATE_GAP_COUNT_WARN: 3,         // > 3 moderate gaps → APPROVED_WITH_WARNINGS
};

// ── Parsers ─────────────────────────────────────────────────────────────────

/**
 * Parse YAML frontmatter from the auditor's checkpoint.md. Returns score
 * and verdict if present, else null fields.
 */
function parseFrontmatter(markdown: string): { verdict: string | null; score: number | null } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { verdict: null, score: null };
  const fm = match[1];
  const verdictMatch = fm.match(/verdict:\s*(\S+)/i);
  const scoreMatch = fm.match(/score:\s*([\d.]+)/i);
  return {
    verdict: verdictMatch?.[1] ?? null,
    score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
  };
}

/**
 * Parse the score breakdown table from the auditor checkpoint. The auditor
 * typically writes:
 *
 *   | Inventory coverage | 9.3 / 10 |
 *   | Curriculum coverage | 8.8 / 10 |
 *   | Dependency correctness | 8.0 / 10 |
 *   | **Composite** | **8.8 / 10** |
 *
 * Returns nulls for any score we can't parse — the verdict logic handles
 * missing values gracefully (treats as worst-case).
 */
function parseScoreBreakdown(markdown: string): ScoreBreakdown {
  const grab = (label: string): number | null => {
    const re = new RegExp(`\\|\\s*\\**${label}[^|]*\\**\\s*\\|\\s*\\**\\s*([\\d.]+)`, 'i');
    const m = markdown.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  return {
    inventoryCoverage: grab('Inventory coverage'),
    curriculumCoverage: grab('Curriculum coverage'),
    dependencyCorrectness: grab('Dependency'),
    composite: grab('Composite'),
  };
}

/**
 * Parse `match-table.md` into a per-feature row list.
 *
 * Accepts the markdown table format documented in the coverage-auditor
 * agent prompt (Phase 2 §1):
 *   | feature_id | feature_name | page | match_kind | tutorial_id | step_id | evidence_quote |
 *
 * Returns an empty list if the input is empty or has no parseable rows.
 * Headers + separator rows (`| --- | --- |`) are skipped. Rows where
 * `match_kind` isn't one of the 4 documented kinds are dropped with no
 * warning (we treat unknown kinds as missing data — the agent owes us
 * a well-formed table).
 */
export function parseMatchTable(markdown: string): MatchRow[] {
  if (!markdown) return [];
  const rows: MatchRow[] = [];
  const validKinds = new Set(['CONFIRMED', 'CONFIRMED_BY_PARENT_ONLY', 'MENTIONED_NOT_TAUGHT', 'MISSING', 'RECLASSIFICATION']);
  for (const line of markdown.split('\n')) {
    // A table row starts and ends with |. Skip non-rows.
    if (!line.trim().startsWith('|') || !line.trim().endsWith('|')) continue;
    // Skip separator rows (| --- | --- |) and header rows (containing "feature_id")
    if (/^\s*\|[\s|:-]+\|\s*$/.test(line)) continue;
    if (line.includes('feature_id') && line.includes('match_kind')) continue;
    // Split on | and trim each cell. Drop empty leading/trailing cells from the wrapping pipes.
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 7) continue; // malformed row
    const [featureId, featureName, page, matchKindRaw, tutorialId, stepId, evidenceQuote] = cells;
    const matchKind = matchKindRaw.toUpperCase() as MatchKind;
    if (!validKinds.has(matchKind)) continue;
    rows.push({ featureId, featureName, page, matchKind, tutorialId, stepId, evidenceQuote });
  }
  return rows;
}

/**
 * Summarize a parsed match-table into counts + recomputed coverage_pct.
 * CONFIRMED and RECLASSIFICATION both count as "covered" — the feature
 * is taught by some tutorial step, even if categorized differently than
 * the auditor expected.
 *
 * NaN-guarded: returns coveragePct = 0 when total = 0 (instead of NaN
 * from 0/0). This lets downstream verdict logic treat an empty table
 * as CRITICAL coverage (which it is — 0/0 = no signal at all).
 */
export function summarizeMatchTable(rows: MatchRow[]): MatchTableSummary {
  const total = rows.length;
  const confirmed = rows.filter((r) => r.matchKind === 'CONFIRMED' || r.matchKind === 'RECLASSIFICATION').length;
  const parentOnlyGaps = rows.filter((r) => r.matchKind === 'CONFIRMED_BY_PARENT_ONLY').length;
  const mentionedNotTaughtGaps = rows.filter((r) => r.matchKind === 'MENTIONED_NOT_TAUGHT').length;
  const missingGaps = rows.filter((r) => r.matchKind === 'MISSING').length;
  const coveragePct = total > 0 ? (confirmed / total) * 100 : 0;
  return { total, confirmed, parentOnlyGaps, mentionedNotTaughtGaps, missingGaps, coveragePct };
}

/**
 * Parse a numbered gap section (e.g., "## Critical Gaps Blocking Approval")
 * out of the auditor markdown. Each line looks like:
 *
 *   1. **Poly Chord Wizard** (pp. 70-72) — 7 sub-features...
 */
function parseGapSection(
  markdown: string,
  sectionTitlePatterns: RegExp[],
  severity: 'critical' | 'moderate' | 'minor',
): CoverageGap[] {
  const lines = markdown.split('\n');
  let inSection = false;
  const gaps: CoverageGap[] = [];

  for (const line of lines) {
    if (sectionTitlePatterns.some((p) => p.test(line))) {
      inSection = true;
      continue;
    }
    // Section ends at the next H2 heading
    if (inSection && /^##\s/.test(line)) {
      inSection = false;
      continue;
    }
    if (!inSection) continue;

    // Match: "1. **Feature Name** (pp. 10-20) — description..."
    // Or:    "- **Feature Name** (pp. 10) — description"
    const itemMatch = line.match(/^\s*(?:\d+\.|[-*])\s*\*\*([^*]+)\*\*\s*\(([^)]+)\)/);
    if (itemMatch) {
      gaps.push({
        feature: itemMatch[1].trim(),
        pages: itemMatch[2].trim(),
        severity,
        rawLine: line.trim(),
      });
    }
  }
  return gaps;
}

/**
 * Parse all gaps (critical / moderate / minor) from auditor markdown.
 * Section title patterns require `## ` prefix so they don't accidentally
 * match item description text (e.g., "should-fix" appearing in an item
 * line would otherwise re-enter the section).
 */
function parseAllGaps(markdown: string): {
  critical: CoverageGap[];
  moderate: CoverageGap[];
  minor: CoverageGap[];
} {
  return {
    critical: parseGapSection(
      markdown,
      [/^##+\s+.*Critical Gaps?/i, /^##+\s+.*Must-Fix/i],
      'critical',
    ),
    moderate: parseGapSection(
      markdown,
      [/^##+\s+.*Moderate Gaps?/i, /^##+\s+.*Should-Fix/i],
      'moderate',
    ),
    minor: parseGapSection(
      markdown,
      [/^##+\s+.*Minor Gaps?/i, /^##+\s+.*Nice-to-Have/i],
      'minor',
    ),
  };
}

// ── Verdict logic ───────────────────────────────────────────────────────────

/**
 * Apply codified thresholds to score the curriculum.
 *
 * Order matters: check CRITICAL first (worst), then REJECTED, then
 * APPROVED_WITH_WARNINGS, then APPROVED. Each verdict's reason is human-
 * readable so the runner can surface it.
 */
export function scoreCoverage(
  auditorMarkdown: string,
  options: {
    previousCriticalGapFeatures?: string[];
    /** When provided, parsed into the authoritative `matchTable` summary on
     *  the result. Recomputed `coverage_pct` from this table OVERRIDES any
     *  frontmatter `coverage_pct` (with a warning if they disagree).
     *  Pass null/empty string to skip — old-format checkpoints still work. */
    matchTableMarkdown?: string | null;
    /** Set of feature_ids that were CONFIRMED in the previous run. Used by
     *  the strict convergence check: if any of these features is now MISSING
     *  (or absent from the current match-table), the extractor swapped
     *  features instead of adding to them — regression, halt the loop.
     *  Empty/undefined disables this check (first run). */
    previousConfirmedFeatures?: string[];
  } = {},
  /** Optional device ID. When provided AND in GRANDFATHERED_DEVICES, force
   *  shouldAutoRetry=false and downgrade verdict to APPROVED_WITH_WARNINGS
   *  regardless of coverage. Used for legacy devices (fantom-08) whose
   *  hand-curated tutorials predate the gate. */
  deviceId?: string,
): ScoredVerdict {
  const fm = parseFrontmatter(auditorMarkdown);
  const scores = parseScoreBreakdown(auditorMarkdown);
  const { critical, moderate, minor } = parseAllGaps(auditorMarkdown);

  // Parse the new match-table.md when provided. This is the authoritative
  // feature-level coverage source per the agent prompt (since the fix for
  // section-vs-feature granularity). Old-format checkpoints without a match
  // table fall back to frontmatter — backward compatible.
  const matchRows = options.matchTableMarkdown ? parseMatchTable(options.matchTableMarkdown) : [];
  const matchTable = matchRows.length > 0 ? summarizeMatchTable(matchRows) : undefined;

  // Convergence check 1: did this retry introduce NEW critical gaps vs the
  // previous run? (Existing check, kept for backward compat.)
  const previousCriticalSet = new Set(options.previousCriticalGapFeatures ?? []);
  const newCritical = critical
    .map((g) => g.feature)
    .filter((f) => previousCriticalSet.size > 0 && !previousCriticalSet.has(f));

  // Convergence check 2 (STRICT, new): did the extractor REMOVE previously
  // CONFIRMED features in this retry? Catches the "shuffle without filling"
  // failure mode — total feature count could stay the same while critical
  // items get swapped out for fluff. Requires match-table; otherwise skip.
  const previousConfirmedSet = new Set(options.previousConfirmedFeatures ?? []);
  const currentConfirmedSet = new Set(
    matchRows.filter((r) => r.matchKind === 'CONFIRMED').map((r) => r.featureId),
  );
  const lostFeatures = previousConfirmedSet.size > 0
    ? [...previousConfirmedSet].filter((f) => !currentConfirmedSet.has(f))
    : [];

  // Convergence check 3 (STRICT, new): if previous run had critical gaps
  // (which became the directives), did the current run actually FILL them?
  // A gap is "filled" when its feature_id appears as CONFIRMED in the
  // current match-table. Unfilled gaps after a retry = extractor ignored
  // the directives = regression.
  const stillMissingDirectives = matchRows.length > 0 && previousCriticalSet.size > 0
    ? [...previousCriticalSet].filter((f) => !currentConfirmedSet.has(f))
    : [];

  const regressed = newCritical.length > 0
    || lostFeatures.length > 0
    || stillMissingDirectives.length > 0;

  // Coverage source priority (NEW post-fix):
  //   1. If match-table is present → use its recomputed coverage_pct as
  //      authoritative. Convert percentage (0-100) to score scale (0-10).
  //   2. Else fall back to frontmatter `inventoryCoverage` (0-10).
  //   3. Else fall back to composite (0-10).
  //   4. Else 0 (worst case).
  let effectiveCoverage: number;
  let matchTableWarning: string | undefined;
  // Defense B (PR #181): catastrophic disagreement detection
  let matchTableConflict: { frontmatterPct: number; matchTablePct: number; deltaPp: number } | null = null;
  if (matchTable) {
    effectiveCoverage = matchTable.coveragePct / 10; // 90% → 9.0, matching the 0-10 score scale
    // Warn if the auditor's self-reported frontmatter disagrees significantly.
    const frontmatterScore = scores.inventoryCoverage ?? scores.composite;
    if (frontmatterScore != null) {
      const deltaScore = Math.abs(frontmatterScore - effectiveCoverage);
      if (deltaScore > 0.05) {
        matchTableWarning =
          `Auditor frontmatter coverage (${frontmatterScore.toFixed(1)}/10) disagrees with ` +
          `match-table recomputed coverage (${effectiveCoverage.toFixed(1)}/10 = ` +
          `${matchTable.confirmed}/${matchTable.total} CONFIRMED). ` +
          `Using match-table as authoritative.`;
      }
      // CATASTROPHIC disagreement (>50pp = >5.0 on 0-10 scale) signals one
      // of the two sources is corrupt or stale. Refuse to act — self-heal
      // on corrupt data wastes $40-100 per cycle (the CDJ-3000 incident
      // 2026-05-26: scorer said 0% while LLM said 90.8%, burned $80+).
      if (deltaScore > 5.0) {
        matchTableConflict = {
          frontmatterPct: frontmatterScore * 10,
          matchTablePct: matchTable.coveragePct,
          deltaPp: deltaScore * 10,
        };
      }
    }
  } else {
    effectiveCoverage = scores.inventoryCoverage ?? scores.composite ?? 0;
  }

  // Helper: every return site needs the same scores/gaps/matchTable plumbing.
  // Keeps verdict-specific logic readable above; common fields applied here.
  const buildResult = (partial: Pick<ScoredVerdict, 'verdict' | 'reason' | 'shouldAutoRetry' | 'regressed'>): ScoredVerdict => ({
    ...partial,
    scores,
    criticalGaps: critical,
    moderateGaps: moderate,
    minorGaps: minor,
    matchTable,
    matchTableWarning,
  });

  // Defense B (PR #181) — MATCH_TABLE_CONFLICT halt. MUST come BEFORE
  // grandfather + every other verdict path so corrupt data never sneaks
  // through to a CRITICAL/REJECTED with shouldAutoRetry=true.
  if (matchTableConflict) {
    return buildResult({
      verdict: 'MATCH_TABLE_CONFLICT',
      reason: `Auditor frontmatter coverage (${matchTableConflict.frontmatterPct.toFixed(1)}%) and match-table ` +
        `recomputed coverage (${matchTableConflict.matchTablePct.toFixed(1)}%) disagree by ` +
        `${matchTableConflict.deltaPp.toFixed(1)} percentage points — catastrophic. One source is ` +
        `corrupt or stale. Refusing to act. Likely causes: tutorial directory on unmerged branch, ` +
        `stale match-table reused from a previous run, or auditor agent crashed mid-write. ` +
        `Manual review required: inspect .pipeline/<id>/agents/coverage-auditor/ + verify tutorial ` +
        `directory exists with expected files.`,
      shouldAutoRetry: false,
      regressed: false,
    });
  }

  // GRANDFATHER short-circuit: legacy devices bypass the gate entirely.
  // Verdict downgrades to APPROVED_WITH_WARNINGS so the pipeline advances
  // without auto-retry, regardless of coverage. Score + gaps still logged
  // for admin visibility.
  if (deviceId && GRANDFATHERED_DEVICES.has(deviceId)) {
    return buildResult({
      verdict: 'APPROVED_WITH_WARNINGS',
      reason: `${deviceId} is grandfathered (legacy hand-curated tutorials predate the coverage gate). Coverage ${effectiveCoverage.toFixed(1)}/10 logged but auto-retry skipped.`,
      shouldAutoRetry: false,
      regressed: false,
    });
  }

  // REGRESSION halt (NEW) — strict convergence: if extractor lost previously
  // CONFIRMED features OR didn't fill directives, halt before retry-cap logic.
  // This MUST come before the auto-retry verdicts below so regressions never
  // sneak through with shouldAutoRetry=true.
  if (lostFeatures.length > 0) {
    return buildResult({
      verdict: 'REJECTED',
      reason: `Retry REMOVED ${lostFeatures.length} previously CONFIRMED feature${lostFeatures.length === 1 ? '' : 's'} (${lostFeatures.slice(0, 3).join(', ')}${lostFeatures.length > 3 ? '…' : ''}). Extractor is swapping features instead of adding — halting the loop for admin review.`,
      shouldAutoRetry: false,
      regressed: true,
    });
  }
  if (stillMissingDirectives.length > 0) {
    return buildResult({
      verdict: 'REJECTED',
      reason: `Retry did not fill ${stillMissingDirectives.length} directive${stillMissingDirectives.length === 1 ? '' : 's'} from previous run (${stillMissingDirectives.slice(0, 3).join(', ')}${stillMissingDirectives.length > 3 ? '…' : ''}). Extractor ignored or failed to address the gaps — halting for admin review.`,
      shouldAutoRetry: false,
      regressed: true,
    });
  }

  // CRITICAL: catastrophic coverage. Per user decision (2026-05-26): allow
  // auto-retry on inventory-coverage CRITICAL so devices like CDJ-3000 at
  // 55% can self-heal. The MAX_AUDIT_RETRIES cap in the runner still bounds
  // the loop. Regression check above prevents runaway loops.
  if (effectiveCoverage < THRESHOLDS.CRITICAL_INVENTORY) {
    return buildResult({
      verdict: 'CRITICAL',
      reason: `Inventory coverage ${effectiveCoverage.toFixed(1)}/10 below CRITICAL threshold ${THRESHOLDS.CRITICAL_INVENTORY}. Auto-retry with directives covering missing features.`,
      shouldAutoRetry: true, // CHANGED 2026-05-26: was false; allow self-heal at low coverage
      regressed: false,
    });
  }
  if (critical.length > THRESHOLDS.CRITICAL_GAP_COUNT_CRITICAL) {
    return buildResult({
      verdict: 'CRITICAL',
      reason: `${critical.length} critical gaps exceeds CRITICAL threshold (${THRESHOLDS.CRITICAL_GAP_COUNT_CRITICAL}). Extractor missed too many major workflows; re-extract.`,
      shouldAutoRetry: false,
      regressed,
    });
  }

  // REGRESSED on retry: escalate instead of looping
  if (regressed) {
    return buildResult({
      verdict: 'REJECTED',
      reason: `Retry produced ${newCritical.length} NEW critical gaps not present in the previous run (${newCritical.slice(0, 3).join(', ')}). Extractor is not converging — escalating for admin review rather than looping.`,
      shouldAutoRetry: false, // forced halt — don't keep retrying
      regressed: true,
    });
  }

  // REJECTED: any critical gap (with pages cited) → auto-retry
  if (critical.length > THRESHOLDS.CRITICAL_GAP_COUNT_REJECT) {
    return buildResult({
      verdict: 'REJECTED',
      reason: `${critical.length} critical gap${critical.length === 1 ? '' : 's'} (${critical.map((g) => g.feature).slice(0, 3).join(', ')}${critical.length > 3 ? '…' : ''}). Auto-retry: extractor will be re-run with directives covering these features.`,
      shouldAutoRetry: true,
      regressed: false,
    });
  }

  // REJECTED: inventory coverage too low even without critical gaps
  if (effectiveCoverage < THRESHOLDS.REJECT_INVENTORY) {
    return buildResult({
      verdict: 'REJECTED',
      reason: `Inventory coverage ${effectiveCoverage.toFixed(1)}/10 below REJECT threshold ${THRESHOLDS.REJECT_INVENTORY}. Auto-retry with broader extraction scope.`,
      shouldAutoRetry: true,
      regressed: false,
    });
  }

  // REJECTED: too many moderate gaps
  if (moderate.length > THRESHOLDS.MODERATE_GAP_COUNT_REJECT) {
    return buildResult({
      verdict: 'REJECTED',
      reason: `${moderate.length} moderate gaps exceeds REJECT threshold ${THRESHOLDS.MODERATE_GAP_COUNT_REJECT}. Auto-retry.`,
      shouldAutoRetry: true,
      regressed: false,
    });
  }

  // APPROVED_WITH_WARNINGS: solid but not perfect — advance + log to inventory
  if (effectiveCoverage < THRESHOLDS.WARN_INVENTORY || moderate.length > THRESHOLDS.MODERATE_GAP_COUNT_WARN) {
    return buildResult({
      verdict: 'APPROVED_WITH_WARNINGS',
      reason: `Coverage ${effectiveCoverage.toFixed(1)}/10 with ${moderate.length} moderate gaps — solid but with logged warnings. Pipeline advances; gaps appear in attention inventory.`,
      shouldAutoRetry: false,
      regressed: false,
    });
  }

  // APPROVED clean
  return buildResult({
    verdict: 'APPROVED',
    reason: `Coverage ${effectiveCoverage.toFixed(1)}/10, 0 critical gaps, ${moderate.length} moderate gaps. Auditor verdict in frontmatter: ${fm.verdict ?? 'n/a'}.`,
    shouldAutoRetry: false,
    regressed: false,
  });
}

/**
 * Build the extractor-directives.md content from a scored verdict's gaps.
 * Used by the runner when shouldAutoRetry=true.
 */
export function buildDirectivesFromVerdict(verdict: ScoredVerdict): string {
  const lines: string[] = [
    '# Extractor Directives — Auditor-Identified Gaps',
    '',
    `Verdict: ${verdict.verdict}`,
    `Reason: ${verdict.reason}`,
    '',
    'The coverage scorer determined the curriculum does not meet thresholds.',
    'On this pass, the manual-extractor MUST add tutorial coverage for every',
    'item below. Cite the manual pages in each new/expanded tutorial.',
    '',
  ];

  if (verdict.criticalGaps.length > 0) {
    lines.push('## Critical Gaps (MUST cover)', '');
    for (const g of verdict.criticalGaps) {
      lines.push(`- **${g.feature}** (${g.pages})`);
    }
    lines.push('');
  }
  if (verdict.moderateGaps.length > 0) {
    lines.push('## Moderate Gaps (should-fix on this pass)', '');
    for (const g of verdict.moderateGaps) {
      lines.push(`- **${g.feature}** (${g.pages})`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
