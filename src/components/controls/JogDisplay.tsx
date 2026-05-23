'use client';

import { motion } from 'framer-motion';
import type { DisplayState } from '@/types/display';
import DisplayContent from './DisplayContent';

interface JogDisplayProps {
  id: string;
  label?: string;
  size?: number;
  highlighted?: boolean;
  showMockContent?: boolean;
  /**
   * Tutorial-driven display state. When present, replaces the mock album-art
   * + time content with rendered tutorial content (status, menu, etc.) via
   * DisplayContent. When undefined, falls back to showMockContent behavior —
   * preserves existing CDJ-3000 jog wheel preview unchanged.
   */
  displayState?: DisplayState;
}

const highlightAnimation = {
  animate: {
    boxShadow: [
      '0 0 8px 2px rgba(0,170,255,0.4)',
      '0 0 20px 8px rgba(0,170,255,0.8)',
      '0 0 8px 2px rgba(0,170,255,0.4)',
    ],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export default function JogDisplay({
  id,
  label,
  size = 80,
  highlighted = false,
  showMockContent = false,
  displayState,
}: JogDisplayProps) {
  const showTutorialContent = displayState !== undefined;
  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      <motion.div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          background: '#0a0a14',
          border: '3px solid #2a2a2a',
          boxShadow:
            'inset 0 2px 8px rgba(0,0,0,0.8), inset 0 -1px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04)',
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {showTutorialContent && (
          // Pass inner display dimensions (size minus border) for proportional font sizing.
          <DisplayContent displayState={displayState!} width={Math.max(8, size - 6)} height={Math.max(8, size - 6)} />
        )}

        {showMockContent && !showTutorialContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Album art placeholder circle */}
            <div
              className="rounded-full"
              style={{
                width: size * 0.45,
                height: size * 0.45,
                background: 'radial-gradient(circle, #1a2040 0%, #0c0c1a 100%)',
                border: '1px solid rgba(80,120,200,0.2)',
              }}
            />
            {/* Time text */}
            <span
              style={{
                fontSize: size * 0.12,
                color: 'rgba(150,180,220,0.6)',
                fontFamily: 'monospace',
                marginTop: size * 0.04,
                userSelect: 'none',
              }}
            >
              00:00.0
            </span>
          </div>
        )}
      </motion.div>

      {label && (
        <span className="text-[8px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
