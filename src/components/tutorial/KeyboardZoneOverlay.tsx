'use client';

import { motion } from 'framer-motion';
import { ZoneConfig } from '@/types/keyboard';
import { midiNoteToName } from '@/lib/noteHelpers';
import { FANTOM_LOWEST_NOTE, FANTOM_HIGHEST_NOTE } from '@/lib/constants';

interface KeyboardZoneOverlayProps {
  zones: ZoneConfig[];
}

export default function KeyboardZoneOverlay({
  zones,
}: KeyboardZoneOverlayProps) {
  if (!zones.length) return null;

  const totalKeys = FANTOM_HIGHEST_NOTE - FANTOM_LOWEST_NOTE + 1;

  return (
    <div className="w-full px-4 py-2">
      <div className="flex flex-col gap-1">
        {zones.map((zone, index) => {
          const startOffset = zone.lowNote - FANTOM_LOWEST_NOTE;
          const endOffset = zone.highNote - FANTOM_LOWEST_NOTE;
          const leftPercent = (startOffset / totalKeys) * 100;
          const widthPercent = ((endOffset - startOffset + 1) / totalKeys) * 100;

          return (
            <div key={`zone-${zone.zoneNumber}`} className="relative h-10">
              <motion.div
                className="absolute inset-y-0 flex flex-col items-center justify-center rounded-md overflow-hidden"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: `${zone.color}22`,
                  borderLeft: `2px solid ${zone.color}88`,
                  borderRight: `2px solid ${zone.color}88`,
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.08,
                  ease: 'easeOut',
                }}
              >
                {/* Zone label */}
                <span
                  className="text-xs font-bold leading-none tracking-wide"
                  style={{ color: zone.color }}
                >
                  {zone.label}
                </span>

                {/* Note range */}
                <span
                  className="text-[10px] leading-none mt-0.5 opacity-70"
                  style={{ color: zone.color }}
                >
                  {midiNoteToName(zone.lowNote)} - {midiNoteToName(zone.highNote)}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Color legend beneath */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {zones.map((zone) => (
          <div
            key={`legend-${zone.zoneNumber}`}
            className="flex items-center gap-1.5"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: zone.color }}
            />
            <span className="text-[10px] text-white/50">{zone.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
