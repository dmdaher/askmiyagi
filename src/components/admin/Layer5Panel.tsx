'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from './ToastSystem';

interface CoherenceFinding {
  severity: 'fail' | 'warn' | 'info';
  stepIndex: number;
  message: string;
  suggestedFix?: Array<{ op: string; path: string; value?: unknown }>;
}

interface CoherenceResult {
  tutorialId: string;
  coherenceScore: 1 | 2 | 3 | 4 | 5;
  verdict: 'pass' | 'advisory' | 'fail';
  citations: string[];
  findings: CoherenceFinding[];
  summary: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface Props {
  deviceId: string;
  tutorials: Array<{ id: string; title: string }>;
  /** Called when admin clicks the 🛠 Fix button on a Layer 5 finding. */
  openFixModal: (req: {
    deviceId: string;
    findingType: 'layer5';
    tutorialId: string;
    stepIndex: number;
    label: string;
    payload: unknown;
  }) => void;
}

const SCORE_COLORS: Record<number, string> = {
  5: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  4: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
  3: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  2: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
  1: 'text-red-300 bg-red-500/15 border-red-500/30',
};

const VERDICT_LABELS: Record<string, string> = {
  pass: '✓ pass',
  advisory: '⚠ advisory',
  fail: '✗ fail',
};

function ScoreBadge({ score, verdict }: { score: number; verdict: string }) {
  const classes = SCORE_COLORS[score] ?? 'text-white/60 bg-white/5 border-white/20';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${classes}`}>
      {score}/5 · {VERDICT_LABELS[verdict] ?? verdict}
    </span>
  );
}

export default function Layer5Panel({ deviceId, tutorials, openFixModal }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // Cached coherence results keyed by tutorialId
  const [results, setResults] = useState<Record<string, { result?: CoherenceResult; fresh?: boolean; cachedAt?: number }>>({});
  const [inFlight, setInFlight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fetch cached results when the panel opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const next: typeof results = {};
      for (const t of tutorials) {
        try {
          const res = await fetch(`/api/pipeline/${deviceId}/qa-assess-coherence?tutorialId=${encodeURIComponent(t.id)}`);
          if (!res.ok) continue;
          const body = await res.json();
          if (body.cached) next[t.id] = { result: body.result, fresh: body.fresh, cachedAt: body.cachedAt };
        } catch { /* ignore — first-open prefetch is best-effort */ }
      }
      if (!cancelled) setResults(next);
    })();
    return () => { cancelled = true; };
  }, [open, deviceId, tutorials]);

  const assess = useCallback(async (tutorialId: string, force = false) => {
    setInFlight(tutorialId);
    setError(null);
    const progressKey = `assess:${tutorialId}`;
    toast.progress(progressKey, `Assessing ${tutorialId}… (≈$0.20, ≈60s)`);
    try {
      const res = await fetch(`/api/pipeline/${deviceId}/qa-assess-coherence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId, force }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        const errMsg = body.error ?? `HTTP ${res.status}`;
        setError(errMsg);
        toast.error(`Assess failed for ${tutorialId}: ${errMsg}`, { key: progressKey });
        return;
      }
      setResults((prev) => ({ ...prev, [tutorialId]: { result: body.result, fresh: true, cachedAt: Date.now() } }));
      // PR-N2: actionable toast — clicking "Open findings" scrolls + expands the row
      const r = body.result as CoherenceResult;
      toast.success(
        `Assessed ${tutorialId} — ${r.coherenceScore}/5 ${r.verdict}`,
        {
          key: progressKey,
          // PR-N follow-up: STICKY — agent results require admin attention.
          duration: -1,
          action: r.findings.length > 0 ? {
            label: `📋 Open ${r.findings.length} finding${r.findings.length === 1 ? '' : 's'}`,
            testid: `toast-action-assess-${tutorialId}`,
            onClick: () => {
              setOpen(true);
              setExpanded(tutorialId);
              // Best-effort scroll the row into view (defer until after render)
              requestAnimationFrame(() => {
                document.querySelector(`[data-testid="layer5-row-${tutorialId}"]`)
                  ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              });
            },
          } : undefined,
        },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(`Assess error for ${tutorialId}: ${msg}`, { key: progressKey });
    } finally {
      setInFlight(null);
    }
  }, [deviceId, toast]);

  return (
    <div className="flex-shrink-0 border-t border-white/10 px-2 py-2 space-y-1.5" data-testid="layer5-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-[11px] font-semibold text-white/80 hover:text-white py-0.5 sticky top-0 z-10 bg-[#0a0a14]"
        data-testid="layer5-toggle"
      >
        <span>{open ? '▾' : '▸'} Layer 5: Conceptual Coherence</span>
        <span className="text-[9px] text-white/40">{tutorials.length} tutorials</span>
      </button>
      {open && (
        <div className="space-y-1.5">
          {error && (
            <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-1">{error}</div>
          )}
          {tutorials.map((tut) => {
            const cached = results[tut.id];
            const isInFlight = inFlight === tut.id;
            const isExpanded = expanded === tut.id;
            return (
              <div
                key={tut.id}
                className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
                data-testid={`layer5-row-${tut.id}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : tut.id)}
                    className="text-[10px] text-white/80 flex-1 min-w-0 truncate text-left hover:text-white"
                    title={tut.title}
                  >
                    {tut.title}
                  </button>
                  {cached?.result ? (
                    <ScoreBadge score={cached.result.coherenceScore} verdict={cached.result.verdict} />
                  ) : (
                    <span className="text-[9px] text-white/40 italic">not assessed</span>
                  )}
                  <button
                    type="button"
                    onClick={() => assess(tut.id, !!cached)}
                    disabled={isInFlight}
                    className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50"
                    data-testid={`layer5-assess-${tut.id}`}
                    title="Spawn tutorial-fixer in assess-coherence mode (≈$0.20, ≈60s)"
                  >
                    {isInFlight ? '⏳' : cached ? '↻' : '🔍'} {cached ? 'Re-assess' : 'Assess'}
                  </button>
                </div>
                {isExpanded && cached?.result && (
                  <div className="mt-1.5 space-y-1 text-[10px] text-white/70">
                    <div className="italic">{cached.result.summary}</div>
                    {cached.result.citations.length > 0 && (
                      <div className="text-[9px] text-white/40">
                        Citations: {cached.result.citations.join(', ')}
                      </div>
                    )}
                    {cached.result.findings.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {cached.result.findings.map((f, i) => (
                          <li
                            key={i}
                            className={`border rounded px-1.5 py-1 ${
                              f.severity === 'fail'
                                ? 'border-red-500/40 bg-red-500/10'
                                : f.severity === 'warn'
                                  ? 'border-amber-500/40 bg-amber-500/10'
                                  : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-[9px] opacity-70">step {f.stepIndex + 1}</div>
                                <div>{f.message}</div>
                              </div>
                              {f.suggestedFix && f.suggestedFix.length > 0 && (
                                <button
                                  type="button"
                                  data-testid={`layer5-fix-${tut.id}-${f.stepIndex}-${i}`}
                                  onClick={() => openFixModal({
                                    deviceId,
                                    findingType: 'layer5',
                                    tutorialId: tut.id,
                                    stepIndex: f.stepIndex,
                                    label: `Layer 5 finding: ${f.message.slice(0, 80)}`,
                                    payload: {
                                      finding: f,
                                      suggestedFix: f.suggestedFix,
                                    },
                                  })}
                                  className="text-[9px] px-1.5 py-0.5 rounded text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 whitespace-nowrap"
                                  title="Apply the agent's suggested fix (Phase 2 review modal)"
                                >🛠 Fix</button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
