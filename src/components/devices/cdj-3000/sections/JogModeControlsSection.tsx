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
      <div data-section-id="jog-mode-controls">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '91.70%',
              top: '41.00%',
              width: '6.70%',
              height: '2.90%',
            }}
          >
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
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '84.80%',
              top: '41.00%',
              width: '6.70%',
              height: '2.90%',
            }}
          >
            <LEDIndicator
              id="vinyl-cdj-indicator"
              on={getState('vinyl-cdj-indicator').ledOn ?? false}
              color="#22c55e"
              highlighted={isHighlighted('vinyl-cdj-indicator')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '70.40%',
              top: '47.30%',
              width: '14.70%',
              height: '2.90%',
            }}
          >
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
