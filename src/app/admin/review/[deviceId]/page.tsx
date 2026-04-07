'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import PanelEditor from '@/components/panel-editor/PanelEditor';

/**
 * Admin review page — renders the editor in readOnly mode with
 * Approve / Request Changes buttons. Loads from hosted Blob.
 */
export default function ReviewDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const router = useRouter();
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const handleApprove = useCallback(async () => {
    setActing(true);
    await fetch(`/api/hosted/panels/${deviceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    router.push('/admin/review');
  }, [deviceId, router]);

  const handleRequestChanges = useCallback(async () => {
    setActing(true);
    await fetch(`/api/hosted/panels/${deviceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-progress', reviewNote: note || undefined }),
    });
    router.push('/admin/review');
  }, [deviceId, note, router]);

  if (!deviceId) return null;

  return (
    <div className="flex flex-col h-screen bg-[#0d0d1a]">
      {/* Review action bar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-[#111122] px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/review')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back
          </button>
          <span className="text-sm font-semibold text-gray-200">{deviceId}</span>
          <span className="text-[10px] text-amber-400 bg-amber-600/20 border border-amber-600/40 px-2 py-0.5 rounded">
            Review
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showNoteInput && (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Feedback note for contractor..."
              className="w-64 h-7 rounded border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 outline-none focus:border-blue-500"
              autoFocus
            />
          )}
          <button
            onClick={() => {
              if (!showNoteInput) { setShowNoteInput(true); return; }
              handleRequestChanges();
            }}
            disabled={acting}
            className="rounded border border-amber-600 bg-amber-700/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-700/50 transition-colors disabled:opacity-50"
          >
            {showNoteInput ? 'Send Changes' : 'Request Changes'}
          </button>
          <button
            onClick={handleApprove}
            disabled={acting}
            className="rounded border border-green-600 bg-green-700/30 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-700/50 transition-colors disabled:opacity-50"
          >
            {acting ? 'Saving...' : 'Approve'}
          </button>
        </div>
      </div>

      {/* Editor in readOnly mode */}
      <div className="flex-1 overflow-hidden">
        <PanelEditor deviceId={deviceId} />
      </div>
    </div>
  );
}
