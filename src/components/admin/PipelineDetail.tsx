'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PipelineState, LogEntry, Escalation } from '@/lib/pipeline/types';
import { formatTimeAgo, isRecent } from '@/lib/format-time-ago';
import PipelineStatusHero from './PipelineStatusHero';
import PhaseTimeline from './PhaseTimeline';
import LogStream from './LogStream';
import AgentScoreCard from './AgentScoreCard';
import BatchProgress from './BatchProgress';
import CostBreakdown from './CostBreakdown';
import DiagnosticsPanel from './DiagnosticsPanel';
import ManifestViewer from './ManifestViewer';
import PanelLayoutEditor from './PanelLayoutEditor';
import IssuesPanel from './IssuesPanel';

// Active pipeline agents (SI/PQ/Critic archived — see phase-order.ts).
const AGENT_PHASE_MAP: Record<string, string> = {
  'phase-0-diagram-parser': 'diagram-parser',
  'phase-0-gatekeeper': 'gatekeeper',
  'phase-0-layout-engine': 'layout-engine',
  'phase-4-extraction': 'manual-extractor',
  'phase-4-audit': 'coverage-auditor',
  'phase-5-tutorial-build': 'tutorial-builder',
  'tutorial-pr': 'tutorial-reviewer',
};

const ALL_AGENTS = [
  'diagram-parser',
  'gatekeeper',
  'manual-extractor',
  'coverage-auditor',
  'tutorial-builder',
  'tutorial-reviewer',
];

type DetailTab = 'logs' | 'manifest' | 'layout';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'logs', label: 'Activity' },
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

  const isPhase5 = pipeline.currentPhase === 'phase-5-tutorial-build';
  const isTemplateReview = activeEscalation?.type === 'template-review';

  // Tab default depends on context
  const [activeTab, setActiveTab] = useState<DetailTab>(isTemplateReview ? 'layout' : 'logs');

  // Collapsible "advanced" sections — closed by default for hands-off mode
  const [showAdvanced, setShowAdvanced] = useState(false);

  const gatekeeperPassed = (pipeline.phases ?? []).some(
    (p) => p.phase === 'phase-0-gatekeeper' && p.status === 'passed'
  );

  // Agent scores — used in advanced panel
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

  // Contractor handoff actions hoisted out so the Hero can trigger them
  const contractorActions = useContractorActions(pipeline.deviceId);

  return (
    <div className="space-y-4">
      {/* HERO — the "what's happening / what to do" banner. Always at top. */}
      <PipelineStatusHero
        pipeline={pipeline}
        activeEscalation={activeEscalation}
        onResolve={onResolve}
        onSendToContractor={contractorActions.openSendModal}
        onPullAndBuild={contractorActions.pullAndBuild}
        onResetToEditor={contractorActions.resetToEditor}
      />

      {/* Phase timeline — visual progress; small and quiet. */}
      <PhaseTimeline phases={pipeline.phases} currentPhase={pipeline.currentPhase} />

      {/* Issues from contractor — only renders if there are any. */}
      <IssuesPanel deviceId={pipeline.deviceId} />

      {/* Activity / Manifest / Layout tabs. Activity is the day-to-day view. */}
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

      {activeTab === 'logs' && (
        <div data-section="logs">
          <LogStream logs={logs} />
          {/* Batch progress only when actually building tutorials */}
          {isPhase5 && (pipeline.tutorialBatches ?? []).length > 0 && (
            <div className="mt-4">
              <BatchProgress batches={pipeline.tutorialBatches} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'manifest' && (
        <ManifestViewer deviceId={pipeline.deviceId} />
      )}

      {activeTab === 'layout' && (
        <PanelLayoutEditor deviceId={pipeline.deviceId} />
      )}

      {/* ADVANCED — collapsed by default. Cost, agent scores, diagnostics. */}
      <div
        className="rounded-lg"
        style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
      >
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium uppercase tracking-wide transition-colors hover:bg-white/[0.02]"
          style={{ color: '#6b7280' }}
        >
          <span>Advanced — Diagnostics, Agent Scores, Cost</span>
          <span className="text-base leading-none">{showAdvanced ? '−' : '+'}</span>
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid var(--card-border, #2a2a3a)' }}>
            {/* Agent scores */}
            <div className="pt-3">
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: '#9ca3af' }}
              >
                Agent Scores
              </h3>
              <div className="grid grid-cols-3 gap-2">
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

            {/* Diagnostics */}
            <DiagnosticsPanel deviceId={pipeline.deviceId} />

            {/* Cost breakdown (already cleaned of token columns) */}
            <CostBreakdown
              phases={pipeline.phases}
              sections={(pipeline.sections ?? []).length > 0 ? pipeline.sections : undefined}
              totalActualCostUsd={pipeline.totalActualCostUsd}
              budgetCapUsd={pipeline.budgetCapUsd}
              subscription={pipeline.subscription}
              burnRate={pipeline.burnRate}
            />
          </div>
        )}
      </div>

      {/* Contractor send modal (rendered out-of-flow via the hook) */}
      {contractorActions.modal}
    </div>
  );
}

// ─── Contractor Actions Hook ────────────────────────────────────────────────
// Extracted so the Hero can trigger send/pull/reset without re-rendering the
// entire detail page. The modal element is returned to be rendered inline.

function useContractorActions(deviceId: string) {
  const [sending, setSending] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendNote, setSendNote] = useState('');
  const [contractorLastSavedAt, setContractorLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLastSaved() {
      try {
        const res = await fetch(`/api/hosted/panels/${deviceId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setContractorLastSavedAt(data?._updatedAt ?? null);
      } catch {
        /* fail-safe — no warning shown */
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

  const pullAndBuild = useCallback(async () => {
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

  const resetToEditor = useCallback(async () => {
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
  }, [deviceId]);

  const modal = (
    <>
      {/* Result toast (small, ephemeral) */}
      {result && (
        <div
          className="fixed bottom-4 right-4 z-[9998] px-4 py-2 rounded-lg text-xs shadow-lg"
          style={{
            backgroundColor: result.startsWith('✓') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${result.startsWith('✓') ? '#22c55e' : '#ef4444'}`,
            color: result.startsWith('✓') ? '#4ade80' : '#f87171',
            maxWidth: '420px',
          }}
        >
          <button onClick={() => setResult(null)} className="float-right ml-3 opacity-60 hover:opacity-100">×</button>
          {result}
        </div>
      )}

      {/* Send modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setShowSendModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#111122] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-200 mb-1">Send to Contractor</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add a note for the contractor (optional) — describe what's ready, what to focus on, or any context they need.
            </p>
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
              placeholder={"Example:\n- Controls are positioned from the pipeline\n- Focus on aligning the zone buttons row\n- Keyboard width might need adjusting"}
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

  return {
    openSendModal: () => { setShowSendModal(true); setSendNote(''); },
    pullAndBuild,
    resetToEditor,
    sending,
    pulling,
    modal,
  };
}
