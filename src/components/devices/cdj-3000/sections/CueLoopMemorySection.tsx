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
      <div data-section-id="cue-loop-memory" className="flex flex-col gap-1">
        <div className="flex flex-row gap-1 justify-center">
          <Knob
            id="vinyl-speed-adj-knob"
            label="VINYL SPEED ADJ. TOUCH/BRAKE"
            value={getState('vinyl-speed-adj-knob').value ?? 64}
            highlighted={isHighlighted('vinyl-speed-adj-knob')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
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
