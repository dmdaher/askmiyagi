/**
 * Shared batch parser — extracted so the regenerate-tutorials API route can
 * re-populate state.tutorialBatches from disk WITHOUT spawning the runner
 * subprocess. Same regex + format the runner uses at
 * scripts/pipeline-runner.ts:parseBatchesFromExtractor.
 *
 * Single source of truth for the markdown table format produced by the
 * manual-extractor agent at .pipeline/<id>/agents/manual-extractor/sieve/
 * pass-4-batches.md.
 */
import fs from 'fs';
import path from 'path';

export interface ParsedBatch {
  batchId: string;
  tutorials: string[];
}

const BATCH_ROW_PATTERN = /^\|\s*([A-Z0-9][A-Z0-9-]*)\s*\|\s*(T\d+(?:\s*,\s*T\d+)*)\s*\|/gim;

/**
 * Parse the manual-extractor's pass-4-batches.md file for a device.
 * Returns [] if the file is missing or unparseable — callers decide whether
 * that's an error.
 */
export function parseBatchesForDevice(deviceId: string, baseDir?: string): ParsedBatch[] {
  const root = baseDir ?? process.cwd();
  const filePath = path.join(
    root,
    '.pipeline',
    deviceId,
    'agents',
    'manual-extractor',
    'sieve',
    'pass-4-batches.md',
  );
  if (!fs.existsSync(filePath)) return [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseBatchesFromMarkdown(content);
  } catch {
    return [];
  }
}

/** Pure parser — useful for tests + reuse from any caller with content in hand. */
export function parseBatchesFromMarkdown(content: string): ParsedBatch[] {
  const seen = new Set<string>();
  const batches: ParsedBatch[] = [];
  // Reset lastIndex since the regex is /g
  BATCH_ROW_PATTERN.lastIndex = 0;
  let match;
  while ((match = BATCH_ROW_PATTERN.exec(content)) !== null) {
    const batchId = `batch-${match[1].toLowerCase()}`;
    if (seen.has(batchId)) continue;
    const tutorials = match[2].split(',').map((t) => t.trim()).filter(Boolean);
    if (tutorials.length === 0) continue;
    seen.add(batchId);
    batches.push({ batchId, tutorials });
  }
  return batches;
}
