'use client';

import { motion } from 'framer-motion';
import type { Escalation, EscalationType } from '@/lib/pipeline/types';

interface EscalationBannerProps {
  escalation: Escalation;
  onResolve: (resolution: string) => void;
}

const ESCALATION_CONFIG: Record<
  EscalationType,
  { bg: string; border: string; buttons: { label: string; resolution: string; variant: 'primary' | 'secondary' | 'danger' }[]; hasLink?: boolean }
> = {
  'panel-pr-review': {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: '#f59e0b',
    hasLink: true,
    buttons: [{ label: 'I Approved', resolution: 'approved', variant: 'primary' }],
  },
  'topology-deadlock': {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    buttons: [
      { label: 'Retry', resolution: 'retry', variant: 'primary' },
      { label: 'Skip Section', resolution: 'skip-section', variant: 'secondary' },
      { label: 'Cancel Pipeline', resolution: 'cancel', variant: 'danger' },
    ],
  },
  'curriculum-review': {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: '#f59e0b',
    buttons: [
      { label: 'Approve Plan', resolution: 'approved', variant: 'primary' },
      { label: 'Request Changes', resolution: 'changes-requested', variant: 'secondary' },
    ],
  },
  'budget-exceeded': {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    buttons: [
      { label: 'Increase Budget', resolution: 'increase-budget', variant: 'primary' },
      { label: 'Cancel', resolution: 'cancel', variant: 'danger' },
    ],
  },
  'agent-failure': {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    buttons: [
      { label: 'Retry', resolution: 'retry', variant: 'primary' },
      { label: 'Cancel', resolution: 'cancel', variant: 'danger' },
    ],
  },
  'manual-not-found': {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: '#f59e0b',
    buttons: [
      { label: 'Upload Manual', resolution: 'upload-manual', variant: 'primary' },
      { label: 'Cancel', resolution: 'cancel', variant: 'danger' },
    ],
  },
  'geometric-mismatch': {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    buttons: [
      { label: 'Re-run Gatekeeper', resolution: 'retry', variant: 'primary' },
      { label: 'Cancel', resolution: 'cancel', variant: 'danger' },
    ],
  },
  'two-strike-halt': {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    buttons: [
      { label: 'Manual Review', resolution: 'manual-review', variant: 'primary' },
      { label: 'Cancel', resolution: 'cancel', variant: 'danger' },
    ],
  },
  'physical-impossibility': {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#ef4444',
    buttons: [
      { label: 'Fix & Retry', resolution: 'retry', variant: 'primary' },
      { label: 'Cancel Pipeline', resolution: 'cancel', variant: 'danger' },
    ],
  },
};

const BUTTON_STYLES: Record<string, { bg: string; text: string; hover: string }> = {
  primary: { bg: 'var(--accent, #00aaff)', text: '#ffffff', hover: '#0088cc' },
  secondary: { bg: 'var(--surface, #1a1a2a)', text: 'var(--foreground, #e0e0e0)', hover: '#252535' },
  danger: { bg: '#ef4444', text: '#ffffff', hover: '#dc2626' },
};

export default function EscalationBanner({ escalation, onResolve }: EscalationBannerProps) {
  const config = ESCALATION_CONFIG[escalation.type];

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="w-full rounded-lg px-4 py-3"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ backgroundColor: config.border, color: '#000000' }}
            >
              {escalation.type.replace(/-/g, ' ')}
            </span>
            <span className="text-[10px]" style={{ color: '#6b7280' }}>
              {new Date(escalation.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--foreground, #e0e0e0)' }}>
            {escalation.message}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {config.hasLink && escalation.prUrl && (
            <a
              href={escalation.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
              style={{
                backgroundColor: 'var(--surface, #1a1a2a)',
                color: 'var(--accent, #00aaff)',
                border: '1px solid var(--accent, #00aaff)',
              }}
            >
              View PR
            </a>
          )}

          {config.buttons.map((btn) => {
            const style = BUTTON_STYLES[btn.variant];
            return (
              <button
                key={btn.resolution}
                onClick={() => onResolve(btn.resolution)}
                className="text-xs px-3 py-1.5 rounded font-medium transition-opacity hover:opacity-80 cursor-pointer"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
