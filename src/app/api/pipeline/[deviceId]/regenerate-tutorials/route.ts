/**
 * Tutorials regeneration — rewind the pipeline to phase-5-tutorial-build and
 * re-run the tutorial-builder agent.
 *
 * GET  → preview { canRegenerate, batchCount, source, reason } so the UI can
 *        accurately gate the button without trusting stale state alone.
 * POST → actually do the rewind + spawn the runner.
 *
 * Both handle the cdj-3000-style case where state.tutorialBatches is empty
 * but the auditor's batch file is sitting on disk waiting to be consumed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { readState, writeState } from '@/lib/pipeline/state-machine';
import { parseBatchesForDevice } from '@/lib/pipeline/parse-batches';

interface PreviewResponse {
  canRegenerate: boolean;
  batchCount: number;
  source: 'state' | 'disk' | 'none';
  reason: string;
}

function computePreview(deviceId: string): PreviewResponse & { _state: ReturnType<typeof readState> } {
  const state = readState(deviceId);
  if (!state) {
    return {
      _state: null,
      canRegenerate: false,
      batchCount: 0,
      source: 'none',
      reason: `No pipeline found for ${deviceId}.`,
    };
  }
  if (state.status === 'running') {
    return {
      _state: state,
      canRegenerate: false,
      batchCount: state.tutorialBatches.length,
      source: state.tutorialBatches.length > 0 ? 'state' : 'none',
      reason: 'Pipeline is currently running — pause or kill it first.',
    };
  }
  if (state.tutorialBatches.length > 0) {
    return {
      _state: state,
      canRegenerate: true,
      batchCount: state.tutorialBatches.length,
      source: 'state',
      reason: `${state.tutorialBatches.length} batches in state — regenerate will re-run them all.`,
    };
  }
  const disk = parseBatchesForDevice(deviceId);
  if (disk.length > 0) {
    return {
      _state: state,
      canRegenerate: true,
      batchCount: disk.length,
      source: 'disk',
      reason: `State has 0 batches but ${disk.length} found in auditor output — regenerate will recover them from disk.`,
    };
  }
  return {
    _state: state,
    canRegenerate: false,
    batchCount: 0,
    source: 'none',
    reason: 'No batches in state and no batch file on disk. Re-run extractor + auditor first.',
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const { _state, ...preview } = computePreview(deviceId);
  void _state;
  return NextResponse.json(preview);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const preview = computePreview(deviceId);
  const state = preview._state;

  if (!state) {
    return NextResponse.json({ error: preview.reason }, { status: 404 });
  }

  if (!preview.canRegenerate) {
    return NextResponse.json({ error: preview.reason }, { status: 409 });
  }

  // If the only batches we have come from disk (state was empty), populate
  // state from the parsed file before rewinding.
  if (preview.source === 'disk') {
    const reparsed = parseBatchesForDevice(deviceId);
    state.tutorialBatches = reparsed.map((b) => ({
      ...b,
      status: 'pending' as const,
      builderScore: null,
      reviewerVerdict: null,
    }));
  }

  // Rewind: reset every batch + clear any in-flight escalation + clear any
  // prior review feedback so the new build starts clean. Mark prior
  // tutorial-build / tutorial-review / tutorial-pr phases as 'skipped' in the
  // historical timeline so the dashboard reflects the reset.
  for (const batch of state.tutorialBatches) {
    batch.status = 'pending';
    batch.builderScore = null;
    batch.reviewerVerdict = null;
  }
  state.activeEscalation = null;
  state.tutorialReviewFeedback = null;

  for (const ph of state.phases) {
    if (
      (ph.phase === 'phase-5-tutorial-build' ||
        ph.phase === 'tutorial-review' ||
        ph.phase === 'tutorial-pr') &&
      ph.status === 'passed'
    ) {
      ph.status = 'skipped';
      ph.completedAt = new Date().toISOString();
    }
  }

  state.currentPhase = 'phase-5-tutorial-build';
  state.status = 'running';
  state.lastCheckpoint = { phase: 'phase-5-tutorial-build', subStep: 'regenerate-requested' };
  writeState(deviceId, state);

  const proc = spawn('npx', ['tsx', 'scripts/pipeline-runner.ts', deviceId], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  state.runnerPid = proc.pid ?? null;
  writeState(deviceId, state);

  return NextResponse.json({
    status: 'running',
    currentPhase: state.currentPhase,
    batchesReset: state.tutorialBatches.length,
    source: preview.source,
  });
}
