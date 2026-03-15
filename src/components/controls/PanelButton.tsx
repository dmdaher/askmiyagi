'use client';

import { motion } from 'framer-motion';

interface PanelButtonProps {
  id: string;
  label: string;
  variant?: 'standard' | 'zone' | 'scene' | 'category' | 'function' | 'menu';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  hasLed?: boolean;
  ledOn?: boolean;
  ledColor?: string;
  highlighted?: boolean;
  labelPosition?: 'on' | 'above' | 'below';
  onClick?: () => void;
}

const sizeClasses: Record<string, { button: string; text: string; led: string }> = {
  sm: { button: 'w-8 h-6', text: 'text-[8px]', led: 'w-2 h-2' },
  md: { button: 'w-10 h-7', text: 'text-[9px]', led: 'w-2.5 h-2.5' },
  lg: { button: 'w-14 h-9', text: 'text-[10px]', led: 'w-3 h-3' },
};

const variantStyles: Record<string, { base: string; active: string }> = {
  standard: {
    base: 'bg-gradient-to-b from-[#4a4a4a] to-[#2e2e2e] border-[#1a1a1a]',
    active: 'bg-gradient-to-b from-[#6a6a6a] to-[#4e4e4e] border-[#3a3a3a]',
  },
  zone: {
    base: 'bg-gradient-to-b from-[#3a4a5a] to-[#1e2e3e] border-[#0a1a2a]',
    active: 'bg-gradient-to-b from-[#5a7a9a] to-[#3e5e7e] border-[#2a4a6a]',
  },
  scene: {
    base: 'bg-gradient-to-b from-[#5a4a3a] to-[#3e2e1e] border-[#2a1a0a]',
    active: 'bg-gradient-to-b from-[#9a7a5a] to-[#7e5e3e] border-[#6a4a2a]',
  },
  category: {
    base: 'bg-gradient-to-b from-[#4a3a5a] to-[#2e1e3e] border-[#1a0a2a]',
    active: 'bg-gradient-to-b from-[#7a5a9a] to-[#5e3e7e] border-[#4a2a6a]',
  },
  function: {
    base: 'bg-gradient-to-b from-[#3a3a3a] to-[#222222] border-[#111111]',
    active: 'bg-gradient-to-b from-[#5a5a5a] to-[#424242] border-[#333333]',
  },
  menu: {
    base: 'bg-gradient-to-b from-[#444444] to-[#2a2a2a] border-[#181818]',
    active: 'bg-gradient-to-b from-[#666666] to-[#4a4a4a] border-[#383838]',
  },
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

export default function PanelButton({
  id,
  label,
  variant = 'standard',
  size = 'md',
  active = false,
  hasLed = false,
  ledOn = false,
  ledColor = '#00ff44',
  highlighted = false,
  labelPosition = 'on',
  onClick,
}: PanelButtonProps) {
  const sizeStyle = sizeClasses[size];
  const variantStyle = variantStyles[variant];

  return (
    <div className="flex flex-col items-center" data-control-id={id}>
      {/* Label above button (panel-printed text) — rendered before LED per hardware layout */}
      {labelPosition === 'above' && (
        <span className={`${sizeStyle.text} font-bold text-neutral-300 leading-none text-center tracking-wide uppercase whitespace-nowrap`}>
          {label}
        </span>
      )}

      {/* LED indicator */}
      {hasLed && (
        <div
          className={`${sizeStyle.led} rounded-full transition-all duration-150`}
          style={{
            backgroundColor: ledOn ? ledColor : '#1a1a1a',
            boxShadow: ledOn ? `0 0 6px 2px ${ledColor}` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Button */}
      <motion.button
        type="button"
        onClick={onClick}
        className={[
          sizeStyle.button,
          'rounded-md border',
          'cursor-pointer select-none',
          'flex items-center justify-center',
          'transition-colors duration-100',
          active ? variantStyle.active : variantStyle.base,
        ].join(' ')}
        style={{
          boxShadow: active
            ? 'inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)'
            : '0 3px 6px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
          transform: active ? 'translateY(1px)' : 'translateY(0)',
        }}
        {...(highlighted ? highlightAnimation : {})}
        whileTap={{ scale: 0.95, y: 2 }}
      >
        {labelPosition === 'on' && (
          <span className={`${sizeStyle.text} font-medium text-gray-200 leading-tight text-center px-1 tracking-wide uppercase`}>
            {label}
          </span>
        )}
      </motion.button>

      {/* Label below button (panel-printed text) */}
      {labelPosition === 'below' && (
        <span className={`${sizeStyle.text} font-bold text-neutral-300 leading-none text-center tracking-wide uppercase whitespace-nowrap`}>
          {label}
        </span>
      )}
    </div>
  );
}
