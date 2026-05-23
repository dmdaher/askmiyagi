'use client';

import { motion } from 'framer-motion';

interface LEDRingProps {
  id: string;
  color?: string;
  brightness?: number;
  innerDiameter: number;
  outerDiameter: number;
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

export default function LEDRing({
  id,
  color = '#00aaff',
  brightness = 0.8,
  innerDiameter,
  outerDiameter,
  highlighted = false,
}: LEDRingProps) {
  const ringWidth = (outerDiameter - innerDiameter) / 2;
  const alpha = Math.max(0, Math.min(1, brightness));

  // Parse the hex color to extract RGB for alpha manipulation
  const hexToRgb = (hex: string) => {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return { r, g, b };
  };

  const rgb = hexToRgb(color);
  const colorWithAlpha = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
  const glowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.5})`;
  const outerGlow = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.25})`;

  return (
    <motion.div
      className="relative rounded-full"
      data-control-id={id}
      style={{
        width: outerDiameter,
        height: outerDiameter,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      {...(highlighted ? highlightAnimation : {})}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: `0 0 ${ringWidth * 2}px ${ringWidth}px ${outerGlow}`,
        }}
      />

      {/* LED ring */}
      <div
        className="rounded-full"
        style={{
          width: outerDiameter,
          height: outerDiameter,
          border: `${ringWidth}px solid ${colorWithAlpha}`,
          boxShadow: `
            inset 0 0 ${ringWidth}px ${glowColor},
            0 0 ${ringWidth * 1.5}px ${glowColor}
          `,
          boxSizing: 'border-box',
        }}
      />
    </motion.div>
  );
}
