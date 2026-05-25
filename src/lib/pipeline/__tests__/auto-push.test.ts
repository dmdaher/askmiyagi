import { describe, expect, it } from 'vitest';
import { pushPhaseOutputToBackupBranch } from '../auto-push';

function makeFakeExec(scenarios: Record<string, string | Error>) {
  const calls: string[] = [];
  const exec = (cmd: string) => {
    calls.push(cmd);
    for (const [pattern, response] of Object.entries(scenarios)) {
      if (cmd.includes(pattern)) {
        if (response instanceof Error) throw response;
        return response;
      }
    }
    return '';
  };
  return { exec, calls };
}

describe('pushPhaseOutputToBackupBranch', () => {
  const baseOpts = {
    deviceId: 'fantom-08',
    phase: 'phase-5-display-build',
    worktreeCwd: '/tmp/worktree',
    paths: ['src/components/devices/fantom-08/display/'],
  };

  it('returns no-changes when paths array is empty (defensive)', () => {
    const { exec, calls } = makeFakeExec({});
    const result = pushPhaseOutputToBackupBranch({ ...baseOpts, paths: [], exec });
    expect(result).toEqual({ kind: 'no-changes' });
    expect(calls.length).toBe(0);
  });

  it('returns no-changes when git status is empty (no files modified)', () => {
    const { exec, calls } = makeFakeExec({ 'git status': '' });
    const result = pushPhaseOutputToBackupBranch({ ...baseOpts, exec });
    expect(result).toEqual({ kind: 'no-changes' });
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain('git status');
    expect(calls[0]).toContain("src/components/devices/fantom-08/display/");
  });

  it('runs add + commit + push when status reports changes', () => {
    const { exec, calls } = makeFakeExec({
      'git status': ' M src/components/devices/fantom-08/display/atoms/Foo.tsx\n',
      'git add': '',
      'git commit': '',
      'git push': '',
    });
    const result = pushPhaseOutputToBackupBranch({ ...baseOpts, exec });
    expect(result).toEqual({
      kind: 'pushed',
      branch: 'pipeline/fantom-08',
      commitMessage: 'pipeline: phase-5-display-build output for fantom-08',
    });
    expect(calls).toHaveLength(4);
    expect(calls[1]).toContain('git add');
    expect(calls[2]).toContain('git commit -m');
    expect(calls[3]).toContain('--force-with-lease');
    expect(calls[3]).toContain('refs/heads/pipeline/fantom-08');
  });

  it('returns failed (not throws) when git push fails (e.g. lease aborted)', () => {
    const { exec } = makeFakeExec({
      'git status': ' M src/components/devices/fantom-08/display/atoms/Foo.tsx\n',
      'git add': '',
      'git commit': '',
      'git push': new Error('stale info — force-with-lease aborted'),
    });
    const result = pushPhaseOutputToBackupBranch({ ...baseOpts, exec });
    expect(result.kind).toBe('failed');
    if (result.kind === 'failed') {
      expect(result.reason).toContain('force-with-lease');
    }
  });

  it('returns failed (not throws) when network is down on push', () => {
    const { exec } = makeFakeExec({
      'git status': ' M file\n',
      'git add': '',
      'git commit': '',
      'git push': new Error('fatal: unable to access origin: Could not resolve host'),
    });
    const result = pushPhaseOutputToBackupBranch({ ...baseOpts, exec });
    expect(result.kind).toBe('failed');
  });

  it('returns failed (not throws) when commit fails (e.g. nothing to commit)', () => {
    const { exec } = makeFakeExec({
      'git status': ' M file\n',
      'git add': '',
      'git commit': new Error('nothing to commit, working tree clean'),
    });
    const result = pushPhaseOutputToBackupBranch({ ...baseOpts, exec });
    expect(result.kind).toBe('failed');
  });

  it('uses correct branch naming for different device IDs', () => {
    const { exec, calls } = makeFakeExec({
      'git status': ' M file\n',
      'git add': '',
      'git commit': '',
      'git push': '',
    });
    const result = pushPhaseOutputToBackupBranch({
      ...baseOpts,
      deviceId: 'cdj-3000-test',
      exec,
    });
    expect(result.kind).toBe('pushed');
    expect(calls[3]).toContain('refs/heads/pipeline/cdj-3000-test');
  });

  it('quotes paths to handle shell metacharacters safely', () => {
    const { exec, calls } = makeFakeExec({ 'git status': '' });
    pushPhaseOutputToBackupBranch({
      ...baseOpts,
      paths: ["src/data/tutorials/dj's-device/"],
      exec,
    });
    expect(calls[0]).toContain("'src/data/tutorials/dj'\\''s-device/'");
  });

  it('handles multiple paths in one call', () => {
    const { exec, calls } = makeFakeExec({
      'git status': ' M file\n',
      'git add': '',
      'git commit': '',
      'git push': '',
    });
    pushPhaseOutputToBackupBranch({
      ...baseOpts,
      paths: ['src/data/tutorials/x/', '.pipeline/x/agents/'],
      exec,
    });
    expect(calls[0]).toContain('src/data/tutorials/x/');
    expect(calls[0]).toContain('.pipeline/x/agents/');
  });
});
