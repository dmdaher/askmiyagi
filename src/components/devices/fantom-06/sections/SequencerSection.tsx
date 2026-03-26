'use client';

import { motion } from 'framer-motion';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface SequencerSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function SequencerSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: SequencerSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <div data-section-id="sequencer">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '74.50%',
              top: '113.70%',
              width: '2.30%',
              height: '15.00%',
            }}
          >
            <div>
              <PanelButton
                id="pattern"
                label=""
                size="md"
                active={getState('pattern').active}
                highlighted={isHighlighted('pattern')}
                onClick={() => onButtonClick?.('pattern')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '75.80%',
              top: '113.70%',
              width: '2.30%',
              height: '15.00%',
            }}
          >
            <div>
              <PanelButton
                id="group"
                label=""
                size="md"
                active={getState('group').active}
                highlighted={isHighlighted('group')}
                onClick={() => onButtonClick?.('group')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '78.30%',
              top: '113.70%',
              width: '2.30%',
              height: '15.10%',
            }}
          >
            <div>
              <PanelButton
                id="song"
                label=""
                size="md"
                active={getState('song').active}
                highlighted={isHighlighted('song')}
                onClick={() => onButtonClick?.('song')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '78.30%',
              top: '113.70%',
              width: '2.30%',
              height: '15.10%',
            }}
          >
            <div>
              <PanelButton
                id="tr-rec"
                label=""
                size="md"
                active={getState('tr-rec').active}
                highlighted={isHighlighted('tr-rec')}
                onClick={() => onButtonClick?.('tr-rec')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.60%',
              top: '113.70%',
              width: '2.30%',
              height: '15.50%',
            }}
          >
            <div>
              <PanelButton
                id="rhythm-ptn"
                label=""
                size="md"
                active={getState('rhythm-ptn').active}
                highlighted={isHighlighted('rhythm-ptn')}
                onClick={() => onButtonClick?.('rhythm-ptn')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '83.70%',
              top: '113.70%',
              width: '2.30%',
              height: '15.50%',
            }}
          >
            <div>
              <PanelButton
                id="stop"
                label=""
                size="md"
                active={getState('stop').active}
                highlighted={isHighlighted('stop')}
                onClick={() => onButtonClick?.('stop')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '85.30%',
              top: '113.70%',
              width: '2.30%',
              height: '15.10%',
            }}
          >
            <div>
              <PanelButton
                id="play"
                label=""
                size="md"
                active={getState('play').active}
                highlighted={isHighlighted('play')}
                onClick={() => onButtonClick?.('play')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '87.10%',
              top: '113.70%',
              width: '2.30%',
              height: '15.00%',
            }}
          >
            <div>
              <PanelButton
                id="rec"
                label=""
                size="md"
                active={getState('rec').active}
                highlighted={isHighlighted('rec')}
                onClick={() => onButtonClick?.('rec')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '74.10%',
              top: '133.00%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-1"
                label=""
                size="md"
                active={getState('tone-cat-1').active}
                highlighted={isHighlighted('tone-cat-1')}
                onClick={() => onButtonClick?.('tone-cat-1')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '77.80%',
              top: '133.00%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-2"
                label=""
                size="md"
                active={getState('tone-cat-2').active}
                highlighted={isHighlighted('tone-cat-2')}
                onClick={() => onButtonClick?.('tone-cat-2')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.10%',
              top: '133.00%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-3"
                label=""
                size="md"
                active={getState('tone-cat-3').active}
                highlighted={isHighlighted('tone-cat-3')}
                onClick={() => onButtonClick?.('tone-cat-3')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '84.90%',
              top: '133.00%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-4"
                label=""
                size="md"
                active={getState('tone-cat-4').active}
                highlighted={isHighlighted('tone-cat-4')}
                onClick={() => onButtonClick?.('tone-cat-4')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '74.10%',
              top: '141.20%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-5"
                label=""
                size="md"
                active={getState('tone-cat-5').active}
                highlighted={isHighlighted('tone-cat-5')}
                onClick={() => onButtonClick?.('tone-cat-5')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '77.80%',
              top: '141.20%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-6"
                label=""
                size="md"
                active={getState('tone-cat-6').active}
                highlighted={isHighlighted('tone-cat-6')}
                onClick={() => onButtonClick?.('tone-cat-6')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.10%',
              top: '141.20%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-7"
                label=""
                size="md"
                active={getState('tone-cat-7').active}
                highlighted={isHighlighted('tone-cat-7')}
                onClick={() => onButtonClick?.('tone-cat-7')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '84.80%',
              top: '141.20%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-8"
                label=""
                size="md"
                active={getState('tone-cat-8').active}
                highlighted={isHighlighted('tone-cat-8')}
                onClick={() => onButtonClick?.('tone-cat-8')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '74.10%',
              top: '146.70%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-9"
                label=""
                size="md"
                active={getState('tone-cat-9').active}
                highlighted={isHighlighted('tone-cat-9')}
                onClick={() => onButtonClick?.('tone-cat-9')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '77.80%',
              top: '146.70%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-10"
                label=""
                size="md"
                active={getState('tone-cat-10').active}
                highlighted={isHighlighted('tone-cat-10')}
                onClick={() => onButtonClick?.('tone-cat-10')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.10%',
              top: '146.70%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-11"
                label=""
                size="md"
                active={getState('tone-cat-11').active}
                highlighted={isHighlighted('tone-cat-11')}
                onClick={() => onButtonClick?.('tone-cat-11')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '84.90%',
              top: '146.70%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-12"
                label=""
                size="md"
                active={getState('tone-cat-12').active}
                highlighted={isHighlighted('tone-cat-12')}
                onClick={() => onButtonClick?.('tone-cat-12')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '74.10%',
              top: '152.30%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-13"
                label=""
                size="md"
                active={getState('tone-cat-13').active}
                highlighted={isHighlighted('tone-cat-13')}
                onClick={() => onButtonClick?.('tone-cat-13')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '77.80%',
              top: '152.30%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-14"
                label=""
                size="md"
                active={getState('tone-cat-14').active}
                highlighted={isHighlighted('tone-cat-14')}
                onClick={() => onButtonClick?.('tone-cat-14')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '80.10%',
              top: '152.30%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-15"
                label=""
                size="md"
                active={getState('tone-cat-15').active}
                highlighted={isHighlighted('tone-cat-15')}
                onClick={() => onButtonClick?.('tone-cat-15')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '84.90%',
              top: '152.30%',
              width: '3.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-16"
                label=""
                size="md"
                active={getState('tone-cat-16').active}
                highlighted={isHighlighted('tone-cat-16')}
                onClick={() => onButtonClick?.('tone-cat-16')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
