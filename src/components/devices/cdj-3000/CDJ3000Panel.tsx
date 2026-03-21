'use client';

import { motion } from 'framer-motion';
import DirectionSwitch from '@/components/controls/DirectionSwitch';
import JogWheelAssembly from '@/components/controls/JogWheelAssembly';
import Knob from '@/components/controls/Knob';
import LEDIndicator from '@/components/controls/LEDIndicator';
import PadButton from '@/components/controls/PadButton';
import PanelButton from '@/components/controls/PanelButton';
import Port from '@/components/controls/Port';
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
    <div className="w-full h-full overflow-x-auto">
      <motion.div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width: CDJ3000_PANEL.width,
          minWidth: CDJ3000_PANEL.width,
          height: CDJ3000_PANEL.height,
          backgroundColor: '#1a1a1a',
          boxShadow: '0 0 0 1px rgba(80,80,80,0.3), 0 8px 32px rgba(0,0,0,0.6), 0 2px 0 0 rgba(255,255,255,0.04) inset, 0 -2px 0 0 rgba(0,0,0,0.4) inset',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Panel texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.12) 0%, transparent 60%)',
          }}
        />

        {/* Top bezel accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none z-30"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 95%)',
          }}
        />

        {/* Branding bar */}
        <div className="absolute top-1 left-4 z-30 pointer-events-none flex items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-500 tracking-[0.35em] uppercase">
            {CDJ3000_PANEL.manufacturer}
          </span>
          <span className="text-[9px] font-medium text-neutral-600 tracking-[0.2em] uppercase">
            {CDJ3000_PANEL.deviceName}
          </span>
        </div>

        {/* Section backgrounds — decorative only */}
        {/* Browse Bar background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '10.6%',
            top: '1.5%',
            width: '78.3%',
            height: '4.8%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Media background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '2.3%',
            top: '7.5%',
            width: '12.8%',
            height: '15%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* display background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '19%',
            top: '7.1%',
            width: '61.3%',
            height: '26.2%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Navigation background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '78.2%',
            top: '10.5%',
            width: '22.8%',
            height: '18.6%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Performance Modes background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '1.2%',
            top: '23.8%',
            width: '14.3%',
            height: '7.8%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Hot Cue background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '14.4%',
            top: '34.4%',
            width: '70.7%',
            height: '3.9%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Loop background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '-0.8%',
            top: '40.2%',
            width: '29.2%',
            height: '10%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Cue/Loop Memory background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '59.4%',
            top: '34.5%',
            width: '36%',
            height: '9.5%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Transport background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '0.6%',
            top: '50.4%',
            width: '15.6%',
            height: '47.7%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* jog background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '13.6%',
            top: '44.5%',
            width: '75.3%',
            height: '48.9%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Jog Mode background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '69.8%',
            top: '40.5%',
            width: '29.2%',
            height: '10.2%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Beat Sync background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '86.5%',
            top: '47%',
            width: '11.8%',
            height: '7.8%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* Tempo background */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '79.2%',
            top: '58%',
            width: '21.3%',
            height: '37.6%',
            backgroundColor: 'rgba(0,0,0,0.12)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
          }}
        />

        {/* All controls — panel-level percentage positioning */}
        {/* source-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="source-btn"
              label="SOURCE"
              variant="flat-key"
              active={getState('source-btn').active}
              highlighted={isHighlighted('source-btn')}
              onClick={() => onButtonClick?.('source-btn')}
            />
          </motion.div>
        </div>

        {/* browse-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="browse-btn"
              label="BROWSE"
              variant="flat-key"
              active={getState('browse-btn').active}
              highlighted={isHighlighted('browse-btn')}
              onClick={() => onButtonClick?.('browse-btn')}
            />
          </motion.div>
        </div>

        {/* tag-list-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="tag-list-btn"
              label="TAG LIST"
              variant="flat-key"
              active={getState('tag-list-btn').active}
              highlighted={isHighlighted('tag-list-btn')}
              onClick={() => onButtonClick?.('tag-list-btn')}
            />
          </motion.div>
        </div>

        {/* source-indicator */}
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
            id="source-indicator"
            on={getState('source-indicator').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('source-indicator')}
          />
        </div>

        {/* playlist-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="playlist-btn"
              label="PLAYLIST"
              variant="flat-key"
              active={getState('playlist-btn').active}
              highlighted={isHighlighted('playlist-btn')}
              onClick={() => onButtonClick?.('playlist-btn')}
            />
          </motion.div>
        </div>

        {/* search-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="search-btn"
              label="SEARCH"
              variant="flat-key"
              active={getState('search-btn').active}
              highlighted={isHighlighted('search-btn')}
              onClick={() => onButtonClick?.('search-btn')}
            />
          </motion.div>
        </div>

        {/* menu-utility-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="menu-utility-btn"
              label="MENU/UTILITY"
              variant="flat-key"
              active={getState('menu-utility-btn').active}
              highlighted={isHighlighted('menu-utility-btn')}
              onClick={() => onButtonClick?.('menu-utility-btn')}
            />
          </motion.div>
        </div>

        {/* usb-port */}
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
            id="usb-port"
            label=""
            variant="usb-a"
            highlighted={isHighlighted('usb-port')}
          />
        </div>

        {/* usb-indicator */}
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
            id="usb-indicator"
            on={getState('usb-indicator').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('usb-indicator')}
          />
        </div>

        {/* usb-stop-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="usb-stop-btn"
              label=""
              variant="standard"
              active={getState('usb-stop-btn').active}
              highlighted={isHighlighted('usb-stop-btn')}
              onClick={() => onButtonClick?.('usb-stop-btn')}
            />
          </motion.div>
        </div>

        {/* sd-card-slot */}
        <div
          className="absolute"
          style={{
            left: '4.5%',
            top: '16.0%',
            width: 100,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Port
            id="sd-card-slot"
            label=""
            variant="sd-card"
            highlighted={isHighlighted('sd-card-slot')}
          />
        </div>

        {/* sd-indicator */}
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
            id="sd-indicator"
            on={getState('sd-indicator').ledOn ?? false}
            color="#f59e0b"
            highlighted={isHighlighted('sd-indicator')}
          />
        </div>

        {/* touch-display */}
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
            id="touch-display"
            label=""
            variant="main"
            showMockContent
            width={200}
            height={120}
            highlighted={isHighlighted('touch-display')}
          />
        </div>

        {/* back-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="back-btn"
              label="BACK"
              variant="standard"
              active={getState('back-btn').active}
              highlighted={isHighlighted('back-btn')}
              onClick={() => onButtonClick?.('back-btn')}
            />
          </motion.div>
        </div>

        {/* tag-track-remove-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="tag-track-remove-btn"
              label="TAG TRACK/REMOVE"
              variant="standard"
              active={getState('tag-track-remove-btn').active}
              highlighted={isHighlighted('tag-track-remove-btn')}
              onClick={() => onButtonClick?.('tag-track-remove-btn')}
            />
          </motion.div>
        </div>

        {/* rotary-selector */}
        <div
          className="absolute"
          style={{
            left: '83.7%',
            top: '13.8%',
            width: 144,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ValueDial
            id="rotary-selector"
            label=""
            hasPush
            highlighted={isHighlighted('rotary-selector')}
          />
        </div>

        {/* track-filter-edit-btn */}
        <div
          className="absolute"
          style={{
            left: '80.4%',
            top: '24.3%',
            width: 152,
            height: 73,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="track-filter-edit-btn"
              label="TRACK FILTER/EDIT"
              variant="standard"
              active={getState('track-filter-edit-btn').active}
              highlighted={isHighlighted('track-filter-edit-btn')}
              onClick={() => onButtonClick?.('track-filter-edit-btn')}
            />
          </motion.div>
        </div>

        {/* shortcut-btn */}
        <div
          className="absolute"
          style={{
            left: '87.7%',
            top: '24.3%',
            width: 152,
            height: 73,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="shortcut-btn"
              label="SHORTCUT"
              variant="standard"
              active={getState('shortcut-btn').active}
              highlighted={isHighlighted('shortcut-btn')}
              onClick={() => onButtonClick?.('shortcut-btn')}
            />
          </motion.div>
        </div>

        {/* time-mode-btn */}
        <div
          className="absolute"
          style={{
            left: '4.2%',
            top: '24.3%',
            width: 100,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="time-mode-btn"
              label=""
              variant="rubber"
              hasLed
              ledColor="#22c55e"
              active={getState('time-mode-btn').active}
              highlighted={isHighlighted('time-mode-btn')}
              onClick={() => onButtonClick?.('time-mode-btn')}
            />
          </motion.div>
        </div>

        {/* quantize-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="quantize-btn"
              label=""
              variant="rubber"
              hasLed
              ledColor="#ef4444"
              active={getState('quantize-btn').active}
              highlighted={isHighlighted('quantize-btn')}
              onClick={() => onButtonClick?.('quantize-btn')}
            />
          </motion.div>
        </div>

        {/* slip-btn */}
        <div
          className="absolute"
          style={{
            left: '1.9%',
            top: '28.3%',
            width: 100,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="slip-btn"
              label=""
              variant="rubber"
              hasLed
              ledColor="#3b82f6"
              active={getState('slip-btn').active}
              highlighted={isHighlighted('slip-btn')}
              onClick={() => onButtonClick?.('slip-btn')}
            />
          </motion.div>
        </div>

        {/* hot-cue-a */}
        <div
          className="absolute"
          style={{
            left: '15.1%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-a"
              label=""
              active={getState('hot-cue-a').active}
              highlighted={isHighlighted('hot-cue-a')}
              onClick={() => onButtonClick?.('hot-cue-a')}
            />
          </motion.div>
        </div>

        {/* hot-cue-b */}
        <div
          className="absolute"
          style={{
            left: '23.8%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-b"
              label=""
              active={getState('hot-cue-b').active}
              highlighted={isHighlighted('hot-cue-b')}
              onClick={() => onButtonClick?.('hot-cue-b')}
            />
          </motion.div>
        </div>

        {/* hot-cue-c */}
        <div
          className="absolute"
          style={{
            left: '32.5%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-c"
              label=""
              active={getState('hot-cue-c').active}
              highlighted={isHighlighted('hot-cue-c')}
              onClick={() => onButtonClick?.('hot-cue-c')}
            />
          </motion.div>
        </div>

        {/* hot-cue-d */}
        <div
          className="absolute"
          style={{
            left: '41.1%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-d"
              label=""
              active={getState('hot-cue-d').active}
              highlighted={isHighlighted('hot-cue-d')}
              onClick={() => onButtonClick?.('hot-cue-d')}
            />
          </motion.div>
        </div>

        {/* hot-cue-e */}
        <div
          className="absolute"
          style={{
            left: '50.9%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-e"
              label=""
              active={getState('hot-cue-e').active}
              highlighted={isHighlighted('hot-cue-e')}
              onClick={() => onButtonClick?.('hot-cue-e')}
            />
          </motion.div>
        </div>

        {/* hot-cue-f */}
        <div
          className="absolute"
          style={{
            left: '59.6%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-f"
              label=""
              active={getState('hot-cue-f').active}
              highlighted={isHighlighted('hot-cue-f')}
              onClick={() => onButtonClick?.('hot-cue-f')}
            />
          </motion.div>
        </div>

        {/* hot-cue-g */}
        <div
          className="absolute"
          style={{
            left: '68.6%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-g"
              label=""
              active={getState('hot-cue-g').active}
              highlighted={isHighlighted('hot-cue-g')}
              onClick={() => onButtonClick?.('hot-cue-g')}
            />
          </motion.div>
        </div>

        {/* hot-cue-h */}
        <div
          className="absolute"
          style={{
            left: '77.1%',
            top: '34.9%',
            width: 88,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.93, y: 2 }}>
            <PadButton
              id="hot-cue-h"
              label=""
              active={getState('hot-cue-h').active}
              highlighted={isHighlighted('hot-cue-h')}
              onClick={() => onButtonClick?.('hot-cue-h')}
            />
          </motion.div>
        </div>

        {/* loop-in-cue-btn */}
        <div
          className="absolute"
          style={{
            left: '-0.1%',
            top: '40.7%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="loop-in-cue-btn"
              label=""
              variant="standard"
              hasLed
              ledColor="#22c55e"
              active={getState('loop-in-cue-btn').active}
              highlighted={isHighlighted('loop-in-cue-btn')}
              onClick={() => onButtonClick?.('loop-in-cue-btn')}
            />
          </motion.div>
        </div>

        {/* loop-out-btn */}
        <div
          className="absolute"
          style={{
            left: '7.8%',
            top: '40.7%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="loop-out-btn"
              label=""
              variant="standard"
              hasLed
              ledColor="#22c55e"
              active={getState('loop-out-btn').active}
              highlighted={isHighlighted('loop-out-btn')}
              onClick={() => onButtonClick?.('loop-out-btn')}
            />
          </motion.div>
        </div>

        {/* loop-reloop-exit-btn */}
        <div
          className="absolute"
          style={{
            left: '15.8%',
            top: '40.7%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="loop-reloop-exit-btn"
              label=""
              variant="standard"
              hasLed
              ledColor="#22c55e"
              active={getState('loop-reloop-exit-btn').active}
              highlighted={isHighlighted('loop-reloop-exit-btn')}
              onClick={() => onButtonClick?.('loop-reloop-exit-btn')}
            />
          </motion.div>
        </div>

        {/* 4-beat-loop-btn */}
        <div
          className="absolute"
          style={{
            left: '-0.1%',
            top: '46.8%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="4-beat-loop-btn"
              label=""
              variant="standard"
              hasLed
              ledColor="#22c55e"
              active={getState('4-beat-loop-btn').active}
              highlighted={isHighlighted('4-beat-loop-btn')}
              onClick={() => onButtonClick?.('4-beat-loop-btn')}
            />
          </motion.div>
        </div>

        {/* 8-beat-loop-btn */}
        <div
          className="absolute"
          style={{
            left: '7.8%',
            top: '46.8%',
            width: 144,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="8-beat-loop-btn"
              label=""
              variant="standard"
              hasLed
              ledColor="#22c55e"
              active={getState('8-beat-loop-btn').active}
              highlighted={isHighlighted('8-beat-loop-btn')}
              onClick={() => onButtonClick?.('8-beat-loop-btn')}
            />
          </motion.div>
        </div>

        {/* vinyl-speed-adj-knob */}
        <div
          className="absolute"
          style={{
            left: '89.5%',
            top: '35.0%',
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Knob
            id="vinyl-speed-adj-knob"
            label=""
            value={getState('vinyl-speed-adj-knob').value ?? 64}
            highlighted={isHighlighted('vinyl-speed-adj-knob')}
          />
        </div>

        {/* cue-loop-call-left-btn */}
        <div
          className="absolute"
          style={{
            left: '60.1%',
            top: '41.2%',
            width: 106,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="cue-loop-call-left-btn"
              label="CUE/LOOP CALL ◄"
              variant="standard"
              iconContent="◀"
              active={getState('cue-loop-call-left-btn').active}
              highlighted={isHighlighted('cue-loop-call-left-btn')}
              onClick={() => onButtonClick?.('cue-loop-call-left-btn')}
            />
          </motion.div>
        </div>

        {/* cue-loop-call-right-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="cue-loop-call-right-btn"
              label="CUE/LOOP CALL ►"
              variant="standard"
              iconContent="▶"
              active={getState('cue-loop-call-right-btn').active}
              highlighted={isHighlighted('cue-loop-call-right-btn')}
              onClick={() => onButtonClick?.('cue-loop-call-right-btn')}
            />
          </motion.div>
        </div>

        {/* delete-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="delete-btn"
              label=""
              variant="standard"
              active={getState('delete-btn').active}
              highlighted={isHighlighted('delete-btn')}
              onClick={() => onButtonClick?.('delete-btn')}
            />
          </motion.div>
        </div>

        {/* memory-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="memory-btn"
              label=""
              variant="standard"
              active={getState('memory-btn').active}
              highlighted={isHighlighted('memory-btn')}
              onClick={() => onButtonClick?.('memory-btn')}
            />
          </motion.div>
        </div>

        {/* beat-jump-left-btn */}
        <div
          className="absolute"
          style={{
            left: '1.3%',
            top: '50.8%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="beat-jump-left-btn"
              label="BEAT JUMP ◄"
              variant="standard"
              iconContent="◀"
              active={getState('beat-jump-left-btn').active}
              highlighted={isHighlighted('beat-jump-left-btn')}
              onClick={() => onButtonClick?.('beat-jump-left-btn')}
            />
          </motion.div>
        </div>

        {/* beat-jump-right-btn */}
        <div
          className="absolute"
          style={{
            left: '9.2%',
            top: '50.8%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="beat-jump-right-btn"
              label="BEAT JUMP ►"
              variant="standard"
              iconContent="▶"
              active={getState('beat-jump-right-btn').active}
              highlighted={isHighlighted('beat-jump-right-btn')}
              onClick={() => onButtonClick?.('beat-jump-right-btn')}
            />
          </motion.div>
        </div>

        {/* direction-lever */}
        <div
          className="absolute"
          style={{
            left: '3.1%',
            top: '57.3%',
            width: 128,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DirectionSwitch
            id="direction-lever"
            label=""
            positions={["FWD","REV","SLIP REV"]}
            highlighted={isHighlighted('direction-lever')}
          />
        </div>

        {/* track-search-bwd-btn */}
        <div
          className="absolute"
          style={{
            left: '1.5%',
            top: '67.1%',
            width: 72,
            height: 87,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="track-search-bwd-btn"
              label="Track/Search"
              variant="standard"
              iconContent="|◀◀"
              active={getState('track-search-bwd-btn').active}
              highlighted={isHighlighted('track-search-bwd-btn')}
              onClick={() => onButtonClick?.('track-search-bwd-btn')}
            />
          </motion.div>
        </div>

        {/* track-search-fwd-btn */}
        <div
          className="absolute"
          style={{
            left: '9.4%',
            top: '67.1%',
            width: 72,
            height: 87,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="track-search-fwd-btn"
              label="Track/Search"
              variant="standard"
              iconContent="▶▶|"
              active={getState('track-search-fwd-btn').active}
              highlighted={isHighlighted('track-search-fwd-btn')}
              onClick={() => onButtonClick?.('track-search-fwd-btn')}
            />
          </motion.div>
        </div>

        {/* search-bwd-btn */}
        <div
          className="absolute"
          style={{
            left: '1.3%',
            top: '72.5%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="search-bwd-btn"
              label="Search"
              variant="standard"
              iconContent="◀◀"
              active={getState('search-bwd-btn').active}
              highlighted={isHighlighted('search-bwd-btn')}
              onClick={() => onButtonClick?.('search-bwd-btn')}
            />
          </motion.div>
        </div>

        {/* search-fwd-btn */}
        <div
          className="absolute"
          style={{
            left: '9.2%',
            top: '72.5%',
            width: 77,
            height: 97,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="search-fwd-btn"
              label="Search"
              variant="standard"
              iconContent="▶▶"
              active={getState('search-fwd-btn').active}
              highlighted={isHighlighted('search-fwd-btn')}
              onClick={() => onButtonClick?.('search-fwd-btn')}
            />
          </motion.div>
        </div>

        {/* cue-btn */}
        <div
          className="absolute"
          style={{
            left: '1.8%',
            top: '80.2%',
            width: 160,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="cue-btn"
              label="CUE"
              variant="transport"
              surfaceColor="#f59e0b"
              hasLed
              ledColor="#f59e0b"
              active={getState('cue-btn').active}
              highlighted={isHighlighted('cue-btn')}
              onClick={() => onButtonClick?.('cue-btn')}
            />
          </motion.div>
        </div>

        {/* play-pause-btn */}
        <div
          className="absolute"
          style={{
            left: '1.8%',
            top: '90.3%',
            width: 160,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="play-pause-btn"
              label="PLAY/PAUSE ►/II"
              variant="transport"
              surfaceColor="#22c55e"
              iconContent="▶/❚❚"
              hasLed
              ledColor="#22c55e"
              active={getState('play-pause-btn').active}
              highlighted={isHighlighted('play-pause-btn')}
              onClick={() => onButtonClick?.('play-pause-btn')}
            />
          </motion.div>
        </div>

        {/* jog-wheel */}
        <div
          className="absolute"
          style={{
            left: '14.3%',
            top: '44.9%',
            width: 888,
            height: 790,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <JogWheelAssembly
            id="jog-wheel"
            label=""
            wheelSize={160}
            displaySize={60}
            ringColor="#22c55e"
            highlighted={isHighlighted('jog-wheel')}
          />
        </div>

        {/* jog-mode-btn */}
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
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="jog-mode-btn"
              label=""
              variant="standard"
              active={getState('jog-mode-btn').active}
              highlighted={isHighlighted('jog-mode-btn')}
              onClick={() => onButtonClick?.('jog-mode-btn')}
            />
          </motion.div>
        </div>

        {/* vinyl-cdj-indicator */}
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
            id="vinyl-cdj-indicator"
            on={getState('vinyl-cdj-indicator').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('vinyl-cdj-indicator')}
          />
        </div>

        {/* jog-adjust-knob */}
        <div
          className="absolute"
          style={{
            left: '70.4%',
            top: '47.3%',
            width: 176,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Knob
            id="jog-adjust-knob"
            label=""
            value={getState('jog-adjust-knob').value ?? 64}
            highlighted={isHighlighted('jog-adjust-knob')}
          />
        </div>

        {/* beat-sync-inst-doubles-btn */}
        <div
          className="absolute"
          style={{
            left: '87.1%',
            top: '47.5%',
            width: 64,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="beat-sync-inst-doubles-btn"
              label="Beat Sync"
              variant="standard"
              hasLed
              ledColor="#3b82f6"
              active={getState('beat-sync-inst-doubles-btn').active}
              highlighted={isHighlighted('beat-sync-inst-doubles-btn')}
              onClick={() => onButtonClick?.('beat-sync-inst-doubles-btn')}
            />
          </motion.div>
        </div>

        {/* master-btn */}
        <div
          className="absolute"
          style={{
            left: '92.3%',
            top: '47.5%',
            width: 64,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="master-btn"
              label="MASTER"
              variant="standard"
              hasLed
              ledColor="#22c55e"
              active={getState('master-btn').active}
              highlighted={isHighlighted('master-btn')}
              onClick={() => onButtonClick?.('master-btn')}
            />
          </motion.div>
        </div>

        {/* key-sync-btn */}
        <div
          className="absolute"
          style={{
            left: '89.7%',
            top: '50.9%',
            width: 64,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="key-sync-btn"
              label="KEY SYNC"
              variant="standard"
              surfaceColor="#ec4899"
              hasLed
              ledColor="#ec4899"
              active={getState('key-sync-btn').active}
              highlighted={isHighlighted('key-sync-btn')}
              onClick={() => onButtonClick?.('key-sync-btn')}
            />
          </motion.div>
        </div>

        {/* tempo-range-btn */}
        <div
          className="absolute"
          style={{
            left: '83.5%',
            top: '58.5%',
            width: 196,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="tempo-range-btn"
              label=""
              variant="standard"
              active={getState('tempo-range-btn').active}
              highlighted={isHighlighted('tempo-range-btn')}
              onClick={() => onButtonClick?.('tempo-range-btn')}
            />
          </motion.div>
        </div>

        {/* master-tempo-btn */}
        <div
          className="absolute"
          style={{
            left: '83.5%',
            top: '63.0%',
            width: 196,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="master-tempo-btn"
              label=""
              variant="standard"
              hasLed
              ledColor="#f59e0b"
              active={getState('master-tempo-btn').active}
              highlighted={isHighlighted('master-tempo-btn')}
              onClick={() => onButtonClick?.('master-tempo-btn')}
            />
          </motion.div>
        </div>

        {/* tempo-slider */}
        <div
          className="absolute"
          style={{
            left: '87.6%',
            top: '69.0%',
            width: 96,
            height: 432,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Slider
            id="tempo-slider"
            label=""
            value={getState('tempo-slider').value ?? 64}
            highlighted={isHighlighted('tempo-slider')}
          />
        </div>

        {/* tempo-reset-btn */}
        <div
          className="absolute"
          style={{
            left: '79.8%',
            top: '78.9%',
            width: 56,
            height: 104,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div whileTap={{ scale: 0.95, y: 2 }}>
            <PanelButton
              id="tempo-reset-btn"
              label=""
              variant="standard"
              active={getState('tempo-reset-btn').active}
              highlighted={isHighlighted('tempo-reset-btn')}
              onClick={() => onButtonClick?.('tempo-reset-btn')}
            />
          </motion.div>
        </div>

        {/* tempo-reset-indicator */}
        <div
          className="absolute"
          style={{
            left: '81.5%',
            top: '79.0%',
            width: 96,
            height: 102,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LEDIndicator
            id="tempo-reset-indicator"
            on={getState('tempo-reset-indicator').ledOn ?? false}
            color="#22c55e"
            highlighted={isHighlighted('tempo-reset-indicator')}
          />
        </div>
      </motion.div>
    </div>
  );
}
