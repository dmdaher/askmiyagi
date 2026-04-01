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
                size="md"
                active={getState('write').active}
                highlighted={isHighlighted('write')}
                onClick={() => onButtonClick?.('write')}
              />
            </div>
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
                size="md"
                active={getState('master-fx').active}
                highlighted={isHighlighted('master-fx')}
                onClick={() => onButtonClick?.('master-fx')}
              />
            </div>
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
                size="md"
                active={getState('motional-pad').active}
                highlighted={isHighlighted('motional-pad')}
                onClick={() => onButtonClick?.('motional-pad')}
              />
            </div>
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
                size="md"
                active={getState('daw-ctrl').active}
                highlighted={isHighlighted('daw-ctrl')}
                onClick={() => onButtonClick?.('daw-ctrl')}
              />
            </div>
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
                size="md"
                active={getState('menu').active}
                highlighted={isHighlighted('menu')}
                onClick={() => onButtonClick?.('menu')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '64.20%',
              width: '17.80%',
              height: '16.60%',
            }}
          >
            <TouchDisplay
              id="display"
              label=""
              variant="main"
              showMockContent
              width={200}
              height={120}
              highlighted={isHighlighted('display')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '89.10%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e1"
              label=""
              value={getState('e1').value ?? 64}
              highlighted={isHighlighted('e1')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '89.10%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e2"
              label=""
              value={getState('e2').value ?? 64}
              highlighted={isHighlighted('e2')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '43.20%',
              top: '89.10%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e3"
              label=""
              value={getState('e3').value ?? 64}
              highlighted={isHighlighted('e3')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '47.70%',
              top: '89.10%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e4"
              label=""
              value={getState('e4').value ?? 64}
              highlighted={isHighlighted('e4')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '52.20%',
              top: '89.10%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e5"
              label=""
              value={getState('e5').value ?? 64}
              highlighted={isHighlighted('e5')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '93.90%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <Knob
              id="e6"
              label=""
              value={getState('e6').value ?? 64}
              highlighted={isHighlighted('e6')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '93.90%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tempo"
                label=""
                size="md"
                active={getState('tempo').active}
                highlighted={isHighlighted('tempo')}
                onClick={() => onButtonClick?.('tempo')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '43.20%',
              top: '93.90%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <ValueDial
              id="value-dial"
              label=""
              highlighted={isHighlighted('value-dial')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '47.70%',
              top: '93.90%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="dec"
                label=""
                size="md"
                active={getState('dec').active}
                highlighted={isHighlighted('dec')}
                onClick={() => onButtonClick?.('dec')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '52.20%',
              top: '93.90%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="inc"
                label=""
                size="md"
                active={getState('inc').active}
                highlighted={isHighlighted('inc')}
                onClick={() => onButtonClick?.('inc')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '98.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-up"
                label=""
                size="md"
                active={getState('cursor-up').active}
                highlighted={isHighlighted('cursor-up')}
                onClick={() => onButtonClick?.('cursor-up')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '47.70%',
              top: '98.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-down"
                label=""
                size="md"
                active={getState('cursor-down').active}
                highlighted={isHighlighted('cursor-down')}
                onClick={() => onButtonClick?.('cursor-down')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '98.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-left"
                label=""
                size="md"
                active={getState('cursor-left').active}
                highlighted={isHighlighted('cursor-left')}
                onClick={() => onButtonClick?.('cursor-left')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '43.20%',
              top: '98.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="cursor-right"
                label=""
                size="md"
                active={getState('cursor-right').active}
                highlighted={isHighlighted('cursor-right')}
                onClick={() => onButtonClick?.('cursor-right')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '52.20%',
              top: '98.80%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="shift"
                label=""
                size="md"
                active={getState('shift').active}
                highlighted={isHighlighted('shift')}
                onClick={() => onButtonClick?.('shift')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '34.20%',
              top: '103.70%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="exit"
                label=""
                size="md"
                active={getState('exit').active}
                highlighted={isHighlighted('exit')}
                onClick={() => onButtonClick?.('exit')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.70%',
              top: '103.70%',
              width: '4.20%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="enter"
                label=""
                size="md"
                active={getState('enter').active}
                highlighted={isHighlighted('enter')}
                onClick={() => onButtonClick?.('enter')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
