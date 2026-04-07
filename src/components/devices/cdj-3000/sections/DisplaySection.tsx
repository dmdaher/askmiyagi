'use client';

import { motion } from 'framer-motion';
import TouchDisplay from '@/components/controls/TouchDisplay';
import { PanelState } from '@/types/panel';

interface DisplaySectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function DisplaySection({
  panelState,
  highlightedControls,
  onButtonClick,
}: DisplaySectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.10 }}
    >
      <div data-section-id="DISPLAY">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '19.70%',
              top: '7.60%',
              width: '60.00%',
              height: '25.20%',
            }}
          >
            <TouchDisplay
              id="TOUCH_DISPLAY"
              label=""
              variant="main"
              showMockContent
              width={200}
              height={120}
              highlighted={isHighlighted('TOUCH_DISPLAY')}
            />
          </div>
      </div>
    </motion.div>
  );
}
