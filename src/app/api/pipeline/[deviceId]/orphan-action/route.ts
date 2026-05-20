/**
 * POST /api/pipeline/[deviceId]/orphan-action
 *
 * One endpoint for the 3 admin actions on a Layer 1b orphan finding:
 *   - `diagnose`: spawn tutorial-fixer in diagnose-orphan mode,
 *     cache the result, return it. Updates qa-report.json so the
 *     canvas's auto-refresh poll picks up the new diagnosis.
 *   - `mark-intentional`: persist admin's "this orphan is OK" decision
 *     to orphan-intentions.json. Suppresses re-flagging on subsequent
 *     QA runs.
 *   - `unmark-intentional`: undo a prior mark.
 *
 * Body shape:
 *   { action: 'diagnose' | 'mark-intentional' | 'unmark-intentional',
 *     controlId: string, intent?: { category, pairedWith?, reason? } }
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';
import {
  runDiagnoseOrphan,
  type DiagnoseOrphanInput,
} from '@/lib/pipeline/agent-fix-runner';
import {
  markIntentional,
  unmarkIntentional,
  type OrphanCategory,
} from '@/lib/pipeline/orphan-intentions';
import {
  runDeterministicQa,
  writeCachedDiagnoses,
  loadManifest,
  loadTutorialsForDevice,
} from '@/lib/pipeline/canvas-qa';
import fs from 'fs';

interface ManifestControl {
  id: string;
  type: string;
  label?: string;
  shape?: string;
  buttonStyle?: string;
  editorPosition?: { x: number; y: number; w: number; h: number };
}

function distance(a: ManifestControl, b: ManifestControl): number {
  const ax = a.editorPosition?.x ?? 0, ay = a.editorPosition?.y ?? 0;
  const bx = b.editorPosition?.x ?? 0, by = b.editorPosition?.y ?? 0;
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function nearbyOf(target: ManifestControl, all: ManifestControl[], k = 10) {
  return all
    .filter((c) => c.id !== target.id)
    .map((c) => ({ ...c, distance: distance(target, c) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: `No pipeline for ${deviceId}` }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== 'string' || typeof body.controlId !== 'string') {
    return NextResponse.json({ error: 'Body must include { action, controlId }' }, { status: 400 });
  }
  const repoRoot = process.cwd();
  const { action, controlId } = body as { action: string; controlId: string };

  // ── mark-intentional / unmark-intentional ───────────────────────────────
  if (action === 'mark-intentional') {
    const intent = body.intent ?? {};
    if (!['A', 'B', 'C', 'D'].includes(intent.category)) {
      return NextResponse.json({ error: 'intent.category required (A/B/C/D)' }, { status: 400 });
    }
    markIntentional(deviceId, controlId, {
      category: intent.category as OrphanCategory,
      pairedWith: intent.pairedWith ?? null,
      reason: intent.reason ?? undefined,
    }, repoRoot);
    // Re-run deterministic QA so qa-report reflects the suppression.
    runDeterministicQa({ deviceId, repoRoot });
    return NextResponse.json({ ok: true });
  }

  if (action === 'unmark-intentional') {
    unmarkIntentional(deviceId, controlId, repoRoot);
    runDeterministicQa({ deviceId, repoRoot });
    return NextResponse.json({ ok: true });
  }

  // ── diagnose ────────────────────────────────────────────────────────────
  if (action === 'diagnose') {
    let manifest;
    try {
      manifest = loadManifest(deviceId, repoRoot);
    } catch (err) {
      return NextResponse.json(
        { error: `Manifest not found: ${err instanceof Error ? err.message : String(err)}` },
        { status: 404 },
      );
    }
    const target = manifest.controls.find((c) => c.id === controlId);
    if (!target) {
      return NextResponse.json(
        { error: `Control ${controlId} not found in manifest` },
        { status: 404 },
      );
    }

    const input: DiagnoseOrphanInput = {
      deviceId,
      repoRoot,
      controlId,
      control: target as ManifestControl,
      nearbyControls: nearbyOf(target as ManifestControl, manifest.controls as ManifestControl[]),
    };

    const agentResult = await runDiagnoseOrphan(input);
    if (!agentResult.ok) {
      return NextResponse.json({
        ok: false,
        error: agentResult.error,
        cannotFix: 'cannotFix' in agentResult ? agentResult.cannotFix : undefined,
        question: 'question' in agentResult ? agentResult.question : undefined,
      }, { status: 500 });
    }

    // Cache the diagnosis so the canvas's next QA-report read includes it.
    const cachePath = path.join(
      repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'orphan-diagnoses.json',
    );
    const cache: Record<string, unknown> = fs.existsSync(cachePath)
      ? JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
      : {};
    cache[controlId] = {
      category: agentResult.result.category,
      categoryName: agentResult.result.categoryName,
      reason: agentResult.result.reason,
      confidence: agentResult.result.confidence,
      citation: agentResult.result.citation,
      suggestedAction: agentResult.result.suggestedAction,
      pairedWith: agentResult.result.pairedWith ?? null,
      suggestedTutorial: agentResult.result.suggestedTutorial ?? null,
      diagnosedAt: new Date().toISOString(),
    };
    writeCachedDiagnoses(deviceId, cache as Record<string, never>, repoRoot);
    // Re-run deterministic QA so qa-report includes the new diagnosis.
    runDeterministicQa({ deviceId, repoRoot });

    return NextResponse.json({ ok: true, diagnosis: cache[controlId] });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
