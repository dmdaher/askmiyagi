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
              left: '5.90%',
              top: '6.60%',
              width: '1.80%',
              height: '24.60%',
            }}
          >
            <Wheel
              id="wheel-1"
              label=""
              width={22}
              height={89}
              highlighted={isHighlighted('wheel-1')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '5.9%',
            top: '5.4%',
            width: '1.8%',
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
              left: '9.30%',
              top: '6.40%',
              width: '1.80%',
              height: '24.60%',
            }}
          >
            <Wheel
              id="wheel-2"
              label=""
              width={22}
              height={89}
              highlighted={isHighlighted('wheel-2')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '9.3%',
            top: '5.2%',
            width: '1.8%',
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
              left: '4.20%',
              top: '65.10%',
              width: '3.00%',
              height: '2.70%',
            }}
          >
            <div>
              <PanelButton
                id="s1"
                label=""
                width={36}
                height={10}
                active={getState('s1').active}
                highlighted={isHighlighted('s1')}
                onClick={() => onButtonClick?.('s1')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '4.2%',
            top: '63.9%',
            width: '3.0%',
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
              left: '5.80%',
              top: '64.80%',
              width: '3.00%',
              height: '2.70%',
            }}
          >
            <div>
              <PanelButton
                id="s2"
                label=""
                width={36}
                height={10}
                active={getState('s2').active}
                highlighted={isHighlighted('s2')}
                onClick={() => onButtonClick?.('s2')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '5.8%',
            top: '63.6%',
            width: '3.0%',
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
              left: '7.10%',
              top: '72.00%',
              width: '2.80%',
              height: '10.60%',
            }}
          >
            <DirectionSwitch
              id="pitch-bend-lever"
              label=""
              positions={["FWD","REV","SLIP REV"]}
              highlighted={isHighlighted('pitch-bend-lever')}
              width={34}
              height={38}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '7.1%',
            top: '70.8%',
            width: '2.8%',
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
