'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PhaseResult, SectionStatus, SubscriptionUsage, BurnRate } from '@/lib/pipeline/types';

const PHASE_LABELS: Record<string, string> = {
  'phase-preflight': 'Preflight',
  'phase-0-gatekeeper': 'Gatekeeper',
  'phase-1-section-loop': 'Sections',
  'phase-2-global-assembly': 'Assembly',
  'phase-3-harmonic-polish': 'Polish',
  'panel-pr': 'Panel PR',
  'phase-4-extraction': 'Extract',
  'phase-4-audit': 'Audit',
  'phase-5-tutorial-build': 'Tutorials',
  'tutorial-pr': 'Tutorial PR',
};

function formatTokens(n: number): string {
  return n.toLocaleString('en-US');
}

function formatCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'running...';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remaining}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatTimeRemaining(epochSeconds: number): string {
  const now = Date.now() / 1000;
  const diff = epochSeconds - now;
  if (diff <= 0) return 'expired';
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface CostBreakdownProps {
  phases: PhaseResult[];
  sections?: SectionStatus[];
  totalActualCostUsd?: number;
  budgetCapUsd?: number;
  subscription?: SubscriptionUsage | null;
  burnRate?: BurnRate | null;
}

function BudgetGauge({
  spent,
  budget,
  burnRate,
}: {
  spent: number;
  budget: number;
  burnRate?: BurnRate | null;
}) {
  const pct = Math.min((spent / budget) * 100, 100);
  const color = pct >= 85 ? '#EF4444' : pct >= 70 ? '#F59E0B' : 'var(--accent, #00aaff)';

  return (
    <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
          Budget
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
            ${spent.toFixed(2)} / ${budget.toFixed(2)} ({pct.toFixed(0)}%)
          </span>
          {burnRate?.projectedBudgetExhaustedAt ? (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${color}22`, color }}
            >
              Est. exhaustion: {formatTimeRemaining(new Date(burnRate.projectedBudgetExhaustedAt).getTime() / 1000)}
            </span>
          ) : (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
            >
              Within budget
            </span>
          )}
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function SubscriptionStatus({ subscription }: { subscription: SubscriptionUsage }) {
  const overageColor =
    subscription.overageStatus === 'rejected'
      ? '#EF4444'
      : subscription.isUsingOverage
        ? '#F59E0B'
        : '#22C55E';

  const overageLabel =
    subscription.overageStatus === 'rejected'
      ? 'Rejected'
      : subscription.isUsingOverage
        ? 'Overage'
        : 'Normal';

  return (
    <div
      className="px-3 py-2 flex items-center justify-between"
      style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
          Subscription
        </span>
        {subscription.windowResetsAt > 0 && (
          <span className="text-xs" style={{ color: 'var(--foreground, #e0e0e0)' }}>
            Window resets in {formatTimeRemaining(subscription.windowResetsAt)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: overageColor }}
        />
        <span className="text-[10px]" style={{ color: overageColor }}>
          {overageLabel}
        </span>
      </div>
    </div>
  );
}

function BurnRateSparkline({ burnRate }: { burnRate: BurnRate }) {
  const { dataPoints } = burnRate;
  if (dataPoints.length < 2) return null;

  const costs = dataPoints.map((d) => d.cumulativeCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const range = maxCost - minCost || 1;

  const width = 300;
  const height = 50;

  const points = dataPoints
    .map((d, i) => {
      const x = (i / (dataPoints.length - 1)) * width;
      const y = height - ((d.cumulativeCost - minCost) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="px-3 py-3" style={{ borderTop: '1px solid var(--card-border, #2a2a3a)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
          Burn Rate
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            ${burnRate.costPerMinute.toFixed(4)}/min
          </span>
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            ${burnRate.costPerAgent.toFixed(4)}/agent
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: '50px' }}
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent, #00aaff)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function CostBreakdown({
  phases,
  sections,
  totalActualCostUsd,
  budgetCapUsd,
  subscription,
  burnRate,
}: CostBreakdownProps) {
  const [showSectionDetail, setShowSectionDetail] = useState(false);

  const activePhaseCosts = phases.filter((p) => p.status !== 'skipped' && p.costUsd > 0);

  const totalTokensIn = phases.reduce((sum, p) => sum + p.tokens.input, 0);
  const totalTokensOut = phases.reduce((sum, p) => sum + p.tokens.output, 0);
  const totalCacheTokens = phases.reduce(
    (sum, p) => sum + (p.tokens.cacheCreation ?? 0) + (p.tokens.cacheRead ?? 0),
    0
  );
  const totalCost = phases.reduce((sum, p) => sum + p.costUsd, 0);
  const maxCost = Math.max(...activePhaseCosts.map((p) => p.costUsd), 0.0001);

  const showActualCostColumn =
    totalActualCostUsd !== undefined &&
    totalCost > 0 &&
    Math.abs(totalActualCostUsd - totalCost) / totalCost > 0.05;

  const spent = totalActualCostUsd ?? totalCost;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg, #141420)', border: '1px solid var(--card-border, #2a2a3a)' }}
    >
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--foreground, #e0e0e0)' }}>
          Cost Breakdown
        </h3>
      </div>

      {/* A. Budget Gauge */}
      {budgetCapUsd !== undefined && budgetCapUsd > 0 && (
        <BudgetGauge spent={spent} budget={budgetCapUsd} burnRate={burnRate} />
      )}

      {/* B. Subscription Status */}
      {subscription && <SubscriptionStatus subscription={subscription} />}

      {/* C. Enhanced cost table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
              {['Phase', 'Tokens In', 'Tokens Out', 'Cache', 'Cost', ...(showActualCostColumn ? ['Actual'] : []), 'Duration'].map((h) => (
                <th key={h} className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases
              .filter((p) => PHASE_LABELS[p.phase])
              .map((phase) => {
                const cacheTokens = (phase.tokens.cacheCreation ?? 0) + (phase.tokens.cacheRead ?? 0);
                return (
                  <tr key={phase.phase} style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
                    <td className="px-3 py-1.5">
                      <span className="text-xs" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                        {PHASE_LABELS[phase.phase]}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                        {formatTokens(phase.tokens.input)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                        {formatTokens(phase.tokens.output)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-xs font-mono" style={{ color: cacheTokens > 0 ? '#22C55E' : '#6b7280' }}>
                        {formatTokens(cacheTokens)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-xs font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                        {formatCost(phase.costUsd)}
                      </span>
                    </td>
                    {showActualCostColumn && (
                      <td className="px-3 py-1.5">
                        <span className="text-xs font-mono" style={{ color: '#F59E0B' }}>
                          —
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-1.5">
                      <span className="text-xs font-mono" style={{ color: '#6b7280' }}>
                        {formatDuration(phase.startedAt, phase.completedAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}

            {/* Total row */}
            <tr style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}>
              <td className="px-3 py-2">
                <span className="text-xs font-bold" style={{ color: 'var(--foreground, #e0e0e0)' }}>Total</span>
              </td>
              <td className="px-3 py-2">
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                  {formatTokens(totalTokensIn)}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                  {formatTokens(totalTokensOut)}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="text-xs font-mono font-bold" style={{ color: totalCacheTokens > 0 ? '#22C55E' : '#6b7280' }}>
                  {formatTokens(totalCacheTokens)}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent, #00aaff)' }}>
                  {formatCost(totalCost)}
                </span>
              </td>
              {showActualCostColumn && (
                <td className="px-3 py-2">
                  <span className="text-xs font-mono font-bold" style={{ color: '#F59E0B' }}>
                    {formatCost(totalActualCostUsd!)}
                  </span>
                </td>
              )}
              <td className="px-3 py-2" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section detail (collapsible) */}
      {sections && sections.length > 0 && (
        <div style={{ borderTop: '1px solid var(--card-border, #2a2a3a)' }}>
          <button
            onClick={() => setShowSectionDetail(!showSectionDetail)}
            className="w-full px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
              Phase 1 Detail ({sections.length} sections)
            </span>
            <svg
              className="w-3 h-3 transition-transform"
              style={{ color: '#6b7280', transform: showSectionDetail ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showSectionDetail && (
            <div className="px-3 pb-3">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
                    {['Section', 'Tokens In', 'Tokens Out', 'Cache', 'Cost'].map((h) => (
                      <th key={h} className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s) => {
                    const sectionCache = (s.tokens.cacheCreation ?? 0) + (s.tokens.cacheRead ?? 0);
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--card-border, #2a2a3a)' }}>
                        <td className="px-2 py-1">
                          <span className="text-[11px] font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>{s.id}</span>
                        </td>
                        <td className="px-2 py-1">
                          <span className="text-[11px] font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                            {formatTokens(s.tokens.input)}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <span className="text-[11px] font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                            {formatTokens(s.tokens.output)}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <span className="text-[11px] font-mono" style={{ color: sectionCache > 0 ? '#22C55E' : '#6b7280' }}>
                            {formatTokens(sectionCache)}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <span className="text-[11px] font-mono" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                            {formatCost(s.costUsd)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cost distribution bar chart */}
      {activePhaseCosts.length > 0 && (
        <div className="px-3 py-3" style={{ borderTop: '1px solid var(--card-border, #2a2a3a)' }}>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
            Cost Distribution
          </p>
          <div className="space-y-1.5">
            {activePhaseCosts.map((p) => {
              const pct = (p.costUsd / maxCost) * 100;
              return (
                <div key={p.phase} className="flex items-center gap-2">
                  <span className="text-[10px] w-16 text-right flex-shrink-0" style={{ color: '#6b7280' }}>
                    {PHASE_LABELS[p.phase]}
                  </span>
                  <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ backgroundColor: 'var(--surface, #1a1a2a)' }}>
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: 'var(--accent, #00aaff)',
                        minWidth: '2px',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-14 text-right flex-shrink-0" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                    {formatCost(p.costUsd)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D. Burn Rate Sparkline */}
      {burnRate && burnRate.dataPoints.length >= 2 && (
        <BurnRateSparkline burnRate={burnRate} />
      )}
    </div>
  );
}
