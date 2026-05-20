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
  // Always TRY to read the output file even if exitCode !== 0. Claude CLI
  // sometimes exits with code 1 after the agent has already written its
  // structured output to disk (observed: budget-cap soft-stop, tool-call
  // edge cases). If a valid result is present we should use it — the
  // diagnosis itself is sound. Only error out when nothing parseable
  // exists.
  const parsed = readAgentOutput(input.repoRoot, input.deviceId, proc.stdout);
  if (proc.exitCode !== 0 && (!parsed || typeof parsed !== 'object' || (parsed as { ok?: unknown }).ok !== true)) {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(),
      mode: 'diagnose-orphan',
      deviceId: input.deviceId,
      target,
      outcome: 'error',
      wallMs,
      details: { exitCode: proc.exitCode, stderr: proc.stderr.slice(-500), reason: 'non-zero exit + no parseable output' },
    });
    return {
      ok: false,
      error: `tutorial-fixer exited with code ${proc.exitCode} and produced no usable output: ${proc.stderr.slice(-400)}`,
      wallMs,
    };
  }
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

// ── fix-step (PR-I — IMPLEMENTED) ─────────────────────────────────────

export type FindingType = 'layer1a' | 'layer3a' | 'layer3b' | 'layer4' | 'layer5';

export interface FixStepInput {
  deviceId: string;
  repoRoot: string;
  tutorialId: string;
  stepIndex: number;
  findingType: FindingType;
  payload: unknown;
  additionalContext?: string;
}

export interface FixStepPatchOp {
  op: 'replace' | 'add' | 'remove';
  path: string;
  value?: unknown;
  previousValue?: unknown;
}

export interface FixStepResult {
  tutorialId: string;
  stepIndex: number;
  findingType: FindingType;
  patch: FixStepPatchOp[];
  explanation: string;
  confidence: Confidence;
  citation: string;
  alternatives?: Array<{ value: unknown; rejected: string }>;
}

function makeFixStepPrompt(input: FixStepInput): string {
  const { deviceId, repoRoot, tutorialId, stepIndex, findingType, payload, additionalContext } = input;
  return [
    `You are the tutorial-fixer in mode=fix-step.`,
    ``,
    `Device: ${deviceId}`,
    `Repo root: ${repoRoot}`,
    `Tutorial: ${tutorialId}`,
    `Step index (0-based): ${stepIndex}`,
    `Finding type: ${findingType}`,
    ``,
    `Payload:`,
    JSON.stringify(payload, null, 2),
    additionalContext ? `\nAdmin context: ${additionalContext}` : '',
    ``,
    `Read the tutorials snapshot at ${repoRoot}/.pipeline/${deviceId}/agents/tutorial-review/tutorials.json for full context (use Read with offset/limit; don't load the whole file unless small).`,
    `Read the manifest at ${repoRoot}/src/data/manifests/${deviceId}.json for control labels + IDs.`,
    `Read manual PDFs at ${repoRoot}/.pipeline/${deviceId}/input/manuals/ if you need to verify a control or procedure (use the Read tool's pages: parameter; pick a small range based on the step's topic).`,
    ``,
    `Follow the decision algorithm in your agent prompt for the ${findingType} branch.`,
    `Walk forward through later steps mentally — if your patch would break a later step's invariant, return cannotFix.`,
    ``,
    `Write the JSON result to ${repoRoot}/.pipeline/${deviceId}/agents/tutorial-fixer/last-output.json AND emit it to stdout.`,
    ``,
    `Required output shape:`,
    `{`,
    `  "mode": "fix-step",`,
    `  "deviceId": "${deviceId}",`,
    `  "ok": true,`,
    `  "result": {`,
    `    "tutorialId": "${tutorialId}",`,
    `    "stepIndex": ${stepIndex},`,
    `    "findingType": "${findingType}",`,
    `    "patch": [{ "op": "replace"|"add"|"remove", "path": "/highlightControls/0"|"/instruction"|..., "value": ..., "previousValue": ... }],`,
    `    "explanation": "...",`,
    `    "confidence": "high"|"medium"|"low",`,
    `    "citation": "manual page N",`,
    `    "alternatives": [{ "value": ..., "rejected": "..." }]`,
    `  }`,
    `}`,
    ``,
    `Or if you cannot safely fix:`,
    `{`,
    `  "mode": "fix-step",`,
    `  "deviceId": "${deviceId}",`,
    `  "ok": false,`,
    `  "cannotFix": true,`,
    `  "question": "specific question for admin"`,
    `}`,
    ``,
    `End with a single stdout line:`,
    `[tutorial-fixer] mode=fix-step deviceId=${deviceId} tutorial=${tutorialId} step=${stepIndex} type=${findingType} confidence=<X>`,
  ].join('\n');
}

export async function runFixStep(input: FixStepInput): Promise<AgentRunResult<FixStepResult>> {
  const start = Date.now();
  const target = `${input.deviceId}:${input.tutorialId}:step${input.stepIndex}:${input.findingType}`;
  const outDir = path.join(
    input.repoRoot, '.pipeline', input.deviceId, 'agents', 'tutorial-fixer',
  );
  fs.mkdirSync(outDir, { recursive: true });

  let proc: { exitCode: number; stdout: string; stderr: string } | null = null;
  try {
    const result = await invokeAgent({
      prompt: makeFixStepPrompt(input),
      deviceId: input.deviceId,
      phase: 'tutorial-review',
      agent: 'tutorial-fixer',
      cwd: input.repoRoot,
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: FIXER_BUDGET_USD,
      remainingBudgetUsd: FIXER_BUDGET_USD,
    });
    proc = { exitCode: result.exitCode, stdout: result.output, stderr: '' };
  } catch (err) {
    const wallMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'fix-step', deviceId: input.deviceId,
      target, outcome: 'error', wallMs, details: { error: msg },
    });
    return { ok: false, error: `Failed to invoke agent: ${msg}`, wallMs };
  }

  const wallMs = Date.now() - start;
  // Same resilience as diagnose-orphan: read output file first; only error
  // when no parseable usable output exists (the agent CLI can exit 1 even
  // after a successful run).
  const parsed = readAgentOutput(input.repoRoot, input.deviceId, proc.stdout);
  if (proc.exitCode !== 0 && (!parsed || typeof parsed !== 'object' || ((parsed as { ok?: unknown }).ok !== true && (parsed as { cannotFix?: unknown }).cannotFix !== true))) {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'fix-step', deviceId: input.deviceId,
      target, outcome: 'error', wallMs,
      details: { exitCode: proc.exitCode, stderr: proc.stderr.slice(-500) },
    });
    return {
      ok: false,
      error: `tutorial-fixer exited with code ${proc.exitCode} and produced no usable output: ${proc.stderr.slice(-400)}`,
      wallMs,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'fix-step', deviceId: input.deviceId,
      target, outcome: 'error', wallMs, details: { reason: 'no parseable output' },
    });
    return { ok: false, error: 'Agent produced no parseable JSON output', wallMs };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.cannotFix === true) {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'fix-step', deviceId: input.deviceId,
      target, outcome: 'cannotFix', wallMs,
      details: { question: obj.question },
    });
    return {
      ok: false, cannotFix: true,
      question: typeof obj.question === 'string' ? obj.question : 'Agent could not fix',
      error: typeof obj.question === 'string' ? obj.question : 'Agent could not fix',
      wallMs,
    };
  }

  if (obj.ok !== true || !obj.result) {
    return {
      ok: false,
      error: `Agent output malformed: ${JSON.stringify(obj).slice(0, 300)}`,
      wallMs,
    };
  }

  const r = obj.result as FixStepResult;
  if (!Array.isArray(r.patch) || r.patch.length === 0) {
    return {
      ok: false,
      error: `Agent output missing or empty patch: ${JSON.stringify(r).slice(0, 200)}`,
      wallMs,
    };
  }
  if (!r.confidence || !['high', 'medium', 'low'].includes(r.confidence)) {
    return {
      ok: false,
      error: `Agent output missing valid confidence: ${JSON.stringify(r).slice(0, 200)}`,
      wallMs,
    };
  }

  appendFixLog(input.repoRoot, input.deviceId, {
    ts: new Date().toISOString(), mode: 'fix-step', deviceId: input.deviceId,
    target, outcome: 'proposed', confidence: r.confidence, wallMs,
    details: { findingType: r.findingType, patchLen: r.patch.length },
  });

  return { ok: true, result: r, wallMs };
}

// ── Apply a fix-step patch to tutorials.json (Phase 2) ────────────────

export interface ApplyFixStepInput {
  deviceId: string;
  repoRoot: string;
  result: FixStepResult;
}

export interface ApplyResult {
  ok: true;
  appliedAt: string;
  backupPath: string;
}

export interface ApplyError {
  ok: false;
  error: string;
  rolledBack?: boolean;
}

export async function applyFixStepPatch(
  input: ApplyFixStepInput,
): Promise<ApplyResult | ApplyError> {
  const reviewDir = path.join(
    input.repoRoot, '.pipeline', input.deviceId, 'agents', 'tutorial-review',
  );
  const tutorialsPath = path.join(reviewDir, 'tutorials.json');
  if (!fs.existsSync(tutorialsPath)) {
    return { ok: false, error: 'tutorials.json missing' };
  }

  const tutorials = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8')) as Array<{
    id: string; steps: Array<Record<string, unknown>>;
  }>;
  const tut = tutorials.find((t) => t.id === input.result.tutorialId);
  if (!tut) {
    return { ok: false, error: `tutorial ${input.result.tutorialId} not found` };
  }
  const step = tut.steps[input.result.stepIndex];
  if (!step) {
    return { ok: false, error: `step ${input.result.stepIndex} not found in tutorial ${input.result.tutorialId}` };
  }

  // Backup BEFORE write
  const backupDir = path.join(reviewDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `tutorials-${iso}.json`);
  fs.copyFileSync(tutorialsPath, backupPath);

  // Apply patch operations one by one
  try {
    for (const op of input.result.patch) {
      applyPatchOp(step, op);
    }
  } catch (err) {
    // Rollback
    fs.copyFileSync(backupPath, tutorialsPath);
    return {
      ok: false, rolledBack: true,
      error: `patch apply failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  fs.writeFileSync(tutorialsPath, JSON.stringify(tutorials, null, 2));
  appendFixLog(input.repoRoot, input.deviceId, {
    ts: new Date().toISOString(), mode: 'fix-step', deviceId: input.deviceId,
    target: `${input.deviceId}:${input.result.tutorialId}:step${input.result.stepIndex}:${input.result.findingType}`,
    outcome: 'applied', confidence: input.result.confidence, wallMs: 0,
    details: { patchLen: input.result.patch.length, backupPath },
  });

  return { ok: true, appliedAt: new Date().toISOString(), backupPath };
}

/**
 * PR-L: allow-list of top-level path prefixes the agent may patch.
 * Anything outside this list throws (defensive — prevents agent from
 * touching internal fields like `id`, `__proto__`, etc.).
 */
const ALLOWED_PATCH_PREFIXES = [
  'instruction', 'title', 'details', 'tipText',
  'highlightControls', 'panelStateChanges', 'displayState', 'menuItems',
];

const FORBIDDEN_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Apply a single JSON-Patch-like op to a step object.
 *
 * PR-I supported: /instruction, /title, /details, /tipText, /highlightControls/<idx>.
 * PR-L extends to: /panelStateChanges/<controlId>[/<key>],
 *                  /displayState[/<key>],
 *                  /menuItems[/<idx>].
 *
 * Uses a small JSON-Pointer (RFC 6901 subset) walker. Throws on
 * unsupported paths so the caller's catch block rolls back.
 */
export function applyPatchOp(step: Record<string, unknown>, op: FixStepPatchOp): void {
  const parts = op.path.replace(/^\//, '').split('/');
  if (parts.length === 0 || parts[0] === '') throw new Error(`empty path: ${op.path}`);

  // Prototype-pollution defense: reject any segment that could mutate Object.prototype.
  for (const seg of parts) {
    if (FORBIDDEN_PATH_SEGMENTS.has(seg)) {
      throw new Error(`forbidden path segment "${seg}" in ${op.path}`);
    }
  }

  // Top-level allowlist enforcement.
  if (!ALLOWED_PATCH_PREFIXES.includes(parts[0])) {
    throw new Error(`unsupported path: ${op.path} (allowed: ${ALLOWED_PATCH_PREFIXES.join(', ')})`);
  }

  // ── Single-level scalar paths (instruction/title/details/tipText) ────
  if (parts.length === 1) {
    const key = parts[0];
    if (op.op === 'replace' || op.op === 'add') {
      step[key] = op.value;
    } else if (op.op === 'remove') {
      delete step[key];
    } else {
      throw new Error(`unsupported op: ${op.op}`);
    }
    return;
  }

  // ── highlightControls/<index> (PR-I, unchanged) ──────────────────────
  if (parts[0] === 'highlightControls') {
    if (parts.length !== 2) throw new Error(`unsupported path depth: ${op.path}`);
    const arr = step.highlightControls as string[];
    if (!Array.isArray(arr)) throw new Error('highlightControls is not an array');
    const idxStr = parts[1];
    if (idxStr === '-') {
      if (op.op !== 'add') throw new Error('append (-) only valid with op=add');
      arr.push(op.value as string);
      return;
    }
    const idx = Number(idxStr);
    if (!Number.isInteger(idx) || idx < 0 || idx > arr.length) {
      throw new Error(`invalid highlightControls index: ${idxStr}`);
    }
    if (op.op === 'replace') {
      if (idx >= arr.length) throw new Error(`replace at index ${idx} out of bounds (length ${arr.length})`);
      arr[idx] = op.value as string;
    } else if (op.op === 'add') {
      arr.splice(idx, 0, op.value as string);
    } else if (op.op === 'remove') {
      if (idx >= arr.length) throw new Error(`remove at index ${idx} out of bounds`);
      arr.splice(idx, 1);
    }
    return;
  }

  // ── /panelStateChanges/<controlId>[/<key>] (PR-L) ────────────────────
  if (parts[0] === 'panelStateChanges') {
    if (!step.panelStateChanges) step.panelStateChanges = {};
    const psc = step.panelStateChanges as Record<string, Record<string, unknown>>;
    if (parts.length === 2) {
      // /panelStateChanges/<controlId> — set/replace/remove whole change
      const ctrl = parts[1];
      if (op.op === 'replace' || op.op === 'add') psc[ctrl] = op.value as Record<string, unknown>;
      else if (op.op === 'remove') delete psc[ctrl];
      else throw new Error(`unsupported op: ${op.op}`);
      return;
    }
    if (parts.length === 3) {
      // /panelStateChanges/<controlId>/<key> — set/replace/remove single field
      const ctrl = parts[1];
      const key = parts[2];
      if (!['ledOn', 'active', 'value'].includes(key)) {
        throw new Error(`unsupported panelStateChanges key: ${key} (allowed: ledOn, active, value)`);
      }
      if (!psc[ctrl]) psc[ctrl] = {};
      if (op.op === 'replace' || op.op === 'add') psc[ctrl][key] = op.value;
      else if (op.op === 'remove') delete psc[ctrl][key];
      else throw new Error(`unsupported op: ${op.op}`);
      return;
    }
    throw new Error(`unsupported path depth: ${op.path}`);
  }

  // ── /displayState[/<key>] (PR-L) ─────────────────────────────────────
  if (parts[0] === 'displayState') {
    if (!step.displayState) step.displayState = {};
    const ds = step.displayState as Record<string, unknown>;
    if (parts.length === 1) {
      // Handled above; included here for clarity.
      throw new Error('unreachable');
    }
    if (parts.length === 2) {
      const key = parts[1];
      // Allowlist screenType + common metadata fields. Reject obviously
      // dangerous keys; everything else passes through (display schema
      // is freeform per device).
      if (FORBIDDEN_PATH_SEGMENTS.has(key)) {
        throw new Error(`forbidden displayState key: ${key}`);
      }
      if (op.op === 'replace' || op.op === 'add') ds[key] = op.value;
      else if (op.op === 'remove') delete ds[key];
      else throw new Error(`unsupported op: ${op.op}`);
      return;
    }
    throw new Error(`unsupported displayState path depth: ${op.path}`);
  }

  // ── /menuItems[/<idx>] (PR-L) ────────────────────────────────────────
  if (parts[0] === 'menuItems') {
    if (!step.menuItems) step.menuItems = [];
    const arr = step.menuItems as Array<unknown>;
    if (!Array.isArray(arr)) throw new Error('menuItems is not an array');
    if (parts.length === 1) {
      // /menuItems — replace entire array
      if (op.op === 'replace' || op.op === 'add') {
        if (!Array.isArray(op.value)) throw new Error('menuItems value must be an array');
        step.menuItems = op.value;
      } else if (op.op === 'remove') {
        delete step.menuItems;
      } else throw new Error(`unsupported op: ${op.op}`);
      return;
    }
    if (parts.length === 2) {
      const idxStr = parts[1];
      if (idxStr === '-') {
        if (op.op !== 'add') throw new Error('append (-) only valid with op=add');
        arr.push(op.value);
        return;
      }
      const idx = Number(idxStr);
      if (!Number.isInteger(idx) || idx < 0 || idx > arr.length) {
        throw new Error(`invalid menuItems index: ${idxStr}`);
      }
      if (op.op === 'replace') {
        if (idx >= arr.length) throw new Error(`replace at index ${idx} out of bounds (length ${arr.length})`);
        arr[idx] = op.value;
      } else if (op.op === 'add') {
        arr.splice(idx, 0, op.value);
      } else if (op.op === 'remove') {
        if (idx >= arr.length) throw new Error(`remove at index ${idx} out of bounds`);
        arr.splice(idx, 1);
      }
      return;
    }
    throw new Error(`unsupported menuItems path depth: ${op.path}`);
  }

  throw new Error(`unsupported path: ${op.path}`);
}

// ── assess-coherence (PR-K — IMPLEMENTED) ─────────────────────────────

export interface CoherenceFinding {
  severity: 'fail' | 'warn' | 'info';
  stepIndex: number;
  message: string;
  suggestedFix?: FixStepPatchOp[];
}

export interface AssessCoherenceResult {
  tutorialId: string;
  coherenceScore: 1 | 2 | 3 | 4 | 5;
  verdict: 'pass' | 'advisory' | 'fail';
  citations: string[];
  findings: CoherenceFinding[];
  summary: string;
  /** Optional agent confidence in its own assessment. */
  confidence?: Confidence;
}

export interface AssessCoherenceInput {
  deviceId: string;
  repoRoot: string;
  tutorialId: string;
  additionalContext?: string;
}

function makeAssessCoherencePrompt(input: AssessCoherenceInput): string {
  const { deviceId, repoRoot, tutorialId, additionalContext } = input;
  return [
    `You are the tutorial-fixer in mode=assess-coherence.`,
    ``,
    `Device: ${deviceId}`,
    `Repo root: ${repoRoot}`,
    `Tutorial: ${tutorialId}`,
    additionalContext ? `\nAdmin context: ${additionalContext}` : '',
    ``,
    `1. Read the tutorial from ${repoRoot}/.pipeline/${deviceId}/agents/tutorial-review/tutorials.json — find the entry with id="${tutorialId}" and read ALL of its steps in order.`,
    `2. Read the manifest at ${repoRoot}/src/data/manifests/${deviceId}.json for control labels.`,
    `3. Read manual PDFs at ${repoRoot}/.pipeline/${deviceId}/input/manuals/ — find the section that covers this tutorial's workflow (use Read's pages: parameter).`,
    `4. Judge the tutorial as a whole against the manual:`,
    `   - Workflow correctness (order of steps)`,
    `   - Conceptual fidelity (does each instruction accurately reflect the manual?)`,
    `   - Coverage (does it cover the full workflow or stop short?)`,
    ``,
    `Write the JSON result to ${repoRoot}/.pipeline/${deviceId}/agents/tutorial-fixer/last-output.json AND emit it to stdout.`,
    ``,
    `Required output shape:`,
    `{`,
    `  "mode": "assess-coherence",`,
    `  "deviceId": "${deviceId}",`,
    `  "ok": true,`,
    `  "result": {`,
    `    "tutorialId": "${tutorialId}",`,
    `    "coherenceScore": 1-5,`,
    `    "verdict": "pass"|"advisory"|"fail",`,
    `    "citations": ["p.12", "p.15-17"],`,
    `    "findings": [{ "severity": "fail"|"warn"|"info", "stepIndex": N, "message": "...", "suggestedFix": [{...patch op...}] }],`,
    `    "summary": "...",`,
    `    "confidence": "high"|"medium"|"low"`,
    `  }`,
    `}`,
    ``,
    `Or if you cannot assess (e.g., manual unavailable):`,
    `{`,
    `  "mode": "assess-coherence",`,
    `  "deviceId": "${deviceId}",`,
    `  "ok": false,`,
    `  "cannotFix": true,`,
    `  "question": "specific question for admin"`,
    `}`,
    ``,
    `End with a single stdout line:`,
    `[tutorial-fixer] mode=assess-coherence deviceId=${deviceId} tutorial=${tutorialId} score=<N>/5 verdict=<V>`,
  ].join('\n');
}

export async function runAssessCoherence(
  input: AssessCoherenceInput,
): Promise<AgentRunResult<AssessCoherenceResult>> {
  const start = Date.now();
  const target = `${input.deviceId}:${input.tutorialId}:coherence`;
  const outDir = path.join(
    input.repoRoot, '.pipeline', input.deviceId, 'agents', 'tutorial-fixer',
  );
  fs.mkdirSync(outDir, { recursive: true });

  let proc: { exitCode: number; stdout: string; stderr: string } | null = null;
  try {
    const result = await invokeAgent({
      prompt: makeAssessCoherencePrompt(input),
      deviceId: input.deviceId,
      phase: 'tutorial-review',
      agent: 'tutorial-fixer',
      cwd: input.repoRoot,
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: FIXER_BUDGET_USD,
      remainingBudgetUsd: FIXER_BUDGET_USD,
    });
    proc = { exitCode: result.exitCode, stdout: result.output, stderr: '' };
  } catch (err) {
    const wallMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'assess-coherence', deviceId: input.deviceId,
      target, outcome: 'error', wallMs, details: { error: msg },
    });
    return { ok: false, error: `Failed to invoke agent: ${msg}`, wallMs };
  }

  const wallMs = Date.now() - start;
  const parsed = readAgentOutput(input.repoRoot, input.deviceId, proc.stdout);
  if (proc.exitCode !== 0 && (!parsed || typeof parsed !== 'object' || ((parsed as { ok?: unknown }).ok !== true && (parsed as { cannotFix?: unknown }).cannotFix !== true))) {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'assess-coherence', deviceId: input.deviceId,
      target, outcome: 'error', wallMs,
      details: { exitCode: proc.exitCode, stderr: proc.stderr.slice(-500) },
    });
    return {
      ok: false,
      error: `tutorial-fixer exited with code ${proc.exitCode} and produced no usable output: ${proc.stderr.slice(-400)}`,
      wallMs,
    };
  }
  if (!parsed || typeof parsed !== 'object') {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'assess-coherence', deviceId: input.deviceId,
      target, outcome: 'error', wallMs, details: { reason: 'no parseable output' },
    });
    return { ok: false, error: 'Agent produced no parseable JSON output', wallMs };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.cannotFix === true) {
    appendFixLog(input.repoRoot, input.deviceId, {
      ts: new Date().toISOString(), mode: 'assess-coherence', deviceId: input.deviceId,
      target, outcome: 'cannotFix', wallMs, details: { question: obj.question },
    });
    return {
      ok: false, cannotFix: true,
      question: typeof obj.question === 'string' ? obj.question : 'Agent could not assess',
      error: typeof obj.question === 'string' ? obj.question : 'Agent could not assess',
      wallMs,
    };
  }
  if (obj.ok !== true || !obj.result) {
    return {
      ok: false,
      error: `Agent output malformed: ${JSON.stringify(obj).slice(0, 300)}`,
      wallMs,
    };
  }
  const r = obj.result as AssessCoherenceResult;
  if (!Number.isInteger(r.coherenceScore) || r.coherenceScore < 1 || r.coherenceScore > 5) {
    return {
      ok: false,
      error: `Agent output missing valid coherenceScore: ${JSON.stringify(r).slice(0, 200)}`,
      wallMs,
    };
  }
  if (!['pass', 'advisory', 'fail'].includes(r.verdict)) {
    return {
      ok: false,
      error: `Agent output missing valid verdict: ${JSON.stringify(r).slice(0, 200)}`,
      wallMs,
    };
  }
  appendFixLog(input.repoRoot, input.deviceId, {
    ts: new Date().toISOString(), mode: 'assess-coherence', deviceId: input.deviceId,
    target, outcome: 'proposed', confidence: r.confidence, wallMs,
    details: { score: r.coherenceScore, verdict: r.verdict, findingCount: r.findings?.length ?? 0 },
  });
  return { ok: true, result: r, wallMs };
}

// ── Tutorial-level patch path (PR-K) ──────────────────────────────────

/**
 * Apply a /steps/<idx> array operation to a whole-tutorial object.
 *
 * Supports:
 *   - { op: 'replace', path: '/steps/<idx>', value: <whole step> } — overwrite
 *   - { op: 'add',     path: '/steps/<idx>', value: <whole step> } — insert
 *   - { op: 'add',     path: '/steps/-',     value: <whole step> } — append
 *   - { op: 'remove',  path: '/steps/<idx>' }                       — delete
 *
 * Single-step scalar paths (e.g. /steps/0/instruction) are NOT handled
 * here — callers should route those to the step-level applyPatchOp via
 * applyTutorialFixPatch's dispatcher.
 */
export function applyTutorialPatchOp(
  tutorial: { steps: Array<Record<string, unknown>> },
  op: FixStepPatchOp,
): void {
  const parts = op.path.replace(/^\//, '').split('/');
  if (parts[0] !== 'steps') throw new Error(`applyTutorialPatchOp called with non-/steps path: ${op.path}`);
  if (parts.length !== 2) throw new Error(`unsupported tutorial-level path depth: ${op.path}`);

  const idxStr = parts[1];
  const arr = tutorial.steps;
  if (!Array.isArray(arr)) throw new Error('tutorial.steps is not an array');

  if (idxStr === '-') {
    if (op.op !== 'add') throw new Error('append (-) only valid with op=add');
    arr.push(op.value as Record<string, unknown>);
    return;
  }
  const idx = Number(idxStr);
  if (!Number.isInteger(idx) || idx < 0 || idx > arr.length) {
    throw new Error(`invalid /steps index: ${idxStr}`);
  }
  if (op.op === 'replace') {
    if (idx >= arr.length) throw new Error(`replace at index ${idx} out of bounds (length ${arr.length})`);
    arr[idx] = op.value as Record<string, unknown>;
  } else if (op.op === 'add') {
    arr.splice(idx, 0, op.value as Record<string, unknown>);
  } else if (op.op === 'remove') {
    if (idx >= arr.length) throw new Error(`remove at index ${idx} out of bounds`);
    arr.splice(idx, 1);
  } else {
    throw new Error(`unsupported op: ${op.op}`);
  }
}

/**
 * Apply a multi-op patch to a tutorial. Dispatches by path prefix:
 *   - /steps/<idx>           → applyTutorialPatchOp (whole-step ops)
 *   - /steps/<idx>/<field>   → applyPatchOp on tutorial.steps[idx]
 *   - everything else        → unsupported (only fix-step uses non-/steps paths)
 *
 * Backup-first / rollback-on-failure semantics. Fix-log append.
 */
export interface ApplyTutorialFixInput {
  deviceId: string;
  repoRoot: string;
  result: {
    tutorialId: string;
    findingType: FindingType;
    patch: FixStepPatchOp[];
    confidence: Confidence;
  };
}

export async function applyTutorialFixPatch(
  input: ApplyTutorialFixInput,
): Promise<ApplyResult | ApplyError> {
  const reviewDir = path.join(
    input.repoRoot, '.pipeline', input.deviceId, 'agents', 'tutorial-review',
  );
  const tutorialsPath = path.join(reviewDir, 'tutorials.json');
  if (!fs.existsSync(tutorialsPath)) {
    return { ok: false, error: 'tutorials.json missing' };
  }

  const tutorials = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8')) as Array<{
    id: string; steps: Array<Record<string, unknown>>;
  }>;
  const tutIdx = tutorials.findIndex((t) => t.id === input.result.tutorialId);
  if (tutIdx < 0) {
    return { ok: false, error: `tutorial ${input.result.tutorialId} not found` };
  }
  const tutorial = tutorials[tutIdx];

  // Backup BEFORE write
  const backupDir = path.join(reviewDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const iso = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `tutorials-${iso}.json`);
  fs.copyFileSync(tutorialsPath, backupPath);

  try {
    for (const op of input.result.patch) {
      const parts = op.path.replace(/^\//, '').split('/');
      if (parts[0] !== 'steps') {
        throw new Error(`applyTutorialFixPatch only supports /steps/... paths; got ${op.path}`);
      }
      if (parts.length === 2) {
        // /steps/<idx> — whole-step op
        applyTutorialPatchOp(tutorial, op);
      } else if (parts.length >= 3) {
        // /steps/<idx>/<field>... — single-step scalar/nested op
        const stepIdx = Number(parts[1]);
        if (!Number.isInteger(stepIdx) || stepIdx < 0 || stepIdx >= tutorial.steps.length) {
          throw new Error(`invalid step index in path: ${op.path}`);
        }
        // Rewrite the op's path to drop the /steps/<idx> prefix so the
        // step-level applyPatchOp sees just the field path.
        const stepLevelOp: FixStepPatchOp = {
          op: op.op,
          path: '/' + parts.slice(2).join('/'),
          value: op.value,
          previousValue: op.previousValue,
        };
        applyPatchOp(tutorial.steps[stepIdx], stepLevelOp);
      } else {
        throw new Error(`unsupported tutorial path depth: ${op.path}`);
      }
    }
  } catch (err) {
    fs.copyFileSync(backupPath, tutorialsPath);
    return {
      ok: false, rolledBack: true,
      error: `tutorial patch apply failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  fs.writeFileSync(tutorialsPath, JSON.stringify(tutorials, null, 2));
  appendFixLog(input.repoRoot, input.deviceId, {
    ts: new Date().toISOString(), mode: 'apply-tutorial-patch', deviceId: input.deviceId,
    target: `${input.deviceId}:${input.result.tutorialId}:${input.result.findingType}`,
    outcome: 'applied', confidence: input.result.confidence, wallMs: 0,
    details: { patchLen: input.result.patch.length, backupPath },
  });

  return { ok: true, appliedAt: new Date().toISOString(), backupPath };
}
