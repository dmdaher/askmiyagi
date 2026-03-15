'use client';

const AGENT_COLORS: Record<string, string> = {
  gatekeeper: '#facc15',
  'structural-inspector': '#f97316',
  'panel-questioner': '#a855f7',
  critic: '#ef4444',
  'manual-extractor': '#06b6d4',
  'coverage-auditor': '#22c55e',
  'tutorial-builder': '#3b82f6',
  'tutorial-reviewer': '#ec4899',
};

interface AgentScoreCardProps {
  agentName: string;
  score: number | null;
  status: 'running' | 'passed' | 'failed' | null;
}

export default function AgentScoreCard({ agentName, score, status }: AgentScoreCardProps) {
  const agentColor = AGENT_COLORS[agentName] ?? '#6b7280';

  function getScoreColor(): string {
    if (score === null) return '#6b7280';
    if (score >= 10.0) return '#22c55e';
    if (score >= 9.5) return '#22c55e';
    return '#ef4444';
  }

  function formatScore(): string {
    if (score === null) return '--';
    return score.toFixed(1);
  }

  return (
    <div
      className="rounded-lg px-3 py-2 flex items-center justify-between gap-3"
      style={{
        backgroundColor: 'var(--surface, #1a1a2a)',
        borderLeft: `3px solid ${agentColor}`,
      }}
    >
      <span className="text-xs font-medium truncate" style={{ color: agentColor }}>
        {agentName}
      </span>

      <div className="flex items-center gap-1.5">
        {status === 'running' && (
          <svg
            className="animate-spin h-3.5 w-3.5"
            style={{ color: agentColor }}
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
        )}

        <span className="text-sm font-mono font-semibold" style={{ color: getScoreColor() }}>
          {formatScore()}
        </span>

        {score !== null && score >= 10.0 && (
          <svg className="w-3.5 h-3.5" style={{ color: '#22c55e' }} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
