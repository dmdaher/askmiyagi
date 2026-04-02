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
              left: 103,
              top: 83,
              width: 19,
              height: 100,
            }}
          >
            <Wheel
              id="wheel-1"
              label=""
              width={19}
              height={100}
              highlighted={isHighlighted('wheel-1')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 83,
            top: 71,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            WHEEL1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 155,
              top: 81,
              width: 19,
              height: 94,
            }}
          >
            <Wheel
              id="wheel-2"
              label=""
              width={19}
              height={94}
              highlighted={isHighlighted('wheel-2')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 135,
            top: 69,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            WHEEL2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 93,
              top: 290,
              width: 25,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="s1"
                label=""
                width={25}
                height={19}
                active={getState('s1').active}
                highlighted={isHighlighted('s1')}
                onClick={() => onButtonClick?.('s1')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 76,
            top: 278,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            S1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 120,
              top: 289,
              width: 25,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="s2"
                label=""
                width={25}
                height={19}
                active={getState('s2').active}
                highlighted={isHighlighted('s2')}
                onClick={() => onButtonClick?.('s2')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 103,
            top: 277,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            S2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 109,
              top: 328,
              width: 82,
              height: 82,
            }}
          >
            <DirectionSwitch
              id="pitch-bend-lever"
              label=""
              positions={["FWD","REV","SLIP REV"]}
              highlighted={isHighlighted('pitch-bend-lever')}
              width={82}
              height={82}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 109,
            top: 316,
            width: 82,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PITCH BEND/MOD
          </span>
        </div>
      </div>
    </motion.div>
  );
}
