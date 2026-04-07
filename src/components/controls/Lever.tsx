'use client';

import { motion } from 'framer-motion';

interface LeverProps {
  id: string;
  label: string;
  highlighted?: boolean;
  scale?: number;
  positions?: number;
  positionLabels?: string[];
  currentPosition?: number;
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

export default function Lever({
  id,
  label,
  highlighted = false,
  scale: s = 1,
  positions = 2,
  positionLabels,
  currentPosition = 0,
}: LeverProps) {
  // Multi-position horizontal switch mode
  if (positions > 2) {
    const trackWidth = 48 * s;
    const trackHeight = 12 * s;
    const posCount = positions;
    const segWidth = trackWidth / posCount;
    const clampedPos = Math.max(0, Math.min(posCount - 1, currentPosition));
    const labels = positionLabels ?? Array.from({ length: posCount }, (_, i) => `${i + 1}`);

    return (
      <div className="flex flex-col items-center gap-1" data-control-id={id}>
        {/* Position labels */}
        <div className="flex" style={{ width: trackWidth, justifyContent: 'space-between' }}>
          {labels.slice(0, posCount).map((lbl, i) => (
            <span
              key={i}
              className="text-[7px] font-medium uppercase tracking-wider text-center"
              style={{
                width: segWidth,
                color: i === clampedPos ? '#ccc' : '#555',
              }}
            >
              {lbl}
            </span>
          ))}
        </div>

        {/* Track */}
        <motion.div
          className="relative cursor-pointer"
          style={{
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            background: 'linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 50%, #222 100%)',
            boxShadow:
              'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid #111',
          }}
          {...(highlighted ? highlightAnimation : {})}
        >
          {/* Position notches */}
          {labels.slice(0, posCount).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: 1,
                height: trackHeight * 0.4,
                top: trackHeight * 0.3,
                left: segWidth * i + segWidth / 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            />
          ))}

          {/* Thumb / lever */}
          <div
            style={{
              position: 'absolute',
              width: Math.max(10, segWidth * 0.6),
              height: trackHeight - 4,
              top: 2,
              left: segWidth * clampedPos + segWidth / 2 - Math.max(10, segWidth * 0.6) / 2,
              borderRadius: (trackHeight - 4) / 2,
              background: 'linear-gradient(to bottom, #666 0%, #555 40%, #444 100%)',
              boxShadow:
                '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
              transition: 'left 0.15s ease',
            }}
          />
        </motion.div>

        {/* Label */}
        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
          {label}
        </span>
      </div>
    );
  }

  // Default: vertical ball-stick lever (original 2-position)
  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      {/* Lever assembly */}
      <motion.div
        className="relative flex flex-col items-center cursor-pointer"
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Ball / stick top */}
        <div
          style={{
            width: 18 * s,
            height: 18 * s,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 30%, #888 0%, #555 50%, #333 100%)',
            boxShadow:
              '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.4)',
          }}
        />

        {/* Stick */}
        <div
          style={{
            width: 6 * s,
            height: 28 * s,
            background:
              'linear-gradient(to right, #3a3a3a 0%, #666 40%, #777 50%, #666 60%, #3a3a3a 100%)',
            boxShadow:
              '1px 0 2px rgba(0,0,0,0.3), -1px 0 2px rgba(0,0,0,0.3)',
            marginTop: -3 * s,
          }}
        />

        {/* Base / socket */}
        <div
          style={{
            width: 30 * s,
            height: 16 * s,
            borderRadius: `${6 * s}px ${6 * s}px ${8 * s}px ${8 * s}px`,
            background:
              'linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 60%, #111 100%)',
            boxShadow:
              'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(255,255,255,0.03)',
            marginTop: -2 * s,
          }}
        />
      </motion.div>

      {/* Label */}
      <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
