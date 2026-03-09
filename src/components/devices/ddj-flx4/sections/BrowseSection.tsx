'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface BrowseSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

/* Rotary encoder — ribbed knurled edge with flat top, matching real DDJ-FLX4 browse encoder */
function RotaryEncoder({ id, value, highlighted }: { id: string; value: number; highlighted: boolean }) {
  const clampedValue = Math.max(0, Math.min(127, value));
  const rotation = -135 + (clampedValue / 127) * 270;
  const size = 60;
  const ribs = 36;

  const highlightAnimation = highlighted ? {
    animate: {
      boxShadow: [
        '0 0 8px 2px rgba(0,170,255,0.4)',
        '0 0 20px 8px rgba(0,170,255,0.8)',
        '0 0 8px 2px rgba(0,170,255,0.4)',
      ],
    },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
  } : {};

  return (
    <div className="flex flex-col items-center" data-control-id={id}>
      <motion.div
        className="relative rounded-full cursor-pointer"
        style={{
          width: size, height: size,
          background: 'conic-gradient(from 0deg, #3a3a3a, #555, #3a3a3a, #555, #3a3a3a, #555, #3a3a3a, #555, #3a3a3a, #555, #3a3a3a, #555, #3a3a3a, #555, #3a3a3a, #555, #3a3a3a)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 3px rgba(0,0,0,0.3)',
        }}
        {...highlightAnimation}
      >
        {/* Flat top cap with concentric ring detail */}
        <div className="absolute rounded-full" style={{
          width: size - 12, height: size - 12,
          top: 6, left: 6,
          background: 'radial-gradient(circle at 40% 35%, #666 0%, #444 50%, #333 100%)',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5), inset 0 -1px 2px rgba(255,255,255,0.08)',
        }} />
        {/* Inner concentric ring */}
        <div className="absolute rounded-full" style={{
          width: size - 22, height: size - 22,
          top: 11, left: 11,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'radial-gradient(circle at 40% 35%, #555 0%, #3a3a3a 60%, #2a2a2a 100%)',
        }} />
        {/* Position indicator */}
        <div className="absolute" style={{
          width: 2, height: 14,
          backgroundColor: '#ddd',
          top: 4, left: '50%', marginLeft: -1,
          borderRadius: 1,
          transformOrigin: `center ${size / 2 - 4}px`,
          transform: `rotate(${rotation}deg)`,
          boxShadow: '0 0 3px rgba(255,255,255,0.3)',
        }} />
        {/* Knurled rib marks around the edge */}
        {Array.from({ length: ribs }).map((_, i) => {
          const angle = (360 / ribs) * i;
          const rad = (angle * Math.PI) / 180;
          const r = size / 2 - 1;
          const cx = size / 2 + Math.cos(rad) * r;
          const cy = size / 2 + Math.sin(rad) * r;
          return (
            <div key={i} className="absolute rounded-full" style={{
              width: 1.5, height: 4,
              backgroundColor: 'rgba(255,255,255,0.08)',
              top: cy - 2, left: cx - 0.75,
              transform: `rotate(${angle + 90}deg)`,
            }} />
          );
        })}
      </motion.div>
    </div>
  );
}

export default function BrowseSection({ panelState, highlightedControls, onButtonClick }: BrowseSectionProps) {
  const isHl = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };
  const getValue = (id: string) => panelState[id]?.value ?? 64;

  /* LED indicator dot — matches real hardware status LEDs near LOAD buttons */
  const ledDot = (
    <div className="rounded-full" style={{
      width: 5, height: 5,
      backgroundColor: '#222',
      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.3)',
    }} />
  );

  /* Subtle vertical divider between control groups */
  const divider = (
    <div style={{
      width: 1, height: 40,
      background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 100%)',
    }} />
  );

  return (
    <div
      className="flex items-center justify-evenly px-4 py-2"
      style={{
        background: 'linear-gradient(180deg, rgba(35,35,38,0.5) 0%, rgba(28,28,32,0.3) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-2">
          {ledDot}
          <PanelButton id="d1-load" label="LOAD" variant="standard" size="lg"
            active={getState('d1-load').active} highlighted={isHl('d1-load')}
            onClick={() => onButtonClick?.('d1-load')} />
        </div>
        <span className="text-[7px] text-gray-500">DECK 1</span>
      </div>
      {divider}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] text-gray-500 font-medium tracking-wider">BROWSE</span>
        <RotaryEncoder id="browse" value={getValue('browse')} highlighted={isHl('browse')} />
        <span className="text-[6px] text-gray-600">PUSH</span>
      </div>
      {divider}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-2">
          <PanelButton id="d2-load" label="LOAD" variant="standard" size="lg"
            active={getState('d2-load').active} highlighted={isHl('d2-load')}
            onClick={() => onButtonClick?.('d2-load')} />
          {ledDot}
        </div>
        <span className="text-[7px] text-gray-500">DECK 2</span>
      </div>
    </div>
  );
}
