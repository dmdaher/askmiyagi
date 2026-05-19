/**
 * GET /api/pipeline/[deviceId]/review-tutorials
 *
 * Returns everything the admin review page needs to display the generated
 * tutorials before they get PR'd:
 *   - summary: validator output (counts + issues per tutorial)
 *   - tutorials: serialized Tutorial[] from the pipeline runner's pause
 *   - manifest: the in-progress panel manifest (for rendering the panel)
 *   - escalationId / status: from pipeline state, for the Approve / Request
 *     Changes actions to address the right escalation
 *
 * 404 if the device isn't currently paused at tutorial-review.
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  const reviewDir = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'tutorial-review');
  const summaryPath = path.join(reviewDir, 'summary.json');
  const tutorialsPath = path.join(reviewDir, 'tutorials.json');

  // Manifest precedence — show the panel as production will render it:
  //   1. src/data/manifests/<id>.json   (committed production, what /tutorial/* renders)
  //   2. .pipeline/<id>/manifest-editor.json (contractor's most recent edits,
  //      not yet promoted to src/data/manifests/)
  //   3. .pipeline/<id>/manifest.json   (gatekeeper raw — fallback for fresh
  //      devices that haven't been committed yet)
  //
  // The canvas review's purpose is to verify tutorials AGAINST PRODUCTION,
  // so the committed file is most accurate. Caught by devin 2026-05-19:
  // initially the API only looked at .pipeline/<id>/manifest.json (raw)
  // which could miss contractor edits.
  const manifestCandidates = [
    path.join(process.cwd(), 'src', 'data', 'manifests', `${deviceId}.json`),
    path.join(process.cwd(), '.pipeline', deviceId, 'manifest-editor.json'),
    path.join(process.cwd(), '.pipeline', deviceId, 'manifest.json'),
  ];

  if (!fs.existsSync(summaryPath) || !fs.existsSync(tutorialsPath)) {
    return NextResponse.json(
      {
        error:
          'No tutorial-review data on disk. The pipeline must complete tutorial-build and reach the tutorial-review pause before the admin page is available.',
      },
      { status: 404 },
    );
  }

  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    const tutorials = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8'));

    let manifest = null;
    let manifestSource: string | null = null;
    for (const candidatePath of manifestCandidates) {
      if (fs.existsSync(candidatePath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(candidatePath, 'utf-8'));
          manifestSource = path.relative(process.cwd(), candidatePath);
          break;
        } catch { /* try next candidate */ }
      }
    }

    const escalation = state.escalations.find(
      e => e.type === 'tutorial-review' && !e.resolvedAt,
    );

    return NextResponse.json({
      deviceId,
      deviceName: state.deviceName,
      currentPhase: state.currentPhase,
      status: state.status,
      escalationId: escalation?.id ?? null,
      summary,
      tutorials,
      manifest,
      manifestSource,  // surfaces which file backed the panel render
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to read review data: ${message}` }, { status: 500 });
  }
}
