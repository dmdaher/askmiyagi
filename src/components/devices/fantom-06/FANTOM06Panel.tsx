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
      keyboard={{ keys: 61, startNote: 'C2', panelHeightPercent: 51.8, leftPercent: 9.5, widthPercent: 90.3 }}
    >
        {/* Section backgrounds — decorative only */}
        <SectionContainer id="controller" x={-2} y={1} w={220} h={700} />
        <SectionContainer id="zone" x={218} y={-1} w={623} h={366} headerLabel="ZONE" />
        <SectionContainer id="common" x={844} y={-1} w={469} h={281} />
        <SectionContainer id="scene" x={1313} y={-1} w={156} h={275} headerLabel="SCENE CTRL" />
        <SectionContainer id="synth" x={1474} y={-1} w={248} h={226} headerLabel="SYNTH CTRL" />
        <SectionContainer id="sequencer" x={1719} y={-1} w={350} h={360} headerLabel="SEQUENCER" />
        <SectionContainer id="pad" x={2069} y={-1} w={288} h={360} headerLabel="PAD" />

        {/* All controls — panel-level percentage positioning */}
        {/* wheel-1 */}
        <div
          className="absolute"
          style={{
            left: 73,
            top: 108,
            width: 26,
            height: 125,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Wheel
              id="wheel-1"
              label=""
              width={26}
              height={125}
              highlighted={isHighlighted('wheel-1')}
            />
        </div>

        {/* wheel-2 */}
        <div
          className="absolute"
          style={{
            left: 149,
            top: 108,
            width: 26,
            height: 125,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <Wheel
              id="wheel-2"
              label=""
              width={26}
              height={125}
              highlighted={isHighlighted('wheel-2')}
            />
        </div>

        {/* s1 */}
        <div
          className="absolute"
          style={{
            left: 51,
            top: 423,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="s1"
                label=""
                width={41}
                height={26}
                active={getState('s1').active}
                highlighted={isHighlighted('s1')}
                onClick={() => onButtonClick?.('s1')}
              />
            </div>
        </div>

        {/* s2 */}
        <div
          className="absolute"
          style={{
            left: 108,
            top: 423,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="s2"
                label=""
                width={41}
                height={26}
                active={getState('s2').active}
                highlighted={isHighlighted('s2')}
                onClick={() => onButtonClick?.('s2')}
              />
            </div>
        </div>

        {/* pitch-bend-lever */}
        <div
          className="absolute"
          style={{
            left: 73,
            top: 474,
            width: 108,
            height: 108,
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
              width={108}
              height={108}
            />
        </div>

        {/* master-volume */}
        <div
          className="absolute"
          style={{
            left: 248,
            top: 135,
            width: 49,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* pan-level */}
        <div
          className="absolute"
          style={{
            left: 306,
            top: 91,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="pan-level"
                label=""
                width={41}
                height={26}
                active={getState('pan-level').active}
                highlighted={isHighlighted('pan-level')}
                onClick={() => onButtonClick?.('pan-level')}
              />
            </div>
        </div>

        {/* ctrl */}
        <div
          className="absolute"
          style={{
            left: 354,
            top: 91,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="ctrl"
                label=""
                width={41}
                height={26}
                active={getState('ctrl').active}
                highlighted={isHighlighted('ctrl')}
                onClick={() => onButtonClick?.('ctrl')}
              />
            </div>
        </div>

        {/* assign */}
        <div
          className="absolute"
          style={{
            left: 354,
            top: 141,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="assign"
                label=""
                width={41}
                height={26}
                active={getState('assign').active}
                highlighted={isHighlighted('assign')}
                onClick={() => onButtonClick?.('assign')}
              />
            </div>
        </div>

        {/* zone-9-16 */}
        <div
          className="absolute"
          style={{
            left: 305,
            top: 193,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-9-16"
                label=""
                width={41}
                height={26}
                active={getState('zone-9-16').active}
                highlighted={isHighlighted('zone-9-16')}
                onClick={() => onButtonClick?.('zone-9-16')}
              />
            </div>
        </div>

        {/* zone-select */}
        <div
          className="absolute"
          style={{
            left: 354,
            top: 193,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-select"
                label=""
                width={41}
                height={26}
                active={getState('zone-select').active}
                highlighted={isHighlighted('zone-select')}
                onClick={() => onButtonClick?.('zone-select')}
              />
            </div>
        </div>

        {/* knob-1 */}
        <div
          className="absolute"
          style={{
            left: 419,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* knob-2 */}
        <div
          className="absolute"
          style={{
            left: 470,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* knob-3 */}
        <div
          className="absolute"
          style={{
            left: 524,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* knob-4 */}
        <div
          className="absolute"
          style={{
            left: 575,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* knob-5 */}
        <div
          className="absolute"
          style={{
            left: 630,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* knob-6 */}
        <div
          className="absolute"
          style={{
            left: 681,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* knob-7 */}
        <div
          className="absolute"
          style={{
            left: 735,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* knob-8 */}
        <div
          className="absolute"
          style={{
            left: 786,
            top: 85,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* zone-int-ext-1 */}
        <div
          className="absolute"
          style={{
            left: 416,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-1"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-1').active}
                highlighted={isHighlighted('zone-int-ext-1')}
                onClick={() => onButtonClick?.('zone-int-ext-1')}
              />
            </div>
        </div>

        {/* zone-int-ext-2 */}
        <div
          className="absolute"
          style={{
            left: 468,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-2"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-2').active}
                highlighted={isHighlighted('zone-int-ext-2')}
                onClick={() => onButtonClick?.('zone-int-ext-2')}
              />
            </div>
        </div>

        {/* zone-int-ext-3 */}
        <div
          className="absolute"
          style={{
            left: 520,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-3"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-3').active}
                highlighted={isHighlighted('zone-int-ext-3')}
                onClick={() => onButtonClick?.('zone-int-ext-3')}
              />
            </div>
        </div>

        {/* zone-int-ext-4 */}
        <div
          className="absolute"
          style={{
            left: 575,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-4"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-4').active}
                highlighted={isHighlighted('zone-int-ext-4')}
                onClick={() => onButtonClick?.('zone-int-ext-4')}
              />
            </div>
        </div>

        {/* zone-int-ext-5 */}
        <div
          className="absolute"
          style={{
            left: 625,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-5"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-5').active}
                highlighted={isHighlighted('zone-int-ext-5')}
                onClick={() => onButtonClick?.('zone-int-ext-5')}
              />
            </div>
        </div>

        {/* zone-int-ext-6 */}
        <div
          className="absolute"
          style={{
            left: 679,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-6"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-6').active}
                highlighted={isHighlighted('zone-int-ext-6')}
                onClick={() => onButtonClick?.('zone-int-ext-6')}
              />
            </div>
        </div>

        {/* zone-int-ext-7 */}
        <div
          className="absolute"
          style={{
            left: 731,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-7"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-7').active}
                highlighted={isHighlighted('zone-int-ext-7')}
                onClick={() => onButtonClick?.('zone-int-ext-7')}
              />
            </div>
        </div>

        {/* zone-int-ext-8 */}
        <div
          className="absolute"
          style={{
            left: 783,
            top: 161,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-int-ext-8"
                label=""
                width={41}
                height={26}
                active={getState('zone-int-ext-8').active}
                highlighted={isHighlighted('zone-int-ext-8')}
                onClick={() => onButtonClick?.('zone-int-ext-8')}
              />
            </div>
        </div>

        {/* slider-1 */}
        <div
          className="absolute"
          style={{
            left: 424,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* slider-2 */}
        <div
          className="absolute"
          style={{
            left: 476,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* slider-3 */}
        <div
          className="absolute"
          style={{
            left: 530,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* slider-4 */}
        <div
          className="absolute"
          style={{
            left: 583,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* slider-5 */}
        <div
          className="absolute"
          style={{
            left: 638,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* slider-6 */}
        <div
          className="absolute"
          style={{
            left: 688,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* slider-7 */}
        <div
          className="absolute"
          style={{
            left: 741,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* slider-8 */}
        <div
          className="absolute"
          style={{
            left: 794,
            top: 224,
            width: 23,
            height: 94,
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
              trackHeight={74}
              trackWidth={13}
            />
        </div>

        {/* split */}
        <div
          className="absolute"
          style={{
            left: 255,
            top: 241,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="split"
                label=""
                width={41}
                height={26}
                active={getState('split').active}
                highlighted={isHighlighted('split')}
                onClick={() => onButtonClick?.('split')}
              />
            </div>
        </div>

        {/* chord-memory */}
        <div
          className="absolute"
          style={{
            left: 305,
            top: 241,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="chord-memory"
                label=""
                width={41}
                height={26}
                active={getState('chord-memory').active}
                highlighted={isHighlighted('chord-memory')}
                onClick={() => onButtonClick?.('chord-memory')}
              />
            </div>
        </div>

        {/* arpeggio */}
        <div
          className="absolute"
          style={{
            left: 354,
            top: 243,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="arpeggio"
                label=""
                width={41}
                height={26}
                active={getState('arpeggio').active}
                highlighted={isHighlighted('arpeggio')}
                onClick={() => onButtonClick?.('arpeggio')}
              />
            </div>
        </div>

        {/* transpose */}
        <div
          className="absolute"
          style={{
            left: 255,
            top: 294,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="transpose"
                label=""
                width={41}
                height={26}
                active={getState('transpose').active}
                highlighted={isHighlighted('transpose')}
                onClick={() => onButtonClick?.('transpose')}
              />
            </div>
        </div>

        {/* octave-down */}
        <div
          className="absolute"
          style={{
            left: 305,
            top: 294,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="octave-down"
                label=""
                width={41}
                height={26}
                active={getState('octave-down').active}
                highlighted={isHighlighted('octave-down')}
                onClick={() => onButtonClick?.('octave-down')}
              />
            </div>
        </div>

        {/* octave-up */}
        <div
          className="absolute"
          style={{
            left: 354,
            top: 294,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="octave-up"
                label=""
                width={41}
                height={26}
                active={getState('octave-up').active}
                highlighted={isHighlighted('octave-up')}
                onClick={() => onButtonClick?.('octave-up')}
              />
            </div>
        </div>

        {/* write */}
        <div
          className="absolute"
          style={{
            left: 863,
            top: 79,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="write"
                label=""
                width={41}
                height={26}
                active={getState('write').active}
                highlighted={isHighlighted('write')}
                onClick={() => onButtonClick?.('write')}
              />
            </div>
        </div>

        {/* master-fx */}
        <div
          className="absolute"
          style={{
            left: 863,
            top: 133,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="master-fx"
                label=""
                width={41}
                height={26}
                active={getState('master-fx').active}
                highlighted={isHighlighted('master-fx')}
                onClick={() => onButtonClick?.('master-fx')}
              />
            </div>
        </div>

        {/* motional-pad */}
        <div
          className="absolute"
          style={{
            left: 863,
            top: 189,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="motional-pad"
                label=""
                width={41}
                height={26}
                active={getState('motional-pad').active}
                highlighted={isHighlighted('motional-pad')}
                onClick={() => onButtonClick?.('motional-pad')}
              />
            </div>
        </div>

        {/* daw-ctrl */}
        <div
          className="absolute"
          style={{
            left: 863,
            top: 244,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="daw-ctrl"
                label=""
                width={41}
                height={26}
                active={getState('daw-ctrl').active}
                highlighted={isHighlighted('daw-ctrl')}
                onClick={() => onButtonClick?.('daw-ctrl')}
              />
            </div>
        </div>

        {/* menu */}
        <div
          className="absolute"
          style={{
            left: 863,
            top: 299,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="menu"
                label=""
                width={41}
                height={26}
                active={getState('menu').active}
                highlighted={isHighlighted('menu')}
                onClick={() => onButtonClick?.('menu')}
              />
            </div>
        </div>

        {/* display */}
        <div
          className="absolute"
          style={{
            left: 919,
            top: 55,
            width: 352,
            height: 210,
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
              width={352}
              height={210}
              highlighted={isHighlighted('display')}
            />
        </div>

        {/* e1 */}
        <div
          className="absolute"
          style={{
            left: 950,
            top: 283,
            width: 39,
            height: 39,
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
              outerSize={39}
              innerSize={27}
            />
        </div>

        {/* e2 */}
        <div
          className="absolute"
          style={{
            left: 999,
            top: 283,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* e3 */}
        <div
          className="absolute"
          style={{
            left: 1049,
            top: 283,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* e4 */}
        <div
          className="absolute"
          style={{
            left: 1099,
            top: 283,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* e5 */}
        <div
          className="absolute"
          style={{
            left: 1149,
            top: 283,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* e6 */}
        <div
          className="absolute"
          style={{
            left: 1200,
            top: 283,
            width: 41,
            height: 41,
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
              outerSize={41}
              innerSize={29}
            />
        </div>

        {/* tempo */}
        <div
          className="absolute"
          style={{
            left: 1287,
            top: 298,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="tempo"
                label=""
                width={41}
                height={26}
                active={getState('tempo').active}
                highlighted={isHighlighted('tempo')}
                onClick={() => onButtonClick?.('tempo')}
              />
            </div>
        </div>

        {/* value-dial */}
        <div
          className="absolute"
          style={{
            left: 1341,
            top: 41,
            width: 90,
            height: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <ValueDial
              id="value-dial"
              label=""
              outerSize={90}
              highlighted={isHighlighted('value-dial')}
            />
        </div>

        {/* dec */}
        <div
          className="absolute"
          style={{
            left: 1514,
            top: 200,
            width: 30,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="dec"
                label=""
                width={30}
                height={20}
                active={getState('dec').active}
                highlighted={isHighlighted('dec')}
                onClick={() => onButtonClick?.('dec')}
              />
            </div>
        </div>

        {/* inc */}
        <div
          className="absolute"
          style={{
            left: 1413,
            top: 195,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="inc"
                label=""
                width={30}
                height={19}
                active={getState('inc').active}
                highlighted={isHighlighted('inc')}
                onClick={() => onButtonClick?.('inc')}
              />
            </div>
        </div>

        {/* cursor-up */}
        <div
          className="absolute"
          style={{
            left: 1376,
            top: 200,
            width: 30,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-up"
                label=""
                width={30}
                height={20}
                active={getState('cursor-up').active}
                highlighted={isHighlighted('cursor-up')}
                onClick={() => onButtonClick?.('cursor-up')}
              />
            </div>
        </div>

        {/* cursor-down */}
        <div
          className="absolute"
          style={{
            left: 1368,
            top: 241,
            width: 30,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-down"
                label=""
                width={30}
                height={20}
                active={getState('cursor-down').active}
                highlighted={isHighlighted('cursor-down')}
                onClick={() => onButtonClick?.('cursor-down')}
              />
            </div>
        </div>

        {/* cursor-left */}
        <div
          className="absolute"
          style={{
            left: 1333,
            top: 241,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-left"
                label=""
                width={30}
                height={19}
                active={getState('cursor-left').active}
                highlighted={isHighlighted('cursor-left')}
                onClick={() => onButtonClick?.('cursor-left')}
              />
            </div>
        </div>

        {/* cursor-right */}
        <div
          className="absolute"
          style={{
            left: 1413,
            top: 241,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="cursor-right"
                label=""
                width={30}
                height={19}
                active={getState('cursor-right').active}
                highlighted={isHighlighted('cursor-right')}
                onClick={() => onButtonClick?.('cursor-right')}
              />
            </div>
        </div>

        {/* shift */}
        <div
          className="absolute"
          style={{
            left: 1329,
            top: 286,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="shift"
                label=""
                width={30}
                height={19}
                active={getState('shift').active}
                highlighted={isHighlighted('shift')}
                onClick={() => onButtonClick?.('shift')}
              />
            </div>
        </div>

        {/* exit */}
        <div
          className="absolute"
          style={{
            left: 1374,
            top: 288,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="exit"
                label=""
                width={30}
                height={19}
                active={getState('exit').active}
                highlighted={isHighlighted('exit')}
                onClick={() => onButtonClick?.('exit')}
              />
            </div>
        </div>

        {/* enter */}
        <div
          className="absolute"
          style={{
            left: 1413,
            top: 288,
            width: 30,
            height: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="enter"
                label=""
                width={30}
                height={19}
                active={getState('enter').active}
                highlighted={isHighlighted('enter')}
                onClick={() => onButtonClick?.('enter')}
              />
            </div>
        </div>

        {/* scene-select */}
        <div
          className="absolute"
          style={{
            left: 1287,
            top: 79,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="scene-select"
                label=""
                width={41}
                height={26}
                active={getState('scene-select').active}
                highlighted={isHighlighted('scene-select')}
                onClick={() => onButtonClick?.('scene-select')}
              />
            </div>
        </div>

        {/* scene-chain */}
        <div
          className="absolute"
          style={{
            left: 1287,
            top: 134,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="scene-chain"
                label=""
                width={41}
                height={26}
                active={getState('scene-chain').active}
                highlighted={isHighlighted('scene-chain')}
                onClick={() => onButtonClick?.('scene-chain')}
              />
            </div>
        </div>

        {/* zone-view */}
        <div
          className="absolute"
          style={{
            left: 1287,
            top: 189,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="zone-view"
                label=""
                width={41}
                height={26}
                active={getState('zone-view').active}
                highlighted={isHighlighted('zone-view')}
                onClick={() => onButtonClick?.('zone-view')}
              />
            </div>
        </div>

        {/* single-tone */}
        <div
          className="absolute"
          style={{
            left: 1287,
            top: 243,
            width: 41,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="single-tone"
                label=""
                width={41}
                height={26}
                active={getState('single-tone').active}
                highlighted={isHighlighted('single-tone')}
                onClick={() => onButtonClick?.('single-tone')}
              />
            </div>
        </div>

        {/* cutoff */}
        <div
          className="absolute"
          style={{
            left: 1530,
            top: 60,
            width: 38,
            height: 38,
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
              outerSize={38}
              innerSize={27}
            />
        </div>

        {/* resonance */}
        <div
          className="absolute"
          style={{
            left: 1595,
            top: 63,
            width: 38,
            height: 38,
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
              outerSize={38}
              innerSize={27}
            />
        </div>

        {/* osc */}
        <div
          className="absolute"
          style={{
            left: 1508,
            top: 110,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="osc"
                label=""
                width={38}
                height={24}
                active={getState('osc').active}
                highlighted={isHighlighted('osc')}
                onClick={() => onButtonClick?.('osc')}
              />
            </div>
        </div>

        {/* filter-type */}
        <div
          className="absolute"
          style={{
            left: 1570,
            top: 110,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="filter-type"
                label=""
                width={38}
                height={24}
                active={getState('filter-type').active}
                highlighted={isHighlighted('filter-type')}
                onClick={() => onButtonClick?.('filter-type')}
              />
            </div>
        </div>

        {/* param */}
        <div
          className="absolute"
          style={{
            left: 1633,
            top: 110,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="param"
                label=""
                width={38}
                height={24}
                active={getState('param').active}
                highlighted={isHighlighted('param')}
                onClick={() => onButtonClick?.('param')}
              />
            </div>
        </div>

        {/* amp */}
        <div
          className="absolute"
          style={{
            left: 1508,
            top: 155,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="amp"
                label=""
                width={38}
                height={24}
                active={getState('amp').active}
                highlighted={isHighlighted('amp')}
                onClick={() => onButtonClick?.('amp')}
              />
            </div>
        </div>

        {/* fx */}
        <div
          className="absolute"
          style={{
            left: 1570,
            top: 155,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="fx"
                label=""
                width={38}
                height={24}
                active={getState('fx').active}
                highlighted={isHighlighted('fx')}
                onClick={() => onButtonClick?.('fx')}
              />
            </div>
        </div>

        {/* lfo */}
        <div
          className="absolute"
          style={{
            left: 1633,
            top: 155,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="lfo"
                label=""
                width={38}
                height={24}
                active={getState('lfo').active}
                highlighted={isHighlighted('lfo')}
                onClick={() => onButtonClick?.('lfo')}
              />
            </div>
        </div>

        {/* pattern */}
        <div
          className="absolute"
          style={{
            left: 1755,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* group */}
        <div
          className="absolute"
          style={{
            left: 1756,
            top: 75,
            width: 35,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* song */}
        <div
          className="absolute"
          style={{
            left: 1823,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tr-rec */}
        <div
          className="absolute"
          style={{
            left: 1823,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* rhythm-ptn */}
        <div
          className="absolute"
          style={{
            left: 1868,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* stop */}
        <div
          className="absolute"
          style={{
            left: 1935,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* play */}
        <div
          className="absolute"
          style={{
            left: 1963,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* rec */}
        <div
          className="absolute"
          style={{
            left: 1998,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-1 */}
        <div
          className="absolute"
          style={{
            left: 1560,
            top: 338,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-2 */}
        <div
          className="absolute"
          style={{
            left: 1623,
            top: 338,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-3 */}
        <div
          className="absolute"
          style={{
            left: 1685,
            top: 338,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-4 */}
        <div
          className="absolute"
          style={{
            left: 1748,
            top: 338,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-5 */}
        <div
          className="absolute"
          style={{
            left: 1735,
            top: 211,
            width: 35,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-6 */}
        <div
          className="absolute"
          style={{
            left: 1810,
            top: 211,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-7 */}
        <div
          className="absolute"
          style={{
            left: 1888,
            top: 211,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-8 */}
        <div
          className="absolute"
          style={{
            left: 1963,
            top: 211,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-9 */}
        <div
          className="absolute"
          style={{
            left: 1735,
            top: 249,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-10 */}
        <div
          className="absolute"
          style={{
            left: 1810,
            top: 249,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-11 */}
        <div
          className="absolute"
          style={{
            left: 1888,
            top: 249,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-12 */}
        <div
          className="absolute"
          style={{
            left: 1963,
            top: 249,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-13 */}
        <div
          className="absolute"
          style={{
            left: 1735,
            top: 288,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-14 */}
        <div
          className="absolute"
          style={{
            left: 1810,
            top: 288,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-15 */}
        <div
          className="absolute"
          style={{
            left: 1888,
            top: 288,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* tone-cat-16 */}
        <div
          className="absolute"
          style={{
            left: 1963,
            top: 288,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* sampling */}
        <div
          className="absolute"
          style={{
            left: 2086,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="sampling"
                label=""
                width={38}
                height={24}
                active={getState('sampling').active}
                highlighted={isHighlighted('sampling')}
                onClick={() => onButtonClick?.('sampling')}
              />
            </div>
        </div>

        {/* pad-mode */}
        <div
          className="absolute"
          style={{
            left: 2148,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="pad-mode"
                label=""
                width={38}
                height={24}
                active={getState('pad-mode').active}
                highlighted={isHighlighted('pad-mode')}
                onClick={() => onButtonClick?.('pad-mode')}
              />
            </div>
        </div>

        {/* clip-board */}
        <div
          className="absolute"
          style={{
            left: 2185,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="clip-board"
                label=""
                width={38}
                height={24}
                active={getState('clip-board').active}
                highlighted={isHighlighted('clip-board')}
                onClick={() => onButtonClick?.('clip-board')}
              />
            </div>
        </div>

        {/* bank */}
        <div
          className="absolute"
          style={{
            left: 2216,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="bank"
                label=""
                width={38}
                height={24}
                active={getState('bank').active}
                highlighted={isHighlighted('bank')}
                onClick={() => onButtonClick?.('bank')}
              />
            </div>
        </div>

        {/* hold */}
        <div
          className="absolute"
          style={{
            left: 2283,
            top: 16,
            width: 38,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
            <div>
              <PanelButton
                id="hold"
                label=""
                width={38}
                height={24}
                active={getState('hold').active}
                highlighted={isHighlighted('hold')}
                onClick={() => onButtonClick?.('hold')}
              />
            </div>
        </div>

        {/* pad-1 */}
        <div
          className="absolute"
          style={{
            left: 2086,
            top: 173,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-2 */}
        <div
          className="absolute"
          style={{
            left: 2154,
            top: 173,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-3 */}
        <div
          className="absolute"
          style={{
            left: 2218,
            top: 173,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-4 */}
        <div
          className="absolute"
          style={{
            left: 2283,
            top: 173,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-5 */}
        <div
          className="absolute"
          style={{
            left: 2086,
            top: 211,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-6 */}
        <div
          className="absolute"
          style={{
            left: 2154,
            top: 211,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-7 */}
        <div
          className="absolute"
          style={{
            left: 2218,
            top: 211,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-8 */}
        <div
          className="absolute"
          style={{
            left: 2283,
            top: 211,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-9 */}
        <div
          className="absolute"
          style={{
            left: 2086,
            top: 249,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-10 */}
        <div
          className="absolute"
          style={{
            left: 2154,
            top: 249,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-11 */}
        <div
          className="absolute"
          style={{
            left: 2218,
            top: 249,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-12 */}
        <div
          className="absolute"
          style={{
            left: 2283,
            top: 249,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-13 */}
        <div
          className="absolute"
          style={{
            left: 2086,
            top: 288,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-14 */}
        <div
          className="absolute"
          style={{
            left: 2154,
            top: 288,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-15 */}
        <div
          className="absolute"
          style={{
            left: 2218,
            top: 288,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* pad-16 */}
        <div
          className="absolute"
          style={{
            left: 2283,
            top: 288,
            width: 38,
            height: 38,
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
                width={38}
                height={38}
              />
            </div>
        </div>

        {/* Group labels */}


        {/* Floating labels — stored positions from editor */}
        {/* label: WHEEL1 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 48,
            top: 235,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            WHEEL1
          </span>
        </div>

        {/* label: WHEEL2 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 124,
            top: 235,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            WHEEL2
          </span>
        </div>

        {/* label: S1 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 36,
            top: 408,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            S1
          </span>
        </div>

        {/* label: S2 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 91,
            top: 408,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            S2
          </span>
        </div>

        {/* label: PITCH BEND/MOD */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 73,
            top: 585,
            width: 108,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            PITCH BEND/MOD
          </span>
        </div>

        {/* label: SPLIT */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 236,
            top: 229,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SPLIT
          </span>
        </div>

        {/* label: CHORD MEMORY */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 288,
            top: 218,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CHORD<br />
            MEMORY
          </span>
        </div>

        {/* label: ARPEGGIO */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 336,
            top: 229,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            ARPEGGIO
          </span>
        </div>

        {/* label: TRANSPOSE */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 236,
            top: 279,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            TRANSPOSE
          </span>
        </div>

        {/* label: DOWN */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 288,
            top: 279,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            DOWN
          </span>
        </div>

        {/* label: UP */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 336,
            top: 279,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            UP
          </span>
        </div>

        {/* label: MASTER VOLUME */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 233,
            top: 110,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            MASTER<br />
            VOLUME
          </span>
        </div>

        {/* label: PAN/ LEVEL */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 289,
            top: 68,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            PAN/<br />
            LEVEL
          </span>
        </div>

        {/* label: CTRL */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 336,
            top: 79,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CTRL
          </span>
        </div>

        {/* label: ASSIGN */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 336,
            top: 130,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            ASSIGN
          </span>
        </div>

        {/* label: ZONE 9-16 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 288,
            top: 179,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            ZONE 9-16
          </span>
        </div>

        {/* label: ZONE SELECT */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 336,
            top: 169,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            ZONE<br />
            SELECT
          </span>
        </div>

        {/* label: 1 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 399,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            1
          </span>
        </div>

        {/* label: 2 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 450,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            2
          </span>
        </div>

        {/* label: 3 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 505,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            3
          </span>
        </div>

        {/* label: 4 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 555,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            4
          </span>
        </div>

        {/* label: 5 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 608,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            5
          </span>
        </div>

        {/* label: 6 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 661,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            6
          </span>
        </div>

        {/* label: 7 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 713,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            7
          </span>
        </div>

        {/* label: 8 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 768,
            top: 148,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            8
          </span>
        </div>

        {/* label: SCENE SELECT */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1277,
            top: 64,
            width: 60,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SCENE SELECT
          </span>
        </div>

        {/* label: SCENE CHAIN */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1277,
            top: 124,
            width: 60,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SCENE CHAIN
          </span>
        </div>

        {/* label: ZONE VIEW */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1277,
            top: 177,
            width: 60,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            ZONE VIEW
          </span>
        </div>

        {/* label: SINGLE TONE */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1277,
            top: 231,
            width: 60,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SINGLE TONE
          </span>
        </div>

        {/* label: CUTOFF */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1513,
            top: 100,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CUTOFF
          </span>
        </div>

        {/* label: RESONANCE */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1579,
            top: 104,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            RESONANCE
          </span>
        </div>

        {/* label: OSC */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1489,
            top: 99,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            OSC
          </span>
        </div>

        {/* label: FILTER TYPE */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1551,
            top: 99,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            FILTER TYPE
          </span>
        </div>

        {/* label: PARAM */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1614,
            top: 99,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            PARAM
          </span>
        </div>

        {/* label: AMP */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1489,
            top: 145,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            AMP
          </span>
        </div>

        {/* label: FX */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1551,
            top: 145,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            FX
          </span>
        </div>

        {/* label: LFO */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1614,
            top: 145,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            LFO
          </span>
        </div>

        {/* label: PATTERN */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1735,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            PATTERN
          </span>
        </div>

        {/* label: GROUP */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1736,
            top: 63,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            GROUP
          </span>
        </div>

        {/* label: SONG */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1804,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SONG
          </span>
        </div>

        {/* label: TR-REC */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1804,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            TR-REC
          </span>
        </div>

        {/* label: RHYTHM PTN */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1850,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            RHYTHM PTN
          </span>
        </div>

        {/* label: STOP */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1914,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            STOP
          </span>
        </div>

        {/* label: PLAY */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1945,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            PLAY
          </span>
        </div>

        {/* label: REC */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1979,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            REC
          </span>
        </div>

        {/* label: A.PIANO */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1539,
            top: 325,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            A.PIANO
          </span>
        </div>

        {/* label: E.PIANO */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1601,
            top: 325,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            E.PIANO
          </span>
        </div>

        {/* label: ORGAN */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1664,
            top: 325,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            ORGAN
          </span>
        </div>

        {/* label: GUITAR/BASS */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1726,
            top: 325,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            GUITAR/BASS
          </span>
        </div>

        {/* label: STRINGS */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1716,
            top: 198,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            STRINGS
          </span>
        </div>

        {/* label: BRASS */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1791,
            top: 198,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            BRASS
          </span>
        </div>

        {/* label: SYNTH LEAD */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1868,
            top: 198,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SYNTH LEAD
          </span>
        </div>

        {/* label: SYNTH PAD */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1944,
            top: 198,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SYNTH PAD
          </span>
        </div>

        {/* label: BELL/MALLET */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1716,
            top: 236,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            BELL/MALLET
          </span>
        </div>

        {/* label: HIT/OTHER */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1791,
            top: 236,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            HIT/OTHER
          </span>
        </div>

        {/* label: RHYTHM */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1868,
            top: 236,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            RHYTHM
          </span>
        </div>

        {/* label: S.N. ACOUSTIC */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1944,
            top: 236,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            S.N. ACOUSTIC
          </span>
        </div>

        {/* label: S.N.S */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1716,
            top: 275,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            S.N.S
          </span>
        </div>

        {/* label: VTW */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1791,
            top: 275,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            VTW
          </span>
        </div>

        {/* label: MODEL */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1868,
            top: 275,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            MODEL
          </span>
        </div>

        {/* label: DRUM */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1944,
            top: 275,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            DRUM
          </span>
        </div>

        {/* label: SAMPLING */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 2079,
            top: 0,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SAMPLING
          </span>
        </div>

        {/* label: PAD MODE */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 2130,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            PAD MODE
          </span>
        </div>

        {/* label: CLIP BOARD */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 2166,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CLIP BOARD
          </span>
        </div>

        {/* label: BANK */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 2198,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            BANK
          </span>
        </div>

        {/* label: HOLD */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 2264,
            top: 5,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            HOLD
          </span>
        </div>

        {/* label: WRITE */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 836,
            top: 68,
            width: 94,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            WRITE
          </span>
        </div>

        {/* label: MOTIONAL PAD */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 836,
            top: 164,
            width: 94,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            MOTIONAL<br />
            PAD
          </span>
        </div>

        {/* label: DAW CTRL */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 836,
            top: 233,
            width: 94,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            DAW CTRL
          </span>
        </div>

        {/* label: TEMPO */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1277,
            top: 323,
            width: 60,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            TEMPO
          </span>
        </div>

        {/* label: INC */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1391,
            top: 219,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            INC
          </span>
        </div>

        {/* label: CURSOR UP */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1354,
            top: 224,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CURSOR UP
          </span>
        </div>

        {/* label: CURSOR DOWN */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1349,
            top: 264,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CURSOR DOWN
          </span>
        </div>

        {/* label: CURSOR LEFT */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1310,
            top: 264,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CURSOR LEFT
          </span>
        </div>

        {/* label: CURSOR RIGHT */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1391,
            top: 264,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            CURSOR RIGHT
          </span>
        </div>

        {/* label: SHIFT */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1306,
            top: 310,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            SHIFT
          </span>
        </div>

        {/* label: EXIT */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1354,
            top: 311,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            EXIT
          </span>
        </div>

        {/* label: ENTER */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1389,
            top: 274,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            ENTER
          </span>
        </div>

        {/* label: MASTER FX */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 836,
            top: 123,
            width: 94,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            MASTER FX
          </span>
        </div>

        {/* label: MENU */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 836,
            top: 288,
            width: 94,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            MENU
          </span>
        </div>

        {/* label: DEC */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1493,
            top: 224,
            width: 75,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            DEC
          </span>
        </div>

        {/* label: VALUE */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 1341,
            top: 135,
            width: 91,
            fontSize: 8,
            lineHeight: '10px',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
            VALUE
          </span>
        </div>
    </PanelShell>
  );
}
