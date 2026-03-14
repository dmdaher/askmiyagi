'use client';

import { PanelState } from '@/types/panel';
import { DisplayState } from '@/types/display';
import Slider from '@/components/controls/Slider';
import PanelButton from '@/components/controls/PanelButton';
import Knob from '@/components/controls/Knob';
import DeepMindDisplay from './DeepMindDisplay';
import DeepMindKeyboard from './DeepMindKeyboard';
import {
  DM_PANEL_WIDTH,
  DM_PANEL_HEIGHT,
  DM_CONTROL_SURFACE_HEIGHT,
  DM_PERF_WIDTH,
  DM_VOICES_HEIGHT,
  DM_COLORS,
  SECTION_FLEX,
  SLIDER_TRACK_HEIGHT,
  SLIDER_TRACK_HEIGHT_ENV,
  SLIDER_TRACK_WIDTH,
  LFO_WAVEFORMS,
  ENV_CURVES,
} from '@/lib/devices/deepmind-12-constants';

interface DeepMindPanelProps {
  panelState: PanelState;
  displayState: DisplayState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

/* ─── Helpers ─── */
function SectionHeader({ label, variant }: { label: string; variant?: 'default' | 'blue' }) {
  const isBlue = variant === 'blue';
  return (
    <div
      className="text-center py-0.5 px-1 tracking-widest uppercase font-bold select-none"
      style={{
        fontSize: 9,
        color: isBlue ? '#b0d0ff' : DM_COLORS.headerText,
        background: isBlue
          ? 'linear-gradient(to bottom, #1a2a4a, #111111)'
          : `linear-gradient(to bottom, ${DM_COLORS.headerBg}, ${DM_COLORS.sectionBg})`,
        borderBottom: `1px solid ${isBlue ? '#2a3a5a' : DM_COLORS.sectionBorder}`,
        lineHeight: 1.2,
      }}
    >
      {label}
    </div>
  );
}

function LfoWaveformIcons({ sectionId, panelState, highlightedControls }: { sectionId: string; panelState: PanelState; highlightedControls: string[] }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      {LFO_WAVEFORMS.map((w) => {
        const id = `${sectionId}-wave-${w.id}`;
        const isActive = panelState[id]?.ledOn;
        return (
          <div key={id} data-control-id={id} className="flex items-center justify-center" style={{ width: 16, height: 12 }}>
            <svg width="16" height="12" viewBox="0 0 16 16">
              <path
                d={w.path}
                fill="none"
                stroke={isActive ? DM_COLORS.ledGreen : '#333'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

function EnvelopeCurveIcons({ panelState, highlightedControls }: { panelState: PanelState; highlightedControls: string[] }) {
  return (
    <div className="flex flex-col items-center gap-1 justify-center px-0.5">
      {ENV_CURVES.map((c) => {
        const id = `env-curve-${c.id}`;
        const isActive = panelState[id]?.ledOn;
        return (
          <div key={id} data-control-id={id} className="flex items-center justify-center" style={{ width: 18, height: 16 }}>
            <svg width="18" height="16" viewBox="0 0 16 16">
              <path
                d={c.path}
                fill="none"
                stroke={isActive ? DM_COLORS.ledOrange : '#333'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

function WheelControl({ id, label, highlighted }: { id: string; label: string; highlighted: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5" data-control-id={id}>
      <div
        className="relative rounded-md cursor-pointer"
        style={{
          width: 30,
          height: 80,
          background: `linear-gradient(to right, #1a1a1a, #222, #1a1a1a)`,
          border: '1px solid #333',
          boxShadow: highlighted
            ? '0 0 12px 4px rgba(0,170,255,0.6)'
            : 'inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Wheel center indicator */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: 22,
            height: 6,
            top: '50%',
            marginTop: -3,
            background: 'linear-gradient(to bottom, #555, #333)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
        {/* Grip lines */}
        {[25, 40, 60, 75].map((pct) => (
          <div
            key={pct}
            className="absolute left-1 right-1"
            style={{ top: `${pct}%`, height: 1, background: 'rgba(255,255,255,0.06)' }}
          />
        ))}
      </div>
      <span style={{ fontSize: 7, color: DM_COLORS.labelText, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Main Panel ─── */
export default function DeepMindPanel({
  panelState,
  displayState,
  highlightedControls,
  onButtonClick,
}: DeepMindPanelProps) {
  const ps = (id: string) => panelState[id];
  const hl = (id: string) => highlightedControls.includes(id);

  return (
    <div
      className="relative flex select-none"
      style={{
        width: DM_PANEL_WIDTH,
        height: DM_PANEL_HEIGHT,
        background: DM_COLORS.panelBg,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        borderRadius: 6,
        border: `1px solid #222`,
      }}
    >
      {/* ══════════════════════════════════════════════════
          PERF SECTION — full height, left side
          ══════════════════════════════════════════════════ */}
      <div
        className="flex flex-col items-center shrink-0"
        data-section-id="perf"
        style={{
          width: DM_PERF_WIDTH,
          background: DM_COLORS.sectionBg,
          borderRight: `1px solid ${DM_COLORS.sectionBorder}`,
          padding: '4px 4px 8px',
        }}
      >
        {/* Brand */}
        <div className="text-center py-1 mb-1" style={{ fontSize: 7, color: DM_COLORS.brandText, letterSpacing: '0.15em' }}>
          behringer
        </div>

        {/* Octave LEDs */}
        <div className="flex gap-1 mb-2" data-control-id="octave-leds">
          {[-2, -1, 0, 1, 2].map((oct) => (
            <div
              key={oct}
              className="rounded-full"
              style={{
                width: 5,
                height: 5,
                background: oct === 0 ? DM_COLORS.ledGreen : DM_COLORS.ledOff,
                boxShadow: oct === 0 ? `0 0 4px ${DM_COLORS.ledGreen}` : 'none',
              }}
            />
          ))}
        </div>

        {/* Portamento knob */}
        <Knob
          id="perf-portamento"
          label="PORT"
          value={ps('perf-portamento')?.value ?? 0}
          highlighted={hl('perf-portamento')}
          outerSize={34}
        />

        {/* Volume knob */}
        <div className="my-1">
          <Knob
            id="perf-volume"
            label="VOLUME"
            value={ps('perf-volume')?.value ?? 100}
            highlighted={hl('perf-volume')}
            outerSize={38}
          />
        </div>

        {/* Octave buttons */}
        <div className="flex gap-1 mb-1">
          <PanelButton id="perf-oct-down" label="OCT -" variant="function" size="sm"
            highlighted={hl('perf-oct-down')} onClick={() => onButtonClick?.('perf-oct-down')} />
          <PanelButton id="perf-oct-up" label="OCT +" variant="function" size="sm"
            highlighted={hl('perf-oct-up')} onClick={() => onButtonClick?.('perf-oct-up')} />
        </div>

        {/* Spacer to push wheels down */}
        <div className="flex-1" />

        {/* Pitch & Mod wheels */}
        <div className="flex gap-2 mt-1">
          <WheelControl id="perf-pitch" label="PITCH" highlighted={hl('perf-pitch')} />
          <WheelControl id="perf-mod" label="MOD" highlighted={hl('perf-mod')} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN AREA — control surface + voices + keyboard
          ══════════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── CONTROL SURFACE ROW ── */}
        <div className="flex min-w-0" style={{ height: DM_CONTROL_SURFACE_HEIGHT }}>

          {/* ── SECTION: ARP/SEQ ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="arp"
            style={{ flex: `${SECTION_FLEX.arp} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="ARP / SEQ" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              {/* Top row: CHORD, POLY CHORD buttons — HORIZONTAL */}
              <div className="flex items-center gap-1">
                <PanelButton id="arp-chord" label="CHORD" variant="function" size="sm"
                  active={ps('arp-chord')?.active} highlighted={hl('arp-chord')}
                  hasLed ledOn={ps('arp-chord')?.ledOn} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('arp-chord')} />
                <PanelButton id="arp-poly-chord" label="POLY CHORD" variant="function" size="sm"
                  active={ps('arp-poly-chord')?.active} highlighted={hl('arp-poly-chord')}
                  hasLed ledOn={ps('arp-poly-chord')?.ledOn} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('arp-poly-chord')} />
              </div>
              {/* Middle: RATE, GATE TIME sliders — HORIZONTAL */}
              <div className="flex items-end gap-1 flex-1">
                <Slider id="arp-rate" label="RATE" value={ps('arp-rate')?.value ?? 64}
                  highlighted={hl('arp-rate')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="arp-gate-time" label="GATE" value={ps('arp-gate-time')?.value ?? 80}
                  highlighted={hl('arp-gate-time')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              {/* Bottom row: ON/OFF, TAP/HOLD, EDIT buttons — HORIZONTAL */}
              <div className="flex items-center gap-0.5">
                {[
                  { id: 'arp-on-off', label: 'ON/OFF' },
                  { id: 'arp-tap-hold', label: 'TAP' },
                  { id: 'arp-edit', label: 'EDIT' },
                ].map((b) => (
                  <PanelButton key={b.id} id={b.id} label={b.label} variant="function" size="sm"
                    active={ps(b.id)?.active} highlighted={hl(b.id)}
                    hasLed ledOn={ps(b.id)?.ledOn} ledColor={DM_COLORS.ledOrange}
                    labelPosition="above" onClick={() => onButtonClick?.(b.id)} />
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION: LFO 1 ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="lfo1"
            style={{ flex: `${SECTION_FLEX.lfo1} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="LFO 1" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              {/* Waveform LEDs */}
              <LfoWaveformIcons sectionId="lfo1" panelState={panelState} highlightedControls={highlightedControls} />
              {/* Sliders: RATE, DELAY — HORIZONTAL */}
              <div className="flex items-end gap-1 flex-1">
                <Slider id="lfo1-rate" label="RATE" value={ps('lfo1-rate')?.value ?? 40}
                  highlighted={hl('lfo1-rate')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="lfo1-delay" label="DELAY" value={ps('lfo1-delay')?.value ?? 0}
                  highlighted={hl('lfo1-delay')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              {/* EDIT button */}
              <PanelButton id="lfo1-edit" label="EDIT" variant="function" size="sm"
                active={ps('lfo1-edit')?.active} highlighted={hl('lfo1-edit')}
                hasLed ledOn={ps('lfo1-edit')?.ledOn} ledColor={DM_COLORS.ledOrange}
                labelPosition="above" onClick={() => onButtonClick?.('lfo1-edit')} />
            </div>
          </div>

          {/* ── SECTION: LFO 2 ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="lfo2"
            style={{ flex: `${SECTION_FLEX.lfo2} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="LFO 2" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              <LfoWaveformIcons sectionId="lfo2" panelState={panelState} highlightedControls={highlightedControls} />
              <div className="flex items-end gap-1 flex-1">
                <Slider id="lfo2-rate" label="RATE" value={ps('lfo2-rate')?.value ?? 40}
                  highlighted={hl('lfo2-rate')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="lfo2-delay" label="DELAY" value={ps('lfo2-delay')?.value ?? 0}
                  highlighted={hl('lfo2-delay')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              <PanelButton id="lfo2-edit" label="EDIT" variant="function" size="sm"
                active={ps('lfo2-edit')?.active} highlighted={hl('lfo2-edit')}
                hasLed ledOn={ps('lfo2-edit')?.ledOn} ledColor={DM_COLORS.ledOrange}
                labelPosition="above" onClick={() => onButtonClick?.('lfo2-edit')} />
            </div>
          </div>

          {/* ── SECTION: OSC 1 & 2 ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="osc"
            style={{ flex: `${SECTION_FLEX.osc} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="OSC 1 & 2" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              {/* Top: waveform select buttons — HORIZONTAL */}
              <div className="flex items-center gap-1">
                <PanelButton id="osc-square" label="□" variant="function" size="sm"
                  active={ps('osc-square')?.active} highlighted={hl('osc-square')}
                  hasLed ledOn={ps('osc-square')?.ledOn ?? true} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('osc-square')} />
                <PanelButton id="osc-sawtooth" label="⊿" variant="function" size="sm"
                  active={ps('osc-sawtooth')?.active} highlighted={hl('osc-sawtooth')}
                  hasLed ledOn={ps('osc-sawtooth')?.ledOn ?? true} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('osc-sawtooth')} />
              </div>
              {/* Sliders row: PWM, PITCH MOD, TONE MOD, PITCH, LEVEL, NOISE — HORIZONTAL */}
              <div className="flex items-end gap-0.5 flex-1">
                <Slider id="osc-pwm" label="PWM" value={ps('osc-pwm')?.value ?? 64}
                  highlighted={hl('osc-pwm')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="osc-pitch-mod" label="P.MOD" value={ps('osc-pitch-mod')?.value ?? 0}
                  highlighted={hl('osc-pitch-mod')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="osc-tone-mod" label="T.MOD" value={ps('osc-tone-mod')?.value ?? 0}
                  highlighted={hl('osc-tone-mod')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="osc-pitch" label="PITCH" value={ps('osc-pitch')?.value ?? 64}
                  highlighted={hl('osc-pitch')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="osc-level" label="LEVEL" value={ps('osc-level')?.value ?? 100}
                  highlighted={hl('osc-level')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="osc-noise" label="NOISE" value={ps('osc-noise')?.value ?? 0}
                  highlighted={hl('osc-noise')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              {/* Bottom row: SYNC + EDIT buttons — HORIZONTAL */}
              <div className="flex items-center gap-0.5">
                <PanelButton id="osc-sync" label="SYNC" variant="function" size="sm"
                  active={ps('osc-sync')?.active} highlighted={hl('osc-sync')}
                  hasLed ledOn={ps('osc-sync')?.ledOn} ledColor={DM_COLORS.ledRed}
                  labelPosition="above" onClick={() => onButtonClick?.('osc-sync')} />
                <PanelButton id="osc-edit" label="EDIT" variant="function" size="sm"
                  active={ps('osc-edit')?.active} highlighted={hl('osc-edit')}
                  hasLed ledOn={ps('osc-edit')?.ledOn} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('osc-edit')} />
              </div>
            </div>
          </div>

          {/* ── SECTION: PROGRAMMER ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="prog"
            style={{ flex: `${SECTION_FLEX.prog} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <div className="flex flex-col items-center gap-0.5 px-2 py-1 flex-1 w-full">
              {/* Top area: display + nav + data entry */}
              <div className="flex gap-2 w-full flex-1">
                {/* Left column: DATA ENTRY slider + rotary knob */}
                <div className="flex flex-col items-center gap-1">
                  <Slider id="prog-data-entry" label="DATA" value={ps('prog-data-entry')?.value ?? 64}
                    highlighted={hl('prog-data-entry')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                  <Knob id="prog-rotary" label="" value={ps('prog-rotary')?.value ?? 64}
                    highlighted={hl('prog-rotary')} outerSize={28} />
                </div>

                {/* Center: Display */}
                <div className="flex-1 flex flex-col items-center">
                  <DeepMindDisplay displayState={displayState} highlighted={hl('display')} />
                  {/* Navigation buttons */}
                  <div className="flex items-center gap-0.5 mt-1">
                    <PanelButton id="prog-nav-up" label="▲" variant="function" size="sm"
                      highlighted={hl('prog-nav-up')} onClick={() => onButtonClick?.('prog-nav-up')} />
                    <PanelButton id="prog-nav-down" label="▼" variant="function" size="sm"
                      highlighted={hl('prog-nav-down')} onClick={() => onButtonClick?.('prog-nav-down')} />
                    <PanelButton id="prog-nav-no" label="-NO" variant="function" size="sm"
                      highlighted={hl('prog-nav-no')} onClick={() => onButtonClick?.('prog-nav-no')} />
                    <PanelButton id="prog-nav-yes" label="+YES" variant="function" size="sm"
                      highlighted={hl('prog-nav-yes')} onClick={() => onButtonClick?.('prog-nav-yes')} />
                  </div>
                </div>

                {/* Right column: BANK buttons */}
                <div className="flex flex-col items-center gap-1">
                  <PanelButton id="prog-bank-up" label="BANK ▲" variant="function" size="sm"
                    highlighted={hl('prog-bank-up')} hasLed ledOn={ps('prog-bank-up')?.ledOn}
                    ledColor={DM_COLORS.ledOrange} labelPosition="above"
                    onClick={() => onButtonClick?.('prog-bank-up')} />
                  <PanelButton id="prog-bank-down" label="BANK ▼" variant="function" size="sm"
                    highlighted={hl('prog-bank-down')} hasLed ledOn={ps('prog-bank-down')?.ledOn}
                    ledColor={DM_COLORS.ledOrange} labelPosition="above"
                    onClick={() => onButtonClick?.('prog-bank-down')} />
                </div>
              </div>

              {/* Branding text */}
              <div className="text-center my-0.5" style={{ fontSize: 11, color: DM_COLORS.brandText, letterSpacing: '0.2em', fontWeight: 700 }}>
                DeepMind 12
              </div>
              <div className="text-center" style={{ fontSize: 6, color: DM_COLORS.subtitleText, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Analog 12-Voice Polyphonic Synthesizer
              </div>

              {/* Menu buttons row: PROG, FX, GLOBAL, COMPARE, WRITE, MOD — HORIZONTAL */}
              <div className="flex items-center gap-0.5 mt-0.5">
                {[
                  { id: 'prog-menu-prog', label: 'PROG' },
                  { id: 'prog-menu-fx', label: 'FX' },
                  { id: 'prog-menu-global', label: 'GLOBAL' },
                  { id: 'prog-menu-compare', label: 'COMPARE' },
                  { id: 'prog-menu-write', label: 'WRITE' },
                  { id: 'prog-menu-mod', label: 'MOD' },
                ].map((b) => (
                  <PanelButton key={b.id} id={b.id} label={b.label} variant="function" size="sm"
                    active={ps(b.id)?.active ?? (b.id === 'prog-menu-prog')}
                    highlighted={hl(b.id)}
                    hasLed ledOn={ps(b.id)?.ledOn ?? (b.id === 'prog-menu-prog')}
                    ledColor={DM_COLORS.ledOrange}
                    labelPosition="above" onClick={() => onButtonClick?.(b.id)} />
                ))}
              </div>
            </div>
          </div>

          {/* ── SECTION: POLY ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="poly"
            style={{ flex: `${SECTION_FLEX.poly} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="POLY" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              <div className="flex items-end flex-1">
                <Slider id="poly-unison" label="UNIS" value={ps('poly-unison')?.value ?? 0}
                  highlighted={hl('poly-unison')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              <PanelButton id="poly-edit" label="EDIT" variant="function" size="sm"
                active={ps('poly-edit')?.active} highlighted={hl('poly-edit')}
                hasLed ledOn={ps('poly-edit')?.ledOn} ledColor={DM_COLORS.ledOrange}
                labelPosition="above" onClick={() => onButtonClick?.('poly-edit')} />
            </div>
          </div>

          {/* ── SECTION: VCF ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="vcf"
            style={{ flex: `${SECTION_FLEX.vcf} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="VCF" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              {/* Sliders: FREQ, RES, ENV, LFO, KYBD — HORIZONTAL */}
              <div className="flex items-end gap-0.5 flex-1">
                <Slider id="vcf-freq" label="FREQ" value={ps('vcf-freq')?.value ?? 127}
                  highlighted={hl('vcf-freq')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="vcf-res" label="RES" value={ps('vcf-res')?.value ?? 0}
                  highlighted={hl('vcf-res')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="vcf-env" label="ENV" value={ps('vcf-env')?.value ?? 64}
                  highlighted={hl('vcf-env')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="vcf-lfo" label="LFO" value={ps('vcf-lfo')?.value ?? 0}
                  highlighted={hl('vcf-lfo')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="vcf-kybd" label="KYBD" value={ps('vcf-kybd')?.value ?? 64}
                  highlighted={hl('vcf-kybd')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              {/* Buttons: 2-POLE, INVERT, EDIT — HORIZONTAL */}
              <div className="flex items-center gap-0.5">
                <PanelButton id="vcf-2pole" label="2-POLE" variant="function" size="sm"
                  active={ps('vcf-2pole')?.active} highlighted={hl('vcf-2pole')}
                  hasLed ledOn={ps('vcf-2pole')?.ledOn} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('vcf-2pole')} />
                <PanelButton id="vcf-invert" label="INVERT" variant="function" size="sm"
                  active={ps('vcf-invert')?.active} highlighted={hl('vcf-invert')}
                  hasLed ledOn={ps('vcf-invert')?.ledOn} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('vcf-invert')} />
                <PanelButton id="vcf-edit" label="EDIT" variant="function" size="sm"
                  active={ps('vcf-edit')?.active} highlighted={hl('vcf-edit')}
                  hasLed ledOn={ps('vcf-edit')?.ledOn} ledColor={DM_COLORS.ledOrange}
                  labelPosition="above" onClick={() => onButtonClick?.('vcf-edit')} />
              </div>
            </div>
          </div>

          {/* ── SECTION: VCA ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="vca"
            style={{ flex: `${SECTION_FLEX.vca} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="VCA" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              <div className="flex items-end flex-1">
                <Slider id="vca-level" label="LEVEL" value={ps('vca-level')?.value ?? 100}
                  highlighted={hl('vca-level')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              <PanelButton id="vca-edit" label="EDIT" variant="function" size="sm"
                active={ps('vca-edit')?.active} highlighted={hl('vca-edit')}
                hasLed ledOn={ps('vca-edit')?.ledOn} ledColor={DM_COLORS.ledOrange}
                labelPosition="above" onClick={() => onButtonClick?.('vca-edit')} />
            </div>
          </div>

          {/* ── SECTION: HPF ── */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="hpf"
            style={{ flex: `${SECTION_FLEX.hpf} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="HPF" variant="blue" />
            <div className="flex flex-col items-center gap-0.5 px-1 py-0.5 flex-1">
              <div className="flex items-end flex-1">
                <Slider id="hpf-freq" label="FREQ" value={ps('hpf-freq')?.value ?? 0}
                  highlighted={hl('hpf-freq')} trackHeight={SLIDER_TRACK_HEIGHT} trackWidth={SLIDER_TRACK_WIDTH} />
              </div>
              <PanelButton id="hpf-boost" label="BOOST" variant="function" size="sm"
                active={ps('hpf-boost')?.active} highlighted={hl('hpf-boost')}
                hasLed ledOn={ps('hpf-boost')?.ledOn} ledColor={DM_COLORS.ledOrange}
                labelPosition="above" onClick={() => onButtonClick?.('hpf-boost')} />
            </div>
          </div>

          {/* ── SECTION: ENVELOPES ──
              CRITICAL TOPOLOGY:
              - Top row: 4 ADSR sliders + curve icons column (far right) — HORIZONTAL
              - Bottom row: VCA, VCF, MOD, CURVES buttons — HORIZONTAL
              Structure: outer flex-col, top row is flex-row, bottom row is flex-row
              DOM assertion: env-vca MUST be sibling of env-vcf in same flex-row container
          */}
          <div
            className="flex flex-col items-center rounded-lg min-w-0"
            data-section-id="env"
            style={{ flex: `${SECTION_FLEX.env} 1 0%`, background: DM_COLORS.sectionBg, boxShadow: `inset 0 1px 3px ${DM_COLORS.sectionShadow}` }}
          >
            <SectionHeader label="ENVELOPES" />
            <div className="flex flex-col gap-0.5 px-1 py-0.5 flex-1">
              {/* Top row: ADSR sliders + curve icons column on far right — HORIZONTAL */}
              <div className="flex items-end gap-1 flex-1">
                <Slider id="env-attack" label="A" value={ps('env-attack')?.value ?? 0}
                  highlighted={hl('env-attack')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="env-decay" label="D" value={ps('env-decay')?.value ?? 40}
                  highlighted={hl('env-decay')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="env-sustain" label="S" value={ps('env-sustain')?.value ?? 80}
                  highlighted={hl('env-sustain')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} />
                <Slider id="env-release" label="R" value={ps('env-release')?.value ?? 30}
                  highlighted={hl('env-release')} trackHeight={SLIDER_TRACK_HEIGHT_ENV} trackWidth={SLIDER_TRACK_WIDTH} />
                {/* Curve shape icons — far right column per hardware */}
                <EnvelopeCurveIcons panelState={panelState} highlightedControls={highlightedControls} />
              </div>
              {/* Bottom row: VCA, VCF, MOD, CURVES buttons in HORIZONTAL row per hardware */}
              <div className="flex items-center justify-evenly gap-0.5">
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

        </div>{/* end control surface row */}

        {/* ── VOICES LED STRIP ── */}
        <div
          className="flex items-center justify-center gap-1 px-2"
          data-section-id="voices"
          style={{
            height: DM_VOICES_HEIGHT,
            background: DM_COLORS.panelBg,
          }}
        >
          <span style={{ fontSize: 7, color: DM_COLORS.voicesLabelText, letterSpacing: '0.1em', marginRight: 4 }}>
            VOICES
          </span>
          {Array.from({ length: 12 }, (_, i) => {
            const id = `voice-led-${i + 1}`;
            const isOn = ps(id)?.ledOn;
            return (
              <div key={id} className="flex flex-col items-center" data-control-id={id}>
                <div
                  className="rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: isOn ? DM_COLORS.ledGreen : DM_COLORS.ledOff,
                    boxShadow: isOn ? `0 0 4px ${DM_COLORS.ledGreen}` : 'none',
                  }}
                />
                <span style={{ fontSize: 5, color: DM_COLORS.voicesLabelText }}>{i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* ── KEYBOARD ── */}
        <div className="flex-1 min-h-0">
          <DeepMindKeyboard />
        </div>

      </div>{/* end main area */}
    </div>
  );
}
