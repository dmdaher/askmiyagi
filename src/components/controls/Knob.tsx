'use client';

import { motion } from 'framer-motion';
import LEDRing from './LEDRing';

interface KnobProps {
  id: string;
  label: string;
  value?: number;
  highlighted?: boolean;
  size?: 'sm' | 'md';
  outerSize?: number;
  innerSize?: number;
  indicatorSize?: number;
  /** Optional LED ring around the knob (rare hardware pattern — Pioneer rotary
   *  selector LED rings). Renders behind the knob; does NOT push layout. */
  hasLed?: boolean;
  ledColor?: string;
  /** undefined treated as lit (editor design-viz); true = lit; false = dim. */
  ledOn?: boolean;
}

const sizeConfig = {
  sm: { outer: 26, inner: 20, indicator: 8, label: 'text-[8px]' },
  md: { outer: 34, inner: 28, indicator: 11, label: 'text-[9px]' },
};

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

export default function Knob({
  id,
  label,
  value = 0,
  highlighted = false,
  size = 'md',
  outerSize,
  innerSize,
  indicatorSize,
  hasLed,
  ledColor,
  ledOn,
}: KnobProps) {
  const clampedValue = Math.max(0, Math.min(127, value));
  // Map 0-127 to -135deg to +135deg
  const rotation = -135 + (clampedValue / 127) * 270;
  const cfg = outerSize !== undefined
    ? { outer: outerSize, inner: innerSize ?? outerSize * 0.76, indicator: indicatorSize ?? outerSize * 0.32, label: 'text-[9px]' }
    : sizeConfig[size];
  const ringActive = hasLed && !!ledColor && ledOn !== false;

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      {/* Knob body */}
      <motion.div
        className="relative rounded-full cursor-pointer"
        style={{
          width: cfg.outer,
          height: cfg.outer,
          background: 'radial-gradient(circle at 35% 30%, #888 0%, #555 40%, #333 70%, #222 100%)',
          boxShadow:
            '0 4px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.15)',
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* LED ring around the knob — rare (Pioneer rotary selectors etc).
            Positioned behind via inset:-8px so it doesn't push layout. */}
        {hasLed && ledColor && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              zIndex: 0,
              opacity: ringActive ? 1 : 0.25,
            }}
          >
            <LEDRing
              id={`${id}-knob-ring`}
              color={ledColor}
              innerDiameter={cfg.outer}
              outerDiameter={cfg.outer + 16}
            />
          </div>
        )}
        {/* Inner ring / cap */}
        <div
          className="absolute rounded-full"
          style={{
            width: cfg.inner,
            height: cfg.inner,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle at 40% 35%, #777 0%, #4a4a4a 50%, #333 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.1)',
          }}
        />

        {/* Position indicator line */}
        <div
          className="absolute"
          style={{
            width: 2,
            height: cfg.indicator,
            backgroundColor: '#eee',
            top: 3,
            left: '50%',
            marginLeft: -1,
            borderRadius: 1,
            transformOrigin: `center ${cfg.outer / 2 - 3}px`,
            transform: `rotate(${rotation}deg)`,
            boxShadow: '0 0 3px rgba(255,255,255,0.3)',
          }}
        />
      </motion.div>

      {/* Label */}
      <span className={`${cfg.label} font-medium text-gray-400 uppercase tracking-wider text-center leading-tight`}>
        {label}
      </span>
    </div>
  );
}
