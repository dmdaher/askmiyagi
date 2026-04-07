'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ZoneConfig } from '@/types/keyboard';
import { generateKeyboardNotes, noteInZone, midiNoteToName, nameToMidiNote } from '@/lib/noteHelpers';
import { ZONE_COLORS } from '@/lib/constants';

interface KeyboardProps {
  keys: number;
  startNote: string;
  zones?: ZoneConfig[];
  highlightedKeys?: number[];
}

const zoneColorByNumber: Record<number, string> = {
  1: ZONE_COLORS.zone1,
  2: ZONE_COLORS.zone2,
  3: ZONE_COLORS.zone3,
  4: ZONE_COLORS.zone4,
  5: ZONE_COLORS.zone5,
  6: ZONE_COLORS.zone6,
  7: ZONE_COLORS.zone7,
  8: ZONE_COLORS.zone8,
};

export default function Keyboard({ keys, startNote, zones = [], highlightedKeys = [] }: KeyboardProps) {
  const lowestMidi = useMemo(() => nameToMidiNote(startNote), [startNote]);
  const highestNote = lowestMidi + keys - 1;

  const allNotes = useMemo(() => generateKeyboardNotes(lowestMidi, highestNote), [lowestMidi, highestNote]);
  const whiteNotes = useMemo(() => allNotes.filter((n) => !n.isBlack), [allNotes]);
  const blackNotes = useMemo(() => allNotes.filter((n) => n.isBlack), [allNotes]);

  // Find which zone(s) a note belongs to (first match)
  const getZoneForNote = (midi: number): ZoneConfig | undefined => {
    return zones.find((z) => noteInZone(midi, z.lowNote, z.highNote));
  };

  // Build a lookup for white key index by midi note
  const whiteKeyIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    whiteNotes.forEach((note, idx) => {
      map.set(note.midiNote, idx);
    });
    return map;
  }, [whiteNotes]);

  const totalWhiteKeys = whiteNotes.length;

  return (
    <motion.div
      className="flex flex-col w-full h-full"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      {/* Keyboard container — h-full fills parent, falls back to h-32 if no parent height */}
      <div className="relative w-full h-full min-h-[80px] select-none">
        {/* White keys */}
        <div className="flex h-full">
          {whiteNotes.map((note) => {
            const zone = getZoneForNote(note.midiNote);
            const isHighlighted = highlightedKeys.includes(note.midiNote);
            const zoneColor = zone
              ? zoneColorByNumber[zone.zoneNumber] ?? '#888888'
              : undefined;
            const isC = note.name === 'C';

            return (
              <div
                key={note.midiNote}
                data-key-type="white"
                className="relative flex-1 border-r border-neutral-300"
                style={{
                  backgroundColor: isHighlighted ? '#ffffcc' : '#f5f5f0',
                  borderRightWidth: 1,
                  borderColor: '#bbb',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 2px 3px rgba(0,0,0,0.15) inset, -1px 0 0 rgba(0,0,0,0.04)',
                }}
              >
                {/* Zone color overlay */}
                {zoneColor && (
                  <div
                    className="absolute inset-0 rounded-b-[4px] pointer-events-none"
                    style={{
                      backgroundColor: zoneColor,
                      opacity: 0.2,
                    }}
                  />
                )}

                {/* C note label */}
                {isC && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] text-neutral-500 pointer-events-none">
                    {midiNoteToName(note.midiNote)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Black keys */}
        {blackNotes.map((note) => {
          const precWhiteIdx = findPrecedingWhiteKeyIndex(note.midiNote, whiteKeyIndexMap, allNotes);
          if (precWhiteIdx === undefined) return null;

          const leftPercent = ((precWhiteIdx + 0.55) / totalWhiteKeys) * 100;
          const widthPercent = (0.65 / totalWhiteKeys) * 100;

          const zone = getZoneForNote(note.midiNote);
          const isHighlighted = highlightedKeys.includes(note.midiNote);
          const zoneColor = zone
            ? zoneColorByNumber[zone.zoneNumber] ?? '#888888'
            : undefined;

          return (
            <div
              key={note.midiNote}
              data-key-type="black"
              className="absolute top-0 rounded-b-sm"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                height: '62%',
                transform: 'translateX(-50%)',
                backgroundColor: isHighlighted ? '#666644' : '#1a1a1a',
                zIndex: 2,
                boxShadow: '1px 3px 4px rgba(0,0,0,0.5), inset 0 -2px 3px rgba(255,255,255,0.05)',
                background: isHighlighted
                  ? '#666644'
                  : 'linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 60%, #111 100%)',
              }}
            >
              {/* Zone color overlay on black key */}
              {zoneColor && (
                <div
                  className="absolute inset-0 rounded-b-sm pointer-events-none"
                  style={{
                    backgroundColor: zoneColor,
                    opacity: 0.3,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

    </motion.div>
  );
}

function findPrecedingWhiteKeyIndex(
  blackMidi: number,
  whiteKeyIndexMap: Map<number, number>,
  _allNotes: { midiNote: number; isBlack: boolean }[],
): number | undefined {
  for (let m = blackMidi - 1; m >= 0; m--) {
    const idx = whiteKeyIndexMap.get(m);
    if (idx !== undefined) return idx;
  }
  return undefined;
}
