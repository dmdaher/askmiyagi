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
              left: 1323,
              top: 30,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="sampling"
                label=""
                width={40}
                height={25}
                active={getState('sampling').active}
                highlighted={isHighlighted('sampling')}
                onClick={() => onButtonClick?.('sampling')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1313,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SAMPLING
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1363,
              top: 30,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="pad-mode"
                label=""
                width={40}
                height={25}
                active={getState('pad-mode').active}
                highlighted={isHighlighted('pad-mode')}
                onClick={() => onButtonClick?.('pad-mode')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1353,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PAD MODE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1386,
              top: 30,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="clip-board"
                label=""
                width={40}
                height={25}
                active={getState('clip-board').active}
                highlighted={isHighlighted('clip-board')}
                onClick={() => onButtonClick?.('clip-board')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1376,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CLIP BOARD
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1406,
              top: 30,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="bank"
                label=""
                width={40}
                height={25}
                active={getState('bank').active}
                highlighted={isHighlighted('bank')}
                onClick={() => onButtonClick?.('bank')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1396,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            BANK
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1449,
              top: 30,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="hold"
                label=""
                width={40}
                height={25}
                active={getState('hold').active}
                highlighted={isHighlighted('hold')}
                onClick={() => onButtonClick?.('hold')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1439,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            HOLD
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1323,
              top: 130,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-1"
                label=""
                active={getState('pad-1').active}
                highlighted={isHighlighted('pad-1')}
                onClick={() => onButtonClick?.('pad-1')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1313,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1365,
              top: 130,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-2"
                label=""
                active={getState('pad-2').active}
                highlighted={isHighlighted('pad-2')}
                onClick={() => onButtonClick?.('pad-2')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1355,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1408,
              top: 130,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-3"
                label=""
                active={getState('pad-3').active}
                highlighted={isHighlighted('pad-3')}
                onClick={() => onButtonClick?.('pad-3')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1398,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            3
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1449,
              top: 130,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-4"
                label=""
                active={getState('pad-4').active}
                highlighted={isHighlighted('pad-4')}
                onClick={() => onButtonClick?.('pad-4')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1439,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            4
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1323,
              top: 155,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-5"
                label=""
                active={getState('pad-5').active}
                highlighted={isHighlighted('pad-5')}
                onClick={() => onButtonClick?.('pad-5')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1313,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            5
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1365,
              top: 155,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-6"
                label=""
                active={getState('pad-6').active}
                highlighted={isHighlighted('pad-6')}
                onClick={() => onButtonClick?.('pad-6')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1355,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            6
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1408,
              top: 155,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-7"
                label=""
                active={getState('pad-7').active}
                highlighted={isHighlighted('pad-7')}
                onClick={() => onButtonClick?.('pad-7')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1398,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            7
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1449,
              top: 155,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-8"
                label=""
                active={getState('pad-8').active}
                highlighted={isHighlighted('pad-8')}
                onClick={() => onButtonClick?.('pad-8')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1439,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            8
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1323,
              top: 180,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-9"
                label=""
                active={getState('pad-9').active}
                highlighted={isHighlighted('pad-9')}
                onClick={() => onButtonClick?.('pad-9')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1313,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            9
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1365,
              top: 180,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-10"
                label=""
                active={getState('pad-10').active}
                highlighted={isHighlighted('pad-10')}
                onClick={() => onButtonClick?.('pad-10')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1355,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            10
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1408,
              top: 180,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-11"
                label=""
                active={getState('pad-11').active}
                highlighted={isHighlighted('pad-11')}
                onClick={() => onButtonClick?.('pad-11')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1398,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            11
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1449,
              top: 180,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-12"
                label=""
                active={getState('pad-12').active}
                highlighted={isHighlighted('pad-12')}
                onClick={() => onButtonClick?.('pad-12')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1439,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            12
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1323,
              top: 205,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-13"
                label=""
                active={getState('pad-13').active}
                highlighted={isHighlighted('pad-13')}
                onClick={() => onButtonClick?.('pad-13')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1313,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            13
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1365,
              top: 205,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-14"
                label=""
                active={getState('pad-14').active}
                highlighted={isHighlighted('pad-14')}
                onClick={() => onButtonClick?.('pad-14')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1355,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            14
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1408,
              top: 205,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-15"
                label=""
                active={getState('pad-15').active}
                highlighted={isHighlighted('pad-15')}
                onClick={() => onButtonClick?.('pad-15')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1398,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            15
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1449,
              top: 205,
              width: 40,
              height: 40,
            }}
          >
            <div>
              <PadButton
                id="pad-16"
                label=""
                active={getState('pad-16').active}
                highlighted={isHighlighted('pad-16')}
                onClick={() => onButtonClick?.('pad-16')}
                width={40}
                height={40}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1439,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            16
          </span>
        </div>
      </div>
    </motion.div>
  );
}
