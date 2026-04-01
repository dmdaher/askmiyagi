'use client';

import { motion } from 'framer-motion';
import Knob from '@/components/controls/Knob';
import PanelButton from '@/components/controls/PanelButton';
import TouchDisplay from '@/components/controls/TouchDisplay';
import ValueDial from '@/components/controls/ValueDial';
import { PanelState } from '@/types/panel';

interface CommonSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function CommonSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: CommonSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.10 }}
    >
      <div data-section-id="common">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '84.00%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="write"
                label=""
                size="sm"
                active={getState('write').active}
                highlighted={isHighlighted('write')}
                onClick={() => onButtonClick?.('write')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '82.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            WRITE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '84.00%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="master-fx"
                label=""
                size="sm"
                active={getState('master-fx').active}
                highlighted={isHighlighted('master-fx')}
                onClick={() => onButtonClick?.('master-fx')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '82.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MASTER FX
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '43.20%',
              top: '84.00%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="motional-pad"
                label=""
                size="sm"
                active={getState('motional-pad').active}
                highlighted={isHighlighted('motional-pad')}
                onClick={() => onButtonClick?.('motional-pad')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '82.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MOTIONAL PAD
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '47.70%',
              top: '84.00%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="daw-ctrl"
                label=""
                size="sm"
                active={getState('daw-ctrl').active}
                highlighted={isHighlighted('daw-ctrl')}
                onClick={() => onButtonClick?.('daw-ctrl')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '82.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            DAW CTRL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '52.20%',
              top: '84.00%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="menu"
                label=""
                size="sm"
                active={getState('menu').active}
                highlighted={isHighlighted('menu')}
                onClick={() => onButtonClick?.('menu')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '82.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MENU
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '39.20%',
              top: '4.70%',
              width: '18.70%',
              height: '23.30%',
            }}
          >
            <TouchDisplay
              id="display"
              label=""
              variant="main"
              showMockContent
              width={224}
              height={84}
              highlighted={isHighlighted('display')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '39.2%',
            top: '3.5%',
            width: '18.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            Display
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '92.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e1"
              label=""
              value={getState('e1').value ?? 64}
              highlighted={isHighlighted('e1')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '100.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '92.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e2"
              label=""
              value={getState('e2').value ?? 64}
              highlighted={isHighlighted('e2')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '100.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '43.20%',
              top: '92.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e3"
              label=""
              value={getState('e3').value ?? 64}
              highlighted={isHighlighted('e3')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '100.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E3
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '47.70%',
              top: '92.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e4"
              label=""
              value={getState('e4').value ?? 64}
              highlighted={isHighlighted('e4')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '100.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E4
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '52.20%',
              top: '92.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e5"
              label=""
              value={getState('e5').value ?? 64}
              highlighted={isHighlighted('e5')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '100.8%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E5
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '101.70%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e6"
              label=""
              value={getState('e6').value ?? 64}
              highlighted={isHighlighted('e6')}
              outerSize={28}
              innerSize={20}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '109.7%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E6
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '101.70%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tempo"
                label=""
                size="sm"
                active={getState('tempo').active}
                highlighted={isHighlighted('tempo')}
                onClick={() => onButtonClick?.('tempo')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '100.5%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            TEMPO
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '43.20%',
              top: '101.70%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <ValueDial
              id="value-dial"
              label=""
              outerSize={28}
              highlighted={isHighlighted('value-dial')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '109.7%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            VALUE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '47.70%',
              top: '101.70%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="dec"
                label=""
                size="sm"
                active={getState('dec').active}
                highlighted={isHighlighted('dec')}
                onClick={() => onButtonClick?.('dec')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '100.5%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            DEC
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '52.20%',
              top: '101.70%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="inc"
                label=""
                size="sm"
                active={getState('inc').active}
                highlighted={isHighlighted('inc')}
                onClick={() => onButtonClick?.('inc')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '100.5%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            INC
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '110.50%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-up"
                label=""
                size="sm"
                active={getState('cursor-up').active}
                highlighted={isHighlighted('cursor-up')}
                onClick={() => onButtonClick?.('cursor-up')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '109.3%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR UP
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '47.70%',
              top: '110.50%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-down"
                label=""
                size="sm"
                active={getState('cursor-down').active}
                highlighted={isHighlighted('cursor-down')}
                onClick={() => onButtonClick?.('cursor-down')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '109.3%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR DOWN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '110.50%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-left"
                label=""
                size="sm"
                active={getState('cursor-left').active}
                highlighted={isHighlighted('cursor-left')}
                onClick={() => onButtonClick?.('cursor-left')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '109.3%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR LEFT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '43.20%',
              top: '110.50%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-right"
                label=""
                size="sm"
                active={getState('cursor-right').active}
                highlighted={isHighlighted('cursor-right')}
                onClick={() => onButtonClick?.('cursor-right')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '109.3%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR RIGHT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '52.20%',
              top: '110.50%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="shift"
                label=""
                size="sm"
                active={getState('shift').active}
                highlighted={isHighlighted('shift')}
                onClick={() => onButtonClick?.('shift')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '109.3%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SHIFT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '119.40%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="exit"
                label=""
                size="sm"
                active={getState('exit').active}
                highlighted={isHighlighted('exit')}
                onClick={() => onButtonClick?.('exit')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '118.2%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            EXIT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '119.40%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="enter"
                label=""
                size="sm"
                active={getState('enter').active}
                highlighted={isHighlighted('enter')}
                onClick={() => onButtonClick?.('enter')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '118.2%',
            width: '4.2%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ENTER
          </span>
        </div>
      </div>
    </motion.div>
  );
}
