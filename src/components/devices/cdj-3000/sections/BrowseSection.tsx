'use client';

import { motion } from 'framer-motion';
import LEDIndicator from '@/components/controls/LEDIndicator';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface BrowseSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function BrowseSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: BrowseSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.00 }}
    >
      <div data-section-id="BROWSE">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '11.20%',
              top: '2.00%',
              width: '21.30%',
              height: '3.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="SOURCE"
                label="SOURCE"
                variant="flat-key"
                size="md"
                active={getState('SOURCE').active}
                highlighted={isHighlighted('SOURCE')}
                onClick={() => onButtonClick?.('SOURCE')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '22.30%',
              top: '2.00%',
              width: '21.30%',
              height: '3.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="BROWSE_BTN"
                label="BROWSE"
                variant="flat-key"
                size="md"
                active={getState('BROWSE_BTN').active}
                highlighted={isHighlighted('BROWSE_BTN')}
                onClick={() => onButtonClick?.('BROWSE_BTN')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '44.60%',
              top: '2.00%',
              width: '21.30%',
              height: '3.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="TAG_LIST"
                label="TAG LIST"
                variant="flat-key"
                size="md"
                active={getState('TAG_LIST').active}
                highlighted={isHighlighted('TAG_LIST')}
                onClick={() => onButtonClick?.('TAG_LIST')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '48.50%',
              top: '2.00%',
              width: '2.50%',
              height: '1.70%',
            }}
          >
            <LEDIndicator
              id="SOURCE_INDICATOR"
              on={getState('SOURCE_INDICATOR').ledOn ?? false}
              color="#22c55e"
              highlighted={isHighlighted('SOURCE_INDICATOR')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.70%',
              top: '2.00%',
              width: '21.30%',
              height: '3.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="PLAYLIST"
                label="PLAYLIST"
                variant="flat-key"
                size="md"
                active={getState('PLAYLIST').active}
                highlighted={isHighlighted('PLAYLIST')}
                onClick={() => onButtonClick?.('PLAYLIST')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '55.60%',
              top: '2.00%',
              width: '21.30%',
              height: '3.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="SEARCH_BTN"
                label="SEARCH"
                variant="flat-key"
                size="md"
                active={getState('SEARCH_BTN').active}
                highlighted={isHighlighted('SEARCH_BTN')}
                onClick={() => onButtonClick?.('SEARCH_BTN')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '67.00%',
              top: '2.00%',
              width: '21.30%',
              height: '3.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="MENU_UTILITY"
                label="MENU/UTILITY"
                variant="flat-key"
                size="md"
                active={getState('MENU_UTILITY').active}
                highlighted={isHighlighted('MENU_UTILITY')}
                onClick={() => onButtonClick?.('MENU_UTILITY')}
              />
            </motion.div>
          </div>
      </div>
    </motion.div>
  );
}
