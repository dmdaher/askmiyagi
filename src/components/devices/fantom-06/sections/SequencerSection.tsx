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
              left: 1755,
              top: 16,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="pattern"
                label=""
                width={38}
                height={24}
                active={getState('pattern').active}
                highlighted={isHighlighted('pattern')}
                onClick={() => onButtonClick?.('pattern')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1756,
              top: 75,
              width: 35,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="group"
                label=""
                width={35}
                height={24}
                active={getState('group').active}
                highlighted={isHighlighted('group')}
                onClick={() => onButtonClick?.('group')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1823,
              top: 16,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="song"
                label=""
                width={38}
                height={24}
                active={getState('song').active}
                highlighted={isHighlighted('song')}
                onClick={() => onButtonClick?.('song')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1823,
              top: 16,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tr-rec"
                label=""
                width={38}
                height={24}
                active={getState('tr-rec').active}
                highlighted={isHighlighted('tr-rec')}
                onClick={() => onButtonClick?.('tr-rec')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1868,
              top: 16,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="rhythm-ptn"
                label=""
                width={38}
                height={24}
                active={getState('rhythm-ptn').active}
                highlighted={isHighlighted('rhythm-ptn')}
                onClick={() => onButtonClick?.('rhythm-ptn')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1935,
              top: 16,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="stop"
                label=""
                width={38}
                height={24}
                active={getState('stop').active}
                highlighted={isHighlighted('stop')}
                onClick={() => onButtonClick?.('stop')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1963,
              top: 16,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="play"
                label=""
                width={38}
                height={24}
                active={getState('play').active}
                highlighted={isHighlighted('play')}
                onClick={() => onButtonClick?.('play')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1998,
              top: 16,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="rec"
                label=""
                width={38}
                height={24}
                active={getState('rec').active}
                highlighted={isHighlighted('rec')}
                onClick={() => onButtonClick?.('rec')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1560,
              top: 338,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-1"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-1').active}
                highlighted={isHighlighted('tone-cat-1')}
                onClick={() => onButtonClick?.('tone-cat-1')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1623,
              top: 338,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-2"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-2').active}
                highlighted={isHighlighted('tone-cat-2')}
                onClick={() => onButtonClick?.('tone-cat-2')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1685,
              top: 338,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-3"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-3').active}
                highlighted={isHighlighted('tone-cat-3')}
                onClick={() => onButtonClick?.('tone-cat-3')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1748,
              top: 338,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-4"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-4').active}
                highlighted={isHighlighted('tone-cat-4')}
                onClick={() => onButtonClick?.('tone-cat-4')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1735,
              top: 211,
              width: 35,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-5"
                label=""
                width={35}
                height={24}
                active={getState('tone-cat-5').active}
                highlighted={isHighlighted('tone-cat-5')}
                onClick={() => onButtonClick?.('tone-cat-5')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1810,
              top: 211,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-6"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-6').active}
                highlighted={isHighlighted('tone-cat-6')}
                onClick={() => onButtonClick?.('tone-cat-6')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1888,
              top: 211,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-7"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-7').active}
                highlighted={isHighlighted('tone-cat-7')}
                onClick={() => onButtonClick?.('tone-cat-7')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1963,
              top: 211,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-8"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-8').active}
                highlighted={isHighlighted('tone-cat-8')}
                onClick={() => onButtonClick?.('tone-cat-8')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1735,
              top: 249,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-9"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-9').active}
                highlighted={isHighlighted('tone-cat-9')}
                onClick={() => onButtonClick?.('tone-cat-9')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1810,
              top: 249,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-10"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-10').active}
                highlighted={isHighlighted('tone-cat-10')}
                onClick={() => onButtonClick?.('tone-cat-10')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1888,
              top: 249,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-11"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-11').active}
                highlighted={isHighlighted('tone-cat-11')}
                onClick={() => onButtonClick?.('tone-cat-11')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1963,
              top: 249,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-12"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-12').active}
                highlighted={isHighlighted('tone-cat-12')}
                onClick={() => onButtonClick?.('tone-cat-12')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1735,
              top: 288,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-13"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-13').active}
                highlighted={isHighlighted('tone-cat-13')}
                onClick={() => onButtonClick?.('tone-cat-13')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1810,
              top: 288,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-14"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-14').active}
                highlighted={isHighlighted('tone-cat-14')}
                onClick={() => onButtonClick?.('tone-cat-14')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1888,
              top: 288,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-15"
                label=""
                width={38}
                height={24}
                active={getState('tone-cat-15').active}
                highlighted={isHighlighted('tone-cat-15')}
                onClick={() => onButtonClick?.('tone-cat-15')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 1963,
              top: 288,
              width: 38,
              height: 24,
            }}
          >
            <div>
              <PanelButton
                id="tone-cat-16"
                label=""
                width={38}
                height={24}
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
