'use client';

import Knob from '@/components/controls/Knob';
import LEDIndicator from '@/components/controls/LEDIndicator';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface JogModeControlsSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function JogModeControlsSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: JogModeControlsSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
      <div data-section-id="jog-mode-controls" className="flex flex-col items-center gap-1">
        <PanelButton
          id="jog-mode-btn"
          label="JOG MODE"
          variant="standard"
          active={getState('jog-mode-btn').active}
          highlighted={isHighlighted('jog-mode-btn')}
          onClick={() => onButtonClick?.('jog-mode-btn')}
        />
        <LEDIndicator
          id="vinyl-cdj-indicator"
          on={getState('vinyl-cdj-indicator').ledOn ?? false}
          color="#22c55e"
          highlighted={isHighlighted('vinyl-cdj-indicator')}
        />
        <Knob
          id="jog-adjust-knob"
          label="JOG ADJUST"
          value={getState('jog-adjust-knob').value ?? 64}
          highlighted={isHighlighted('jog-adjust-knob')}
        />
      </div>
  );
}
