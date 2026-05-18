import { NextRequest, NextResponse } from 'next/server';
import { exportManifest } from '@/lib/pipeline/exportManifest';

/**
 * POST /api/pipeline/{deviceId}/export-manifest
 *
 * Reads manifest-editor.json (editor's saved state) and writes a
 * production-ready PanelManifest JSON to src/data/manifests/{deviceId}.json.
 *
 * This route is kept for two reasons:
 *   1. Manual override / admin diagnostics (debugging stale production
 *      manifests, forcing a re-export after pipeline runs, etc.)
 *   2. Backward-compat with any external tooling that may call it
 *
 * The same exportManifest() function is called automatically by the
 * /api/pipeline/{deviceId}/manifest PUT handler after every contractor
 * save — so in practice, this route is rarely needed in normal workflow.
 * See `src/lib/pipeline/exportManifest.ts` for the actual logic.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const result = exportManifest(deviceId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, details: result.output },
      { status: result.error === 'No editor manifest found' ? 404 : 500 },
    );
  }

  // Mark export as completed in pipeline state (for nav gating + pipeline continuation).
  // Only ever set by this MANUAL route — the auto-export on save doesn't
  // flip this flag because we don't want every contractor save to be
  // considered a "release" event in the pipeline state machine.
  try {
    const { readState, writeState } = await import('@/lib/pipeline/state-machine');
    const pState = readState(deviceId);
    if (pState) {
      (pState as any).codegenCompleted = true;
      writeState(deviceId, pState);
    }
  } catch {
    /* best effort */
  }

  return NextResponse.json({ ok: true, output: result.output });
}
