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
              left: 1654,
              top: 38,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="sampling"
                label=""
                width={30}
                height={19}
                active={getState('sampling').active}
                highlighted={isHighlighted('sampling')}
                onClick={() => onButtonClick?.('sampling')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1639,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SAMPLING
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1704,
              top: 38,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="pad-mode"
                label=""
                width={30}
                height={19}
                active={getState('pad-mode').active}
                highlighted={isHighlighted('pad-mode')}
                onClick={() => onButtonClick?.('pad-mode')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1689,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            PAD MODE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1733,
              top: 38,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="clip-board"
                label=""
                width={30}
                height={19}
                active={getState('clip-board').active}
                highlighted={isHighlighted('clip-board')}
                onClick={() => onButtonClick?.('clip-board')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1718,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            CLIP BOARD
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1758,
              top: 38,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="bank"
                label=""
                width={30}
                height={19}
                active={getState('bank').active}
                highlighted={isHighlighted('bank')}
                onClick={() => onButtonClick?.('bank')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1743,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            BANK
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1811,
              top: 38,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="hold"
                label=""
                width={30}
                height={19}
                active={getState('hold').active}
                highlighted={isHighlighted('hold')}
                onClick={() => onButtonClick?.('hold')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1796,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            HOLD
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1654,
              top: 163,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-1"
                label="1"
                active={getState('pad-1').active}
                highlighted={isHighlighted('pad-1')}
                onClick={() => onButtonClick?.('pad-1')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1706,
              top: 163,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-2"
                label="2"
                active={getState('pad-2').active}
                highlighted={isHighlighted('pad-2')}
                onClick={() => onButtonClick?.('pad-2')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1760,
              top: 163,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-3"
                label="3"
                active={getState('pad-3').active}
                highlighted={isHighlighted('pad-3')}
                onClick={() => onButtonClick?.('pad-3')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1811,
              top: 163,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-4"
                label="4"
                active={getState('pad-4').active}
                highlighted={isHighlighted('pad-4')}
                onClick={() => onButtonClick?.('pad-4')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1654,
              top: 194,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-5"
                label="5"
                active={getState('pad-5').active}
                highlighted={isHighlighted('pad-5')}
                onClick={() => onButtonClick?.('pad-5')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1706,
              top: 194,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-6"
                label="6"
                active={getState('pad-6').active}
                highlighted={isHighlighted('pad-6')}
                onClick={() => onButtonClick?.('pad-6')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1760,
              top: 194,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-7"
                label="7"
                active={getState('pad-7').active}
                highlighted={isHighlighted('pad-7')}
                onClick={() => onButtonClick?.('pad-7')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1811,
              top: 194,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-8"
                label="8"
                active={getState('pad-8').active}
                highlighted={isHighlighted('pad-8')}
                onClick={() => onButtonClick?.('pad-8')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1654,
              top: 225,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-9"
                label="9"
                active={getState('pad-9').active}
                highlighted={isHighlighted('pad-9')}
                onClick={() => onButtonClick?.('pad-9')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1706,
              top: 225,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-10"
                label="10"
                active={getState('pad-10').active}
                highlighted={isHighlighted('pad-10')}
                onClick={() => onButtonClick?.('pad-10')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1760,
              top: 225,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-11"
                label="11"
                active={getState('pad-11').active}
                highlighted={isHighlighted('pad-11')}
                onClick={() => onButtonClick?.('pad-11')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1811,
              top: 225,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-12"
                label="12"
                active={getState('pad-12').active}
                highlighted={isHighlighted('pad-12')}
                onClick={() => onButtonClick?.('pad-12')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1654,
              top: 256,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-13"
                label="13"
                active={getState('pad-13').active}
                highlighted={isHighlighted('pad-13')}
                onClick={() => onButtonClick?.('pad-13')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1706,
              top: 256,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-14"
                label="14"
                active={getState('pad-14').active}
                highlighted={isHighlighted('pad-14')}
                onClick={() => onButtonClick?.('pad-14')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1760,
              top: 256,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-15"
                label="15"
                active={getState('pad-15').active}
                highlighted={isHighlighted('pad-15')}
                onClick={() => onButtonClick?.('pad-15')}
                width={30}
                height={30}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1811,
              top: 256,
              width: 30,
              height: 30,
            }}
          >
            <div>
              <PadButton
                id="pad-16"
                label="16"
                active={getState('pad-16').active}
                highlighted={isHighlighted('pad-16')}
                onClick={() => onButtonClick?.('pad-16')}
                width={30}
                height={30}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
