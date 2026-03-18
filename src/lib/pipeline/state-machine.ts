import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  PipelineState,
  PipelinePhase,
  PhaseResult,
  Escalation,
  EscalationType,
} from './types';

const PIPELINE_DIR = '.pipeline';

// --- State I/O ---

export function getStatePath(deviceId: string): string {
  return path.join(PIPELINE_DIR, deviceId, 'state.json');
}

export function getLogPath(deviceId: string): string {
  return path.join(PIPELINE_DIR, deviceId, 'runner.log');
}

/**
 * Migrate a PipelineState read from disk, filling in defaults for fields
 * added after the initial schema. This lets old state.json files load
 * without errors.
 */
export function migrateState(state: PipelineState): PipelineState {
  // Top-level fields
  if (state.totalActualCostUsd === undefined) state.totalActualCostUsd = 0;
  if (state.subscription === undefined) state.subscription = null;
  if (state.burnRate === undefined) state.burnRate = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- migration: old state files may lack these fields
  const raw = state as any;
  if (raw.childPid === undefined) state.childPid = null;
  if (raw.extractionProgress === undefined) state.extractionProgress = null;
  if (raw.strikeTracker === undefined) (state as PipelineState).strikeTracker = {};

  // TokenUsage migration: add cacheCreation/cacheRead if missing
  const migrateTokens = (t: { input: number; output: number; cacheCreation?: number; cacheRead?: number }) => {
    if (t.cacheCreation === undefined) t.cacheCreation = 0;
    if (t.cacheRead === undefined) t.cacheRead = 0;
  };

  if (state.totalTokens) migrateTokens(state.totalTokens);
  for (const phase of state.phases) {
    if (phase.tokens) migrateTokens(phase.tokens);
  }
  for (const section of state.sections) {
    if (section.tokens) migrateTokens(section.tokens);
  }

  return state;
}

export function readState(deviceId: string): PipelineState | null {
  const statePath = getStatePath(deviceId);
  try {
    const raw = fs.readFileSync(statePath, 'utf-8');
    const state = JSON.parse(raw) as PipelineState;
    return migrateState(state);
  } catch {
    return null;
  }
}

/**
 * Atomic write: write to .tmp then rename.
 * fs.renameSync is atomic on POSIX — prevents half-written JSON.
 */
export function writeState(deviceId: string, state: PipelineState): void {
  state.updatedAt = new Date().toISOString();
  const statePath = getStatePath(deviceId);
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmp = `${statePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, statePath);
}

export function createInitialState(opts: {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  manualPaths: string[];
  budgetCapUsd: number;
}): PipelineState {
  const now = new Date().toISOString();
  return {
    deviceId: opts.deviceId,
    deviceName: opts.deviceName,
    manufacturer: opts.manufacturer,
    manualPaths: opts.manualPaths,
    currentPhase: 'pending',
    status: 'paused',
    branch: `feature/${opts.deviceId}`,
    createdAt: now,
    updatedAt: now,
    phases: [],
    sections: [],
    tutorialBatches: [],
    escalations: [],
    activeEscalation: null,
    totalCostUsd: 0,
    totalActualCostUsd: 0,
    totalTokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
    budgetCapUsd: opts.budgetCapUsd,
    subscription: null,
    burnRate: null,
    runnerPid: null,
    childPid: null,
    worktreePath: null,
    extractionProgress: null,
    strikeTracker: {},
    lastCheckpoint: {
      phase: 'pending',
      subStep: 'init',
    },
  };
}

// --- Phase Transitions ---

const PHASE_ORDER: PipelinePhase[] = [
  'pending',
  'phase-preflight',
  'phase-0-diagram-parser',
  'phase-0-control-extractor',
  'phase-0-gatekeeper',
  'phase-0-layout-engine',
  'phase-1-section-loop',
  'phase-2-global-assembly',
  'phase-3-harmonic-polish',
  'panel-pr',
  'phase-4-extraction',
  'phase-4-audit',
  'phase-5-tutorial-build',
  'tutorial-pr',
  'completed',
];

export function startPhase(state: PipelineState, phase: PipelinePhase): void {
  state.currentPhase = phase;
  state.lastCheckpoint = { phase, subStep: 'start' };

  // Clear active escalation when entering a new phase — stale escalations
  // from previous phases shouldn't block the UI
  if (state.activeEscalation) {
    const esc = state.escalations.find((e) => e.id === state.activeEscalation);
    if (esc && esc.phase !== phase) {
      esc.resolvedAt = esc.resolvedAt ?? new Date().toISOString();
      esc.resolution = esc.resolution ?? 'auto-resolved: pipeline advanced to next phase';
      state.activeEscalation = null;
    }
  }

  const existing = state.phases.find((p) => p.phase === phase);
  if (!existing) {
    state.phases.push({
      phase,
      startedAt: new Date().toISOString(),
      completedAt: null,
      score: null,
      status: 'running',
      costUsd: 0,
      tokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
    });
  } else {
    existing.status = 'running';
    existing.startedAt = new Date().toISOString();
    existing.completedAt = null;
  }
}

export function completePhase(
  state: PipelineState,
  phase: PipelinePhase,
  score: number | null,
  passed: boolean
): void {
  const phaseResult = state.phases.find((p) => p.phase === phase);
  if (phaseResult) {
    phaseResult.completedAt = new Date().toISOString();
    phaseResult.score = score;
    phaseResult.status = passed ? 'passed' : 'failed';
  }
}

export function getNextPhase(
  currentPhase: PipelinePhase,
  hasManual: boolean
): PipelinePhase | null {
  if (currentPhase === 'pending') {
    return hasManual ? 'phase-0-diagram-parser' : 'phase-preflight';
  }

  const idx = PHASE_ORDER.indexOf(currentPhase);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null;

  const next = PHASE_ORDER[idx + 1];
  if (next === 'phase-preflight' && hasManual) {
    return 'phase-0-diagram-parser';
  }

  return next;
}

/**
 * Advance to the next pipeline phase.
 * @param worktreePath — If provided, resolves manualPaths relative to this directory
 *   for file existence checks. Without it, only checks manualPaths.length > 0.
 */
export function advancePhase(state: PipelineState, worktreePath?: string): void {
  let hasManual = state.manualPaths.length > 0;

  // When a worktree path is available, validate files actually exist on disk
  if (hasManual && worktreePath) {
    hasManual = state.manualPaths.some((p) => {
      const resolved = path.isAbsolute(p) ? p : path.join(worktreePath, p);
      return fs.existsSync(resolved);
    });
  }

  const next = getNextPhase(state.currentPhase, hasManual);

  if (next === 'completed') {
    state.currentPhase = 'completed';
    state.status = 'completed';
    state.lastCheckpoint = { phase: 'completed', subStep: 'done' };
  } else if (next) {
    startPhase(state, next);
  } else {
    state.status = 'failed';
    state.currentPhase = 'failed';
  }
}

// --- Escalations ---

export function createEscalation(
  state: PipelineState,
  type: EscalationType,
  message: string,
  prUrl?: string
): Escalation {
  const escalation: Escalation = {
    id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phase: state.currentPhase,
    type,
    message,
    prUrl,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolution: null,
  };

  state.escalations.push(escalation);
  state.activeEscalation = escalation.id;
  state.status = 'paused';

  return escalation;
}

export function resolveEscalation(
  state: PipelineState,
  escalationId: string,
  resolution: string
): boolean {
  const escalation = state.escalations.find((e) => e.id === escalationId);
  if (!escalation) return false;

  escalation.resolvedAt = new Date().toISOString();
  escalation.resolution = resolution;

  if (state.activeEscalation === escalationId) {
    state.activeEscalation = null;
    state.status = 'running';
  }

  return true;
}

// --- Logging ---

export function appendLog(
  deviceId: string,
  entry: { level: string; agent?: string; message: string }
): void {
  const logPath = getLogPath(deviceId);
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const logLine = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  }) + '\n';

  fs.appendFileSync(logPath, logLine);
}

// --- Pipeline Directory Management ---

export function listPipelineRuns(): string[] {
  try {
    return fs.readdirSync(PIPELINE_DIR).filter((name) => {
      const statePath = path.join(PIPELINE_DIR, name, 'state.json');
      return fs.existsSync(statePath);
    });
  } catch {
    return [];
  }
}

export function ensurePipelineDir(deviceId: string): void {
  const dir = path.join(PIPELINE_DIR, deviceId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// --- Git Worktree Management ---

const WORKTREE_DIR = '.worktrees';

/**
 * Create an isolated git worktree for a pipeline run.
 * The worktree gets its own copy of the repo on the device's feature branch,
 * so the runner and its Claude CLI invocations don't touch the main working directory.
 */
export function createWorktree(deviceId: string, branch: string): string {
  const worktreePath = path.resolve(WORKTREE_DIR, deviceId);

  // Clean up stale worktree if it exists
  try {
    execSync(`git worktree remove --force "${worktreePath}" 2>/dev/null`, { stdio: 'pipe' });
  } catch {
    // Worktree didn't exist — fine
  }

  // Create the branch from test if it doesn't exist
  try {
    execSync(`git branch "${branch}" test 2>/dev/null`, { stdio: 'pipe' });
  } catch {
    // Branch already exists — fine
  }

  // Create the worktree
  fs.mkdirSync(WORKTREE_DIR, { recursive: true });
  execSync(`git worktree add "${worktreePath}" "${branch}"`, { stdio: 'pipe' });

  return worktreePath;
}

/**
 * Remove a worktree after pipeline completes or is cancelled.
 */
export function removeWorktree(deviceId: string): void {
  const worktreePath = path.resolve(WORKTREE_DIR, deviceId);
  try {
    execSync(`git worktree remove --force "${worktreePath}"`, { stdio: 'pipe' });
  } catch {
    // Already removed or never created
  }
}
