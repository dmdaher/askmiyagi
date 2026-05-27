import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Check if a process is still alive by PID.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    execSync(`ps -p ${pid} -o pid= 2>/dev/null`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gracefully kill a process: SIGTERM first, wait up to 5 seconds, then SIGKILL.
 * Returns a human-readable status string.
 */
export function gracefulKill(pid: number, label: string): string {
  if (!isProcessAlive(pid)) return `${label} (PID ${pid}) already dead`;

  // SIGTERM first — gives the process a chance to clean up
  try { process.kill(pid, 'SIGTERM'); } catch { /* ignore */ }

  // Wait up to 5 seconds for graceful exit
  for (let i = 0; i < 10; i++) {
    execSync('sleep 0.5');
    if (!isProcessAlive(pid)) return `${label} (PID ${pid}) exited gracefully`;
  }

  // Still alive — force kill
  try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
  return `${label} (PID ${pid}) force-killed after 5s timeout`;
}

/**
 * Result of a deletePipelineData() call.
 */
export interface DeletePipelineDataResult {
  /** True if a manifest-editor was preserved to .pipeline/saved/<id>/manifest-editor.json */
  savedManifestEditor: boolean;
  /** True if .pipeline/<id>/ was deleted */
  removedPipeline: boolean;
  /** True if .worktrees/<id>/ was removed via git worktree remove */
  removedWorktree: boolean;
  /** Notes about what happened (for logging / UI) */
  notes: string[];
}

/**
 * Delete a device's pipeline data from local filesystem, preserving the
 * contractor's last manifest-editor in `.pipeline/saved/<deviceId>/` so a
 * future pipeline restart for the same device auto-restores positions via
 * `src/app/api/pipeline/[deviceId]/manifest/route.ts:18-25`.
 *
 * NEVER touches:
 *   - `.pipeline/saved/<deviceId>/` (after the preserve step) — that's the
 *     safety net. To fully wipe, terminal `rm -rf` is the escape hatch.
 *   - `src/data/devices.ts`, `src/data/manifests/<id>.json`, `src/data/tutorials/<id>/`
 *     — those are git-tracked production data and must be modified via PR.
 */
export function deletePipelineData(deviceId: string): DeletePipelineDataResult {
  const result: DeletePipelineDataResult = {
    savedManifestEditor: false,
    removedPipeline: false,
    removedWorktree: false,
    notes: [],
  };

  const pipelineDir = path.join('.pipeline', deviceId);
  const savedDir = path.join('.pipeline', 'saved', deviceId);
  const worktreeDir = path.join('.worktrees', deviceId);

  // Step 1: preserve manifest-editor before deletion (contractor positions are
  // hard to recreate — saved/ acts as the recovery slot per CLAUDE.md).
  const liveManifestEditor = path.join(pipelineDir, 'manifest-editor.json');
  if (fs.existsSync(liveManifestEditor)) {
    try {
      fs.mkdirSync(savedDir, { recursive: true });
      fs.copyFileSync(liveManifestEditor, path.join(savedDir, 'manifest-editor.json'));
      result.savedManifestEditor = true;
      result.notes.push(`Preserved manifest-editor to ${savedDir}/`);
    } catch (err) {
      result.notes.push(`Failed to preserve manifest-editor: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Step 2: delete .pipeline/<id>/ (recursive, idempotent via { force: true })
  if (fs.existsSync(pipelineDir)) {
    try {
      fs.rmSync(pipelineDir, { recursive: true, force: true });
      result.removedPipeline = true;
      result.notes.push(`Removed ${pipelineDir}/`);
    } catch (err) {
      result.notes.push(`Failed to remove ${pipelineDir}/: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Step 3: remove git worktree if it exists. `git worktree remove --force`
  // handles uncommitted changes; fall back to rmSync if git command fails.
  if (fs.existsSync(worktreeDir)) {
    try {
      execSync(`git worktree remove --force "${worktreeDir}" 2>&1`, { encoding: 'utf-8' });
      result.removedWorktree = true;
      result.notes.push(`Removed worktree ${worktreeDir}/`);
    } catch {
      // Fallback: brute-force rm if git worktree complains (e.g., worktree
      // was already half-deleted manually).
      try {
        fs.rmSync(worktreeDir, { recursive: true, force: true });
        result.removedWorktree = true;
        result.notes.push(`Removed worktree ${worktreeDir}/ via rmSync fallback`);
      } catch (err) {
        result.notes.push(`Failed to remove worktree: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return result;
}
