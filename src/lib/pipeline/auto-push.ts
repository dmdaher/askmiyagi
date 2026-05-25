import { execSync } from 'child_process';

export type AutoPushResult =
  | { kind: 'no-changes' }
  | { kind: 'pushed'; branch: string; commitMessage: string }
  | { kind: 'failed'; reason: string }
  | { kind: 'disabled' };

export interface AutoPushOptions {
  deviceId: string;
  phase: string;
  worktreeCwd: string;
  paths: string[];
  exec?: (command: string, opts: { cwd: string; encoding: 'utf-8' }) => string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Best-effort backup of pipeline phase output to `origin/pipeline/<deviceId>`.
 *
 * SEMANTICS:
 *   This is a "latest pipeline run wins" backup branch — NOT a versioned
 *   archive. Each successful push force-overwrites the prior pipeline/<id>
 *   tip. If you need older content, recover via git reflog or by checking
 *   out the auto-push commit from `pipeline-runner.ts` log lines.
 *
 *   `--force-with-lease` provides marginal protection against the cross-
 *   machine concurrent-write case (another machine pushed since our last
 *   fetch). It does NOT protect against the fresh-worktree case where
 *   our local ref happens to match remote — that's accepted "latest wins"
 *   behavior for a backup branch.
 *
 *   For a hard disable: set PIPELINE_AUTO_PUSH_DISABLED=1 in the env.
 */
export function pushPhaseOutputToBackupBranch(opts: AutoPushOptions): AutoPushResult {
  const { deviceId, phase, worktreeCwd, paths } = opts;
  const env = opts.env ?? process.env;

  if (env.PIPELINE_AUTO_PUSH_DISABLED === '1') {
    return { kind: 'disabled' };
  }

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
