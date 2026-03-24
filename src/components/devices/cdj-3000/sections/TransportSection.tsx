'use client';

import { motion } from 'framer-motion';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface TransportSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function TransportSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: TransportSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.45 }}
    >
      <div data-section-id="TRANSPORT">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.30%',
              top: '50.90%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="BEAT_JUMP_BACK"
                label="BEAT JUMP ◄"
                variant="standard"
                size="md"
                iconContent="◀"
                active={getState('BEAT_JUMP_BACK').active}
                highlighted={isHighlighted('BEAT_JUMP_BACK')}
                onClick={() => onButtonClick?.('BEAT_JUMP_BACK')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '9.10%',
              top: '50.90%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="BEAT_JUMP_FWD"
                label="BEAT JUMP ►"
                variant="standard"
                size="md"
                iconContent="▶"
                active={getState('BEAT_JUMP_FWD').active}
                highlighted={isHighlighted('BEAT_JUMP_FWD')}
                onClick={() => onButtonClick?.('BEAT_JUMP_FWD')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '3.10%',
              top: '57.40%',
              width: '10.70%',
              height: '5.80%',
            }}
          >
            <DirectionSwitch
              id="DIRECTION_LEVER"
              label=""
              positions={["FWD","REV","SLIP REV"]}
              highlighted={isHighlighted('DIRECTION_LEVER')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.50%',
              top: '67.20%',
              width: '6.00%',
              height: '5.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="TRACK_SEARCH_BACK"
                label="Track/Search"
                variant="standard"
                size="md"
                iconContent="|◀◀"
                active={getState('TRACK_SEARCH_BACK').active}
                highlighted={isHighlighted('TRACK_SEARCH_BACK')}
                onClick={() => onButtonClick?.('TRACK_SEARCH_BACK')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '9.50%',
              top: '67.20%',
              width: '6.00%',
              height: '5.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="TRACK_SEARCH_FWD"
                label="Track/Search"
                variant="standard"
                size="md"
                iconContent="▶▶|"
                active={getState('TRACK_SEARCH_FWD').active}
                highlighted={isHighlighted('TRACK_SEARCH_FWD')}
                onClick={() => onButtonClick?.('TRACK_SEARCH_FWD')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.30%',
              top: '72.60%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="SEARCH_BACK"
                label="Search"
                variant="standard"
                size="md"
                iconContent="◀◀"
                active={getState('SEARCH_BACK').active}
                highlighted={isHighlighted('SEARCH_BACK')}
                onClick={() => onButtonClick?.('SEARCH_BACK')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '9.10%',
              top: '72.60%',
              width: '6.40%',
              height: '5.90%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="SEARCH_FWD"
                label="Search"
                variant="standard"
                size="md"
                iconContent="▶▶"
                active={getState('SEARCH_FWD').active}
                highlighted={isHighlighted('SEARCH_FWD')}
                onClick={() => onButtonClick?.('SEARCH_FWD')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.70%',
              top: '80.30%',
              width: '13.30%',
              height: '7.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="CUE_BTN"
                label="CUE"
                variant="transport"
                size="md"
                surfaceColor="#f59e0b"
                hasLed
                ledColor="#f59e0b"
                active={getState('CUE_BTN').active}
                highlighted={isHighlighted('CUE_BTN')}
                onClick={() => onButtonClick?.('CUE_BTN')}
              />
            </motion.div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '1.70%',
              top: '90.40%',
              width: '13.30%',
              height: '7.30%',
            }}
          >
            <motion.div whileTap={{ scale: 0.95, y: 2 }}>
              <PanelButton
                id="PLAY_PAUSE"
                label="PLAY/PAUSE ►/II"
                variant="transport"
                size="md"
                surfaceColor="#22c55e"
                iconContent="▶/❚❚"
                hasLed
                ledColor="#22c55e"
                active={getState('PLAY_PAUSE').active}
                highlighted={isHighlighted('PLAY_PAUSE')}
                onClick={() => onButtonClick?.('PLAY_PAUSE')}
              />
            </motion.div>
          </div>
      </div>
    </motion.div>
  );
}
