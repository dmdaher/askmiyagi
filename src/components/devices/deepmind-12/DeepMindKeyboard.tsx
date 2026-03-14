'use client';

import { DM_KEY_COUNT, DM_LOWEST_NOTE } from '@/lib/devices/deepmind-12-constants';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function isBlackKey(midiNote: number): boolean {
  const n = midiNote % 12;
  return [1, 3, 6, 8, 10].includes(n);
}

interface DeepMindKeyboardProps {
  highlightedKeys?: number[];
}

export default function DeepMindKeyboard({ highlightedKeys = [] }: DeepMindKeyboardProps) {
  const keys: { midi: number; name: string; black: boolean }[] = [];
  for (let i = 0; i < DM_KEY_COUNT; i++) {
    const midi = DM_LOWEST_NOTE + i;
    const name = NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1);
    keys.push({ midi, name, black: isBlackKey(midi) });
  }

  const whiteKeys = keys.filter((k) => !k.black);
  const blackKeys = keys.filter((k) => k.black);
  const whiteKeyWidth = 100 / whiteKeys.length;

  // Calculate black key positions based on their adjacent white keys
  function getBlackKeyLeft(midi: number): number {
    const noteInOctave = midi % 12;
    // Find the white key index just before this black key
    let whiteIndex = 0;
    for (let i = DM_LOWEST_NOTE; i < midi; i++) {
      if (!isBlackKey(i)) whiteIndex++;
    }
    // Black keys sit between white keys with slight offsets
    const offsets: Record<number, number> = {
      1: -0.3, 3: 0.3, 6: -0.3, 8: 0, 10: 0.3,
    };
    const offset = offsets[noteInOctave] ?? 0;
    return (whiteIndex + 0.5 + offset * 0.15) * whiteKeyWidth;
  }

  return (
    <div data-section-id="keyboard" className="relative w-full" style={{ height: '100%' }}>
      {/* White keys */}
      <div className="relative flex h-full">
        {whiteKeys.map((key) => {
          const isHighlighted = highlightedKeys.includes(key.midi);
          return (
            <div
              key={key.midi}
              className="relative border-r cursor-pointer"
              style={{
                width: `${whiteKeyWidth}%`,
                height: '100%',
                background: isHighlighted
                  ? 'linear-gradient(to bottom, #ccddff 0%, #99bbee 100%)'
                  : 'linear-gradient(to bottom, #f8f8f8 0%, #e8e8e8 85%, #d0d0d0 100%)',
                borderRight: '1px solid #aaa',
                borderBottom: '2px solid #888',
                borderRadius: '0 0 3px 3px',
                boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          );
        })}
      </div>

      {/* Black keys */}
      {blackKeys.map((key) => {
        const left = getBlackKeyLeft(key.midi);
        const isHighlighted = highlightedKeys.includes(key.midi);
        return (
          <div
            key={key.midi}
            className="absolute top-0 cursor-pointer"
            style={{
              left: `${left}%`,
              width: `${whiteKeyWidth * 0.58}%`,
              height: '62%',
              background: isHighlighted
                ? 'linear-gradient(to bottom, #4466aa 0%, #223366 100%)'
                : 'linear-gradient(to bottom, #2a2a2a 0%, #111111 100%)',
              borderRadius: '0 0 3px 3px',
              boxShadow: '0 3px 6px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(255,255,255,0.05)',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          />
        );
      })}
    </div>
  );
}
