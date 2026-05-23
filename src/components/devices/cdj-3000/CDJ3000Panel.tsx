'use client';

import { motion } from 'framer-motion';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import JogDisplay from '@/components/controls/JogDisplay';
import Knob from '@/components/controls/Knob';
import LEDIndicator from '@/components/controls/LEDIndicator';
import PadButton from '@/components/controls/PadButton';
import PanelButton from '@/components/controls/PanelButton';
import PanelShell from '@/components/controls/PanelShell';
import Port from '@/components/controls/Port';
import SectionContainer from '@/components/controls/SectionContainer';
import Slider from '@/components/controls/Slider';
import TouchDisplay from '@/components/controls/TouchDisplay';
import ValueDial from '@/components/controls/ValueDial';
import Wheel from '@/components/controls/Wheel';
import { PanelState } from '@/types/panel';
import { CDJ3000_PANEL } from '@/lib/devices/cdj-3000-constants';

interface CDJ3000PanelProps {
  panelState: PanelState;
  displayState?: any;
  highlightedControls: string[];
  zones?: any[];
  onButtonClick?: (id: string) => void;
}

export default function CDJ3000Panel({
  panelState,
  highlightedControls,
  onButtonClick,
}: CDJ3000PanelProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <PanelShell
      manufacturer={CDJ3000_PANEL.manufacturer}
      deviceName={CDJ3000_PANEL.deviceName}
      width={CDJ3000_PANEL.width}
      height={CDJ3000_PANEL.height}
      keyboard={null}
    >
        {/* Section backgrounds — decorative only */}
        {/* Navigation Bar background */}
        <SectionContainer id="BROWSE" x={10.6} y={1.5} w={78.4} h={4.8} headerLabel="Navigation Bar" />

        {/* USB/SD Media Ports background */}
        <SectionContainer id="MEDIA" x={2.3} y={7.5} w={12.8} h={15} headerLabel="USB/SD Media Ports" />

        {/* 9-inch Touch Display background */}
        <SectionContainer id="DISPLAY" x={19} y={7.1} w={61.3} h={26.2} headerLabel="9-inch Touch Display" />

        {/* Browse Selector background */}
        <SectionContainer id="SELECTOR" x={78.2} y={10.5} w={22.8} h={18.7} headerLabel="Browse Selector" />

        {/* Performance Pads & Mode Buttons background */}
        <SectionContainer id="HOT_CUE" x={0} y={23.9} w={85.2} h={14.5} headerLabel="Performance Pads &amp; Mode Buttons" />

        {/* Jog Wheel Settings background */}
        <SectionContainer id="JOG_CONTROLS" x={69.8} y={40.5} w={29.2} h={10.2} headerLabel="Jog Wheel Settings" />

        {/* Loop Controls background */}
        <SectionContainer id="LOOP" x={-0.8} y={40.3} w={30.1} h={9.9} headerLabel="Loop Controls" />

        {/* Cue/Loop Memory Controls background */}
        <SectionContainer id="CUE_MEMORY" x={58.9} y={34.6} w={36.5} h={9.6} headerLabel="Cue/Loop Memory Controls" />

        {/* Beat Sync Controls background */}
        <SectionContainer id="SYNC" x={86.5} y={47.1} w={11.8} h={7.9} headerLabel="Beat Sync Controls" />

        {/* Transport Controls background */}
        <SectionContainer id="TRANSPORT" x={0.6} y={50.4} w={15.6} h={47.7} headerLabel="Transport Controls" />

        {/* Jog Wheel background */}
        <SectionContainer id="JOG_WHEEL" x={16.9} y={46.1} w={68.7} h={43.6} headerLabel="Jog Wheel" />

        {/* Tempo Controls background */}
        <SectionContainer id="TEMPO" x={79.9} y={58.3} w={21.3} h={37.6} headerLabel="Tempo Controls" />

        {/* All controls — panel-level percentage positioning */}
        {/* SOURCE */}
        <div
          className="absolute"
          style={{
            left: '11.2%',
            top: '2.0%',
            width: 256,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="SOURCE"
              label="SOURCE"
              variant="flat-key"
              size="lg"
              active={getState('SOURCE').active}
              highlighted={isHighlighted('SOURCE')}
              onClick={() => onButtonClick?.('SOURCE')}
            />
          </div>
        </div>

        {/* BROWSE_BTN */}
        <div
          className="absolute"
          style={{
            left: '22.3%',
            top: '2.0%',
            width: 256,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="BROWSE_BTN"
              label="BROWSE"
              variant="flat-key"
              size="lg"
              active={getState('BROWSE_BTN').active}
              highlighted={isHighlighted('BROWSE_BTN')}
              onClick={() => onButtonClick?.('BROWSE_BTN')}
            />
          </div>
        </div>

        {/* TAG_LIST */}
        <div
          className="absolute"
          style={{
            left: '44.6%',
            top: '2.0%',
            width: 256,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TAG_LIST"
              label="TAG LIST"
              variant="flat-key"
              size="lg"
              active={getState('TAG_LIST').active}
              highlighted={isHighlighted('TAG_LIST')}
              onClick={() => onButtonClick?.('TAG_LIST')}
            />
          </div>
        </div>

        {/* SOURCE_INDICATOR */}
        <div
          className="absolute"
          style={{
            left: '48.5%',
            top: '2.0%',
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LEDIndicator
            id="SOURCE_INDICATOR"
            on={getState('SOURCE_INDICATOR').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('SOURCE_INDICATOR')}
          />
        </div>

        {/* PLAYLIST */}
        <div
          className="absolute"
          style={{
            left: '34.7%',
            top: '2.0%',
            width: 256,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="PLAYLIST"
              label="PLAYLIST"
              variant="flat-key"
              size="lg"
              active={getState('PLAYLIST').active}
              highlighted={isHighlighted('PLAYLIST')}
              onClick={() => onButtonClick?.('PLAYLIST')}
            />
          </div>
        </div>

        {/* SEARCH_BTN */}
        <div
          className="absolute"
          style={{
            left: '55.6%',
            top: '2.0%',
            width: 256,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="SEARCH_BTN"
              label="SEARCH"
              variant="flat-key"
              size="lg"
              active={getState('SEARCH_BTN').active}
              highlighted={isHighlighted('SEARCH_BTN')}
              onClick={() => onButtonClick?.('SEARCH_BTN')}
            />
          </div>
        </div>

        {/* MENU_UTILITY */}
        <div
          className="absolute"
          style={{
            left: '67.0%',
            top: '2.0%',
            width: 256,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="MENU_UTILITY"
              label="MENU/UTILITY"
              variant="flat-key"
              size="lg"
              active={getState('MENU_UTILITY').active}
              highlighted={isHighlighted('MENU_UTILITY')}
              onClick={() => onButtonClick?.('MENU_UTILITY')}
            />
          </div>
        </div>

        {/* USB_PORT */}
        <div
          className="absolute"
          style={{
            left: '2.9%',
            top: '8.0%',
            width: 73,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Port
            id="USB_PORT"
            label=""
            variant="usb-a"
            highlighted={isHighlighted('USB_PORT')}
            width={73}
            height={56}
          />
        </div>

        {/* USB_INDICATOR */}
        <div
          className="absolute"
          style={{
            left: '10.2%',
            top: '8.0%',
            width: 28,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LEDIndicator
            id="USB_INDICATOR"
            on={getState('USB_INDICATOR').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('USB_INDICATOR')}
          />
        </div>

        {/* USB_STOP */}
        <div
          className="absolute"
          style={{
            left: '8.4%',
            top: '11.8%',
            width: 72,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="USB_STOP"
              label=""
              variant="transport"
              size="md"
              active={getState('USB_STOP').active}
              highlighted={isHighlighted('USB_STOP')}
              onClick={() => onButtonClick?.('USB_STOP')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '8.4%',
            top: '10.6%',
            width: '6.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            USB STOP
          </span>
        </div>

        {/* SD_INDICATOR */}
        <div
          className="absolute"
          style={{
            left: '4.5%',
            top: '18.7%',
            width: 100,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LEDIndicator
            id="SD_INDICATOR"
            on={getState('SD_INDICATOR').ledOn ?? false}
            color="#f59e0b"
            highlighted={isHighlighted('SD_INDICATOR')}
          />
        </div>

        {/* SD_SLOT */}
        <div
          className="absolute"
          style={{
            left: '4.5%',
            top: '16.1%',
            width: 100,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Port
            id="SD_SLOT"
            label=""
            variant="sd-card"
            highlighted={isHighlighted('SD_SLOT')}
            width={100}
            height={56}
          />
        </div>

        {/* TOUCH_DISPLAY */}
        <div
          className="absolute"
          style={{
            left: '19.7%',
            top: '7.6%',
            width: 720,
            height: 416,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TouchDisplay
            id="TOUCH_DISPLAY"
            label=""
            variant="main"
            showMockContent
            width={720}
            height={416}
            highlighted={isHighlighted('TOUCH_DISPLAY')}
          />
        </div>

        {/* BACK */}
        <div
          className="absolute"
          style={{
            left: '78.9%',
            top: '11.0%',
            width: 152,
            height: 73,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="BACK"
              label="BACK"
              variant="standard"
              size="lg"
              active={getState('BACK').active}
              highlighted={isHighlighted('BACK')}
              onClick={() => onButtonClick?.('BACK')}
            />
          </div>
        </div>

        {/* TAG_TRACK_REMOVE */}
        <div
          className="absolute"
          style={{
            left: '87.7%',
            top: '11.0%',
            width: 152,
            height: 73,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TAG_TRACK_REMOVE"
              label="TAG TRACK/REMOVE"
              variant="standard"
              size="lg"
              active={getState('TAG_TRACK_REMOVE').active}
              highlighted={isHighlighted('TAG_TRACK_REMOVE')}
              onClick={() => onButtonClick?.('TAG_TRACK_REMOVE')}
            />
          </div>
        </div>

        {/* ROTARY_SELECTOR */}
        <div
          className="absolute"
          style={{
            left: '83.7%',
            top: '13.9%',
            width: 144,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ValueDial
            id="ROTARY_SELECTOR"
            label=""
            outerSize={144}
            highlighted={isHighlighted('ROTARY_SELECTOR')}
          />
        </div>

        {/* SLIP */}
        <div
          className="absolute"
          style={{
            left: '0.6%',
            top: '28.3%',
            width: 100,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="SLIP"
              label=""
              variant="rubber"
              size="md"
              hasLed
              ledColor="#3b82f6"
              active={getState('SLIP').active}
              highlighted={isHighlighted('SLIP')}
              onClick={() => onButtonClick?.('SLIP')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '0.6%',
            top: '27.1%',
            width: '8.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            SLIP
          </span>
        </div>

        {/* QUANTIZE */}
        <div
          className="absolute"
          style={{
            left: '6.5%',
            top: '28.3%',
            width: 100,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="QUANTIZE"
              label=""
              variant="rubber"
              size="md"
              hasLed
              ledColor="#ef4444"
              active={getState('QUANTIZE').active}
              highlighted={isHighlighted('QUANTIZE')}
              onClick={() => onButtonClick?.('QUANTIZE')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '6.5%',
            top: '27.1%',
            width: '8.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            QUANTIZE
          </span>
        </div>

        {/* TIME_MODE_AUTO_CUE */}
        <div
          className="absolute"
          style={{
            left: '3.6%',
            top: '24.4%',
            width: 100,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TIME_MODE_AUTO_CUE"
              label=""
              variant="transport"
              size="md"
              hasLed
              ledColor="#22c55e"
              ledOn={getState('TIME_MODE_AUTO_CUE').active}
              active={getState('TIME_MODE_AUTO_CUE').active}
              highlighted={isHighlighted('TIME_MODE_AUTO_CUE')}
              onClick={() => onButtonClick?.('TIME_MODE_AUTO_CUE')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '3.6%',
            top: '23.2%',
            width: '8.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            TIME MODE/AUTO CUE
          </span>
          <span className="text-gray-500 uppercase block" style={{ fontSize: 7 }}>
            AUTO CUE
          </span>
        </div>

        {/* HOT_CUE_A */}
        <div
          className="absolute"
          style={{
            left: '15.1%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_A"
              label=""
              active={getState('HOT_CUE_A').active}
              highlighted={isHighlighted('HOT_CUE_A')}
              onClick={() => onButtonClick?.('HOT_CUE_A')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '15.1%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE A
          </span>
        </div>

        {/* HOT_CUE_B */}
        <div
          className="absolute"
          style={{
            left: '23.8%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_B"
              label=""
              active={getState('HOT_CUE_B').active}
              highlighted={isHighlighted('HOT_CUE_B')}
              onClick={() => onButtonClick?.('HOT_CUE_B')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '23.8%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE B
          </span>
        </div>

        {/* HOT_CUE_C */}
        <div
          className="absolute"
          style={{
            left: '32.5%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_C"
              label=""
              active={getState('HOT_CUE_C').active}
              highlighted={isHighlighted('HOT_CUE_C')}
              onClick={() => onButtonClick?.('HOT_CUE_C')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '32.5%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE C
          </span>
        </div>

        {/* HOT_CUE_D */}
        <div
          className="absolute"
          style={{
            left: '41.1%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_D"
              label=""
              active={getState('HOT_CUE_D').active}
              highlighted={isHighlighted('HOT_CUE_D')}
              onClick={() => onButtonClick?.('HOT_CUE_D')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '41.1%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE D
          </span>
        </div>

        {/* HOT_CUE_E */}
        <div
          className="absolute"
          style={{
            left: '50.9%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_E"
              label=""
              active={getState('HOT_CUE_E').active}
              highlighted={isHighlighted('HOT_CUE_E')}
              onClick={() => onButtonClick?.('HOT_CUE_E')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50.9%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE E
          </span>
        </div>

        {/* HOT_CUE_F */}
        <div
          className="absolute"
          style={{
            left: '59.6%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_F"
              label=""
              active={getState('HOT_CUE_F').active}
              highlighted={isHighlighted('HOT_CUE_F')}
              onClick={() => onButtonClick?.('HOT_CUE_F')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '59.6%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE F
          </span>
        </div>

        {/* HOT_CUE_G */}
        <div
          className="absolute"
          style={{
            left: '68.6%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_G"
              label=""
              active={getState('HOT_CUE_G').active}
              highlighted={isHighlighted('HOT_CUE_G')}
              onClick={() => onButtonClick?.('HOT_CUE_G')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '68.6%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE G
          </span>
        </div>

        {/* HOT_CUE_H */}
        <div
          className="absolute"
          style={{
            left: '77.1%',
            top: '35.0%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PadButton
              id="HOT_CUE_H"
              label=""
              active={getState('HOT_CUE_H').active}
              highlighted={isHighlighted('HOT_CUE_H')}
              onClick={() => onButtonClick?.('HOT_CUE_H')}
              width={88}
              height={48}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.1%',
            top: '38.1%',
            width: '7.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            HOT CUE H
          </span>
        </div>

        {/* TRACK_FILTER_EDIT */}
        <div
          className="absolute"
          style={{
            left: '80.5%',
            top: '24.4%',
            width: 152,
            height: 73,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TRACK_FILTER_EDIT"
              label="TRACK FILTER/EDIT"
              variant="standard"
              size="lg"
              active={getState('TRACK_FILTER_EDIT').active}
              highlighted={isHighlighted('TRACK_FILTER_EDIT')}
              onClick={() => onButtonClick?.('TRACK_FILTER_EDIT')}
            />
          </div>
        </div>

        {/* SHORTCUT */}
        <div
          className="absolute"
          style={{
            left: '87.7%',
            top: '24.4%',
            width: 152,
            height: 73,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="SHORTCUT"
              label="SHORTCUT"
              variant="standard"
              size="lg"
              active={getState('SHORTCUT').active}
              highlighted={isHighlighted('SHORTCUT')}
              onClick={() => onButtonClick?.('SHORTCUT')}
            />
          </div>
        </div>

        {/* VINYL_SPEED_ADJ */}
        <div
          className="absolute"
          style={{
            left: '89.5%',
            top: '35.1%',
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Knob
            id="VINYL_SPEED_ADJ"
            label=""
            value={getState('VINYL_SPEED_ADJ').value ?? 64}
            highlighted={isHighlighted('VINYL_SPEED_ADJ')}
            outerSize={64}
            innerSize={45}
          />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '89.5%',
            top: '33.9%',
            width: '5.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            VINYL SPEED ADJ. TOUCH/BRAKE
          </span>
          <span className="text-gray-500 uppercase block" style={{ fontSize: 7 }}>
            TOUCH/BRAKE
          </span>
        </div>

        {/* JOG_MODE */}
        <div
          className="absolute"
          style={{
            left: '91.7%',
            top: '41.0%',
            width: 80,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="JOG_MODE"
              label=""
              variant="standard"
              size="md"
              active={getState('JOG_MODE').active}
              highlighted={isHighlighted('JOG_MODE')}
              onClick={() => onButtonClick?.('JOG_MODE')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '91.7%',
            top: '39.8%',
            width: '6.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            JOG MODE
          </span>
        </div>

        {/* VINYL_CDJ_INDICATOR */}
        <div
          className="absolute"
          style={{
            left: '84.8%',
            top: '41.0%',
            width: 80,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LEDIndicator
            id="VINYL_CDJ_INDICATOR"
            on={getState('VINYL_CDJ_INDICATOR').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('VINYL_CDJ_INDICATOR')}
          />
        </div>

        {/* JOG_ADJUST */}
        <div
          className="absolute"
          style={{
            left: '70.4%',
            top: '47.4%',
            width: 176,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Knob
            id="JOG_ADJUST"
            label=""
            value={getState('JOG_ADJUST').value ?? 64}
            highlighted={isHighlighted('JOG_ADJUST')}
            outerSize={48}
            innerSize={34}
          />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '70.4%',
            top: '46.2%',
            width: '14.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            JOG ADJUST
          </span>
        </div>

        {/* LOOP_IN_CUE */}
        <div
          className="absolute"
          style={{
            left: '-0.1%',
            top: '40.8%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="LOOP_IN_CUE"
              label=""
              variant="transport"
              size="md"
              hasLed
              ledColor="#22c55e"
              ledOn={getState('LOOP_IN_CUE').active}
              active={getState('LOOP_IN_CUE').active}
              highlighted={isHighlighted('LOOP_IN_CUE')}
              onClick={() => onButtonClick?.('LOOP_IN_CUE')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '-0.1%',
            top: '39.6%',
            width: '12.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            IN/CUE
          </span>
          <span className="text-gray-500 uppercase block" style={{ fontSize: 7 }}>
            IN ADJUST
          </span>
        </div>

        {/* LOOP_OUT */}
        <div
          className="absolute"
          style={{
            left: '8.2%',
            top: '40.8%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="LOOP_OUT"
              label=""
              variant="transport"
              size="md"
              hasLed
              ledColor="#22c55e"
              ledOn={getState('LOOP_OUT').active}
              active={getState('LOOP_OUT').active}
              highlighted={isHighlighted('LOOP_OUT')}
              onClick={() => onButtonClick?.('LOOP_OUT')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '8.2%',
            top: '39.6%',
            width: '12.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            OUT
          </span>
          <span className="text-gray-500 uppercase block" style={{ fontSize: 7 }}>
            OUT ADJUST
          </span>
        </div>

        {/* RELOOP_EXIT */}
        <div
          className="absolute"
          style={{
            left: '16.6%',
            top: '40.8%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="RELOOP_EXIT"
              label=""
              variant="transport"
              size="md"
              hasLed
              ledColor="#22c55e"
              ledOn={getState('RELOOP_EXIT').active}
              active={getState('RELOOP_EXIT').active}
              highlighted={isHighlighted('RELOOP_EXIT')}
              onClick={() => onButtonClick?.('RELOOP_EXIT')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '16.6%',
            top: '39.6%',
            width: '12.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            LOOP RELOOP/EXIT
          </span>
        </div>

        {/* FOUR_BEAT_LOOP */}
        <div
          className="absolute"
          style={{
            left: '-0.1%',
            top: '46.9%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="FOUR_BEAT_LOOP"
              label=""
              variant="transport"
              size="md"
              hasLed
              ledColor="#22c55e"
              ledOn={getState('FOUR_BEAT_LOOP').active}
              active={getState('FOUR_BEAT_LOOP').active}
              highlighted={isHighlighted('FOUR_BEAT_LOOP')}
              onClick={() => onButtonClick?.('FOUR_BEAT_LOOP')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '-0.1%',
            top: '45.7%',
            width: '12.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            4 BEAT LOOP (1/2X)
          </span>
          <span className="text-gray-500 uppercase block" style={{ fontSize: 7 }}>
            1/2X
          </span>
        </div>

        {/* EIGHT_BEAT_LOOP */}
        <div
          className="absolute"
          style={{
            left: '8.2%',
            top: '46.9%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="EIGHT_BEAT_LOOP"
              label=""
              variant="transport"
              size="md"
              hasLed
              ledColor="#22c55e"
              ledOn={getState('EIGHT_BEAT_LOOP').active}
              active={getState('EIGHT_BEAT_LOOP').active}
              highlighted={isHighlighted('EIGHT_BEAT_LOOP')}
              onClick={() => onButtonClick?.('EIGHT_BEAT_LOOP')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '8.2%',
            top: '45.7%',
            width: '12.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            8 BEAT LOOP (2X)
          </span>
          <span className="text-gray-500 uppercase block" style={{ fontSize: 7 }}>
            2X
          </span>
        </div>

        {/* CUE_LOOP_CALL_BACK */}
        <div
          className="absolute"
          style={{
            left: '59.6%',
            top: '41.2%',
            width: 106,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="CUE_LOOP_CALL_BACK"
              label="CUE/LOOP CALL ◄"
              variant="transport"
              size="md"
              iconContent="◀"
              active={getState('CUE_LOOP_CALL_BACK').active}
              highlighted={isHighlighted('CUE_LOOP_CALL_BACK')}
              onClick={() => onButtonClick?.('CUE_LOOP_CALL_BACK')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '59.6%',
            top: '40.0%',
            width: '8.8%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CUE/LOOP CALL ◄
          </span>
        </div>

        {/* CUE_LOOP_CALL_FWD */}
        <div
          className="absolute"
          style={{
            left: '64.8%',
            top: '41.2%',
            width: 106,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="CUE_LOOP_CALL_FWD"
              label="CUE/LOOP CALL ►"
              variant="transport"
              size="md"
              iconContent="▶"
              active={getState('CUE_LOOP_CALL_FWD').active}
              highlighted={isHighlighted('CUE_LOOP_CALL_FWD')}
              onClick={() => onButtonClick?.('CUE_LOOP_CALL_FWD')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '64.8%',
            top: '40.0%',
            width: '8.8%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            CUE/LOOP CALL ►
          </span>
        </div>

        {/* DELETE */}
        <div
          className="absolute"
          style={{
            left: '71.3%',
            top: '41.2%',
            width: 106,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="DELETE"
              label=""
              variant="transport"
              size="md"
              active={getState('DELETE').active}
              highlighted={isHighlighted('DELETE')}
              onClick={() => onButtonClick?.('DELETE')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '71.3%',
            top: '40.0%',
            width: '8.8%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            DELETE
          </span>
        </div>

        {/* MEMORY */}
        <div
          className="absolute"
          style={{
            left: '77.1%',
            top: '41.2%',
            width: 106,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="MEMORY"
              label=""
              variant="transport"
              size="md"
              active={getState('MEMORY').active}
              highlighted={isHighlighted('MEMORY')}
              onClick={() => onButtonClick?.('MEMORY')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '77.1%',
            top: '40.0%',
            width: '8.8%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MEMORY
          </span>
        </div>

        {/* MASTER */}
        <div
          className="absolute"
          style={{
            left: '92.3%',
            top: '47.6%',
            width: 64,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="MASTER"
              label="MASTER"
              variant="standard"
              size="lg"
              hasLed
              ledColor="#22c55e"
              active={getState('MASTER').active}
              highlighted={isHighlighted('MASTER')}
              onClick={() => onButtonClick?.('MASTER')}
            />
          </div>
        </div>

        {/* KEY_SYNC */}
        <div
          className="absolute"
          style={{
            left: '89.7%',
            top: '51.1%',
            width: 64,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="KEY_SYNC"
              label="KEY SYNC"
              variant="standard"
              size="lg"
              surfaceColor="#ec4899"
              hasLed
              ledColor="#ec4899"
              active={getState('KEY_SYNC').active}
              highlighted={isHighlighted('KEY_SYNC')}
              onClick={() => onButtonClick?.('KEY_SYNC')}
            />
          </div>
        </div>

        {/* BEAT_SYNC_INST_DOUBLES */}
        <div
          className="absolute"
          style={{
            left: '87.1%',
            top: '47.6%',
            width: 64,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="BEAT_SYNC_INST_DOUBLES"
              label="Beat Sync"
              variant="standard"
              size="lg"
              hasLed
              ledColor="#3b82f6"
              active={getState('BEAT_SYNC_INST_DOUBLES').active}
              highlighted={isHighlighted('BEAT_SYNC_INST_DOUBLES')}
              onClick={() => onButtonClick?.('BEAT_SYNC_INST_DOUBLES')}
            />
          </div>
        </div>

        {/* BEAT_JUMP_BACK */}
        <div
          className="absolute"
          style={{
            left: '1.3%',
            top: '50.9%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="BEAT_JUMP_BACK"
              label="BEAT JUMP ◄"
              variant="standard"
              size="lg"
              iconContent="◀"
              active={getState('BEAT_JUMP_BACK').active}
              highlighted={isHighlighted('BEAT_JUMP_BACK')}
              onClick={() => onButtonClick?.('BEAT_JUMP_BACK')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '1.3%',
            top: '49.7%',
            width: '6.4%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            BEAT JUMP ◄
          </span>
        </div>

        {/* BEAT_JUMP_FWD */}
        <div
          className="absolute"
          style={{
            left: '9.1%',
            top: '50.9%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="BEAT_JUMP_FWD"
              label="BEAT JUMP ►"
              variant="standard"
              size="lg"
              iconContent="▶"
              active={getState('BEAT_JUMP_FWD').active}
              highlighted={isHighlighted('BEAT_JUMP_FWD')}
              onClick={() => onButtonClick?.('BEAT_JUMP_FWD')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '9.1%',
            top: '49.7%',
            width: '6.4%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            BEAT JUMP ►
          </span>
        </div>

        {/* DIRECTION_LEVER */}
        <div
          className="absolute"
          style={{
            left: '3.1%',
            top: '57.4%',
            width: 128,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DirectionSwitch
            id="DIRECTION_LEVER"
            label=""
            positions={["FWD","REV","SLIP REV"]}
            highlighted={isHighlighted('DIRECTION_LEVER')}
            width={128}
            height={96}
          />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '3.1%',
            top: '56.2%',
            width: '10.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            DIRECTION FWD, REV, SLIP REV
          </span>
        </div>

        {/* TRACK_SEARCH_BACK */}
        <div
          className="absolute"
          style={{
            left: '1.5%',
            top: '67.2%',
            width: 72,
            height: 87,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TRACK_SEARCH_BACK"
              label="Track/Search"
              variant="transport"
              size="lg"
              iconContent="|◀◀"
              active={getState('TRACK_SEARCH_BACK').active}
              highlighted={isHighlighted('TRACK_SEARCH_BACK')}
              onClick={() => onButtonClick?.('TRACK_SEARCH_BACK')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '1.5%',
            top: '66.0%',
            width: '6.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            Track/Search
          </span>
        </div>

        {/* TRACK_SEARCH_FWD */}
        <div
          className="absolute"
          style={{
            left: '9.5%',
            top: '67.2%',
            width: 72,
            height: 87,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TRACK_SEARCH_FWD"
              label="Track/Search"
              variant="transport"
              size="lg"
              iconContent="▶▶|"
              active={getState('TRACK_SEARCH_FWD').active}
              highlighted={isHighlighted('TRACK_SEARCH_FWD')}
              onClick={() => onButtonClick?.('TRACK_SEARCH_FWD')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '9.5%',
            top: '66.0%',
            width: '6.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            Track/Search
          </span>
        </div>

        {/* SEARCH_BACK */}
        <div
          className="absolute"
          style={{
            left: '1.3%',
            top: '72.6%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="SEARCH_BACK"
              label="Search"
              variant="standard"
              size="lg"
              iconContent="◀◀"
              active={getState('SEARCH_BACK').active}
              highlighted={isHighlighted('SEARCH_BACK')}
              onClick={() => onButtonClick?.('SEARCH_BACK')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '1.3%',
            top: '71.4%',
            width: '6.4%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            Search
          </span>
        </div>

        {/* SEARCH_FWD */}
        <div
          className="absolute"
          style={{
            left: '9.1%',
            top: '72.6%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="SEARCH_FWD"
              label="Search"
              variant="standard"
              size="lg"
              iconContent="▶▶"
              active={getState('SEARCH_FWD').active}
              highlighted={isHighlighted('SEARCH_FWD')}
              onClick={() => onButtonClick?.('SEARCH_FWD')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '9.1%',
            top: '71.4%',
            width: '6.4%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            Search
          </span>
        </div>

        {/* CUE_BTN */}
        <div
          className="absolute"
          style={{
            left: '1.7%',
            top: '80.3%',
            width: 160,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="CUE_BTN"
              label="CUE"
              variant="transport"
              size="lg"
              surfaceColor="#f59e0b"
              hasLed
              ledColor="#f59e0b"
              ledOn={getState('CUE_BTN').active}
              active={getState('CUE_BTN').active}
              highlighted={isHighlighted('CUE_BTN')}
              onClick={() => onButtonClick?.('CUE_BTN')}
            />
          </div>
        </div>

        {/* PLAY_PAUSE */}
        <div
          className="absolute"
          style={{
            left: '1.7%',
            top: '90.4%',
            width: 160,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="PLAY_PAUSE"
              label="PLAY/PAUSE ►/II"
              variant="transport"
              size="lg"
              surfaceColor="#22c55e"
              hasLed
              ledColor="#22c55e"
              ledOn={getState('PLAY_PAUSE').active}
              iconContent="▶/❚❚"
              active={getState('PLAY_PAUSE').active}
              highlighted={isHighlighted('PLAY_PAUSE')}
              onClick={() => onButtonClick?.('PLAY_PAUSE')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '1.7%',
            top: '89.2%',
            width: '13.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            PLAY/PAUSE ►/II
          </span>
        </div>

        {/* JOG_WHEEL */}
        <div
          className="absolute"
          style={{
            left: '17.6%',
            top: '46.6%',
            width: 808,
            height: 705,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Wheel
            id="JOG_WHEEL"
            label=""
            width={808}
            height={705}
            highlighted={isHighlighted('JOG_WHEEL')}
          />
        </div>

        {/* JOG_DISPLAY */}
        <div
          className="absolute"
          style={{
            left: '29.9%',
            top: '60.5%',
            width: 512,
            height: 246,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <JogDisplay
            id="JOG_DISPLAY"
            size={246}
            showMockContent
          />
        </div>

        {/* TEMPO_RANGE */}
        <div
          className="absolute"
          style={{
            left: '84.3%',
            top: '58.8%',
            width: 196,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TEMPO_RANGE"
              label=""
              variant="transport"
              size="md"
              active={getState('TEMPO_RANGE').active}
              highlighted={isHighlighted('TEMPO_RANGE')}
              onClick={() => onButtonClick?.('TEMPO_RANGE')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '84.3%',
            top: '57.6%',
            width: '16.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            TEMPO ±6/±10/±16/WIDE
          </span>
          <span className="text-gray-500 uppercase block" style={{ fontSize: 7 }}>
            ±6/±10/±16/WIDE
          </span>
        </div>

        {/* MASTER_TEMPO */}
        <div
          className="absolute"
          style={{
            left: '84.3%',
            top: '64.0%',
            width: 196,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="MASTER_TEMPO"
              label=""
              variant="transport"
              size="md"
              hasLed
              ledColor="#f59e0b"
              ledOn={getState('MASTER_TEMPO').active}
              active={getState('MASTER_TEMPO').active}
              highlighted={isHighlighted('MASTER_TEMPO')}
              onClick={() => onButtonClick?.('MASTER_TEMPO')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '84.3%',
            top: '62.8%',
            width: '16.3%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            MASTER TEMPO
          </span>
        </div>

        {/* TEMPO_SLIDER */}
        <div
          className="absolute"
          style={{
            left: '88.5%',
            top: '69.2%',
            width: 96,
            height: 432,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Slider
            id="TEMPO_SLIDER"
            label=""
            value={getState('TEMPO_SLIDER').value ?? 64}
            highlighted={isHighlighted('TEMPO_SLIDER')}
            trackHeight={412}
            trackWidth={86}
          />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '88.5%',
            top: '68.0%',
            width: '8.0%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            TEMPO slider
          </span>
        </div>

        {/* TEMPO_RESET */}
        <div
          className="absolute"
          style={{
            left: '80.6%',
            top: '79.1%',
            width: 56,
            height: 104,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <PanelButton
              id="TEMPO_RESET"
              label=""
              variant="transport"
              size="lg"
              active={getState('TEMPO_RESET').active}
              highlighted={isHighlighted('TEMPO_RESET')}
              onClick={() => onButtonClick?.('TEMPO_RESET')}
            />
          </div>
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: '80.6%',
            top: '77.9%',
            width: '4.7%',
            textAlign: 'center',
          }}
        >
          <span className="font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: 8 }}>
            TEMPO RESET
          </span>
        </div>

        {/* TEMPO_RESET_INDICATOR */}
        <div
          className="absolute"
          style={{
            left: '83.5%',
            top: '79.1%',
            width: 96,
            height: 102,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LEDIndicator
            id="TEMPO_RESET_INDICATOR"
            on={getState('TEMPO_RESET_INDICATOR').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('TEMPO_RESET_INDICATOR')}
          />
        </div>

        {/* Group labels */}

    </PanelShell>
  );
}
