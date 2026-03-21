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
      <div data-section-id="media" className="grid" style={{ gridTemplateColumns: 'repeat(undefined, 1fr)', gap: '4px' }}>
        <Port
          id="usb-port"
          label="USB port"
          variant="usb-a"
          highlighted={isHighlighted('usb-port')}
        />
        <LEDIndicator
          id="usb-indicator"
          on={getState('usb-indicator').ledOn ?? false}
          color="#22c55e"
          highlighted={isHighlighted('usb-indicator')}
        />
        <motion.div whileTap={{ scale: 0.95, y: 2 }}>
          <PanelButton
            id="usb-stop-btn"
            label="USB STOP"
            variant="standard"
            active={getState('usb-stop-btn').active}
            highlighted={isHighlighted('usb-stop-btn')}
            onClick={() => onButtonClick?.('usb-stop-btn')}
          />
        </motion.div>
        <Port
          id="sd-card-slot"
          label="SD memory card slot"
          variant="sd-card"
          highlighted={isHighlighted('sd-card-slot')}
        />
        <LEDIndicator
          id="sd-indicator"
          on={getState('sd-indicator').ledOn ?? false}
          color="#f59e0b"
          highlighted={isHighlighted('sd-indicator')}
        />
      </div>
    </motion.div>
  );
}
