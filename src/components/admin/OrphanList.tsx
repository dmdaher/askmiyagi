'use client';

import { useState } from 'react';

export type OrphanCategory = 'A' | 'B' | 'C' | 'D';

export interface OrphanDetail {
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

interface Props {
  active: OrphanDetail[];
  intentional: OrphanDetail[];
  flashControl: (id: string) => void;
  onAction: (
    action: 'diagnose' | 'mark-intentional' | 'unmark-intentional' | 'delete',
    controlId: string,
    intent?: { category: OrphanCategory; pairedWith?: string | null; reason?: string },
  ) => void;
  inFlightKey: string | null;
  error: string | null;
}

const CATEGORY_PALETTE: Record<OrphanCategory, { bg: string; fg: string; label: string }> = {
  A: { bg: 'bg-red-500/15', fg: 'text-red-300', label: 'Editor garbage' },
  B: { bg: 'bg-emerald-500/15', fg: 'text-emerald-300', label: 'Decorative indicator' },
  C: { bg: 'bg-amber-500/15', fg: 'text-amber-300', label: 'Coverage gap' },
  D: { bg: 'bg-blue-500/15', fg: 'text-blue-300', label: 'Redundant slot' },
};

function CategoryBadge({ category }: { category: OrphanCategory }) {
  const p = CATEGORY_PALETTE[category];
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.bg} ${p.fg} font-semibold`}>
      {category}. {p.label}
    </span>
  );
}

function OrphanRow({
  row, flashControl, onAction, inFlightKey,
}: {
  row: OrphanDetail;
  flashControl: (id: string) => void;
  onAction: Props['onAction'];
  inFlightKey: string | null;
}) {
  const { controlId, label, diagnosis, hint } = row;
  const diagnoseKey = `diagnose:${controlId}`;
  const markKey = `mark-intentional:${controlId}`;
  const isDiagnosing = inFlightKey === diagnoseKey;
  const isMarking = inFlightKey === markKey;

  // PR-N follow-up: derive a one-line recommendation from the suggestedAction
  // so admin sees the "what to do + why" at a glance, not buried under reason.
  const recommendation = diagnosis ? (() => {
    const why = diagnosis.pairedWith
      ? `paired with ${diagnosis.pairedWith}`
      : diagnosis.categoryName.toLowerCase();
    switch (diagnosis.suggestedAction) {
      case 'mark-intentional':
        return { verb: '✓ Mark intentional', tone: 'emerald', detail: `it's ${why} — not a missing tutorial` };
      case 'delete':
        return { verb: '🗑 Delete', tone: 'red', detail: `it's editor garbage — safe to remove` };
      case 'suggest-tutorial':
        return { verb: '✓ Accept gap', tone: 'amber', detail: `coverage gap — accept for now or add tutorial later` };
      default:
        return null;
    }
  })() : null;

  return (
    <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1.5" data-testid={`orphan-row-${controlId}`}>
      {/* Title row: badge on its own line above so long controlIds don't overlap */}
      {diagnosis && (
        <div className="mb-1">
          <CategoryBadge category={diagnosis.category} />
        </div>
      )}
      <div className="mb-1">
        <code className="text-cyan-300 text-[10px] break-all">{controlId}</code>
        {label && <span className="text-[10px] text-white/55 ml-1">— {label}</span>}
      </div>
      {!diagnosis && hint && <div className="text-[9px] text-amber-400/80 italic mb-1">{hint}</div>}
      {diagnosis && (
        <>
          {/* PR-N follow-up: top-line recommendation — quick hit "what + why" */}
          {recommendation && (
            <div className={`text-[10px] mb-1.5 px-1.5 py-1 rounded border ${
              recommendation.tone === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : recommendation.tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            }`}>
              <span className="font-semibold">Recommended: {recommendation.verb}</span>
              {' — '}
              <span className="opacity-90">{recommendation.detail}</span>
            </div>
          )}
          <div className="text-[10px] text-white/65 leading-snug mb-1">{diagnosis.reason}</div>
          <div className="text-[9px] text-white/35 mb-1.5">
            confidence: <span className={
              diagnosis.confidence === 'high' ? 'text-emerald-400'
              : diagnosis.confidence === 'medium' ? 'text-amber-400'
              : 'text-red-400'
            }>{diagnosis.confidence}</span>
            {diagnosis.citation && <span> · {diagnosis.citation}</span>}
            {diagnosis.pairedWith && <span> · paired w/ <code className="text-cyan-300">{diagnosis.pairedWith}</code></span>}
          </div>
          {diagnosis.suggestedTutorial && (
            <div className="text-[9px] text-white/55 bg-amber-500/5 border border-amber-500/15 rounded px-1.5 py-1 mb-1.5">
              <div className="font-semibold text-amber-300">Suggested tutorial: {diagnosis.suggestedTutorial.title}</div>
              <div>{diagnosis.suggestedTutorial.description}</div>
              {diagnosis.suggestedTutorial.estimatedSteps && (
                <div className="text-white/40 mt-0.5">~{diagnosis.suggestedTutorial.estimatedSteps} steps · pages {diagnosis.suggestedTutorial.manualPages}</div>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => flashControl(controlId)}
          className="text-[9px] px-1.5 py-0.5 rounded text-white/70 hover:bg-white/10 border border-white/10"
          data-testid={`orphan-flash-${controlId}`}
          title="Flash this control on the panel"
        >👁 Flash</button>
        {!diagnosis && (
          <button
            type="button"
            onClick={() => onAction('diagnose', controlId)}
            disabled={isDiagnosing}
            className="text-[9px] px-1.5 py-0.5 rounded text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 disabled:opacity-50"
            data-testid={`orphan-diagnose-${controlId}`}
            title="Ask tutorial-fixer agent to diagnose this orphan (≈$0.20, ≈60s)"
          >{isDiagnosing ? '⏳ Diagnosing…' : '🛠 Diagnose'}</button>
        )}
        {diagnosis && (
          <button
            type="button"
            onClick={() => onAction('diagnose', controlId)}
            disabled={isDiagnosing}
            className="text-[9px] px-1.5 py-0.5 rounded text-white/60 hover:bg-white/10 border border-white/10 disabled:opacity-50"
            title="Re-run agent diagnosis"
          >{isDiagnosing ? '⏳' : '↻'} Re-diagnose</button>
        )}
        {diagnosis?.suggestedAction === 'mark-intentional' && (
          <button
            type="button"
            onClick={() => onAction('mark-intentional', controlId, {
              category: diagnosis.category,
              pairedWith: diagnosis.pairedWith,
              reason: diagnosis.reason,
            })}
            disabled={isMarking}
            className="text-[9px] px-1.5 py-0.5 rounded text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 disabled:opacity-50"
            data-testid={`orphan-mark-${controlId}`}
          >{isMarking ? '⏳' : '✓'} Mark intentional</button>
        )}
        {diagnosis?.suggestedAction === 'delete' && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(
                `Delete ${controlId} from manifest-editor.json?\n\n` +
                `This removes the control + scrubs any section.childIds references. ` +
                `A backup is saved to .pipeline/<id>/backups/ before the write.`
              )) {
                onAction('delete', controlId);
              }
            }}
            disabled={inFlightKey === `delete:${controlId}`}
            className="text-[9px] px-1.5 py-0.5 rounded text-red-300 hover:bg-red-500/10 border border-red-500/30 disabled:opacity-50"
            data-testid={`orphan-delete-${controlId}`}
            title="Delete this orphan from manifest-editor.json (backup created first)"
          >{inFlightKey === `delete:${controlId}` ? '⏳' : '🗑'} Delete</button>
        )}
        {diagnosis?.suggestedAction === 'suggest-tutorial' && (
          <button
            type="button"
            onClick={() => onAction('mark-intentional', controlId, {
              category: diagnosis.category,
              reason: 'coverage gap — accepted as intentional for now',
            })}
            disabled={isMarking}
            className="text-[9px] px-1.5 py-0.5 rounded text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 disabled:opacity-50"
          >{isMarking ? '⏳' : '✓'} Accept gap</button>
        )}
      </div>
    </div>
  );
}

function IntentionalRow({ row, onUnmark, inFlightKey }: { row: OrphanDetail; onUnmark: () => void; inFlightKey: string | null }) {
  const unmarkKey = `unmark-intentional:${row.controlId}`;
  return (
    <div
      className="rounded border border-emerald-500/20 bg-emerald-500/[0.04] px-2 py-1 flex items-center gap-2 text-[10px]"
      data-testid={`orphan-intentional-${row.controlId}`}
    >
      <span className="text-emerald-400 flex-shrink-0" title="Actioned by admin">✓</span>
      {row.intentional && <CategoryBadge category={row.intentional.category} />}
      <code className="text-cyan-300/80 flex-1 min-w-0 truncate">{row.controlId}</code>
      {row.label && <span className="text-white/40 truncate">— {row.label}</span>}
      <button
        type="button"
        onClick={onUnmark}
        disabled={inFlightKey === unmarkKey}
        className="text-[9px] px-1 py-0.5 rounded text-white/50 hover:bg-white/10 disabled:opacity-50 flex-shrink-0"
        title="Re-flag this orphan for triage"
      >{inFlightKey === unmarkKey ? '⏳' : '↺'} Un-mark</button>
    </div>
  );
}

export default function OrphanList({ active, intentional, flashControl, onAction, inFlightKey, error }: Props) {
  // PR-N follow-up: "Resolved" section default-OPEN when admin has
  // recently actioned items — makes the "I did something, where is it?"
  // experience clear. Collapses to a count when section is empty or admin
  // explicitly hides it.
  const [resolvedOpen, setResolvedOpen] = useState(true);
  return (
    <div className="border-t border-white/5 px-2 py-2 space-y-3">
      {error && (
        <div className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-1">{error}</div>
      )}

      {/* ── Active orphans (needs admin action) ────────────────────────── */}
      <div className="space-y-1.5">
        <div className="text-[9px] uppercase tracking-wider text-white/40 font-semibold flex items-center justify-between">
          <span>⚠ Needs review</span>
          <span className="text-white/30 normal-case font-normal">{active.length}</span>
        </div>
        {active.length === 0 ? (
          <div className="text-[10px] text-emerald-300/70 italic px-1">
            ✓ All orphans reviewed — nothing to action.
          </div>
        ) : (
          active.map((row) => (
            <OrphanRow
              key={row.controlId}
              row={row}
              flashControl={flashControl}
              onAction={onAction}
              inFlightKey={inFlightKey}
            />
          ))
        )}
      </div>

      {/* ── Resolved orphans (admin actioned: mark intentional / accept gap) ── */}
      {intentional.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-emerald-500/15">
          <button
            type="button"
            onClick={() => setResolvedOpen((v) => !v)}
            className="w-full text-[9px] uppercase tracking-wider text-emerald-300/80 hover:text-emerald-300 font-semibold flex items-center justify-between"
            data-testid="orphan-intentional-toggle"
          >
            <span className="flex items-center gap-1">
              <span>{resolvedOpen ? '▾' : '▸'}</span>
              <span>✓ Resolved</span>
            </span>
            <span className="text-emerald-300/60 normal-case font-normal">{intentional.length}</span>
          </button>
          {resolvedOpen && (
            <div className="space-y-1">
              {intentional.map((row) => (
                <IntentionalRow
                  key={row.controlId}
                  row={row}
                  onUnmark={() => onAction('unmark-intentional', row.controlId)}
                  inFlightKey={inFlightKey}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
