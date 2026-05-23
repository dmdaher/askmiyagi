/**
 * PR-J: DELETE /api/pipeline/[deviceId]/manifest-control/[controlId]
 *
 * Removes a control from `manifest-editor.json`. Triggered by the
 * OrphanList 🗑 Delete button (previously alerted "planned for PR-I").
 *
 * Flow:
 *   1. Backup manifest-editor.json with `delete-orphan` source tag.
 *   2. Delete the control from controls{} and from any section's
 *      childIds[] that referenced it.
 *   3. Write manifest-editor.json back.
 *   4. Auto-export via `exportManifest()` so production manifest
 *      drops the control too.
 *   5. Schedule canvas-data refresh so the orphan disappears from QA.
 *
 * Returns 404 if the control doesn't exist (already deleted).
 * Returns 400 if the control is still referenced by a non-orphan
 * tutorial — caller should confirm + force, or fix the tutorials
 * first via PR-I 🛠 Fix.
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string; controlId: string }> },
) {
  const { deviceId, controlId } = await params;
  const pipelineDir = path.join('.pipeline', deviceId);
  const editorPath = path.join(pipelineDir, 'manifest-editor.json');
  const backupDir = path.join(pipelineDir, 'backups');

  if (!fs.existsSync(editorPath)) {
    return NextResponse.json({ error: 'manifest-editor.json not found' }, { status: 404 });
  }

  let manifest: { controls?: Record<string, unknown> | unknown[]; sections?: Record<string, unknown> | unknown[]; [k: string]: unknown };
  try {
    manifest = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
  } catch (err) {
    return NextResponse.json(
      { error: `failed to parse manifest-editor.json: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  // Editor stores controls/sections as Record<id, Def>. Some legacy
  // writes have left them as arrays — handle both.
  const controlsIsRecord = manifest.controls && !Array.isArray(manifest.controls);
  const sectionsIsRecord = manifest.sections && !Array.isArray(manifest.sections);

  // Step 1: confirm the control exists.
  const exists = controlsIsRecord
    ? Boolean((manifest.controls as Record<string, unknown>)[controlId])
    : Array.isArray(manifest.controls) && (manifest.controls as Array<{ id?: string }>).some((c) => c.id === controlId);

  if (!exists) {
    return NextResponse.json({ error: `control ${controlId} not found` }, { status: 404 });
  }

  // Step 2: check the force flag — by default, refuse to delete if
  // the control is referenced anywhere (defense in depth, even though
  // the OrphanList only surfaces orphans).
  const force = request.nextUrl.searchParams.get('force') === 'true';
  if (!force) {
    const tutorialsJson = path.join(pipelineDir, 'agents', 'tutorial-review', 'tutorials.json');
    if (fs.existsSync(tutorialsJson)) {
      try {
        const tuts = JSON.parse(fs.readFileSync(tutorialsJson, 'utf-8')) as Array<{
          steps?: Array<{ highlightControls?: string[] }>;
        }>;
        for (const t of tuts) {
          for (const s of t.steps ?? []) {
            if (s.highlightControls?.includes(controlId)) {
              return NextResponse.json({
                error: `control ${controlId} is highlighted in at least one tutorial step. Fix tutorials first or pass ?force=true.`,
              }, { status: 400 });
            }
          }
        }
      } catch { /* best-effort guard — proceed if tutorials.json is unreadable */ }
    }
  }

  // Step 3: backup before mutating.
  try {
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const isoStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(backupDir, `manifest-editor-delete-orphan-${isoStamp}.json`);
    fs.copyFileSync(editorPath, backupPath);
  } catch (backupErr) {
    return NextResponse.json(
      { error: `backup failed, aborting: ${backupErr instanceof Error ? backupErr.message : String(backupErr)}` },
      { status: 500 },
    );
  }

  // Step 4: remove from controls.
  if (controlsIsRecord) {
    delete (manifest.controls as Record<string, unknown>)[controlId];
  } else if (Array.isArray(manifest.controls)) {
    manifest.controls = (manifest.controls as Array<{ id?: string }>).filter((c) => c.id !== controlId);
  }

  // Step 5: scrub any section.childIds[] references.
  if (sectionsIsRecord) {
    for (const sec of Object.values(manifest.sections as Record<string, unknown>)) {
      const s = sec as { childIds?: string[] };
      if (Array.isArray(s.childIds)) {
        s.childIds = s.childIds.filter((id) => id !== controlId);
      }
    }
  } else if (Array.isArray(manifest.sections)) {
    for (const sec of manifest.sections as Array<{ childIds?: string[] }>) {
      if (Array.isArray(sec.childIds)) {
        sec.childIds = sec.childIds.filter((id) => id !== controlId);
      }
    }
  }

  // Step 6: also scrub any editorLabels[].controlId that pointed to it
  // (orphan labels become unlinked but stay in the manifest).
  if (Array.isArray(manifest.editorLabels)) {
    for (const lbl of manifest.editorLabels as Array<{ controlId?: string }>) {
      if (lbl.controlId === controlId) delete lbl.controlId;
    }
  }

  // Step 7: write manifest back.
  try {
    fs.writeFileSync(editorPath, JSON.stringify(manifest, null, 2));
  } catch (writeErr) {
    return NextResponse.json(
      { error: `write failed: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}` },
      { status: 500 },
    );
  }

  // Step 8: auto-export to production manifest.
  let exportOk = true;
  let exportError: string | undefined;
  try {
    const { exportManifest } = await import('@/lib/pipeline/exportManifest');
    const r = exportManifest(deviceId);
    if (!r.ok) { exportOk = false; exportError = r.error; }
  } catch (exportErr) {
    exportOk = false;
    exportError = exportErr instanceof Error ? exportErr.message : String(exportErr);
  }

  // Step 9: schedule canvas-data refresh so OrphanList re-fetches.
  try {
    const { scheduleCanvasDataRefresh } = await import('@/lib/pipeline/refresh-canvas-data');
    scheduleCanvasDataRefresh(deviceId);
  } catch { /* best-effort */ }

  return NextResponse.json({
    ok: true,
    deletedControlId: controlId,
    exportOk,
    exportError,
  });
}
