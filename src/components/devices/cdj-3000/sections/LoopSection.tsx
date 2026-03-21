'use client';

import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface LoopSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function LoopSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: LoopSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
      <div data-section-id="loop" className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
        <PanelButton
          id="loop-in-cue-btn"
          label="LOOP IN/CUE (IN ADJUST)"
          variant="standard"
          hasLed
          ledColor="#22c55e"
          active={getState('loop-in-cue-btn').active}
          highlighted={isHighlighted('loop-in-cue-btn')}
          onClick={() => onButtonClick?.('loop-in-cue-btn')}
        />
        <PanelButton
          id="loop-out-btn"
          label="LOOP OUT (OUT ADJUST)"
          variant="standard"
          hasLed
          ledColor="#22c55e"
          active={getState('loop-out-btn').active}
          highlighted={isHighlighted('loop-out-btn')}
          onClick={() => onButtonClick?.('loop-out-btn')}
        />
        <PanelButton
          id="loop-reloop-exit-btn"
          label="LOOP RELOOP/EXIT"
          variant="standard"
          hasLed
          ledColor="#22c55e"
          active={getState('loop-reloop-exit-btn').active}
          highlighted={isHighlighted('loop-reloop-exit-btn')}
          onClick={() => onButtonClick?.('loop-reloop-exit-btn')}
        />
        <PanelButton
          id="4-beat-loop-btn"
          label="4 BEAT LOOP (1/2X)"
          variant="standard"
          hasLed
          ledColor="#22c55e"
          active={getState('4-beat-loop-btn').active}
          highlighted={isHighlighted('4-beat-loop-btn')}
          onClick={() => onButtonClick?.('4-beat-loop-btn')}
        />
        <PanelButton
          id="8-beat-loop-btn"
          label="8 BEAT LOOP (2X)"
          variant="standard"
          hasLed
          ledColor="#22c55e"
          active={getState('8-beat-loop-btn').active}
          highlighted={isHighlighted('8-beat-loop-btn')}
          onClick={() => onButtonClick?.('8-beat-loop-btn')}
        />
      </div>
  );
}
