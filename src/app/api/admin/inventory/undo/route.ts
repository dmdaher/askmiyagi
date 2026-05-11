/**
 * POST /api/admin/inventory/undo
 *
 * Restore the manifest from the LAST pre-relink backup for a device.
 * Safety guards (per premortem):
 *
 * 1. Pipeline-running guard: refuse if pipeline is running.
 * 2. Phase-advance guard: refuse if pipeline moved past phase-0-post-editor-check
 *    (stable boundary — restoring past it would destabilize downstream work).
 * 3. Stale-backup guard: if manifest has been modified since the backup was
 *    written (e.g., contractor saved via hosted route), require an explicit
 *    `confirmOverwrite: true` in the request body.
 * 4. Atomic restore: copy backup to a tmp file then rename over manifest.
 * 5. Audit log entry recording the undo.
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function pipelineDir(deviceId: string): string {
  return path.join('.pipeline', deviceId);
}

function manifestPath(deviceId: string): string {
  return path.join(pipelineDir(deviceId), 'manifest-editor.json');
}

function backupsDir(deviceId: string): string {
  return path.join(pipelineDir(deviceId), 'backups');
}

function statePath(deviceId: string): string {
  return path.join(pipelineDir(deviceId), 'state.json');
}

function repairLogPath(deviceId: string): string {
  return path.join(pipelineDir(deviceId), 'repair-log.jsonl');
}

/** List pre-relink backups, newest first. */
function listRelinkBackups(deviceId: string): string[] {
  const dir = backupsDir(deviceId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith('manifest-editor-pre-relink-'))
    .map((name) => path.join(dir, name))
    .sort()
    .reverse();
}

const STABLE_PHASES_AFTER_RELINK = new Set([
  'phase-0-post-editor-check',
  'phase-4-extraction',
  'phase-4-audit',
  'phase-5-display-build',
  'phase-5-tutorial-build',
  'tutorial-pr',
  'completed',
]);

interface UndoBody {
  deviceId?: string;
  confirmOverwrite?: boolean;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as UndoBody;
  const { deviceId, confirmOverwrite } = body;
  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId required' }, { status: 400 });
  }

  // ── Guard 1: pipeline-running ─────────────────────────────────────────
  let state: { status?: string; currentPhase?: string } | null = null;
  if (fs.existsSync(statePath(deviceId))) {
    try { state = JSON.parse(fs.readFileSync(statePath(deviceId), 'utf-8')); } catch { /* */ }
  }
  if (state?.status === 'running') {
    return NextResponse.json(
      { error: 'Pipeline is running — pause before undoing.' },
      { status: 409 },
    );
  }

  // ── Guard 2: phase-advance ────────────────────────────────────────────
  if (state?.currentPhase && STABLE_PHASES_AFTER_RELINK.has(state.currentPhase)) {
    return NextResponse.json(
      {
        error: `Pipeline has advanced to "${state.currentPhase}" since the relink. Undoing now would destabilize downstream work. Reset the pipeline first if you really need to undo.`,
      },
      { status: 409 },
    );
  }

  // ── Find the newest pre-relink backup ─────────────────────────────────
  const backups = listRelinkBackups(deviceId);
  if (backups.length === 0) {
    return NextResponse.json({ error: 'No pre-relink backup found to undo.' }, { status: 404 });
  }
  const newest = backups[0];

  // ── Guard 3: stale-backup ─────────────────────────────────────────────
  if (fs.existsSync(manifestPath(deviceId))) {
    const manifestStat = fs.statSync(manifestPath(deviceId));
    const backupStat = fs.statSync(newest);
    // mtime of manifest > backup means manifest was modified AFTER backup
    if (manifestStat.mtimeMs > backupStat.mtimeMs + 1000 /* 1s tolerance */) {
      if (!confirmOverwrite) {
        return NextResponse.json(
          {
            error: 'manifest-editor.json was modified after the most recent pre-relink backup. Restoring would discard those changes. Re-send with { confirmOverwrite: true } to proceed.',
            backupTime: backupStat.mtime.toISOString(),
            manifestTime: manifestStat.mtime.toISOString(),
          },
          { status: 409 },
        );
      }
    }
  }

  // ── Apply the restore (atomic) ────────────────────────────────────────
  try {
    const tmp = `${manifestPath(deviceId)}.tmp`;
    fs.copyFileSync(newest, tmp);
    fs.renameSync(tmp, manifestPath(deviceId));
  } catch (err) {
    return NextResponse.json(
      { error: `Restore failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // ── Audit log ──────────────────────────────────────────────────────────
  try {
    fs.appendFileSync(repairLogPath(deviceId), JSON.stringify({
      timestamp: new Date().toISOString(),
      changes: [{
        kind: 'admin-relink-undo',
        severity: 'high',
        backupRestored: path.basename(newest),
      }],
      unrepairableFindings: [],
      bailed: false,
      note: 'admin undid a relink via inventory',
    }) + '\n');
  } catch { /* best-effort */ }

  return NextResponse.json({ ok: true, backupRestored: path.basename(newest) });
}
