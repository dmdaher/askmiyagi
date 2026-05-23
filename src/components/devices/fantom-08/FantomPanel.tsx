'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { PanelState } from '@/types/panel';
import { DisplayState } from '@/types/display';
import { ZoneConfig } from '@/types/keyboard';
import DisplayScreen from './display/DisplayScreen';
import ZoneSection from './sections/ZoneSection';

import CommonSection from './sections/CommonSection';
import ControllerSection from './sections/ControllerSection';
import SynthModeSection from './sections/SynthModeSection';

import PadSection from './sections/PadSection';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import Keyboard from './Keyboard';
import { PANEL_NATURAL_WIDTH, PANEL_NATURAL_HEIGHT } from '@/lib/devices/fantom-08-constants';

interface FantomPanelProps {
  panelState: PanelState;
  displayState: DisplayState;
  highlightedControls: string[];
  zones?: ZoneConfig[];
  onButtonClick?: (id: string) => void;
}

const toneCategories = [
  { id: 'tone-cat-1', label: 'Ac Piano' },
  { id: 'tone-cat-2', label: 'El Piano' },
  { id: 'tone-cat-3', label: 'Organ' },
  { id: 'tone-cat-4', label: 'Keys' },
  { id: 'tone-cat-5', label: 'Guitar' },
  { id: 'tone-cat-6', label: 'Bass' },
  { id: 'tone-cat-7', label: 'Strings' },
  { id: 'tone-cat-8', label: 'Brass' },
  { id: 'tone-cat-9', label: 'Wind' },
  { id: 'tone-cat-10', label: 'Choir' },
  { id: 'tone-cat-11', label: 'Synth' },
  { id: 'tone-cat-12', label: 'Pad' },
  { id: 'tone-cat-13', label: 'FX' },
  { id: 'tone-cat-14', label: 'Drums' },
  { id: 'tone-cat-15', label: 'User' },
  { id: 'tone-cat-16', label: 'Assign' },
];

export default function FantomPanel({
  panelState,
  displayState,
  highlightedControls,
  zones,
  onButtonClick,
}: FantomPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-x-auto"
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width: PANEL_NATURAL_WIDTH,
          minWidth: PANEL_NATURAL_WIDTH,
          height: PANEL_NATURAL_HEIGHT,
          backgroundColor: '#1a1a1a',
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px), radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.12) 0%, transparent 60%)',
          boxShadow:
            '0 0 0 1px rgba(80,80,80,0.3), 0 2px 0 0 rgba(255,255,255,0.04) inset, 0 -2px 0 0 rgba(0,0,0,0.4) inset, 0 8px 32px rgba(0,0,0,0.6)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top bezel highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-30"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 95%)',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-2">
          {/* Branding bar */}
          <div className="flex items-center gap-3 mb-1 px-1">
            <span
              className="text-[10px] font-bold tracking-[0.35em] text-neutral-500"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              ROLAND
            </span>
            <span className="text-[9px] tracking-[0.2em] text-neutral-600 font-medium">
              FANTOM-08
            </span>
          </div>

          {/* ROW 1: Control Panel — single horizontal row */}
          <div className="flex items-stretch gap-2 flex-1 min-h-0">
            {/* Wheels + Sliders (far left) */}
            <div
              className="flex-shrink-0 flex items-end rounded-lg px-1.5 py-1.5"
              style={{
                background: 'rgba(0,0,0,0.15)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              <ControllerSection
                panelState={panelState}
                highlightedControls={highlightedControls}
              />
            </div>

            {/* Zone Buttons + Knobs/Sliders (left of display — Section ② on real Fantom) */}
            <div
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-1.5 py-1.5"
              style={{
                background: 'rgba(0,0,0,0.12)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              }}
            >
              <ZoneSection
                panelState={panelState}
                highlightedControls={highlightedControls}
                onButtonClick={onButtonClick}
              />
            </div>

            {/* DISPLAY area: 5-row layout */}
            <div
              className="flex-shrink-0 flex flex-col gap-1 rounded-lg px-1.5 py-1.5"
              style={{
                background: 'rgba(0,0,0,0.12)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              }}
            >
              {/* Rows 1-4: Write/MFX/M.Pad/DAW | Display | Scene+Nav */}
              <div className="flex items-stretch gap-2 flex-1 min-h-0">
                {/* Write/MFX/M.Pad/DAW — vertical column left of display (no Menu) */}
                <div className="flex flex-col gap-8 justify-start pt-2 flex-shrink-0 pr-4">
                  {[
                    { id: 'write', label: 'Write', hasLed: true },
                    { id: 'master-fx', label: 'Master FX' },
                    { id: 'motional-pad', label: 'Motional Pad' },
                    { id: 'daw-ctrl', label: 'DAW Ctrl' },
                    { id: 'menu', label: 'Menu' },
                  ].map((btn) => (
                    <PanelButton
                      key={btn.id}
                      id={btn.id}
                      label={btn.label}
                      variant="function"
                      size="md"
                      labelPosition="above"
                      {...(btn.hasLed ? { hasLed: true, ledOn: panelState[btn.id]?.ledOn ?? false, ledColor: '#ff2222' } : {})}
                      active={panelState[btn.id]?.active ?? false}
                      highlighted={highlightedControls.includes(btn.id)}
                      onClick={() => onButtonClick?.(btn.id)}
                    />
                  ))}
                </div>

                {/* Display screen (center column — no E1-E6 here) */}
                <div className="flex flex-col gap-1.5 min-w-0" style={{ width: 600 }}>
                  <div className="flex items-center flex-1">
                    <DisplayScreen
                      displayState={displayState}
                      highlighted={highlightedControls.includes('display')}
                    />
                  </div>
                </div>

                {/* Navigation section (right of display) */}
                <div className="flex-shrink-0 flex items-center px-4">
                  <CommonSection
                    panelState={panelState}
                    highlightedControls={highlightedControls}
                    onButtonClick={onButtonClick}
                  />
                </div>
              </div>

              {/* Row 5: Menu | E1-E6 knobs | Tempo, Shift, Exit, Enter */}
              <div className="flex items-end gap-2">
                <div className="grid grid-cols-6 gap-0 flex-1 ml-16" style={{ maxWidth: 620 }}>
                  {['function-e1', 'function-e2', 'function-e3', 'function-e4', 'function-e5', 'function-e6'].map((id) => (
                    <div key={id} className="flex justify-center">
                      <Knob
                        id={id}
                        label=""
                        value={panelState[id]?.value ?? 64}
                        highlighted={highlightedControls.includes(id)}
                        size="md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right-side 2-row layout: upper sections + bottom tone categories */}
            <div
              className="flex-1 min-w-0 flex flex-col gap-1.5 rounded-lg pl-1.5 pr-4 py-1.5"
              style={{
                background: 'rgba(0,0,0,0.15)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {/* Upper row: SynthCtrl+Sequencer | Pads */}
              <div className="flex items-stretch gap-10 flex-1 min-h-0">
                <SynthModeSection
                  panelState={panelState}
                  highlightedControls={highlightedControls}
                  onButtonClick={onButtonClick}
                />
                <div className="ml-2">
                  <PadSection
                    panelState={panelState}
                    highlightedControls={highlightedControls}
                    onButtonClick={onButtonClick}
                  />
                </div>
              </div>

              {/* Lower row: Tone categories spanning full width */}
              <div className="flex flex-col gap-0.5 -mt-14">
                <div className="grid grid-cols-16 gap-0.5">
                  {toneCategories.map((cat) => {
                    const state = panelState[cat.id];
                    return (
                      <PanelButton
                        key={cat.id}
                        id={cat.id}
                        label={cat.label}
                        variant="category"
                        size="sm"
                        labelPosition="above"
                        active={state?.active ?? false}
                        highlighted={highlightedControls.includes(cat.id)}
                        onClick={() => onButtonClick?.(cat.id)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Keyboard (full width) */}
          <div className="w-full mt-1.5">
            <Keyboard
              zones={zones}
              highlightedKeys={[]}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
