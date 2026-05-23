'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface SyncSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function SyncSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: SyncSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.40 }}
    >
      <div data-section-id="SYNC">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '92.30%',
              top: '47.60%',
              width: '5.30%',
              height: '3.40%',
            }}
          >
            <div>
              <PanelButton
                id="MASTER"
                label="MASTER"
                variant="standard"
                size="md"
                hasLed
                ledColor="#22c55e"
                active={getState('MASTER').active}
                highlighted={isHighlighted('MASTER')}
                onClick={() => onButtonClick?.('MASTER')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '89.70%',
              top: '51.10%',
              width: '5.30%',
              height: '3.40%',
            }}
          >
            <div>
              <PanelButton
                id="KEY_SYNC"
                label="KEY SYNC"
                variant="standard"
                size="md"
                surfaceColor="#ec4899"
                hasLed
                ledColor="#ec4899"
                active={getState('KEY_SYNC').active}
                highlighted={isHighlighted('KEY_SYNC')}
                onClick={() => onButtonClick?.('KEY_SYNC')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '87.10%',
              top: '47.60%',
              width: '5.30%',
              height: '3.40%',
            }}
          >
            <div>
              <PanelButton
                id="BEAT_SYNC_INST_DOUBLES"
                label="Beat Sync"
                variant="standard"
                size="md"
                hasLed
                ledColor="#3b82f6"
                active={getState('BEAT_SYNC_INST_DOUBLES').active}
                highlighted={isHighlighted('BEAT_SYNC_INST_DOUBLES')}
                onClick={() => onButtonClick?.('BEAT_SYNC_INST_DOUBLES')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
