'use client';

import { motion } from 'framer-motion';

interface WheelProps {
  id: string;
  label: string;
  value?: number;
  highlighted?: boolean;
  width?: number;
  height?: number;
  thumbHeight?: number;
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

export default function Wheel({
  id,
  label,
  value = 64,
  highlighted = false,
  width: WHEEL_WIDTH = 20,
  height: WHEEL_HEIGHT = 80,
  thumbHeight: THUMB_HEIGHT = 14,
}: WheelProps) {
  const TRAVEL = WHEEL_HEIGHT - THUMB_HEIGHT;
  const clampedValue = Math.max(0, Math.min(127, value));
  // Map 0 (bottom) to 127 (top)
  const thumbOffset = TRAVEL - (clampedValue / 127) * TRAVEL;
  const gripLineCount = Math.max(4, Math.round((WHEEL_HEIGHT - 20) / 5));

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      {/* Wheel track */}
      <motion.div
        className="relative cursor-pointer"
        style={{
          width: WHEEL_WIDTH,
          height: WHEEL_HEIGHT,
          borderRadius: WHEEL_WIDTH / 2,
          background: 'linear-gradient(to right, #1a1a1a 0%, #2a2a2a 30%, #333 50%, #2a2a2a 70%, #1a1a1a 100%)',
          boxShadow:
            'inset 0 4px 8px rgba(0,0,0,0.7), inset 0 -4px 8px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05), inset 2px 0 4px rgba(0,0,0,0.4), inset -2px 0 4px rgba(0,0,0,0.4)',
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Center line marker (for pitch bend center reference) */}
        <div
          className="absolute left-0 right-0"
          style={{
            height: 1,
            top: '50%',
            marginTop: -0.5,
            background: 'linear-gradient(to right, transparent 15%, #555 50%, transparent 85%)',
          }}
        />

        {/* Grip texture lines */}
        {Array.from({ length: gripLineCount }, (_, i) => {
          const y = 10 + ((WHEEL_HEIGHT - 20) / (gripLineCount - 1)) * i;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                width: WHEEL_WIDTH - 8,
                height: 1,
                left: 4,
                top: y,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            />
          );
        })}

        {/* Thumb */}
        <div
          className="absolute left-0 right-0"
          style={{
            height: THUMB_HEIGHT,
            top: thumbOffset,
            borderRadius: WHEEL_WIDTH / 2,
            background: 'linear-gradient(to right, #555 0%, #777 30%, #888 50%, #777 70%, #555 100%)',
            boxShadow:
              '0 2px 4px rgba(0,0,0,0.5), 0 -1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
          }}
        >
          {/* Thumb grip lines */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-[2px]">
            <div className="h-[1px] bg-[rgba(255,255,255,0.2)]" />
            <div className="h-[1px] bg-[rgba(0,0,0,0.3)]" />
            <div className="h-[1px] bg-[rgba(255,255,255,0.2)]" />
          </div>
        </div>
      </motion.div>

      {/* Label */}
      <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
