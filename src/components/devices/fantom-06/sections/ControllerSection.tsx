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
              left: 73,
              top: 108,
              width: 26,
              height: 125,
            }}
          >
            <Wheel
              id="wheel-1"
              label=""
              width={26}
              height={125}
              highlighted={isHighlighted('wheel-1')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 149,
              top: 108,
              width: 26,
              height: 125,
            }}
          >
            <Wheel
              id="wheel-2"
              label=""
              width={26}
              height={125}
              highlighted={isHighlighted('wheel-2')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 51,
              top: 423,
              width: 41,
              height: 26,
            }}
          >
            <div>
              <PanelButton
                id="s1"
                label=""
                width={41}
                height={26}
                active={getState('s1').active}
                highlighted={isHighlighted('s1')}
                onClick={() => onButtonClick?.('s1')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 108,
              top: 423,
              width: 41,
              height: 26,
            }}
          >
            <div>
              <PanelButton
                id="s2"
                label=""
                width={41}
                height={26}
                active={getState('s2').active}
                highlighted={isHighlighted('s2')}
                onClick={() => onButtonClick?.('s2')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 73,
              top: 474,
              width: 108,
              height: 108,
            }}
          >
            <DirectionSwitch
              id="pitch-bend-lever"
              label=""
              positions={["FWD","REV","SLIP REV"]}
              highlighted={isHighlighted('pitch-bend-lever')}
              width={108}
              height={108}
            />
          </div>
      </div>
    </motion.div>
  );
}
