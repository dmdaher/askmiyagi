'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import ValueDial from '@/components/controls/ValueDial';
import { PanelState } from '@/types/panel';

interface NavigationSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function NavigationSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: NavigationSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div data-section-id="navigation">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '78.90%',
              top: '11.00%',
              width: '12.70%',
              height: '4.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="back-btn"
                label="BACK"
                variant="standard"
                active={getState('back-btn').active}
                highlighted={isHighlighted('back-btn')}
                onClick={() => onButtonClick?.('back-btn')}
              />
            </motion.div>
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
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="tag-track-remove-btn"
                label="TAG TRACK/REMOVE"
                variant="standard"
                active={getState('tag-track-remove-btn').active}
                highlighted={isHighlighted('tag-track-remove-btn')}
                onClick={() => onButtonClick?.('tag-track-remove-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '83.70%',
              top: '13.80%',
              width: '12.00%',
              height: '9.70%',
            }}
          >
            <ValueDial
              id="rotary-selector"
              label=""
              hasPush
              highlighted={isHighlighted('rotary-selector')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.40%',
              top: '24.30%',
              width: '12.70%',
              height: '4.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="track-filter-edit-btn"
                label="TRACK FILTER/EDIT"
                variant="standard"
                active={getState('track-filter-edit-btn').active}
                highlighted={isHighlighted('track-filter-edit-btn')}
                onClick={() => onButtonClick?.('track-filter-edit-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '87.70%',
              top: '24.30%',
              width: '12.70%',
              height: '4.40%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="shortcut-btn"
                label="SHORTCUT"
                variant="standard"
                active={getState('shortcut-btn').active}
                highlighted={isHighlighted('shortcut-btn')}
                onClick={() => onButtonClick?.('shortcut-btn')}
              />
            </motion.div>
          </div>
      </div>
    </motion.div>
  );
}
