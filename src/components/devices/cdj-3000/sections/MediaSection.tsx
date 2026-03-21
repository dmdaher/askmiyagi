'use client';

import LEDIndicator from '@/components/controls/LEDIndicator';
import PanelButton from '@/components/controls/PanelButton';
import Port from '@/components/controls/Port';
import { PanelState } from '@/types/panel';

interface MediaSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function MediaSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: MediaSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
      <div data-section-id="media" className="flex flex-col gap-1">
        <div className="flex flex-row gap-1 justify-center">
          <Port
            id="usb-port"
            label="USB port"
            variant="usb-a"
            highlighted={isHighlighted('usb-port')}
          />
          <LEDIndicator
            id="usb-indicator"
            on={getState('usb-indicator').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('usb-indicator')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
          <PanelButton
            id="usb-stop-btn"
            label="USB STOP"
            variant="standard"
            active={getState('usb-stop-btn').active}
            highlighted={isHighlighted('usb-stop-btn')}
            onClick={() => onButtonClick?.('usb-stop-btn')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
          <Port
            id="sd-card-slot"
            label="SD memory card slot"
            variant="sd-card"
            highlighted={isHighlighted('sd-card-slot')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
          <LEDIndicator
            id="sd-indicator"
            on={getState('sd-indicator').ledOn ?? false}
            color="#f59e0b"
            highlighted={isHighlighted('sd-indicator')}
          />
        </div>
      </div>
  );
}
