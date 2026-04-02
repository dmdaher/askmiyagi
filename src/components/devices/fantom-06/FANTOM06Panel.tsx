'use client';

import { motion } from 'framer-motion';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import Knob from '@/components/controls/Knob';
import PadButton from '@/components/controls/PadButton';
import PanelButton from '@/components/controls/PanelButton';
import PanelShell from '@/components/controls/PanelShell';
import SectionContainer from '@/components/controls/SectionContainer';
import Slider from '@/components/controls/Slider';
import TouchDisplay from '@/components/controls/TouchDisplay';
import ValueDial from '@/components/controls/ValueDial';
import Wheel from '@/components/controls/Wheel';
import { PanelState } from '@/types/panel';
import { FANTOM06_PANEL } from '@/lib/devices/fantom-06-constants';

interface FANTOM06PanelProps {
  panelState: PanelState;
  displayState?: any;
  highlightedControls: string[];
  zones?: any[];
  onButtonClick?: (id: string) => void;
}

export default function FANTOM06Panel({
  panelState,
  highlightedControls,
  onButtonClick,
}: FANTOM06PanelProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <PanelShell
      manufacturer={FANTOM06_PANEL.manufacturer}
      deviceName={FANTOM06_PANEL.deviceName}
      width={FANTOM06_PANEL.width}
      height={FANTOM06_PANEL.height}
      keyboard={{ keys: 61, startNote: 'C2', panelHeightPercent: 55, leftPercent: 5, widthPercent: 93 }}
    >
        {/* Section backgrounds — decorative only */}
        {/* controller background */}
        <SectionContainer id="controller" x={56} y={16} w={140} h={425} />

        {/* ZONE background */}
        <SectionContainer id="zone" x={150} y={10} w={460} h={230} headerLabel="ZONE" />

        {/* common background */}
        <SectionContainer id="common" x={578} y={11} w={300} h={125} />

        {/* SCENE CTRL background */}
        <SectionContainer id="scene" x={840} y={23} w={100} h={176} headerLabel="SCENE CTRL" />

        {/* SYNTH CTRL background */}
        <SectionContainer id="synth" x={945} y={20} w={158} h={145} headerLabel="SYNTH CTRL" />

        {/* SEQUENCER background */}
        <SectionContainer id="sequencer" x={1103} y={20} w={224} h={230} headerLabel="SEQUENCER" />

        {/* PAD background */}
        <SectionContainer id="pad" x={1313} y={20} w={184} h={230} headerLabel="PAD" />

        {/* All controls — panel-level percentage positioning */}
        {/* wheel-1 */}
        <div
          className="absolute"
          style={{
            left: 103,
            top: 83,
            width: 19,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Wheel
              id="wheel-1"
              label=""
              width={19}
              height={100}
              highlighted={isHighlighted('wheel-1')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 83,
            top: 71,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            WHEEL1
          </span>
        </div>

        {/* wheel-2 */}
        <div
          className="absolute"
          style={{
            left: 155,
            top: 81,
            width: 19,
            height: 94,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Wheel
              id="wheel-2"
              label=""
              width={19}
              height={94}
              highlighted={isHighlighted('wheel-2')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 135,
            top: 69,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            WHEEL2
          </span>
        </div>

        {/* s1 */}
        <div
          className="absolute"
          style={{
            left: 93,
            top: 290,
            width: 25,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="s1"
                label=""
                width={25}
                height={19}
                active={getState('s1').active}
                highlighted={isHighlighted('s1')}
                onClick={() => onButtonClick?.('s1')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 76,
            top: 278,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            S1
          </span>
        </div>

        {/* s2 */}
        <div
          className="absolute"
          style={{
            left: 120,
            top: 289,
            width: 25,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="s2"
                label=""
                width={25}
                height={19}
                active={getState('s2').active}
                highlighted={isHighlighted('s2')}
                onClick={() => onButtonClick?.('s2')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 103,
            top: 277,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            S2
          </span>
        </div>

        {/* pitch-bend-lever */}
        <div
          className="absolute"
          style={{
            left: 109,
            top: 328,
            width: 82,
            height: 82,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <DirectionSwitch
              id="pitch-bend-lever"
              label=""
              positions={["FWD","REV","SLIP REV"]}
              highlighted={isHighlighted('pitch-bend-lever')}
              width={82}
              height={82}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 109,
            top: 316,
            width: 82,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PITCH BEND/MOD
          </span>
        </div>

        {/* master-volume */}
        <div
          className="absolute"
          style={{
            left: 213,
            top: 94,
            width: 50,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pan-level */}
        <div
          className="absolute"
          style={{
            left: 256,
            top: 70,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* ctrl */}
        <div
          className="absolute"
          style={{
            left: 281,
            top: 69,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* assign */}
        <div
          className="absolute"
          style={{
            left: 278,
            top: 104,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-9-16 */}
        <div
          className="absolute"
          style={{
            left: 256,
            top: 133,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-select */}
        <div
          className="absolute"
          style={{
            left: 283,
            top: 135,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-1 */}
        <div
          className="absolute"
          style={{
            left: 309,
            top: 63,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-2 */}
        <div
          className="absolute"
          style={{
            left: 341,
            top: 59,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-3 */}
        <div
          className="absolute"
          style={{
            left: 373,
            top: 61,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-4 */}
        <div
          className="absolute"
          style={{
            left: 405,
            top: 61,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-5 */}
        <div
          className="absolute"
          style={{
            left: 438,
            top: 59,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-6 */}
        <div
          className="absolute"
          style={{
            left: 476,
            top: 58,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-7 */}
        <div
          className="absolute"
          style={{
            left: 510,
            top: 58,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-8 */}
        <div
          className="absolute"
          style={{
            left: 549,
            top: 63,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-1 */}
        <div
          className="absolute"
          style={{
            left: 303,
            top: 114,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-2 */}
        <div
          className="absolute"
          style={{
            left: 335,
            top: 113,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-3 */}
        <div
          className="absolute"
          style={{
            left: 369,
            top: 113,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-4 */}
        <div
          className="absolute"
          style={{
            left: 406,
            top: 111,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-5 */}
        <div
          className="absolute"
          style={{
            left: 438,
            top: 115,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-6 */}
        <div
          className="absolute"
          style={{
            left: 473,
            top: 115,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-7 */}
        <div
          className="absolute"
          style={{
            left: 506,
            top: 116,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-8 */}
        <div
          className="absolute"
          style={{
            left: 538,
            top: 115,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-1 */}
        <div
          className="absolute"
          style={{
            left: 321,
            top: 131,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-2 */}
        <div
          className="absolute"
          style={{
            left: 356,
            top: 130,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-3 */}
        <div
          className="absolute"
          style={{
            left: 388,
            top: 130,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-4 */}
        <div
          className="absolute"
          style={{
            left: 421,
            top: 130,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-5 */}
        <div
          className="absolute"
          style={{
            left: 459,
            top: 131,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-6 */}
        <div
          className="absolute"
          style={{
            left: 491,
            top: 130,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-7 */}
        <div
          className="absolute"
          style={{
            left: 524,
            top: 131,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-8 */}
        <div
          className="absolute"
          style={{
            left: 550,
            top: 134,
            width: 25,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* split */}
        <div
          className="absolute"
          style={{
            left: 225,
            top: 165,
            width: 33,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* chord-memory */}
        <div
          className="absolute"
          style={{
            left: 255,
            top: 163,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* arpeggio */}
        <div
          className="absolute"
          style={{
            left: 285,
            top: 164,
            width: 42,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* transpose */}
        <div
          className="absolute"
          style={{
            left: 220,
            top: 193,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* octave-down */}
        <div
          className="absolute"
          style={{
            left: 254,
            top: 194,
            width: 33,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* octave-up */}
        <div
          className="absolute"
          style={{
            left: 283,
            top: 193,
            width: 33,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* write */}
        <div
          className="absolute"
          style={{
            left: 34.2,
            top: 84,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="write"
                label=""
                width={4.2}
                height={7.8}
                active={getState('write').active}
                highlighted={isHighlighted('write')}
                onClick={() => onButtonClick?.('write')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 6,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            WRITE
          </span>
        </div>

        {/* master-fx */}
        <div
          className="absolute"
          style={{
            left: 38.7,
            top: 84,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="master-fx"
                label=""
                width={4.2}
                height={7.8}
                active={getState('master-fx').active}
                highlighted={isHighlighted('master-fx')}
                onClick={() => onButtonClick?.('master-fx')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 11,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MASTER FX
          </span>
        </div>

        {/* motional-pad */}
        <div
          className="absolute"
          style={{
            left: 43.2,
            top: 84,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="motional-pad"
                label=""
                width={4.2}
                height={7.8}
                active={getState('motional-pad').active}
                highlighted={isHighlighted('motional-pad')}
                onClick={() => onButtonClick?.('motional-pad')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 15,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MOTIONAL PAD
          </span>
        </div>

        {/* daw-ctrl */}
        <div
          className="absolute"
          style={{
            left: 47.7,
            top: 84,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="daw-ctrl"
                label=""
                width={4.2}
                height={7.8}
                active={getState('daw-ctrl').active}
                highlighted={isHighlighted('daw-ctrl')}
                onClick={() => onButtonClick?.('daw-ctrl')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 20,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            DAW CTRL
          </span>
        </div>

        {/* menu */}
        <div
          className="absolute"
          style={{
            left: 52.2,
            top: 84,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="menu"
                label=""
                width={4.2}
                height={7.8}
                active={getState('menu').active}
                highlighted={isHighlighted('menu')}
                onClick={() => onButtonClick?.('menu')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 24,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MENU
          </span>
        </div>

        {/* display */}
        <div
          className="absolute"
          style={{
            left: 618,
            top: 55,
            width: 375,
            height: 225,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <TouchDisplay
              id="display"
              label=""
              variant="main"
              showMockContent
              width={375}
              height={225}
              highlighted={isHighlighted('display')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 618,
            top: 43,
            width: 375,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            Display
          </span>
        </div>

        {/* e1 */}
        <div
          className="absolute"
          style={{
            left: 34.2,
            top: 92.8,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="e1"
              label=""
              value={getState('e1').value ?? 64}
              highlighted={isHighlighted('e1')}
              outerSize={4.2}
              innerSize={3}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 6,
            top: 103,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E1
          </span>
        </div>

        {/* e2 */}
        <div
          className="absolute"
          style={{
            left: 38.7,
            top: 92.8,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="e2"
              label=""
              value={getState('e2').value ?? 64}
              highlighted={isHighlighted('e2')}
              outerSize={4.2}
              innerSize={3}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 11,
            top: 103,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E2
          </span>
        </div>

        {/* e3 */}
        <div
          className="absolute"
          style={{
            left: 43.2,
            top: 92.8,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="e3"
              label=""
              value={getState('e3').value ?? 64}
              highlighted={isHighlighted('e3')}
              outerSize={4.2}
              innerSize={3}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 15,
            top: 103,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E3
          </span>
        </div>

        {/* e4 */}
        <div
          className="absolute"
          style={{
            left: 47.7,
            top: 92.8,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="e4"
              label=""
              value={getState('e4').value ?? 64}
              highlighted={isHighlighted('e4')}
              outerSize={4.2}
              innerSize={3}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 20,
            top: 103,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E4
          </span>
        </div>

        {/* e5 */}
        <div
          className="absolute"
          style={{
            left: 52.2,
            top: 92.8,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="e5"
              label=""
              value={getState('e5').value ?? 64}
              highlighted={isHighlighted('e5')}
              outerSize={4.2}
              innerSize={3}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 24,
            top: 103,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E5
          </span>
        </div>

        {/* e6 */}
        <div
          className="absolute"
          style={{
            left: 34.2,
            top: 101.7,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="e6"
              label=""
              value={getState('e6').value ?? 64}
              highlighted={isHighlighted('e6')}
              outerSize={4.2}
              innerSize={3}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 6,
            top: 112,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E6
          </span>
        </div>

        {/* tempo */}
        <div
          className="absolute"
          style={{
            left: 38.7,
            top: 101.7,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tempo"
                label=""
                width={4.2}
                height={7.8}
                active={getState('tempo').active}
                highlighted={isHighlighted('tempo')}
                onClick={() => onButtonClick?.('tempo')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 11,
            top: 90,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            TEMPO
          </span>
        </div>

        {/* value-dial */}
        <div
          className="absolute"
          style={{
            left: 43.2,
            top: 101.7,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <ValueDial
              id="value-dial"
              label=""
              outerSize={4.2}
              highlighted={isHighlighted('value-dial')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 15,
            top: 112,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            VALUE
          </span>
        </div>

        {/* dec */}
        <div
          className="absolute"
          style={{
            left: 47.7,
            top: 101.7,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="dec"
                label=""
                width={4.2}
                height={7.8}
                active={getState('dec').active}
                highlighted={isHighlighted('dec')}
                onClick={() => onButtonClick?.('dec')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 20,
            top: 90,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            DEC
          </span>
        </div>

        {/* inc */}
        <div
          className="absolute"
          style={{
            left: 52.2,
            top: 101.7,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="inc"
                label=""
                width={4.2}
                height={7.8}
                active={getState('inc').active}
                highlighted={isHighlighted('inc')}
                onClick={() => onButtonClick?.('inc')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 24,
            top: 90,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            INC
          </span>
        </div>

        {/* cursor-up */}
        <div
          className="absolute"
          style={{
            left: 34.2,
            top: 110.5,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-up"
                label=""
                width={4.2}
                height={7.8}
                active={getState('cursor-up').active}
                highlighted={isHighlighted('cursor-up')}
                onClick={() => onButtonClick?.('cursor-up')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 6,
            top: 99,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR UP
          </span>
        </div>

        {/* cursor-down */}
        <div
          className="absolute"
          style={{
            left: 47.7,
            top: 110.5,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-down"
                label=""
                width={4.2}
                height={7.8}
                active={getState('cursor-down').active}
                highlighted={isHighlighted('cursor-down')}
                onClick={() => onButtonClick?.('cursor-down')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 20,
            top: 99,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR DOWN
          </span>
        </div>

        {/* cursor-left */}
        <div
          className="absolute"
          style={{
            left: 38.7,
            top: 110.5,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-left"
                label=""
                width={4.2}
                height={7.8}
                active={getState('cursor-left').active}
                highlighted={isHighlighted('cursor-left')}
                onClick={() => onButtonClick?.('cursor-left')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 11,
            top: 99,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR LEFT
          </span>
        </div>

        {/* cursor-right */}
        <div
          className="absolute"
          style={{
            left: 43.2,
            top: 110.5,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-right"
                label=""
                width={4.2}
                height={7.8}
                active={getState('cursor-right').active}
                highlighted={isHighlighted('cursor-right')}
                onClick={() => onButtonClick?.('cursor-right')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 15,
            top: 99,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CURSOR RIGHT
          </span>
        </div>

        {/* shift */}
        <div
          className="absolute"
          style={{
            left: 52.2,
            top: 110.5,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="shift"
                label=""
                width={4.2}
                height={7.8}
                active={getState('shift').active}
                highlighted={isHighlighted('shift')}
                onClick={() => onButtonClick?.('shift')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 24,
            top: 99,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SHIFT
          </span>
        </div>

        {/* exit */}
        <div
          className="absolute"
          style={{
            left: 34.2,
            top: 119.4,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="exit"
                label=""
                width={4.2}
                height={7.8}
                active={getState('exit').active}
                highlighted={isHighlighted('exit')}
                onClick={() => onButtonClick?.('exit')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 6,
            top: 107,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            EXIT
          </span>
        </div>

        {/* enter */}
        <div
          className="absolute"
          style={{
            left: 38.7,
            top: 119.4,
            width: 4.2,
            height: 7.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="enter"
                label=""
                width={4.2}
                height={7.8}
                active={getState('enter').active}
                highlighted={isHighlighted('enter')}
                onClick={() => onButtonClick?.('enter')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 11,
            top: 107,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ENTER
          </span>
        </div>

        {/* scene-select */}
        <div
          className="absolute"
          style={{
            left: 850,
            top: 33,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                width={40}
                height={25}
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 21,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SCENE SELECT
          </span>
        </div>

        {/* scene-chain */}
        <div
          className="absolute"
          style={{
            left: 850,
            top: 83,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                width={40}
                height={25}
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 71,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SCENE CHAIN
          </span>
        </div>

        {/* zone-view */}
        <div
          className="absolute"
          style={{
            left: 850,
            top: 114,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                width={40}
                height={25}
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 102,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ZONE VIEW
          </span>
        </div>

        {/* single-tone */}
        <div
          className="absolute"
          style={{
            left: 850,
            top: 154,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                width={40}
                height={25}
                active={getState('single-tone').active}
                highlighted={isHighlighted('single-tone')}
                onClick={() => onButtonClick?.('single-tone')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 840,
            top: 142,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SINGLE TONE
          </span>
        </div>

        {/* cutoff */}
        <div
          className="absolute"
          style={{
            left: 955,
            top: 30,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="cutoff"
              label=""
              value={getState('cutoff').value ?? 64}
              highlighted={isHighlighted('cutoff')}
              outerSize={40}
              innerSize={28}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 945,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            CUTOFF
          </span>
        </div>

        {/* resonance */}
        <div
          className="absolute"
          style={{
            left: 1034,
            top: 30,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Knob
              id="resonance"
              label=""
              value={getState('resonance').value ?? 64}
              highlighted={isHighlighted('resonance')}
              outerSize={40}
              innerSize={28}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1024,
            top: 72,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            RESONANCE
          </span>
        </div>

        {/* osc */}
        <div
          className="absolute"
          style={{
            left: 966,
            top: 90,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="osc"
                label=""
                width={40}
                height={25}
                active={getState('osc').active}
                highlighted={isHighlighted('osc')}
                onClick={() => onButtonClick?.('osc')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 956,
            top: 78,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            OSC
          </span>
        </div>

        {/* filter-type */}
        <div
          className="absolute"
          style={{
            left: 1006,
            top: 90,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="filter-type"
                label=""
                width={40}
                height={25}
                active={getState('filter-type').active}
                highlighted={isHighlighted('filter-type')}
                onClick={() => onButtonClick?.('filter-type')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 996,
            top: 78,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            FILTER TYPE
          </span>
        </div>

        {/* param */}
        <div
          className="absolute"
          style={{
            left: 1046,
            top: 90,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="param"
                label=""
                width={40}
                height={25}
                active={getState('param').active}
                highlighted={isHighlighted('param')}
                onClick={() => onButtonClick?.('param')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1036,
            top: 78,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PARAM
          </span>
        </div>

        {/* amp */}
        <div
          className="absolute"
          style={{
            left: 966,
            top: 120,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="amp"
                label=""
                width={40}
                height={25}
                active={getState('amp').active}
                highlighted={isHighlighted('amp')}
                onClick={() => onButtonClick?.('amp')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 956,
            top: 108,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            AMP
          </span>
        </div>

        {/* fx */}
        <div
          className="absolute"
          style={{
            left: 1006,
            top: 120,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="fx"
                label=""
                width={40}
                height={25}
                active={getState('fx').active}
                highlighted={isHighlighted('fx')}
                onClick={() => onButtonClick?.('fx')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 996,
            top: 108,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            FX
          </span>
        </div>

        {/* lfo */}
        <div
          className="absolute"
          style={{
            left: 1046,
            top: 120,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="lfo"
                label=""
                width={40}
                height={25}
                active={getState('lfo').active}
                highlighted={isHighlighted('lfo')}
                onClick={() => onButtonClick?.('lfo')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1036,
            top: 108,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            LFO
          </span>
        </div>

        {/* pattern */}
        <div
          className="absolute"
          style={{
            left: 1125,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="pattern"
                label=""
                width={40}
                height={25}
                active={getState('pattern').active}
                highlighted={isHighlighted('pattern')}
                onClick={() => onButtonClick?.('pattern')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1115,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PATTERN
          </span>
        </div>

        {/* group */}
        <div
          className="absolute"
          style={{
            left: 1125,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="group"
                label=""
                width={40}
                height={25}
                active={getState('group').active}
                highlighted={isHighlighted('group')}
                onClick={() => onButtonClick?.('group')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1115,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            GROUP
          </span>
        </div>

        {/* song */}
        <div
          className="absolute"
          style={{
            left: 1169,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="song"
                label=""
                width={40}
                height={25}
                active={getState('song').active}
                highlighted={isHighlighted('song')}
                onClick={() => onButtonClick?.('song')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1159,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SONG
          </span>
        </div>

        {/* tr-rec */}
        <div
          className="absolute"
          style={{
            left: 1169,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tr-rec"
                label=""
                width={40}
                height={25}
                active={getState('tr-rec').active}
                highlighted={isHighlighted('tr-rec')}
                onClick={() => onButtonClick?.('tr-rec')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1159,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            TR-REC
          </span>
        </div>

        {/* rhythm-ptn */}
        <div
          className="absolute"
          style={{
            left: 1198,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="rhythm-ptn"
                label=""
                width={40}
                height={25}
                active={getState('rhythm-ptn').active}
                highlighted={isHighlighted('rhythm-ptn')}
                onClick={() => onButtonClick?.('rhythm-ptn')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1188,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            RHYTHM PTN
          </span>
        </div>

        {/* stop */}
        <div
          className="absolute"
          style={{
            left: 1239,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="stop"
                label=""
                width={40}
                height={25}
                active={getState('stop').active}
                highlighted={isHighlighted('stop')}
                onClick={() => onButtonClick?.('stop')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1229,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            STOP
          </span>
        </div>

        {/* play */}
        <div
          className="absolute"
          style={{
            left: 1259,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="play"
                label=""
                width={40}
                height={25}
                active={getState('play').active}
                highlighted={isHighlighted('play')}
                onClick={() => onButtonClick?.('play')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1249,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PLAY
          </span>
        </div>

        {/* rec */}
        <div
          className="absolute"
          style={{
            left: 1281,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="rec"
                label=""
                width={40}
                height={25}
                active={getState('rec').active}
                highlighted={isHighlighted('rec')}
                onClick={() => onButtonClick?.('rec')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1271,
            top: 18,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            REC
          </span>
        </div>

        {/* tone-cat-1 */}
        <div
          className="absolute"
          style={{
            left: 1113,
            top: 130,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-1"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-1').active}
                highlighted={isHighlighted('tone-cat-1')}
                onClick={() => onButtonClick?.('tone-cat-1')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1103,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            A.PIANO
          </span>
        </div>

        {/* tone-cat-2 */}
        <div
          className="absolute"
          style={{
            left: 1160,
            top: 130,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-2"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-2').active}
                highlighted={isHighlighted('tone-cat-2')}
                onClick={() => onButtonClick?.('tone-cat-2')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1150,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            E.PIANO
          </span>
        </div>

        {/* tone-cat-3 */}
        <div
          className="absolute"
          style={{
            left: 1193,
            top: 130,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-3"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-3').active}
                highlighted={isHighlighted('tone-cat-3')}
                onClick={() => onButtonClick?.('tone-cat-3')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1183,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            ORGAN
          </span>
        </div>

        {/* tone-cat-4 */}
        <div
          className="absolute"
          style={{
            left: 1258,
            top: 130,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-4"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-4').active}
                highlighted={isHighlighted('tone-cat-4')}
                onClick={() => onButtonClick?.('tone-cat-4')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1248,
            top: 118,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            GUITAR/BASS
          </span>
        </div>

        {/* tone-cat-5 */}
        <div
          className="absolute"
          style={{
            left: 1113,
            top: 155,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-5"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-5').active}
                highlighted={isHighlighted('tone-cat-5')}
                onClick={() => onButtonClick?.('tone-cat-5')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1103,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            STRINGS
          </span>
        </div>

        {/* tone-cat-6 */}
        <div
          className="absolute"
          style={{
            left: 1160,
            top: 155,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-6"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-6').active}
                highlighted={isHighlighted('tone-cat-6')}
                onClick={() => onButtonClick?.('tone-cat-6')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1150,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            BRASS
          </span>
        </div>

        {/* tone-cat-7 */}
        <div
          className="absolute"
          style={{
            left: 1193,
            top: 155,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-7"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-7').active}
                highlighted={isHighlighted('tone-cat-7')}
                onClick={() => onButtonClick?.('tone-cat-7')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1183,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SYNTH LEAD
          </span>
        </div>

        {/* tone-cat-8 */}
        <div
          className="absolute"
          style={{
            left: 1258,
            top: 155,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-8"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-8').active}
                highlighted={isHighlighted('tone-cat-8')}
                onClick={() => onButtonClick?.('tone-cat-8')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1248,
            top: 143,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            SYNTH PAD
          </span>
        </div>

        {/* tone-cat-9 */}
        <div
          className="absolute"
          style={{
            left: 1113,
            top: 180,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-9"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-9').active}
                highlighted={isHighlighted('tone-cat-9')}
                onClick={() => onButtonClick?.('tone-cat-9')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1103,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            BELL/MALLET
          </span>
        </div>

        {/* tone-cat-10 */}
        <div
          className="absolute"
          style={{
            left: 1160,
            top: 180,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-10"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-10').active}
                highlighted={isHighlighted('tone-cat-10')}
                onClick={() => onButtonClick?.('tone-cat-10')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1150,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            HIT/OTHER
          </span>
        </div>

        {/* tone-cat-11 */}
        <div
          className="absolute"
          style={{
            left: 1193,
            top: 180,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-11"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-11').active}
                highlighted={isHighlighted('tone-cat-11')}
                onClick={() => onButtonClick?.('tone-cat-11')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1183,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            RHYTHM
          </span>
        </div>

        {/* tone-cat-12 */}
        <div
          className="absolute"
          style={{
            left: 1258,
            top: 180,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-12"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-12').active}
                highlighted={isHighlighted('tone-cat-12')}
                onClick={() => onButtonClick?.('tone-cat-12')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1248,
            top: 168,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            S.N. ACOUSTIC
          </span>
        </div>

        {/* tone-cat-13 */}
        <div
          className="absolute"
          style={{
            left: 1113,
            top: 205,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-13"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-13').active}
                highlighted={isHighlighted('tone-cat-13')}
                onClick={() => onButtonClick?.('tone-cat-13')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1103,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            S.N.S
          </span>
        </div>

        {/* tone-cat-14 */}
        <div
          className="absolute"
          style={{
            left: 1160,
            top: 205,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-14"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-14').active}
                highlighted={isHighlighted('tone-cat-14')}
                onClick={() => onButtonClick?.('tone-cat-14')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1150,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            VTW
          </span>
        </div>

        {/* tone-cat-15 */}
        <div
          className="absolute"
          style={{
            left: 1193,
            top: 205,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-15"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-15').active}
                highlighted={isHighlighted('tone-cat-15')}
                onClick={() => onButtonClick?.('tone-cat-15')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1183,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            MODEL
          </span>
        </div>

        {/* tone-cat-16 */}
        <div
          className="absolute"
          style={{
            left: 1258,
            top: 205,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-16"
                label=""
                width={40}
                height={25}
                active={getState('tone-cat-16').active}
                highlighted={isHighlighted('tone-cat-16')}
                onClick={() => onButtonClick?.('tone-cat-16')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1248,
            top: 193,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            DRUM
          </span>
        </div>

        {/* sampling */}
        <div
          className="absolute"
          style={{
            left: 1323,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-mode */}
        <div
          className="absolute"
          style={{
            left: 1363,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* clip-board */}
        <div
          className="absolute"
          style={{
            left: 1386,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* bank */}
        <div
          className="absolute"
          style={{
            left: 1406,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* hold */}
        <div
          className="absolute"
          style={{
            left: 1449,
            top: 30,
            width: 40,
            height: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-1 */}
        <div
          className="absolute"
          style={{
            left: 1323,
            top: 130,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-2 */}
        <div
          className="absolute"
          style={{
            left: 1365,
            top: 130,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-3 */}
        <div
          className="absolute"
          style={{
            left: 1408,
            top: 130,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-4 */}
        <div
          className="absolute"
          style={{
            left: 1449,
            top: 130,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-5 */}
        <div
          className="absolute"
          style={{
            left: 1323,
            top: 155,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-6 */}
        <div
          className="absolute"
          style={{
            left: 1365,
            top: 155,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-7 */}
        <div
          className="absolute"
          style={{
            left: 1408,
            top: 155,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-8 */}
        <div
          className="absolute"
          style={{
            left: 1449,
            top: 155,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-9 */}
        <div
          className="absolute"
          style={{
            left: 1323,
            top: 180,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-10 */}
        <div
          className="absolute"
          style={{
            left: 1365,
            top: 180,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-11 */}
        <div
          className="absolute"
          style={{
            left: 1408,
            top: 180,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-12 */}
        <div
          className="absolute"
          style={{
            left: 1449,
            top: 180,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-13 */}
        <div
          className="absolute"
          style={{
            left: 1323,
            top: 205,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-14 */}
        <div
          className="absolute"
          style={{
            left: 1365,
            top: 205,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-15 */}
        <div
          className="absolute"
          style={{
            left: 1408,
            top: 205,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-16 */}
        <div
          className="absolute"
          style={{
            left: 1449,
            top: 205,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* Group labels */}

    </PanelShell>
  );
}
