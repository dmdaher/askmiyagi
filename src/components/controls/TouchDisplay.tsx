'use client';

import { motion } from 'framer-motion';

interface TouchDisplayProps {
  id: string;
  label?: string;
  variant?: 'main' | 'jog';
  bezelWidth?: number;
  showMockContent?: boolean;
  highlighted?: boolean;
  width?: number;
  height?: number;
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

export default function TouchDisplay({
  id,
  label,
  variant = 'main',
  bezelWidth = 5,
  showMockContent = false,
  highlighted = false,
  width = variant === 'main' ? 200 : 120,
  height = variant === 'main' ? 130 : 80,
}: TouchDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      <motion.div
        className="relative"
        style={{
          width,
          height,
          borderRadius: 6,
          background: '#222',
          border: `${bezelWidth}px solid #2a4a6a`,
          boxShadow:
            '0 4px 12px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.04)',
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Inner screen area */}
        <div
          className="absolute"
          style={{
            inset: 0,
            borderRadius: 2,
            background: '#0a1a2a',
            overflow: 'hidden',
          }}
        >
          {showMockContent && (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 200 130"
              preserveAspectRatio="none"
              style={{ opacity: 0.3 }}
            >
              {/* Mock waveform pattern */}
              <polyline
                points={Array.from({ length: 40 }, (_, i) => {
                  const x = (i / 39) * 200;
                  const y = 65 + Math.sin(i * 0.6) * 20 + Math.sin(i * 1.3) * 10;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3388ff"
                strokeWidth="1.5"
              />
              {/* Mirror waveform below center */}
              <polyline
                points={Array.from({ length: 40 }, (_, i) => {
                  const x = (i / 39) * 200;
                  const y = 65 - Math.sin(i * 0.6) * 20 - Math.sin(i * 1.3) * 10;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3388ff"
                strokeWidth="1.5"
              />
              {/* Playhead */}
              <line x1="100" y1="10" x2="100" y2="120" stroke="#ff4444" strokeWidth="1" opacity="0.6" />
              {/* Time text */}
              <text x="10" y="20" fill="#aaa" fontSize="10" fontFamily="monospace">00:32.4</text>
              <text x="150" y="20" fill="#666" fontSize="10" fontFamily="monospace">-02:15.8</text>
            </svg>
          )}

          {/* LCD bezel inset shadow */}
          <div
            data-layer="bezel"
            className="absolute inset-0 rounded-sm pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 8px 2px rgba(0,0,0,0.6), inset 0 2px 4px rgba(0,0,0,0.4)',
            }}
          />

          {/* Scanline overlay — CRT horizontal lines */}
          <div
            data-layer="scanlines"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
            }}
          />

          {/* Screen glow — subtle blue vignette */}
          <div
            data-layer="glow"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at center, rgba(40, 80, 140, 0.08) 0%, transparent 70%)',
            }}
          />
        </div>
      </motion.div>

      {label && (
        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
