'use client';

import { motion } from 'framer-motion';
import TouchDisplay from '@/components/controls/TouchDisplay';
import Wheel from '@/components/controls/Wheel';
import { PanelState } from '@/types/panel';

interface JogWheelSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function JogWheelSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: JogWheelSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.50 }}
    >
      <div data-section-id="JOG_WHEEL">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '17.60%',
              top: '46.60%',
              width: '67.30%',
              height: '42.70%',
            }}
          >
            <Wheel
              id="JOG_WHEEL"
              label=""
              width={120}
              height={120}
              highlighted={isHighlighted('JOG_WHEEL')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '29.90%',
              top: '60.50%',
              width: '42.70%',
              height: '14.90%',
            }}
          >
            <TouchDisplay
              id="JOG_DISPLAY"
              label=""
              variant="main"
              showMockContent
              width={200}
              height={120}
              highlighted={isHighlighted('JOG_DISPLAY')}
            />
          </div>
      </div>
    </motion.div>
  );
}
