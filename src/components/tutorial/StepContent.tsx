'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialStep } from '@/types/tutorial';

interface StepContentProps {
  step: TutorialStep;
}

export default function StepContent({ step }: StepContentProps) {
  const [showDetails, setShowDetails] = useState(true);

  // Reset details when step changes (default to expanded)
  useEffect(() => {
    setShowDetails(true);
  }, [step.id]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="max-w-[800px] mx-auto px-6 py-6"
      >
        {/* Title */}
        <h3 className="text-3xl font-bold text-white leading-snug mb-3">
          {step.title}
        </h3>

        {/* Instruction */}
        <p className="text-xl text-white/75 leading-relaxed mb-3">
          {step.instruction}
        </p>

        {/* Expandable details */}
        {step.details && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-base text-white/75 hover:text-white transition-colors cursor-pointer"
            >
              <motion.svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ rotate: showDetails ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path d="M9 18l6-6-6-6" />
              </motion.svg>
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="text-base text-white/75 leading-relaxed mt-2 overflow-hidden"
                >
                  {step.details}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Tip box */}
        {step.tipText && (
          <div
            className="rounded-lg px-4 py-3 border"
            style={{
              background: 'rgba(0, 170, 255, 0.08)',
              borderColor: 'rgba(0, 170, 255, 0.2)',
            }}
          >
            <p className="text-base text-[#66ccff] leading-relaxed">
              <span className="font-semibold text-[#00aaff]">Tip: </span>
              {step.tipText}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
