'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Tutorial } from '@/types/tutorial';
import type { TutorialReviewSummary, TutorialIssue } from '@/lib/pipeline/tutorial-validators';
import type { PanelManifest } from '@/components/controls/PanelRenderer';
import PanelRenderer from '@/components/controls/PanelRenderer';
import { useTutorialStore } from '@/store/tutorialStore';
import TutorialListPanel from './TutorialListPanel';
import TutorialDiagnosticsPanel from './TutorialDiagnosticsPanel';

interface ReviewData {
  deviceId: string;
  deviceName: string;
  currentPhase: string;
  status: string;
  escalationId: string | null;
  summary: TutorialReviewSummary;
  tutorials: Tutorial[];
  manifest: PanelManifest | null;
}

interface TutorialReviewCanvasProps {
  data: ReviewData;
}

// Local-storage namespace so the "reviewed" set survives a refresh
const REVIEWED_KEY = (deviceId: string) => `tutorial-review:reviewed:${deviceId}`;

export default function TutorialReviewCanvas({ data }: TutorialReviewCanvasProps) {
  const router = useRouter();
  const { tutorials, summary, manifest, deviceId, deviceName, escalationId } = data;

  // ──────────── State ─────────────────────────────────────────────────────
  const [currentTutorialId, setCurrentTutorialId] = useState<string>(tutorials[0]?.id ?? '');
  const [reviewed, setReviewed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(REVIEWED_KEY(deviceId));
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [diagnosticsCollapsed, setDiagnosticsCollapsed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [actionInFlight, setActionInFlight] = useState<'approve' | 'changes' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Persist reviewed set on change
  useEffect(() => {
    try {
      localStorage.setItem(REVIEWED_KEY(deviceId), JSON.stringify([...reviewed]));
    } catch { /* localStorage unavailable */ }
  }, [reviewed, deviceId]);

  // ──────────── Tutorial loading ──────────────────────────────────────────
  const currentTutorial = useMemo(
    () => tutorials.find(t => t.id === currentTutorialId) ?? tutorials[0],
    [tutorials, currentTutorialId],
  );

  const loadTutorial = useTutorialStore(s => s.loadTutorial);
  const goToStep = useTutorialStore(s => s.goToStep);
  const nextStep = useTutorialStore(s => s.nextStep);
  const prevStep = useTutorialStore(s => s.prevStep);
  const panelState = useTutorialStore(s => s.panelState);
  const displayState = useTutorialStore(s => s.displayState);
  const highlightedControls = useTutorialStore(s => s.highlightedControls);
  const currentStepIndex = useTutorialStore(s => s.currentStepIndex);

  // Load the selected tutorial into the store whenever it changes
  useEffect(() => {
    if (currentTutorial) loadTutorial(currentTutorial);
  }, [currentTutorial, loadTutorial]);

  // ──────────── Keyboard shortcuts ────────────────────────────────────────
  const cycleTutorial = useCallback((direction: 1 | -1) => {
    const idx = tutorials.findIndex(t => t.id === currentTutorialId);
    const nextIdx = (idx + direction + tutorials.length) % tutorials.length;
    setCurrentTutorialId(tutorials[nextIdx].id);
  }, [tutorials, currentTutorialId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'j' || e.key === 'J') { e.preventDefault(); nextStep(); }
      else if (e.key === 'k' || e.key === 'K') { e.preventDefault(); prevStep(); }
      else if (e.key === ']') { e.preventDefault(); cycleTutorial(1); }
      else if (e.key === '[') { e.preventDefault(); cycleTutorial(-1); }
      else if (e.key === 'Escape') router.push(`/admin/${deviceId}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextStep, prevStep, cycleTutorial, router, deviceId]);

  // ──────────── Action handlers ───────────────────────────────────────────
  const submitResolution = useCallback(async (resolution: string) => {
    if (!escalationId) {
      setActionError('No active escalation. Pipeline may have already resumed.');
      return;
    }
    setActionInFlight(resolution.startsWith('changes') ? 'changes' : 'approve');
    setActionError(null);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/escalation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalationId, resolution }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error ?? `HTTP ${res.status}`);
        setActionInFlight(null);
        return;
      }
      // Success — clear reviewed-set local state (this device's review is done)
      try { localStorage.removeItem(REVIEWED_KEY(deviceId)); } catch { /* ignore */ }
      router.push(`/admin/${deviceId}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setActionInFlight(null);
    }
  }, [deviceId, escalationId, router]);

  const handleApprove = useCallback(() => {
    if (summary.totalErrors > 0) {
      submitResolution('override-applied');
    } else {
      submitResolution('approve');
    }
  }, [summary.totalErrors, submitResolution]);

  const handleRequestChanges = useCallback(() => {
    const note = feedbackText.trim();
    submitResolution(note ? `changes-requested:${note}` : 'changes-requested:');
  }, [feedbackText, submitResolution]);

  // ──────────── Issues for the currently-selected tutorial ────────────────
  const issuesForCurrent: TutorialIssue[] = useMemo(
    () => summary.issues.filter(i => i.tutorialId === currentTutorialId),
    [summary.issues, currentTutorialId],
  );

  const toggleReviewed = useCallback((tutorialId: string) => {
    setReviewed(prev => {
      const next = new Set(prev);
      if (next.has(tutorialId)) next.delete(tutorialId);
      else next.add(tutorialId);
      return next;
    });
  }, []);

  // ──────────── Render ────────────────────────────────────────────────────
  if (!currentTutorial) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="text-sm text-gray-500">No tutorials generated for {deviceName}.</div>
      </div>
    );
  }

  const step = currentTutorial.steps[currentStepIndex];
  const totalSteps = currentTutorial.steps.length;

  // Scale the panel so it fits the available width without overflowing
  const previewMaxWidth = 900;
  const panelScale = manifest
    ? Math.min(1, previewMaxWidth / manifest.panelWidth)
    : 1;

  return (
    <div className="flex h-screen flex-col bg-[#0a0a14] text-white" data-testid="tutorial-review-canvas">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#0f0f1a] px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => router.push(`/admin/${deviceId}`)}
            className="text-xs px-2.5 py-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to pipeline (Esc)"
          >
            ← Back
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-white truncate" data-testid="review-device-name">
              {deviceName} · Tutorial Review
            </h1>
            <p className="text-[11px] text-white/50 mt-0.5" data-testid="review-summary-stats">
              {summary.totalTutorials} tutorials · {summary.totalSteps} steps ·{' '}
              <span className={summary.totalErrors > 0 ? 'text-red-400' : 'text-white/50'}>
                {summary.totalErrors} errors
              </span>{' · '}
              <span className={summary.totalWarnings > 0 ? 'text-amber-300' : 'text-white/50'}>
                {summary.totalWarnings} warnings
              </span>{' · '}
              <span className="text-blue-300">{summary.totalInfos} info</span>{' · '}
              <span className="text-emerald-300">{reviewed.size} reviewed</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actionError && (
            <span className="text-[11px] text-red-400 mr-2 max-w-xs truncate" title={actionError}>
              {actionError}
            </span>
          )}
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            disabled={actionInFlight !== null || !escalationId}
            data-testid="request-changes-button"
            className="text-xs px-3 py-1.5 rounded font-medium bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Request Changes
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={actionInFlight !== null || !escalationId}
            data-testid="approve-button"
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              summary.totalErrors > 0
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
            title={summary.totalErrors > 0 ? 'Errors present — clicking will override and continue' : 'Approve and open PR'}
          >
            {actionInFlight === 'approve' ? 'Approving…' : summary.totalErrors > 0 ? 'Override & Approve' : 'Approve & Open PR'}
          </button>
        </div>
      </header>

      {/* ── Main grid ─────────────────────────────────────────────────── */}
      <div
        className="grid flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: diagnosticsCollapsed
            ? '260px 1fr 32px'
            : '260px 1fr 320px',
        }}
      >
        {/* ── Sidebar ────────────────────────────────────────────── */}
        <TutorialListPanel
          tutorials={tutorials}
          summary={summary}
          currentTutorialId={currentTutorialId}
          reviewed={reviewed}
          onSelect={setCurrentTutorialId}
          onToggleReviewed={toggleReviewed}
        />

        {/* ── Preview area ──────────────────────────────────────── */}
        <div className="flex flex-col overflow-hidden bg-[#080812]">
          {/* Panel preview */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-6">
            {manifest ? (
              <div
                style={{
                  width: manifest.panelWidth * panelScale,
                  height: manifest.panelHeight * panelScale,
                  transform: `scale(${panelScale})`,
                  transformOrigin: 'top left',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: manifest.panelWidth,
                  height: manifest.panelHeight,
                  transform: `scale(1)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}>
                  <PanelRenderer
                    manifest={manifest}
                    panelState={panelState}
                    displayState={displayState}
                    highlightedControls={highlightedControls}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/40">No manifest available — cannot render panel preview.</div>
            )}
          </div>

          {/* Step content */}
          <div className="flex-shrink-0 border-t border-white/10 bg-[#0f0f1a] p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
                  Step {currentStepIndex + 1} of {totalSteps}
                </p>
                <h3 className="text-sm font-semibold text-white truncate" data-testid="current-step-title">
                  {step?.title ?? '—'}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="text-[11px] px-2 py-1 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous step (K)"
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={currentStepIndex >= totalSteps - 1}
                  className="text-[11px] px-2 py-1 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next step (J)"
                >
                  Next ›
                </button>
              </div>
            </div>
            <p className="text-[13px] text-white/80 leading-relaxed" data-testid="current-step-instruction">
              {step?.instruction ?? '—'}
            </p>
            {step?.details && (
              <p className="text-[12px] text-white/50 mt-2 leading-relaxed">{step.details}</p>
            )}
          </div>
        </div>

        {/* ── Diagnostics ───────────────────────────────────────── */}
        <TutorialDiagnosticsPanel
          tutorial={currentTutorial}
          issues={issuesForCurrent}
          collapsed={diagnosticsCollapsed}
          onToggleCollapsed={() => setDiagnosticsCollapsed(v => !v)}
          onJumpToStep={goToStep}
        />
      </div>

      {/* ── Feedback modal ─────────────────────────────────────────── */}
      {feedbackOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
          onClick={() => setFeedbackOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-xl border border-gray-700 bg-[#111122] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-200 mb-1">Request Changes</h3>
            <p className="text-xs text-gray-500 mb-4">
              The pipeline will rewind to tutorial-build with this note. The tutorial-builder agent will see it on its next attempt.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder='Example: "Tutorial 3 step 2 highlights the wrong LED. Step 5 panelStateChanges should reset the loop button."'
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500 min-h-[120px]"
              data-testid="feedback-textarea"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="text-xs px-3 py-1.5 rounded text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setFeedbackOpen(false); handleRequestChanges(); }}
                disabled={actionInFlight !== null}
                data-testid="send-feedback-button"
                className="text-xs px-3 py-1.5 rounded font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                Send Feedback
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
