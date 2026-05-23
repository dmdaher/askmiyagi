/**
 * POST /api/pipeline/[deviceId]/refresh-from-editor
 *
 * Manual "force re-propagate" used by the canvas's QA panel button.
 * Synchronously:
 *   1. Re-exports manifest-editor.json → src/data/manifests/<id>.json
 *   2. Re-runs tutorial-validators against the fresh manifest
 *   3. Re-runs deterministic canvas QA (layers 1 + 3)
 *
 * Visual layer 2 is NOT re-run here (it takes 30-60s). Use the canvas's
 * separate "Run Visual QA" button for that.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exportManifest } from '@/lib/pipeline/exportManifest';
import { refreshCanvasData, flushPendingRefresh } from '@/lib/pipeline/refresh-canvas-data';
import { readState } from '@/lib/pipeline/state-machine';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: `No pipeline found for ${deviceId}` }, { status: 404 });
  }

  // Step 1: re-export (idempotent — even if editor already exported, no harm)
  const exportResult = exportManifest(deviceId);
  if (!exportResult.ok) {
    return NextResponse.json(
      { error: `Export failed: ${exportResult.error}`, details: exportResult.output },
      { status: 500 },
    );
  }

  // Step 2: flush any pending debounced refresh, then run fresh
  await flushPendingRefresh(deviceId);
  const outcome = await refreshCanvasData(deviceId);

  if (outcome.error) {
    return NextResponse.json({
      ok: false,
      error: outcome.error,
      outcome,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    exported: exportResult.output,
    outcome,
  });
}
