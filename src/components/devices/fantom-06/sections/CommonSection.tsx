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
              left: 538,
              top: 363,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="write"
                label=""
                width={24}
                height={15}
                active={getState('write').active}
                highlighted={isHighlighted('write')}
                onClick={() => onButtonClick?.('write')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            WRITE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 628,
              top: 363,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="master-fx"
                label=""
                width={24}
                height={15}
                active={getState('master-fx').active}
                highlighted={isHighlighted('master-fx')}
                onClick={() => onButtonClick?.('master-fx')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 610,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MASTER FX
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 718,
              top: 363,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="motional-pad"
                label=""
                width={24}
                height={15}
                active={getState('motional-pad').active}
                highlighted={isHighlighted('motional-pad')}
                onClick={() => onButtonClick?.('motional-pad')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 700,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MOTIONAL PAD
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 808,
              top: 363,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="daw-ctrl"
                label=""
                width={24}
                height={15}
                active={getState('daw-ctrl').active}
                highlighted={isHighlighted('daw-ctrl')}
                onClick={() => onButtonClick?.('daw-ctrl')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 790,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            DAW CTRL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 898,
              top: 363,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="menu"
                label=""
                width={24}
                height={15}
                active={getState('menu').active}
                highlighted={isHighlighted('menu')}
                onClick={() => onButtonClick?.('menu')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 880,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MENU
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 773,
              top: 69,
              width: 281,
              height: 169,
            }}
          >
            <TouchDisplay
              id="display"
              label=""
              variant="main"
              showMockContent
              width={281}
              height={169}
              highlighted={isHighlighted('display')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 773,
            top: 244,
            width: 281,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            Display
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 988,
              top: 363,
              width: 24,
              height: 24,
            }}
          >
            <Knob
              id="e1"
              label=""
              value={getState('e1').value ?? 64}
              highlighted={isHighlighted('e1')}
              outerSize={24}
              innerSize={17}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 970,
            top: 393,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1078,
              top: 363,
              width: 24,
              height: 24,
            }}
          >
            <Knob
              id="e2"
              label=""
              value={getState('e2').value ?? 64}
              highlighted={isHighlighted('e2')}
              outerSize={24}
              innerSize={17}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1060,
            top: 393,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 538,
              top: 453,
              width: 24,
              height: 24,
            }}
          >
            <Knob
              id="e3"
              label=""
              value={getState('e3').value ?? 64}
              highlighted={isHighlighted('e3')}
              outerSize={24}
              innerSize={17}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E3
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 628,
              top: 453,
              width: 24,
              height: 24,
            }}
          >
            <Knob
              id="e4"
              label=""
              value={getState('e4').value ?? 64}
              highlighted={isHighlighted('e4')}
              outerSize={24}
              innerSize={17}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 610,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E4
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 718,
              top: 453,
              width: 24,
              height: 24,
            }}
          >
            <Knob
              id="e5"
              label=""
              value={getState('e5').value ?? 64}
              highlighted={isHighlighted('e5')}
              outerSize={24}
              innerSize={17}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 700,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E5
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 808,
              top: 453,
              width: 24,
              height: 24,
            }}
          >
            <Knob
              id="e6"
              label=""
              value={getState('e6').value ?? 64}
              highlighted={isHighlighted('e6')}
              outerSize={24}
              innerSize={17}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 790,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E6
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 898,
              top: 453,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="tempo"
                label=""
                width={24}
                height={15}
                active={getState('tempo').active}
                highlighted={isHighlighted('tempo')}
                onClick={() => onButtonClick?.('tempo')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 880,
            top: 474,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            TEMPO
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 988,
              top: 453,
              width: 24,
              height: 24,
            }}
          >
            <ValueDial
              id="value-dial"
              label=""
              outerSize={24}
              highlighted={isHighlighted('value-dial')}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 970,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            VALUE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1078,
              top: 453,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="dec"
                label=""
                width={24}
                height={15}
                active={getState('dec').active}
                highlighted={isHighlighted('dec')}
                onClick={() => onButtonClick?.('dec')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1060,
            top: 474,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            DEC
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 538,
              top: 543,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="inc"
                label=""
                width={24}
                height={15}
                active={getState('inc').active}
                highlighted={isHighlighted('inc')}
                onClick={() => onButtonClick?.('inc')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            INC
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 628,
              top: 543,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="cursor-up"
                label=""
                width={24}
                height={15}
                active={getState('cursor-up').active}
                highlighted={isHighlighted('cursor-up')}
                onClick={() => onButtonClick?.('cursor-up')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 610,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR UP
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 718,
              top: 543,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="cursor-down"
                label=""
                width={24}
                height={15}
                active={getState('cursor-down').active}
                highlighted={isHighlighted('cursor-down')}
                onClick={() => onButtonClick?.('cursor-down')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 700,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR DOWN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 808,
              top: 543,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="cursor-left"
                label=""
                width={24}
                height={15}
                active={getState('cursor-left').active}
                highlighted={isHighlighted('cursor-left')}
                onClick={() => onButtonClick?.('cursor-left')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 790,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR LEFT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 898,
              top: 543,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="cursor-right"
                label=""
                width={24}
                height={15}
                active={getState('cursor-right').active}
                highlighted={isHighlighted('cursor-right')}
                onClick={() => onButtonClick?.('cursor-right')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 880,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR RIGHT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 988,
              top: 543,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="shift"
                label=""
                width={24}
                height={15}
                active={getState('shift').active}
                highlighted={isHighlighted('shift')}
                onClick={() => onButtonClick?.('shift')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 970,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            SHIFT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1078,
              top: 543,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="exit"
                label=""
                width={24}
                height={15}
                active={getState('exit').active}
                highlighted={isHighlighted('exit')}
                onClick={() => onButtonClick?.('exit')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1060,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            EXIT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 538,
              top: 603,
              width: 24,
              height: 15,
            }}
          >
            <div>
              <PanelButton
                id="enter"
                label=""
                width={24}
                height={15}
                active={getState('enter').active}
                highlighted={isHighlighted('enter')}
                onClick={() => onButtonClick?.('enter')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 624,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            ENTER
          </span>
        </div>
      </div>
    </motion.div>
  );
}
