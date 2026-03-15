'use client';

import type { TutorialBatchStatus } from '@/lib/pipeline/types';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#374151', text: '#9ca3af' },
  building: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
  reviewing: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  approved: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
  rejected: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
};

interface BatchProgressProps {
  batches: TutorialBatchStatus[];
}

export default function BatchProgress({ batches }: BatchProgressProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground, #e0e0e0)' }}>
          Tutorial Batches
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
              {['Batch', 'Tutorials', 'Builder Score', 'Reviewer', 'Status'].map((h) => (
                <th key={h} className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const statusStyle = STATUS_STYLES[batch.status] ?? STATUS_STYLES.pending;

              return (
                <tr key={batch.batchId} style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
                  <td className="px-3 py-1.5">
                    <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                      {batch.batchId}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--surface, #1a1a2a)',
                        color: 'var(--foreground, #e0e0e0)',
                      }}
                    >
                      {batch.tutorials.length}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    {batch.builderScore !== null ? (
                      <span
                        className="text-xs font-mono font-semibold"
                        style={{ color: batch.builderScore >= 9.5 ? '#22c55e' : '#f59e0b' }}
                      >
                        {batch.builderScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs font-mono" style={{ color: '#6b7280' }}>--</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {batch.reviewerVerdict !== null ? (
                      <span
                        className="text-xs"
                        style={{
                          color: batch.reviewerVerdict === 'APPROVED' ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {batch.reviewerVerdict}
                      </span>
                    ) : (
                      <span className="text-xs font-mono" style={{ color: '#6b7280' }}>--</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      {batch.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
