'use client';

import { motion } from 'framer-motion';
import Knob from '@/components/controls/Knob';
import PanelButton from '@/components/controls/PanelButton';
import Slider from '@/components/controls/Slider';
import { PanelState } from '@/types/panel';

interface ZoneSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function ZoneSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: ZoneSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <div data-section-id="zone">
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '6.00%',
              top: '68.90%',
              width: '29.70%',
              height: '7.80%',
            }}
          >
            <Knob
              id="master-volume"
              label=""
              value={getState('master-volume').value ?? 64}
              highlighted={isHighlighted('master-volume')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '5.10%',
              top: '68.90%',
              width: '5.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="pan-level"
                label=""
                size="md"
                active={getState('pan-level').active}
                highlighted={isHighlighted('pan-level')}
                onClick={() => onButtonClick?.('pan-level')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '13.80%',
              top: '68.90%',
              width: '5.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="ctrl"
                label=""
                size="md"
                active={getState('ctrl').active}
                highlighted={isHighlighted('ctrl')}
                onClick={() => onButtonClick?.('ctrl')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '21.20%',
              top: '68.90%',
              width: '5.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="assign"
                label=""
                size="md"
                active={getState('assign').active}
                highlighted={isHighlighted('assign')}
                onClick={() => onButtonClick?.('assign')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '28.10%',
              top: '68.90%',
              width: '5.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-9-16"
                label=""
                size="md"
                active={getState('zone-9-16').active}
                highlighted={isHighlighted('zone-9-16')}
                onClick={() => onButtonClick?.('zone-9-16')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '36.00%',
              top: '69.00%',
              width: '5.70%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-select"
                label=""
                size="md"
                active={getState('zone-select').active}
                highlighted={isHighlighted('zone-select')}
                onClick={() => onButtonClick?.('zone-select')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '5.80%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-1"
              label=""
              value={getState('knob-1').value ?? 64}
              highlighted={isHighlighted('knob-1')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '10.40%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-2"
              label=""
              value={getState('knob-2').value ?? 64}
              highlighted={isHighlighted('knob-2')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '15.00%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-3"
              label=""
              value={getState('knob-3').value ?? 64}
              highlighted={isHighlighted('knob-3')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '19.60%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-4"
              label=""
              value={getState('knob-4').value ?? 64}
              highlighted={isHighlighted('knob-4')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '24.20%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-5"
              label=""
              value={getState('knob-5').value ?? 64}
              highlighted={isHighlighted('knob-5')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '28.80%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-6"
              label=""
              value={getState('knob-6').value ?? 64}
              highlighted={isHighlighted('knob-6')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '33.40%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-7"
              label=""
              value={getState('knob-7').value ?? 64}
              highlighted={isHighlighted('knob-7')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.00%',
              top: '42.30%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <Knob
              id="knob-8"
              label=""
              value={getState('knob-8').value ?? 64}
              highlighted={isHighlighted('knob-8')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '5.80%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-1"
                label=""
                size="md"
                active={getState('zone-int-ext-1').active}
                highlighted={isHighlighted('zone-int-ext-1')}
                onClick={() => onButtonClick?.('zone-int-ext-1')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '10.40%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-2"
                label=""
                size="md"
                active={getState('zone-int-ext-2').active}
                highlighted={isHighlighted('zone-int-ext-2')}
                onClick={() => onButtonClick?.('zone-int-ext-2')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '15.00%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-3"
                label=""
                size="md"
                active={getState('zone-int-ext-3').active}
                highlighted={isHighlighted('zone-int-ext-3')}
                onClick={() => onButtonClick?.('zone-int-ext-3')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '19.60%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-4"
                label=""
                size="md"
                active={getState('zone-int-ext-4').active}
                highlighted={isHighlighted('zone-int-ext-4')}
                onClick={() => onButtonClick?.('zone-int-ext-4')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '24.20%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-5"
                label=""
                size="md"
                active={getState('zone-int-ext-5').active}
                highlighted={isHighlighted('zone-int-ext-5')}
                onClick={() => onButtonClick?.('zone-int-ext-5')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '28.80%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-6"
                label=""
                size="md"
                active={getState('zone-int-ext-6').active}
                highlighted={isHighlighted('zone-int-ext-6')}
                onClick={() => onButtonClick?.('zone-int-ext-6')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '33.40%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-7"
                label=""
                size="md"
                active={getState('zone-int-ext-7').active}
                highlighted={isHighlighted('zone-int-ext-7')}
                onClick={() => onButtonClick?.('zone-int-ext-7')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.00%',
              top: '77.80%',
              width: '4.40%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-8"
                label=""
                size="md"
                active={getState('zone-int-ext-8').active}
                highlighted={isHighlighted('zone-int-ext-8')}
                onClick={() => onButtonClick?.('zone-int-ext-8')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '6.20%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-1"
              label=""
              value={getState('slider-1').value ?? 64}
              highlighted={isHighlighted('slider-1')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '10.50%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-2"
              label=""
              value={getState('slider-2').value ?? 64}
              highlighted={isHighlighted('slider-2')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '14.90%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-3"
              label=""
              value={getState('slider-3').value ?? 64}
              highlighted={isHighlighted('slider-3')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '19.10%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-4"
              label=""
              value={getState('slider-4').value ?? 64}
              highlighted={isHighlighted('slider-4')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '24.70%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-5"
              label=""
              value={getState('slider-5').value ?? 64}
              highlighted={isHighlighted('slider-5')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '29.20%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-6"
              label=""
              value={getState('slider-6').value ?? 64}
              highlighted={isHighlighted('slider-6')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '33.90%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-7"
              label=""
              value={getState('slider-7').value ?? 64}
              highlighted={isHighlighted('slider-7')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '38.60%',
              top: '60.00%',
              width: '3.50%',
              height: '7.80%',
            }}
          >
            <Slider
              id="slider-8"
              label=""
              value={getState('slider-8').value ?? 64}
              highlighted={isHighlighted('slider-8')}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '6.30%',
              top: '33.80%',
              width: '3.30%',
              height: '6.60%',
            }}
          >
            <div>
              <PanelButton
                id="split"
                label=""
                size="md"
                active={getState('split').active}
                highlighted={isHighlighted('split')}
                onClick={() => onButtonClick?.('split')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '11.80%',
              top: '33.20%',
              width: '5.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="chord-memory"
                label=""
                size="md"
                active={getState('chord-memory').active}
                highlighted={isHighlighted('chord-memory')}
                onClick={() => onButtonClick?.('chord-memory')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '18.20%',
              top: '33.20%',
              width: '5.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="arpeggio"
                label=""
                size="md"
                active={getState('arpeggio').active}
                highlighted={isHighlighted('arpeggio')}
                onClick={() => onButtonClick?.('arpeggio')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '23.80%',
              top: '33.20%',
              width: '5.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="transpose"
                label=""
                size="md"
                active={getState('transpose').active}
                highlighted={isHighlighted('transpose')}
                onClick={() => onButtonClick?.('transpose')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '30.50%',
              top: '33.20%',
              width: '5.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="octave-down"
                label=""
                size="md"
                active={getState('octave-down').active}
                highlighted={isHighlighted('octave-down')}
                onClick={() => onButtonClick?.('octave-down')}
              />
            </div>
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '36.20%',
              top: '33.20%',
              width: '5.30%',
              height: '7.80%',
            }}
          >
            <div>
              <PanelButton
                id="octave-up"
                label=""
                size="md"
                active={getState('octave-up').active}
                highlighted={isHighlighted('octave-up')}
                onClick={() => onButtonClick?.('octave-up')}
              />
            </div>
          </div>
      </div>
    </motion.div>
  );
}
