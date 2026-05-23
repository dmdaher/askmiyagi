'use client';

import { motion } from 'framer-motion';

interface PortProps {
  id: string;
  label?: string;
  variant?: 'usb-a' | 'sd-card' | 'ethernet' | 'rca';
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

const variantDefaults: Record<string, { w: number; h: number; icon: string }> = {
  'usb-a': { w: 20, h: 10, icon: '⌂' },
  'sd-card': { w: 16, h: 20, icon: '▬' },
  'ethernet': { w: 18, h: 14, icon: '⌧' },
  'rca': { w: 12, h: 12, icon: '◎' },
};

export default function Port({
  id,
  label,
  variant = 'usb-a',
  highlighted = false,
  width,
  height,
}: PortProps) {
  const defaults = variantDefaults[variant];
  const w = width ?? defaults.w;
  const h = height ?? defaults.h;
  const isRound = variant === 'rca';

  return (
    <div className="flex flex-col items-center gap-1" data-control-id={id}>
      <motion.div
        className="relative flex items-center justify-center cursor-default"
        style={{
          width: w,
          height: h,
          borderRadius: isRound ? '50%' : 3,
          background: '#111',
          boxShadow:
            'inset 0 2px 6px rgba(0,0,0,0.8), inset 0 -1px 3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid #0a0a0a',
        }}
        {...(highlighted ? highlightAnimation : {})}
      >
        {/* Inner silhouette icon */}
        <span
          style={{
            fontSize: Math.min(w, h) * 0.5,
            color: 'rgba(255,255,255,0.08)',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {defaults.icon}
        </span>
      </motion.div>

      {label && (
        <span className="text-[7px] font-medium text-gray-500 uppercase tracking-wider text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
