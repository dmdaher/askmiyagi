/**
 * orphan-intentions — persists admin's "Mark intentional" decisions for
 * Layer 1b orphan controls. Used by canvas-qa to suppress already-
 * triaged orphans from active findings on subsequent runs.
 *
 * File: .pipeline/<deviceId>/agents/tutorial-review/orphan-intentions.json
 *
 * Shape:
 * {
 *   "SOURCE_INDICATOR": { "category": "B", "pairedWith": "SOURCE", "markedAt": "..." },
 *   "HOT_CUE_F":        { "category": "D", "reason": "redundant slot 6/8", "markedAt": "..." }
 * }
 */
import fs from 'fs';
import path from 'path';

export type OrphanCategory = 'A' | 'B' | 'C' | 'D';

export interface OrphanIntention {
  category: OrphanCategory;
  pairedWith?: string | null;
  reason?: string;
  markedAt: string;
  markedBy?: string;
}

export type OrphanIntentionMap = Record<string, OrphanIntention>;

function pathFor(deviceId: string, repoRoot: string): string {
  return path.join(
    repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'orphan-intentions.json',
  );
}

export function readOrphanIntentions(deviceId: string, repoRoot = process.cwd()): OrphanIntentionMap {
  const p = pathFor(deviceId, repoRoot);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as OrphanIntentionMap;
  } catch {
    return {};
  }
}

export function writeOrphanIntentions(
  deviceId: string,
  intentions: OrphanIntentionMap,
  repoRoot = process.cwd(),
): void {
  const p = pathFor(deviceId, repoRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(intentions, null, 2));
}

export function markIntentional(
  deviceId: string,
  controlId: string,
  intent: Omit<OrphanIntention, 'markedAt'>,
  repoRoot = process.cwd(),
): void {
  const current = readOrphanIntentions(deviceId, repoRoot);
  current[controlId] = { ...intent, markedAt: new Date().toISOString() };
  writeOrphanIntentions(deviceId, current, repoRoot);
}

export function unmarkIntentional(
  deviceId: string,
  controlId: string,
  repoRoot = process.cwd(),
): void {
  const current = readOrphanIntentions(deviceId, repoRoot);
  delete current[controlId];
  writeOrphanIntentions(deviceId, current, repoRoot);
}

export function isMarkedIntentional(
  deviceId: string,
  controlId: string,
  repoRoot = process.cwd(),
): OrphanIntention | null {
  const current = readOrphanIntentions(deviceId, repoRoot);
  return current[controlId] ?? null;
}
