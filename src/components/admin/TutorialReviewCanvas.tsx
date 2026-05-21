'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Tutorial } from '@/types/tutorial';
import type { TutorialReviewSummary, TutorialIssue } from '@/lib/pipeline/tutorial-validators';
import type { PanelManifest } from '@/components/controls/PanelRenderer';
import PanelRenderer from '@/components/controls/PanelRenderer';
import { useTutorialStore } from '@/store/tutorialStore';
import TutorialListPanel from './TutorialListPanel';
import TutorialDiagnosticsPanel from './TutorialDiagnosticsPanel';
import ProgressBar from '@/components/tutorial/ProgressBar';
import StepContent from '@/components/tutorial/StepContent';
import NavigationControls from '@/components/tutorial/NavigationControls';
import CanvasScaleControlToolbar, { useCanvasScale } from './CanvasScaleControl';
import CanvasScaleModal from './CanvasScaleModal';
import StepControl, { useStepControlMode } from './StepControl';
import OrphanList from './OrphanList';
import Layer5Panel from './Layer5Panel';
import QaFixModal, { type FixModalRequest, type FindingType } from './QaFixModal';
import { useCanvasAutoRefresh } from './useCanvasAutoRefresh';
import { ToastProvider, useToast } from './ToastSystem';

type OrphanCategory = 'A' | 'B' | 'C' | 'D';

interface OrphanDetail {
  controlId: string;
  label: string | null;
  hint?: string;
  diagnosis?: {
    category: OrphanCategory;
    categoryName: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
    citation: string;
    suggestedAction: 'delete' | 'mark-intentional' | 'suggest-tutorial';
    pairedWith?: string | null;
    suggestedTutorial?: { title: string; description: string; estimatedSteps?: number; manualPages?: string; category?: string } | null;
    diagnosedAt: string;
  };
  intentional?: {
    category: OrphanCategory;
    pairedWith?: string | null;
    reason?: string;
    markedAt: string;
  };
}

interface QaFinding {
  layer: number;
  name: string;
  severity: 'fail' | 'warn' | 'ok';
  message: string;
  details?: unknown;
}
interface QaReport {
  generatedAt: string;
  manifest: { controlCount: number; panelWidth: number; panelHeight: number };
  tutorials: { count: number; stepCount: number };
  results: QaFinding[];
  visualVerified: boolean;
  hasFailures: boolean;
}

interface ReviewData {
  deviceId: string;
  deviceName: string;
  currentPhase: string;
  status: string;
  escalationId: string | null;
  summary: TutorialReviewSummary;
  tutorials: Tutorial[];
  manifest: PanelManifest | null;
  manifestSource?: string | null;
  manifestStaleWarning?: string | null;
  manifestEditorMtime?: number | null;
  reviewerNotes?: Record<string, string>;
  qaReport?: QaReport | null;
}

interface TutorialReviewCanvasProps {
  data: ReviewData;
  /**
   * PR-N1: caller-supplied re-fetch. Replaces `router.refresh()` which
   * was a no-op against the page's `'use client'` useState. Called by
   * the canvas after every successful mutation + by the auto-refresh
   * hook on mtime change. If omitted (legacy callers), falls back to
   * router.refresh() — but new code paths should always supply this.
   */
  onRefreshData?: () => void | Promise<void>;
}

// localStorage namespace so the "reviewed" set survives a refresh
const REVIEWED_KEY = (deviceId: string) => `tutorial-review:reviewed:${deviceId}`;
const DISMISS_STALE_KEY = (deviceId: string, mtime: number | null | undefined) =>
  `canvas:dismiss-stale:${deviceId}:${mtime ?? 'n/a'}`;

/**
 * PR-N2: outer wrapper installs ToastProvider so useToast() works
 * everywhere inside the canvas tree (and any modal portal'd from it).
 */
export default function TutorialReviewCanvas(props: TutorialReviewCanvasProps) {
  return (
    <ToastProvider>
      <TutorialReviewCanvasInner {...props} />
    </ToastProvider>
  );
}

function TutorialReviewCanvasInner({ data, onRefreshData }: TutorialReviewCanvasProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  /**
   * PR-N1: single source of truth for "refresh canvas data". Always
   * prefer onRefreshData (caller-supplied client re-fetch). Fall back
   * to router.refresh() only when the prop is missing — legacy paths.
   */
  const refreshCanvas = useCallback(() => {
    if (onRefreshData) void onRefreshData();
    else router.refresh();
  }, [onRefreshData, router]);
  const searchParams = useSearchParams();
  const compact = searchParams.get('compact') === '1';
  const toggleCompact = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (compact) next.delete('compact');
    else next.set('compact', '1');
    const q = next.toString();
    router.push(`${pathname}${q ? `?${q}` : ''}`);
  }, [compact, searchParams, router, pathname]);
  const {
    tutorials,
    summary,
    manifest,
    deviceId,
    deviceName,
    escalationId,
    manifestStaleWarning,
    manifestEditorMtime,
    reviewerNotes,
    qaReport,
  } = data;

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
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [actionInFlight, setActionInFlight] = useState<'approve' | 'changes' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [staleDismissed, setStaleDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (!manifestStaleWarning) return false;
    try { return sessionStorage.getItem(DISMISS_STALE_KEY(deviceId, manifestEditorMtime)) === '1'; }
    catch { return false; }
  });
  const [reviewerNotesOpen, setReviewerNotesOpen] = useState(false);
  const [expandedNoteBatch, setExpandedNoteBatch] = useState<string | null>(null);
  // QA panel state. Default-open when there are non-ok findings — admin
  // should see them on land. Hard-fail findings keep the panel open even
  // after manual collapse via re-render of derived state.
  const qaHasIssues = useMemo(
    () => !!qaReport?.results.some((r) => r.severity !== 'ok'),
    [qaReport],
  );
  const [qaOpen, setQaOpen] = useState<boolean>(qaHasIssues);
  const [expandedQaFinding, setExpandedQaFinding] = useState<string | null>(null);
  const [transientHighlight, setTransientHighlight] = useState<string | null>(null);
  const [qaRerunInFlight, setQaRerunInFlight] = useState(false);
  const [qaRerunError, setQaRerunError] = useState<string | null>(null);

  // Click an unreferenced-control finding → temporarily glow the control
  // on the panel so the admin can see what's orphaned.
  const flashControlOnPanel = useCallback((controlId: string) => {
    setTransientHighlight(controlId);
    // Scroll the control into view in the preview area.
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-control-id="${controlId}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    setTimeout(() => setTransientHighlight((cur) => (cur === controlId ? null : cur)), 3500);
  }, []);

  const [refreshInFlight, setRefreshInFlight] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [orphanActionInFlight, setOrphanActionInFlight] = useState<string | null>(null);
  const [orphanActionError, setOrphanActionError] = useState<string | null>(null);

  // PR-M: Edit Highlights mode. When ON, clicking a control on the
  // preview panel toggles it in the current step's highlightControls
  // via a no-agent qa-fix-apply call. Default OFF — preserves the
  // existing flashControl behavior for non-edit clicks.
  const EDIT_HIGHLIGHTS_KEY = (id: string) => `canvas:edit-highlights:${id}`;
  const [editHighlightsMode, setEditHighlightsMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(EDIT_HIGHLIGHTS_KEY(deviceId)) === '1'; }
    catch { return false; }
  });
  const toggleEditHighlights = useCallback(() => {
    setEditHighlightsMode((v) => {
      const next = !v;
      try { localStorage.setItem(EDIT_HIGHLIGHTS_KEY(deviceId), next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, [deviceId]);
  const [toggleInFlight, setToggleInFlight] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // PR-I two-phase Fix modal (for Layer 1a / 3a / 3b agent fixes)
  const [fixModalRequest, setFixModalRequest] = useState<FixModalRequest | null>(null);
  const openFixModal = useCallback((request: FixModalRequest) => setFixModalRequest(request), []);
  const closeFixModal = useCallback(() => setFixModalRequest(null), []);
  const onFixApplied = useCallback(() => {
    // Apply-side already re-runs deterministic QA. PR-N1: refreshCanvas
    // re-fetches the page data so admin sees the change immediately
    // (instead of waiting for the 5s auto-refresh poll).
    refreshCanvas();
    toast.success('Fix applied — tutorials.json updated');
  }, [refreshCanvas, toast]);

  const orphanAction = useCallback(async (
    action: 'diagnose' | 'mark-intentional' | 'unmark-intentional' | 'delete',
    controlId: string,
    intent?: { category: 'A' | 'B' | 'C' | 'D'; pairedWith?: string | null; reason?: string },
  ) => {
    setOrphanActionInFlight(`${action}:${controlId}`);
    setOrphanActionError(null);

    // PR-N2: in-progress toast for the slow agent call only
    const progressKey = `orphan:${action}:${controlId}`;
    if (action === 'diagnose') {
      toast.progress(progressKey, `Diagnosing ${controlId}… (≈$0.20, ≈60s)`);
    }

    try {
      // PR-J: delete dispatches to the dedicated manifest-control DELETE
      // route (writes manifest-editor.json + auto-exports). All other
      // orphan actions stay on the orphan-action POST route.
      const res = action === 'delete'
        ? await fetch(
            `/api/pipeline/${deviceId}/manifest-control/${encodeURIComponent(controlId)}`,
            { method: 'DELETE' },
          )
        : await fetch(`/api/pipeline/${deviceId}/orphan-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, controlId, intent }),
          });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = body.error ?? `HTTP ${res.status}`;
        setOrphanActionError(errMsg);
        toast.error(`${action} failed: ${errMsg}`, { key: progressKey });
      } else {
        refreshCanvas();
        // PR-N2: success toasts with appropriate next-step
        if (action === 'diagnose' && body.diagnosis) {
          const d = body.diagnosis as {
            category: string; categoryName: string;
            suggestedAction: 'delete' | 'mark-intentional' | 'suggest-tutorial';
            pairedWith?: string | null; reason?: string;
          };
          const nextLabel = d.suggestedAction === 'delete' ? '🗑 Delete'
            : d.suggestedAction === 'mark-intentional' ? '✓ Mark intentional'
            : '✓ Accept gap';
          toast.success(
            `Diagnosed ${controlId} · Category ${d.category} (${d.categoryName})`,
            {
              key: progressKey,
              duration: 8000,
              action: {
                label: nextLabel,
                testid: `toast-action-diagnose-${controlId}`,
                onClick: () => {
                  if (d.suggestedAction === 'delete') {
                    void orphanActionRef.current?.('delete', controlId);
                  } else {
                    void orphanActionRef.current?.('mark-intentional', controlId, {
                      category: d.category as 'A' | 'B' | 'C' | 'D',
                      pairedWith: d.pairedWith ?? null,
                      reason: d.reason,
                    });
                  }
                },
              },
            },
          );
        } else if (action === 'mark-intentional') {
          toast.success(`Marked ${controlId} intentional`, { key: progressKey });
        } else if (action === 'unmark-intentional') {
          toast.success(`Re-flagged ${controlId} for triage`, { key: progressKey });
        } else if (action === 'delete') {
          toast.success(`Deleted ${controlId} from manifest (backup saved)`, { key: progressKey });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setOrphanActionError(msg);
      toast.error(`${action} error: ${msg}`, { key: progressKey });
    } finally {
      setOrphanActionInFlight(null);
    }
  }, [deviceId, refreshCanvas, toast]);

  // PR-N2: ref so the toast's action callback can dispatch back into
  // orphanAction without circular dependency in useCallback.
  const orphanActionRef = useRef<typeof orphanAction | null>(null);
  useEffect(() => { orphanActionRef.current = orphanAction; }, [orphanAction]);

  const triggerRefreshFromEditor = useCallback(async () => {
    setRefreshInFlight(true);
    setRefreshError(null);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/refresh-from-editor`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body.error ?? `HTTP ${res.status}`;
        setRefreshError(errMsg);
        toast.error(`Refresh from editor failed: ${errMsg}`);
      } else {
        refreshCanvas();
        toast.success('Refreshed canvas from editor');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRefreshError(msg);
      toast.error(`Refresh from editor error: ${msg}`);
    } finally {
      setRefreshInFlight(false);
    }
  }, [deviceId, refreshCanvas, toast]);

  const triggerVisualQa = useCallback(async () => {
    setQaRerunInFlight(true);
    setQaRerunError(null);
    toast.progress('visual-qa', 'Running visual QA (Playwright)…');
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/qa-rerun`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body.error ?? `HTTP ${res.status}`;
        setQaRerunError(errMsg);
        toast.error(`Visual QA failed: ${errMsg}`, { key: 'visual-qa' });
      } else {
        refreshCanvas();
        toast.success('Visual QA complete — qa-report updated', { key: 'visual-qa' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setQaRerunError(msg);
      toast.error(`Visual QA error: ${msg}`, { key: 'visual-qa' });
    } finally {
      setQaRerunInFlight(false);
    }
  }, [deviceId, refreshCanvas, toast]);

  // Persist reviewed set on change
  useEffect(() => {
    try {
      localStorage.setItem(REVIEWED_KEY(deviceId), JSON.stringify([...reviewed]));
    } catch { /* localStorage unavailable */ }
  }, [reviewed, deviceId]);

  // Sync the auto-refresh suppression flag with modal / in-flight state.
  // We don't want polling to refresh the page mid-modal or mid-action.
  useEffect(() => {
    suppressRef.current =
      feedbackOpen ||
      scaleModalOpen ||
      fixModalRequest !== null ||
      actionInFlight !== null ||
      refreshInFlight ||
      qaRerunInFlight;
  }, [feedbackOpen, scaleModalOpen, fixModalRequest, actionInFlight, refreshInFlight, qaRerunInFlight]);



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

  // Load the selected tutorial into the store whenever it changes.
  // loadTutorial() already resets currentStepIndex to 0 (see tutorialStore.ts:82).
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
      // PR-N3: comprehensive input-blocking guard so navigation keys never
      // hijack text editing or modal-open contexts. Use HTMLElement guard
      // because synthetic events can have `e.target` set to Window
      // (which doesn't have `closest` / `isContentEditable`).
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t) {
        if (
          t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'
          || t.isContentEditable
          || t.closest('[role="textbox"]')
        ) return;
      }
      // Modal-open guard runs whether or not target is an HTMLElement
      if (document.querySelector('[data-testid="qa-fix-modal"]')) return;

      // Navigate steps: ←/→ (PR-N3) AND j/k (PR-G-rev, vi-style, kept for habit)
      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowRight') {
        e.preventDefault(); nextStep();
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowLeft') {
        e.preventDefault(); prevStep();
      }
      // Cycle tutorial: [/] AND ↑/↓
      else if (e.key === ']' || e.key === 'ArrowDown') {
        e.preventDefault(); cycleTutorial(1);
      } else if (e.key === '[' || e.key === 'ArrowUp') {
        e.preventDefault(); cycleTutorial(-1);
      }
      else if (e.key === 'Escape') {
        // Compact mode: Esc exits compact first. Second Esc → /admin.
        if (compact) toggleCompact();
        else router.push(`/admin/${deviceId}`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextStep, prevStep, cycleTutorial, router, deviceId, compact, toggleCompact]);

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
      try { localStorage.removeItem(REVIEWED_KEY(deviceId)); } catch { /* ignore */ }
      router.push(`/admin/${deviceId}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setActionInFlight(null);
    }
  }, [deviceId, escalationId, router]);

  const handleApprove = useCallback(() => {
    if (summary.totalErrors > 0) submitResolution('override-applied');
    else submitResolution('approve');
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

  // ──────────── Panel scaling (editor-parity continuous zoom) ─────────────
  // CSS transform-scale on the panel wrapper. Persisted per device.
  // See CanvasScaleControl.tsx for the slider/buttons/keyboard/wheel UX.
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [previewSize, setPreviewSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setPreviewSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // computeAutoFit — first-visit default when no persisted scale yet.
  // Fits panel into the preview area on whichever dimension is more
  // constrained, with a minimum of 50% so the panel stays readable.
  // For tall panels (cdj-3000 at 1469×1842) at 1400-wide viewport with
  // sidebar+diagnostics chrome, the preview area is ~820w × ~408h with
  // the anchored step block, so height is the binding constraint and
  // we'd fit to ~22% — overridden by the 50% floor so the panel remains
  // readable. Admin scrolls vertically to see the rest, OR can switch
  // step control to "floating"/"mini"/"hidden" to reclaim viewport.
  const computeAutoFit = useCallback((): number | null => {
    if (!manifest || previewSize.w === 0 || previewSize.h === 0) return null;
    const PAD = 48;
    const fitW = (previewSize.w - PAD) / manifest.panelWidth;
    const fitH = (previewSize.h - PAD) / manifest.panelHeight;
    const fit = Math.min(fitW, fitH);
    // Clamp: ≥ 50% (readable), ≤ 100% (don't blow up small panels)
    return Math.max(0.5, Math.min(fit, 1));
  }, [manifest, previewSize]);

  const scaleApi = useCanvasScale({ deviceId, computeAutoFit });
  const panelScale = scaleApi.scale;
  const stepControl = useStepControlMode(deviceId);
  // PR-N3: useFloatingSafeArea deleted along with floating step modes.
  // The new StepControl is always in-flow (anchored or compact-strip),
  // so no padding compensation is needed.
  const previewPadBottom = 16;  // small default breathing room
  const previewPadTop = 0;

  // Live auto-refresh poll — picks up upstream changes (editor save,
  // Fix apply, pull-from-hosted) without admin needing to reload.
  // Suppressed while feedback modal is open so admin's review isn't
  // yanked out from under them.
  // The suppress callback must be stable across renders so the polling
  // hook doesn't restart its timer on every state change. We read the
  // current value via a ref instead.
  const suppressRef = useRef<boolean>(false);
  useCanvasAutoRefresh({
    deviceId,
    suppress: useCallback(() => suppressRef.current, []),
    onRefresh: refreshCanvas,
  });
  // The suppress sync effect runs after all the modal/in-flight states
  // are declared further down — see the dedicated effect near the
  // bottom of the component body.

  // Bind Cmd+wheel inside the preview scroll area only (browser zoom
  // works normally everywhere else).
  useEffect(() => {
    return scaleApi.bindWheelTo(previewRef.current);
  }, [scaleApi]);

  // PR-M: handler for click-to-toggle highlight (only fires when
  // editHighlightsMode is ON). Builds a single-op patch and POSTs to
  // qa-fix-apply, reusing PR-I infrastructure + PR-L cumulative-state
  // gate. On 409 violations, surface a toast — admin can re-toggle
  // with override via the existing QaFixModal flow (Layer 1a, etc.)
  // or click again to invert their first attempt.
  const handlePanelControlClick = useCallback(async (controlId: string) => {
    if (!editHighlightsMode) {
      // Default: just flash the control (preserves PR-H/I behavior).
      flashControlOnPanel(controlId);
      return;
    }
    if (!currentTutorial) return;
    const step = currentTutorial.steps[currentStepIndex];
    if (!step) return;
    const currentHighlights = step.highlightControls ?? [];
    const isOn = currentHighlights.includes(controlId);
    setToggleInFlight(controlId);
    setToggleError(null);
    try {
      const patchOp = isOn
        ? {
            op: 'remove' as const,
            path: `/highlightControls/${currentHighlights.indexOf(controlId)}`,
          }
        : { op: 'add' as const, path: '/highlightControls/-', value: controlId };
      const res = await fetch(`/api/pipeline/${deviceId}/qa-fix-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: {
            tutorialId: currentTutorial.id,
            stepIndex: currentStepIndex,
            findingType: 'layer3b',
            patch: [patchOp],
            explanation: `Direct admin toggle (PR-M): ${isOn ? 'removed' : 'added'} ${controlId}`,
            confidence: 'high',
            citation: 'admin click',
            alternatives: [],
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && Array.isArray(body.violations) && body.violations.length > 0) {
        setToggleError(
          `Cumulative-state violation: ${body.violations[0].message}. Click 🛠 Fix on the related finding to override.`,
        );
        return;
      }
      if (!res.ok || !body.ok) {
        setToggleError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      // Brief glow feedback so admin knows the toggle landed
      flashControlOnPanel(controlId);
      refreshCanvas();
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : String(err));
    } finally {
      setToggleInFlight(null);
    }
  }, [
    editHighlightsMode, currentTutorial, currentStepIndex,
    deviceId, flashControlOnPanel, refreshCanvas,
  ]);

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
  const reviewerNoteEntries = Object.entries(reviewerNotes ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const showStaleBanner = manifestStaleWarning && !staleDismissed;

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
          <CanvasScaleControlToolbar api={scaleApi} onOpenModal={() => setScaleModalOpen(true)} />
          <button
            type="button"
            onClick={toggleCompact}
            data-testid="compact-toggle"
            title={compact ? 'Exit compact mode (Esc)' : 'Compact mode — hide admin chrome'}
            aria-pressed={compact}
            className={`text-[11px] px-2 py-1 rounded font-medium border transition-colors cursor-pointer ${
              compact
                ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                : 'border-white/15 text-white/70 hover:bg-white/10'
            }`}
          >
            {compact ? '⤡ Exit compact' : '⛶ Compact'}
          </button>
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

      {/* ── Manifest freshness banner (god-mode signal) ────────────────── */}
      {showStaleBanner && (
        <div
          data-testid="manifest-stale-banner"
          className="flex items-center justify-between gap-3 border-b border-amber-700/40 bg-amber-950/30 px-4 py-2 text-amber-300 text-[12px] flex-shrink-0"
        >
          <span className="min-w-0 truncate">⚠ {manifestStaleWarning}</span>
          <span className="flex items-center gap-3 flex-shrink-0">
            <a
              href={`/admin/${deviceId}/editor`}
              className="underline hover:text-amber-100"
            >
              Open editor
            </a>
            <button
              type="button"
              onClick={() => {
                setStaleDismissed(true);
                try {
                  sessionStorage.setItem(DISMISS_STALE_KEY(deviceId, manifestEditorMtime), '1');
                } catch { /* ignore */ }
              }}
              data-testid="dismiss-stale-banner"
              className="text-amber-400/80 hover:text-amber-100 px-1"
              title="Dismiss for this session"
              aria-label="Dismiss freshness warning"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────── */}
      <div
        className="grid flex-1 min-h-0"
        style={{
          gridTemplateColumns: diagnosticsCollapsed
            ? '260px 1fr 32px'
            : '260px 1fr 320px',
        }}
      >
        {/* ── Sidebar: tutorial list + QA findings + reviewer notes ──
           Single scroll context at the sidebar root. Children flow
           naturally; sticky section headers preserve orientation.
           See ~/.claude/plans/prancy-dreaming-comet.md (PR-Scroll) for
           the architectural rationale. */}
        <div className="flex flex-col overflow-y-auto border-r border-white/10 bg-[#0c0c18]" data-testid="canvas-sidebar">
          {/* PR-M: Edit Highlights mode toggle */}
          <div className="flex-shrink-0 px-2 py-1.5 border-b border-white/10 bg-[#0a0a14]">
            <button
              type="button"
              onClick={toggleEditHighlights}
              className={`w-full flex items-center justify-between text-[10px] px-2 py-1.5 rounded border transition-colors ${
                editHighlightsMode
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/5'
              }`}
              data-testid="edit-highlights-toggle"
              title="When ON, clicking a control on the panel toggles its highlight on the current step. When OFF, clicks flash the control (default)."
            >
              <span className="flex items-center gap-1.5">
                <span>{editHighlightsMode ? '🟢' : '⚪'}</span>
                <span>Edit Highlights mode</span>
              </span>
              <span className="text-[9px] opacity-70">{editHighlightsMode ? 'ON' : 'OFF'}</span>
            </button>
            {toggleInFlight && (
              <div className="text-[9px] text-cyan-300/70 mt-1 px-2" data-testid="edit-highlights-in-flight">
                ⏳ toggling {toggleInFlight}…
              </div>
            )}
            {toggleError && (
              <div className="text-[9px] text-red-300 mt-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/30" data-testid="edit-highlights-error">
                {toggleError}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <TutorialListPanel
              tutorials={tutorials}
              summary={summary}
              currentTutorialId={currentTutorialId}
              reviewed={reviewed}
              onSelect={setCurrentTutorialId}
              onToggleReviewed={toggleReviewed}
            />
          </div>

          {/* QA Findings (auto-generated by pipeline at tutorial-review pause) */}
          {qaReport && (
            <div className="flex-shrink-0 border-t border-white/10" data-testid="qa-findings-section">
              <button
                type="button"
                onClick={() => setQaOpen((v) => !v)}
                className={`w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-semibold transition-colors flex items-center justify-between sticky top-0 z-10 bg-[#0a0a14] ${
                  qaReport.hasFailures
                    ? 'text-red-300 hover:bg-red-500/5'
                    : qaHasIssues
                      ? 'text-amber-300 hover:bg-amber-500/5'
                      : 'text-emerald-300 hover:bg-emerald-500/5'
                }`}
                data-testid="qa-findings-toggle"
              >
                <span>
                  {qaReport.hasFailures ? '🔴' : qaHasIssues ? '🟡' : '🟢'} QA Findings ·{' '}
                  {qaReport.results.filter((r) => r.severity === 'fail').length} fail ·{' '}
                  {qaReport.results.filter((r) => r.severity === 'warn').length} warn
                </span>
                <span className="text-white/40">{qaOpen ? '▾' : '▸'}</span>
              </button>
              {qaOpen && (
                <div className="px-3 pb-3 space-y-2">
                  <p className="text-[10px] text-white/40 leading-snug">
                    Auto-generated at pipeline pause. {qaReport.visualVerified ? 'Includes visual highlight verification.' : 'Deterministic layers only — click "Run Visual QA" below to verify highlights end-to-end.'}
                  </p>
                  {qaReport.results.map((finding, idx) => {
                    const key = `${finding.layer}-${idx}`;
                    const expanded = expandedQaFinding === key;
                    // Layer 1b uses a structured shape { active, intentional };
                    // older layers use arrays.
                    const isLayer1b = finding.layer === 1 && finding.name.startsWith('1b');
                    const layer1bDetails = isLayer1b && finding.details && typeof finding.details === 'object' && !Array.isArray(finding.details)
                      ? (finding.details as { active: OrphanDetail[]; intentional: OrphanDetail[] })
                      : null;
                    const detailsArr = Array.isArray(finding.details) ? finding.details : [];
                    const hasDetails = layer1bDetails ? (layer1bDetails.active.length + layer1bDetails.intentional.length) > 0 : detailsArr.length > 0;
                    const sym = finding.severity === 'fail' ? '🔴'
                      : finding.severity === 'warn' ? '🟡' : '🟢';
                    return (
                      <div
                        key={key}
                        className="rounded border border-white/10 bg-white/[0.02]"
                        data-testid={`qa-finding-${finding.layer}-${idx}`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedQaFinding((c) => c === key ? null : key)}
                          className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-white/85 hover:bg-white/5 flex items-start gap-1.5 transition-colors"
                          disabled={!hasDetails}
                        >
                          <span className="flex-shrink-0">{sym}</span>
                          <span className="flex-1 min-w-0">
                            <div className="font-semibold">{finding.name}</div>
                            <div className="text-[10px] text-white/55 mt-0.5 leading-snug">{finding.message}</div>
                          </span>
                          {hasDetails && (
                            <span className="text-white/40 flex-shrink-0 text-[10px]">{expanded ? '▾' : '▸'}</span>
                          )}
                        </button>
                        {expanded && layer1bDetails && (
                          <OrphanList
                            active={layer1bDetails.active}
                            intentional={layer1bDetails.intentional}
                            flashControl={flashControlOnPanel}
                            onAction={orphanAction}
                            inFlightKey={orphanActionInFlight}
                            error={orphanActionError}
                          />
                        )}
                        {expanded && !layer1bDetails && detailsArr.length > 0 && (
                          <div className="border-t border-white/5 px-2 py-2 space-y-1">
                            {detailsArr.slice(0, 100).map((d, i) => {
                              // Layer 1b: { controlId, label, hint } — click flashes panel
                              if (d && typeof d === 'object' && 'controlId' in (d as object)) {
                                const dd = d as { controlId: string; label?: string | null; hint?: string };
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => flashControlOnPanel(dd.controlId)}
                                    className="block w-full text-left text-[10px] text-white/70 hover:bg-white/5 px-1.5 py-1 rounded transition-colors"
                                    data-testid={`qa-detail-flash-${dd.controlId}`}
                                  >
                                    <code className="text-cyan-300">{dd.controlId}</code>
                                    {dd.label && <span className="text-white/40 ml-1">— {dd.label}</span>}
                                    {dd.hint && <div className="text-amber-400/80 text-[9px] ml-3 italic mt-0.5">{dd.hint}</div>}
                                  </button>
                                );
                              }
                              // Layer 3a/3b: { tutorial, step, control, label } — click jumps to step
                              if (d && typeof d === 'object' && 'tutorial' in (d as object) && 'step' in (d as object)) {
                                const dd = d as { tutorial: string; step: number; control: string; label?: string | null };
                                // findingType inferred from finding.name ("3a." or "3b.")
                                const layer3Type: FindingType = finding.name.startsWith('3a') ? 'layer3a' : 'layer3b';
                                const payloadKey = layer3Type === 'layer3a' ? 'mentionedControlId' : 'highlightedControlId';
                                return (
                                  <div key={i} className="flex items-center gap-1 text-[10px] text-white/70 px-1.5 py-1 rounded hover:bg-white/5 transition-colors">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCurrentTutorialId(dd.tutorial);
                                        setTimeout(() => goToStep(dd.step - 1), 250);
                                      }}
                                      className="flex-1 text-left"
                                      title="Jump to this step"
                                    >
                                      <code className="text-cyan-300">{dd.control}</code>
                                      <span className="text-white/40"> · {dd.tutorial} step {dd.step}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openFixModal({
                                        deviceId,
                                        findingType: layer3Type,
                                        tutorialId: dd.tutorial,
                                        stepIndex: dd.step - 1,
                                        payload: { [payloadKey]: dd.control, controlLabel: dd.label ?? null },
                                        label: `${dd.control} on ${dd.tutorial} step ${dd.step}`,
                                      })}
                                      data-testid={`fix-button-${dd.tutorial}-${dd.step}-${dd.control}`}
                                      title="Ask agent to fix (≈$0.20, ≈60s)"
                                      className="text-[9px] px-1.5 py-0.5 rounded text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30"
                                    >🛠 Fix</button>
                                  </div>
                                );
                              }
                              // Layer 1a: plain string IDs (missing-from-manifest hard fails)
                              if (typeof d === 'string') {
                                // Find which tutorial+step uses this bad ID so the Fix button can target it.
                                const usage = (() => {
                                  for (const t of tutorials) {
                                    for (let si = 0; si < t.steps.length; si++) {
                                      if ((t.steps[si].highlightControls ?? []).includes(d)) {
                                        return { tutorialId: t.id, stepIndex: si };
                                      }
                                    }
                                  }
                                  return null;
                                })();
                                return (
                                  <div key={i} className="flex items-center gap-1 text-[10px] text-red-300 px-1.5 py-1">
                                    <code className="flex-1">{d}</code>
                                    {usage && (
                                      <>
                                        <span className="text-red-300/60 text-[9px]">{usage.tutorialId} step {usage.stepIndex + 1}</span>
                                        <button
                                          type="button"
                                          onClick={() => openFixModal({
                                            deviceId,
                                            findingType: 'layer1a',
                                            tutorialId: usage.tutorialId,
                                            stepIndex: usage.stepIndex,
                                            payload: { badControlId: d },
                                            label: `${d} in ${usage.tutorialId} step ${usage.stepIndex + 1}`,
                                          })}
                                          data-testid={`fix-button-layer1a-${d}`}
                                          title="Ask agent to fix (≈$0.20, ≈60s)"
                                          className="text-[9px] px-1.5 py-0.5 rounded text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30"
                                        >🛠 Fix</button>
                                      </>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })}
                            {detailsArr.length > 100 && (
                              <div className="text-[9px] text-white/30 italic px-1.5">… {detailsArr.length - 100} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Refresh from editor (fast — re-export + re-validate + re-QA) */}
                  <div className="pt-1 space-y-1">
                    <button
                      type="button"
                      onClick={triggerRefreshFromEditor}
                      disabled={refreshInFlight}
                      data-testid="qa-refresh-from-editor-button"
                      title="Re-export from manifest-editor.json, re-validate tutorials, re-run deterministic QA"
                      className="w-full text-[10px] px-2 py-1.5 rounded border border-amber-700/40 bg-amber-900/20 text-amber-300 hover:bg-amber-800/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {refreshInFlight ? 'Refreshing…' : '↻ Refresh from editor'}
                    </button>
                    {refreshError && (
                      <p className="text-[9px] text-red-400 px-1">{refreshError}</p>
                    )}
                    <button
                      type="button"
                      onClick={triggerVisualQa}
                      disabled={qaRerunInFlight}
                      data-testid="qa-rerun-button"
                      title="Walk every tutorial step with Playwright + verify highlight glow"
                      className="w-full text-[10px] px-2 py-1.5 rounded border border-cyan-700/40 bg-cyan-900/20 text-cyan-300 hover:bg-cyan-800/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {qaRerunInFlight ? 'Running visual QA…' : qaReport.visualVerified ? 'Re-run visual QA' : 'Run visual QA (Playwright)'}
                    </button>
                    {qaRerunError && (
                      <p className="text-[9px] text-red-400 px-1">{qaRerunError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PR-K: Layer 5 Conceptual Coherence */}
          <Layer5Panel
            deviceId={deviceId}
            tutorials={tutorials.map((t) => ({ id: t.id, title: t.title }))}
            openFixModal={openFixModal}
          />

          {/* Reviewer prose accordion (god-mode) */}
          {reviewerNoteEntries.length > 0 && (
            <div className="flex-shrink-0 border-t border-white/10" data-testid="reviewer-notes-section">
              <button
                type="button"
                onClick={() => setReviewerNotesOpen(v => !v)}
                className="w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between sticky top-0 z-10 bg-[#0a0a14]"
                data-testid="reviewer-notes-toggle"
              >
                <span>Reviewer Notes · {reviewerNoteEntries.length} batches</span>
                <span className="text-white/40">{reviewerNotesOpen ? '▾' : '▸'}</span>
              </button>
              {reviewerNotesOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {reviewerNoteEntries.map(([batchId, content]) => (
                    <div key={batchId} className="rounded border border-white/10 bg-white/[0.02]" data-testid={`reviewer-note-${batchId}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedNoteBatch(b => b === batchId ? null : batchId)}
                        className="w-full text-left px-2 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/5 flex items-center justify-between transition-colors"
                      >
                        <span>Batch {batchId.toUpperCase()}</span>
                        <span className="text-white/40">{expandedNoteBatch === batchId ? '▾' : '▸'}</span>
                      </button>
                      {expandedNoteBatch === batchId && (
                        <pre className="px-2 py-2 text-[10px] text-white/70 whitespace-pre-wrap font-mono leading-snug border-t border-white/5">
                          {content}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Preview area ──────────────────────────────────────── */}
        <div className="flex flex-col min-h-0 min-w-0 bg-gradient-to-br from-[#0a0a14] to-[#0d1424]">
          {/* Panel viewer */}
          <div
            ref={previewRef}
            data-testid="panel-preview-scroll"
            className="flex-1 overflow-auto p-6 min-h-0"
            style={{ paddingBottom: previewPadBottom, paddingTop: previewPadTop > 0 ? previewPadTop : undefined }}
          >
            {manifest ? (
              <div
                style={{
                  width: manifest.panelWidth * panelScale,
                  height: manifest.panelHeight * panelScale,
                  position: 'relative',
                }}
                data-testid="panel-scaled-wrapper"
              >
                <div
                  style={{
                    width: manifest.panelWidth,
                    height: manifest.panelHeight,
                    transform: `scale(${panelScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  <PanelRenderer
                    manifest={manifest}
                    panelState={panelState}
                    displayState={displayState}
                    highlightedControls={
                      transientHighlight
                        ? [...highlightedControls, transientHighlight]
                        : highlightedControls
                    }
                    onButtonClick={handlePanelControlClick}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/40">No manifest available — cannot render panel preview.</div>
            )}
          </div>

          {/* ── End-user-feel zone: ProgressBar + StepContent + Nav ─
             ── PR-N3: StepControl always in-flow. Two modes (anchored /
             compact-strip). No more floating overlay → no scroll-block,
             no panel glitch, no arrow-key hijack. */}
          <StepControl
            deviceId={deviceId}
            mode={stepControl.mode}
            setMode={stepControl.setMode}
            currentStepIndex={currentStepIndex}
            totalSteps={totalSteps}
            step={step}
            steps={currentTutorial.steps}
            onStepClick={goToStep}
            onPrev={prevStep}
            onNext={nextStep}
          />
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

      {/* ── PR-I Fix modal (two-phase Propose/Apply for Layer 1a/3a/3b) */}
      <QaFixModal
        open={fixModalRequest !== null}
        request={fixModalRequest}
        onClose={closeFixModal}
        onApplied={onFixApplied}
      />

      {/* ── Scale modal ──────────────────────────────────────────── */}
      <CanvasScaleModal
        open={scaleModalOpen}
        currentScale={scaleApi.scale}
        onApply={(s) => scaleApi.setScale(s)}
        onClose={() => setScaleModalOpen(false)}
      />

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
