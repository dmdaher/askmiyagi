'use client';

import type { SectionStatus } from '@/lib/pipeline/types';

interface SectionProgressProps {
  sections: SectionStatus[];
  currentSection?: string;
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-xs font-mono" style={{ color: '#6b7280' }}>--</span>;
  }

  const color = score >= 10.0 ? '#22c55e' : '#f59e0b';

  return (
    <span className="text-xs font-mono font-semibold" style={{ color }}>
      {score.toFixed(1)}
    </span>
  );
}

export default function SectionProgress({ sections, currentSection }: SectionProgressProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground, #e0e0e0)' }}>
          Section Progress
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
              {['Section', 'SI', 'PQ', 'Critic', 'Att.', 'Cost', 'Status'].map((h) => (
                <th key={h} className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const isCurrent = section.id === currentSection;
              const borderColor = section.vaulted ? '#22c55e' : isCurrent ? '#3b82f6' : 'transparent';

              return (
                <tr
                  key={section.id}
                  style={{
                    borderBottom: '1px solid var(--card-border, #2a2a3a)',
                    borderLeft: `3px solid ${borderColor}`,
                  }}
                >
                  <td className="px-3 py-1.5">
                    <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                      {section.id}
                    </span>
                  </td>
                  <td className="px-3 py-1.5"><ScoreCell score={section.siScore} /></td>
                  <td className="px-3 py-1.5"><ScoreCell score={section.pqScore} /></td>
                  <td className="px-3 py-1.5"><ScoreCell score={section.criticScore} /></td>
                  <td className="px-3 py-1.5">
                    <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                      {section.attempts}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                      ${section.costUsd.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {section.vaulted ? (
                        <>
                          {/* Lock icon */}
                          <svg className="w-3 h-3" style={{ color: '#22c55e' }} fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-[10px] font-medium" style={{ color: '#22c55e' }}>Vaulted</span>
                        </>
                      ) : isCurrent ? (
                        <>
                          <svg
                            className="animate-spin h-3 w-3"
                            style={{ color: '#3b82f6' }}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="text-[10px] font-medium" style={{ color: '#3b82f6' }}>Active</span>
                        </>
                      ) : (
                        <span className="text-[10px]" style={{ color: '#6b7280' }}>Pending</span>
                      )}
                    </div>
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
