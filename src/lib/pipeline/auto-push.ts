import { execSync } from 'child_process';

export type AutoPushResult =
  | { kind: 'no-changes' }
  | { kind: 'pushed'; branch: string; commitMessage: string }
  | { kind: 'failed'; reason: string };

export interface AutoPushOptions {
  deviceId: string;
  phase: string;
  worktreeCwd: string;
  paths: string[];
  exec?: (command: string, opts: { cwd: string; encoding: 'utf-8' }) => string;
}

export function pushPhaseOutputToBackupBranch(opts: AutoPushOptions): AutoPushResult {
  const { deviceId, phase, worktreeCwd, paths } = opts;
  const run = opts.exec ?? ((cmd, o) => execSync(cmd, { ...o, stdio: ['pipe', 'pipe', 'pipe'] }).toString());
  const branch = `pipeline/${deviceId}`;
  const commitMessage = `pipeline: ${phase} output for ${deviceId}`;

  try {
    if (paths.length === 0) return { kind: 'no-changes' };

    const quotedPaths = paths.map((p) => `'${p.replace(/'/g, "'\\''")}'`).join(' ');
    const status = run(`git status --porcelain -- ${quotedPaths}`, {
      cwd: worktreeCwd,
      encoding: 'utf-8',
    });
    if (!status.trim()) return { kind: 'no-changes' };

    run(`git add -- ${quotedPaths}`, { cwd: worktreeCwd, encoding: 'utf-8' });
    run(`git commit -m ${JSON.stringify(commitMessage)}`, { cwd: worktreeCwd, encoding: 'utf-8' });
    run(`git push --force-with-lease origin HEAD:refs/heads/${branch}`, {
      cwd: worktreeCwd,
      encoding: 'utf-8',
    });

    return { kind: 'pushed', branch, commitMessage };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { kind: 'failed', reason };
  }
}
