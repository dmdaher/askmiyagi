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
        <SectionContainer id="controller" x={3.9} y={4.2} w={9.1} h={93.6} />

        {/* ZONE background */}
        <SectionContainer id="zone" x={10} y={2.2} w={30.7} h={65.4} headerLabel="ZONE" />

        {/* common background */}
        <SectionContainer id="common" x={38.5} y={2.5} w={20} h={27.7} />

        {/* SCENE CTRL background */}
        <SectionContainer id="scene" x={56} y={5.1} w={6.7} h={38.9} headerLabel="SCENE CTRL" />

        {/* SYNTH CTRL background */}
        <SectionContainer id="synth" x={63} y={4.4} w={10.6} h={32.1} headerLabel="SYNTH CTRL" />

        {/* SEQUENCER background */}
        <SectionContainer id="sequencer" x={73.5} y={4.5} w={14.9} h={50.9} headerLabel="SEQUENCER" />

        {/* PAD background */}
        <SectionContainer id="pad" x={87.5} y={4.4} w={12.3} h={51} headerLabel="PAD" />

        {/* All controls — panel-level percentage positioning */}
        {/* wheel-1 */}
        <div
          className="absolute"
          style={{
            left: '5.5%',
            top: '6.4%',
            width: 36,
            height: 148,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Wheel
                id="wheel-1"
                label=""
                width={36}
                height={148}
                highlighted={isHighlighted('wheel-1')}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '5.5%',
            top: '5.2%',
            width: '3.0%',
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
            left: '9.3%',
            top: '6.4%',
            width: 36,
            height: 148,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Wheel
                id="wheel-2"
                label=""
                width={36}
                height={148}
                highlighted={isHighlighted('wheel-2')}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '9.3%',
            top: '5.2%',
            width: '3.0%',
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
            left: '4.2%',
            top: '65.1%',
            width: 60,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="s1"
                  label=""
                  size="sm"
                  active={getState('s1').active}
                  highlighted={isHighlighted('s1')}
                  onClick={() => onButtonClick?.('s1')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '4.2%',
            top: '63.9%',
            width: '5.0%',
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
            left: '5.8%',
            top: '64.8%',
            width: 60,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="s2"
                  label=""
                  size="sm"
                  active={getState('s2').active}
                  highlighted={isHighlighted('s2')}
                  onClick={() => onButtonClick?.('s2')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '5.8%',
            top: '63.6%',
            width: '5.0%',
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
            left: '6.8%',
            top: '59.0%',
            width: 60,
            height: 132,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <DirectionSwitch
                id="pitch-bend-lever"
                label=""
                positions={["FWD","REV","SLIP REV"]}
                highlighted={isHighlighted('pitch-bend-lever')}
                width={60}
                height={132}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '6.8%',
            top: '57.8%',
            width: '5.0%',
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
            left: '12.5%',
            top: '17.5%',
            width: 72,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="master-volume"
                label=""
                value={getState('master-volume').value ?? 64}
                highlighted={isHighlighted('master-volume')}
                outerSize={48}
                innerSize={34}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '12.5%',
            top: '31.0%',
            width: '6.0%',
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
            left: '15.5%',
            top: '12.9%',
            width: 56,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="pan-level"
                  label=""
                  size="sm"
                  active={getState('pan-level').active}
                  highlighted={isHighlighted('pan-level')}
                  onClick={() => onButtonClick?.('pan-level')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.5%',
            top: '11.7%',
            width: '4.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider break-words" style={{ fontSize: 8 }}>
            PAN/LEVEL
          </span>
        </div>

        {/* ctrl */}
        <div
          className="absolute"
          style={{
            left: '18.5%',
            top: '13.2%',
            width: 24,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="ctrl"
                  label=""
                  size="sm"
                  active={getState('ctrl').active}
                  highlighted={isHighlighted('ctrl')}
                  onClick={() => onButtonClick?.('ctrl')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '18.5%',
            top: '12.0%',
            width: '2.0%',
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
            left: '16.9%',
            top: '24.1%',
            width: 64,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="assign"
                  label=""
                  size="sm"
                  active={getState('assign').active}
                  highlighted={isHighlighted('assign')}
                  onClick={() => onButtonClick?.('assign')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.9%',
            top: '22.9%',
            width: '5.3%',
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
            left: '16.1%',
            top: '29.4%',
            width: 36,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-9-16"
                  label=""
                  size="sm"
                  active={getState('zone-9-16').active}
                  highlighted={isHighlighted('zone-9-16')}
                  onClick={() => onButtonClick?.('zone-9-16')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.1%',
            top: '28.2%',
            width: '3.0%',
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
            left: '16.9%',
            top: '28.7%',
            width: 64,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-select"
                  label=""
                  size="sm"
                  active={getState('zone-select').active}
                  highlighted={isHighlighted('zone-select')}
                  onClick={() => onButtonClick?.('zone-select')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.9%',
            top: '27.5%',
            width: '5.3%',
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
            left: '20.5%',
            top: '13.4%',
            width: 40,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-1"
                label=""
                value={getState('knob-1').value ?? 64}
                highlighted={isHighlighted('knob-1')}
                outerSize={32}
                innerSize={22}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '20.5%',
            top: '22.5%',
            width: '3.3%',
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
            left: '22.8%',
            top: '13.2%',
            width: 42,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-2"
                label=""
                value={getState('knob-2').value ?? 64}
                highlighted={isHighlighted('knob-2')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '22.8%',
            top: '21.2%',
            width: '3.5%',
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
            left: '24.8%',
            top: '13.4%',
            width: 44,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-3"
                label=""
                value={getState('knob-3').value ?? 64}
                highlighted={isHighlighted('knob-3')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '24.8%',
            top: '21.4%',
            width: '3.7%',
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
            left: '26.9%',
            top: '13.2%',
            width: 42,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-4"
                label=""
                value={getState('knob-4').value ?? 64}
                highlighted={isHighlighted('knob-4')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '26.9%',
            top: '21.2%',
            width: '3.5%',
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
            left: '29.2%',
            top: '13.2%',
            width: 42,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-5"
                label=""
                value={getState('knob-5').value ?? 64}
                highlighted={isHighlighted('knob-5')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '29.2%',
            top: '21.2%',
            width: '3.5%',
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
            left: '31.7%',
            top: '12.6%',
            width: 40,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-6"
                label=""
                value={getState('knob-6').value ?? 64}
                highlighted={isHighlighted('knob-6')}
                outerSize={32}
                innerSize={22}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '31.7%',
            top: '21.7%',
            width: '3.3%',
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
            left: '33.9%',
            top: '12.6%',
            width: 40,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-7"
                label=""
                value={getState('knob-7').value ?? 64}
                highlighted={isHighlighted('knob-7')}
                outerSize={32}
                innerSize={22}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '33.9%',
            top: '21.7%',
            width: '3.3%',
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
            left: '35.8%',
            top: '13.2%',
            width: 42,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="knob-8"
                label=""
                value={getState('knob-8').value ?? 64}
                highlighted={isHighlighted('knob-8')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '35.8%',
            top: '21.2%',
            width: '3.5%',
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
            left: '20.2%',
            top: '25.2%',
            width: 44,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-1"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-1').active}
                  highlighted={isHighlighted('zone-int-ext-1')}
                  onClick={() => onButtonClick?.('zone-int-ext-1')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '20.2%',
            top: '24.0%',
            width: '3.7%',
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
            left: '22.4%',
            top: '24.9%',
            width: 40,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-2"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-2').active}
                  highlighted={isHighlighted('zone-int-ext-2')}
                  onClick={() => onButtonClick?.('zone-int-ext-2')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '22.4%',
            top: '23.7%',
            width: '3.3%',
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
            left: '24.6%',
            top: '24.9%',
            width: 40,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-3"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-3').active}
                  highlighted={isHighlighted('zone-int-ext-3')}
                  onClick={() => onButtonClick?.('zone-int-ext-3')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '24.6%',
            top: '23.7%',
            width: '3.3%',
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
            left: '27.1%',
            top: '24.6%',
            width: 40,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-4"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-4').active}
                  highlighted={isHighlighted('zone-int-ext-4')}
                  onClick={() => onButtonClick?.('zone-int-ext-4')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '27.1%',
            top: '23.4%',
            width: '3.3%',
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
            left: '29.1%',
            top: '25.4%',
            width: 44,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-5"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-5').active}
                  highlighted={isHighlighted('zone-int-ext-5')}
                  onClick={() => onButtonClick?.('zone-int-ext-5')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '29.1%',
            top: '24.2%',
            width: '3.7%',
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
            left: '31.5%',
            top: '25.4%',
            width: 40,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-6"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-6').active}
                  highlighted={isHighlighted('zone-int-ext-6')}
                  onClick={() => onButtonClick?.('zone-int-ext-6')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '31.5%',
            top: '24.2%',
            width: '3.3%',
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
            left: '33.7%',
            top: '25.8%',
            width: 40,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-7"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-7').active}
                  highlighted={isHighlighted('zone-int-ext-7')}
                  onClick={() => onButtonClick?.('zone-int-ext-7')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '33.7%',
            top: '24.6%',
            width: '3.3%',
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
            left: '35.8%',
            top: '25.4%',
            width: 44,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-int-ext-8"
                  label=""
                  size="sm"
                  active={getState('zone-int-ext-8').active}
                  highlighted={isHighlighted('zone-int-ext-8')}
                  onClick={() => onButtonClick?.('zone-int-ext-8')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '35.8%',
            top: '24.2%',
            width: '3.7%',
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
            left: '21.4%',
            top: '24.7%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-1"
                label=""
                value={getState('slider-1').value ?? 64}
                highlighted={isHighlighted('slider-1')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '21.4%',
            top: '60.4%',
            width: '2.0%',
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
            left: '23.8%',
            top: '23.3%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-2"
                label=""
                value={getState('slider-2').value ?? 64}
                highlighted={isHighlighted('slider-2')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '23.8%',
            top: '59.0%',
            width: '2.0%',
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
            left: '25.8%',
            top: '23.3%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-3"
                label=""
                value={getState('slider-3').value ?? 64}
                highlighted={isHighlighted('slider-3')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '25.8%',
            top: '59.0%',
            width: '2.0%',
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
            left: '27.8%',
            top: '22.4%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-4"
                label=""
                value={getState('slider-4').value ?? 64}
                highlighted={isHighlighted('slider-4')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '27.8%',
            top: '58.1%',
            width: '2.0%',
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
            left: '30.3%',
            top: '22.4%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-5"
                label=""
                value={getState('slider-5').value ?? 64}
                highlighted={isHighlighted('slider-5')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '30.3%',
            top: '58.1%',
            width: '2.0%',
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
            left: '32.4%',
            top: '22.2%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-6"
                label=""
                value={getState('slider-6').value ?? 64}
                highlighted={isHighlighted('slider-6')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '32.4%',
            top: '57.9%',
            width: '2.0%',
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
            left: '34.8%',
            top: '23.0%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-7"
                label=""
                value={getState('slider-7').value ?? 64}
                highlighted={isHighlighted('slider-7')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.8%',
            top: '58.7%',
            width: '2.0%',
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
            left: '36.9%',
            top: '22.7%',
            width: 24,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Slider
                id="slider-8"
                label=""
                value={getState('slider-8').value ?? 64}
                highlighted={isHighlighted('slider-8')}
                trackHeight={108}
                trackWidth={14}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '36.9%',
            top: '58.4%',
            width: '2.0%',
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
            left: '13.3%',
            top: '35.6%',
            width: 56,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="split"
                  label=""
                  size="sm"
                  active={getState('split').active}
                  highlighted={isHighlighted('split')}
                  onClick={() => onButtonClick?.('split')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '13.3%',
            top: '34.4%',
            width: '4.7%',
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
            left: '15.2%',
            top: '35.2%',
            width: 56,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="chord-memory"
                  label=""
                  size="sm"
                  active={getState('chord-memory').active}
                  highlighted={isHighlighted('chord-memory')}
                  onClick={() => onButtonClick?.('chord-memory')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.2%',
            top: '34.0%',
            width: '4.7%',
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
            left: '18.0%',
            top: '36.3%',
            width: 44,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="arpeggio"
                  label=""
                  size="sm"
                  active={getState('arpeggio').active}
                  highlighted={isHighlighted('arpeggio')}
                  onClick={() => onButtonClick?.('arpeggio')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '18.0%',
            top: '35.1%',
            width: '3.7%',
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
            left: '12.6%',
            top: '42.7%',
            width: 60,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="transpose"
                  label=""
                  size="sm"
                  active={getState('transpose').active}
                  highlighted={isHighlighted('transpose')}
                  onClick={() => onButtonClick?.('transpose')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '12.6%',
            top: '41.5%',
            width: '5.0%',
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
            left: '15.2%',
            top: '42.9%',
            width: 56,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="octave-down"
                  label=""
                  size="sm"
                  active={getState('octave-down').active}
                  highlighted={isHighlighted('octave-down')}
                  onClick={() => onButtonClick?.('octave-down')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.2%',
            top: '41.7%',
            width: '4.7%',
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
            left: '17.0%',
            top: '42.7%',
            width: 60,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="octave-up"
                  label=""
                  size="sm"
                  active={getState('octave-up').active}
                  highlighted={isHighlighted('octave-up')}
                  onClick={() => onButtonClick?.('octave-up')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '17.0%',
            top: '41.5%',
            width: '5.0%',
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
            left: '34.2%',
            top: '84.0%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="write"
                  label=""
                  size="sm"
                  active={getState('write').active}
                  highlighted={isHighlighted('write')}
                  onClick={() => onButtonClick?.('write')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '82.8%',
            width: '4.2%',
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
            left: '38.7%',
            top: '84.0%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="master-fx"
                  label=""
                  size="sm"
                  active={getState('master-fx').active}
                  highlighted={isHighlighted('master-fx')}
                  onClick={() => onButtonClick?.('master-fx')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '82.8%',
            width: '4.2%',
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
            left: '43.2%',
            top: '84.0%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="motional-pad"
                  label=""
                  size="sm"
                  active={getState('motional-pad').active}
                  highlighted={isHighlighted('motional-pad')}
                  onClick={() => onButtonClick?.('motional-pad')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '82.8%',
            width: '4.2%',
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
            left: '47.7%',
            top: '84.0%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="daw-ctrl"
                  label=""
                  size="sm"
                  active={getState('daw-ctrl').active}
                  highlighted={isHighlighted('daw-ctrl')}
                  onClick={() => onButtonClick?.('daw-ctrl')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '82.8%',
            width: '4.2%',
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
            left: '52.2%',
            top: '84.0%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="menu"
                  label=""
                  size="sm"
                  active={getState('menu').active}
                  highlighted={isHighlighted('menu')}
                  onClick={() => onButtonClick?.('menu')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '82.8%',
            width: '4.2%',
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
            left: '39.2%',
            top: '4.7%',
            width: 224,
            height: 84,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <TouchDisplay
                id="display"
                label=""
                variant="main"
                showMockContent
                width={224}
                height={84}
                highlighted={isHighlighted('display')}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '39.2%',
            top: '3.5%',
            width: '18.7%',
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
            left: '34.2%',
            top: '92.8%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="e1"
                label=""
                value={getState('e1').value ?? 64}
                highlighted={isHighlighted('e1')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '100.8%',
            width: '4.2%',
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
            left: '38.7%',
            top: '92.8%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="e2"
                label=""
                value={getState('e2').value ?? 64}
                highlighted={isHighlighted('e2')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '100.8%',
            width: '4.2%',
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
            left: '43.2%',
            top: '92.8%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="e3"
                label=""
                value={getState('e3').value ?? 64}
                highlighted={isHighlighted('e3')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '100.8%',
            width: '4.2%',
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
            left: '47.7%',
            top: '92.8%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="e4"
                label=""
                value={getState('e4').value ?? 64}
                highlighted={isHighlighted('e4')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '100.8%',
            width: '4.2%',
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
            left: '52.2%',
            top: '92.8%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="e5"
                label=""
                value={getState('e5').value ?? 64}
                highlighted={isHighlighted('e5')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '100.8%',
            width: '4.2%',
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
            left: '34.2%',
            top: '101.7%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="e6"
                label=""
                value={getState('e6').value ?? 64}
                highlighted={isHighlighted('e6')}
                outerSize={28}
                innerSize={20}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '109.7%',
            width: '4.2%',
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
            left: '38.7%',
            top: '101.7%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tempo"
                  label=""
                  size="sm"
                  active={getState('tempo').active}
                  highlighted={isHighlighted('tempo')}
                  onClick={() => onButtonClick?.('tempo')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '100.5%',
            width: '4.2%',
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
            left: '43.2%',
            top: '101.7%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <ValueDial
                id="value-dial"
                label=""
                outerSize={28}
                highlighted={isHighlighted('value-dial')}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '109.7%',
            width: '4.2%',
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
            left: '47.7%',
            top: '101.7%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="dec"
                  label=""
                  size="sm"
                  active={getState('dec').active}
                  highlighted={isHighlighted('dec')}
                  onClick={() => onButtonClick?.('dec')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '100.5%',
            width: '4.2%',
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
            left: '52.2%',
            top: '101.7%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="inc"
                  label=""
                  size="sm"
                  active={getState('inc').active}
                  highlighted={isHighlighted('inc')}
                  onClick={() => onButtonClick?.('inc')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '100.5%',
            width: '4.2%',
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
            left: '34.2%',
            top: '110.5%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="cursor-up"
                  label=""
                  size="sm"
                  active={getState('cursor-up').active}
                  highlighted={isHighlighted('cursor-up')}
                  onClick={() => onButtonClick?.('cursor-up')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '109.3%',
            width: '4.2%',
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
            left: '47.7%',
            top: '110.5%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="cursor-down"
                  label=""
                  size="sm"
                  active={getState('cursor-down').active}
                  highlighted={isHighlighted('cursor-down')}
                  onClick={() => onButtonClick?.('cursor-down')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '47.7%',
            top: '109.3%',
            width: '4.2%',
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
            left: '38.7%',
            top: '110.5%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="cursor-left"
                  label=""
                  size="sm"
                  active={getState('cursor-left').active}
                  highlighted={isHighlighted('cursor-left')}
                  onClick={() => onButtonClick?.('cursor-left')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '109.3%',
            width: '4.2%',
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
            left: '43.2%',
            top: '110.5%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="cursor-right"
                  label=""
                  size="sm"
                  active={getState('cursor-right').active}
                  highlighted={isHighlighted('cursor-right')}
                  onClick={() => onButtonClick?.('cursor-right')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '43.2%',
            top: '109.3%',
            width: '4.2%',
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
            left: '52.2%',
            top: '110.5%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="shift"
                  label=""
                  size="sm"
                  active={getState('shift').active}
                  highlighted={isHighlighted('shift')}
                  onClick={() => onButtonClick?.('shift')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '52.2%',
            top: '109.3%',
            width: '4.2%',
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
            left: '34.2%',
            top: '119.4%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="exit"
                  label=""
                  size="sm"
                  active={getState('exit').active}
                  highlighted={isHighlighted('exit')}
                  onClick={() => onButtonClick?.('exit')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '34.2%',
            top: '118.2%',
            width: '4.2%',
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
            left: '38.7%',
            top: '119.4%',
            width: 50,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="enter"
                  label=""
                  size="sm"
                  active={getState('enter').active}
                  highlighted={isHighlighted('enter')}
                  onClick={() => onButtonClick?.('enter')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '38.7%',
            top: '118.2%',
            width: '4.2%',
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
            left: '56.7%',
            top: '7.3%',
            width: 64,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="scene-select"
                  label=""
                  size="sm"
                  active={getState('scene-select').active}
                  highlighted={isHighlighted('scene-select')}
                  onClick={() => onButtonClick?.('scene-select')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '6.1%',
            width: '5.3%',
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
            left: '56.7%',
            top: '18.4%',
            width: 64,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="scene-chain"
                  label=""
                  size="sm"
                  active={getState('scene-chain').active}
                  highlighted={isHighlighted('scene-chain')}
                  onClick={() => onButtonClick?.('scene-chain')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '17.2%',
            width: '5.3%',
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
            left: '56.7%',
            top: '25.2%',
            width: 64,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="zone-view"
                  label=""
                  size="sm"
                  active={getState('zone-view').active}
                  highlighted={isHighlighted('zone-view')}
                  onClick={() => onButtonClick?.('zone-view')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '24.0%',
            width: '5.3%',
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
            left: '56.7%',
            top: '34.1%',
            width: 64,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="single-tone"
                  label=""
                  size="sm"
                  active={getState('single-tone').active}
                  highlighted={isHighlighted('single-tone')}
                  onClick={() => onButtonClick?.('single-tone')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '56.7%',
            top: '32.9%',
            width: '5.3%',
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
            left: '63.7%',
            top: '6.6%',
            width: 48,
            height: 39,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="cutoff"
                label=""
                value={getState('cutoff').value ?? 64}
                highlighted={isHighlighted('cutoff')}
                outerSize={39}
                innerSize={27}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '63.7%',
            top: '17.7%',
            width: '4.0%',
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
            left: '68.9%',
            top: '6.6%',
            width: 48,
            height: 39,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <Knob
                id="resonance"
                label=""
                value={getState('resonance').value ?? 64}
                highlighted={isHighlighted('resonance')}
                outerSize={39}
                innerSize={27}
              />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '68.9%',
            top: '17.7%',
            width: '4.0%',
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
            left: '64.4%',
            top: '19.9%',
            width: 31,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="osc"
                  label=""
                  size="sm"
                  active={getState('osc').active}
                  highlighted={isHighlighted('osc')}
                  onClick={() => onButtonClick?.('osc')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '64.4%',
            top: '18.7%',
            width: '2.6%',
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
            left: '67.1%',
            top: '19.9%',
            width: 31,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="filter-type"
                  label=""
                  size="sm"
                  active={getState('filter-type').active}
                  highlighted={isHighlighted('filter-type')}
                  onClick={() => onButtonClick?.('filter-type')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '67.1%',
            top: '18.7%',
            width: '2.6%',
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
            left: '69.8%',
            top: '19.9%',
            width: 31,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="param"
                  label=""
                  size="sm"
                  active={getState('param').active}
                  highlighted={isHighlighted('param')}
                  onClick={() => onButtonClick?.('param')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '69.8%',
            top: '18.7%',
            width: '2.6%',
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
            left: '64.4%',
            top: '26.6%',
            width: 31,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="amp"
                  label=""
                  size="sm"
                  active={getState('amp').active}
                  highlighted={isHighlighted('amp')}
                  onClick={() => onButtonClick?.('amp')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '64.4%',
            top: '25.4%',
            width: '2.6%',
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
            left: '67.1%',
            top: '26.6%',
            width: 31,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="fx"
                  label=""
                  size="sm"
                  active={getState('fx').active}
                  highlighted={isHighlighted('fx')}
                  onClick={() => onButtonClick?.('fx')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '67.1%',
            top: '25.4%',
            width: '2.6%',
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
            left: '69.8%',
            top: '26.6%',
            width: 31,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="lfo"
                  label=""
                  size="sm"
                  active={getState('lfo').active}
                  highlighted={isHighlighted('lfo')}
                  onClick={() => onButtonClick?.('lfo')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '69.8%',
            top: '25.4%',
            width: '2.6%',
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
            left: '75.0%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="pattern"
                  label=""
                  size="lg"
                  active={getState('pattern').active}
                  highlighted={isHighlighted('pattern')}
                  onClick={() => onButtonClick?.('pattern')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '75.0%',
            top: '5.5%',
            width: '2.3%',
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
            left: '75.0%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="group"
                  label=""
                  size="lg"
                  active={getState('group').active}
                  highlighted={isHighlighted('group')}
                  onClick={() => onButtonClick?.('group')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '75.0%',
            top: '5.5%',
            width: '2.3%',
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
            left: '77.9%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="song"
                  label=""
                  size="lg"
                  active={getState('song').active}
                  highlighted={isHighlighted('song')}
                  onClick={() => onButtonClick?.('song')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.9%',
            top: '5.5%',
            width: '2.3%',
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
            left: '77.9%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tr-rec"
                  label=""
                  size="lg"
                  active={getState('tr-rec').active}
                  highlighted={isHighlighted('tr-rec')}
                  onClick={() => onButtonClick?.('tr-rec')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.9%',
            top: '5.5%',
            width: '2.3%',
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
            left: '79.8%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="rhythm-ptn"
                  label=""
                  size="lg"
                  active={getState('rhythm-ptn').active}
                  highlighted={isHighlighted('rhythm-ptn')}
                  onClick={() => onButtonClick?.('rhythm-ptn')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '79.8%',
            top: '5.5%',
            width: '2.3%',
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
            left: '82.6%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="stop"
                  label=""
                  size="lg"
                  active={getState('stop').active}
                  highlighted={isHighlighted('stop')}
                  onClick={() => onButtonClick?.('stop')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '82.6%',
            top: '5.5%',
            width: '2.3%',
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
            left: '83.9%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="play"
                  label=""
                  size="lg"
                  active={getState('play').active}
                  highlighted={isHighlighted('play')}
                  onClick={() => onButtonClick?.('play')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '83.9%',
            top: '5.5%',
            width: '2.3%',
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
            left: '85.4%',
            top: '6.7%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="rec"
                  label=""
                  size="lg"
                  active={getState('rec').active}
                  highlighted={isHighlighted('rec')}
                  onClick={() => onButtonClick?.('rec')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '85.4%',
            top: '5.5%',
            width: '2.3%',
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
            left: '74.2%',
            top: '28.8%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-1"
                  label=""
                  size="sm"
                  active={getState('tone-cat-1').active}
                  highlighted={isHighlighted('tone-cat-1')}
                  onClick={() => onButtonClick?.('tone-cat-1')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '74.2%',
            top: '27.6%',
            width: '2.8%',
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
            left: '77.3%',
            top: '28.8%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-2"
                  label=""
                  size="sm"
                  active={getState('tone-cat-2').active}
                  highlighted={isHighlighted('tone-cat-2')}
                  onClick={() => onButtonClick?.('tone-cat-2')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.3%',
            top: '27.6%',
            width: '2.8%',
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
            left: '79.5%',
            top: '28.8%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-3"
                  label=""
                  size="sm"
                  active={getState('tone-cat-3').active}
                  highlighted={isHighlighted('tone-cat-3')}
                  onClick={() => onButtonClick?.('tone-cat-3')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '79.5%',
            top: '27.6%',
            width: '2.8%',
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
            left: '83.8%',
            top: '28.8%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-4"
                  label=""
                  size="sm"
                  active={getState('tone-cat-4').active}
                  highlighted={isHighlighted('tone-cat-4')}
                  onClick={() => onButtonClick?.('tone-cat-4')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '83.8%',
            top: '27.6%',
            width: '2.8%',
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
            left: '74.2%',
            top: '34.3%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-5"
                  label=""
                  size="sm"
                  active={getState('tone-cat-5').active}
                  highlighted={isHighlighted('tone-cat-5')}
                  onClick={() => onButtonClick?.('tone-cat-5')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '74.2%',
            top: '33.1%',
            width: '2.8%',
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
            left: '77.3%',
            top: '34.3%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-6"
                  label=""
                  size="sm"
                  active={getState('tone-cat-6').active}
                  highlighted={isHighlighted('tone-cat-6')}
                  onClick={() => onButtonClick?.('tone-cat-6')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.3%',
            top: '33.1%',
            width: '2.8%',
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
            left: '79.5%',
            top: '34.3%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-7"
                  label=""
                  size="sm"
                  active={getState('tone-cat-7').active}
                  highlighted={isHighlighted('tone-cat-7')}
                  onClick={() => onButtonClick?.('tone-cat-7')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '79.5%',
            top: '33.1%',
            width: '2.8%',
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
            left: '83.8%',
            top: '34.3%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-8"
                  label=""
                  size="sm"
                  active={getState('tone-cat-8').active}
                  highlighted={isHighlighted('tone-cat-8')}
                  onClick={() => onButtonClick?.('tone-cat-8')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '83.8%',
            top: '33.1%',
            width: '2.8%',
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
            left: '74.2%',
            top: '39.9%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-9"
                  label=""
                  size="sm"
                  active={getState('tone-cat-9').active}
                  highlighted={isHighlighted('tone-cat-9')}
                  onClick={() => onButtonClick?.('tone-cat-9')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '74.2%',
            top: '38.7%',
            width: '2.8%',
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
            left: '77.3%',
            top: '39.9%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-10"
                  label=""
                  size="sm"
                  active={getState('tone-cat-10').active}
                  highlighted={isHighlighted('tone-cat-10')}
                  onClick={() => onButtonClick?.('tone-cat-10')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.3%',
            top: '38.7%',
            width: '2.8%',
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
            left: '79.5%',
            top: '39.9%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-11"
                  label=""
                  size="sm"
                  active={getState('tone-cat-11').active}
                  highlighted={isHighlighted('tone-cat-11')}
                  onClick={() => onButtonClick?.('tone-cat-11')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '79.5%',
            top: '38.7%',
            width: '2.8%',
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
            left: '83.8%',
            top: '39.9%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-12"
                  label=""
                  size="sm"
                  active={getState('tone-cat-12').active}
                  highlighted={isHighlighted('tone-cat-12')}
                  onClick={() => onButtonClick?.('tone-cat-12')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '83.8%',
            top: '38.7%',
            width: '2.8%',
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
            left: '74.2%',
            top: '45.4%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-13"
                  label=""
                  size="sm"
                  active={getState('tone-cat-13').active}
                  highlighted={isHighlighted('tone-cat-13')}
                  onClick={() => onButtonClick?.('tone-cat-13')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '74.2%',
            top: '44.2%',
            width: '2.8%',
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
            left: '77.3%',
            top: '45.4%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-14"
                  label=""
                  size="sm"
                  active={getState('tone-cat-14').active}
                  highlighted={isHighlighted('tone-cat-14')}
                  onClick={() => onButtonClick?.('tone-cat-14')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.3%',
            top: '44.2%',
            width: '2.8%',
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
            left: '79.5%',
            top: '45.4%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-15"
                  label=""
                  size="sm"
                  active={getState('tone-cat-15').active}
                  highlighted={isHighlighted('tone-cat-15')}
                  onClick={() => onButtonClick?.('tone-cat-15')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '79.5%',
            top: '44.2%',
            width: '2.8%',
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
            left: '83.8%',
            top: '45.4%',
            width: 34,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="tone-cat-16"
                  label=""
                  size="sm"
                  active={getState('tone-cat-16').active}
                  highlighted={isHighlighted('tone-cat-16')}
                  onClick={() => onButtonClick?.('tone-cat-16')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '83.8%',
            top: '44.2%',
            width: '2.8%',
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
            left: '88.2%',
            top: '6.7%',
            width: 28,
            height: 54,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="sampling"
                  label=""
                  size="lg"
                  active={getState('sampling').active}
                  highlighted={isHighlighted('sampling')}
                  onClick={() => onButtonClick?.('sampling')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '88.2%',
            top: '5.5%',
            width: '2.3%',
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
            left: '90.8%',
            top: '6.6%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="pad-mode"
                  label=""
                  size="lg"
                  active={getState('pad-mode').active}
                  highlighted={isHighlighted('pad-mode')}
                  onClick={() => onButtonClick?.('pad-mode')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '90.8%',
            top: '5.4%',
            width: '2.3%',
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
            left: '92.4%',
            top: '6.6%',
            width: 28,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="clip-board"
                  label=""
                  size="lg"
                  active={getState('clip-board').active}
                  highlighted={isHighlighted('clip-board')}
                  onClick={() => onButtonClick?.('clip-board')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '92.4%',
            top: '5.4%',
            width: '2.3%',
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
            left: '93.8%',
            top: '6.6%',
            width: 30,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="bank"
                  label=""
                  size="lg"
                  active={getState('bank').active}
                  highlighted={isHighlighted('bank')}
                  onClick={() => onButtonClick?.('bank')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '93.8%',
            top: '5.4%',
            width: '2.5%',
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
            left: '96.6%',
            top: '6.6%',
            width: 30,
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PanelButton
                  id="hold"
                  label=""
                  size="lg"
                  active={getState('hold').active}
                  highlighted={isHighlighted('hold')}
                  onClick={() => onButtonClick?.('hold')}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '96.6%',
            top: '5.4%',
            width: '2.5%',
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
            left: '88.2%',
            top: '28.8%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-1"
                  label=""
                  active={getState('pad-1').active}
                  highlighted={isHighlighted('pad-1')}
                  onClick={() => onButtonClick?.('pad-1')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '88.2%',
            top: '27.6%',
            width: '2.5%',
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
            left: '91.0%',
            top: '28.8%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-2"
                  label=""
                  active={getState('pad-2').active}
                  highlighted={isHighlighted('pad-2')}
                  onClick={() => onButtonClick?.('pad-2')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '91.0%',
            top: '27.6%',
            width: '2.5%',
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
            left: '93.8%',
            top: '28.8%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-3"
                  label=""
                  active={getState('pad-3').active}
                  highlighted={isHighlighted('pad-3')}
                  onClick={() => onButtonClick?.('pad-3')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '93.8%',
            top: '27.6%',
            width: '2.5%',
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
            left: '96.6%',
            top: '28.8%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-4"
                  label=""
                  active={getState('pad-4').active}
                  highlighted={isHighlighted('pad-4')}
                  onClick={() => onButtonClick?.('pad-4')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '96.6%',
            top: '27.6%',
            width: '2.5%',
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
            left: '88.2%',
            top: '34.3%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-5"
                  label=""
                  active={getState('pad-5').active}
                  highlighted={isHighlighted('pad-5')}
                  onClick={() => onButtonClick?.('pad-5')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '88.2%',
            top: '33.1%',
            width: '2.5%',
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
            left: '91.0%',
            top: '34.3%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-6"
                  label=""
                  active={getState('pad-6').active}
                  highlighted={isHighlighted('pad-6')}
                  onClick={() => onButtonClick?.('pad-6')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '91.0%',
            top: '33.1%',
            width: '2.5%',
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
            left: '93.8%',
            top: '34.3%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-7"
                  label=""
                  active={getState('pad-7').active}
                  highlighted={isHighlighted('pad-7')}
                  onClick={() => onButtonClick?.('pad-7')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '93.8%',
            top: '33.1%',
            width: '2.5%',
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
            left: '96.6%',
            top: '34.3%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-8"
                  label=""
                  active={getState('pad-8').active}
                  highlighted={isHighlighted('pad-8')}
                  onClick={() => onButtonClick?.('pad-8')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '96.6%',
            top: '33.1%',
            width: '2.5%',
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
            left: '88.2%',
            top: '39.9%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-9"
                  label=""
                  active={getState('pad-9').active}
                  highlighted={isHighlighted('pad-9')}
                  onClick={() => onButtonClick?.('pad-9')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '88.2%',
            top: '38.7%',
            width: '2.5%',
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
            left: '91.0%',
            top: '39.9%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-10"
                  label=""
                  active={getState('pad-10').active}
                  highlighted={isHighlighted('pad-10')}
                  onClick={() => onButtonClick?.('pad-10')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '91.0%',
            top: '38.7%',
            width: '2.5%',
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
            left: '93.8%',
            top: '39.9%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-11"
                  label=""
                  active={getState('pad-11').active}
                  highlighted={isHighlighted('pad-11')}
                  onClick={() => onButtonClick?.('pad-11')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '93.8%',
            top: '38.7%',
            width: '2.5%',
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
            left: '96.6%',
            top: '39.9%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-12"
                  label=""
                  active={getState('pad-12').active}
                  highlighted={isHighlighted('pad-12')}
                  onClick={() => onButtonClick?.('pad-12')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '96.6%',
            top: '38.7%',
            width: '2.5%',
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
            left: '88.2%',
            top: '45.4%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-13"
                  label=""
                  active={getState('pad-13').active}
                  highlighted={isHighlighted('pad-13')}
                  onClick={() => onButtonClick?.('pad-13')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '88.2%',
            top: '44.2%',
            width: '2.5%',
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
            left: '91.0%',
            top: '45.4%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-14"
                  label=""
                  active={getState('pad-14').active}
                  highlighted={isHighlighted('pad-14')}
                  onClick={() => onButtonClick?.('pad-14')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '91.0%',
            top: '44.2%',
            width: '2.5%',
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
            left: '93.8%',
            top: '45.4%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-15"
                  label=""
                  active={getState('pad-15').active}
                  highlighted={isHighlighted('pad-15')}
                  onClick={() => onButtonClick?.('pad-15')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '93.8%',
            top: '44.2%',
            width: '2.5%',
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
            left: '96.6%',
            top: '45.4%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: 'scale(0.4)',
            transformOrigin: 'center',
          }}
        >

              <div>
                <PadButton
                  id="pad-16"
                  label=""
                  active={getState('pad-16').active}
                  highlighted={isHighlighted('pad-16')}
                  onClick={() => onButtonClick?.('pad-16')}
                  width={30}
                  height={28}
                />
              </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '96.6%',
            top: '44.2%',
            width: '2.5%',
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
