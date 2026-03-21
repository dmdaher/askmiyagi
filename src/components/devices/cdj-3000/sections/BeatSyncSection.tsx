'use client';

import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface BeatSyncSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function BeatSyncSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: BeatSyncSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
      <div data-section-id="beat-sync" className="flex flex-col items-center gap-1">
        <PanelButton
          id="beat-sync-inst-doubles-btn"
          label="BEAT SYNC/INST.DOUBLES"
          variant="standard"
          hasLed
          ledColor="#3b82f6"
          active={getState('beat-sync-inst-doubles-btn').active}
          highlighted={isHighlighted('beat-sync-inst-doubles-btn')}
          onClick={() => onButtonClick?.('beat-sync-inst-doubles-btn')}
        />
        <PanelButton
          id="master-btn"
          label="MASTER"
          variant="standard"
          hasLed
          ledColor="#22c55e"
          active={getState('master-btn').active}
          highlighted={isHighlighted('master-btn')}
          onClick={() => onButtonClick?.('master-btn')}
        />
        <PanelButton
          id="key-sync-btn"
          label="KEY SYNC"
          variant="standard"
          surfaceColor="#ec4899"
          hasLed
          ledColor="#ec4899"
          active={getState('key-sync-btn').active}
          highlighted={isHighlighted('key-sync-btn')}
          onClick={() => onButtonClick?.('key-sync-btn')}
        />
      </div>
  );
}
