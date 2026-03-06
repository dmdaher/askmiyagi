'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tutorial } from '@/types/tutorial';

interface TutorialIntroModalProps {
  tutorial: Tutorial | null;
  onStart: () => void;
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
  intermediate: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  advanced: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
};

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 14h20" />
        <path d="M6 18v2" />
        <path d="M18 18v2" />
      </svg>
    ),
    title: 'Interactive Panel',
    description: 'Your instrument updates live as you follow each step.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Highlighted Controls',
    description: 'Glowing controls show exactly which buttons, knobs, and sliders to look at.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
        <path d="M9 18l6-6-6-6" transform="translate(6, 0)" />
      </svg>
    ),
    title: 'Step Navigation',
    description: 'Use the Previous and Next buttons to move through the tutorial at your own pace.',
  },
];

export default function TutorialIntroModal({ tutorial, onStart, onClose }: TutorialIntroModalProps) {
  useEffect(() => {
    if (!tutorial) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tutorial, onClose]);

  const difficultyStyle = tutorial
    ? DIFFICULTY_COLORS[tutorial.difficulty] ?? DIFFICULTY_COLORS.beginner
    : DIFFICULTY_COLORS.beginner;

  return (
    <AnimatePresence>
      {tutorial && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md mx-4 bg-[#12121f] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="px-6 pt-6 pb-5">
              {/* Title */}
              <h2 className="text-xl font-bold text-white pr-8">
                {tutorial.title}
              </h2>

              {/* Metadata badges */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  style={{
                    background: difficultyStyle.bg,
                    color: difficultyStyle.text,
                    border: `1px solid ${difficultyStyle.border}`,
                  }}
                >
                  {tutorial.difficulty}
                </span>
                <span className="text-xs text-white/40">
                  {tutorial.steps.length} steps
                </span>
                <span className="text-xs text-white/40">
                  {tutorial.estimatedTime}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6 border-t border-white/10" />

            {/* Features */}
            <div className="px-6 py-5 space-y-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <div className="flex-shrink-0 text-[#00aaff] mt-0.5">
                    {feature.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Start button */}
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={onStart}
                className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: 'var(--accent)' }}
              >
                Start Tutorial
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
