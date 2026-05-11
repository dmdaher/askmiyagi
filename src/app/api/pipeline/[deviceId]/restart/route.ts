import { NextRequest, NextResponse } from 'next/server';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  readState,
  writeState,
  createInitialState,
  ensurePipelineDir,
  appendLog,
} from '@/lib/pipeline/state-machine';
import { gracefulKill } from '@/lib/pipeline/process-utils';

/**
 * POST /api/pipeline/[deviceId]/restart
 *
 * Restart a pipeline from scratch with latest SOUL/codegen improvements.
 * Preserves: manifest-editor.json (contractor positions), input/manuals, input/photos
 * Wipes: state, agents, templates, cost, logs, worktree
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
  }

  // 1. Extract device metadata before wiping state
  const { deviceName, manufacturer, manualPaths, budgetCapUsd } = state;

  // 2. Kill running processes (child first, then runner — with graceful shutdown)
  if (state.childPid) {
    gracefulKill(state.childPid, 'Agent');
  }
  if (state.runnerPid) {
    gracefulKill(state.runnerPid, 'Runner');
  }

  const pipelineDir = path.join('.pipeline', deviceId);

  // 3. Backup manifest-editor.json (contractor positions are SACRED).
  // Save to .pipeline/saved/<id>/ so future runs can recover the manifest
  // even if this directory gets wiped. The editor's GET route also reads
  // from saved/ as a fallback when the root copy is missing.
  const editorManifest = path.join(pipelineDir, 'manifest-editor.json');
  const savedDir = path.join('.pipeline', 'saved', deviceId);
  if (fs.existsSync(editorManifest)) {
    fs.mkdirSync(savedDir, { recursive: true });
    fs.copyFileSync(editorManifest, path.join(savedDir, 'manifest-editor.json'));
  }

  // 4. Delete execution artifacts. CRITICAL: manifest-editor.json is NOT
  // in this list — keeping it on disk means the editor route never returns
  // 404 between restart and the first manifest re-generation. Earlier
  // versions of this code wiped manifest-editor.json and relied on the
  // editor's GET-side auto-restore from saved/, but there's a window
  // where admin visits /admin/<id>/editor before any API call fires —
  // they'd see an error page. Keep the root file intact.
  const toDelete = [
    'state.json', 'manifest.json', 'templates.json', 'inferred-layout.json',
    'cost.json', 'runner.log',
  ];
  for (const file of toDelete) {
    const filePath = path.join(pipelineDir, file);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  // Delete agents directory
  const agentsDir = path.join(pipelineDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    fs.rmSync(agentsDir, { recursive: true, force: true });
  }

  // Delete backups directory
  const backupsDir = path.join(pipelineDir, 'backups');
  if (fs.existsSync(backupsDir)) {
    fs.rmSync(backupsDir, { recursive: true, force: true });
  }

  // 5. Remove worktree
  const worktreePath = path.join('.worktrees', deviceId);
  if (fs.existsSync(worktreePath)) {
    try {
      execSync(`git worktree remove --force "${worktreePath}" 2>/dev/null`, { stdio: 'pipe' });
    } catch { /* ignore */ }
    if (fs.existsSync(worktreePath)) {
      fs.rmSync(worktreePath, { recursive: true, force: true });
    }
    try { execSync('git worktree prune', { stdio: 'pipe' }); } catch { /* ignore */ }
  }

  // 6. Create fresh initial state
  ensurePipelineDir(deviceId);
  const freshState = createInitialState({
    deviceId,
    deviceName: deviceName || deviceId,
    manufacturer: manufacturer || '',
    manualPaths: manualPaths || [],
    budgetCapUsd: budgetCapUsd || 200,
  });
  writeState(deviceId, freshState);
  appendLog(deviceId, { level: 'info', message: 'Pipeline restarted from scratch with latest improvements' });

  // 7. Spawn runner
  const proc = spawn('npx', ['tsx', 'scripts/pipeline-runner.ts', deviceId], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  freshState.status = 'running';
  freshState.runnerPid = proc.pid ?? null;
  writeState(deviceId, freshState);

  return NextResponse.json({
    status: 'running',
    pid: proc.pid,
    message: 'Pipeline restarted. Editor positions preserved.',
  });
}
