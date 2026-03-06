'use client';

import { motion } from 'framer-motion';

interface NavigationControlsProps {
  onPrev: () => void;
  onNext: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  autoplay?: boolean;
  onToggleAutoplay?: () => void;
}

export default function NavigationControls({
  onPrev,
  onNext,
  isPrevDisabled,
  isNextDisabled,
  autoplay = false,
  onToggleAutoplay,
}: NavigationControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Back button */}
      <motion.button
        type="button"
        onClick={onPrev}
        disabled={isPrevDisabled}
        className={[
          'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium',
          'border transition-colors duration-150',
          isPrevDisabled
            ? 'border-white/10 text-white/30 cursor-not-allowed'
            : 'border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 cursor-pointer',
        ].join(' ')}
        whileTap={isPrevDisabled ? {} : { scale: 0.95 }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </motion.button>

      {/* Autoplay toggle */}
      {onToggleAutoplay && (
        <motion.button
          type="button"
          onClick={onToggleAutoplay}
          className={[
            'flex items-center gap-1.5 px-3 py-2 rounded-lg',
            'border transition-colors duration-150 cursor-pointer text-sm font-medium',
            autoplay
              ? 'border-[#00aaff]/40 bg-[#00aaff]/20 text-[#00ccff]'
              : 'border-white/20 text-white/60 hover:bg-white/10 hover:border-white/30',
          ].join(' ')}
          whileTap={{ scale: 0.92 }}
          aria-label={autoplay ? 'Pause autoplay' : 'Start autoplay'}
        >
          {autoplay ? (
            /* Pause icon */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            /* Play icon */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36A1 1 0 008 5.14z" />
            </svg>
          )}
          <span>Autoplay</span>
        </motion.button>
      )}

      {/* Next button */}
      <motion.button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className={[
          'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium',
          'border transition-colors duration-150',
          isNextDisabled
            ? 'border-white/10 text-white/30 cursor-not-allowed'
            : 'border-[#00aaff]/40 bg-[#00aaff]/15 text-[#00ccff] hover:bg-[#00aaff]/25 hover:border-[#00aaff]/60 cursor-pointer',
        ].join(' ')}
        whileTap={isNextDisabled ? {} : { scale: 0.95 }}
      >
        Next
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.button>
    </div>
  );
}
