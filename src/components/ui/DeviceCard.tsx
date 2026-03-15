'use client';

import { motion } from 'framer-motion';
import { DeviceInfo } from '@/types/device';

interface DeviceCardProps {
  device: DeviceInfo;
  tutorialCount: number;
  onClick?: () => void;
}

const DEVICE_ACCENT_COLORS: Record<string, { primary: string; glow: string }> = {
  Roland: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
  Boss: { primary: '#F97316', glow: 'rgba(249, 115, 22, 0.3)' },
};

function getAccentColor(manufacturer: string) {
  return DEVICE_ACCENT_COLORS[manufacturer] ?? { primary: '#00aaff', glow: 'rgba(0, 170, 255, 0.3)' };
}

export default function DeviceCard({ device, tutorialCount, onClick }: DeviceCardProps) {
  const accent = getAccentColor(device.manufacturer);
  const isAvailable = device.available;

  return (
    <motion.button
      onClick={isAvailable ? onClick : undefined}
      className={`group relative w-full overflow-hidden rounded-2xl border text-left transition-colors ${
        isAvailable
          ? 'cursor-pointer border-[var(--card-border)] bg-[var(--card-bg)] hover:border-opacity-60'
          : 'cursor-not-allowed border-[var(--card-border)]/50 bg-[var(--card-bg)]/60 opacity-70'
      }`}
      whileHover={isAvailable ? { scale: 1.02 } : undefined}
      whileTap={isAvailable ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={
        isAvailable
          ? {
              boxShadow: `0 0 0 0 ${accent.glow}`,
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (isAvailable) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 30px ${accent.glow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (isAvailable) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${accent.glow}`;
        }
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-1 w-full"
        style={{ background: isAvailable ? accent.primary : '#444' }}
      />

      <div className="p-6">
        {/* Manufacturer label */}
        <p
          className="mb-1 text-xs font-semibold uppercase tracking-widest"
          style={{ color: isAvailable ? accent.primary : '#666' }}
        >
          {device.manufacturer}
        </p>

        {/* Device name */}
        <h3 className="mb-2 text-2xl font-bold text-gray-100">{device.name}</h3>

        {/* Description */}
        <p className="mb-4 text-sm leading-relaxed text-gray-400">{device.description}</p>

        {/* Badges row */}
        <div className="flex items-center gap-3">
          {isAvailable ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: `${accent.primary}18`,
                color: accent.primary,
                border: `1px solid ${accent.primary}33`,
              }}
            >
              {tutorialCount} {tutorialCount === 1 ? 'Tutorial' : 'Tutorials'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1 text-xs font-medium text-gray-500">
              Coming Soon
            </span>
          )}

          {isAvailable && (
            <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-300">
              Click to browse
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
