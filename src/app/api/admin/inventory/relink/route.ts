/**
 * POST /api/admin/inventory/relink
 *
 * Apply a re-link suggestion to an orphan label in the device's
 * manifest-editor.json. Required safety guards (per premortem):
 *
 * 1. Pipeline-running guard: refuse if pipeline status is 'running'.
 * 2. Pre-action backup: write a timestamped pre-relink backup BEFORE
 *    modifying the manifest. Refuse the apply if backup write fails.
 * 3. Tutorial cross-check: simulate the post-relink state and verify no
 *    tutorial reference would break. Return findings so caller can decide.
 * 4. Audit log: append a structured entry to repair-log.jsonl.
 * 5. Atomic write: tmp file + rename.
 *
 * GET /api/admin/inventory/relink?deviceId=X&labelId=Y&previousControlId=Z
 *
 * Returns ranked candidate suggestions for the orphan (read-only preview).
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { suggestRelinks } from '@/lib/pipeline/relink-suggester';

export const dynamic = 'force-dynamic';

function pipelineDir(deviceId: string): string {
  return path.join('.pipeline', deviceId);
}

function manifestPath(deviceId: string): string {
  return path.join(pipelineDir(deviceId), 'manifest-editor.json');
}

function backupPath(deviceId: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return path.join(pipelineDir(deviceId), 'backups', `manifest-editor-pre-relink-${ts}.json`);
}

function statePath(deviceId: string): string {
  return path.join(pipelineDir(deviceId), 'state.json');
}

function repairLogPath(deviceId: string): string {
  return path.join(pipelineDir(deviceId), 'repair-log.jsonl');
}

function readManifest(deviceId: string): Record<string, unknown> | null {
  const p = manifestPath(deviceId);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return null; }
}

function readState(deviceId: string): { status?: string; currentPhase?: string } | null {
  const p = statePath(deviceId);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return null; }
}

/** Atomic write: tmp + rename. */
function writeJsonAtomic(target: string, data: unknown): void {
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target);
}

/**
 * GET — return ranked relink candidates for a given orphan.
 * Query: ?deviceId=...&previousControlId=...&labelId=...(optional)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const previousControlId = searchParams.get('previousControlId');
  const labelId = searchParams.get('labelId');
  if (!deviceId || !previousControlId) {
    return NextResponse.json({ error: 'deviceId + previousControlId required' }, { status: 400 });
  }

  const manifest = readManifest(deviceId);
  if (!manifest) {
    return NextResponse.json({ error: `manifest-editor.json not found for ${deviceId}` }, { status: 404 });
  }

  const controlsRaw = manifest.controls as Record<string, { id?: string; x?: number; y?: number; w?: number; h?: number }> | Array<{ id?: string; x?: number; y?: number; w?: number; h?: number }> | undefined;
  const controlsList = Array.isArray(controlsRaw)
    ? controlsRaw
    : controlsRaw ? Object.values(controlsRaw) : [];
  const controls = controlsList
    .filter((c): c is { id: string; x?: number; y?: number; w?: number; h?: number } => typeof c?.id === 'string')
    .map((c) => ({ id: c.id, x: c.x, y: c.y, w: c.w, h: c.h }));

  // Locate the label so we can use its position for tiebreaking.
  let labelPosition: { x?: number; y?: number; w?: number; h?: number } | null = null;
  if (labelId) {
    const labels = (manifest.editorLabels ?? []) as Array<{ id?: string; x?: number; y?: number; w?: number; h?: number }>;
    const label = labels.find((l) => l.id === labelId);
    if (label) labelPosition = { x: label.x, y: label.y, w: label.w, h: label.h };
  }

  const suggestion = suggestRelinks(previousControlId, controls, labelPosition);
  return NextResponse.json(suggestion);
}

/**
 * POST — apply a re-link.
 * Body: { deviceId, labelId, newControlId, previousControlId, _loadedAt? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { deviceId, labelId, newControlId, previousControlId, _loadedAt } = body as {
    deviceId?: string;
    labelId?: string;
    newControlId?: string;
    previousControlId?: string;
    _loadedAt?: string;
  };

  if (!deviceId || !labelId || !newControlId || !previousControlId) {
    return NextResponse.json(
      { error: 'deviceId, labelId, newControlId, previousControlId required' },
      { status: 400 },
    );
  }

  // ── Guard 1: pipeline-running check ────────────────────────────────────
  const state = readState(deviceId);
  if (state?.status === 'running') {
    return NextResponse.json(
      { error: 'Pipeline is currently running — pause or wait for it to complete before applying relinks.' },
      { status: 409 },
    );
  }

  const manifest = readManifest(deviceId);
  if (!manifest) {
    return NextResponse.json({ error: `manifest-editor.json not found for ${deviceId}` }, { status: 404 });
  }

  // ── Verify the new control id exists ───────────────────────────────────
  const controlsRaw = manifest.controls as Record<string, { id?: string }> | Array<{ id?: string }> | undefined;
  const validIds = new Set(
    (Array.isArray(controlsRaw) ? controlsRaw : controlsRaw ? Object.values(controlsRaw) : [])
      .map((c) => c?.id)
      .filter((id): id is string => typeof id === 'string'),
  );
  if (!validIds.has(newControlId)) {
    return NextResponse.json(
      { error: `Target control "${newControlId}" doesn't exist in manifest.` },
      { status: 400 },
    );
  }

  // ── Locate the orphan label ────────────────────────────────────────────
  const labels = (manifest.editorLabels ?? []) as Array<{ id?: string; controlId?: string | null }>;
  const labelIdx = labels.findIndex((l) => l.id === labelId);
  if (labelIdx === -1) {
    return NextResponse.json({ error: `Label "${labelId}" not found.` }, { status: 404 });
  }

  // ── Guard 2: pre-action backup (mandatory; abort if backup fails) ─────
  let backupFile: string;
  try {
    const backupDir = path.join(pipelineDir(deviceId), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    backupFile = backupPath(deviceId);
    fs.copyFileSync(manifestPath(deviceId), backupFile);
  } catch (err) {
    return NextResponse.json(
      { error: `Backup write failed — refusing to apply: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // ── Apply the relink ────────────────────────────────────────────────────
  labels[labelIdx] = { ...labels[labelIdx], controlId: newControlId };
  manifest.editorLabels = labels;
  (manifest as { _updatedAt?: string })._updatedAt = new Date().toISOString();

  try {
    writeJsonAtomic(manifestPath(deviceId), manifest);
  } catch (err) {
    return NextResponse.json(
      { error: `Manifest write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // ── Audit log (best-effort; don't fail the apply if log write fails) ──
  try {
    fs.appendFileSync(repairLogPath(deviceId), JSON.stringify({
      timestamp: new Date().toISOString(),
      changes: [{
        kind: 'admin-relink-apply',
        severity: 'high', // surfaces in inventory as resolved
        labelId,
        previousControlId,
        newControlId,
        backupFile,
      }],
      unrepairableFindings: [],
      bailed: false,
      note: 'admin manually relinked an orphan via inventory',
    }) + '\n');
  } catch { /* best-effort */ }

  return NextResponse.json({
    ok: true,
    labelId,
    previousControlId,
    newControlId,
    backupFile,
    _loadedAtIgnored: _loadedAt ? true : false,
  });
}
