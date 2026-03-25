'use client';

import { motion } from 'framer-motion';
import PadButton from '@/components/controls/PadButton';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface HotCueSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function HotCueSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: HotCueSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.20 }}
    >
      <div data-section-id="HOT_CUE">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '0.60%',
              top: '28.30%',
              width: '8.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="SLIP"
                label=""
                variant="rubber"
                size="md"
                hasLed
                ledColor="#3b82f6"
                active={getState('SLIP').active}
                highlighted={isHighlighted('SLIP')}
                onClick={() => onButtonClick?.('SLIP')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '6.50%',
              top: '28.30%',
              width: '8.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="QUANTIZE"
                label=""
                variant="rubber"
                size="md"
                hasLed
                ledColor="#ef4444"
                active={getState('QUANTIZE').active}
                highlighted={isHighlighted('QUANTIZE')}
                onClick={() => onButtonClick?.('QUANTIZE')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '3.60%',
              top: '24.40%',
              width: '8.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PanelButton
                id="TIME_MODE_AUTO_CUE"
                label=""
                variant="transport"
                size="lg"
                hasLed
                ledColor="#22c55e"
                ledOn={getState('TIME_MODE_AUTO_CUE').active}
                active={getState('TIME_MODE_AUTO_CUE').active}
                highlighted={isHighlighted('TIME_MODE_AUTO_CUE')}
                onClick={() => onButtonClick?.('TIME_MODE_AUTO_CUE')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '15.10%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_A"
                label=""
                active={getState('HOT_CUE_A').active}
                highlighted={isHighlighted('HOT_CUE_A')}
                onClick={() => onButtonClick?.('HOT_CUE_A')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '23.80%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_B"
                label=""
                active={getState('HOT_CUE_B').active}
                highlighted={isHighlighted('HOT_CUE_B')}
                onClick={() => onButtonClick?.('HOT_CUE_B')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '32.50%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_C"
                label=""
                active={getState('HOT_CUE_C').active}
                highlighted={isHighlighted('HOT_CUE_C')}
                onClick={() => onButtonClick?.('HOT_CUE_C')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '41.10%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_D"
                label=""
                active={getState('HOT_CUE_D').active}
                highlighted={isHighlighted('HOT_CUE_D')}
                onClick={() => onButtonClick?.('HOT_CUE_D')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '50.90%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_E"
                label=""
                active={getState('HOT_CUE_E').active}
                highlighted={isHighlighted('HOT_CUE_E')}
                onClick={() => onButtonClick?.('HOT_CUE_E')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '59.60%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_F"
                label=""
                active={getState('HOT_CUE_F').active}
                highlighted={isHighlighted('HOT_CUE_F')}
                onClick={() => onButtonClick?.('HOT_CUE_F')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '68.60%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_G"
                label=""
                active={getState('HOT_CUE_G').active}
                highlighted={isHighlighted('HOT_CUE_G')}
                onClick={() => onButtonClick?.('HOT_CUE_G')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '77.10%',
              top: '35.00%',
              width: '7.30%',
              height: '2.90%',
            }}
          >
            <div>
              <PadButton
                id="HOT_CUE_H"
                label=""
                active={getState('HOT_CUE_H').active}
                highlighted={isHighlighted('HOT_CUE_H')}
                onClick={() => onButtonClick?.('HOT_CUE_H')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
