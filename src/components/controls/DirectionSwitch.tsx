'use client';

import { motion } from 'framer-motion';

interface DirectionSwitchProps {
  id: string;
  label?: string;
  positions?: string[];
  currentPosition?: number;
  ledColor?: string;
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

export default function DirectionSwitch({
  id,
  label,
  positions = ['L', 'C', 'R'],
  currentPosition = 1,
  ledColor = '#00ff44',
  highlighted = false,
  width = 48,
  height = 16,
}: DirectionSwitchProps) {
  const posCount = positions.length;
  const segWidth = width / posCount;
  const clampedPos = Math.max(0, Math.min(posCount - 1, currentPosition));
  const centerIndex = Math.floor(posCount / 2);

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      {/* Position labels */}
      <div className="flex" style={{ width, justifyContent: 'space-between' }}>
        {positions.map((pos, i) => (
          <span
            key={i}
            className="text-[7px] font-medium uppercase tracking-wider text-center"
            style={{
              width: segWidth,
              color: i === clampedPos ? '#ccc' : '#555',
            }}
          >
            {pos}
          </span>
        ))}
      </div>

      {/* LED dots (non-center positions) */}
      <div className="flex" style={{ width, justifyContent: 'space-between' }}>
        {positions.map((_, i) => (
          <div
            key={i}
            className="flex justify-center"
            style={{ width: segWidth }}
          >
            {i !== centerIndex ? (
              <div
                className="rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: i === clampedPos ? ledColor : '#1a1a1a',
                  boxShadow: i === clampedPos
                    ? `0 0 4px 1px ${ledColor}`
                    : 'inset 0 1px 1px rgba(0,0,0,0.5)',
                  transition: 'background-color 0.15s, box-shadow 0.15s',
                }}
              />
            ) : (
              <div style={{ width: 4, height: 4 }} />
            )}
          </div>
        ))}
      </div>

      {/* Switch track */}
      <motion.div
        className="relative cursor-pointer"
        style={{
          width,
          height,
          borderRadius: height / 2,
          background: 'linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 50%, #222 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid #111',
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Position markers */}
        {positions.map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: 1,
              height: height * 0.4,
              top: height * 0.3,
              left: segWidth * i + segWidth / 2,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />
        ))}

        {/* Lever / indicator */}
        <div
          className="absolute"
          style={{
            width: Math.max(12, segWidth * 0.6),
            height: height - 4,
            top: 2,
            left: segWidth * clampedPos + segWidth / 2 - Math.max(12, segWidth * 0.6) / 2,
            borderRadius: (height - 4) / 2,
            background: 'linear-gradient(to bottom, #666 0%, #555 40%, #444 100%)',
            boxShadow:
              '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
            transition: 'left 0.15s ease',
          }}
        />
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
