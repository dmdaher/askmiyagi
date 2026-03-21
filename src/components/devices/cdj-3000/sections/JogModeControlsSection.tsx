'use client';

import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.50 }}
    >
      <div data-section-id="jog-mode-controls" className="flex flex-col gap-1">
        <div className="flex flex-row gap-1 justify-center">
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="jog-mode-btn"
              label="JOG MODE"
              variant="standard"
              active={getState('jog-mode-btn').active}
              highlighted={isHighlighted('jog-mode-btn')}
              onClick={() => onButtonClick?.('jog-mode-btn')}
            />
          </motion.div>
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
      </div>
    </motion.div>
  );
}
