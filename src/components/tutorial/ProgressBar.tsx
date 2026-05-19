'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  steps: number;
  currentStep: number;
  /**
   * When provided, dots become clickable and call this with the
   * 0-indexed step. Used by the admin review canvas for god-mode jump
   * navigation. End-user `/tutorial/<id>` page omits this prop, so dots
   * remain decorative (their UX is sequential prev/next).
   */
  onStepClick?: (index: number) => void;
}

export default function ProgressBar({
  progress,
  steps,
  currentStep,
  onStepClick,
}: ProgressBarProps) {
  const clickable = typeof onStepClick === 'function';
  return (
    <div className="relative w-full h-2 bg-white/10 rounded-full overflow-visible">
      {/* Fill bar */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #0077cc, #00aaff)',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Step dots */}
      {Array.from({ length: steps }).map((_, i) => {
        const dotPosition = ((i + 1) / steps) * 100;
        const isCompleted = i <= currentStep;
        const dotClass = [
          'w-2.5 h-2.5 rounded-full border transition-colors duration-300',
          isCompleted
            ? 'bg-[#00aaff] border-[#00ccff]'
            : 'bg-white/10 border-white/20',
        ].join(' ');

        return (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${dotPosition}%` }}
          >
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick!(i)}
                aria-label={`Go to step ${i + 1}`}
                data-testid={`progress-dot-${i}`}
                className="cursor-pointer p-1 -m-1 hover:scale-125 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00aaff] rounded-full"
              >
                <div className={dotClass} />
              </button>
            ) : (
              <div data-testid={`progress-dot-${i}`} className={dotClass} />
            )}
          </div>
        );
      })}
    </div>
  );
}
