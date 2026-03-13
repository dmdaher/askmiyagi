'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { PanelState } from '@/types/panel';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import Wheel from '@/components/controls/Wheel';
import DeepMindDisplay from './DeepMindDisplay';
import DeepMindKeyboard from './DeepMindKeyboard';
import {
  PANEL_NATURAL_WIDTH,
  PANEL_NATURAL_HEIGHT,
  DM_COLORS,
  LFO_WAVEFORMS,
  PROGRAMMER_MIN_WIDTH,
  SINGLE_SLIDER_SECTION_MIN_WIDTH,
  SECTION_FLEX,
  SLIDER_TRACK_HEIGHT,
  SLIDER_TRACK_HEIGHT_VCF,
  SLIDER_TRACK_HEIGHT_ENV,
  SLIDER_TRACK_HEIGHT_OSC,
  SLIDER_TRACK_HEIGHT_TALL,
  SLIDER_TRACK_HEIGHT_VCA,
  SLIDER_TRACK_HEIGHT_POLY,
  SLIDER_TRACK_HEIGHT_DATA,
  SLIDER_TRACK_WIDTH,
  WHEEL_WIDTH,
  WHEEL_HEIGHT,
  LED_SIZE,
  LED_SIZE_LARGE,
  OSC_DIVIDER_HEIGHT,
} from '@/lib/devices/deepmind-12-constants';

interface DeepMindPanelProps {
  panelState: PanelState;
  displayState?: Record<string, string | number | boolean | string[]>;
  highlightedControls: string[];
  zones?: { id: string; name: string; color?: string; startNote?: number; endNote?: number }[];
  onButtonClick?: (id: string) => void;
}

/* ───── Section Header Bar ───── */
function SectionHeader({ label, width, colorTop, colorBottom }: { label: string; width?: string; colorTop?: string; colorBottom?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-t-sm px-1.5 py-px select-none"
      style={{
        background: `linear-gradient(to bottom, ${colorTop ?? DM_COLORS.sectionHeader}, ${colorBottom ?? DM_COLORS.sectionHeaderDark})`,
        minWidth: width,
        boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <span className="text-[9px] font-bold tracking-[0.15em] text-white uppercase whitespace-nowrap leading-none">
        {label}
      </span>
    </div>
  );
}

/* ───── LED Indicator (small) ───── */
function LED({ on = false, color = DM_COLORS.ledGreen, size = 5 }: { on?: boolean; color?: string; size?: number }) {
  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: on ? color : '#333333',
        boxShadow: on ? `0 0 4px 1px ${color}` : 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}
    />
  );
}

/* ───── LFO Waveform Icons ───── */
function WaveformLEDs({ prefix, panelState, highlightedControls }: {
  prefix: string;
  panelState: PanelState;
  highlightedControls: string[];
}) {
  const waveformPaths: Record<string, string> = {
    'sine': 'M0,6 Q3,0 6,6 Q9,12 12,6',
    'triangle': 'M0,10 L6,2 L12,10',
    'square': 'M0,10 L0,2 L6,2 L6,10 L12,10',
    'ramp-up': 'M0,10 L12,2',
    'ramp-down': 'M0,2 L12,10',
    'sample-hold': 'M0,8 L3,8 L3,3 L6,3 L6,10 L9,10 L9,5 L12,5',
    'glide': 'M0,10 Q4,10 6,4 Q8,0 12,2',
  };

  return (
    <div className="flex items-center gap-1">
      {LFO_WAVEFORMS.map((wf) => {
        const id = `${prefix}-wf-${wf}`;
        const isActive = panelState[id]?.active ?? (wf === 'sine');
        const isHighlighted = highlightedControls.includes(id);
        return (
          <div
            key={wf}
            className="flex flex-col items-center gap-0.5"
            data-control-id={id}
          >
            <LED on={isActive} color={DM_COLORS.ledGreen} size={LED_SIZE} />
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="opacity-60"
              style={isHighlighted ? { filter: 'drop-shadow(0 0 3px rgba(0,170,255,0.8))' } : undefined}
            >
              <path
                d={waveformPaths[wf]}
                fill="none"
                stroke={isActive ? DM_COLORS.ledGreen : DM_COLORS.inactiveIcon}
                strokeWidth="1.5"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

/* ───── Envelope Curve Icons ───── */
function EnvelopeCurveIcons({ panelState, highlightedControls }: {
  panelState: PanelState;
  highlightedControls: string[];
}) {
  const curves = [
    { id: 'env-curve-exp', path: 'M2,14 Q2,2 14,2', label: 'exp' },
    { id: 'env-curve-lin', path: 'M2,14 L14,2', label: 'lin' },
    { id: 'env-curve-rev', path: 'M2,14 Q14,14 14,2', label: 'rev' },
  ];

  return (
    <div className="flex flex-col gap-1 items-center">
      {curves.map((c) => {
        const isActive = panelState[c.id]?.active ?? (c.id === 'env-curve-exp');
        const isHighlighted = highlightedControls.includes(c.id);
        return (
          <div key={c.id} className="flex items-center gap-1" data-control-id={c.id}>
            <LED on={isActive} color={DM_COLORS.ledOrange} size={LED_SIZE} />
            <svg
              width="36"
              height="36"
              viewBox="0 0 16 16"
              style={isHighlighted ? { filter: 'drop-shadow(0 0 3px rgba(0,170,255,0.8))' } : undefined}
            >
              <path
                d={c.path}
                fill="none"
                stroke={isActive ? DM_COLORS.ledOrange : DM_COLORS.inactiveIcon}
                strokeWidth="1.5"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PANEL COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function DeepMindPanel({
  panelState,
  highlightedControls,
  onButtonClick,
}: DeepMindPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const hl = (id: string) => highlightedControls.includes(id);
  const ps = (id: string) => panelState[id];

  return (
    <div ref={containerRef} className="w-full h-full overflow-x-auto">
      <motion.div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width: PANEL_NATURAL_WIDTH,
          minWidth: PANEL_NATURAL_WIDTH,
          height: PANEL_NATURAL_HEIGHT,
          backgroundColor: DM_COLORS.body,
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.006) 2px, rgba(255,255,255,0.006) 3px), radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.1) 0%, transparent 60%)',
          boxShadow:
            '0 0 0 1px rgba(80,80,80,0.3), 0 2px 0 0 rgba(255,255,255,0.04) inset, 0 -2px 0 0 rgba(0,0,0,0.4) inset, 0 8px 32px rgba(0,0,0,0.6)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Red accent stripe along top edge (signature DeepMind design) */}
        <div
          className="absolute top-0 left-3 right-3 h-[3px] pointer-events-none z-30"
          style={{
            background: `linear-gradient(to bottom, ${DM_COLORS.sectionHeader}, ${DM_COLORS.sectionHeaderDark})`,
            boxShadow: `0 1px 4px ${DM_COLORS.sectionHeader}40`,
          }}
        />
        {/* Top bezel highlight */}
        <div
          className="absolute top-[3px] left-0 right-0 h-[1px] pointer-events-none z-30"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 95%)',
          }}
        />

        {/* Wood end cheeks */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3 z-20 pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${DM_COLORS.woodDark}, ${DM_COLORS.wood}, ${DM_COLORS.woodLight})`,
            borderRadius: '16px 0 0 16px',
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-3 z-20 pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${DM_COLORS.woodDark}, ${DM_COLORS.wood}, ${DM_COLORS.woodLight})`,
            borderRadius: '0 16px 16px 0',
          }}
        />

        <div className="relative z-10 flex flex-col h-full pl-5 pr-5 py-1.5">
          {/* ─── Branding bar ─── */}
          <div className="flex items-center justify-between mb-0.5 px-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-bold tracking-[0.3em]"
                style={{ color: DM_COLORS.brandingText, fontFamily: 'system-ui, sans-serif' }}
              >
                behringer
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[16px] font-bold tracking-wider"
                style={{ color: DM_COLORS.headerText, fontFamily: 'system-ui, sans-serif' }}
              >
                DeepMind 12
              </span>
            </div>
          </div>

          {/* ═══════ MAIN: PERF sidebar + right column ═══════ */}
          <div className="flex gap-0.5 flex-1 min-h-0">

            {/* ── SECTION: Performance (wheels + octave + volume + portamento) ── */}
            <div
              className="flex flex-col justify-between rounded-lg px-1 py-0.5"
              data-section-id="perf"
              style={{ width: 130, flexShrink: 0, background: DM_COLORS.sectionBgDeep, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              {/* Top: Octave LEDs + buttons */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[7px] text-gray-500 font-bold tracking-wider uppercase leading-none">OCTAVE</span>
                </div>
                <div className="flex items-center gap-1">
                  {[-2, -1, 0, 1, 2].map((oct) => (
                    <div key={oct} className="flex flex-col items-center gap-0.5">
                      <span className="text-[6px] text-gray-500 leading-none">{oct}</span>
                      <LED on={oct === 0} color={DM_COLORS.ledGreen} size={LED_SIZE} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <PanelButton
                    id="oct-down"
                    label="OCT ▼"
                    variant="function"
                    size="sm"
                    active={ps('oct-down')?.active ?? false}
                    highlighted={hl('oct-down')}
                    onClick={() => onButtonClick?.('oct-down')}
                  />
                  <PanelButton
                    id="oct-up"
                    label="OCT ▲"
                    variant="function"
                    size="sm"
                    active={ps('oct-up')?.active ?? false}
                    highlighted={hl('oct-up')}
                    onClick={() => onButtonClick?.('oct-up')}
                  />
                </div>
              </div>
              {/* Middle: Volume + Portamento knobs */}
              <div className="flex items-center justify-center gap-2">
                <Knob
                  id="volume"
                  label="VOLUME"
                  value={ps('volume')?.value ?? 100}
                  highlighted={hl('volume')}
                  size="md"
                />
                <Knob
                  id="portamento"
                  label="PORTAMENTO"
                  value={ps('portamento')?.value ?? 0}
                  highlighted={hl('portamento')}
                  size="md"
                />
              </div>
              {/* Bottom: Wheels */}
              <div className="flex items-end justify-center gap-2">
                <Wheel
                  id="pitch-bend"
                  label="PITCH"
                  value={ps('pitch-bend')?.value ?? 64}
                  highlighted={hl('pitch-bend')}
                  width={WHEEL_WIDTH}
                  height={WHEEL_HEIGHT}
                />
                <Wheel
                  id="mod-wheel"
                  label="MOD"
                  value={ps('mod-wheel')?.value ?? 0}
                  highlighted={hl('mod-wheel')}
                  width={WHEEL_WIDTH}
                  height={WHEEL_HEIGHT}
                />
              </div>
            </div>

            {/* Right column: sections + VOICES + keyboard */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Control surface sections */}
              <div className="flex items-stretch gap-0.5 flex-1 min-h-0">

            {/* ── SECTION: ARP/SEQ ── */}
            <div className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="arp"
              style={{ flex: `${SECTION_FLEX.arp} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="ARP/SEQ" />
              <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'arp-chord', label: 'CHORD' },
                    { id: 'arp-poly', label: 'POLY CHORD' },
                  ].map((b) => (
                    <PanelButton key={b.id} id={b.id} label={b.label} variant="function" size="sm"
                      active={ps(b.id)?.active ?? false} highlighted={hl(b.id)}
                      hasLed ledOn={ps(b.id)?.ledOn ?? false} ledColor={DM_COLORS.ledGreen}
                      labelPosition="above" onClick={() => onButtonClick?.(b.id)} />
                  ))}
                </div>
                <div className="flex items-end gap-1">
                  <Slider id="arp-rate" label="RATE" value={ps('arp-rate')?.value ?? 64}
                    highlighted={hl('arp-rate')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="arp-gate" label="GATE TIME" value={ps('arp-gate')?.value ?? 64}
                    highlighted={hl('arp-gate')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  {[
                    { id: 'arp-on', label: 'ON/OFF', hasLed: true },
                    { id: 'arp-tap', label: 'TAP/HOLD' },
                    { id: 'arp-edit', label: 'EDIT' },
                  ].map((b) => (
                    <PanelButton key={b.id} id={b.id} label={b.label} variant="function" size="sm"
                      active={ps(b.id)?.active ?? false} highlighted={hl(b.id)}
                      {...(b.hasLed ? { hasLed: true, ledOn: ps(b.id)?.ledOn ?? false, ledColor: DM_COLORS.ledGreen } : {})}
                      labelPosition="above" onClick={() => onButtonClick?.(b.id)} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── SECTION: LFO 1 ── */}
            <div className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="lfo1"
              style={{ flex: `${SECTION_FLEX.lfo1} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="LFO 1" />
              <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
                {/* Rate indicator + waveforms grouped tight */}
                <div className="flex flex-col items-center gap-px">
                  <div className="flex items-center gap-1">
                    <LED on={ps('lfo1-rate-led')?.ledOn ?? true} color={DM_COLORS.ledGreen} size={LED_SIZE_LARGE} />
                    <span className="text-[6px] text-gray-500 uppercase tracking-wider leading-none">Rate</span>
                  </div>
                  <WaveformLEDs prefix="lfo1" panelState={panelState} highlightedControls={highlightedControls} />
                </div>
                <div className="flex items-end gap-1">
                  <Slider id="lfo1-rate" label="RATE" value={ps('lfo1-rate')?.value ?? 64}
                    highlighted={hl('lfo1-rate')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="lfo1-delay" label="DELAY TIME" value={ps('lfo1-delay')?.value ?? 0}
                    highlighted={hl('lfo1-delay')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  <PanelButton id="lfo1-sync" label="SYNC" variant="function" size="sm"
                    active={ps('lfo1-sync')?.active ?? false} highlighted={hl('lfo1-sync')}
                    hasLed ledOn={ps('lfo1-sync')?.ledOn ?? false} ledColor={DM_COLORS.ledGreen}
                    labelPosition="above" onClick={() => onButtonClick?.('lfo1-sync')} />
                  <PanelButton id="lfo1-edit" label="EDIT" variant="function" size="sm"
                    active={ps('lfo1-edit')?.active ?? false} highlighted={hl('lfo1-edit')}
                    labelPosition="above" onClick={() => onButtonClick?.('lfo1-edit')} />
                </div>
              </div>
            </div>

            {/* ── SECTION: LFO 2 ── */}
            <div className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="lfo2"
              style={{ flex: `${SECTION_FLEX.lfo2} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="LFO 2" />
              <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
                {/* Rate indicator + waveforms grouped tight */}
                <div className="flex flex-col items-center gap-px">
                  <div className="flex items-center gap-1">
                    <LED on={ps('lfo2-rate-led')?.ledOn ?? true} color={DM_COLORS.ledGreen} size={LED_SIZE_LARGE} />
                    <span className="text-[6px] text-gray-500 uppercase tracking-wider leading-none">Rate</span>
                  </div>
                  <WaveformLEDs prefix="lfo2" panelState={panelState} highlightedControls={highlightedControls} />
                </div>
                <div className="flex items-end gap-1">
                  <Slider id="lfo2-rate" label="RATE" value={ps('lfo2-rate')?.value ?? 64}
                    highlighted={hl('lfo2-rate')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="lfo2-delay" label="DELAY TIME" value={ps('lfo2-delay')?.value ?? 0}
                    highlighted={hl('lfo2-delay')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  <PanelButton id="lfo2-sync" label="SYNC" variant="function" size="sm"
                    active={ps('lfo2-sync')?.active ?? false} highlighted={hl('lfo2-sync')}
                    hasLed ledOn={ps('lfo2-sync')?.ledOn ?? false} ledColor={DM_COLORS.ledGreen}
                    labelPosition="above" onClick={() => onButtonClick?.('lfo2-sync')} />
                  <PanelButton id="lfo2-edit" label="EDIT" variant="function" size="sm"
                    active={ps('lfo2-edit')?.active ?? false} highlighted={hl('lfo2-edit')}
                    labelPosition="above" onClick={() => onButtonClick?.('lfo2-edit')} />
                </div>
              </div>
            </div>

            {/* ── SECTION: OSC 1 & 2 ── */}
            <div className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="osc"
              style={{ flex: `${SECTION_FLEX.osc} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="OSC 1&2" />
              <div className="flex flex-col gap-0.5 px-1 py-0.5 flex-1">
                {/* Sub-section labels */}
                <div className="flex items-center gap-3">
                  <span className="text-[7px] text-gray-500 font-bold tracking-wider leading-none">OSC 1</span>
                  <span className="text-[7px] text-gray-500 font-bold tracking-wider ml-auto leading-none">OSC 2</span>
                </div>
                {/* All sliders in single row with waveform buttons interspersed */}
                <div className="flex items-end gap-1">
                  {/* OSC 1 controls */}
                  <Slider id="osc1-pitch-mod" label="PITCH MOD" value={ps('osc1-pitch-mod')?.value ?? 0}
                    highlighted={hl('osc1-pitch-mod')} trackHeight={SLIDER_TRACK_HEIGHT_OSC} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <div className="flex flex-col items-center gap-1 self-start mt-4">
                    <PanelButton id="osc1-square" label="SQUARE" variant="function" size="sm"
                      active={ps('osc1-square')?.active ?? false} highlighted={hl('osc1-square')}
                      hasLed ledOn={ps('osc1-square')?.ledOn ?? true} ledColor={DM_COLORS.ledGreen}
                      labelPosition="above" onClick={() => onButtonClick?.('osc1-square')} />
                  </div>
                  <Slider id="osc1-pwm" label="PWM" value={ps('osc1-pwm')?.value ?? 0}
                    highlighted={hl('osc1-pwm')} trackHeight={SLIDER_TRACK_HEIGHT_OSC} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <div className="flex flex-col items-center gap-1 self-start mt-4">
                    <PanelButton id="osc1-saw" label="SAWTOOTH" variant="function" size="sm"
                      active={ps('osc1-saw')?.active ?? false} highlighted={hl('osc1-saw')}
                      hasLed ledOn={ps('osc1-saw')?.ledOn ?? true} ledColor={DM_COLORS.ledGreen}
                      labelPosition="above" onClick={() => onButtonClick?.('osc1-saw')} />
                  </div>
                  {/* Divider */}
                  <div className="w-px self-center opacity-20" style={{ height: OSC_DIVIDER_HEIGHT, backgroundColor: DM_COLORS.labelDim }} />
                  {/* OSC 2 controls */}
                  <Slider id="osc2-tone-mod" label="TONE MOD" value={ps('osc2-tone-mod')?.value ?? 0}
                    highlighted={hl('osc2-tone-mod')} trackHeight={SLIDER_TRACK_HEIGHT_OSC} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="osc2-pitch" label="PITCH" value={ps('osc2-pitch')?.value ?? 64}
                    highlighted={hl('osc2-pitch')} trackHeight={SLIDER_TRACK_HEIGHT_OSC} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="osc2-level" label="LEVEL" value={ps('osc2-level')?.value ?? 100}
                    highlighted={hl('osc2-level')} trackHeight={SLIDER_TRACK_HEIGHT_OSC} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="osc-noise" label="NOISE LEVEL" value={ps('osc-noise')?.value ?? 0}
                    highlighted={hl('osc-noise')} trackHeight={SLIDER_TRACK_HEIGHT_OSC} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  <PanelButton id="osc-sync" label="SYNC" variant="function" size="sm"
                    active={ps('osc-sync')?.active ?? false} highlighted={hl('osc-sync')}
                    hasLed ledOn={ps('osc-sync')?.ledOn ?? false} ledColor={DM_COLORS.ledRed}
                    labelPosition="above" onClick={() => onButtonClick?.('osc-sync')} />
                  <PanelButton id="osc-edit" label="EDIT" variant="function" size="sm"
                    active={ps('osc-edit')?.active ?? false} highlighted={hl('osc-edit')}
                    labelPosition="above" onClick={() => onButtonClick?.('osc-edit')} />
                </div>
              </div>
            </div>

            {/* ── SECTION: PROGRAMMER (Display + Navigation) ── */}
            <div
              className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="prog"
              style={{ flex: `${SECTION_FLEX.prog} 1 0%`, minWidth: PROGRAMMER_MIN_WIDTH, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="PROGRAMMER" />
              <div className="flex flex-col items-center justify-between gap-1 px-1.5 py-0.5 flex-1">
                {/* Display + Navigation + Data Entry row */}
                <div className="flex items-stretch gap-2">
                  {/* LCD Display + menu buttons directly below (matches hardware layout) */}
                  <div className="flex flex-col items-center gap-1">
                    <DeepMindDisplay highlighted={hl('display')} />
                    {/* Menu buttons row — directly below display like real hardware */}
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'prog', label: 'PROG', defaultActive: true, color: DM_COLORS.buttonOrange },
                        { id: 'fx', label: 'FX', color: DM_COLORS.buttonOrange },
                        { id: 'global', label: 'GLOBAL' },
                        { id: 'compare', label: 'COMPARE' },
                        { id: 'write', label: 'WRITE' },
                      ].map((b) => (
                        <PanelButton
                          key={b.id}
                          id={b.id}
                          label={b.label}
                          variant="menu"
                          size="sm"
                          active={ps(b.id)?.active ?? (b.defaultActive ?? false)}
                          highlighted={hl(b.id)}
                          hasLed
                          ledOn={ps(b.id)?.ledOn ?? (b.defaultActive ?? false)}
                          ledColor={b.color ?? DM_COLORS.ledGreen}
                          labelPosition="above"
                          onClick={() => onButtonClick?.(b.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Navigation cluster (Bank/Up, -/No + Knob + +/Yes, Bank/Down) */}
                  <div className="flex flex-col items-center justify-between">
                    <PanelButton id="bank-up" label="BANK/UP" variant="function" size="sm"
                      active={ps('bank-up')?.active ?? false} highlighted={hl('bank-up')}
                      labelPosition="above" onClick={() => onButtonClick?.('bank-up')} />
                    <div className="flex items-center gap-2">
                      <PanelButton id="nav-no" label="-/NO" variant="function" size="sm"
                        active={ps('nav-no')?.active ?? false} highlighted={hl('nav-no')}
                        onClick={() => onButtonClick?.('nav-no')} />
                      <Knob id="data-entry-knob" label="DATA ENTRY" value={ps('data-entry-knob')?.value ?? 64}
                        highlighted={hl('data-entry-knob')} outerSize={46} />
                      <PanelButton id="nav-yes" label="+/YES" variant="function" size="sm"
                        active={ps('nav-yes')?.active ?? false} highlighted={hl('nav-yes')}
                        onClick={() => onButtonClick?.('nav-yes')} />
                    </div>
                    <PanelButton id="bank-down" label="BANK/DOWN" variant="function" size="sm"
                      active={ps('bank-down')?.active ?? false} highlighted={hl('bank-down')}
                      labelPosition="below" onClick={() => onButtonClick?.('bank-down')} />
                  </div>

                  {/* Data entry slider + Mod (standalone right column) */}
                  <div className="flex flex-col items-center gap-1">
                    <Slider id="data-entry-slider" label="DATA ENTRY" value={ps('data-entry-slider')?.value ?? 64}
                      highlighted={hl('data-entry-slider')} trackHeight={SLIDER_TRACK_HEIGHT_DATA} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                    <PanelButton id="mod-btn" label="MOD" variant="function" size="sm"
                      active={ps('mod-btn')?.active ?? false} highlighted={hl('mod-btn')}
                      labelPosition="above" onClick={() => onButtonClick?.('mod-btn')} />
                  </div>
                </div>

                {/* Subtitle — sits just below controls, matching hardware panel face */}
                <span
                  className="text-[7px] tracking-[0.2em] font-bold mt-1"
                  style={{ color: DM_COLORS.subtitleText }}
                >
                  ANALOG 12-VOICE POLYPHONIC SYNTHESIZER
                </span>
              </div>
            </div>

            {/* ── SECTION: POLY ── */}
            <div className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="poly"
              style={{ flex: `${SECTION_FLEX.poly} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="POLY" />
              <div className="flex flex-col items-center gap-1 px-1 py-0.5 flex-1">
                <Slider id="poly-detune" label="UNISON DETUNE" value={ps('poly-detune')?.value ?? 0}
                  highlighted={hl('poly-detune')} trackHeight={SLIDER_TRACK_HEIGHT_POLY} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                <div className="mt-auto">
                  <PanelButton id="poly-edit" label="EDIT" variant="function" size="sm"
                    active={ps('poly-edit')?.active ?? false} highlighted={hl('poly-edit')}
                    labelPosition="above" onClick={() => onButtonClick?.('poly-edit')} />
                </div>
              </div>
            </div>

            {/* ── SECTION: VCF ── */}
            <div className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="vcf"
              style={{ flex: `${SECTION_FLEX.vcf} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="VCF" />
              <div className="flex flex-col items-center gap-1 px-1 py-0.5 flex-1">
                <div className="flex items-end gap-1">
                  <Slider id="vcf-freq" label="FREQ" value={ps('vcf-freq')?.value ?? 127}
                    highlighted={hl('vcf-freq')} trackHeight={SLIDER_TRACK_HEIGHT_VCF} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="vcf-res" label="RES" value={ps('vcf-res')?.value ?? 0}
                    highlighted={hl('vcf-res')} trackHeight={SLIDER_TRACK_HEIGHT_VCF} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="vcf-env" label="ENV" value={ps('vcf-env')?.value ?? 64}
                    highlighted={hl('vcf-env')} trackHeight={SLIDER_TRACK_HEIGHT_VCF} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="vcf-lfo" label="LFO" value={ps('vcf-lfo')?.value ?? 0}
                    highlighted={hl('vcf-lfo')} trackHeight={SLIDER_TRACK_HEIGHT_VCF} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="vcf-kybd" label="KYBD" value={ps('vcf-kybd')?.value ?? 64}
                    highlighted={hl('vcf-kybd')} trackHeight={SLIDER_TRACK_HEIGHT_VCF} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  <PanelButton id="vcf-2pole" label="2-POLE" variant="function" size="sm"
                    active={ps('vcf-2pole')?.active ?? false} highlighted={hl('vcf-2pole')}
                    hasLed ledOn={ps('vcf-2pole')?.ledOn ?? false} ledColor={DM_COLORS.ledGreen}
                    labelPosition="above" onClick={() => onButtonClick?.('vcf-2pole')} />
                  <PanelButton id="vcf-edit" label="EDIT" variant="function" size="sm"
                    active={ps('vcf-edit')?.active ?? false} highlighted={hl('vcf-edit')}
                    labelPosition="above" onClick={() => onButtonClick?.('vcf-edit')} />
                  <PanelButton id="vcf-invert" label="INVERT" variant="function" size="sm"
                    active={ps('vcf-invert')?.active ?? false} highlighted={hl('vcf-invert')}
                    hasLed ledOn={ps('vcf-invert')?.ledOn ?? false} ledColor={DM_COLORS.ledRed}
                    labelPosition="above" onClick={() => onButtonClick?.('vcf-invert')} />
                </div>
              </div>
            </div>

            {/* ── SECTION: VCA ── */}
            <div className="flex flex-col items-center rounded-lg self-stretch min-w-0"
              data-section-id="vca"
              style={{ flex: `${SECTION_FLEX.vca} 1 0%`, minWidth: SINGLE_SLIDER_SECTION_MIN_WIDTH, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="VCA" />
              <div className="flex flex-col items-center gap-1 px-0.5 py-0.5 flex-1">
                <Slider id="vca-level" label="LEVEL" value={ps('vca-level')?.value ?? 100}
                  highlighted={hl('vca-level')} trackHeight={SLIDER_TRACK_HEIGHT_VCA} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                <div className="mt-auto">
                  <PanelButton id="vca-edit" label="EDIT" variant="function" size="sm"
                    active={ps('vca-edit')?.active ?? false} highlighted={hl('vca-edit')}
                    labelPosition="above" onClick={() => onButtonClick?.('vca-edit')} />
                </div>
              </div>
            </div>

            {/* ── SECTION: HPF ── */}
            <div className="flex flex-col items-center rounded-lg self-stretch min-w-0"
              data-section-id="hpf"
              style={{ flex: `${SECTION_FLEX.hpf} 1 0%`, minWidth: SINGLE_SLIDER_SECTION_MIN_WIDTH, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="HPF" colorTop={DM_COLORS.hpfHeader} colorBottom={DM_COLORS.hpfHeaderDark} />
              <div className="flex flex-col items-center gap-1 px-0.5 py-0.5 flex-1">
                <Slider id="hpf-freq" label="FREQ" value={ps('hpf-freq')?.value ?? 0}
                  highlighted={hl('hpf-freq')} trackHeight={SLIDER_TRACK_HEIGHT_TALL} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                <div className="mt-auto">
                  <PanelButton id="hpf-boost" label="BOOST" variant="function" size="sm"
                    active={ps('hpf-boost')?.active ?? false} highlighted={hl('hpf-boost')}
                    hasLed ledOn={ps('hpf-boost')?.ledOn ?? false} ledColor={DM_COLORS.ledOrange}
                    labelPosition="above" onClick={() => onButtonClick?.('hpf-boost')} />
                </div>
              </div>
            </div>

            {/* ── SECTION: ENVELOPES ── */}
            <div className="flex flex-col items-center rounded-lg min-w-0"
              data-section-id="env"
              style={{ flex: `${SECTION_FLEX.env} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
            >
              <SectionHeader label="ENVELOPES" />
              <div className="flex flex-col gap-0.5 px-1 py-0.5 flex-1">
                {/* Top row: ADSR sliders + curve icons column on far right */}
                <div className="flex items-end gap-1 flex-1">
                  <Slider id="env-attack" label="A" value={ps('env-attack')?.value ?? 0}
                    highlighted={hl('env-attack')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="env-decay" label="D" value={ps('env-decay')?.value ?? 40}
                    highlighted={hl('env-decay')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="env-sustain" label="S" value={ps('env-sustain')?.value ?? 80}
                    highlighted={hl('env-sustain')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  <Slider id="env-release" label="R" value={ps('env-release')?.value ?? 30}
                    highlighted={hl('env-release')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} showScale />
                  {/* Curve shape icons — far right column per hardware */}
                  <EnvelopeCurveIcons panelState={panelState} highlightedControls={highlightedControls} />
                </div>
                {/* Bottom row: VCA, VCF, MOD, CURVES buttons in horizontal row per hardware */}
                <div className="flex items-center justify-evenly gap-1">
                  {[
                    { id: 'env-vca', label: 'VCA', defaultActive: true },
                    { id: 'env-vcf', label: 'VCF' },
                    { id: 'env-mod', label: 'MOD' },
                    { id: 'env-curves', label: 'CURVES' },
                  ].map((b) => (
                    <PanelButton key={b.id} id={b.id} label={b.label} variant="function" size="sm"
                      active={ps(b.id)?.active ?? (b.defaultActive ?? false)} highlighted={hl(b.id)}
                      hasLed ledOn={ps(b.id)?.ledOn ?? (b.defaultActive ?? false)}
                      ledColor={DM_COLORS.ledOrange}
                      labelPosition="above" onClick={() => onButtonClick?.(b.id)} />
                  ))}
                </div>
              </div>
            </div>

              </div>

              {/* ═══════ VOICES LED strip (manual item 13) — spans POLY→ENV per hardware ═══════ */}
              <div className="flex items-center justify-evenly gap-2 mt-0.5 ml-auto pr-1" style={{ minWidth: 720 }}>
                <span className="text-[8px] text-gray-400 font-bold tracking-[0.15em] leading-none mr-0.5">VOICES</span>
                {Array.from({ length: 12 }, (_, i) => {
                  const id = `voice-${i + 1}`;
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5" data-control-id={id}>
                      <LED on={ps(id)?.ledOn ?? false} color={DM_COLORS.ledGreen} size={12} />
                      <span className="text-[6px] text-gray-500 leading-none">{i + 1}</span>
                    </div>
                  );
                })}
              </div>

              {/* ═══════ Keyboard ═══════ */}
              <div className="w-full mt-0.5">
                <DeepMindKeyboard highlightedKeys={[]} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
