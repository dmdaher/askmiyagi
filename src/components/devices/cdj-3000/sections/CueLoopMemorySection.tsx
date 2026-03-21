'use client';

import Knob from '@/components/controls/Knob';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface CueLoopMemorySectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function CueLoopMemorySection({
  panelState,
  highlightedControls,
  onButtonClick,
}: CueLoopMemorySectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  // Group labels are rendered inline within the section body

  return (
      <div data-section-id="cue-loop-memory" className="flex flex-col h-full">
        <div className="flex flex-col items-center" style={{ flex: '0 0 30%' }}>
          <Knob
            id="vinyl-speed-adj-knob"
            label="VINYL SPEED ADJ. TOUCH/BRAKE"
            value={getState('vinyl-speed-adj-knob').value ?? 64}
            highlighted={isHighlighted('vinyl-speed-adj-knob')}
          />
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(2, 1fr)', flex: '0 0 65%' }}>
          <PanelButton
            id="cue-loop-call-left-btn"
            label="CUE/LOOP CALL ◄"
            variant="standard"
            iconContent="◀"
            active={getState('cue-loop-call-left-btn').active}
            highlighted={isHighlighted('cue-loop-call-left-btn')}
            onClick={() => onButtonClick?.('cue-loop-call-left-btn')}
          />
          <PanelButton
            id="cue-loop-call-right-btn"
            label="CUE/LOOP CALL ►"
            variant="standard"
            iconContent="▶"
            active={getState('cue-loop-call-right-btn').active}
            highlighted={isHighlighted('cue-loop-call-right-btn')}
            onClick={() => onButtonClick?.('cue-loop-call-right-btn')}
          />
          <PanelButton
            id="delete-btn"
            label="DELETE"
            variant="standard"
            active={getState('delete-btn').active}
            highlighted={isHighlighted('delete-btn')}
            onClick={() => onButtonClick?.('delete-btn')}
          />
          <PanelButton
            id="memory-btn"
            label="MEMORY"
            variant="standard"
            active={getState('memory-btn').active}
            highlighted={isHighlighted('memory-btn')}
            onClick={() => onButtonClick?.('memory-btn')}
          />
        </div>
      </div>
  );
}
