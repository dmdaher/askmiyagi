'use client';

import type { Tutorial } from '@/types/tutorial';
import type { TutorialReviewSummary } from '@/lib/pipeline/tutorial-validators';

interface TutorialListPanelProps {
  tutorials: Tutorial[];
  summary: TutorialReviewSummary;
  currentTutorialId: string;
  reviewed: Set<string>;
  onSelect: (tutorialId: string) => void;
  onToggleReviewed: (tutorialId: string) => void;
}

function statusDotColor(counts: { errors: number; warnings: number; infos: number } | undefined): string {
  if (!counts) return 'bg-white/20';
  if (counts.errors > 0) return 'bg-red-500';
  if (counts.warnings > 0) return 'bg-amber-400';
  return 'bg-emerald-500';
}

export default function TutorialListPanel({
  tutorials,
  summary,
  currentTutorialId,
  reviewed,
  onSelect,
  onToggleReviewed,
}: TutorialListPanelProps) {
  return (
    <aside
      className="bg-[#0c0c18]"
      data-testid="tutorial-list-panel"
    >
      <div className="px-3 py-3 border-b border-white/10 sticky top-0 bg-[#0c0c18] z-10">
        <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
          Tutorials
        </p>
        <p className="text-[10px] text-white/30 mt-0.5">
          [ / ] to cycle · right-click row to mark reviewed
        </p>
      </div>

      <ul className="py-1">
        {tutorials.map((tutorial) => {
          const counts = summary.byTutorial[tutorial.id];
          const isActive = tutorial.id === currentTutorialId;
          const isReviewed = reviewed.has(tutorial.id);

          return (
            <li key={tutorial.id}>
              <button
                type="button"
                onClick={() => onSelect(tutorial.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onToggleReviewed(tutorial.id);
                }}
                data-testid={`tutorial-row-${tutorial.id}`}
                data-active={isActive}
                data-reviewed={isReviewed}
                className={`w-full text-left px-3 py-2 transition-colors group ${
                  isActive
                    ? 'bg-white/10 border-l-2 border-blue-500'
                    : 'hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${statusDotColor(counts)}`}
                    title={
                      counts
                        ? `${counts.errors} errors, ${counts.warnings} warnings, ${counts.infos} info`
                        : 'no validator data'
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-white/90 truncate leading-snug">
                      {tutorial.title}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {tutorial.category} · {counts?.stepCount ?? tutorial.steps.length} steps
                      {counts && counts.errors + counts.warnings > 0 && (
                        <span className="ml-1">
                          · <span className={counts.errors > 0 ? 'text-red-400' : 'text-amber-300'}>
                            {counts.errors + counts.warnings} issues
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                  {isReviewed && (
                    <span
                      className="flex-shrink-0 text-emerald-400 text-[10px] font-bold"
                      title="Marked reviewed by admin"
                    >
                      ✓
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
