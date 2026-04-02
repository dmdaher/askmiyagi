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
              left: 273,
              top: 126,
              width: 38,
              height: 32,
            }}
          >
            <Knob
              id="master-volume"
              label=""
              value={getState('master-volume').value ?? 64}
              highlighted={isHighlighted('master-volume')}
              outerSize={32}
              innerSize={22}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 262,
            top: 100,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            MASTER
            <br />
            VOLUME
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 316,
              top: 98,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="pan-level"
                label=""
                width={30}
                height={19}
                active={getState('pan-level').active}
                highlighted={isHighlighted('pan-level')}
                onClick={() => onButtonClick?.('pan-level')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 301,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            PAN/
            <br />
            LEVEL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 353,
              top: 97,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="ctrl"
                label=""
                width={30}
                height={19}
                active={getState('ctrl').active}
                highlighted={isHighlighted('ctrl')}
                onClick={() => onButtonClick?.('ctrl')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 338,
            top: 81,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            CTRL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 350,
              top: 139,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="assign"
                label=""
                width={30}
                height={19}
                active={getState('assign').active}
                highlighted={isHighlighted('assign')}
                onClick={() => onButtonClick?.('assign')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 335,
            top: 123,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            ASSIGN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 313,
              top: 176,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-9-16"
                label=""
                width={30}
                height={19}
                active={getState('zone-9-16').active}
                highlighted={isHighlighted('zone-9-16')}
                onClick={() => onButtonClick?.('zone-9-16')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 298,
            top: 160,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            ZONE 9-16
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 349,
              top: 175,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-select"
                label=""
                width={30}
                height={19}
                active={getState('zone-select').active}
                highlighted={isHighlighted('zone-select')}
                onClick={() => onButtonClick?.('zone-select')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 334,
            top: 149,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            ZONE
            <br />
            SELECT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 392,
              top: 87,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-1"
              label=""
              value={getState('knob-1').value ?? 64}
              highlighted={isHighlighted('knob-1')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 434,
              top: 85,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-2"
              label=""
              value={getState('knob-2').value ?? 64}
              highlighted={isHighlighted('knob-2')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 474,
              top: 86,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-3"
              label=""
              value={getState('knob-3').value ?? 64}
              highlighted={isHighlighted('knob-3')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 516,
              top: 86,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-4"
              label=""
              value={getState('knob-4').value ?? 64}
              highlighted={isHighlighted('knob-4')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 562,
              top: 86,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-5"
              label=""
              value={getState('knob-5').value ?? 64}
              highlighted={isHighlighted('knob-5')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 606,
              top: 88,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-6"
              label=""
              value={getState('knob-6').value ?? 64}
              highlighted={isHighlighted('knob-6')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 646,
              top: 85,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-7"
              label=""
              value={getState('knob-7').value ?? 64}
              highlighted={isHighlighted('knob-7')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 687,
              top: 87,
              width: 30,
              height: 30,
            }}
          >
            <Knob
              id="knob-8"
              label=""
              value={getState('knob-8').value ?? 64}
              highlighted={isHighlighted('knob-8')}
              outerSize={30}
              innerSize={21}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 395,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-1"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-1').active}
                highlighted={isHighlighted('zone-int-ext-1')}
                onClick={() => onButtonClick?.('zone-int-ext-1')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 380,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            1
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 438,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-2"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-2').active}
                highlighted={isHighlighted('zone-int-ext-2')}
                onClick={() => onButtonClick?.('zone-int-ext-2')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 423,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            2
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 481,
              top: 149,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-3"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-3').active}
                highlighted={isHighlighted('zone-int-ext-3')}
                onClick={() => onButtonClick?.('zone-int-ext-3')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 466,
            top: 133,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            3
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 522,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-4"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-4').active}
                highlighted={isHighlighted('zone-int-ext-4')}
                onClick={() => onButtonClick?.('zone-int-ext-4')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 507,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            4
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 566,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-5"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-5').active}
                highlighted={isHighlighted('zone-int-ext-5')}
                onClick={() => onButtonClick?.('zone-int-ext-5')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 551,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            5
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 609,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-6"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-6').active}
                highlighted={isHighlighted('zone-int-ext-6')}
                onClick={() => onButtonClick?.('zone-int-ext-6')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 594,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            6
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 648,
              top: 151,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-7"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-7').active}
                highlighted={isHighlighted('zone-int-ext-7')}
                onClick={() => onButtonClick?.('zone-int-ext-7')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 633,
            top: 135,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            7
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 688,
              top: 150,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-8"
                label=""
                width={30}
                height={19}
                active={getState('zone-int-ext-8').active}
                highlighted={isHighlighted('zone-int-ext-8')}
                onClick={() => onButtonClick?.('zone-int-ext-8')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 673,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            8
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 404,
              top: 181,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-1"
              label=""
              value={getState('slider-1').value ?? 64}
              highlighted={isHighlighted('slider-1')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 446,
              top: 181,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-2"
              label=""
              value={getState('slider-2').value ?? 64}
              highlighted={isHighlighted('slider-2')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 486,
              top: 181,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-3"
              label=""
              value={getState('slider-3').value ?? 64}
              highlighted={isHighlighted('slider-3')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 527,
              top: 178,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-4"
              label=""
              value={getState('slider-4').value ?? 64}
              highlighted={isHighlighted('slider-4')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 573,
              top: 178,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-5"
              label=""
              value={getState('slider-5').value ?? 64}
              highlighted={isHighlighted('slider-5')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 613,
              top: 178,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-6"
              label=""
              value={getState('slider-6').value ?? 64}
              highlighted={isHighlighted('slider-6')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 657,
              top: 179,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-7"
              label=""
              value={getState('slider-7').value ?? 64}
              highlighted={isHighlighted('slider-7')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 696,
              top: 179,
              width: 19,
              height: 75,
            }}
          >
            <Slider
              id="slider-8"
              label=""
              value={getState('slider-8').value ?? 64}
              highlighted={isHighlighted('slider-8')}
              trackHeight={55}
              trackWidth={9}
            />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 282,
              top: 214,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="split"
                label=""
                width={30}
                height={19}
                active={getState('split').active}
                highlighted={isHighlighted('split')}
                onClick={() => onButtonClick?.('split')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 267,
            top: 198,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SPLIT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 318,
              top: 215,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="chord-memory"
                label=""
                width={30}
                height={19}
                active={getState('chord-memory').active}
                highlighted={isHighlighted('chord-memory')}
                onClick={() => onButtonClick?.('chord-memory')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 303,
            top: 189,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            CHORD
            <br />
            MEMORY
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 357,
              top: 213,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="arpeggio"
                label=""
                width={30}
                height={19}
                active={getState('arpeggio').active}
                highlighted={isHighlighted('arpeggio')}
                onClick={() => onButtonClick?.('arpeggio')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 342,
            top: 197,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            ARPEGGIO
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 281,
              top: 251,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="transpose"
                label=""
                width={30}
                height={19}
                active={getState('transpose').active}
                highlighted={isHighlighted('transpose')}
                onClick={() => onButtonClick?.('transpose')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 266,
            top: 235,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            TRANSPOSE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 318,
              top: 251,
              width: 29,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="octave-down"
                label=""
                width={29}
                height={19}
                active={getState('octave-down').active}
                highlighted={isHighlighted('octave-down')}
                onClick={() => onButtonClick?.('octave-down')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 303,
            top: 235,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            DOWN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 353,
              top: 249,
              width: 30,
              height: 19,
            }}
          >
            <div>
              <PanelButton
                id="octave-up"
                label=""
                width={30}
                height={19}
                active={getState('octave-up').active}
                highlighted={isHighlighted('octave-up')}
                onClick={() => onButtonClick?.('octave-up')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 338,
            top: 233,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            UP
          </span>
        </div>
      </div>
    </motion.div>
  );
}
