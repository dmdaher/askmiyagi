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
  const manifestPath = path.join(process.cwd(), '.pipeline', deviceId, 'manifest.json');

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
    const manifest = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      : null;

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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to read review data: ${message}` }, { status: 500 });
  }
}
