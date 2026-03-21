'use client';

import LEDIndicator from '@/components/controls/LEDIndicator';
import PanelButton from '@/components/controls/PanelButton';
import Slider from '@/components/controls/Slider';
import { PanelState } from '@/types/panel';

interface TempoSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function TempoSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: TempoSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
      <div data-section-id="tempo" className="flex flex-col h-full">
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(1, 1fr)', flex: '0 0 20%' }}>
          <PanelButton
            id="tempo-range-btn"
            label="TEMPO ±6/±10/±16/WIDE"
            variant="standard"
            active={getState('tempo-range-btn').active}
            highlighted={isHighlighted('tempo-range-btn')}
            onClick={() => onButtonClick?.('tempo-range-btn')}
          />
          <PanelButton
            id="master-tempo-btn"
            label="MASTER TEMPO"
            variant="standard"
            hasLed
            ledColor="#f59e0b"
            active={getState('master-tempo-btn').active}
            highlighted={isHighlighted('master-tempo-btn')}
            onClick={() => onButtonClick?.('master-tempo-btn')}
          />
        </div>
        <div className="flex flex-col items-center" style={{ flex: '0 0 75%' }}>
          <div className="flex flex-row gap-1 w-full h-full">
            <div className="flex flex-col gap-1 flex-1">
              <Slider
                id="tempo-slider"
                label="TEMPO slider"
                value={getState('tempo-slider').value ?? 64}
                highlighted={isHighlighted('tempo-slider')}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <PanelButton
                id="tempo-reset-btn"
                label="TEMPO RESET"
                variant="standard"
                active={getState('tempo-reset-btn').active}
                highlighted={isHighlighted('tempo-reset-btn')}
                onClick={() => onButtonClick?.('tempo-reset-btn')}
              />
              <LEDIndicator
                id="tempo-reset-indicator"
                on={getState('tempo-reset-indicator').ledOn ?? false}
                color="#22c55e"
                highlighted={isHighlighted('tempo-reset-indicator')}
              />
            </div>
          </div>
        </div>
      </div>
  );
}
