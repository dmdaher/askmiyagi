'use client';

import { motion } from 'framer-motion';
import Knob from '@/components/controls/Knob';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface CueLoopMemorySectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function CueLoopMemorySection({
  panelState,
  highlightedControls,
  onButtonClick,
}: CueLoopMemorySectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  // Group labels are rendered inline within the section body

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.35 }}
    >
      <div data-section-id="cue-loop-memory">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '89.50%',
              top: '35.00%',
              width: '5.30%',
              height: '3.90%',
            }}
          >
            <Knob
              id="vinyl-speed-adj-knob"
              label="VINYL SPEED ADJ. TOUCH/BRAKE"
              value={getState('vinyl-speed-adj-knob').value ?? 64}
              highlighted={isHighlighted('vinyl-speed-adj-knob')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '60.10%',
              top: '41.20%',
              width: '8.80%',
              height: '2.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="cue-loop-call-left-btn"
                label="CUE/LOOP CALL ◄"
                variant="standard"
                iconContent="◀"
                active={getState('cue-loop-call-left-btn').active}
                highlighted={isHighlighted('cue-loop-call-left-btn')}
                onClick={() => onButtonClick?.('cue-loop-call-left-btn')}
              />
            </motion.div>
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
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="cue-loop-call-right-btn"
                label="CUE/LOOP CALL ►"
                variant="standard"
                iconContent="▶"
                active={getState('cue-loop-call-right-btn').active}
                highlighted={isHighlighted('cue-loop-call-right-btn')}
                onClick={() => onButtonClick?.('cue-loop-call-right-btn')}
              />
            </motion.div>
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
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="delete-btn"
                label="DELETE"
                variant="standard"
                active={getState('delete-btn').active}
                highlighted={isHighlighted('delete-btn')}
                onClick={() => onButtonClick?.('delete-btn')}
              />
            </motion.div>
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
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="memory-btn"
                label="MEMORY"
                variant="standard"
                active={getState('memory-btn').active}
                highlighted={isHighlighted('memory-btn')}
                onClick={() => onButtonClick?.('memory-btn')}
              />
            </motion.div>
          </div>
      </div>
    </motion.div>
  );
}
