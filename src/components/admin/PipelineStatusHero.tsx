'use client';

import { motion } from 'framer-motion';
import type { PipelineState, Escalation, EscalationType, PipelinePhase } from '@/lib/pipeline/types';

/**
 * Single, prominent "what's happening / what should I do" banner at the top
 * of the pipeline detail page. Translates raw state (currentPhase, status,
 * activeEscalation) into one sentence + a recommended action.
 *
 * Hands-off principle: if no admin action is required, the hero says so
 * clearly ("Running — nothing to do") and the rest of the page is just
 * passive monitoring. The admin only has to scan THIS component to know
 * whether to dig deeper.
 *
 * Status tone:
 *   - GREEN  → healthy, nothing required
 *   - BLUE   → running or waiting on a planned hand-off (contractor review)
 *   - AMBER  → action required, recoverable, often single-click
 *   - RED    → genuine fault — pipeline halted unrecoverably without admin
 */

const PHASE_LABELS: Record<string, string> = {
  'phase-preflight': 'Preflight',
  'phase-0-diagram-parser': 'Diagram Parser',
  'phase-0-gatekeeper': 'Gatekeeper',
  'phase-0-layout-engine': 'Layout Engine',
  'phase-0-post-editor-check': 'ID Check',
  'phase-4-extraction': 'Manual Extraction',
  'phase-4-audit': 'Coverage Audit',
  'phase-5-display-build': 'Display Build',
  'phase-5-tutorial-build': 'Tutorial Build',
  'tutorial-pr': 'Tutorial PR',
};

type Tone = 'green' | 'blue' | 'amber' | 'red';

interface HeroState {
  tone: Tone;
  icon: string;
  headline: string;
  subtext?: string;
  /** What admin should do next, if anything. */
  action?: {
    label: string;
    handler: 'send-to-contractor' | 'pull-and-build' | 'resolve' | 'open-editor' | 'view-logs' | 'reset-editor' | 'publish';
    /** Resolution string to pass to onResolve, for handler='resolve'. */
    resolution?: string;
    variant?: 'primary' | 'secondary' | 'danger';
  };
  /** Secondary, less-prominent action. */
  secondaryAction?: {
    label: string;
    handler: 'send-to-contractor' | 'pull-and-build' | 'resolve' | 'open-editor' | 'view-logs' | 'reset-editor' | 'publish';
    resolution?: string;
  };
}

const TONE_STYLES: Record<Tone, { bg: string; border: string; iconBg: string; iconColor: string }> = {
  green: {
    bg: 'rgba(34, 197, 94, 0.08)',
    border: '#22c55e',
    iconBg: 'rgba(34, 197, 94, 0.18)',
    iconColor: '#4ade80',
  },
  blue: {
    bg: 'rgba(59, 130, 246, 0.08)',
    border: '#3b82f6',
    iconBg: 'rgba(59, 130, 246, 0.18)',
    iconColor: '#60a5fa',
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.08)',
    border: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.18)',
    iconColor: '#fbbf24',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: '#ef4444',
    iconBg: 'rgba(239, 68, 68, 0.18)',
    iconColor: '#f87171',
  },
};

function deriveState(pipeline: PipelineState, escalation?: Escalation): HeroState {
  const currentPhaseLabel = PHASE_LABELS[pipeline.currentPhase as string] ?? pipeline.currentPhase;

  // ── Completed / failed are terminal states ──────────────────────────────
  if (pipeline.status === 'completed') {
    return {
      tone: 'green',
      icon: '✓',
      headline: 'Build complete — ready to preview',
      subtext: 'Tutorials and panel are built. Preview in browser, then flip the publish flag when ready.',
      action: { label: 'Publish to home page', handler: 'publish', variant: 'primary' },
    };
  }
  if (pipeline.status === 'failed') {
    return {
      tone: 'red',
      icon: '!',
      headline: 'Pipeline failed',
      subtext: 'An unrecoverable error halted the pipeline. Check the logs to diagnose, then reset or restart.',
      action: { label: 'View logs', handler: 'view-logs', variant: 'secondary' },
    };
  }

  // ── Active escalations get specific guidance ────────────────────────────
  if (escalation) {
    return deriveEscalationState(escalation, pipeline);
  }

  // ── Running, no escalation — healthy active state ───────────────────────
  if (pipeline.status === 'running') {
    return {
      tone: 'blue',
      icon: '◐',
      headline: `Running ${currentPhaseLabel}`,
      subtext: 'Pipeline is processing. Nothing for you to do — check back when it pauses or completes.',
    };
  }

  // ── Paused, no escalation — pipeline at a quiet wait state ──────────────
  // (rare — usually a paused pipeline has an active escalation; this is the
  // residual fallback)
  if (pipeline.status === 'paused') {
    return {
      tone: 'amber',
      icon: '⏸',
      headline: `Paused at ${currentPhaseLabel}`,
      subtext: 'No active escalation. Likely awaiting manual resume. Check logs for the last action.',
      action: { label: 'View logs', handler: 'view-logs', variant: 'secondary' },
    };
  }

  // ── Pending / not started ──────────────────────────────────────────────
  return {
    tone: 'blue',
    icon: '○',
    headline: `Ready to start`,
    subtext: 'Upload a manual and kick off the pipeline.',
  };
}

function deriveEscalationState(esc: Escalation, _pipeline: PipelineState): HeroState {
  const type = esc.type as EscalationType;

  switch (type) {
    case 'editor-ready':
      return {
        tone: 'blue',
        icon: '◇',
        headline: 'Ready to send to contractor',
        subtext: 'Layout engine produced a manifest. Send it to the contractor for visual review and edits.',
        action: { label: 'Send to contractor', handler: 'send-to-contractor', variant: 'primary' },
      };

    case 'control-id-validation-failed':
      // After auto-repair wiring lands, most cases here will be self-resolving.
      // Until then, this is informational + suggests opening the editor.
      return {
        tone: 'amber',
        icon: '⚠',
        headline: 'Manifest has structural issues',
        subtext: 'Most issues are auto-resolved on the next contractor save. Open the editor to inspect and fix, or click "Retry" once resolved.',
        action: { label: 'Open editor', handler: 'open-editor', variant: 'primary' },
        secondaryAction: { label: 'Retry validation', handler: 'resolve', resolution: 'retry' },
      };

    case 'template-review':
      return {
        tone: 'blue',
        icon: '◇',
        headline: 'Layout templates ready for review',
        subtext: 'The layout engine has proposed templates. Review on the Layout tab below, then approve or request changes.',
        action: { label: 'Approve templates', handler: 'resolve', resolution: 'approved', variant: 'primary' },
        secondaryAction: { label: 'Request changes', handler: 'resolve', resolution: 'changes-requested' },
      };

    case 'curriculum-review':
      return {
        tone: 'blue',
        icon: '◇',
        headline: 'Tutorial plan ready for review',
        subtext: 'The extractor proposed a curriculum. Review the plan below, then approve to start building tutorials.',
        action: { label: 'Approve plan', handler: 'resolve', resolution: 'approved', variant: 'primary' },
        secondaryAction: { label: 'Request changes', handler: 'resolve', resolution: 'changes-requested' },
      };

    case 'budget-exceeded':
      return {
        tone: 'amber',
        icon: '$',
        headline: 'Budget cap reached',
        subtext: 'Pipeline paused to prevent runaway spend. Increase the budget to continue, or cancel.',
        action: { label: 'Increase budget', handler: 'resolve', resolution: 'increase-budget', variant: 'primary' },
        secondaryAction: { label: 'Cancel pipeline', handler: 'resolve', resolution: 'cancel' },
      };

    case 'manual-not-found':
      return {
        tone: 'amber',
        icon: '↑',
        headline: 'Manual PDF needed',
        subtext: 'Pipeline is waiting on the source manual. Upload it to continue.',
        action: { label: 'Upload manual', handler: 'resolve', resolution: 'upload-manual', variant: 'primary' },
      };

    case 'two-strike-halt':
      return {
        tone: 'red',
        icon: '!',
        headline: 'Agent failed twice — needs manual review',
        subtext: esc.message,
        action: { label: 'Manual review', handler: 'view-logs', variant: 'primary' },
        secondaryAction: { label: 'Cancel pipeline', handler: 'resolve', resolution: 'cancel' },
      };

    case 'agent-failure':
    case 'topology-deadlock':
    case 'physical-impossibility':
    case 'geometric-mismatch':
      return {
        tone: 'red',
        icon: '!',
        headline: titleCase(type),
        subtext: esc.message,
        action: { label: 'Retry', handler: 'resolve', resolution: 'retry', variant: 'primary' },
        secondaryAction: { label: 'View logs', handler: 'view-logs' },
      };

    default:
      return {
        tone: 'amber',
        icon: '⚠',
        headline: titleCase(esc.type),
        subtext: esc.message,
        action: { label: 'Resolve', handler: 'resolve', resolution: 'resolved', variant: 'primary' },
      };
  }
}

function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PipelineStatusHeroProps {
  pipeline: PipelineState;
  activeEscalation?: Escalation;
  onResolve: (escalationId: string, resolution: string) => void;
  onSendToContractor: () => void;
  onPullAndBuild: () => void;
  onResetToEditor: () => void;
}

export default function PipelineStatusHero({
  pipeline,
  activeEscalation,
  onResolve,
  onSendToContractor,
  onPullAndBuild,
  onResetToEditor,
}: PipelineStatusHeroProps) {
  const state = deriveState(pipeline, activeEscalation);
  const palette = TONE_STYLES[state.tone];

  const handleAction = (handler: HeroState['action'] extends infer A ? A extends { handler: infer H } ? H : never : never, resolution?: string) => {
    switch (handler) {
      case 'send-to-contractor':
        onSendToContractor();
        break;
      case 'pull-and-build':
        onPullAndBuild();
        break;
      case 'reset-editor':
        onResetToEditor();
        break;
      case 'resolve':
        if (activeEscalation && resolution) {
          onResolve(activeEscalation.id, resolution);
        }
        break;
      case 'open-editor':
        window.open(`/editor/${pipeline.deviceId}`, '_blank');
        break;
      case 'view-logs':
        // Logs are below — scroll to them
        document.querySelector('[data-section="logs"]')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'publish':
        // Surface the manual step — toggling `available: true` in src/data/devices.ts
        alert(
          `To publish "${pipeline.deviceName}" to the home page:\n\n` +
          `1. Open src/data/devices.ts\n` +
          `2. Set available: true on the "${pipeline.deviceId}" entry\n` +
          `3. Commit + push to test → owner merges test → main`
        );
        break;
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="rounded-xl px-5 py-4"
      style={{
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon badge */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: palette.iconBg, color: palette.iconColor }}
        >
          {state.icon}
        </div>

        {/* Headline + subtext */}
        <div className="flex-1 min-w-0">
          <h2
            className="text-base font-semibold leading-snug"
            style={{ color: 'var(--foreground, #e0e0e0)' }}
          >
            {state.headline}
          </h2>
          {state.subtext && (
            <p
              className="text-xs mt-1 leading-relaxed max-w-2xl"
              style={{ color: '#9ca3af' }}
            >
              {state.subtext}
            </p>
          )}
        </div>

        {/* Actions (column, primary on top) */}
        {(state.action || state.secondaryAction) && (
          <div className="flex-shrink-0 flex flex-col gap-2 min-w-[160px]">
            {state.action && (
              <button
                onClick={() => handleAction(state.action!.handler, state.action!.resolution)}
                className="text-xs px-3 py-2 rounded font-medium transition-opacity hover:opacity-85"
                style={{
                  backgroundColor: state.action.variant === 'danger' ? '#ef4444'
                    : state.action.variant === 'secondary' ? 'var(--surface, #1a1a2a)'
                    : palette.border,
                  color: state.action.variant === 'secondary' ? 'var(--foreground, #e0e0e0)' : '#ffffff',
                }}
              >
                {state.action.label}
              </button>
            )}
            {state.secondaryAction && (
              <button
                onClick={() => handleAction(state.secondaryAction!.handler, state.secondaryAction!.resolution)}
                className="text-xs px-3 py-2 rounded font-medium transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #374151',
                }}
              >
                {state.secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Phase / cost rail — subtle context */}
      <div
        className="mt-3 pt-3 flex items-center gap-4 text-[11px]"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#6b7280' }}
      >
        <span>
          Phase: <span style={{ color: 'var(--foreground, #e0e0e0)' }}>{PHASE_LABELS[pipeline.currentPhase as string] ?? pipeline.currentPhase}</span>
        </span>
        <span>•</span>
        <span>
          Cost: <span style={{ color: 'var(--foreground, #e0e0e0)' }}>${(pipeline.totalCostUsd ?? 0).toFixed(2)}</span>
          {pipeline.budgetCapUsd > 0 && (
            <span style={{ color: '#6b7280' }}> / ${pipeline.budgetCapUsd.toFixed(0)}</span>
          )}
        </span>
        <span>•</span>
        <span>
          Status: <span style={{ color: 'var(--foreground, #e0e0e0)' }}>{pipeline.status}</span>
        </span>
      </div>
    </motion.div>
  );
}
