'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface BeatSyncSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function BeatSyncSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: BeatSyncSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.55 }}
    >
      <div data-section-id="beat-sync" className="flex flex-col gap-1">
        <div className="flex flex-row gap-1 justify-center">
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="beat-sync-inst-doubles-btn"
                label="INST.DOUBLES"
                variant="standard"
                hasLed
                ledColor="#3b82f6"
                active={getState('beat-sync-inst-doubles-btn').active}
                highlighted={isHighlighted('beat-sync-inst-doubles-btn')}
                onClick={() => onButtonClick?.('beat-sync-inst-doubles-btn')}
              />
            </motion.div>
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="master-btn"
                label="MASTER"
                variant="standard"
                hasLed
                ledColor="#22c55e"
                active={getState('master-btn').active}
                highlighted={isHighlighted('master-btn')}
                onClick={() => onButtonClick?.('master-btn')}
              />
            </motion.div>
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="key-sync-btn"
                label="KEY SYNC"
                variant="standard"
                surfaceColor="#ec4899"
                hasLed
                ledColor="#ec4899"
                active={getState('key-sync-btn').active}
                highlighted={isHighlighted('key-sync-btn')}
                onClick={() => onButtonClick?.('key-sync-btn')}
              />
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
