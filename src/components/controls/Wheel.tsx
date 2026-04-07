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
  variant?: 'pitch' | 'jog';
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
  width = 20,
  height = 80,
  thumbHeight: THUMB_HEIGHT = 14,
  variant,
}: WheelProps) {
  // Auto-detect variant: if aspect ratio is roughly square (or explicit), render jog wheel
  const isJog = variant === 'jog' || (!variant && width >= 60 && height / width < 1.5);

  if (isJog) {
    return <JogWheel id={id} label={label} value={value} highlighted={highlighted} size={Math.max(width, height)} />;
  }

  return <PitchWheel id={id} label={label} value={value} highlighted={highlighted} width={width} height={height} thumbHeight={THUMB_HEIGHT} />;
}

// ─── Jog Wheel (circular disc — CDJ style) ───────────────────────────────────

function JogWheel({
  id,
  label,
  value = 64,
  highlighted = false,
  size = 120,
}: {
  id: string;
  label: string;
  value?: number;
  highlighted?: boolean;
  size?: number;
}) {
  // Map value to rotation (0–127 → 0–360°)
  const rotation = (value / 127) * 360;
  const ringCount = 3;

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      <motion.div
        className="relative cursor-pointer rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 40% 35%, #3a3a3a 0%, #222 40%, #1a1a1a 70%, #111 100%)`,
          boxShadow: highlighted
            ? '0 0 20px 8px rgba(0,170,255,0.6), inset 0 0 20px rgba(0,0,0,0.5)'
            : `0 4px 16px rgba(0,0,0,0.6),
               0 2px 4px rgba(0,0,0,0.4),
               inset 0 1px 0 rgba(255,255,255,0.08),
               inset 0 0 20px rgba(0,0,0,0.5)`,
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Outer rim */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid rgba(255,255,255,0.06)',
          }}
        />

        {/* Concentric ring grooves */}
        {Array.from({ length: ringCount }, (_, i) => {
          const ringSize = size * (0.85 - i * 0.18);
          const offset = (size - ringSize) / 2;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: ringSize,
                height: ringSize,
                left: offset,
                top: offset,
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            />
          );
        })}

        {/* Center hub */}
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.35,
            height: size * 0.35,
            left: size * 0.325,
            top: size * 0.325,
            background: `radial-gradient(circle at 45% 40%, #444 0%, #2a2a2a 50%, #1a1a1a 100%)`,
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />

        {/* Position indicator dot (rotates with value) */}
        <div
          className="absolute"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#888',
            boxShadow: '0 0 4px rgba(255,255,255,0.2)',
            left: size / 2 - 3 + Math.cos((rotation - 90) * Math.PI / 180) * (size * 0.38),
            top: size / 2 - 3 + Math.sin((rotation - 90) * Math.PI / 180) * (size * 0.38),
          }}
        />

        {/* Grip texture — radial lines around the edge */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i * 15) * Math.PI / 180;
          const innerR = size * 0.42;
          const outerR = size * 0.47;
          const cx = size / 2;
          const cy = size / 2;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                width: 1,
                height: outerR - innerR,
                left: cx + Math.cos(angle) * innerR - 0.5,
                top: cy + Math.sin(angle) * innerR,
                backgroundColor: 'rgba(255,255,255,0.04)',
                transform: `rotate(${i * 15}deg)`,
                transformOrigin: '50% 0%',
              }}
            />
          );
        })}
      </motion.div>

      {/* Label */}
      <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ─── Pitch Wheel (vertical slider — synth style) ────────────────────────────

function PitchWheel({
  id,
  label,
  value = 64,
  highlighted = false,
  width: WHEEL_WIDTH = 20,
  height: WHEEL_HEIGHT = 80,
  thumbHeight: THUMB_HEIGHT = 14,
}: {
  id: string;
  label: string;
  value?: number;
  highlighted?: boolean;
  width?: number;
  height?: number;
  thumbHeight?: number;
}) {
  const TRAVEL = WHEEL_HEIGHT - THUMB_HEIGHT;
  const clampedValue = Math.max(0, Math.min(127, value));
  const thumbOffset = TRAVEL - (clampedValue / 127) * TRAVEL;
  const gripLineCount = Math.max(4, Math.round((WHEEL_HEIGHT - 20) / 5));

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
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
        {/* Center line marker */}
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
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-[2px]">
            <div className="h-[1px] bg-[rgba(255,255,255,0.2)]" />
            <div className="h-[1px] bg-[rgba(0,0,0,0.3)]" />
            <div className="h-[1px] bg-[rgba(255,255,255,0.2)]" />
          </div>
        </div>
      </motion.div>

      <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
