'use client';

import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import { PanelState } from '@/types/panel';

interface BrowseSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function BrowseSection({ panelState, highlightedControls, onButtonClick }: BrowseSectionProps) {
  const isHl = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <PanelButton id="d1-load" label="LOAD" variant="standard" size="sm"
        active={getState('d1-load').active} highlighted={isHl('d1-load')}
        onClick={() => onButtonClick?.('d1-load')} />
      <Knob id="browse" label="" value={64} highlighted={isHl('browse')} size="md" />
      <PanelButton id="d2-load" label="LOAD" variant="standard" size="sm"
        active={getState('d2-load').active} highlighted={isHl('d2-load')}
        onClick={() => onButtonClick?.('d2-load')} />
    </div>
  );
}
