'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import ValueDial from '@/components/controls/ValueDial';
import { PanelState } from '@/types/panel';

interface SelectorSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function SelectorSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: SelectorSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div data-section-id="SELECTOR">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '78.90%',
              top: '11.00%',
              width: '12.70%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="BACK"
                label="BACK"
                variant="standard"
                size="md"
                active={getState('BACK').active}
                highlighted={isHighlighted('BACK')}
                onClick={() => onButtonClick?.('BACK')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '87.70%',
              top: '11.00%',
              width: '12.70%',
              height: '4.40%',
            }}
          >
            <div>
              <PanelButton
                id="TAG_TRACK_REMOVE"
                label="TAG TRACK/REMOVE"
                variant="standard"
                size="md"
                active={getState('TAG_TRACK_REMOVE').active}
                highlighted={isHighlighted('TAG_TRACK_REMOVE')}
                onClick={() => onButtonClick?.('TAG_TRACK_REMOVE')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '83.70%',
              top: '13.90%',
              width: '12.00%',
              height: '9.70%',
            }}
          >
            <ValueDial
              id="ROTARY_SELECTOR"
              label=""
              highlighted={isHighlighted('ROTARY_SELECTOR')}
            />
          </div>
      </div>
    </motion.div>
  );
}
