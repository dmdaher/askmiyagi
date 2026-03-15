export type PipelinePhase =
  | 'pending'
  | 'phase-preflight'
  | 'phase-0-gatekeeper'
  | 'phase-1-section-loop'
  | 'phase-2-global-assembly'
  | 'phase-3-harmonic-polish'
  | 'panel-pr'
  | 'phase-4-extraction'
  | 'phase-4-audit'
  | 'phase-5-tutorial-build'
  | 'tutorial-pr'
  | 'completed'
  | 'failed';

export type RunStatus = 'running' | 'paused' | 'completed' | 'failed';

export interface SectionStatus {
  id: string;
  siScore: number | null;
  pqScore: number | null;
  criticScore: number | null;
  vaulted: boolean;
  attempts: number;
  costUsd: number;
  tokens: { input: number; output: number };
}

export interface TutorialBatchStatus {
  batchId: string;
  tutorials: string[];
  status: 'pending' | 'building' | 'reviewing' | 'approved' | 'rejected';
  builderScore: number | null;
  reviewerVerdict: string | null;
}

export interface PhaseResult {
  phase: PipelinePhase;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  status: 'running' | 'passed' | 'failed' | 'skipped';
  costUsd: number;
  tokens: { input: number; output: number };
}

export type EscalationType =
  | 'panel-pr-review'
  | 'topology-deadlock'
  | 'curriculum-review'
  | 'budget-exceeded'
  | 'agent-failure'
  | 'manual-not-found';

export interface Escalation {
  id: string;
  phase: PipelinePhase;
  type: EscalationType;
  message: string;
  prUrl?: string;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

export interface PipelineState {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  manualPaths: string[];
  currentPhase: PipelinePhase;
  status: RunStatus;
  branch: string;
  createdAt: string;
  updatedAt: string;

  phases: PhaseResult[];
  sections: SectionStatus[];
  tutorialBatches: TutorialBatchStatus[];

  escalations: Escalation[];
  activeEscalation: string | null;

  totalCostUsd: number;
  totalTokens: { input: number; output: number };
  budgetCapUsd: number;
  runnerPid: number | null;

  lastCheckpoint: {
    phase: PipelinePhase;
    subStep: string;
  };
}

export interface CheckpointData {
  agent: string | null;
  deviceId: string | null;
  phase: number | null;
  status: 'PASS' | 'FAIL' | 'READY' | 'IN_PROGRESS' | 'BLOCKED' | null;
  score: number | null;
  verdict: 'APPROVED' | 'REJECTED' | 'READY' | null;
  sectionId: string | null;
  batchId: string | null;
  timestamp: string | null;
}

export interface CostEntry {
  phase: PipelinePhase;
  agent: string;
  sectionId?: string;
  batchId?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'agent';
  agent?: string;
  message: string;
}

export interface PipelineRunSummary {
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  currentPhase: PipelinePhase;
  status: RunStatus;
  totalCostUsd: number;
  createdAt: string;
  updatedAt: string;
  activeEscalation: string | null;
}
