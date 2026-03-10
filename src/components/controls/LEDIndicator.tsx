'use client';

import { motion } from 'framer-motion';

interface LEDIndicatorProps {
  id: string;
  on?: boolean;
  color?: string;
  highlighted?: boolean;
  size?: number;
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

export default function LEDIndicator({
  id,
  on = false,
  color = '#00ff44',
  highlighted = false,
  size = 8,
}: LEDIndicatorProps) {
  // Derive a dark version of the color for the "off" state
  const offColor = '#1a1a1a';

  return (
    <motion.div
      className="rounded-full"
      data-control-id={id}
      style={{
        width: size,
        height: size,
        backgroundColor: on ? color : offColor,
        boxShadow: on
          ? `0 0 4px 1px ${color}, 0 0 8px 3px ${color}66, inset 0 -1px 1px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.3)`
          : 'inset 0 1px 2px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
        border: on ? `1px solid ${color}88` : '1px solid #111',
        transition: 'background-color 0.15s, box-shadow 0.15s',
      }}
      {...(highlighted
        ? {
            animate: {
              boxShadow: [
                `${on ? `0 0 4px 1px ${color}, ` : ''}0 0 8px 2px rgba(0,170,255,0.4)`,
                `${on ? `0 0 4px 1px ${color}, ` : ''}0 0 20px 8px rgba(0,170,255,0.8)`,
                `${on ? `0 0 4px 1px ${color}, ` : ''}0 0 8px 2px rgba(0,170,255,0.4)`,
              ],
            },
            transition: highlightAnimation.transition,
          }
        : {})}
    />
  );
}
