'use client';

import { motion } from 'framer-motion';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import Knob from '@/components/controls/Knob';
import PadButton from '@/components/controls/PadButton';
import PanelButton from '@/components/controls/PanelButton';
import PanelShell from '@/components/controls/PanelShell';
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


        {/* All controls — panel-level percentage positioning */}
        {/* wheel-1 */}
        <div
          className="absolute"
          style={{
            left: 129,
            top: 104,
            width: 14,
            height: 75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Wheel
              id="wheel-1"
              label=""
              width={14}
              height={75}
              highlighted={isHighlighted('wheel-1')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 106,
            top: 185,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            WHEEL1
          </span>
        </div>

        {/* wheel-2 */}
        <div
          className="absolute"
          style={{
            left: 194,
            top: 101,
            width: 14,
            height: 71,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Wheel
              id="wheel-2"
              label=""
              width={14}
              height={71}
              highlighted={isHighlighted('wheel-2')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 171,
            top: 178,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            WHEEL2
          </span>
        </div>

        {/* s1 */}
        <div
          className="absolute"
          style={{
            left: 116,
            top: 363,
            width: 19,
            height: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="s1"
                label=""
                width={19}
                height={14}
                active={getState('s1').active}
                highlighted={isHighlighted('s1')}
                onClick={() => onButtonClick?.('s1')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 96,
            top: 347,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            S1
          </span>
        </div>

        {/* s2 */}
        <div
          className="absolute"
          style={{
            left: 150,
            top: 361,
            width: 19,
            height: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="s2"
                label=""
                width={19}
                height={14}
                active={getState('s2').active}
                highlighted={isHighlighted('s2')}
                onClick={() => onButtonClick?.('s2')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 130,
            top: 345,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            S2
          </span>
        </div>

        {/* pitch-bend-lever */}
        <div
          className="absolute"
          style={{
            left: 136,
            top: 410,
            width: 61,
            height: 61,
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
              width={61}
              height={61}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 136,
            top: 477,
            width: 61,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            PITCH BEND/MOD
          </span>
        </div>

        {/* master-volume */}
        <div
          className="absolute"
          style={{
            left: 273,
            top: 126,
            width: 38,
            height: 32,
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

        {/* pan-level */}
        <div
          className="absolute"
          style={{
            left: 316,
            top: 98,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* ctrl */}
        <div
          className="absolute"
          style={{
            left: 353,
            top: 97,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* assign */}
        <div
          className="absolute"
          style={{
            left: 350,
            top: 139,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-9-16 */}
        <div
          className="absolute"
          style={{
            left: 313,
            top: 176,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-select */}
        <div
          className="absolute"
          style={{
            left: 349,
            top: 175,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* knob-1 */}
        <div
          className="absolute"
          style={{
            left: 392,
            top: 87,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* knob-2 */}
        <div
          className="absolute"
          style={{
            left: 434,
            top: 85,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* knob-3 */}
        <div
          className="absolute"
          style={{
            left: 474,
            top: 86,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* knob-4 */}
        <div
          className="absolute"
          style={{
            left: 516,
            top: 86,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* knob-5 */}
        <div
          className="absolute"
          style={{
            left: 562,
            top: 86,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* knob-6 */}
        <div
          className="absolute"
          style={{
            left: 606,
            top: 88,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* knob-7 */}
        <div
          className="absolute"
          style={{
            left: 646,
            top: 85,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* knob-8 */}
        <div
          className="absolute"
          style={{
            left: 687,
            top: 87,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>

        {/* zone-int-ext-1 */}
        <div
          className="absolute"
          style={{
            left: 395,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-2 */}
        <div
          className="absolute"
          style={{
            left: 438,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-3 */}
        <div
          className="absolute"
          style={{
            left: 481,
            top: 149,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-4 */}
        <div
          className="absolute"
          style={{
            left: 522,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-5 */}
        <div
          className="absolute"
          style={{
            left: 566,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-6 */}
        <div
          className="absolute"
          style={{
            left: 609,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-7 */}
        <div
          className="absolute"
          style={{
            left: 648,
            top: 151,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* zone-int-ext-8 */}
        <div
          className="absolute"
          style={{
            left: 688,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* slider-1 */}
        <div
          className="absolute"
          style={{
            left: 404,
            top: 181,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* slider-2 */}
        <div
          className="absolute"
          style={{
            left: 446,
            top: 181,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* slider-3 */}
        <div
          className="absolute"
          style={{
            left: 486,
            top: 181,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* slider-4 */}
        <div
          className="absolute"
          style={{
            left: 527,
            top: 178,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* slider-5 */}
        <div
          className="absolute"
          style={{
            left: 573,
            top: 178,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* slider-6 */}
        <div
          className="absolute"
          style={{
            left: 613,
            top: 178,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* slider-7 */}
        <div
          className="absolute"
          style={{
            left: 657,
            top: 179,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* slider-8 */}
        <div
          className="absolute"
          style={{
            left: 696,
            top: 179,
            width: 19,
            height: 75,
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
              trackHeight={55}
              trackWidth={9}
            />
        </div>

        {/* split */}
        <div
          className="absolute"
          style={{
            left: 282,
            top: 214,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* chord-memory */}
        <div
          className="absolute"
          style={{
            left: 318,
            top: 215,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* arpeggio */}
        <div
          className="absolute"
          style={{
            left: 357,
            top: 213,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* transpose */}
        <div
          className="absolute"
          style={{
            left: 281,
            top: 251,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* octave-down */}
        <div
          className="absolute"
          style={{
            left: 318,
            top: 251,
            width: 29,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* octave-up */}
        <div
          className="absolute"
          style={{
            left: 353,
            top: 249,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* write */}
        <div
          className="absolute"
          style={{
            left: 538,
            top: 363,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="write"
                label=""
                width={24}
                height={15}
                active={getState('write').active}
                highlighted={isHighlighted('write')}
                onClick={() => onButtonClick?.('write')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            WRITE
          </span>
        </div>

        {/* master-fx */}
        <div
          className="absolute"
          style={{
            left: 628,
            top: 363,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="master-fx"
                label=""
                width={24}
                height={15}
                active={getState('master-fx').active}
                highlighted={isHighlighted('master-fx')}
                onClick={() => onButtonClick?.('master-fx')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 610,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MASTER FX
          </span>
        </div>

        {/* motional-pad */}
        <div
          className="absolute"
          style={{
            left: 718,
            top: 363,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="motional-pad"
                label=""
                width={24}
                height={15}
                active={getState('motional-pad').active}
                highlighted={isHighlighted('motional-pad')}
                onClick={() => onButtonClick?.('motional-pad')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 700,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MOTIONAL PAD
          </span>
        </div>

        {/* daw-ctrl */}
        <div
          className="absolute"
          style={{
            left: 808,
            top: 363,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="daw-ctrl"
                label=""
                width={24}
                height={15}
                active={getState('daw-ctrl').active}
                highlighted={isHighlighted('daw-ctrl')}
                onClick={() => onButtonClick?.('daw-ctrl')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 790,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            DAW CTRL
          </span>
        </div>

        {/* menu */}
        <div
          className="absolute"
          style={{
            left: 898,
            top: 363,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="menu"
                label=""
                width={24}
                height={15}
                active={getState('menu').active}
                highlighted={isHighlighted('menu')}
                onClick={() => onButtonClick?.('menu')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 880,
            top: 384,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MENU
          </span>
        </div>

        {/* display */}
        <div
          className="absolute"
          style={{
            left: 773,
            top: 69,
            width: 281,
            height: 169,
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
              width={281}
              height={169}
              highlighted={isHighlighted('display')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 773,
            top: 244,
            width: 281,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            Display
          </span>
        </div>

        {/* e1 */}
        <div
          className="absolute"
          style={{
            left: 988,
            top: 363,
            width: 24,
            height: 24,
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
              outerSize={24}
              innerSize={17}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 970,
            top: 393,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E1
          </span>
        </div>

        {/* e2 */}
        <div
          className="absolute"
          style={{
            left: 1078,
            top: 363,
            width: 24,
            height: 24,
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
              outerSize={24}
              innerSize={17}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1060,
            top: 393,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E2
          </span>
        </div>

        {/* e3 */}
        <div
          className="absolute"
          style={{
            left: 538,
            top: 453,
            width: 24,
            height: 24,
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
              outerSize={24}
              innerSize={17}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E3
          </span>
        </div>

        {/* e4 */}
        <div
          className="absolute"
          style={{
            left: 628,
            top: 453,
            width: 24,
            height: 24,
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
              outerSize={24}
              innerSize={17}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 610,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E4
          </span>
        </div>

        {/* e5 */}
        <div
          className="absolute"
          style={{
            left: 718,
            top: 453,
            width: 24,
            height: 24,
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
              outerSize={24}
              innerSize={17}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 700,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E5
          </span>
        </div>

        {/* e6 */}
        <div
          className="absolute"
          style={{
            left: 808,
            top: 453,
            width: 24,
            height: 24,
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
              outerSize={24}
              innerSize={17}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 790,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            E6
          </span>
        </div>

        {/* tempo */}
        <div
          className="absolute"
          style={{
            left: 898,
            top: 453,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tempo"
                label=""
                width={24}
                height={15}
                active={getState('tempo').active}
                highlighted={isHighlighted('tempo')}
                onClick={() => onButtonClick?.('tempo')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 880,
            top: 474,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            TEMPO
          </span>
        </div>

        {/* value-dial */}
        <div
          className="absolute"
          style={{
            left: 988,
            top: 453,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <ValueDial
              id="value-dial"
              label=""
              outerSize={24}
              highlighted={isHighlighted('value-dial')}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 970,
            top: 483,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            VALUE
          </span>
        </div>

        {/* dec */}
        <div
          className="absolute"
          style={{
            left: 1078,
            top: 453,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="dec"
                label=""
                width={24}
                height={15}
                active={getState('dec').active}
                highlighted={isHighlighted('dec')}
                onClick={() => onButtonClick?.('dec')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1060,
            top: 474,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            DEC
          </span>
        </div>

        {/* inc */}
        <div
          className="absolute"
          style={{
            left: 538,
            top: 543,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="inc"
                label=""
                width={24}
                height={15}
                active={getState('inc').active}
                highlighted={isHighlighted('inc')}
                onClick={() => onButtonClick?.('inc')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            INC
          </span>
        </div>

        {/* cursor-up */}
        <div
          className="absolute"
          style={{
            left: 628,
            top: 543,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-up"
                label=""
                width={24}
                height={15}
                active={getState('cursor-up').active}
                highlighted={isHighlighted('cursor-up')}
                onClick={() => onButtonClick?.('cursor-up')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 610,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR UP
          </span>
        </div>

        {/* cursor-down */}
        <div
          className="absolute"
          style={{
            left: 718,
            top: 543,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-down"
                label=""
                width={24}
                height={15}
                active={getState('cursor-down').active}
                highlighted={isHighlighted('cursor-down')}
                onClick={() => onButtonClick?.('cursor-down')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 700,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR DOWN
          </span>
        </div>

        {/* cursor-left */}
        <div
          className="absolute"
          style={{
            left: 808,
            top: 543,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-left"
                label=""
                width={24}
                height={15}
                active={getState('cursor-left').active}
                highlighted={isHighlighted('cursor-left')}
                onClick={() => onButtonClick?.('cursor-left')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 790,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR LEFT
          </span>
        </div>

        {/* cursor-right */}
        <div
          className="absolute"
          style={{
            left: 898,
            top: 543,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-right"
                label=""
                width={24}
                height={15}
                active={getState('cursor-right').active}
                highlighted={isHighlighted('cursor-right')}
                onClick={() => onButtonClick?.('cursor-right')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 880,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CURSOR RIGHT
          </span>
        </div>

        {/* shift */}
        <div
          className="absolute"
          style={{
            left: 988,
            top: 543,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="shift"
                label=""
                width={24}
                height={15}
                active={getState('shift').active}
                highlighted={isHighlighted('shift')}
                onClick={() => onButtonClick?.('shift')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 970,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            SHIFT
          </span>
        </div>

        {/* exit */}
        <div
          className="absolute"
          style={{
            left: 1078,
            top: 543,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="exit"
                label=""
                width={24}
                height={15}
                active={getState('exit').active}
                highlighted={isHighlighted('exit')}
                onClick={() => onButtonClick?.('exit')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1060,
            top: 564,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            EXIT
          </span>
        </div>

        {/* enter */}
        <div
          className="absolute"
          style={{
            left: 538,
            top: 603,
            width: 24,
            height: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="enter"
                label=""
                width={24}
                height={15}
                active={getState('enter').active}
                highlighted={isHighlighted('enter')}
                onClick={() => onButtonClick?.('enter')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 520,
            top: 624,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            ENTER
          </span>
        </div>

        {/* scene-select */}
        <div
          className="absolute"
          style={{
            left: 1063,
            top: 41,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                width={30}
                height={19}
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 25,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SCENE SELECT
          </span>
        </div>

        {/* scene-chain */}
        <div
          className="absolute"
          style={{
            left: 1063,
            top: 104,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                width={30}
                height={19}
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 88,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SCENE CHAIN
          </span>
        </div>

        {/* zone-view */}
        <div
          className="absolute"
          style={{
            left: 1063,
            top: 143,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                width={30}
                height={19}
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 127,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            ZONE VIEW
          </span>
        </div>

        {/* single-tone */}
        <div
          className="absolute"
          style={{
            left: 1063,
            top: 193,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                width={30}
                height={19}
                active={getState('single-tone').active}
                highlighted={isHighlighted('single-tone')}
                onClick={() => onButtonClick?.('single-tone')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1048,
            top: 177,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SINGLE TONE
          </span>
        </div>

        {/* cutoff */}
        <div
          className="absolute"
          style={{
            left: 1194,
            top: 38,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1179,
            top: 74,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            CUTOFF
          </span>
        </div>

        {/* resonance */}
        <div
          className="absolute"
          style={{
            left: 1293,
            top: 38,
            width: 30,
            height: 30,
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
              outerSize={30}
              innerSize={21}
            />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1278,
            top: 74,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            RESONANCE
          </span>
        </div>

        {/* osc */}
        <div
          className="absolute"
          style={{
            left: 1208,
            top: 113,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="osc"
                label=""
                width={30}
                height={19}
                active={getState('osc').active}
                highlighted={isHighlighted('osc')}
                onClick={() => onButtonClick?.('osc')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1193,
            top: 97,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            OSC
          </span>
        </div>

        {/* filter-type */}
        <div
          className="absolute"
          style={{
            left: 1258,
            top: 113,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="filter-type"
                label=""
                width={30}
                height={19}
                active={getState('filter-type').active}
                highlighted={isHighlighted('filter-type')}
                onClick={() => onButtonClick?.('filter-type')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1243,
            top: 97,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            FILTER TYPE
          </span>
        </div>

        {/* param */}
        <div
          className="absolute"
          style={{
            left: 1308,
            top: 113,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="param"
                label=""
                width={30}
                height={19}
                active={getState('param').active}
                highlighted={isHighlighted('param')}
                onClick={() => onButtonClick?.('param')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1293,
            top: 97,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            PARAM
          </span>
        </div>

        {/* amp */}
        <div
          className="absolute"
          style={{
            left: 1208,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="amp"
                label=""
                width={30}
                height={19}
                active={getState('amp').active}
                highlighted={isHighlighted('amp')}
                onClick={() => onButtonClick?.('amp')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1193,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            AMP
          </span>
        </div>

        {/* fx */}
        <div
          className="absolute"
          style={{
            left: 1258,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="fx"
                label=""
                width={30}
                height={19}
                active={getState('fx').active}
                highlighted={isHighlighted('fx')}
                onClick={() => onButtonClick?.('fx')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1243,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            FX
          </span>
        </div>

        {/* lfo */}
        <div
          className="absolute"
          style={{
            left: 1308,
            top: 150,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="lfo"
                label=""
                width={30}
                height={19}
                active={getState('lfo').active}
                highlighted={isHighlighted('lfo')}
                onClick={() => onButtonClick?.('lfo')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1293,
            top: 134,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            LFO
          </span>
        </div>

        {/* pattern */}
        <div
          className="absolute"
          style={{
            left: 1406,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="pattern"
                label=""
                width={30}
                height={19}
                active={getState('pattern').active}
                highlighted={isHighlighted('pattern')}
                onClick={() => onButtonClick?.('pattern')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1391,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            PATTERN
          </span>
        </div>

        {/* group */}
        <div
          className="absolute"
          style={{
            left: 1406,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="group"
                label=""
                width={30}
                height={19}
                active={getState('group').active}
                highlighted={isHighlighted('group')}
                onClick={() => onButtonClick?.('group')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1391,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            GROUP
          </span>
        </div>

        {/* song */}
        <div
          className="absolute"
          style={{
            left: 1461,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="song"
                label=""
                width={30}
                height={19}
                active={getState('song').active}
                highlighted={isHighlighted('song')}
                onClick={() => onButtonClick?.('song')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1446,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SONG
          </span>
        </div>

        {/* tr-rec */}
        <div
          className="absolute"
          style={{
            left: 1461,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tr-rec"
                label=""
                width={30}
                height={19}
                active={getState('tr-rec').active}
                highlighted={isHighlighted('tr-rec')}
                onClick={() => onButtonClick?.('tr-rec')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1446,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            TR-REC
          </span>
        </div>

        {/* rhythm-ptn */}
        <div
          className="absolute"
          style={{
            left: 1498,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="rhythm-ptn"
                label=""
                width={30}
                height={19}
                active={getState('rhythm-ptn').active}
                highlighted={isHighlighted('rhythm-ptn')}
                onClick={() => onButtonClick?.('rhythm-ptn')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1483,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            RHYTHM PTN
          </span>
        </div>

        {/* stop */}
        <div
          className="absolute"
          style={{
            left: 1549,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="stop"
                label=""
                width={30}
                height={19}
                active={getState('stop').active}
                highlighted={isHighlighted('stop')}
                onClick={() => onButtonClick?.('stop')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1534,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            STOP
          </span>
        </div>

        {/* play */}
        <div
          className="absolute"
          style={{
            left: 1574,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="play"
                label=""
                width={30}
                height={19}
                active={getState('play').active}
                highlighted={isHighlighted('play')}
                onClick={() => onButtonClick?.('play')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1559,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            PLAY
          </span>
        </div>

        {/* rec */}
        <div
          className="absolute"
          style={{
            left: 1601,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="rec"
                label=""
                width={30}
                height={19}
                active={getState('rec').active}
                highlighted={isHighlighted('rec')}
                onClick={() => onButtonClick?.('rec')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1586,
            top: 22,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            REC
          </span>
        </div>

        {/* tone-cat-1 */}
        <div
          className="absolute"
          style={{
            left: 1391,
            top: 163,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-1"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-1').active}
                highlighted={isHighlighted('tone-cat-1')}
                onClick={() => onButtonClick?.('tone-cat-1')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1376,
            top: 147,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            A.PIANO
          </span>
        </div>

        {/* tone-cat-2 */}
        <div
          className="absolute"
          style={{
            left: 1450,
            top: 163,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-2"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-2').active}
                highlighted={isHighlighted('tone-cat-2')}
                onClick={() => onButtonClick?.('tone-cat-2')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1435,
            top: 147,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            E.PIANO
          </span>
        </div>

        {/* tone-cat-3 */}
        <div
          className="absolute"
          style={{
            left: 1491,
            top: 163,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-3"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-3').active}
                highlighted={isHighlighted('tone-cat-3')}
                onClick={() => onButtonClick?.('tone-cat-3')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1476,
            top: 147,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            ORGAN
          </span>
        </div>

        {/* tone-cat-4 */}
        <div
          className="absolute"
          style={{
            left: 1573,
            top: 163,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-4"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-4').active}
                highlighted={isHighlighted('tone-cat-4')}
                onClick={() => onButtonClick?.('tone-cat-4')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1558,
            top: 147,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            GUITAR/BASS
          </span>
        </div>

        {/* tone-cat-5 */}
        <div
          className="absolute"
          style={{
            left: 1391,
            top: 194,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-5"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-5').active}
                highlighted={isHighlighted('tone-cat-5')}
                onClick={() => onButtonClick?.('tone-cat-5')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1376,
            top: 178,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            STRINGS
          </span>
        </div>

        {/* tone-cat-6 */}
        <div
          className="absolute"
          style={{
            left: 1450,
            top: 194,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-6"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-6').active}
                highlighted={isHighlighted('tone-cat-6')}
                onClick={() => onButtonClick?.('tone-cat-6')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1435,
            top: 178,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            BRASS
          </span>
        </div>

        {/* tone-cat-7 */}
        <div
          className="absolute"
          style={{
            left: 1491,
            top: 194,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-7"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-7').active}
                highlighted={isHighlighted('tone-cat-7')}
                onClick={() => onButtonClick?.('tone-cat-7')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1476,
            top: 178,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SYNTH LEAD
          </span>
        </div>

        {/* tone-cat-8 */}
        <div
          className="absolute"
          style={{
            left: 1573,
            top: 194,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-8"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-8').active}
                highlighted={isHighlighted('tone-cat-8')}
                onClick={() => onButtonClick?.('tone-cat-8')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1558,
            top: 178,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            SYNTH PAD
          </span>
        </div>

        {/* tone-cat-9 */}
        <div
          className="absolute"
          style={{
            left: 1391,
            top: 225,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-9"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-9').active}
                highlighted={isHighlighted('tone-cat-9')}
                onClick={() => onButtonClick?.('tone-cat-9')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1376,
            top: 209,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            BELL/MALLET
          </span>
        </div>

        {/* tone-cat-10 */}
        <div
          className="absolute"
          style={{
            left: 1450,
            top: 225,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-10"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-10').active}
                highlighted={isHighlighted('tone-cat-10')}
                onClick={() => onButtonClick?.('tone-cat-10')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1435,
            top: 209,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            HIT/OTHER
          </span>
        </div>

        {/* tone-cat-11 */}
        <div
          className="absolute"
          style={{
            left: 1491,
            top: 225,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-11"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-11').active}
                highlighted={isHighlighted('tone-cat-11')}
                onClick={() => onButtonClick?.('tone-cat-11')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1476,
            top: 209,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            RHYTHM
          </span>
        </div>

        {/* tone-cat-12 */}
        <div
          className="absolute"
          style={{
            left: 1573,
            top: 225,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-12"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-12').active}
                highlighted={isHighlighted('tone-cat-12')}
                onClick={() => onButtonClick?.('tone-cat-12')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1558,
            top: 209,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            S.N. ACOUSTIC
          </span>
        </div>

        {/* tone-cat-13 */}
        <div
          className="absolute"
          style={{
            left: 1391,
            top: 256,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-13"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-13').active}
                highlighted={isHighlighted('tone-cat-13')}
                onClick={() => onButtonClick?.('tone-cat-13')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1376,
            top: 240,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            S.N.S
          </span>
        </div>

        {/* tone-cat-14 */}
        <div
          className="absolute"
          style={{
            left: 1450,
            top: 256,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-14"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-14').active}
                highlighted={isHighlighted('tone-cat-14')}
                onClick={() => onButtonClick?.('tone-cat-14')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1435,
            top: 240,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            VTW
          </span>
        </div>

        {/* tone-cat-15 */}
        <div
          className="absolute"
          style={{
            left: 1491,
            top: 256,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-15"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-15').active}
                highlighted={isHighlighted('tone-cat-15')}
                onClick={() => onButtonClick?.('tone-cat-15')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1476,
            top: 240,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            MODEL
          </span>
        </div>

        {/* tone-cat-16 */}
        <div
          className="absolute"
          style={{
            left: 1573,
            top: 256,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tone-cat-16"
                label=""
                width={30}
                height={19}
                active={getState('tone-cat-16').active}
                highlighted={isHighlighted('tone-cat-16')}
                onClick={() => onButtonClick?.('tone-cat-16')}
              />
            </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1558,
            top: 240,
            width: 60,
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 6 }}>
            DRUM
          </span>
        </div>

        {/* sampling */}
        <div
          className="absolute"
          style={{
            left: 1654,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-mode */}
        <div
          className="absolute"
          style={{
            left: 1704,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* clip-board */}
        <div
          className="absolute"
          style={{
            left: 1733,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* bank */}
        <div
          className="absolute"
          style={{
            left: 1758,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* hold */}
        <div
          className="absolute"
          style={{
            left: 1811,
            top: 38,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-1 */}
        <div
          className="absolute"
          style={{
            left: 1654,
            top: 163,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-2 */}
        <div
          className="absolute"
          style={{
            left: 1706,
            top: 163,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-3 */}
        <div
          className="absolute"
          style={{
            left: 1760,
            top: 163,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-4 */}
        <div
          className="absolute"
          style={{
            left: 1811,
            top: 163,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-5 */}
        <div
          className="absolute"
          style={{
            left: 1654,
            top: 194,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-6 */}
        <div
          className="absolute"
          style={{
            left: 1706,
            top: 194,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-7 */}
        <div
          className="absolute"
          style={{
            left: 1760,
            top: 194,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-8 */}
        <div
          className="absolute"
          style={{
            left: 1811,
            top: 194,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-9 */}
        <div
          className="absolute"
          style={{
            left: 1654,
            top: 225,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-10 */}
        <div
          className="absolute"
          style={{
            left: 1706,
            top: 225,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-11 */}
        <div
          className="absolute"
          style={{
            left: 1760,
            top: 225,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-12 */}
        <div
          className="absolute"
          style={{
            left: 1811,
            top: 225,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-13 */}
        <div
          className="absolute"
          style={{
            left: 1654,
            top: 256,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-14 */}
        <div
          className="absolute"
          style={{
            left: 1706,
            top: 256,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-15 */}
        <div
          className="absolute"
          style={{
            left: 1760,
            top: 256,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* pad-16 */}
        <div
          className="absolute"
          style={{
            left: 1811,
            top: 256,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* Group labels */}

    </PanelShell>
  );
}
