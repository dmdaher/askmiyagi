'use client';

import { motion } from 'framer-motion';

interface SliderProps {
  id: string;
  label: string;
  value?: number;
  highlighted?: boolean;
  trackHeight?: number;
  trackWidth?: number;
  thumbHeight?: number;
  labelPosition?: 'above' | 'below';
  /**
   * Rotation in degrees from ControlDef.rotation. When 90 or 270, the slider
   * re-lays out natively as horizontal (track wide+short, thumb moves along X).
   * Other values fall back to vertical layout; the wrapping ControlNode/
   * PanelRenderer applies a CSS rotate() for non-cardinal angles.
   */
  rotation?: number;
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

export default function Slider({
  id,
  label,
  value = 0,
  highlighted = false,
  trackHeight = 120,
  trackWidth = 16,
  thumbHeight = 14,
  labelPosition = 'below',
  rotation = 0,
}: SliderProps) {
  const isHorizontal = rotation === 90 || rotation === 270;
  const longAxis = isHorizontal ? trackWidth : trackHeight;
  const travel = longAxis - thumbHeight;
  const clampedValue = Math.max(0, Math.min(127, value));
  // Vertical: 0 at bottom, 127 at top. Horizontal: 0 at left, 127 at right.
  const thumbOffset = isHorizontal
    ? (clampedValue / 127) * travel
    : travel - (clampedValue / 127) * travel;

  return (
    <div
      className={`flex items-center gap-1 ${isHorizontal ? 'flex-row' : 'flex-col'}`}
      data-control-id={id}
    >
      {labelPosition === 'above' && (
        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
          {label}
        </span>
      )}
      {/* Fader assembly */}
      <motion.div
        className="relative rounded-md"
        style={{
          width: trackWidth,
          height: trackHeight,
          background: isHorizontal
            ? 'linear-gradient(to right, #1a1a1a, #111111)'
            : 'linear-gradient(to bottom, #1a1a1a, #111111)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)',
          ...(isHorizontal
            ? { borderTop: '1px solid #0a0a0a', borderBottom: '1px solid #0a0a0a' }
            : { borderLeft: '1px solid #0a0a0a', borderRight: '1px solid #0a0a0a' }),
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Center track line */}
        {isHorizontal ? (
          <div
            className="absolute top-1/2 rounded-full"
            style={{
              height: 2,
              width: longAxis - 12,
              left: 6,
              marginTop: -1,
              background: 'linear-gradient(to right, #333, #222)',
            }}
          />
        ) : (
          <div
            className="absolute left-1/2 rounded-full"
            style={{
              width: 2,
              height: longAxis - 12,
              top: 6,
              marginLeft: -1,
              background: 'linear-gradient(to bottom, #333, #222)',
            }}
          />
        )}

        {/* Track markings */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <div
            key={pct}
            className="absolute"
            style={
              isHorizontal
                ? {
                    width: 1,
                    height: 6,
                    bottom: -2,
                    left: 6 + (longAxis - 12) * pct,
                    backgroundColor: '#444',
                  }
                : {
                    width: 6,
                    height: 1,
                    right: -2,
                    top: 6 + (longAxis - 12) * (1 - pct),
                    backgroundColor: '#444',
                  }
            }
          />
        ))}

        {/* Thumb / fader cap */}
        <div
          className={`absolute rounded-sm cursor-pointer ${isHorizontal ? 'top-1/2' : 'left-1/2'}`}
          style={
            isHorizontal
              ? {
                  height: 14,
                  width: thumbHeight,
                  marginTop: -7,
                  left: thumbOffset,
                  background: 'linear-gradient(to right, #888 0%, #666 30%, #555 60%, #444 100%)',
                  boxShadow:
                    '0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  borderRadius: 2,
                }
              : {
                  width: 14,
                  height: thumbHeight,
                  marginLeft: -7,
                  top: thumbOffset,
                  background: 'linear-gradient(to bottom, #888 0%, #666 30%, #555 60%, #444 100%)',
                  boxShadow:
                    '0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  borderRadius: 2,
                }
          }
        >
          {/* Grip lines on thumb */}
          {isHorizontal ? (
            <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 flex flex-row gap-[2px]">
              <div className="w-[1px] bg-[rgba(255,255,255,0.15)]" />
              <div className="w-[1px] bg-[rgba(0,0,0,0.3)]" />
              <div className="w-[1px] bg-[rgba(255,255,255,0.15)]" />
              <div className="w-[1px] bg-[rgba(0,0,0,0.3)]" />
              <div className="w-[1px] bg-[rgba(255,255,255,0.15)]" />
            </div>
          ) : (
            <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 flex flex-col gap-[2px]">
              <div className="h-[1px] bg-[rgba(255,255,255,0.15)]" />
              <div className="h-[1px] bg-[rgba(0,0,0,0.3)]" />
              <div className="h-[1px] bg-[rgba(255,255,255,0.15)]" />
              <div className="h-[1px] bg-[rgba(0,0,0,0.3)]" />
              <div className="h-[1px] bg-[rgba(255,255,255,0.15)]" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Label */}
      {labelPosition !== 'above' && (
        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
