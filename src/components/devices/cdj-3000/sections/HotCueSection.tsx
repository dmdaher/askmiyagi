'use client';

import { motion } from 'framer-motion';
import PadButton from '@/components/controls/PadButton';
import { PanelState } from '@/types/panel';

interface HotCueSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function HotCueSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: HotCueSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  // Group labels are rendered inline within the section body

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <div data-section-id="hot-cue">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '15.10%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-a"
                label=""
                active={getState('hot-cue-a').active}
                highlighted={isHighlighted('hot-cue-a')}
                onClick={() => onButtonClick?.('hot-cue-a')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '23.80%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-b"
                label=""
                active={getState('hot-cue-b').active}
                highlighted={isHighlighted('hot-cue-b')}
                onClick={() => onButtonClick?.('hot-cue-b')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '32.50%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-c"
                label=""
                active={getState('hot-cue-c').active}
                highlighted={isHighlighted('hot-cue-c')}
                onClick={() => onButtonClick?.('hot-cue-c')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '41.10%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-d"
                label=""
                active={getState('hot-cue-d').active}
                highlighted={isHighlighted('hot-cue-d')}
                onClick={() => onButtonClick?.('hot-cue-d')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '50.90%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-e"
                label=""
                active={getState('hot-cue-e').active}
                highlighted={isHighlighted('hot-cue-e')}
                onClick={() => onButtonClick?.('hot-cue-e')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '59.60%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-f"
                label=""
                active={getState('hot-cue-f').active}
                highlighted={isHighlighted('hot-cue-f')}
                onClick={() => onButtonClick?.('hot-cue-f')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '68.60%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-g"
                label=""
                active={getState('hot-cue-g').active}
                highlighted={isHighlighted('hot-cue-g')}
                onClick={() => onButtonClick?.('hot-cue-g')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '77.10%',
              top: '34.90%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.93, y: 2 }}>
              <PadButton
                id="hot-cue-h"
                label=""
                active={getState('hot-cue-h').active}
                highlighted={isHighlighted('hot-cue-h')}
                onClick={() => onButtonClick?.('hot-cue-h')}
              />
            </motion.div>
          </div>
      </div>
    </motion.div>
  );
}
