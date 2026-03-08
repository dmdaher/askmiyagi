'use client';

import Knob from '@/components/controls/Knob';
import { PanelState } from '@/types/panel';

interface EQChannelProps {
  channel: 1 | 2;
  panelState: PanelState;
  highlightedControls: string[];
}

export default function EQChannel({ channel, panelState, highlightedControls }: EQChannelProps) {
  const ch = `ch${channel}`;
  const isHl = (id: string) => highlightedControls.includes(id);
  const getValue = (id: string) => panelState[id]?.value ?? 64;

  const knobs = [
    { id: `${ch}-hi`, label: 'HI' },
    { id: `${ch}-mid`, label: 'MID' },
    { id: `${ch}-low`, label: 'LOW' },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      {knobs.map(knob => (
        <Knob key={knob.id} id={knob.id} label={knob.label}
          value={getValue(knob.id)} highlighted={isHl(knob.id)} size="md" />
      ))}
    </div>
  );
}
