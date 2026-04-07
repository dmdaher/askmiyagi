'use client';

import { motion } from 'framer-motion';

interface PanelButtonProps {
  id: string;
  label: string;
  variant?: 'standard' | 'zone' | 'scene' | 'category' | 'function' | 'menu' | 'flat-key' | 'transport' | 'rubber';
  size?: 'sm' | 'md' | 'lg';
  width?: number;   // Fluid mode: explicit pixel width (overrides size preset)
  height?: number;  // Fluid mode: explicit pixel height (overrides size preset)
  active?: boolean;
  hasLed?: boolean;
  ledOn?: boolean;
  ledColor?: string;
  highlighted?: boolean;
  labelPosition?: 'on' | 'above' | 'below';
  surfaceColor?: string;
  iconContent?: string;
  onClick?: () => void;
}

// Preset sizes (backward compat with Fantom-08 hand-built panel)
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
  'flat-key': {
    base: 'bg-gradient-to-b from-[#333333] to-[#262626] border-[#151515]',
    active: 'bg-gradient-to-b from-[#4a4a4a] to-[#3a3a3a] border-[#2a2a2a]',
  },
  transport: {
    base: 'bg-gradient-to-b from-[#3a3a3a] to-[#1e1e1e] border-[#111111]',
    active: 'bg-gradient-to-b from-[#4a4a4a] to-[#333333] border-[#222222]',
  },
  rubber: {
    base: 'bg-gradient-to-b from-[#353535] to-[#282828] border-[#181818]',
    active: 'bg-gradient-to-b from-[#4a4a4a] to-[#3e3e3e] border-[#2a2a2a]',
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
  width,
  height,
  active = false,
  hasLed = false,
  ledOn = false,
  ledColor = '#00ff44',
  highlighted = false,
  labelPosition = 'on',
  surfaceColor,
  iconContent,
  onClick,
}: PanelButtonProps) {
  // Fluid mode: when width/height are provided, compute all visuals proportionally.
  // Preset mode: when only size is provided, use Tailwind classes (Fantom-08 compat).
  const isFluid = width != null && height != null;
  const sizeStyle = sizeClasses[size];
  const variantStyle = variantStyles[variant];

  const isTransport = variant === 'transport';
  const isRubber = variant === 'rubber';
  const isFlatKey = variant === 'flat-key';

  // ── Fluid sizing computations ──────────────────────────────────────────
  const fluidFontSize = isFluid ? Math.max(Math.round(height! * 0.35), 6) : undefined;
  const fluidBorderRadius = isFluid
    ? (isTransport ? '50%' : Math.max(Math.round(Math.min(width!, height!) * 0.15), 2))
    : undefined;
  const fluidLedSize = isFluid ? Math.max(Math.min(Math.round(height! * 0.2), 8), 3) : undefined;

  // Fluid shadow scales with height
  const fluidShadow = isFluid
    ? (active
        ? `inset 0 ${Math.round(height! * 0.05)}px ${Math.round(height! * 0.1)}px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)`
        : `0 ${Math.round(height! * 0.1)}px ${Math.round(height! * 0.2)}px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)`)
    : undefined;

  // ── Transport style ────────────────────────────────────────────────────
  const transportW = isFluid ? width! : 40;
  const transportH = isFluid ? height! : 40;
  const transportStyle = isTransport
    ? {
        borderRadius: '50%',
        width: transportW,
        height: transportH,
        border: surfaceColor ? `3px solid ${surfaceColor}` : '3px solid #555',
        boxShadow: active
          ? `inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)${surfaceColor ? `, 0 0 8px ${surfaceColor}44` : ''}`
          : `0 3px 8px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)`,
        transform: active ? 'translateY(1px)' : 'translateY(0)',
      }
    : undefined;

  // ── Rubber style ───────────────────────────────────────────────────────
  const rubberStyle = isRubber
    ? {
        borderRadius: isFluid ? fluidBorderRadius : 4,
        boxShadow: active
          ? 'inset 0 2px 3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04)'
          : '0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
        transform: active ? 'translateY(1px)' : 'translateY(0)',
      }
    : undefined;

  // ── Flat-key style ─────────────────────────────────────────────────────
  const flatKeyStyle = isFlatKey
    ? {
        boxShadow: active
          ? 'inset 0 1px 2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)'
          : '0 2px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)',
        borderWidth: 1,
        transform: active ? 'translateY(1px)' : 'translateY(0)',
      }
    : undefined;

  // ── Default style ──────────────────────────────────────────────────────
  const customStyle = transportStyle ?? rubberStyle ?? flatKeyStyle ?? {
    boxShadow: isFluid ? fluidShadow : (active
      ? 'inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)'
      : '0 3px 6px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)'),
    transform: active ? 'translateY(1px)' : 'translateY(0)',
  };

  // ── Fluid button style (inline, replaces Tailwind classes) ─────────────
  const fluidButtonStyle = isFluid ? {
    width: width!,
    height: height!,
    borderRadius: fluidBorderRadius,
    overflow: 'hidden' as const,
    ...customStyle,
  } : customStyle;

  // Text style — fluid or preset
  const textClass = isFluid ? '' : sizeStyle.text;
  const textStyle = isFluid ? { fontSize: fluidFontSize } : undefined;

  return (
    <div className="flex flex-col items-center" data-control-id={id}>
      {/* Label above button */}
      {labelPosition === 'above' && (
        <span
          className={`${textClass} font-bold text-neutral-300 leading-none text-center tracking-wide uppercase whitespace-nowrap`}
          style={textStyle}
        >
          {label}
        </span>
      )}

      {/* LED indicator */}
      {hasLed && (
        <div
          className={`${isFluid ? '' : sizeStyle.led} rounded-full transition-all duration-150`}
          style={{
            ...(isFluid ? { width: fluidLedSize, height: fluidLedSize } : {}),
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
          isFluid ? '' : (isTransport ? '' : sizeStyle.button),
          isFluid ? '' : (isTransport ? '' : 'rounded-md'),
          'border',
          'cursor-pointer select-none',
          'flex items-center justify-center',
          'transition-colors duration-100',
          active ? variantStyle.active : variantStyle.base,
        ].join(' ')}
        style={fluidButtonStyle}
        {...(highlighted ? highlightAnimation : {})}
        whileTap={{ scale: isTransport ? 0.92 : 0.95, y: 2 }}
      >
        {iconContent ? (
          <span
            className="text-gray-200 leading-none text-center select-none"
            style={{ fontSize: isFluid ? Math.max(Math.round(Math.min(width!, height!) * 0.4), 8) : (isTransport ? 18 : 16) }}
          >
            {iconContent}
          </span>
        ) : (
          labelPosition === 'on' && (
            <span
              className={`${textClass} font-medium text-gray-200 leading-tight text-center px-1 tracking-wide uppercase`}
              style={textStyle}
            >
              {label}
            </span>
          )
        )}
      </motion.button>

      {/* Label below button */}
      {labelPosition === 'below' && (
        <span
          className={`${textClass} font-bold text-neutral-300 leading-none text-center tracking-wide uppercase whitespace-nowrap`}
          style={textStyle}
        >
          {label}
        </span>
      )}
    </div>
  );
}
