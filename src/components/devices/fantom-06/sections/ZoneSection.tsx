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
              left: 213,
              top: 94,
              width: 50,
              height: 42,
            }}
          >
            <Knob
              id="master-volume"
              label=""
              value={getState('master-volume').value ?? 64}
              highlighted={isHighlighted('master-volume')}
              outerSize={42}
              innerSize={29}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 208,
            top: 138,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MASTER VOLUME
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 256,
              top: 70,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="pan-level"
                label=""
                width={40}
                height={25}
                active={getState('pan-level').active}
                highlighted={isHighlighted('pan-level')}
                onClick={() => onButtonClick?.('pan-level')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 246,
            top: 58,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PAN/ LEVEL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 281,
              top: 69,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="ctrl"
                label=""
                width={40}
                height={25}
                active={getState('ctrl').active}
                highlighted={isHighlighted('ctrl')}
                onClick={() => onButtonClick?.('ctrl')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 271,
            top: 57,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CTRL
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 278,
              top: 104,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="assign"
                label=""
                width={40}
                height={25}
                active={getState('assign').active}
                highlighted={isHighlighted('assign')}
                onClick={() => onButtonClick?.('assign')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 268,
            top: 92,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ASSIGN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 256,
              top: 133,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-9-16"
                label=""
                width={40}
                height={25}
                active={getState('zone-9-16').active}
                highlighted={isHighlighted('zone-9-16')}
                onClick={() => onButtonClick?.('zone-9-16')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 246,
            top: 121,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ZONE 9-16
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 283,
              top: 135,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-select"
                label=""
                width={40}
                height={25}
                active={getState('zone-select').active}
                highlighted={isHighlighted('zone-select')}
                onClick={() => onButtonClick?.('zone-select')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 273,
            top: 123,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ZONE SELECT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 309,
              top: 63,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-1"
              label=""
              value={getState('knob-1').value ?? 64}
              highlighted={isHighlighted('knob-1')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 299,
            top: 105,
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
              left: 341,
              top: 59,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-2"
              label=""
              value={getState('knob-2').value ?? 64}
              highlighted={isHighlighted('knob-2')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 331,
            top: 101,
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
              left: 373,
              top: 61,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-3"
              label=""
              value={getState('knob-3').value ?? 64}
              highlighted={isHighlighted('knob-3')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 363,
            top: 103,
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
              left: 405,
              top: 61,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-4"
              label=""
              value={getState('knob-4').value ?? 64}
              highlighted={isHighlighted('knob-4')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 395,
            top: 103,
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
              left: 438,
              top: 59,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-5"
              label=""
              value={getState('knob-5').value ?? 64}
              highlighted={isHighlighted('knob-5')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 428,
            top: 101,
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
              left: 476,
              top: 58,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-6"
              label=""
              value={getState('knob-6').value ?? 64}
              highlighted={isHighlighted('knob-6')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 466,
            top: 100,
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
              left: 510,
              top: 58,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-7"
              label=""
              value={getState('knob-7').value ?? 64}
              highlighted={isHighlighted('knob-7')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 500,
            top: 100,
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
              left: 549,
              top: 63,
              width: 40,
              height: 40,
            }}
          >
            <Knob
              id="knob-8"
              label=""
              value={getState('knob-8').value ?? 64}
              highlighted={isHighlighted('knob-8')}
              outerSize={40}
              innerSize={28}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 539,
            top: 105,
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
              left: 303,
              top: 114,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-1"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-1').active}
                highlighted={isHighlighted('zone-int-ext-1')}
                onClick={() => onButtonClick?.('zone-int-ext-1')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 293,
            top: 102,
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
              left: 335,
              top: 113,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-2"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-2').active}
                highlighted={isHighlighted('zone-int-ext-2')}
                onClick={() => onButtonClick?.('zone-int-ext-2')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 325,
            top: 101,
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
              left: 369,
              top: 113,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-3"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-3').active}
                highlighted={isHighlighted('zone-int-ext-3')}
                onClick={() => onButtonClick?.('zone-int-ext-3')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 359,
            top: 101,
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
              left: 406,
              top: 111,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-4"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-4').active}
                highlighted={isHighlighted('zone-int-ext-4')}
                onClick={() => onButtonClick?.('zone-int-ext-4')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 396,
            top: 99,
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
              left: 438,
              top: 115,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-5"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-5').active}
                highlighted={isHighlighted('zone-int-ext-5')}
                onClick={() => onButtonClick?.('zone-int-ext-5')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 428,
            top: 103,
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
              left: 473,
              top: 115,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-6"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-6').active}
                highlighted={isHighlighted('zone-int-ext-6')}
                onClick={() => onButtonClick?.('zone-int-ext-6')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 463,
            top: 103,
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
              left: 506,
              top: 116,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-7"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-7').active}
                highlighted={isHighlighted('zone-int-ext-7')}
                onClick={() => onButtonClick?.('zone-int-ext-7')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 496,
            top: 104,
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
              left: 538,
              top: 115,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="zone-int-ext-8"
                label=""
                width={40}
                height={25}
                active={getState('zone-int-ext-8').active}
                highlighted={isHighlighted('zone-int-ext-8')}
                onClick={() => onButtonClick?.('zone-int-ext-8')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 528,
            top: 103,
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
              left: 321,
              top: 131,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-1"
              label=""
              value={getState('slider-1').value ?? 64}
              highlighted={isHighlighted('slider-1')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 304,
            top: 233,
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
              left: 356,
              top: 130,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-2"
              label=""
              value={getState('slider-2').value ?? 64}
              highlighted={isHighlighted('slider-2')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 339,
            top: 232,
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
              left: 388,
              top: 130,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-3"
              label=""
              value={getState('slider-3').value ?? 64}
              highlighted={isHighlighted('slider-3')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 371,
            top: 232,
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
              left: 421,
              top: 130,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-4"
              label=""
              value={getState('slider-4').value ?? 64}
              highlighted={isHighlighted('slider-4')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 404,
            top: 232,
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
              left: 459,
              top: 131,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-5"
              label=""
              value={getState('slider-5').value ?? 64}
              highlighted={isHighlighted('slider-5')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 442,
            top: 233,
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
              left: 491,
              top: 130,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-6"
              label=""
              value={getState('slider-6').value ?? 64}
              highlighted={isHighlighted('slider-6')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 474,
            top: 232,
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
              left: 524,
              top: 131,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-7"
              label=""
              value={getState('slider-7').value ?? 64}
              highlighted={isHighlighted('slider-7')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 507,
            top: 233,
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
              left: 550,
              top: 134,
              width: 25,
              height: 100,
            }}
          >
            <Slider
              id="slider-8"
              label=""
              value={getState('slider-8').value ?? 64}
              highlighted={isHighlighted('slider-8')}
              trackHeight={80}
              trackWidth={15}
            />
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 533,
            top: 236,
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
              left: 225,
              top: 165,
              width: 33,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="split"
                label=""
                width={33}
                height={25}
                active={getState('split').active}
                highlighted={isHighlighted('split')}
                onClick={() => onButtonClick?.('split')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 212,
            top: 153,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SPLIT
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 255,
              top: 163,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="chord-memory"
                label=""
                width={40}
                height={25}
                active={getState('chord-memory').active}
                highlighted={isHighlighted('chord-memory')}
                onClick={() => onButtonClick?.('chord-memory')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 245,
            top: 151,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CHORD MEMORY
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 285,
              top: 164,
              width: 42,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="arpeggio"
                label=""
                width={42}
                height={25}
                active={getState('arpeggio').active}
                highlighted={isHighlighted('arpeggio')}
                onClick={() => onButtonClick?.('arpeggio')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 276,
            top: 152,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ARPEGGIO
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 220,
              top: 193,
              width: 40,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="transpose"
                label=""
                width={40}
                height={25}
                active={getState('transpose').active}
                highlighted={isHighlighted('transpose')}
                onClick={() => onButtonClick?.('transpose')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 210,
            top: 181,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            TRANSPOSE
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 254,
              top: 194,
              width: 33,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="octave-down"
                label=""
                width={33}
                height={25}
                active={getState('octave-down').active}
                highlighted={isHighlighted('octave-down')}
                onClick={() => onButtonClick?.('octave-down')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 241,
            top: 182,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            DOWN
          </span>
        </div>
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: 283,
              top: 193,
              width: 33,
              height: 25,
            }}
          >
            <div>
              <PanelButton
                id="octave-up"
                label=""
                width={33}
                height={25}
                active={getState('octave-up').active}
                highlighted={isHighlighted('octave-up')}
                onClick={() => onButtonClick?.('octave-up')}
              />
            </div>
          </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 270,
            top: 181,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            UP
          </span>
        </div>
      </div>
    </motion.div>
  );
}
