'use client';

import { motion } from 'framer-motion';
import LEDIndicator from '@/components/controls/LEDIndicator';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface BrowseBarSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function BrowseBarSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: BrowseBarSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.00 }}
    >
      <div data-section-id="browse-bar" className="flex flex-col gap-1">
        <div className="flex flex-row gap-1 justify-center">
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="source-btn"
                label="SOURCE"
                variant="flat-key"
                active={getState('source-btn').active}
                highlighted={isHighlighted('source-btn')}
                onClick={() => onButtonClick?.('source-btn')}
              />
            </motion.div>
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="browse-btn"
                label="BROWSE"
                variant="flat-key"
                active={getState('browse-btn').active}
                highlighted={isHighlighted('browse-btn')}
                onClick={() => onButtonClick?.('browse-btn')}
              />
            </motion.div>
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="tag-list-btn"
                label="TAG LIST"
                variant="flat-key"
                active={getState('tag-list-btn').active}
                highlighted={isHighlighted('tag-list-btn')}
                onClick={() => onButtonClick?.('tag-list-btn')}
              />
            </motion.div>
            <LEDIndicator
              id="source-indicator"
              on={getState('source-indicator').ledOn ?? false}
              color="#22c55e"
              highlighted={isHighlighted('source-indicator')}
            />
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="playlist-btn"
                label="PLAYLIST"
                variant="flat-key"
                active={getState('playlist-btn').active}
                highlighted={isHighlighted('playlist-btn')}
                onClick={() => onButtonClick?.('playlist-btn')}
              />
            </motion.div>
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="search-btn"
                label="SEARCH"
                variant="flat-key"
                active={getState('search-btn').active}
                highlighted={isHighlighted('search-btn')}
                onClick={() => onButtonClick?.('search-btn')}
              />
            </motion.div>
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="menu-utility-btn"
                label="MENU/UTILITY"
                variant="flat-key"
                active={getState('menu-utility-btn').active}
                highlighted={isHighlighted('menu-utility-btn')}
                onClick={() => onButtonClick?.('menu-utility-btn')}
              />
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
