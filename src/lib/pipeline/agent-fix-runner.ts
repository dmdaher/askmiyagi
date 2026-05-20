/**
 * agent-fix-runner — spawns the `tutorial-fixer` agent in one of its
 * three modes (PR-H ships `diagnose-orphan` only) and returns a typed
 * proposal.
 *
 * Two-phase architecture (see docs/canvas-qa-framework.md): the agent
 * NEVER writes manifest/tutorial files. It produces a proposal; the
 * admin gates whether it becomes a real change via the canvas UI's
 * Apply button. This runner is the Phase-1 (Propose) layer.
 *
 * Reuses the pipeline's existing `invokeAgent` infrastructure for
 * spawning, cost tracking, watchdog timeout, and audit log append.
 *
 * Public entry points:
 *   - runDiagnoseOrphan(args) — PR-H IMPLEMENTED
 *   - runFixStep(args)        — PR-I STUB (returns notYetImplemented)
 *   - runAssessCoherence(args) — PR-J STUB
 */

import fs from 'fs';
import path from 'path';
import { invokeAgent } from './runner';

const PIPELINE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'];
const FIXER_BUDGET_USD = 0.35;
const FIX_LOG_FILENAME = 'fix-log.jsonl';

export type OrphanCategory = 'A' | 'B' | 'C' | 'D';
export type Confidence = 'high' | 'medium' | 'low';

export interface DiagnoseOrphanInput {
  deviceId: string;
  repoRoot: string;
  controlId: string;
  control: {
    id: string;
    type: string;
    label?: string;
    shape?: string;
    buttonStyle?: string;
    editorPosition?: { x: number; y: number; w: number; h: number };
  };
  /** Pre-computed nearby controls (~80px proximity), sorted by distance. */
  nearbyControls: Array<{
    id: string;
    type: string;
    label?: string;
    editorPosition?: { x: number; y: number; w: number; h: number };
    distance?: number;
  }>;
}

export interface DiagnoseOrphanResult {
  controlId: string;
  category: OrphanCategory;
  categoryName: string;
  reason: string;
  confidence: Confidence;
  citation: string;
  suggestedAction: 'delete' | 'mark-intentional' | 'suggest-tutorial';
  pairedWith?: string | null;
  suggestedTutorial?: {
    title: string;
    description: string;
    estimatedSteps: number;
    manualPages?: string;
    category?: string;
  } | null;
}

export interface AgentRunOk<T> {
  ok: true;
  result: T;
  costUsd?: number;
  wallMs: number;
}

export interface AgentRunError {
  ok: false;
  error: string;
  cannotFix?: boolean;
  question?: string;
  notYetImplemented?: string;
  costUsd?: number;
  wallMs: number;
}

export type AgentRunResult<T> = AgentRunOk<T> | AgentRunError;

interface FixLogEntry {
  ts: string;
  mode: string;
  deviceId: string;
  target: string;
  outcome: 'proposed' | 'cannotFix' | 'error' | 'applied' | 'rolled-back';
  confidence?: Confidence;
  costUsd?: number;
  wallMs?: number;
  details?: unknown;
}

function appendFixLog(repoRoot: string, deviceId: string, entry: FixLogEntry): void {
  const dir = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, FIX_LOG_FILENAME), JSON.stringify(entry) + '\n');
  } catch { /* best effort */ }
}

function makeDiagnoseOrphanPrompt(input: DiagnoseOrphanInput): string {
  const { deviceId, repoRoot, controlId, control, nearbyControls } = input;
  return [
    `You are the tutorial-fixer in mode=diagnose-orphan.`,
    ``,
    `Device: ${deviceId}`,
    `Repo root: ${repoRoot}`,
    ``,
    `Control to diagnose:`,
    JSON.stringify(control, null, 2),
    ``,
    `Nearby controls (sorted by distance, max 10):`,
    JSON.stringify(nearbyControls.slice(0, 10), null, 2),
    ``,
    `Read the manifest at ${repoRoot}/src/data/manifests/${deviceId}.json if you need full control list.`,
    `Read manual PDFs at ${repoRoot}/.pipeline/${deviceId}/input/manuals/ if needed for category C decisions.`,
    `Read the tutorials snapshot at ${repoRoot}/.pipeline/${deviceId}/agents/tutorial-review/tutorials.json to confirm which nearby controls ARE referenced.`,
    ``,
    `Follow the decision algorithm in your agent prompt EXACTLY.`,
    `Write the JSON result to ${repoRoot}/.pipeline/${deviceId}/agents/tutorial-fixer/last-output.json AND emit it to stdout.`,
    ``,
    `Required output shape:`,
    `{`,
    `  "mode": "diagnose-orphan",`,
    `  "deviceId": "${deviceId}",`,
    `  "ok": true,`,
    `  "result": {`,
    `    "controlId": "${controlId}",`,
    `    "category": "A"|"B"|"C"|"D",`,
    `    "categoryName": "...",`,
    `    "reason": "...",`,
    `    "confidence": "high"|"medium"|"low",`,
    `    "citation": "...",`,
    `    "suggestedAction": "delete"|"mark-intentional"|"suggest-tutorial",`,
    `    "pairedWith": "control-id" | null,`,
    `    "suggestedTutorial": {...} | null`,
    `  }`,
    `}`,
    ``,
    `Emit the JSON ONLY after writing the file. End with a single line:`,
    `[tutorial-fixer] mode=diagnose-orphan deviceId=${deviceId} controlId=${controlId} category=<X> confidence=<Y>`,
  ].join('\n');
}

/**
 * Reads the agent's structured output written to disk. Falls back to
 * parsing the last JSON object in the captured stdout if the file is
 * missing (defensive — file path is canonical but stdout is the
 * fallback).
 */
function readAgentOutput(
  repoRoot: string,
  deviceId: string,
  stdoutFallback: string,
): unknown {
  const outputPath = path.join(
    repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-fixer', 'last-output.json',
  );
  if (fs.existsSync(outputPath)) {
    try {
      return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    } catch { /* fall through to stdout parse */ }
  }
  // Stdout fallback: find the last JSON object in the captured stream
  const match = stdoutFallback.match(/\{[\s\S]*\}/g);
  if (match && match.length > 0) {
    try { return JSON.parse(match[match.length - 1]); } catch { /* ignore */ }
  }
  return null;
}

export async function runDiagnoseOrphan(
  input: DiagnoseOrphanInput,
): Promise<AgentRunResult<DiagnoseOrphanResult>> {
  const start = Date.now();
  const target = `${input.deviceId}:${input.controlId}`;
  // Ensure the output directory exists so the agent can write to it.
  const outDir = path.join(
    input.repoRoot, '.pipeline', input.deviceId, 'agents', 'tutorial-fixer',
  );
  fs.mkdirSync(outDir, { recursive: true });

  let proc: { exitCode: number; stdout: string; stderr: string } | null = null;
  try {
    const result = await invokeAgent({
      prompt: makeDiagnoseOrphanPrompt(input),
      deviceId: input.deviceId,
      phase: 'tutorial-review',
      agent: 'tutorial-fixer',
      cwd: input.repoRoot,
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: FIXER_BUDGET_USD,
      remainingBudgetUsd: FIXER_BUDGET_USD,
    });
    // invokeAgent merges stdout/stderr into `output`. The agent's structured
    // result is written to last-output.json on disk (see readAgentOutput);
    // `output` is just the fallback parser source.
    proc = {
      exitCode: result.exitCode,
      stdout: result.output,
      stderr: '',
    };
  } catch (err) {
    const wallMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(),
      mode: 'diagnose-orphan',
      deviceId: input.deviceId,
      target,
      outcome: 'error',
      wallMs,
      details: { error: msg },
    });
    return { ok: false, error: `Failed to invoke agent: ${msg}`, wallMs };
  }

  const wallMs = Date.now() - start;
  if (proc.exitCode !== 0) {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(),
      mode: 'diagnose-orphan',
      deviceId: input.deviceId,
      target,
      outcome: 'error',
      wallMs,
      details: { exitCode: proc.exitCode, stderr: proc.stderr.slice(-500) },
    });
    return {
      ok: false,
      error: `tutorial-fixer exited with code ${proc.exitCode}: ${proc.stderr.slice(-400)}`,
      wallMs,
    };
  }

  const parsed = readAgentOutput(input.repoRoot, input.deviceId, proc.stdout);
  if (!parsed || typeof parsed !== 'object') {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(),
      mode: 'diagnose-orphan',
      deviceId: input.deviceId,
      target,
      outcome: 'error',
      wallMs,
      details: { reason: 'no parseable output' },
    });
    return { ok: false, error: 'Agent produced no parseable JSON output', wallMs };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.cannotFix === true) {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(),
      mode: 'diagnose-orphan',
      deviceId: input.deviceId,
      target,
      outcome: 'cannotFix',
      wallMs,
      details: { question: obj.question },
    });
    return {
      ok: false,
      cannotFix: true,
      question: typeof obj.question === 'string' ? obj.question : 'Agent could not diagnose',
      wallMs,
      error: typeof obj.question === 'string' ? obj.question : 'Agent could not diagnose',
    };
  }

  if (obj.ok !== true || !obj.result) {
    return {
      ok: false,
      error: `Agent output malformed: ${JSON.stringify(obj).slice(0, 300)}`,
      wallMs,
    };
  }

  const r = obj.result as DiagnoseOrphanResult;
  // Minimal shape validation
  if (!r.category || !['A', 'B', 'C', 'D'].includes(r.category)) {
    return {
      ok: false,
      error: `Agent output missing valid category: ${JSON.stringify(r).slice(0, 200)}`,
      wallMs,
    };
  }

  appendFixLog(input.repoRoot, input.deviceId, {
    ts: new Date().toISOString(),
    mode: 'diagnose-orphan',
    deviceId: input.deviceId,
    target,
    outcome: 'proposed',
    confidence: r.confidence,
    wallMs,
    details: { category: r.category, suggestedAction: r.suggestedAction, pairedWith: r.pairedWith },
  });

  return { ok: true, result: r, wallMs };
}

// PR-I / PR-J stubs — return notYetImplemented so calling routes can
// surface "this mode is not yet built" cleanly.
export async function runFixStep(
  input: { deviceId: string; repoRoot: string; tutorialId: string; stepIndex: number; finding: unknown },
): Promise<AgentRunResult<never>> {
  return {
    ok: false,
    notYetImplemented: 'fix-step mode lands in PR-I',
    error: 'fix-step not yet implemented',
    wallMs: 0,
  };
}

export async function runAssessCoherence(
  input: { deviceId: string; repoRoot: string; tutorialId: string },
): Promise<AgentRunResult<never>> {
  return {
    ok: false,
    notYetImplemented: 'assess-coherence mode lands in PR-J',
    error: 'assess-coherence not yet implemented',
    wallMs: 0,
  };
}
