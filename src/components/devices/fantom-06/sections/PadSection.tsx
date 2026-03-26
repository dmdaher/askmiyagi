'use client';

import { motion } from 'framer-motion';
import PadButton from '@/components/controls/PadButton';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface PadSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function PadSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: PadSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.30 }}
    >
      <div data-section-id="pad">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '91.50%',
              top: '111.30%',
              width: '2.30%',
              height: '15.20%',
            }}
          >
            <div>
              <PanelButton
                id="sampling"
                label=""
                size="md"
                active={getState('sampling').active}
                highlighted={isHighlighted('sampling')}
                onClick={() => onButtonClick?.('sampling')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '94.20%',
              top: '111.30%',
              width: '2.30%',
              height: '15.20%',
            }}
          >
            <div>
              <PanelButton
                id="pad-mode"
                label=""
                size="md"
                active={getState('pad-mode').active}
                highlighted={isHighlighted('pad-mode')}
                onClick={() => onButtonClick?.('pad-mode')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '95.50%',
              top: '111.30%',
              width: '2.30%',
              height: '15.20%',
            }}
          >
            <div>
              <PanelButton
                id="clip-board"
                label=""
                size="md"
                active={getState('clip-board').active}
                highlighted={isHighlighted('clip-board')}
                onClick={() => onButtonClick?.('clip-board')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '96.90%',
              top: '111.30%',
              width: '2.30%',
              height: '15.20%',
            }}
          >
            <div>
              <PanelButton
                id="bank"
                label=""
                size="md"
                active={getState('bank').active}
                highlighted={isHighlighted('bank')}
                onClick={() => onButtonClick?.('bank')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '99.50%',
              top: '111.30%',
              width: '2.30%',
              height: '15.20%',
            }}
          >
            <div>
              <PanelButton
                id="hold"
                label=""
                size="md"
                active={getState('hold').active}
                highlighted={isHighlighted('hold')}
                onClick={() => onButtonClick?.('hold')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '91.50%',
              top: '129.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-1"
                label=""
                active={getState('pad-1').active}
                highlighted={isHighlighted('pad-1')}
                onClick={() => onButtonClick?.('pad-1')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '94.20%',
              top: '129.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-2"
                label=""
                active={getState('pad-2').active}
                highlighted={isHighlighted('pad-2')}
                onClick={() => onButtonClick?.('pad-2')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '96.80%',
              top: '129.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-3"
                label=""
                active={getState('pad-3').active}
                highlighted={isHighlighted('pad-3')}
                onClick={() => onButtonClick?.('pad-3')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '99.50%',
              top: '129.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-4"
                label=""
                active={getState('pad-4').active}
                highlighted={isHighlighted('pad-4')}
                onClick={() => onButtonClick?.('pad-4')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '91.50%',
              top: '139.00%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-5"
                label=""
                active={getState('pad-5').active}
                highlighted={isHighlighted('pad-5')}
                onClick={() => onButtonClick?.('pad-5')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '94.20%',
              top: '139.00%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-6"
                label=""
                active={getState('pad-6').active}
                highlighted={isHighlighted('pad-6')}
                onClick={() => onButtonClick?.('pad-6')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '96.80%',
              top: '139.00%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-7"
                label=""
                active={getState('pad-7').active}
                highlighted={isHighlighted('pad-7')}
                onClick={() => onButtonClick?.('pad-7')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '99.50%',
              top: '139.00%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-8"
                label=""
                active={getState('pad-8').active}
                highlighted={isHighlighted('pad-8')}
                onClick={() => onButtonClick?.('pad-8')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '91.50%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-9"
                label=""
                active={getState('pad-9').active}
                highlighted={isHighlighted('pad-9')}
                onClick={() => onButtonClick?.('pad-9')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '94.20%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-10"
                label=""
                active={getState('pad-10').active}
                highlighted={isHighlighted('pad-10')}
                onClick={() => onButtonClick?.('pad-10')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '96.90%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-11"
                label=""
                active={getState('pad-11').active}
                highlighted={isHighlighted('pad-11')}
                onClick={() => onButtonClick?.('pad-11')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '99.50%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-12"
                label=""
                active={getState('pad-12').active}
                highlighted={isHighlighted('pad-12')}
                onClick={() => onButtonClick?.('pad-12')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '91.50%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-13"
                label=""
                active={getState('pad-13').active}
                highlighted={isHighlighted('pad-13')}
                onClick={() => onButtonClick?.('pad-13')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '94.20%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-14"
                label=""
                active={getState('pad-14').active}
                highlighted={isHighlighted('pad-14')}
                onClick={() => onButtonClick?.('pad-14')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '96.90%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-15"
                label=""
                active={getState('pad-15').active}
                highlighted={isHighlighted('pad-15')}
                onClick={() => onButtonClick?.('pad-15')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '99.50%',
              top: '147.30%',
              width: '2.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PadButton
                id="pad-16"
                label=""
                active={getState('pad-16').active}
                highlighted={isHighlighted('pad-16')}
                onClick={() => onButtonClick?.('pad-16')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
