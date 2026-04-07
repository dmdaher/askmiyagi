'use client';

import { motion } from 'framer-motion';
import Wheel from './Wheel';
import JogDisplay from './JogDisplay';
import LEDRing from './LEDRing';

interface JogWheelAssemblyProps {
  id: string;
  label?: string;
  wheelSize?: number;
  displaySize?: number;
  ringColor?: string;
  highlighted?: boolean;
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

export default function JogWheelAssembly({
  id,
  label,
  wheelSize = 160,
  displaySize = 60,
  ringColor,
  highlighted = false,
}: JogWheelAssemblyProps) {
  const ringOuter = ringColor ? wheelSize + 16 : wheelSize;
  const totalSize = ringColor ? ringOuter : wheelSize;

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      <motion.div
        className="relative"
        style={{
          width: totalSize,
          height: totalSize,
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Outer LED Ring */}
        {ringColor && (
          <div
            className="absolute"
            style={{
              top: 0,
              left: 0,
            }}
          >
            <LEDRing
              id={`${id}-ring`}
              color={ringColor}
              innerDiameter={wheelSize}
              outerDiameter={ringOuter}
            />
          </div>
        )}

        {/* Jog Wheel (platter) — centered within the ring area */}
        <div
          className="absolute"
          style={{
            top: (totalSize - wheelSize) / 2,
            left: (totalSize - wheelSize) / 2,
          }}
        >
          <Wheel
            id={`${id}-wheel`}
            label=""
            variant="jog"
            width={wheelSize}
            height={wheelSize}
          />
        </div>

        {/* Center Jog Display — positioned absolutely in center */}
        <div
          className="absolute"
          style={{
            top: (totalSize - displaySize) / 2,
            left: (totalSize - displaySize) / 2,
            zIndex: 10,
          }}
        >
          <JogDisplay
            id={`${id}-display`}
            size={displaySize}
            showMockContent
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
