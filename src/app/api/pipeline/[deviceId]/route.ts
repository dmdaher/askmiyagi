import { NextRequest, NextResponse } from 'next/server';
import { readState, writeState } from '@/lib/pipeline/state-machine';
import { gracefulKill, deletePipelineData } from '@/lib/pipeline/process-utils';
import { deleteHostedDevice } from '@/lib/hosted-storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const state = readState(deviceId);

  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  return NextResponse.json(state);
}

/**
 * Full pipeline deletion. Removes ALL local + Blob data for this device.
 *
 * Preserves `.pipeline/saved/<id>/manifest-editor.json` (copied from the live
 * manifest-editor before deletion) so a future restart auto-restores
 * contractor positions via the manifest-route's saved/ fallback.
 *
 * Out of scope (intentionally untouched):
 *   - `src/data/devices.ts` (production registry, git-tracked)
 *   - `src/data/manifests/<id>.json` (production manifest, git-tracked)
 *   - `src/data/tutorials/<id>/` (tutorial files, git-tracked)
 *   - `.pipeline/saved/<id>/` (the safety net itself — wipe manually via terminal)
 *
 * Idempotent: returns success even if there's nothing to delete.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  // Step 1: kill any running processes (best-effort; missing state is fine).
  const state = readState(deviceId);
  if (state) {
    if (state.childPid) gracefulKill(state.childPid, 'Agent');
    if (state.runnerPid) gracefulKill(state.runnerPid, 'Runner');
    // Update state file before we delete the dir, so any inspector sees the
    // intent. The next step removes the file along with everything else.
    state.status = 'failed';
    state.currentPhase = 'failed';
    state.runnerPid = null;
    state.childPid = null;
    try { writeState(deviceId, state); } catch { /* about to delete anyway */ }
  }

  // Step 2: filesystem cleanup (preserves saved/<id>/manifest-editor.json).
  const fsResult = deletePipelineData(deviceId);

  // Step 3: Blob cleanup (best-effort — partial failures don't fail the request).
  let blobResult = { deleted: 0, errors: [] as string[] };
  try {
    blobResult = await deleteHostedDevice(deviceId);
  } catch (err) {
    blobResult.errors.push(`deleteHostedDevice threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Server-side audit (log file is gone — use console for the trail).
  console.log(`[admin-delete-pipeline] device=${deviceId}`, { fsResult, blobResult });

  return NextResponse.json({
    status: 'deleted',
    deletedItems: {
      filesystem: fsResult.removedPipeline,
      worktree: fsResult.removedWorktree,
      blobDeleted: blobResult.deleted,
      blobErrors: blobResult.errors.length,
    },
    preserved: {
      manifestEditor: fsResult.savedManifestEditor,
    },
    notes: fsResult.notes,
  });
}
