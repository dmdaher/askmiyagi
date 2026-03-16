'use client';

import type { PipelineState, LogEntry, Escalation } from '@/lib/pipeline/types';
import PhaseTimeline from './PhaseTimeline';
import EscalationBanner from './EscalationBanner';
import LogStream from './LogStream';
import AgentScoreCard from './AgentScoreCard';
import SectionProgress from './SectionProgress';
import BatchProgress from './BatchProgress';
import CostBreakdown from './CostBreakdown';
import DiagnosticsPanel from './DiagnosticsPanel';

const AGENT_PHASE_MAP: Record<string, string> = {
  'phase-0-gatekeeper': 'gatekeeper',
  'phase-1-section-loop': 'structural-inspector',
  'phase-2-global-assembly': 'panel-questioner',
  'phase-3-harmonic-polish': 'critic',
  'phase-4-extraction': 'manual-extractor',
  'phase-4-audit': 'coverage-auditor',
  'phase-5-tutorial-build': 'tutorial-builder',
  'tutorial-pr': 'tutorial-reviewer',
};

const ALL_AGENTS = [
  'gatekeeper',
  'structural-inspector',
  'panel-questioner',
  'critic',
  'manual-extractor',
  'coverage-auditor',
  'tutorial-builder',
  'tutorial-reviewer',
];

interface PipelineDetailProps {
  pipeline: PipelineState;
  logs: LogEntry[];
  onResolve: (escalationId: string, resolution: string) => void;
}

export default function PipelineDetail({ pipeline, logs, onResolve }: PipelineDetailProps) {
  const activeEscalation: Escalation | undefined = pipeline.activeEscalation
    ? pipeline.escalations.find((e) => e.id === pipeline.activeEscalation) ?? undefined
    : undefined;

  const isPhase1 = pipeline.currentPhase === 'phase-1-section-loop';
  const isPhase5 = pipeline.currentPhase === 'phase-5-tutorial-build';

  // Extract agent scores and statuses from pipeline phases
  const agentData = ALL_AGENTS.map((agent) => {
    const phaseKey = Object.entries(AGENT_PHASE_MAP).find(([, a]) => a === agent)?.[0];
    const phaseResult = phaseKey ? pipeline.phases.find((p) => p.phase === phaseKey) : undefined;

    return {
      agentName: agent,
      score: phaseResult?.score ?? null,
      status: phaseResult?.status === 'running'
        ? 'running' as const
        : phaseResult?.status === 'passed'
          ? 'passed' as const
          : phaseResult?.status === 'failed'
            ? 'failed' as const
            : null,
    };
  });

  // Determine current section for Phase 1
  const currentSection = isPhase1
    ? pipeline.sections.find((s) => !s.vaulted && s.attempts > 0)?.id
      ?? pipeline.sections.find((s) => !s.vaulted)?.id
    : undefined;

  return (
    <div className="space-y-4">
      {/* Phase Timeline — full width */}
      <PhaseTimeline phases={pipeline.phases} currentPhase={pipeline.currentPhase} />

      {/* Escalation Banner */}
      {activeEscalation && (
        <EscalationBanner
          escalation={activeEscalation}
          onResolve={(resolution) => onResolve(activeEscalation.id, resolution)}
        />
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column — LogStream (~60%) */}
        <div className="lg:col-span-3">
          <LogStream logs={logs} />
        </div>

        {/* Right column — Agent scores + context panel (~40%) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Agent score cards grid */}
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--foreground, #e0e0e0)' }}
            >
              Agent Scores
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {agentData.map((a) => (
                <AgentScoreCard
                  key={a.agentName}
                  agentName={a.agentName}
                  score={a.score}
                  status={a.status}
                />
              ))}
            </div>
          </div>

          {/* Diagnostics — always visible */}
          <DiagnosticsPanel deviceId={pipeline.deviceId} />

          {/* Context panel: SectionProgress or BatchProgress */}
          {isPhase1 && pipeline.sections.length > 0 && (
            <SectionProgress sections={pipeline.sections} currentSection={currentSection} />
          )}

          {isPhase5 && pipeline.tutorialBatches.length > 0 && (
            <BatchProgress batches={pipeline.tutorialBatches} />
          )}
        </div>
      </div>

      {/* Cost Breakdown — full width */}
      <CostBreakdown
        phases={pipeline.phases}
        sections={isPhase1 || pipeline.sections.length > 0 ? pipeline.sections : undefined}
        totalActualCostUsd={pipeline.totalActualCostUsd}
        budgetCapUsd={pipeline.budgetCapUsd}
        subscription={pipeline.subscription}
        burnRate={pipeline.burnRate}
      />
    </div>
  );
}
