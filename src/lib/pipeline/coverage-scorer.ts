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

export type CoverageVerdict = 'CRITICAL' | 'REJECTED' | 'APPROVED_WITH_WARNINGS' | 'APPROVED';

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
}

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
  options: { previousCriticalGapFeatures?: string[] } = {},
): ScoredVerdict {
  const fm = parseFrontmatter(auditorMarkdown);
  const scores = parseScoreBreakdown(auditorMarkdown);
  const { critical, moderate, minor } = parseAllGaps(auditorMarkdown);

  // Convergence: did this retry introduce NEW critical gaps vs the previous run?
  const previousCriticalSet = new Set(options.previousCriticalGapFeatures ?? []);
  const newCritical = critical
    .map((g) => g.feature)
    .filter((f) => previousCriticalSet.size > 0 && !previousCriticalSet.has(f));
  const regressed = newCritical.length > 0;

  // Inventory coverage takes priority (it's a count, not a judgment call).
  // If the auditor didn't report inventory coverage, fall back to composite.
  const effectiveCoverage = scores.inventoryCoverage ?? scores.composite ?? 0;

  // CRITICAL: catastrophic — fundamentally incomplete extraction
  if (effectiveCoverage < THRESHOLDS.CRITICAL_INVENTORY) {
    return {
      verdict: 'CRITICAL',
      reason: `Inventory coverage ${effectiveCoverage.toFixed(1)}/10 below CRITICAL threshold ${THRESHOLDS.CRITICAL_INVENTORY}. Extraction is fundamentally incomplete; re-extract from scratch with broader scope.`,
      scores,
      criticalGaps: critical,
      moderateGaps: moderate,
      minorGaps: minor,
      shouldAutoRetry: false, // CRITICAL escalates to admin, doesn't auto-retry
      regressed,
    };
  }
  if (critical.length > THRESHOLDS.CRITICAL_GAP_COUNT_CRITICAL) {
    return {
      verdict: 'CRITICAL',
      reason: `${critical.length} critical gaps exceeds CRITICAL threshold (${THRESHOLDS.CRITICAL_GAP_COUNT_CRITICAL}). Extractor missed too many major workflows; re-extract.`,
      scores,
      criticalGaps: critical,
      moderateGaps: moderate,
      minorGaps: minor,
      shouldAutoRetry: false,
      regressed,
    };
  }

  // REGRESSED on retry: escalate instead of looping
  if (regressed) {
    return {
      verdict: 'REJECTED',
      reason: `Retry produced ${newCritical.length} NEW critical gaps not present in the previous run (${newCritical.slice(0, 3).join(', ')}). Extractor is not converging — escalating for admin review rather than looping.`,
      scores,
      criticalGaps: critical,
      moderateGaps: moderate,
      minorGaps: minor,
      shouldAutoRetry: false, // forced halt — don't keep retrying
      regressed: true,
    };
  }

  // REJECTED: any critical gap (with pages cited) → auto-retry
  if (critical.length > THRESHOLDS.CRITICAL_GAP_COUNT_REJECT) {
    return {
      verdict: 'REJECTED',
      reason: `${critical.length} critical gap${critical.length === 1 ? '' : 's'} (${critical.map((g) => g.feature).slice(0, 3).join(', ')}${critical.length > 3 ? '…' : ''}). Auto-retry: extractor will be re-run with directives covering these features.`,
      scores,
      criticalGaps: critical,
      moderateGaps: moderate,
      minorGaps: minor,
      shouldAutoRetry: true,
      regressed: false,
    };
  }

  // REJECTED: inventory coverage too low even without critical gaps
  if (effectiveCoverage < THRESHOLDS.REJECT_INVENTORY) {
    return {
      verdict: 'REJECTED',
      reason: `Inventory coverage ${effectiveCoverage.toFixed(1)}/10 below REJECT threshold ${THRESHOLDS.REJECT_INVENTORY}. Auto-retry with broader extraction scope.`,
      scores,
      criticalGaps: critical,
      moderateGaps: moderate,
      minorGaps: minor,
      shouldAutoRetry: true,
      regressed: false,
    };
  }

  // REJECTED: too many moderate gaps
  if (moderate.length > THRESHOLDS.MODERATE_GAP_COUNT_REJECT) {
    return {
      verdict: 'REJECTED',
      reason: `${moderate.length} moderate gaps exceeds REJECT threshold ${THRESHOLDS.MODERATE_GAP_COUNT_REJECT}. Auto-retry.`,
      scores,
      criticalGaps: critical,
      moderateGaps: moderate,
      minorGaps: minor,
      shouldAutoRetry: true,
      regressed: false,
    };
  }

  // APPROVED_WITH_WARNINGS: solid but not perfect — advance + log to inventory
  if (effectiveCoverage < THRESHOLDS.WARN_INVENTORY || moderate.length > THRESHOLDS.MODERATE_GAP_COUNT_WARN) {
    return {
      verdict: 'APPROVED_WITH_WARNINGS',
      reason: `Coverage ${effectiveCoverage.toFixed(1)}/10 with ${moderate.length} moderate gaps — solid but with logged warnings. Pipeline advances; gaps appear in attention inventory.`,
      scores,
      criticalGaps: critical,
      moderateGaps: moderate,
      minorGaps: minor,
      shouldAutoRetry: false,
      regressed: false,
    };
  }

  // APPROVED clean
  return {
    verdict: 'APPROVED',
    reason: `Coverage ${effectiveCoverage.toFixed(1)}/10, 0 critical gaps, ${moderate.length} moderate gaps. Auditor verdict in frontmatter: ${fm.verdict ?? 'n/a'}.`,
    scores,
    criticalGaps: critical,
    moderateGaps: moderate,
    minorGaps: minor,
    shouldAutoRetry: false,
    regressed: false,
  };
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
