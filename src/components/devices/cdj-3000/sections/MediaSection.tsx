'use client';

import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <div data-section-id="MEDIA">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '2.90%',
              top: '8.00%',
              width: '6.10%',
              height: '3.40%',
            }}
          >
            <Port
              id="USB_PORT"
              label=""
              variant="usb-a"
              highlighted={isHighlighted('USB_PORT')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '10.20%',
              top: '8.00%',
              width: '2.30%',
              height: '3.40%',
            }}
          >
            <LEDIndicator
              id="USB_INDICATOR"
              on={getState('USB_INDICATOR').ledOn ?? false}
              color="#22c55e"
              highlighted={isHighlighted('USB_INDICATOR')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '8.40%',
              top: '11.80%',
              width: '6.00%',
              height: '2.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="USB_STOP"
                label=""
                variant="standard"
                size="md"
                active={getState('USB_STOP').active}
                highlighted={isHighlighted('USB_STOP')}
                onClick={() => onButtonClick?.('USB_STOP')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '4.50%',
              top: '18.70%',
              width: '8.30%',
              height: '3.40%',
            }}
          >
            <LEDIndicator
              id="SD_INDICATOR"
              on={getState('SD_INDICATOR').ledOn ?? false}
              color="#f59e0b"
              highlighted={isHighlighted('SD_INDICATOR')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '4.50%',
              top: '16.10%',
              width: '8.30%',
              height: '3.40%',
            }}
          >
            <Port
              id="SD_SLOT"
              label=""
              variant="sd-card"
              highlighted={isHighlighted('SD_SLOT')}
            />
          </div>
      </div>
    </motion.div>
  );
}
