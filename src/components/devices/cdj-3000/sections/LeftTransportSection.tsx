'use client';

import { motion } from 'framer-motion';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface LeftTransportSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function LeftTransportSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: LeftTransportSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  // Group labels are rendered inline within the section body

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.40 }}
    >
      <div data-section-id="left-transport">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.30%',
              top: '50.80%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="beat-jump-left-btn"
                label="BEAT JUMP ◄"
                variant="standard"
                iconContent="◀"
                active={getState('beat-jump-left-btn').active}
                highlighted={isHighlighted('beat-jump-left-btn')}
                onClick={() => onButtonClick?.('beat-jump-left-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '9.20%',
              top: '50.80%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="beat-jump-right-btn"
                label="BEAT JUMP ►"
                variant="standard"
                iconContent="▶"
                active={getState('beat-jump-right-btn').active}
                highlighted={isHighlighted('beat-jump-right-btn')}
                onClick={() => onButtonClick?.('beat-jump-right-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '3.10%',
              top: '57.30%',
              width: '10.70%',
              height: '5.80%',
            }}
          >
            <DirectionSwitch
              id="direction-lever"
              label=""
              positions={["FWD","REV","SLIP REV"]}
              highlighted={isHighlighted('direction-lever')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.50%',
              top: '67.10%',
              width: '6.00%',
              height: '5.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="track-search-bwd-btn"
                label="Track/Search"
                variant="standard"
                iconContent="|◀◀"
                active={getState('track-search-bwd-btn').active}
                highlighted={isHighlighted('track-search-bwd-btn')}
                onClick={() => onButtonClick?.('track-search-bwd-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '9.40%',
              top: '67.10%',
              width: '6.00%',
              height: '5.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="track-search-fwd-btn"
                label="Track/Search"
                variant="standard"
                iconContent="▶▶|"
                active={getState('track-search-fwd-btn').active}
                highlighted={isHighlighted('track-search-fwd-btn')}
                onClick={() => onButtonClick?.('track-search-fwd-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.30%',
              top: '72.50%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="search-bwd-btn"
                label="Search"
                variant="standard"
                iconContent="◀◀"
                active={getState('search-bwd-btn').active}
                highlighted={isHighlighted('search-bwd-btn')}
                onClick={() => onButtonClick?.('search-bwd-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '9.20%',
              top: '72.50%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="search-fwd-btn"
                label="Search"
                variant="standard"
                iconContent="▶▶"
                active={getState('search-fwd-btn').active}
                highlighted={isHighlighted('search-fwd-btn')}
                onClick={() => onButtonClick?.('search-fwd-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.80%',
              top: '80.20%',
              width: '13.30%',
              height: '7.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="cue-btn"
                label="CUE"
                variant="transport"
                surfaceColor="#f59e0b"
                hasLed
                ledColor="#f59e0b"
                active={getState('cue-btn').active}
                highlighted={isHighlighted('cue-btn')}
                onClick={() => onButtonClick?.('cue-btn')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.80%',
              top: '90.30%',
              width: '13.30%',
              height: '7.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="play-pause-btn"
                label="PLAY/PAUSE ►/II"
                variant="transport"
                surfaceColor="#22c55e"
                iconContent="▶/❚❚"
                hasLed
                ledColor="#22c55e"
                active={getState('play-pause-btn').active}
                highlighted={isHighlighted('play-pause-btn')}
                onClick={() => onButtonClick?.('play-pause-btn')}
              />
            </motion.div>
          </div>
      </div>
    </motion.div>
  );
}
