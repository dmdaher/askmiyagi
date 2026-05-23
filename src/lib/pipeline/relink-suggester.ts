/**
 * Relink Suggester — confidence-scored candidates for an orphaned label.
 *
 * When an `editorLabel.controlId` points at a missing control (e.g., the
 * control was renamed during an LED split), the auto-repair nulls the
 * controlId so the label becomes standalone. This module suggests what
 * the label SHOULD now link to based on the original (now-missing) id.
 *
 * Pure function — no I/O. Caller (API route) loads the manifest and feeds
 * us the inputs. Caller decides whether to apply.
 *
 * Origin: 2026-05-10 — Half A of the inventory-actionability work.
 */

export interface RelinkCandidate {
  controlId: string;
  /** 0.0 - 1.0 — composite confidence. */
  confidence: number;
  /** Per-component breakdown so the UI can show "why". */
  reasons: {
    tokenOverlap: number;
    idSimilarity: number;
    positionProximity: number;
  };
  /** Human-readable explanation surfaced in the UI. */
  explanation: string;
}

export interface RelinkSuggestion {
  /** The orphan being relinked. */
  previousControlId: string;
  /** Top N candidates, ranked highest-confidence first. */
  candidates: RelinkCandidate[];
  /** True if at least one candidate scores above the surface threshold. */
  hasViableSuggestion: boolean;
}

// ── Configuration ──────────────────────────────────────────────────────────

/** Don't surface candidates with confidence below this — too noisy.
 *  Calibrated against DeepMind's 3 real orphans (lfo1-waveform-leds,
 *  lfo2-waveform-leds, voices-leds) — top candidates score 0.35-0.55. */
const SURFACE_THRESHOLD = 0.3;

/** Show at most this many candidates in the UI. More = decision paralysis. */
const MAX_CANDIDATES = 5;

/** Composite-score weights. */
const WEIGHTS = {
  tokenOverlap: 0.6,   // dominant signal — shared word stems (incl. fuzzy plurals)
  idSimilarity: 0.25,  // bigram similarity catches typos and minor renames
  positionProximity: 0.15, // breaks ties among similar-token candidates
};

/** Two tokens are "fuzzy-equal" if Dice similarity is at least this.
 *  Lets "voices" and "voice" count as a match. */
const FUZZY_TOKEN_THRESHOLD = 0.7;

// ── Tokenization ───────────────────────────────────────────────────────────

/** Split an id by separator chars; lowercase; drop empty tokens. */
function tokenize(id: string): string[] {
  return id
    .toLowerCase()
    .split(/[-_/\s.]+/)
    .filter(Boolean);
}

/** Tokens that appear in ~every control id and add no signal. Bumping these
 *  to lower weight prevents "led" from inflating every score. */
const NOISE_TOKENS = new Set(['led', 'leds', 'btn', 'button', 'control']);

function tokenScore(a: string, b: string): number {
  const tA = tokenize(a).filter((t) => !NOISE_TOKENS.has(t));
  const tB = tokenize(b).filter((t) => !NOISE_TOKENS.has(t));
  if (tA.length === 0 || tB.length === 0) return 0;
  // Token-level fuzzy match: each token in A scores its best Dice against
  // any token in B. Tokens above FUZZY_TOKEN_THRESHOLD count as matched.
  // This handles plurals (voices ↔ voice), inflection, and minor renames.
  let matched = 0;
  for (const ta of tA) {
    let best = 0;
    for (const tb of tB) {
      const d = diceSimilarity(ta, tb);
      if (d > best) best = d;
    }
    if (best >= FUZZY_TOKEN_THRESHOLD) matched++;
  }
  // Normalize by larger side so "lfo1" matching "lfo1-sine" doesn't count
  // as 1/1 = 1.0 — it should be 1/2 because the candidate has more tokens.
  return matched / Math.max(tA.length, tB.length);
}

// ── Dice coefficient (bigram similarity) ───────────────────────────────────

function diceSimilarity(a: string, b: string): number {
  const sa = a.toLowerCase();
  const sb = b.toLowerCase();
  if (sa === sb) return 1;
  if (sa.length < 2 || sb.length < 2) return 0;

  const bigrams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      m.set(bg, (m.get(bg) ?? 0) + 1);
    }
    return m;
  };

  const aBg = bigrams(sa);
  const bBg = bigrams(sb);
  let shared = 0;
  for (const [bg, count] of aBg) {
    const bCount = bBg.get(bg);
    if (bCount) shared += Math.min(count, bCount);
  }
  const totalA = Array.from(aBg.values()).reduce((s, n) => s + n, 0);
  const totalB = Array.from(bBg.values()).reduce((s, n) => s + n, 0);
  return totalA + totalB === 0 ? 0 : (2 * shared) / (totalA + totalB);
}

// ── Position proximity ─────────────────────────────────────────────────────

interface Position {
  x: number;
  y: number;
}

/** 1.0 = same position, drops to 0 as distance grows. Normalized so 100px
 *  ≈ 0.5 and 500px ≈ 0 (rough scale for canvases ~1200-2700px wide). */
function positionScore(a: Position | null, b: Position | null): number {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Exponential decay; 100px = 0.5, 200px = 0.25, 500px ≈ 0.05
  return Math.exp(-dist / 100);
}

/** Compute center of a control (or label) given its top-left + width/height. */
function controlCenter(c: { x?: number; y?: number; w?: number; h?: number }): Position | null {
  if (typeof c.x !== 'number' || typeof c.y !== 'number') return null;
  const w = typeof c.w === 'number' ? c.w : 0;
  const h = typeof c.h === 'number' ? c.h : 0;
  return { x: c.x + w / 2, y: c.y + h / 2 };
}

// ── Main ───────────────────────────────────────────────────────────────────

interface ControlEntry {
  id: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

interface LabelEntry {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

/**
 * Suggest relink candidates for an orphan label.
 *
 * @param previousControlId  The id the label used to point at (e.g. "lfo1-waveform-leds")
 * @param controls           All current valid controls from the manifest
 * @param labelPosition      The label's position (optional — improves ranking when available)
 * @returns ranked candidates with confidence + reasons
 */
export function suggestRelinks(
  previousControlId: string,
  controls: ControlEntry[],
  labelPosition: LabelEntry | null = null,
): RelinkSuggestion {
  const labelCenter = labelPosition ? controlCenter(labelPosition) : null;

  const scored: RelinkCandidate[] = controls.map((ctrl) => {
    const tokenOverlap = tokenScore(previousControlId, ctrl.id);
    const idSimilarity = diceSimilarity(previousControlId, ctrl.id);
    const ctrlCenter = controlCenter(ctrl);
    const positionProximity = positionScore(labelCenter, ctrlCenter);

    const confidence =
      WEIGHTS.tokenOverlap * tokenOverlap +
      WEIGHTS.idSimilarity * idSimilarity +
      WEIGHTS.positionProximity * positionProximity;

    const explanation = buildExplanation(previousControlId, ctrl.id, { tokenOverlap, idSimilarity, positionProximity });

    return {
      controlId: ctrl.id,
      confidence,
      reasons: { tokenOverlap, idSimilarity, positionProximity },
      explanation,
    };
  });

  // Filter above threshold, sort descending, take top N
  const viable = scored
    .filter((c) => c.confidence >= SURFACE_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_CANDIDATES);

  return {
    previousControlId,
    candidates: viable,
    hasViableSuggestion: viable.length > 0,
  };
}

function buildExplanation(
  prev: string,
  candidate: string,
  reasons: { tokenOverlap: number; idSimilarity: number; positionProximity: number },
): string {
  const prevTokens = tokenize(prev).filter((t) => !NOISE_TOKENS.has(t));
  const candTokens = tokenize(candidate).filter((t) => !NOISE_TOKENS.has(t));
  const shared = prevTokens.filter((t) => candTokens.includes(t));

  const parts: string[] = [];
  if (shared.length > 0) {
    parts.push(`shares ${shared.length === 1 ? 'token' : 'tokens'} "${shared.join('", "')}"`);
  } else if (reasons.idSimilarity > 0.4) {
    parts.push(`similar id`);
  }
  if (reasons.positionProximity > 0.3) {
    parts.push(`near the label`);
  }
  return parts.length > 0 ? parts.join(', ') : 'low similarity';
}
