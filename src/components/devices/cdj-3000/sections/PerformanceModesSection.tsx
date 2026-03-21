'use client';

import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.20 }}
    >
      <div data-section-id="performance-modes">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '4.20%',
              top: '24.30%',
              width: '8.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
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
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '6.50%',
              top: '28.30%',
              width: '8.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
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
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.90%',
              top: '28.30%',
              width: '8.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
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
            </motion.div>
          </div>
      </div>
    </motion.div>
  );
}
