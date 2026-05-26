'use client';

import type { Tutorial } from '@/types/tutorial';
import type { TutorialIssue } from '@/lib/pipeline/tutorial-validators';

interface TutorialDiagnosticsPanelProps {
  tutorial: Tutorial;
  issues: TutorialIssue[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onJumpToStep: (stepIndex: number) => void;
}

function severityColor(severity: TutorialIssue['severity']): string {
  switch (severity) {
    case 'error': return 'text-red-300 border-red-700/50 bg-red-900/20';
    case 'warning': return 'text-amber-300 border-amber-700/50 bg-amber-900/20';
    case 'info': return 'text-blue-300 border-blue-700/50 bg-blue-900/20';
  }
}

function severityLabel(severity: TutorialIssue['severity']): string {
  switch (severity) {
    case 'error': return 'ERROR';
    case 'warning': return 'WARN';
    case 'info': return 'INFO';
  }
}

export default function TutorialDiagnosticsPanel({
  tutorial,
  issues,
  collapsed,
  onToggleCollapsed,
  onJumpToStep,
}: TutorialDiagnosticsPanelProps) {
  if (collapsed) {
    return (
      <aside
        className="border-l border-white/10 bg-[#0c0c18] flex flex-col items-center pt-3 min-h-0 overflow-y-auto"
        data-testid="diagnostics-panel-collapsed"
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-[10px] px-1.5 py-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title="Expand diagnostics"
        >
          ◄
        </button>
        {issues.length > 0 && (
          <span
            className={`mt-2 text-[10px] font-semibold ${
              issues.some(i => i.severity === 'error')
                ? 'text-red-400'
                : issues.some(i => i.severity === 'warning') ? 'text-amber-300' : 'text-blue-300'
            }`}
            style={{ writingMode: 'vertical-rl' }}
          >
            {issues.length} issue{issues.length === 1 ? '' : 's'}
          </span>
        )}
      </aside>
    );
  }

  // Group issues by step
  const byStep = new Map<number | 'tutorial-wide', TutorialIssue[]>();
  for (const issue of issues) {
    const key = issue.stepIndex ?? 'tutorial-wide';
    if (!byStep.has(key)) byStep.set(key, []);
    byStep.get(key)!.push(issue);
  }

  return (
    <aside
      className="border-l border-white/10 bg-[#0c0c18] overflow-y-auto min-h-0"
      data-testid="diagnostics-panel"
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 sticky top-0 bg-[#0c0c18] z-10">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Diagnostics</p>
          <p className="text-[10px] text-white/30 mt-0.5 truncate" title={tutorial.title}>
            {tutorial.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-[10px] px-1.5 py-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title="Collapse diagnostics"
        >
          ►
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <p className="text-[12px] text-emerald-300/80">✓ No issues found</p>
          <p className="text-[10px] text-white/40 mt-1">All control IDs resolve, no excessive flips.</p>
        </div>
      ) : (
        <div className="py-2">
          {[...byStep.entries()].map(([key, stepIssues]) => (
            <div key={String(key)} className="mb-3">
              <button
                type="button"
                onClick={() => typeof key === 'number' && onJumpToStep(key)}
                disabled={key === 'tutorial-wide'}
                className="w-full text-left px-3 py-1 text-[10px] uppercase tracking-wider text-white/50 hover:text-white/80 disabled:hover:text-white/50 transition-colors"
              >
                {key === 'tutorial-wide'
                  ? 'Tutorial-wide'
                  : `Step ${(key as number) + 1}: ${tutorial.steps[key as number]?.title ?? ''}`}
              </button>
              <ul className="px-2 space-y-1.5">
                {stepIssues.map((issue, i) => (
                  <li
                    key={`${issue.code}-${i}`}
                    data-testid={`issue-${issue.code}`}
                    className={`rounded border px-2 py-1.5 text-[11px] leading-snug ${severityColor(issue.severity)}`}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-[9px] tracking-wider opacity-80">
                        {severityLabel(issue.severity)}
                      </span>
                      {typeof issue.stepIndex === 'number' && (
                        <button
                          type="button"
                          onClick={() => onJumpToStep(issue.stepIndex!)}
                          className="text-[10px] underline opacity-60 hover:opacity-100"
                        >
                          jump
                        </button>
                      )}
                    </div>
                    <p className="text-white/85">{issue.message}</p>
                    {issue.controlId && (
                      <p className="mt-0.5 text-[10px] font-mono opacity-60">{issue.controlId}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
