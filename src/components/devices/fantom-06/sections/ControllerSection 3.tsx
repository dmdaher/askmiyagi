'use client';

import { motion } from 'framer-motion';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import PanelButton from '@/components/controls/PanelButton';
import Wheel from '@/components/controls/Wheel';
import { PanelState } from '@/types/panel';

interface ControllerSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function ControllerSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: ControllerSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.00 }}
    >
      <div data-section-id="controller">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '5.10%',
              top: '7.90%',
              width: '3.70%',
              height: '39.90%',
            }}
          >
            <Wheel
              id="wheel-1"
              label=""
              width={120}
              height={120}
              highlighted={isHighlighted('wheel-1')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '8.80%',
              top: '7.90%',
              width: '3.70%',
              height: '39.90%',
            }}
          >
            <Wheel
              id="wheel-2"
              label=""
              width={120}
              height={120}
              highlighted={isHighlighted('wheel-2')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '4.00%',
              top: '59.70%',
              width: '9.00%',
              height: '8.90%',
            }}
          >
            <div>
              <PanelButton
                id="s1"
                label=""
                size="md"
                active={getState('s1').active}
                highlighted={isHighlighted('s1')}
                onClick={() => onButtonClick?.('s1')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '4.00%',
              top: '59.70%',
              width: '9.00%',
              height: '8.90%',
            }}
          >
            <div>
              <PanelButton
                id="s2"
                label=""
                size="md"
                active={getState('s2').active}
                highlighted={isHighlighted('s2')}
                onClick={() => onButtonClick?.('s2')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '6.50%',
              top: '60.70%',
              width: '4.00%',
              height: '32.10%',
            }}
          >
            <DirectionSwitch
              id="pitch-bend-lever"
              label=""
              positions={["FWD","REV","SLIP REV"]}
              highlighted={isHighlighted('pitch-bend-lever')}
            />
          </div>
      </div>
    </motion.div>
  );
}
