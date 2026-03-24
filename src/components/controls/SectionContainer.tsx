'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionContainerProps {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  headerLabel?: string;
  children?: ReactNode;
}

export default function SectionContainer({
  id,
  x,
  y,
  w,
  h,
  headerLabel,
  children,
}: SectionContainerProps) {
  return (
    <motion.div
      className="absolute rounded-lg"
      data-section-id={id}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        backgroundColor: 'rgba(0,0,0,0.12)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {headerLabel && (
        <div
          className="absolute -top-4 left-2 pointer-events-none"
          style={{ zIndex: 30 }}
        >
          <span
            className="text-[8px] font-medium uppercase"
            style={{ color: '#666', letterSpacing: '0.15em' }}
          >
            {headerLabel}
          </span>
        </div>
      )}
      {children}
    </motion.div>
  );
}
