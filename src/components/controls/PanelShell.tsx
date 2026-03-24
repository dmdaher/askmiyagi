'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PanelShellProps {
  manufacturer: string;
  deviceName: string;
  width: number;
  height: number;
  children: ReactNode;
}

export default function PanelShell({
  manufacturer,
  deviceName,
  width,
  height,
  children,
}: PanelShellProps) {
  return (
    <div className="w-full h-full overflow-x-auto">
      <motion.div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width,
          minWidth: width,
          height,
          backgroundColor: '#1a1a1a',
          boxShadow:
            '0 0 0 1px rgba(80,80,80,0.3), 0 8px 32px rgba(0,0,0,0.6), 0 2px 0 0 rgba(255,255,255,0.04) inset, 0 -2px 0 0 rgba(0,0,0,0.4) inset',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Vertical grain texture + radial light source */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)',
              'radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.12) 0%, transparent 60%)',
            ].join(', '),
          }}
        />

        {/* Top bezel accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none z-30"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 95%)',
          }}
        />

        {/* Branding bar */}
        <div className="absolute top-1 left-4 z-30 pointer-events-none flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: '#737373', letterSpacing: '0.35em', fontFamily: 'system-ui, sans-serif' }}
          >
            {manufacturer}
          </span>
          <span
            className="text-[9px] font-medium uppercase"
            style={{ color: '#525252', letterSpacing: '0.2em', fontFamily: 'system-ui, sans-serif' }}
          >
            {deviceName}
          </span>
        </div>

        {/* Panel content (sections + controls) */}
        {children}
      </motion.div>
    </div>
  );
}
