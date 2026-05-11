'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

type HandlerKind =
  | 'send-to-contractor'
  | 'pull-and-build'
  | 'resolve'
  | 'open-editor'
  | 'view-logs'
  | 'reset-editor'
  | 'publish';

interface HeroAction {
  label: string;
  handler: HandlerKind;
  /** Resolution string to pass to onResolve, for handler='resolve'. */
  resolution?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Plain-English description shown in the expanded "Details" panel —
   *  tells the admin what clicking this button actually does. */
  description?: string;
}

interface HeroDetails {
  /** What is actually wrong? Renders under "WHAT'S WRONG" heading. */
  whatsWrong?: string;
  /** Specific findings extracted from the escalation message. Each line
   *  becomes a bullet. */
  findings?: string[];
  /** Optional note about when this self-resolves so admin knows whether
   *  to act now or wait. */
  autoResolveNote?: string;
}

interface HeroState {
  tone: Tone;
  icon: string;
  headline: string;
  subtext?: string;
  action?: HeroAction;
  secondaryAction?: HeroAction;
  details?: HeroDetails;
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
      subtext: 'Tutorials and panel are built.',
      action: {
        label: 'Publish to home page',
        handler: 'publish',
        variant: 'primary',
        description:
          'Shows the instructions to flip the `available: true` flag in src/data/devices.ts. After commit + push + merge, the device appears on the home page.',
      },
      details: {
        whatsWrong: 'Nothing wrong — pipeline finished successfully. Test the panel + tutorials in your browser before publishing.',
        autoResolveNote:
          'Publishing is a manual step by design (gate before exposing to users). To preview without publishing, visit /devices/<deviceId> or /tutorial/<deviceId>/<tutorialId> directly — they work even when `available: false`.',
      },
    };
  }
  if (pipeline.status === 'failed') {
    return {
      tone: 'red',
      icon: '!',
      headline: 'Pipeline failed',
      subtext: 'An unrecoverable error halted the pipeline.',
      action: {
        label: 'View logs',
        handler: 'view-logs',
        variant: 'secondary',
        description: 'Scrolls to the Activity log so you can find the root cause and decide whether to reset or restart.',
      },
      details: {
        whatsWrong: 'Pipeline status is `failed` — no active escalation to act on. The most recent error is in the Activity log.',
        autoResolveNote: 'Will not auto-resolve. Reset the pipeline (via DiagnosticsPanel) or kick off a new run.',
      },
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
      subtext: 'Pipeline is processing.',
      details: {
        whatsWrong: 'Nothing wrong — work in progress. The Activity log shows live agent output. The pipeline will either pause (asking for input) or complete on its own.',
        autoResolveNote: 'Will auto-advance through phases. You only need to act if a phase pauses with an escalation.',
      },
    };
  }

  // ── Paused, no escalation — pipeline at a quiet wait state ──────────────
  if (pipeline.status === 'paused') {
    return {
      tone: 'amber',
      icon: '⏸',
      headline: `Paused at ${currentPhaseLabel}`,
      subtext: 'No active escalation. Likely awaiting manual resume.',
      action: {
        label: 'View logs',
        handler: 'view-logs',
        variant: 'secondary',
        description: 'Scrolls to the Activity log so you can see the last action and decide next steps.',
      },
      details: {
        whatsWrong: 'Status is `paused` but no escalation is queued. This is unusual — likely the runner was stopped manually, or an escalation was already resolved without an auto-resume.',
        autoResolveNote: 'Will not auto-resolve. Inspect logs, then resume via the diagnostics panel or restart.',
      },
    };
  }

  // ── Pending / not started ──────────────────────────────────────────────
  return {
    tone: 'blue',
    icon: '○',
    headline: `Ready to start`,
    subtext: 'Upload a manual and kick off the pipeline.',
    details: {
      whatsWrong: 'Pipeline has not been started yet. Upload the source manual PDF first; the pipeline will then auto-progress through all phases.',
    },
  };
}

/** Pull bullet-style findings out of an escalation.message. Most escalations
 *  produced by the pipeline include a "  [CODE] description" block per finding. */
function extractFindings(message: string): string[] {
  return message
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\[[A-Z_]+\]/.test(l) || /^\s*•/.test(l))
    .slice(0, 20); // safety cap; not paginated yet
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
        action: {
          label: 'Send to contractor',
          handler: 'send-to-contractor',
          variant: 'primary',
          description:
            'Uploads the current manifest and reference photos to Vercel Blob. The contractor sees the panel in their editor (URL + password). They edit, submit for review, and you see their submission on the /admin dashboard.',
        },
        details: {
          whatsWrong: 'Nothing wrong — this is a planned hand-off, not an error.',
          autoResolveNote:
            'This step is manual by design. Only you decide when the layout is ready to hand off.',
        },
      };

    case 'control-id-validation-failed':
      return {
        tone: 'amber',
        icon: '⚠',
        headline: 'Manifest has structural issues',
        subtext: 'The post-editor validator found cross-reference problems. Most are trivially fixable.',
        action: {
          label: 'Open editor',
          handler: 'open-editor',
          variant: 'primary',
          description:
            'Opens the panel editor in a new tab. The Layers panel will surface any orphaned labels, containers, or groups so you can delete or re-link them. Save when done.',
        },
        secondaryAction: {
          label: 'Retry validation',
          handler: 'resolve',
          resolution: 'retry',
          description:
            'Re-runs the post-editor check against the current manifest on disk. Click this after you (or auto-repair) have fixed the issues. If the same problems persist, this details panel will show them again.',
        },
        details: {
          whatsWrong:
            `Cross-reference integrity check failed. The validator found references (in labels, containers, group labels, or section.childIds) that point at controls or sections that don't exist in the manifest.`,
          findings: extractFindings(esc.message),
          autoResolveNote:
            'Once the Tier 4 auto-repair wiring ships (PR #106 follow-up), these orphan references will be silently cleaned on the next contractor save — pipeline will resume without admin action. For now, manual editor fix or pipeline reset is needed.',
        },
      };

    case 'template-review':
      return {
        tone: 'blue',
        icon: '◇',
        headline: 'Layout templates ready for review',
        subtext: 'The layout engine has proposed section templates. Review on the Layout tab below.',
        action: {
          label: 'Approve templates',
          handler: 'resolve',
          resolution: 'approved',
          variant: 'primary',
          description:
            'Accepts the proposed templates as-is and unblocks the pipeline to advance to the next phase.',
        },
        secondaryAction: {
          label: 'Request changes',
          handler: 'resolve',
          resolution: 'changes-requested',
          description:
            'Marks the templates as needing revision. The pipeline halts here until you regenerate or hand-edit and re-trigger.',
        },
        details: {
          whatsWrong: 'Nothing wrong — this is a quality gate. Review the proposed templates on the Layout tab before approving.',
          autoResolveNote: 'This step is a manual quality gate by design.',
        },
      };

    case 'curriculum-review':
      return {
        tone: 'blue',
        icon: '◇',
        headline: 'Tutorial plan ready for review',
        subtext: 'The extractor proposed a curriculum. Review the plan, then approve to start building.',
        action: {
          label: 'Approve plan',
          handler: 'resolve',
          resolution: 'approved',
          variant: 'primary',
          description: 'Accepts the curriculum and unblocks the tutorial-build phase.',
        },
        secondaryAction: {
          label: 'Request changes',
          handler: 'resolve',
          resolution: 'changes-requested',
          description: 'Pipeline halts; you regenerate or edit the curriculum and re-trigger.',
        },
        details: {
          whatsWrong: 'Nothing wrong — manual approval gate before building 30+ tutorials.',
          autoResolveNote: 'Manual gate by design.',
        },
      };

    case 'budget-exceeded':
      return {
        tone: 'amber',
        icon: '$',
        headline: 'Budget cap reached',
        subtext: 'Pipeline paused to prevent runaway spend.',
        action: {
          label: 'Increase budget',
          handler: 'resolve',
          resolution: 'increase-budget',
          variant: 'primary',
          description:
            'Raises the budget cap (you set the new value in the prompt) and resumes the pipeline.',
        },
        secondaryAction: {
          label: 'Cancel pipeline',
          handler: 'resolve',
          resolution: 'cancel',
          description: 'Terminates the run permanently. Logs and partial outputs are preserved.',
        },
        details: {
          whatsWrong: esc.message || 'The pipeline accrued more cost than the configured cap allows.',
          autoResolveNote: 'Will not auto-resolve. You must explicitly raise the cap or cancel.',
        },
      };

    case 'manual-not-found':
      return {
        tone: 'amber',
        icon: '↑',
        headline: 'Manual PDF needed',
        subtext: 'Pipeline is waiting on the source manual.',
        action: {
          label: 'Upload manual',
          handler: 'resolve',
          resolution: 'upload-manual',
          variant: 'primary',
          description: 'Opens the upload dialog. After upload, the pipeline resumes automatically.',
        },
        details: {
          whatsWrong: esc.message || 'No PDF was found at the expected location.',
          autoResolveNote: 'Will not auto-resolve. The pipeline cannot proceed without the source manual.',
        },
      };

    case 'two-strike-halt':
      return {
        tone: 'red',
        icon: '!',
        headline: 'Agent failed twice — needs manual review',
        subtext: 'The same agent failed validation on retry. Manual diagnosis required before proceeding.',
        action: {
          label: 'Manual review',
          handler: 'view-logs',
          variant: 'primary',
          description: 'Scrolls to the Activity log so you can see what the agent attempted on both passes.',
        },
        secondaryAction: {
          label: 'Cancel pipeline',
          handler: 'resolve',
          resolution: 'cancel',
          description: 'Terminates the run. Logs are preserved for later inspection.',
        },
        details: {
          whatsWrong: esc.message,
          autoResolveNote: 'Will not auto-resolve. Two-strike rule means the agent is unable to recover without changes to the prompt, manual, or upstream artifacts.',
        },
      };

    case 'agent-failure':
    case 'topology-deadlock':
    case 'physical-impossibility':
    case 'geometric-mismatch':
      return {
        tone: 'red',
        icon: '!',
        headline: titleCase(type),
        subtext: esc.message.split('\n')[0],
        action: {
          label: 'Retry',
          handler: 'resolve',
          resolution: 'retry',
          variant: 'primary',
          description: 'Re-runs the failed agent with the same inputs. Use if you believe the failure was transient (e.g., network blip).',
        },
        secondaryAction: {
          label: 'View logs',
          handler: 'view-logs',
          description: 'Scrolls to the Activity log to see what the agent saw and why it failed.',
        },
        details: {
          whatsWrong: esc.message,
          findings: extractFindings(esc.message),
          autoResolveNote: 'Will not auto-resolve. If retry fails, deeper investigation (prompt, manual, upstream artifacts) is required.',
        },
      };

    default:
      return {
        tone: 'amber',
        icon: '⚠',
        headline: titleCase(esc.type),
        subtext: esc.message.split('\n')[0],
        action: {
          label: 'Resolve',
          handler: 'resolve',
          resolution: 'resolved',
          variant: 'primary',
          description: 'Marks the escalation as resolved and resumes the pipeline.',
        },
        details: {
          whatsWrong: esc.message,
          findings: extractFindings(esc.message),
        },
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
  const [showDetails, setShowDetails] = useState(false);

  const handleAction = (handler: HandlerKind, resolution?: string) => {
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
        // Fetch the current inventory count first so admin sees pending review
        // items before committing to publish. Inventory now powers the
        // "review before flipping the available flag" gate.
        fetch('/api/admin/attention-items', { cache: 'no-store' })
          .then((r) => r.json())
          .then((data: { unreviewed?: number; counts?: Record<string, number> }) => {
            const unreviewed = data?.unreviewed ?? 0;
            const high = (data?.counts?.high ?? 0) + (data?.counts?.critical ?? 0);
            const heads = unreviewed > 0
              ? `⚠ ${unreviewed} unreviewed inventory item${unreviewed === 1 ? '' : 's'}` +
                (high > 0 ? ` (${high} high+) — review on /admin before publishing.\n\n` : '.\n\n')
              : '✓ Attention inventory is clear.\n\n';
            alert(
              `${heads}` +
              `To publish "${pipeline.deviceName}" to the home page:\n\n` +
              `1. Open src/data/devices.ts\n` +
              `2. Set available: true on the "${pipeline.deviceId}" entry\n` +
              `3. Commit + push to test → owner merges test → main`,
            );
          })
          .catch(() => {
            // Network failure — fall back to the original message
            alert(
              `To publish "${pipeline.deviceName}" to the home page:\n\n` +
              `1. Open src/data/devices.ts\n` +
              `2. Set available: true on the "${pipeline.deviceId}" entry\n` +
              `3. Commit + push to test → owner merges test → main`,
            );
          });
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

        {/* Headline + subtext + "Show details" disclosure trigger */}
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
          {state.details && (
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="mt-2 text-[11px] font-medium inline-flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: palette.iconColor }}
              aria-expanded={showDetails}
            >
              {showDetails ? 'Hide details' : 'Show details'}
              <span className="text-[9px]">{showDetails ? '▲' : '▼'}</span>
            </button>
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

      {/* Expanded details — what's wrong, what each button does, when it resolves */}
      <AnimatePresence initial={false}>
        {showDetails && state.details && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="mt-4 pt-4 space-y-4 text-xs"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* What's wrong */}
              {state.details.whatsWrong && (
                <div>
                  <h3
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: '#9ca3af' }}
                  >
                    What's happening
                  </h3>
                  <p className="leading-relaxed" style={{ color: 'var(--foreground, #e0e0e0)' }}>
                    {state.details.whatsWrong}
                  </p>
                </div>
              )}

              {/* Specific findings list */}
              {state.details.findings && state.details.findings.length > 0 && (
                <div>
                  <h3
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: '#9ca3af' }}
                  >
                    Findings ({state.details.findings.length})
                  </h3>
                  <ul
                    className="space-y-1 rounded p-2 font-mono text-[11px]"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.25)',
                      color: '#d1d5db',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {state.details.findings.map((f, i) => (
                      <li key={i} className="leading-snug">{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What each action does */}
              {(state.action || state.secondaryAction) && (
                <div>
                  <h3
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: '#9ca3af' }}
                  >
                    What the actions do
                  </h3>
                  <ul className="space-y-2">
                    {state.action?.description && (
                      <li className="flex gap-2 leading-relaxed">
                        <span
                          className="font-medium flex-shrink-0"
                          style={{ color: palette.iconColor }}
                        >
                          {state.action.label}
                        </span>
                        <span style={{ color: '#d1d5db' }}>— {state.action.description}</span>
                      </li>
                    )}
                    {state.secondaryAction?.description && (
                      <li className="flex gap-2 leading-relaxed">
                        <span
                          className="font-medium flex-shrink-0"
                          style={{ color: '#9ca3af' }}
                        >
                          {state.secondaryAction.label}
                        </span>
                        <span style={{ color: '#d1d5db' }}>— {state.secondaryAction.description}</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Auto-resolve note */}
              {state.details.autoResolveNote && (
                <div
                  className="rounded p-2.5"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderLeft: `2px solid ${palette.border}`,
                  }}
                >
                  <h3
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: palette.iconColor }}
                  >
                    Will it auto-resolve?
                  </h3>
                  <p className="leading-relaxed" style={{ color: '#d1d5db' }}>
                    {state.details.autoResolveNote}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase / status rail — subtle context */}
      <div
        className="mt-3 pt-3 flex items-center gap-4 text-[11px]"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#6b7280' }}
      >
        <span>
          Phase: <span style={{ color: 'var(--foreground, #e0e0e0)' }}>{PHASE_LABELS[pipeline.currentPhase as string] ?? pipeline.currentPhase}</span>
        </span>
        <span>•</span>
        <span>
          Status: <span style={{ color: 'var(--foreground, #e0e0e0)' }}>{pipeline.status}</span>
        </span>
      </div>
    </motion.div>
  );
}
