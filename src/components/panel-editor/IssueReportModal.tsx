'use client';

import { useState, useCallback } from 'react';

interface IssueReportModalProps {
  deviceId: string;
  onClose: () => void;
}

const ISSUE_TYPES = [
  { value: 'missing-control', label: 'Missing Control', placeholder: 'Describe the missing control and where it should be (e.g., "TEMPO RESET button, referenced on manual page 47")' },
  { value: 'wrong-type', label: 'Wrong Type', placeholder: 'Which control has the wrong type and what should it be? (e.g., "jog-wheel is marked as button but should be wheel")' },
  { value: 'wrong-data', label: 'Wrong Label/Shape/Color', placeholder: 'Which control has wrong data and what should it be?' },
  { value: 'other', label: 'Other Issue', placeholder: 'Describe the issue in detail' },
];

export default function IssueReportModal({ deviceId, onClose }: IssueReportModalProps) {
  const [type, setType] = useState('missing-control');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedType = ISSUE_TYPES.find(t => t.value === type) ?? ISSUE_TYPES[0];

  const handleSubmit = useCallback(async () => {
    if (description.trim().length < 5) {
      setError('Description must be at least 5 characters');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/pipeline/${deviceId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description: description.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to submit issue');
      }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }, [deviceId, type, description, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-gray-700 bg-[#0d0d1a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Report an Issue</h2>

        {success ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">✓</div>
            <p className="text-green-400 font-medium">Issue reported successfully</p>
          </div>
        ) : (
          <>
            {/* Issue type */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Issue Type</label>
              <div className="flex flex-wrap gap-2">
                {ISSUE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      type === t.value
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-400 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={selectedType.placeholder}
                rows={4}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-xs text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || description.trim().length < 5}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
              >
                {submitting ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
