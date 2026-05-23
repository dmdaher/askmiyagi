/**
 * POST /api/pipeline/[deviceId]/qa-rerun
 *
 * Re-runs the Canvas QA suite — re-runs deterministic layers (1+3) AND
 * the visual layer (Layer 2) via Playwright against the local dev
 * server. Updates `.pipeline/<deviceId>/agents/tutorial-review/qa-report.json`.
 *
 * Synchronous from admin's perspective. Playwright run takes ~30-60s for
 * 23 tutorials × ~7 steps. We could background this with a status
 * channel later; for now we just return when it's done.
 *
 * Returns 200 with the updated report on success, 5xx on internal error.
 */
import { NextResponse } from 'next/server';
import path from 'path';
import { spawn } from 'child_process';
import {
  runDeterministicQa,
  mergeVisualResults,
  type QaResult,
} from '@/lib/pipeline/canvas-qa';
import { readState } from '@/lib/pipeline/state-machine';

interface VisualStepResult {
  tutorialId: string;
  stepIndex: number;
  stepTitle: string;
  expected: string[];
  litUp: string[];
  unexpected: string[];
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: `No pipeline found for ${deviceId}` }, { status: 404 });
  }

  const repoRoot = process.cwd();
  const reviewDir = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review');
  const qaReportPath = path.join(reviewDir, 'qa-report.json');

  // Step 1: re-run deterministic layers (fast, in-process).
  try {
    runDeterministicQa({ deviceId, repoRoot });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Deterministic QA failed: ${message}` }, { status: 500 });
  }

  // Step 2: spawn the Playwright visual layer. Reuses the canvas-qa-suite
  // script but only writes JSON results, not screenshots-to-disk (those
  // happen as a side effect).
  const visualResults = await new Promise<QaResult[] | { error: string }>((resolve) => {
    const child = spawn(
      'npx',
      ['tsx', 'e2e/canvas-qa-visual-only.ts'],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          TEST_DEVICE: deviceId,
          TEST_BASE_URL: process.env.QA_BASE_URL || 'http://localhost:3000',
          OUTPUT_JSON: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        resolve({ error: `Visual QA exited ${code}: ${stderr.slice(-400)}` });
        return;
      }
      try {
        // Visual runner emits a JSON line at the end: __QA_RESULTS__ {...}
        const m = stdout.match(/__QA_RESULTS__\s+(\{[\s\S]*\})\s*$/m);
        if (!m) {
          resolve({ error: 'Visual QA produced no parseable result line' });
          return;
        }
        const payload = JSON.parse(m[1]) as { results: QaResult[]; stepResults: VisualStepResult[] };
        resolve(payload.results);
      } catch (err) {
        resolve({ error: `Failed to parse visual QA output: ${err}` });
      }
    });
    child.on('error', (err) => {
      resolve({ error: `Failed to spawn visual QA: ${err.message}` });
    });
  });

  if (!Array.isArray(visualResults)) {
    return NextResponse.json({
      error: 'visualResults' in visualResults ? visualResults.error : 'unknown visual QA error',
    }, { status: 500 });
  }

  const merged = mergeVisualResults(qaReportPath, visualResults);
  return NextResponse.json({ ok: true, report: merged });
}
