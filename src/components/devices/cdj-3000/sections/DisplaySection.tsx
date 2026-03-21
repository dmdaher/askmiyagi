'use client';

import TouchDisplay from '@/components/controls/TouchDisplay';
import { PanelState } from '@/types/panel';

interface DisplaySectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function DisplaySection({
  panelState,
  highlightedControls,
  onButtonClick,
}: DisplaySectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
      <div data-section-id="display" className="flex flex-col items-center gap-1">
        <TouchDisplay
          id="touch-display"
          label="Touch display"
          variant="main"
          showMockContent
          width={200}
          height={120}
          highlighted={isHighlighted('touch-display')}
        />
      </div>
  );
}
