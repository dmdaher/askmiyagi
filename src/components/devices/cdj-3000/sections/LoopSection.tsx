'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface LoopSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function LoopSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: LoopSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.30 }}
    >
      <div data-section-id="LOOP">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '-0.10%',
              top: '40.80%',
              width: '12.00%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="LOOP_IN_CUE"
                label=""
                variant="transport"
                size="lg"
                hasLed
                ledColor="#22c55e"
                ledOn={getState('LOOP_IN_CUE').active}
                active={getState('LOOP_IN_CUE').active}
                highlighted={isHighlighted('LOOP_IN_CUE')}
                onClick={() => onButtonClick?.('LOOP_IN_CUE')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '8.20%',
              top: '40.80%',
              width: '12.00%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="LOOP_OUT"
                label=""
                variant="transport"
                size="lg"
                hasLed
                ledColor="#22c55e"
                ledOn={getState('LOOP_OUT').active}
                active={getState('LOOP_OUT').active}
                highlighted={isHighlighted('LOOP_OUT')}
                onClick={() => onButtonClick?.('LOOP_OUT')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '16.60%',
              top: '40.80%',
              width: '12.00%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="RELOOP_EXIT"
                label=""
                variant="transport"
                size="lg"
                hasLed
                ledColor="#22c55e"
                ledOn={getState('RELOOP_EXIT').active}
                active={getState('RELOOP_EXIT').active}
                highlighted={isHighlighted('RELOOP_EXIT')}
                onClick={() => onButtonClick?.('RELOOP_EXIT')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '-0.10%',
              top: '46.90%',
              width: '12.00%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="FOUR_BEAT_LOOP"
                label=""
                variant="transport"
                size="lg"
                hasLed
                ledColor="#22c55e"
                ledOn={getState('FOUR_BEAT_LOOP').active}
                active={getState('FOUR_BEAT_LOOP').active}
                highlighted={isHighlighted('FOUR_BEAT_LOOP')}
                onClick={() => onButtonClick?.('FOUR_BEAT_LOOP')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '8.20%',
              top: '46.90%',
              width: '12.00%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="EIGHT_BEAT_LOOP"
                label=""
                variant="transport"
                size="lg"
                hasLed
                ledColor="#22c55e"
                ledOn={getState('EIGHT_BEAT_LOOP').active}
                active={getState('EIGHT_BEAT_LOOP').active}
                highlighted={isHighlighted('EIGHT_BEAT_LOOP')}
                onClick={() => onButtonClick?.('EIGHT_BEAT_LOOP')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
