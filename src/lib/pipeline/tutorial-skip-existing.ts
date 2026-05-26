import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Partition a tutorial-build batch by which tutorials already have `.ts` files
 * on disk. Used by the runner to skip already-generated tutorials on re-run
 * (only generate the missing ones).
 *
 * Also captures + later compares SHAs of existing files so we can detect (and
 * restore from git) any case where the tutorial-builder agent ignored the
 * SKIP-EXISTING DIRECTIVE in its prompt.
 *
 * Defensive on a missing tutorial dir — returns all-missing rather than throwing.
 */

export interface PartitionResult {
  /** Tutorial ids whose <id>.ts file is on disk under the worktree. */
  existing: string[];
  /** Tutorial ids that need to be generated. */
  missing: string[];
}

function tutorialFilePath(worktreeCwd: string, deviceId: string, id: string): string {
  return path.join(worktreeCwd, 'src/data/tutorials', deviceId, `${id}.ts`);
}

export function partitionTutorialBatch(
  batchTutorialIds: string[],
  deviceId: string,
  worktreeCwd: string,
): PartitionResult {
  const existing: string[] = [];
  const missing: string[] = [];
  for (const id of batchTutorialIds) {
    if (fs.existsSync(tutorialFilePath(worktreeCwd, deviceId, id))) {
      existing.push(id);
    } else {
      missing.push(id);
    }
  }
  return { existing, missing };
}

export function captureFileShas(
  ids: string[],
  deviceId: string,
  worktreeCwd: string,
): Map<string, string> {
  const shas = new Map<string, string>();
  for (const id of ids) {
    const filePath = tutorialFilePath(worktreeCwd, deviceId, id);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      shas.set(id, crypto.createHash('sha256').update(content).digest('hex'));
    }
  }
  return shas;
}

/**
 * Returns ids whose file was modified (or deleted) since the SHA snapshot.
 * Used after the tutorial-builder agent runs to detect SKIP-DIRECTIVE
 * violations — any returned id indicates the agent touched a file it
 * shouldn't have, and the runner restores it from git HEAD.
 */
export function detectModifiedFiles(
  beforeShas: Map<string, string>,
  deviceId: string,
  worktreeCwd: string,
): string[] {
  const modified: string[] = [];
  for (const [id, beforeSha] of beforeShas) {
    const filePath = tutorialFilePath(worktreeCwd, deviceId, id);
    if (!fs.existsSync(filePath)) {
      modified.push(id); // deletion counts as a violation
      continue;
    }
    const content = fs.readFileSync(filePath);
    const afterSha = crypto.createHash('sha256').update(content).digest('hex');
    if (afterSha !== beforeSha) modified.push(id);
  }
  return modified;
}
