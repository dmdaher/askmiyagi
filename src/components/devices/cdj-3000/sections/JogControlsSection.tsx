'use client';

import { motion } from 'framer-motion';
import Knob from '@/components/controls/Knob';
import LEDIndicator from '@/components/controls/LEDIndicator';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface JogControlsSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function JogControlsSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: JogControlsSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <div data-section-id="JOG_CONTROLS">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.50%',
              top: '24.40%',
              width: '12.70%',
              height: '4.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="TRACK_FILTER_EDIT"
                label="TRACK FILTER/EDIT"
                variant="standard"
                size="md"
                active={getState('TRACK_FILTER_EDIT').active}
                highlighted={isHighlighted('TRACK_FILTER_EDIT')}
                onClick={() => onButtonClick?.('TRACK_FILTER_EDIT')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '87.70%',
              top: '24.40%',
              width: '12.70%',
              height: '4.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="SHORTCUT"
                label="SHORTCUT"
                variant="standard"
                size="md"
                active={getState('SHORTCUT').active}
                highlighted={isHighlighted('SHORTCUT')}
                onClick={() => onButtonClick?.('SHORTCUT')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '89.50%',
              top: '35.10%',
              width: '5.30%',
              height: '3.90%',
            }}
          >
            <Knob
              id="VINYL_SPEED_ADJ"
              label=""
              value={getState('VINYL_SPEED_ADJ').value ?? 64}
              highlighted={isHighlighted('VINYL_SPEED_ADJ')}
            />
          </div>
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
                id="JOG_MODE"
                label=""
                variant="standard"
                size="md"
                active={getState('JOG_MODE').active}
                highlighted={isHighlighted('JOG_MODE')}
                onClick={() => onButtonClick?.('JOG_MODE')}
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
              id="VINYL_CDJ_INDICATOR"
              on={getState('VINYL_CDJ_INDICATOR').ledOn ?? false}
              color="#22c55e"
              highlighted={isHighlighted('VINYL_CDJ_INDICATOR')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '70.40%',
              top: '47.40%',
              width: '14.70%',
              height: '2.90%',
            }}
          >
            <Knob
              id="JOG_ADJUST"
              label=""
              value={getState('JOG_ADJUST').value ?? 64}
              highlighted={isHighlighted('JOG_ADJUST')}
            />
          </div>
      </div>
    </motion.div>
  );
}
