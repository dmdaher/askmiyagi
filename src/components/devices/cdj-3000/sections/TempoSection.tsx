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
      transition={{ duration: 0.3, delay: 0.55 }}
    >
      <div data-section-id="TEMPO">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '84.30%',
              top: '58.80%',
              width: '16.30%',
              height: '2.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="TEMPO_RANGE"
                label=""
                variant="standard"
                size="md"
                active={getState('TEMPO_RANGE').active}
                highlighted={isHighlighted('TEMPO_RANGE')}
                onClick={() => onButtonClick?.('TEMPO_RANGE')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '84.30%',
              top: '64.00%',
              width: '16.30%',
              height: '2.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="MASTER_TEMPO"
                label=""
                variant="standard"
                size="md"
                hasLed
                ledColor="#f59e0b"
                active={getState('MASTER_TEMPO').active}
                highlighted={isHighlighted('MASTER_TEMPO')}
                onClick={() => onButtonClick?.('MASTER_TEMPO')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '88.50%',
              top: '69.20%',
              width: '8.00%',
              height: '26.20%',
            }}
          >
            <Slider
              id="TEMPO_SLIDER"
              label=""
              value={getState('TEMPO_SLIDER').value ?? 64}
              highlighted={isHighlighted('TEMPO_SLIDER')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.60%',
              top: '79.10%',
              width: '4.70%',
              height: '6.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="TEMPO_RESET"
                label=""
                variant="standard"
                size="md"
                active={getState('TEMPO_RESET').active}
                highlighted={isHighlighted('TEMPO_RESET')}
                onClick={() => onButtonClick?.('TEMPO_RESET')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '83.50%',
              top: '79.10%',
              width: '8.00%',
              height: '6.20%',
            }}
          >
            <LEDIndicator
              id="TEMPO_RESET_INDICATOR"
              on={getState('TEMPO_RESET_INDICATOR').ledOn ?? false}
              color="#22c55e"
              highlighted={isHighlighted('TEMPO_RESET_INDICATOR')}
            />
          </div>
      </div>
    </motion.div>
  );
}
