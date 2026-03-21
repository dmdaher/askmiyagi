'use client';

import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.60 }}
    >
      <div data-section-id="tempo" className="grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', gap: '4px' }}>
        <motion.div whileTap={{ scale: 0.95, y: 2 }}>
          <PanelButton
            id="tempo-range-btn"
            label="TEMPO ±6/±10/±16/WIDE"
            variant="standard"
            active={getState('tempo-range-btn').active}
            highlighted={isHighlighted('tempo-range-btn')}
            onClick={() => onButtonClick?.('tempo-range-btn')}
          />
        </motion.div>
        <motion.div whileTap={{ scale: 0.95, y: 2 }}>
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
        </motion.div>
        <Slider
          id="tempo-slider"
          label="TEMPO slider"
          value={getState('tempo-slider').value ?? 64}
          highlighted={isHighlighted('tempo-slider')}
        />
        <motion.div whileTap={{ scale: 0.95, y: 2 }}>
          <PanelButton
            id="tempo-reset-btn"
            label="TEMPO RESET"
            variant="standard"
            active={getState('tempo-reset-btn').active}
            highlighted={isHighlighted('tempo-reset-btn')}
            onClick={() => onButtonClick?.('tempo-reset-btn')}
          />
        </motion.div>
        <LEDIndicator
          id="tempo-reset-indicator"
          on={getState('tempo-reset-indicator').ledOn ?? false}
          color="#22c55e"
          highlighted={isHighlighted('tempo-reset-indicator')}
        />
      </div>
    </motion.div>
  );
}
