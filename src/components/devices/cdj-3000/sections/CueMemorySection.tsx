'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface CueMemorySectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function CueMemorySection({
  panelState,
  highlightedControls,
  onButtonClick,
}: CueMemorySectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.35 }}
    >
      <div data-section-id="CUE_MEMORY">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '59.60%',
              top: '41.20%',
              width: '8.80%',
              height: '2.40%',
            }}
          >
            <div>
              <PanelButton
                id="CUE_LOOP_CALL_BACK"
                label="CUE/LOOP CALL ◄"
                variant="transport"
                size="lg"
                iconContent="◀"
                active={getState('CUE_LOOP_CALL_BACK').active}
                highlighted={isHighlighted('CUE_LOOP_CALL_BACK')}
                onClick={() => onButtonClick?.('CUE_LOOP_CALL_BACK')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '64.80%',
              top: '41.20%',
              width: '8.80%',
              height: '2.40%',
            }}
          >
            <div>
              <PanelButton
                id="CUE_LOOP_CALL_FWD"
                label="CUE/LOOP CALL ►"
                variant="transport"
                size="lg"
                iconContent="▶"
                active={getState('CUE_LOOP_CALL_FWD').active}
                highlighted={isHighlighted('CUE_LOOP_CALL_FWD')}
                onClick={() => onButtonClick?.('CUE_LOOP_CALL_FWD')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '71.30%',
              top: '41.20%',
              width: '8.80%',
              height: '2.40%',
            }}
          >
            <div>
              <PanelButton
                id="DELETE"
                label=""
                variant="transport"
                size="lg"
                active={getState('DELETE').active}
                highlighted={isHighlighted('DELETE')}
                onClick={() => onButtonClick?.('DELETE')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '77.10%',
              top: '41.20%',
              width: '8.80%',
              height: '2.40%',
            }}
          >
            <div>
              <PanelButton
                id="MEMORY"
                label=""
                variant="transport"
                size="lg"
                active={getState('MEMORY').active}
                highlighted={isHighlighted('MEMORY')}
                onClick={() => onButtonClick?.('MEMORY')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
