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
      <div data-section-id="tempo">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '83.50%',
              top: '58.50%',
              width: '16.30%',
              height: '2.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="tempo-range-btn"
                label=""
                variant="standard"
                active={getState('tempo-range-btn').active}
                highlighted={isHighlighted('tempo-range-btn')}
                onClick={() => onButtonClick?.('tempo-range-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '83.50%',
              top: '63.00%',
              width: '16.30%',
              height: '2.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="master-tempo-btn"
                label=""
                variant="standard"
                hasLed
                ledColor="#f59e0b"
                active={getState('master-tempo-btn').active}
                highlighted={isHighlighted('master-tempo-btn')}
                onClick={() => onButtonClick?.('master-tempo-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '87.60%',
              top: '69.00%',
              width: '8.00%',
              height: '26.20%',
            }}
          >
            <Slider
              id="tempo-slider"
              label=""
              value={getState('tempo-slider').value ?? 64}
              highlighted={isHighlighted('tempo-slider')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '79.80%',
              top: '78.90%',
              width: '4.70%',
              height: '6.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="tempo-reset-btn"
                label=""
                variant="standard"
                active={getState('tempo-reset-btn').active}
                highlighted={isHighlighted('tempo-reset-btn')}
                onClick={() => onButtonClick?.('tempo-reset-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '81.50%',
              top: '79.00%',
              width: '8.00%',
              height: '6.20%',
            }}
          >
            <LEDIndicator
              id="tempo-reset-indicator"
              on={getState('tempo-reset-indicator').ledOn ?? false}
              color="#22c55e"
              highlighted={isHighlighted('tempo-reset-indicator')}
            />
          </div>
      </div>
    </motion.div>
  );
}
