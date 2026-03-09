'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface JogWheelProps {
  id: string;
  highlighted?: boolean;
  size?: number;
  onButtonClick?: (id: string) => void;
}

const highlightAnimation = {
  animate: { boxShadow: ['0 0 0px rgba(0,170,255,0)', '0 0 20px rgba(0,170,255,0.6)', '0 0 0px rgba(0,170,255,0)'] },
  transition: { duration: 1.5, repeat: Infinity },
};

export default function JogWheel({ id, highlighted = false, size = 240, onButtonClick }: JogWheelProps) {
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const getAngle = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastAngle.current = getAngle(e);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const currentAngle = getAngle(e);
      let delta = currentAngle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      setRotation(prev => prev + delta);
      lastAngle.current = currentAngle;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [getAngle]);

  const outerSize = size;
  const innerSize = size * 0.55;
  const dotCount = 24;

  return (
    <motion.div
      ref={wheelRef}
      data-control-id={id}
      className="relative cursor-grab active:cursor-grabbing select-none"
      style={{ width: outerSize, height: outerSize }}
      {...(highlighted ? highlightAnimation : {})}
    >
      {/* Outer ring with dimpled texture */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #4a4a4e 0%, #2a2a2e 50%, #1a1a1e 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 2px 4px rgba(255,255,255,0.05)',
        }}
        onMouseDown={handleMouseDown}
        onClick={() => onButtonClick?.(id)}
      >
        {Array.from({ length: dotCount }, (_, i) => {
          const angle = (i / dotCount) * 360;
          const radius = outerSize * 0.46;
          const x = outerSize / 2 + radius * Math.cos((angle * Math.PI) / 180) - 3;
          const y = outerSize / 2 + radius * Math.sin((angle * Math.PI) / 180) - 3;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 6, height: 6, left: x, top: y,
                background: 'radial-gradient(circle, #1a1a1e 30%, #3a3a3e 100%)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
              }}
            />
          );
        })}
      </div>

      {/* Inner platter (rotates) */}
      <motion.div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: innerSize, height: innerSize,
          top: (outerSize - innerSize) / 2, left: (outerSize - innerSize) / 2,
          background: 'radial-gradient(circle at 40% 40%, #3a3a3e 0%, #222226 60%, #1a1a1e 100%)',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(255,255,255,0.05)',
          rotate: rotation,
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: innerSize * 0.45, height: innerSize * 0.45,
            background: 'radial-gradient(circle at 40% 40%, #4a4a4e 0%, #2a2a2e 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <svg width={innerSize * 0.2} height={innerSize * 0.2} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 12l10 10 10-10L12 2z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
          </svg>
        </div>
        <div className="absolute" style={{
          width: 2, height: innerSize * 0.18, top: 4, left: '50%', marginLeft: -1,
          background: 'rgba(255,255,255,0.15)', borderRadius: 1,
        }} />
      </motion.div>
    </motion.div>
  );
}
