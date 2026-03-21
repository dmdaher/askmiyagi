'use client';

import PadButton from '@/components/controls/PadButton';
import { PanelState } from '@/types/panel';

interface HotCueSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function HotCueSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: HotCueSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  // Group labels are rendered inline within the section body

  return (
      <div data-section-id="hot-cue" className="flex flex-row items-center gap-1">
        <PadButton
          id="hot-cue-a"
          label="HOT CUE A"
          active={getState('hot-cue-a').active}
          highlighted={isHighlighted('hot-cue-a')}
          onClick={() => onButtonClick?.('hot-cue-a')}
        />
        <PadButton
          id="hot-cue-b"
          label="HOT CUE B"
          active={getState('hot-cue-b').active}
          highlighted={isHighlighted('hot-cue-b')}
          onClick={() => onButtonClick?.('hot-cue-b')}
        />
        <PadButton
          id="hot-cue-c"
          label="HOT CUE C"
          active={getState('hot-cue-c').active}
          highlighted={isHighlighted('hot-cue-c')}
          onClick={() => onButtonClick?.('hot-cue-c')}
        />
        <PadButton
          id="hot-cue-d"
          label="HOT CUE D"
          active={getState('hot-cue-d').active}
          highlighted={isHighlighted('hot-cue-d')}
          onClick={() => onButtonClick?.('hot-cue-d')}
        />
        <PadButton
          id="hot-cue-e"
          label="HOT CUE E"
          active={getState('hot-cue-e').active}
          highlighted={isHighlighted('hot-cue-e')}
          onClick={() => onButtonClick?.('hot-cue-e')}
        />
        <PadButton
          id="hot-cue-f"
          label="HOT CUE F"
          active={getState('hot-cue-f').active}
          highlighted={isHighlighted('hot-cue-f')}
          onClick={() => onButtonClick?.('hot-cue-f')}
        />
        <PadButton
          id="hot-cue-g"
          label="HOT CUE G"
          active={getState('hot-cue-g').active}
          highlighted={isHighlighted('hot-cue-g')}
          onClick={() => onButtonClick?.('hot-cue-g')}
        />
        <PadButton
          id="hot-cue-h"
          label="HOT CUE H"
          active={getState('hot-cue-h').active}
          highlighted={isHighlighted('hot-cue-h')}
          onClick={() => onButtonClick?.('hot-cue-h')}
        />
      </div>
  );
}
