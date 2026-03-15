'use client';

import { motion } from 'framer-motion';
import type { PhaseResult, PipelinePhase } from '@/lib/pipeline/types';

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

const DISPLAY_PHASES: PipelinePhase[] = [
  'phase-preflight',
  'phase-0-gatekeeper',
  'phase-1-section-loop',
  'phase-2-global-assembly',
  'phase-3-harmonic-polish',
  'panel-pr',
  'phase-4-extraction',
  'phase-4-audit',
  'phase-5-tutorial-build',
  'tutorial-pr',
];

interface PhaseTimelineProps {
  phases: PhaseResult[];
  currentPhase: PipelinePhase;
}

export default function PhaseTimeline({ phases, currentPhase }: PhaseTimelineProps) {
  const phaseMap = new Map(phases.map((p) => [p.phase, p]));

  function getPhaseStatus(phase: PipelinePhase) {
    const result = phaseMap.get(phase);
    if (!result) return 'future';
    if (result.status === 'failed') return 'failed';
    if (result.status === 'passed' || result.status === 'skipped') return 'completed';
    if (phase === currentPhase) return 'current';
    return 'future';
  }

  function getPhaseScore(phase: PipelinePhase): number | null {
    return phaseMap.get(phase)?.score ?? null;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg p-4" style={{ backgroundColor: 'var(--card-bg, #141420)' }}>
      <div className="flex items-center justify-between min-w-[700px]">
        {DISPLAY_PHASES.map((phase, i) => {
          const status = getPhaseStatus(phase);
          const score = getPhaseScore(phase);
          const isLast = i === DISPLAY_PHASES.length - 1;

          return (
            <div key={phase} className="flex items-center flex-1 last:flex-none">
              {/* Phase node */}
              <div className="flex flex-col items-center min-w-[60px]">
                {/* Circle */}
                {status === 'current' ? (
                  <motion.div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: 'var(--accent, #00aaff)' }}
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(0, 170, 255, 0.3)',
                        '0 0 12px rgba(0, 170, 255, 0.7)',
                        '0 0 0px rgba(0, 170, 255, 0.3)',
                      ],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        status === 'completed'
                          ? 'var(--accent, #00aaff)'
                          : status === 'failed'
                            ? '#ef4444'
                            : 'var(--card-border, #2a2a3a)',
                    }}
                  />
                )}

                {/* Label */}
                <span
                  className="text-[10px] mt-1.5 text-center leading-tight"
                  style={{
                    color:
                      status === 'completed' || status === 'current'
                        ? 'var(--foreground, #e0e0e0)'
                        : status === 'failed'
                          ? '#ef4444'
                          : '#6b7280',
                  }}
                >
                  {PHASE_LABELS[phase]}
                </span>

                {/* Score */}
                {status === 'completed' && score !== null && (
                  <span className="text-[9px] font-mono" style={{ color: 'var(--accent, #00aaff)' }}>
                    {score.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-1">
                  <div
                    className="h-[2px] w-full"
                    style={{
                      backgroundColor:
                        status === 'completed'
                          ? 'var(--accent, #00aaff)'
                          : 'var(--card-border, #2a2a3a)',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
