import { CheckpointData } from './types';

const VALID_STATUSES = ['PASS', 'FAIL', 'READY', 'IN_PROGRESS', 'BLOCKED'] as const;
const VALID_VERDICTS = ['APPROVED', 'REJECTED', 'READY'] as const;

/**
 * Parse a checkpoint markdown file into structured data.
 * Handles YAML frontmatter (with LLM formatting quirks) and regex fallback.
 */
export function parseCheckpoint(content: string): CheckpointData {
  const result: CheckpointData = {
    agent: null,
    deviceId: null,
    phase: null,
    status: null,
    score: null,
    verdict: null,
    sectionId: null,
    batchId: null,
    timestamp: null,
  };

  if (!content || !content.trim()) return result;

  // Step 1: Try YAML frontmatter
  const frontmatter = extractFrontmatter(content);
  if (frontmatter) {
    const parsed = parseYamlFlat(frontmatter);
    if (parsed.agent) result.agent = String(parsed.agent);
    if (parsed.deviceId) result.deviceId = String(parsed.deviceId);
    if (parsed.phase != null) result.phase = toNumber(parsed.phase);
    if (parsed.status) result.status = toStatus(String(parsed.status));
    if (parsed.score != null) result.score = toNumber(parsed.score);
    if (parsed.verdict) result.verdict = toVerdict(String(parsed.verdict));
    if (parsed.sectionId) result.sectionId = String(parsed.sectionId);
    if (parsed.batchId) result.batchId = String(parsed.batchId);
    if (parsed.timestamp) result.timestamp = String(parsed.timestamp);
  }

  // Step 2: Regex fallback for score if not found in frontmatter
  if (result.score === null) {
    result.score = extractScoreFromProse(content);
  }

  // Step 3: Regex fallback for verdict if not found
  if (result.verdict === null) {
    result.verdict = extractVerdictFromProse(content);
  }

  return result;
}

/**
 * Extract frontmatter content, handling LLM quirks:
 * - Code fences wrapping the frontmatter
 * - Missing closing ---
 */
function extractFrontmatter(content: string): string | null {
  let cleaned = content.trim();

  // Strip code fences if LLM wrapped frontmatter in them
  cleaned = cleaned.replace(/^```(?:yaml|yml)?\s*\n/m, '');
  cleaned = cleaned.replace(/\n```\s*$/m, '');
  cleaned = cleaned.replace(/```(?:yaml|yml)?\s*\n(---[\s\S]*?---)\s*\n```/m, '$1');

  // Standard frontmatter: ---\n...\n---
  const standard = cleaned.match(/^---\s*\n([\s\S]*?)\n---/);
  if (standard) return standard[1];

  // Missing closing --- : parse up to first blank line after opening ---
  const partial = cleaned.match(/^---\s*\n([\s\S]*?)(?:\n\s*\n|$)/);
  if (partial) {
    const lines = partial[1].trim().split('\n');
    const looksLikeYaml = lines.every(
      (l) => /^\s*\w[\w-]*\s*:/.test(l) || l.trim() === '' || l.trim().startsWith('#')
    );
    if (looksLikeYaml) return partial[1];
  }

  return null;
}

/**
 * Parse flat YAML key-value pairs without external dependency.
 */
function parseYamlFlat(yaml: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();

    // Strip quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    const num = Number(value);
    if (value !== '' && !isNaN(num)) {
      result[key] = num;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function toNumber(val: string | number): number | null {
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function toStatus(val: string): CheckpointData['status'] {
  const upper = val.toUpperCase().trim();
  return (VALID_STATUSES as readonly string[]).includes(upper)
    ? (upper as CheckpointData['status'])
    : null;
}

function toVerdict(val: string): CheckpointData['verdict'] {
  const upper = val.toUpperCase().trim();
  return (VALID_VERDICTS as readonly string[]).includes(upper)
    ? (upper as CheckpointData['verdict'])
    : null;
}

function extractScoreFromProse(content: string): number | null {
  const scoreSlash = content.match(/(?:quality\s+gate\s+)?score\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  if (scoreSlash) return Number(scoreSlash[1]);

  const scoreVerdict = content.match(/(\d+(?:\.\d+)?)\s*\/\s*10\s+(?:APPROVED|REJECTED)/i);
  if (scoreVerdict) return Number(scoreVerdict[1]);

  const finalScore = content.match(/final\s+score\s*:\s*(\d+(?:\.\d+)?)/i);
  if (finalScore) return Number(finalScore[1]);

  return null;
}

function extractVerdictFromProse(content: string): CheckpointData['verdict'] {
  const verdictMatch = content.match(/verdict\s*:\s*(APPROVED|REJECTED|READY)/i);
  if (verdictMatch) return verdictMatch[1].toUpperCase() as CheckpointData['verdict'];

  const scoreVerdict = content.match(/\d+(?:\.\d+)?\s*\/\s*10\s+(APPROVED|REJECTED)/i);
  if (scoreVerdict) return scoreVerdict[1].toUpperCase() as CheckpointData['verdict'];

  return null;
}
