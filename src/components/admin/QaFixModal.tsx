'use client';

/**
 * QaFixModal — two-phase agent-driven Fix flow for canvas QA findings.
 *
 * Phase 1 (Propose): on open, POST to /qa-fix-propose. Spinner + agent
 * thinking indicator. Agent returns a JSON patch + confidence + manual
 * citation + reasoning + alternatives.
 *
 * Phase 2 (Review): show before/after diff of the affected step. Admin
 * gates: Cancel · Apply · Ask Again (with optional context). Only Apply
 * actually mutates tutorials.json.
 *
 * Per the plan, this eliminates the "agent picks wrong similarly-named
 * control" risk — admin sees exactly what's about to change.
 *
 * sessionStorage cache: keyed by `<deviceId>:<findingKey>`, 10-min TTL.
 * Closing the modal without applying doesn't waste the agent run on
 * re-open within the cache window.
 */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type FindingType = 'layer1a' | 'layer3a' | 'layer3b' | 'layer4' | 'layer5';
export type Confidence = 'high' | 'medium' | 'low';

interface FixStepPatchOp {
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

export interface FixModalRequest {
  deviceId: string;
  findingType: FindingType;
  tutorialId: string;
  stepIndex: number;
  payload: unknown;
  /** Display name for the finding (e.g., "BOGUS_ID in step 5 of basic-playback"). */
  label: string;
}

interface Props {
  open: boolean;
  request: FixModalRequest | null;
  onClose: () => void;
  /** Called after a successful Apply. Caller refreshes canvas. */
  onApplied: () => void;
}

const CACHE_TTL_MS = 10 * 60 * 1000;

interface CachedProposal {
  result: FixStepResult;
  cachedAt: number;
}

function cacheKey(deviceId: string, req: FixModalRequest): string {
  return `qa-fix-cache:${deviceId}:${req.tutorialId}:${req.stepIndex}:${req.findingType}`;
}

function readCached(deviceId: string, req: FixModalRequest): CachedProposal | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(deviceId, req));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedProposal;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeCached(deviceId: string, req: FixModalRequest, result: FixStepResult): void {
  try {
    sessionStorage.setItem(cacheKey(deviceId, req), JSON.stringify({ result, cachedAt: Date.now() }));
  } catch { /* ignore */ }
}

function clearCached(deviceId: string, req: FixModalRequest): void {
  try { sessionStorage.removeItem(cacheKey(deviceId, req)); } catch { /* ignore */ }
}

function ConfidenceBadge({ c }: { c: Confidence }) {
  const palette = c === 'high' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : c === 'medium' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-red-500/15 text-red-300 border-red-500/30';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${palette}`} data-testid={`fix-confidence-${c}`}>
      {c} confidence
    </span>
  );
}

function PatchDiff({ ops }: { ops: FixStepPatchOp[] }) {
  return (
    <div className="space-y-1.5 font-mono text-[11px]" data-testid="fix-patch-diff">
      {ops.map((op, i) => (
        <div key={i} className="border border-white/10 rounded bg-black/30 p-2">
          <div className="text-cyan-300 text-[10px] mb-1">
            {op.op.toUpperCase()} <code className="text-white/70">{op.path}</code>
          </div>
          {'previousValue' in op && op.previousValue !== undefined && (
            <div className="text-red-300/90 break-all"><span className="text-red-400">- </span>{JSON.stringify(op.previousValue)}</div>
          )}
          {'value' in op && op.value !== undefined && (
            <div className="text-emerald-300/90 break-all"><span className="text-emerald-400">+ </span>{JSON.stringify(op.value)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function QaFixModal({ open, request, onClose, onApplied }: Props) {
  const [phase, setPhase] = useState<'proposing' | 'review' | 'applying' | 'cannotFix'>('proposing');
  // PR-L: cumulative-state violations from the apply endpoint (status 409)
  const [violations, setViolations] = useState<Array<{
    kind: string; stepIndex: number; controlId?: string; message: string; severity: 'fail' | 'warn' | 'info';
  }>>([]);
  const [proposal, setProposal] = useState<FixStepResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cannotFixQuestion, setCannotFixQuestion] = useState<string | null>(null);
  const [adminContext, setAdminContext] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Trap Cmd+Z while open + Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  const propose = useCallback(async (request: FixModalRequest, ctx?: string) => {
    setPhase('proposing');
    setError(null);
    setCannotFixQuestion(null);
    // Check cache first (only when no admin context — fresh "ask again" should bust cache)
    if (!ctx) {
      const cached = readCached(request.deviceId, request);
      if (cached) {
        setProposal(cached.result);
        setPhase('review');
        return;
      }
    }
    try {
      const res = await fetch(`/api/pipeline/${request.deviceId}/qa-fix-propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingType: request.findingType,
          tutorialId: request.tutorialId,
          stepIndex: request.stepIndex,
          payload: request.payload,
          additionalContext: ctx,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || (!body.ok && !body.cannotFix)) {
        setError(body.error ?? `HTTP ${res.status}`);
        setPhase('review');
        return;
      }
      if (body.cannotFix) {
        setCannotFixQuestion(body.question ?? 'Agent cannot fix this finding');
        setPhase('cannotFix');
        return;
      }
      setProposal(body.result as FixStepResult);
      writeCached(request.deviceId, request, body.result as FixStepResult);
      setPhase('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('review');
    }
  }, []);

  // Kick off Phase 1 when the modal opens with a request
  useEffect(() => {
    if (!open || !request) return;
    setAdminContext('');
    void propose(request);
  }, [open, request, propose]);

  const handleApply = useCallback(async (applyAnyway = false) => {
    if (!request || !proposal) return;
    setPhase('applying');
    setError(null);
    if (!applyAnyway) setViolations([]);
    try {
      const res = await fetch(`/api/pipeline/${request.deviceId}/qa-fix-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: proposal, applyAnyway }),
      });
      const body = await res.json().catch(() => ({}));
      // PR-L: 409 conflict means cumulative-state violations. Show them
      // and let admin re-submit with applyAnyway.
      if (res.status === 409 && Array.isArray(body.violations)) {
        setViolations(body.violations);
        setError(body.error ?? 'Cumulative-state verification failed.');
        setPhase('review');
        return;
      }
      if (!res.ok || !body.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        setPhase('review');
        return;
      }
      clearCached(request.deviceId, request);
      onApplied();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('review');
    }
  }, [request, proposal, onApplied, onClose]);

  const handleAskAgain = useCallback(() => {
    if (!request) return;
    if (!adminContext.trim()) { setError('Add some context for the agent before asking again.'); return; }
    void propose(request, adminContext.trim());
  }, [request, adminContext, propose]);

  if (!open || !mounted || !request) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={onClose}
      data-testid="qa-fix-modal-backdrop"
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-gray-700 bg-[#111122] p-5 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="qa-fix-modal"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">🛠 Fix with agent</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">{request.label}</p>
          </div>
          {proposal?.confidence && <ConfidenceBadge c={proposal.confidence} />}
        </div>

        {phase === 'proposing' && (
          <div className="py-8 text-center text-sm text-cyan-300" data-testid="fix-modal-proposing">
            <div className="inline-block w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
            <div>Asking tutorial-fixer agent…</div>
            <div className="text-[10px] text-gray-500 mt-1">Typically 30–90 seconds. Cost ≈ $0.05–0.30.</div>
          </div>
        )}

        {phase === 'cannotFix' && (
          <div className="space-y-3" data-testid="fix-modal-cannot-fix">
            <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
              <div className="font-semibold mb-1">Agent cannot safely fix this.</div>
              <div className="text-[11px] text-amber-200/80">{cannotFixQuestion}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="text-xs px-3 py-1.5 rounded text-gray-400 hover:text-gray-200">Close</button>
            </div>
          </div>
        )}

        {phase === 'review' && proposal && (
          <div className="space-y-3" data-testid="fix-modal-review">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Reasoning</div>
              <p className="text-[12px] text-white/80 leading-snug">{proposal.explanation}</p>
              <p className="text-[10px] text-white/40 mt-1">📖 {proposal.citation}</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Proposed change</div>
              <PatchDiff ops={proposal.patch} />
            </div>
            {proposal.alternatives && proposal.alternatives.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Alternatives considered</div>
                <ul className="text-[11px] text-white/60 space-y-1 ml-2">
                  {proposal.alternatives.map((alt, i) => (
                    <li key={i}>
                      <code className="text-cyan-300/80">{JSON.stringify(alt.value)}</code>
                      <span className="text-white/40"> — {alt.rejected}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {proposal.confidence === 'low' && (
              <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                ⚠ Agent confidence is LOW — review the diff carefully before applying.
              </div>
            )}
            {error && (
              <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">{error}</div>
            )}
            {/* PR-L: cumulative-state violations + Apply anyway override */}
            {violations.length > 0 && (
              <div className="space-y-1.5" data-testid="fix-modal-violations">
                <div className="text-[10px] uppercase tracking-wider text-amber-300/80">
                  ⚠ Cumulative-state verification — {violations.length} violation{violations.length === 1 ? '' : 's'}
                </div>
                <ul className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                  {violations.map((v, i) => (
                    <li
                      key={i}
                      className={`text-[10px] border rounded px-2 py-1 ${
                        v.severity === 'fail'
                          ? 'border-red-500/40 bg-red-500/10 text-red-200'
                          : v.severity === 'warn'
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                            : 'border-white/10 bg-white/5 text-white/70'
                      }`}
                    >
                      <div className="font-mono text-[10px] opacity-70">
                        [step {v.stepIndex}] {v.kind}{v.controlId ? ` · ${v.controlId}` : ''}
                      </div>
                      <div>{v.message}</div>
                    </li>
                  ))}
                </ul>
                {violations.some((v) => v.severity === 'fail') && (
                  <div className="text-[10px] text-amber-300/80 italic">
                    Apply was rolled back. Press "Apply anyway" to override and persist the patch despite the violations.
                  </div>
                )}
              </div>
            )}
            <details className="text-[11px]">
              <summary className="cursor-pointer text-white/50 hover:text-white/80">Ask agent again with more context</summary>
              <textarea
                value={adminContext}
                onChange={(e) => setAdminContext(e.target.value)}
                placeholder="e.g., 'use TEMPO_SLIDER not MASTER_TEMPO — the step is about tempo not master clock'"
                className="w-full mt-2 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-[11px] text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 min-h-[60px]"
                data-testid="fix-modal-ask-context"
              />
              <button
                type="button"
                onClick={handleAskAgain}
                disabled={!adminContext.trim()}
                data-testid="fix-modal-ask-again"
                className="mt-2 text-[11px] px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
              >
                ↻ Re-run with this context
              </button>
            </details>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} data-testid="fix-modal-cancel" className="text-xs px-3 py-1.5 rounded text-gray-400 hover:text-gray-200">Cancel</button>
              {violations.some((v) => v.severity === 'fail') ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(
                      `Apply this patch despite ${violations.filter((v) => v.severity === 'fail').length} cumulative-state violation(s)?\n\nThis is audit-logged.`,
                    )) {
                      void handleApply(true);
                    }
                  }}
                  data-testid="fix-modal-apply-anyway"
                  className="text-xs px-4 py-1.5 rounded font-medium bg-amber-600 text-white hover:bg-amber-500"
                >
                  ⚠ Apply anyway
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleApply(false)}
                  data-testid="fix-modal-apply"
                  className="text-xs px-4 py-1.5 rounded font-medium bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Apply fix
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'applying' && (
          <div className="py-8 text-center text-sm text-emerald-300" data-testid="fix-modal-applying">
            <div className="inline-block w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-2" />
            <div>Applying patch + re-validating…</div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
