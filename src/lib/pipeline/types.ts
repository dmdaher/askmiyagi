export type PipelinePhase =
  | 'pending'
  | 'phase-preflight'
  | 'phase-0-diagram-parser'
  | 'phase-0-gatekeeper'
  | 'phase-0-layout-engine'
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

export interface TokenUsage {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
}

export interface RateLimitInfo {
  status: 'allowed' | 'rejected';
  resetsAt: number;
  rateLimitType: string;
  overageStatus: string;
  isUsingOverage: boolean;
  capturedAt: string;
}

export interface SubscriptionUsage {
  windowResetsAt: number;
  isUsingOverage: boolean;
  overageStatus: string;
  rateLimitEvents: RateLimitInfo[];
  lastUpdated: string;
}

export interface BurnRate {
  costPerMinute: number;
  costPerAgent: number;
  projectedBudgetExhaustedAt: string | null;
  dataPoints: { timestamp: string; cumulativeCost: number }[];
}

export interface SectionStatus {
  id: string;
  siScore: number | null;
  pqScore: number | null;
  criticScore: number | null;
  vaulted: boolean;
  attempts: number;
  costUsd: number;
  tokens: TokenUsage;
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
  tokens: TokenUsage;
}

export type EscalationType =
  | 'panel-pr-review'
  | 'topology-deadlock'
  | 'curriculum-review'
  | 'budget-exceeded'
  | 'agent-failure'
  | 'manual-not-found'
  | 'geometric-mismatch'
  | 'two-strike-halt'
  | 'physical-impossibility';

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

export interface ExtractionProgress {
  totalBuckets: number;
  completedBuckets: number;
  currentSubStep: 'sieve' | 'verify' | 'anchor' | null;
  passesCompleted: number; // 0-4
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
  totalActualCostUsd: number;
  totalTokens: TokenUsage;
  budgetCapUsd: number;
  subscription: SubscriptionUsage | null;
  burnRate: BurnRate | null;
  runnerPid: number | null;
  childPid: number | null;
  worktreePath: string | null;

  extractionProgress: ExtractionProgress | null;

  /** Per-section strike counts for the Two-Strike Rule (gatekeeper retries) */
  strikeTracker: Record<string, number>;

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
  cacheCreationTokens: number;
  cacheReadTokens: number;
  costUsd: number;
  actualCostUsd: number | null;
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
  totalActualCostUsd: number;
  budgetCapUsd: number;
  subscriptionResetsAt: number | null;
  isUsingOverage: boolean;
  createdAt: string;
  updatedAt: string;
  activeEscalation: string | null;
}
