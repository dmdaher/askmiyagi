/**
 * POST /api/pipeline/[deviceId]/qa-fix-propose — Phase 1 of two-phase
 * Fix flow. Spawns tutorial-fixer in fix-step mode for ONE finding.
 * Returns the proposed JSON patch + confidence + citation + reasoning.
 * DOES NOT modify tutorials.json.
 *
 * Body:
 *   {
 *     findingType: 'layer1a' | 'layer3a' | 'layer3b',
 *     tutorialId: string,
 *     stepIndex: number,
 *     payload: { ... finding-specific ... },
 *     additionalContext?: string
 *   }
 *
 * Server-side per-finding semaphore: if the same finding is already
 * being proposed, returns 429 with the active runId so client can wait.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { readState } from '@/lib/pipeline/state-machine';
import { runFixStep, type FindingType, type FixStepResult, type FixStepInput } from '@/lib/pipeline/agent-fix-runner';

// Module-level dedupe (one in-flight propose per finding key per process).
const inFlight = new Map<string, Promise<{ ok: boolean; result?: FixStepResult; error?: string; cannotFix?: boolean; question?: string }>>();

function findingKey(deviceId: string, tutorialId: string, stepIndex: number, findingType: string): string {
  return `${deviceId}:${tutorialId}:${stepIndex}:${findingType}`;
}

interface Body {
  findingType: FindingType;
  tutorialId: string;
  stepIndex: number;
  payload: unknown;
  additionalContext?: string;
}

function enrichPayload(
  body: Body,
  deviceId: string,
  repoRoot: string,
): { ok: true; payload: unknown } | { ok: false; error: string } {
  // The client only needs to send the FINDING (controlId, etc.). The
  // server enriches it with full step + manifest control IDs / labels
  // so the agent doesn't have to fetch them mid-prompt.
  const tutorialsPath = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'tutorials.json');
  const manifestPath = path.join(repoRoot, 'src', 'data', 'manifests', `${deviceId}.json`);
  if (!fs.existsSync(tutorialsPath)) return { ok: false, error: 'tutorials.json not found' };
  if (!fs.existsSync(manifestPath)) return { ok: false, error: 'manifest not found' };

  try {
    const tutorials = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8')) as Array<{ id: string; steps: unknown[] }>;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as { controls: Array<{ id: string; label?: string }> };
    const tut = tutorials.find((t) => t.id === body.tutorialId);
    if (!tut) return { ok: false, error: `tutorial ${body.tutorialId} not found` };
    const step = tut.steps[body.stepIndex];
    if (!step) return { ok: false, error: `step ${body.stepIndex} not found` };

    const p = (body.payload ?? {}) as Record<string, unknown>;
    const enriched = {
      ...p,
      step,
      manifestControlIds: manifest.controls.map((c) => c.id),
      manifestControlLabels: Object.fromEntries(manifest.controls.map((c) => [c.id, c.label ?? ''])),
    };
    return { ok: true, payload: enriched };
  } catch (err) {
    return { ok: false, error: `failed to enrich payload: ${err instanceof Error ? err.message : String(err)}` };
  }
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

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || !body.findingType || !body.tutorialId || typeof body.stepIndex !== 'number') {
    return NextResponse.json({
      error: 'Body must include { findingType, tutorialId, stepIndex, payload }',
    }, { status: 400 });
  }
  if (!['layer1a', 'layer3a', 'layer3b'].includes(body.findingType)) {
    return NextResponse.json({
      error: `Unsupported findingType: ${body.findingType}`,
    }, { status: 400 });
  }

  const repoRoot = process.cwd();
  const key = findingKey(deviceId, body.tutorialId, body.stepIndex, body.findingType);
  const existing = inFlight.get(key);
  if (existing) {
    // Return the in-flight result (caller waits)
    const result = await existing;
    return NextResponse.json(result);
  }

  const enriched = enrichPayload(body, deviceId, repoRoot);
  if (!enriched.ok) {
    return NextResponse.json({ error: enriched.error }, { status: 400 });
  }

  const input: FixStepInput = {
    deviceId, repoRoot,
    tutorialId: body.tutorialId,
    stepIndex: body.stepIndex,
    findingType: body.findingType,
    payload: enriched.payload,
    additionalContext: body.additionalContext,
  };

  const promise = (async () => {
    const agentResult = await runFixStep(input);
    if (agentResult.ok) {
      return { ok: true, result: agentResult.result };
    }
    if ('cannotFix' in agentResult && agentResult.cannotFix) {
      return { ok: false, cannotFix: true, question: agentResult.question, error: agentResult.error };
    }
    return { ok: false, error: agentResult.error };
  })();

  inFlight.set(key, promise);
  try {
    const result = await promise;
    return NextResponse.json(result);
  } finally {
    inFlight.delete(key);
  }
}
