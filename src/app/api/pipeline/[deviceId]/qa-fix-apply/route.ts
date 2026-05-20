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
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';
import {
  applyFixStepPatch,
  applyTutorialFixPatch,
  type FixStepResult,
} from '@/lib/pipeline/agent-fix-runner';
import { runDeterministicQa, loadManifest } from '@/lib/pipeline/canvas-qa';
import { verifyCumulativeState } from '@/lib/pipeline/cumulative-state';

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

  const body = (await request.json().catch(() => null)) as {
    result?: FixStepResult;
    applyAnyway?: boolean;
  } | null;
  if (!body?.result?.tutorialId || typeof body.result.stepIndex !== 'number' || !Array.isArray(body.result.patch)) {
    return NextResponse.json({
      error: 'Body must include { result: FixStepResult with tutorialId, stepIndex, patch }',
    }, { status: 400 });
  }
  const applyAnyway = body.applyAnyway === true;

  const repoRoot = process.cwd();
  const key = `${deviceId}:${body.result.tutorialId}:${body.result.stepIndex}:${body.result.findingType}`;
  if (applyInFlight.has(key)) {
    return NextResponse.json({
      error: 'Another apply for this finding is already in-flight',
    }, { status: 429 });
  }
  applyInFlight.add(key);

  try {
    // PR-K: dispatch by findingType. layer5 has tutorial-level array
    // ops on /steps/<idx>; everything else uses the step-level applier.
    const applyResult = body.result.findingType === 'layer5'
      ? await applyTutorialFixPatch({
          deviceId, repoRoot,
          result: {
            tutorialId: body.result.tutorialId,
            findingType: body.result.findingType,
            patch: body.result.patch,
            confidence: body.result.confidence,
          },
        })
      : await applyFixStepPatch({ deviceId, repoRoot, result: body.result });
    if (!applyResult.ok) {
      return NextResponse.json({
        error: applyResult.error,
        rolledBack: 'rolledBack' in applyResult ? applyResult.rolledBack : false,
      }, { status: 500 });
    }

    // PR-L: cumulative-state verification. Walk the patched tutorial,
    // surface violations, roll back if any are 'fail' severity unless
    // admin passed { applyAnyway: true }.
    let violations: ReturnType<typeof verifyCumulativeState>['violations'] = [];
    try {
      const tutorialsPath = path.join(
        repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'tutorials.json',
      );
      const tutorials = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8')) as Array<{ id: string; steps: unknown[] }>;
      const patchedTutorial = tutorials.find((t) => t.id === body.result!.tutorialId);
      if (patchedTutorial) {
        const manifest = loadManifest(deviceId, repoRoot);
        const verify = verifyCumulativeState(
          patchedTutorial as Parameters<typeof verifyCumulativeState>[0],
          manifest,
        );
        violations = verify.violations;
        const hasFailViolations = violations.some((v) => v.severity === 'fail');
        if (hasFailViolations && !applyAnyway) {
          // Roll back tutorials.json to the backup.
          if (applyResult.backupPath && fs.existsSync(applyResult.backupPath)) {
            fs.copyFileSync(applyResult.backupPath, tutorialsPath);
          }
          return NextResponse.json({
            error: 'Cumulative-state verification failed. Pass { applyAnyway: true } to override.',
            rolledBack: true,
            violations,
          }, { status: 409 });
        }
      }
    } catch (verifyErr) {
      console.warn(`[qa-fix-apply] cumulative-state verify failed: ${verifyErr}`);
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
      violations: violations.length > 0 ? violations : undefined,
      appliedAnyway: applyAnyway && violations.some((v) => v.severity === 'fail') ? true : undefined,
    });
  } finally {
    applyInFlight.delete(key);
  }
}
