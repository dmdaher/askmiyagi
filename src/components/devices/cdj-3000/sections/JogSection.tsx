'use client';

import { motion } from 'framer-motion';
import JogWheelAssembly from '@/components/controls/JogWheelAssembly';
import TouchDisplay from '@/components/controls/TouchDisplay';
import Wheel from '@/components/controls/Wheel';
import { PanelState } from '@/types/panel';

interface JogSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function JogSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: JogSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.45 }}
    >
      <div data-section-id="jog" className="flex flex-col items-center gap-1">
          <JogWheelAssembly
            id="jog-wheel"
            label="Jog wheel (–REV/+FWD)"
            wheelSize={160}
            displaySize={60}
            ringColor="#22c55e"
            highlighted={isHighlighted('jog-wheel')}
          />
      </div>
    </motion.div>
  );
}
