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

function isProcessAlive(pid: number): boolean {
  try {
    execSync(`ps -p ${pid} -o pid= 2>/dev/null`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

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

  // 2. Kill running processes
  if (state.childPid && isProcessAlive(state.childPid)) {
    try { process.kill(state.childPid, 'SIGTERM'); } catch { /* ignore */ }
  }
  if (state.runnerPid && isProcessAlive(state.runnerPid)) {
    try { process.kill(state.runnerPid, 'SIGTERM'); } catch { /* ignore */ }
  }

  const pipelineDir = path.join('.pipeline', deviceId);

  // 3. Backup manifest-editor.json (contractor positions are SACRED)
  const editorManifest = path.join(pipelineDir, 'manifest-editor.json');
  const savedDir = path.join('.pipeline', 'saved', deviceId);
  if (fs.existsSync(editorManifest)) {
    fs.mkdirSync(savedDir, { recursive: true });
    fs.copyFileSync(editorManifest, path.join(savedDir, 'manifest-editor.json'));
  }

  // 4. Delete execution artifacts (preserve input/ and manifest-editor.json backup)
  const toDelete = [
    'state.json', 'manifest.json', 'templates.json', 'inferred-layout.json',
    'cost.json', 'runner.log', 'manifest-editor.json',
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
