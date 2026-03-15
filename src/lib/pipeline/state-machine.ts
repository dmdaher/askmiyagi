import fs from 'fs';
import path from 'path';
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

export function readState(deviceId: string): PipelineState | null {
  const statePath = getStatePath(deviceId);
  try {
    const raw = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(raw) as PipelineState;
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
  manualPath: string;
  budgetCapUsd: number;
}): PipelineState {
  const now = new Date().toISOString();
  return {
    deviceId: opts.deviceId,
    deviceName: opts.deviceName,
    manufacturer: opts.manufacturer,
    manualPath: opts.manualPath,
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
    totalTokens: { input: 0, output: 0 },
    budgetCapUsd: opts.budgetCapUsd,
    runnerPid: null,
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
  'phase-0-gatekeeper',
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

  const existing = state.phases.find((p) => p.phase === phase);
  if (!existing) {
    state.phases.push({
      phase,
      startedAt: new Date().toISOString(),
      completedAt: null,
      score: null,
      status: 'running',
      costUsd: 0,
      tokens: { input: 0, output: 0 },
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
    return hasManual ? 'phase-0-gatekeeper' : 'phase-preflight';
  }

  const idx = PHASE_ORDER.indexOf(currentPhase);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null;

  const next = PHASE_ORDER[idx + 1];
  if (next === 'phase-preflight' && hasManual) {
    return 'phase-0-gatekeeper';
  }

  return next;
}

export function advancePhase(state: PipelineState): void {
  const hasManual = !!state.manualPath && fs.existsSync(state.manualPath);
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
