'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PipelineState, LogEntry, Escalation } from '@/lib/pipeline/types';
import { formatTimeAgo, isRecent } from '@/lib/format-time-ago';
import PhaseTimeline from './PhaseTimeline';
import EscalationBanner from './EscalationBanner';
import LogStream from './LogStream';
import AgentScoreCard from './AgentScoreCard';
import SectionProgress from './SectionProgress';
import BatchProgress from './BatchProgress';
import CostBreakdown from './CostBreakdown';
import DiagnosticsPanel from './DiagnosticsPanel';
import ManifestViewer from './ManifestViewer';
import PanelLayoutEditor from './PanelLayoutEditor';
import IssuesPanel from './IssuesPanel';

const AGENT_PHASE_MAP: Record<string, string> = {
  'phase-0-diagram-parser': 'diagram-parser',
  'phase-0-gatekeeper': 'gatekeeper',
  'phase-0-layout-engine': 'layout-engine',
  'phase-1-section-loop': 'structural-inspector',
  'phase-2-global-assembly': 'panel-questioner',
  'phase-3-harmonic-polish': 'critic',
  'phase-4-extraction': 'manual-extractor',
  'phase-4-audit': 'coverage-auditor',
  'phase-5-tutorial-build': 'tutorial-builder',
  'tutorial-pr': 'tutorial-reviewer',
};

const ALL_AGENTS = [
  'diagram-parser',
  'gatekeeper',
  'structural-inspector',
  'panel-questioner',
  'critic',
  'manual-extractor',
  'coverage-auditor',
  'tutorial-builder',
  'tutorial-reviewer',
];

type DetailTab = 'logs' | 'manifest' | 'layout';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'logs', label: 'Logs' },
  { id: 'manifest', label: 'Manifest' },
  { id: 'layout', label: 'Layout' },
];

interface PipelineDetailProps {
  pipeline: PipelineState;
  logs: LogEntry[];
  onResolve: (escalationId: string, resolution: string) => void;
}

export default function PipelineDetail({ pipeline, logs, onResolve }: PipelineDetailProps) {
  const activeEscalation: Escalation | undefined = pipeline.activeEscalation
    ? (pipeline.escalations ?? []).find((e) => e.id === pipeline.activeEscalation) ?? undefined
    : undefined;

  const isPhase1 = pipeline.currentPhase === 'phase-1-section-loop';
  const isPhase5 = pipeline.currentPhase === 'phase-5-tutorial-build';
  const isTemplateReview = activeEscalation?.type === 'template-review';

  // Default to layout tab when at template review, otherwise logs
  const [activeTab, setActiveTab] = useState<DetailTab>(isTemplateReview ? 'layout' : 'logs');

  // Check if layout engine has passed (manifest/templates available)
  const layoutEnginePassed = (pipeline.phases ?? []).some(
    (p) => p.phase === 'phase-0-layout-engine' && p.status === 'passed'
  );
  const gatekeeperPassed = (pipeline.phases ?? []).some(
    (p) => p.phase === 'phase-0-gatekeeper' && p.status === 'passed'
  );

  // Extract agent scores and statuses from pipeline phases
  const agentData = ALL_AGENTS.map((agent) => {
    const phaseKey = Object.entries(AGENT_PHASE_MAP).find(([, a]) => a === agent)?.[0];
    const phaseResult = phaseKey ? (pipeline.phases ?? []).find((p) => p.phase === phaseKey) : undefined;

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
    ? (pipeline.sections ?? []).find((s) => !s.vaulted && s.attempts > 0)?.id
      ?? (pipeline.sections ?? []).find((s) => !s.vaulted)?.id
    : undefined;

  return (
    <div className="space-y-4">
      {/* Phase Timeline — full width */}
      <PhaseTimeline phases={pipeline.phases} currentPhase={pipeline.currentPhase} />

      {/* Contractor handoff buttons */}
      <ContractorActions deviceId={pipeline.deviceId} pipelineStatus={pipeline.status} />

      {/* Escalation Banner */}
      {activeEscalation && (
        <EscalationBanner
          escalation={activeEscalation}
          onResolve={(resolution) => onResolve(activeEscalation.id, resolution)}
        />
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--card-bg, #141420)' }}>
        {TABS.map((tab) => {
          const isDisabled =
            (tab.id === 'manifest' && !gatekeeperPassed) ||
            (tab.id === 'layout' && !gatekeeperPassed);

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className="flex-1 text-xs font-medium py-1.5 px-3 rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--surface, #1a1a2a)' : 'transparent',
                color: activeTab === tab.id ? 'var(--foreground, #e0e0e0)' : '#6b7280',
                border: activeTab === tab.id ? '1px solid var(--card-border, #2a2a3a)' : '1px solid transparent',
              }}
            >
              {tab.label}
              {tab.id === 'layout' && isTemplateReview && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#3b82f6' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'logs' && (
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

            {/* Issues — always visible */}
            <IssuesPanel deviceId={pipeline.deviceId} />

            {/* Diagnostics — always visible */}
            <DiagnosticsPanel deviceId={pipeline.deviceId} />

            {/* Context panel: SectionProgress or BatchProgress */}
            {isPhase1 && (pipeline.sections ?? []).length > 0 && (
              <SectionProgress sections={pipeline.sections} currentSection={currentSection} />
            )}

            {isPhase5 && (pipeline.tutorialBatches ?? []).length > 0 && (
              <BatchProgress batches={pipeline.tutorialBatches} />
            )}
          </div>
        </div>
      )}

      {activeTab === 'manifest' && (
        <ManifestViewer deviceId={pipeline.deviceId} />
      )}

      {activeTab === 'layout' && (
        <PanelLayoutEditor deviceId={pipeline.deviceId} />
      )}

      {/* Cost Breakdown — full width, always visible */}
      <CostBreakdown
        phases={pipeline.phases}
        sections={isPhase1 || (pipeline.sections ?? []).length > 0 ? pipeline.sections : undefined}
        totalActualCostUsd={pipeline.totalActualCostUsd}
        budgetCapUsd={pipeline.budgetCapUsd}
        subscription={pipeline.subscription}
        burnRate={pipeline.burnRate}
      />
    </div>
  );
}

// ─── Contractor Handoff Buttons ─────────────────────────────────────────────

function ContractorActions({ deviceId, pipelineStatus }: { deviceId: string; pipelineStatus: string }) {
  const [sending, setSending] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendNote, setSendNote] = useState('');
  // A4-P1: contractor's last save time, fetched on demand to surface
  // overwrite warnings on Send-to-Contractor and Pull-from-Hosted.
  const [contractorLastSavedAt, setContractorLastSavedAt] = useState<string | null>(null);

  // Refresh the contractor's last-saved timestamp on mount and whenever the
  // Send modal opens (so a stale value doesn't sneak past the warning).
  useEffect(() => {
    let cancelled = false;
    async function fetchLastSaved() {
      try {
        const res = await fetch(`/api/hosted/panels/${deviceId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setContractorLastSavedAt(data?._updatedAt ?? null);
      } catch {
        /* network failure → no warning shown; fail-safe */
      }
    }
    fetchLastSaved();
    return () => { cancelled = true; };
  }, [deviceId, showSendModal]);

  const handleSendToContractor = useCallback(async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/send-to-hosted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: sendNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      setResult(`✓ ${data.output}`);
      setShowSendModal(false);
      setSendNote('');
    } catch (err) {
      setResult(`✗ ${(err as Error).message}`);
    }
    setSending(false);
  }, [deviceId, sendNote]);

  const handlePullAndBuild = useCallback(async () => {
    // A4-P1: confirm before overwriting local manifest with contractor's
    // hosted version. Show contractor's last save time so admin can decide.
    const lastSavedMsg = contractorLastSavedAt
      ? `Contractor last saved: ${formatTimeAgo(contractorLastSavedAt)} (${new Date(contractorLastSavedAt).toLocaleString()})`
      : 'Contractor save time: unknown';
    const ok = confirm(
      `Pull contractor's manifest and build tutorials?\n\n${lastSavedMsg}\n\nThis will OVERWRITE your local manifest-editor.json. A timestamped backup will be created automatically.`
    );
    if (!ok) return;

    setPulling(true);
    setResult(null);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/pull-from-hosted`, { method: 'POST' });
      const data = await res.json();
      setResult(data.ok ? `✓ ${data.output}` : `✗ ${data.error}`);
    } catch (err) {
      setResult(`✗ ${(err as Error).message}`);
    }
    setPulling(false);
  }, [deviceId, contractorLastSavedAt]);

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-lg p-3"
        style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
      >
        <span className="text-xs text-gray-500 mr-1">Contractor:</span>

        <button
          onClick={() => { setShowSendModal(true); setSendNote(''); }}
          disabled={sending}
          className="rounded border border-blue-600 bg-blue-700/30 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-700/50 transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send to Contractor'}
        </button>

        <button
          onClick={handlePullAndBuild}
          disabled={pulling}
          className="rounded border border-green-600 bg-green-700/30 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-700/50 transition-colors disabled:opacity-50"
        >
          {pulling ? 'Pulling...' : 'Pull & Build Tutorials'}
        </button>

        <button
          onClick={async () => {
            if (!confirm('Reset pipeline back to editor phase? The pipeline will pause at the layout engine stage so you can send to contractor.')) return;
            try {
              const res = await fetch(`/api/pipeline/${deviceId}/recover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset-to-editor' }),
              });
              if (res.ok) {
                setResult('✓ Reset to editor — refresh to see updated state');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                const data = await res.json().catch(() => ({}));
                setResult(`✗ Reset failed: ${data.error ?? res.statusText}`);
              }
            } catch (err) {
              setResult(`✗ Reset failed: ${(err as Error).message}`);
            }
          }}
          className="rounded border border-amber-600 bg-amber-700/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-700/50 transition-colors"
        >
          Reset to Editor
        </button>

        {result && (
          <span className={`text-xs truncate flex-1 ${result.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
            {result}
          </span>
        )}
      </div>

      {/* Send to Contractor modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowSendModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#111122] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-200 mb-1">Send to Contractor</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add a note for the contractor (optional) — describe what's ready, what to focus on, or any context they need.
            </p>
            {/* A4-P1: warn if contractor saved recently — sending will reset
                them to your local manifest (their version is auto-backed-up). */}
            {isRecent(contractorLastSavedAt, 24) && (
              <div className="mb-4 rounded-lg border border-amber-700/60 bg-amber-900/20 px-3 py-2 text-xs text-amber-300">
                ⚠ Contractor last saved <strong>{formatTimeAgo(contractorLastSavedAt)}</strong>
                <span className="text-amber-400/70"> ({new Date(contractorLastSavedAt!).toLocaleString()})</span>.
                Sending will back up their version on the server but reset them to your local manifest. Continue only if intended.
              </div>
            )}
            <textarea
              value={sendNote}
              onChange={(e) => setSendNote(e.target.value)}
              placeholder={"Example:\n- Controls are positioned from the pipeline\n- Focus on aligning the zone buttons row\n- Keyboard width might need adjusting\n- Common section labels need cleanup"}
              rows={6}
              autoFocus
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 placeholder:text-gray-600 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowSendModal(false)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToContractor}
                disabled={sending}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send to Contractor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
