'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RelinkCandidate {
  controlId: string;
  confidence: number;
  reasons: {
    tokenOverlap: number;
    idSimilarity: number;
    positionProximity: number;
  };
  explanation: string;
}

interface RelinkSuggestion {
  previousControlId: string;
  candidates: RelinkCandidate[];
  hasViableSuggestion: boolean;
}

interface Props {
  deviceId: string;
  labelId: string;
  previousControlId: string;
  onClose: () => void;
  /** Called after a successful apply or undo so caller can refresh inventory. */
  onChanged: () => void;
}

/** A single self-contained modal: fetches suggestions on mount, lets admin
 *  pick one, applies via the API. Reuses the soft tone of the rest of the
 *  admin UI — no separate visual style guide. */
export default function RelinkModal({ deviceId, labelId, previousControlId, onClose, onChanged }: Props) {
  const [suggestion, setSuggestion] = useState<RelinkSuggestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Fetch suggestions
  useEffect(() => {
    const q = new URLSearchParams({ deviceId, previousControlId, labelId }).toString();
    fetch(`/api/admin/inventory/relink?${q}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setSuggestion(data);
          if (data.candidates.length > 0) setSelected(data.candidates[0].controlId);
        }
      })
      .catch((e) => setError((e as Error).message));
  }, [deviceId, previousControlId, labelId]);

  const handleApply = useCallback(async () => {
    if (!selected) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/inventory/relink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          labelId,
          previousControlId,
          newControlId: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Apply failed');
      } else {
        onChanged();
        onClose();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApplying(false);
    }
  }, [selected, deviceId, labelId, previousControlId, onChanged, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="w-full max-w-xl rounded-xl border p-6"
          style={{ backgroundColor: 'var(--card-bg, #141420)', borderColor: 'var(--card-border, #2a2a3a)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground, #e0e0e0)' }}>
            Re-link label
          </h2>
          <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>
            Was linked to <code className="font-mono">{previousControlId}</code> (now missing). Pick a current
            control to re-link to. A backup is taken before applying.
          </p>

          {error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {error}
            </div>
          )}

          {!suggestion && !error && (
            <p className="text-xs py-6 text-center" style={{ color: '#6b7280' }}>
              Loading suggestions…
            </p>
          )}

          {suggestion && !suggestion.hasViableSuggestion && (
            <div className="rounded-lg px-3 py-4 text-xs" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}>
              No high-confidence suggestions. Open the editor and re-link manually, or leave the label as standalone.
            </div>
          )}

          {suggestion && suggestion.hasViableSuggestion && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {suggestion.candidates.map((c) => {
                const isSelected = selected === c.controlId;
                return (
                  <button
                    key={c.controlId}
                    onClick={() => setSelected(c.controlId)}
                    className="w-full text-left rounded-lg p-3 transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? '#3b82f6' : 'var(--card-border, #2a2a3a)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-semibold" style={{ color: isSelected ? '#60a5fa' : 'var(--foreground, #e0e0e0)' }}>
                            {c.controlId}
                          </code>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{
                            backgroundColor: c.confidence > 0.5 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: c.confidence > 0.5 ? '#4ade80' : '#fbbf24',
                          }}>
                            {(c.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>{c.explanation}</p>
                      </div>
                      {isSelected && (
                        <span className="text-base" style={{ color: '#60a5fa' }}>●</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-xs px-3 py-2 rounded transition-colors"
              style={{ color: '#9ca3af', border: '1px solid #374151' }}
              disabled={applying}
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {selected && !confirming && (
                <button
                  onClick={() => setConfirming(true)}
                  disabled={applying}
                  className="text-xs px-4 py-2 rounded font-medium"
                  style={{ backgroundColor: '#3b82f6', color: '#fff' }}
                >
                  Apply re-link
                </button>
              )}
              {selected && confirming && (
                <>
                  <span className="text-[11px]" style={{ color: '#9ca3af' }}>Apply <code>{selected}</code>?</span>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: '#9ca3af', border: '1px solid #374151' }}
                  >
                    No
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="text-xs px-3 py-1 rounded font-medium"
                    style={{ backgroundColor: '#22c55e', color: '#fff' }}
                  >
                    {applying ? 'Applying…' : 'Yes, apply'}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
