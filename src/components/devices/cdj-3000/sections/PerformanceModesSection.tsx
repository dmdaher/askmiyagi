'use client';

import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface PerformanceModesSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function PerformanceModesSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: PerformanceModesSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
      <div data-section-id="performance-modes" className="flex flex-col items-center gap-1">
        <PanelButton
          id="time-mode-btn"
          label="TIME MODE/AUTO CUE"
          variant="rubber"
          hasLed
          ledColor="#22c55e"
          active={getState('time-mode-btn').active}
          highlighted={isHighlighted('time-mode-btn')}
          onClick={() => onButtonClick?.('time-mode-btn')}
        />
        <PanelButton
          id="quantize-btn"
          label="QUANTIZE"
          variant="rubber"
          hasLed
          ledColor="#ef4444"
          active={getState('quantize-btn').active}
          highlighted={isHighlighted('quantize-btn')}
          onClick={() => onButtonClick?.('quantize-btn')}
        />
        <PanelButton
          id="slip-btn"
          label="SLIP"
          variant="rubber"
          hasLed
          ledColor="#3b82f6"
          active={getState('slip-btn').active}
          highlighted={isHighlighted('slip-btn')}
          onClick={() => onButtonClick?.('slip-btn')}
        />
      </div>
  );
}
