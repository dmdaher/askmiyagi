'use client';

import { motion } from 'framer-motion';

interface ValueDialProps {
  id: string;
  label?: string;
  highlighted?: boolean;
  size?: 'sm' | 'lg';
  outerSize?: number;
  hasPush?: boolean;
}

const DIAL_SIZES = { sm: 48, lg: 96 };
const RIDGE_COUNT = 32;

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

export default function ValueDial({
  id,
  label,
  highlighted = false,
  size = 'sm',
  outerSize,
  hasPush = false,
}: ValueDialProps) {
  const DIAL_SIZE = outerSize ?? DIAL_SIZES[size];
  // Scale internal proportions from DIAL_SIZE for fluid rendering at any size
  const capInset = Math.max(Math.round(DIAL_SIZE * 0.17), 3);
  const centerDot = Math.max(Math.round(DIAL_SIZE * 0.12), 3);
  const ridgeHeight = Math.max(Math.round(DIAL_SIZE * 0.08), 2);
  const highlightRidgeHeight = Math.max(Math.round(DIAL_SIZE * 0.06), 2);

  // Generate ridge lines around circumference
  const ridges = Array.from({ length: RIDGE_COUNT }, (_, i) => {
    const angle = (i / RIDGE_COUNT) * 360;
    return angle;
  });

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      {/* Dial body */}
      <motion.div
        className="relative rounded-full cursor-pointer"
        style={{
          width: DIAL_SIZE,
          height: DIAL_SIZE,
          background: 'radial-gradient(circle at 35% 30%, #999 0%, #666 30%, #444 60%, #2a2a2a 100%)',
          boxShadow:
            '0 6px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(0,0,0,0.4), inset 0 3px 6px rgba(255,255,255,0.1)',
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Ridged edge */}
        {ridges.map((angle) => (
          <div
            key={angle}
            className="absolute"
            style={{
              width: 1,
              height: ridgeHeight,
              backgroundColor: 'rgba(0,0,0,0.3)',
              top: 0,
              left: '50%',
              marginLeft: -0.5,
              transformOrigin: `center ${DIAL_SIZE / 2}px`,
              transform: `rotate(${angle}deg)`,
            }}
          />
        ))}

        {/* Highlight ridges (alternating lighter) */}
        {ridges
          .filter((_, i) => i % 2 === 0)
          .map((angle) => (
            <div
              key={`h-${angle}`}
              className="absolute"
              style={{
                width: 1,
                height: highlightRidgeHeight,
                backgroundColor: 'rgba(255,255,255,0.08)',
                top: 1,
                left: '50%',
                marginLeft: -0.5,
                transformOrigin: `center ${DIAL_SIZE / 2 - 1}px`,
                transform: `rotate(${angle + 360 / RIDGE_COUNT / 2}deg)`,
              }}
            />
          ))}

        {/* Inner cap */}
        <div
          className="absolute rounded-full"
          style={{
            width: DIAL_SIZE - capInset * 2,
            height: DIAL_SIZE - capInset * 2,
            top: capInset,
            left: capInset,
            background: 'radial-gradient(circle at 40% 35%, #777 0%, #555 40%, #3a3a3a 80%, #2a2a2a 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 3px rgba(255,255,255,0.1)',
          }}
        />

        {/* Center dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: centerDot,
            height: centerDot,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #888 0%, #555 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.4)',
          }}
        />

        {/* Push indicator ring (shown when hasPush is true) */}
        {hasPush && (
          <div
            className="absolute rounded-full"
            style={{
              width: centerDot + 8,
              height: centerDot + 8,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: 'inset 0 0 3px rgba(255,255,255,0.05)',
            }}
          />
        )}
      </motion.div>

      {/* Label */}
      {label && (
        <span className="text-[8px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
