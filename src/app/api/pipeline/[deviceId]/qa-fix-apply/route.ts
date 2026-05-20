/**
 * POST /api/pipeline/[deviceId]/qa-fix-apply — Phase 2 of two-phase
 * Fix flow. Accepts a FixStepResult (from a prior /qa-fix-propose
 * response, or from sessionStorage cache). Applies the JSON patch to
 * tutorials.json with backup-first / rollback-on-failure semantics.
 * Re-runs deterministic QA so the canvas's auto-refresh poll picks up
 * the new state.
 *
 * Body:
 *   {
 *     result: FixStepResult  // as returned by /qa-fix-propose
 *   }
 *
 * Server-side per-finding semaphore prevents double-applies.
 */
import { NextResponse } from 'next/server';
import { readState } from '@/lib/pipeline/state-machine';
import { applyFixStepPatch, type FixStepResult } from '@/lib/pipeline/agent-fix-runner';
import { runDeterministicQa } from '@/lib/pipeline/canvas-qa';

const applyInFlight = new Set<string>();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: `No pipeline for ${deviceId}` }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { result?: FixStepResult } | null;
  if (!body?.result?.tutorialId || typeof body.result.stepIndex !== 'number' || !Array.isArray(body.result.patch)) {
    return NextResponse.json({
      error: 'Body must include { result: FixStepResult with tutorialId, stepIndex, patch }',
    }, { status: 400 });
  }

  const repoRoot = process.cwd();
  const key = `${deviceId}:${body.result.tutorialId}:${body.result.stepIndex}:${body.result.findingType}`;
  if (applyInFlight.has(key)) {
    return NextResponse.json({
      error: 'Another apply for this finding is already in-flight',
    }, { status: 429 });
  }
  applyInFlight.add(key);

  try {
    const applyResult = await applyFixStepPatch({
      deviceId, repoRoot, result: body.result,
    });
    if (!applyResult.ok) {
      return NextResponse.json({
        error: applyResult.error,
        rolledBack: 'rolledBack' in applyResult ? applyResult.rolledBack : false,
      }, { status: 500 });
    }
    // Re-run QA so canvas auto-refresh poll picks up the new state.
    try {
      runDeterministicQa({ deviceId, repoRoot });
    } catch (qaErr) {
      console.warn(`[qa-fix-apply] post-apply QA re-run failed: ${qaErr}`);
    }
    return NextResponse.json({
      ok: true,
      appliedAt: applyResult.appliedAt,
      backupPath: applyResult.backupPath,
    });
  } finally {
    applyInFlight.delete(key);
  }
}
