'use client';

import Knob from '@/components/controls/Knob';
import Slider from '@/components/controls/Slider';
import PanelButton from '@/components/controls/PanelButton';
import LevelMeter from '@/components/controls/LevelMeter';
import { PanelState } from '@/types/panel';
import { DDJ_FLX4_COLORS } from '@/lib/constants';

interface MixerSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function MixerSection({ panelState, highlightedControls, onButtonClick }: MixerSectionProps) {
  const isHl = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };
  const getValue = (id: string) => panelState[id]?.value ?? 64;

  return (
    <div className="flex flex-col justify-between px-3 py-2 h-full">

      {/* Row 1: Branding+MIC (left) | TRIM (center) | MASTER LEVEL+CUE (right) */}
      <div className="flex items-start justify-between">
        {/* Left: Branding + MIC LEVEL */}
        <div className="flex flex-col items-start gap-1">
          <div className="text-left">
            <div className="text-[6px] text-gray-600 uppercase tracking-[0.15em]">Performance DJ Controller</div>
            <div className="text-[12px] font-bold text-gray-300 tracking-wider">DDJ-FLX4</div>
            <div className="flex gap-2 mt-0.5">
              <span className="text-[7px] text-gray-500 tracking-wide">rekordbox</span>
              <span className="text-[7px] text-gray-500 tracking-wide">serato</span>
            </div>
            {/* Bluetooth MIDI indicator (manual p.25 #4) */}
            <div className="flex items-center gap-1 mt-1">
              <div className="rounded-full" style={{
                width: 5, height: 5,
                backgroundColor: '#333',
                boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.4)',
              }} />
              <span className="text-[6px] text-gray-600">BT MIDI</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <span className="text-[7px] text-gray-500">MIC LEVEL</span>
            <Knob id="mic-level" label="" value={getValue('mic-level')} highlighted={isHl('mic-level')} size="md" />
          </div>
        </div>

        {/* Center: TRIM knobs */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">TRIM</span>
          <div className="flex gap-3">
            <Knob id="ch1-trim" label="" value={getValue('ch1-trim')} highlighted={isHl('ch1-trim')} size="md" />
            <Knob id="ch2-trim" label="" value={getValue('ch2-trim')} highlighted={isHl('ch2-trim')} size="md" />
          </div>
        </div>

        {/* Right: MASTER LEVEL + CUE stacked */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[7px] text-gray-500">MASTER LEVEL</span>
          <Knob id="master-level" label="" value={getValue('master-level')} highlighted={isHl('master-level')} size="lg" />
          <PanelButton id="master-cue" label="CUE" variant="standard" size="md"
            active={getState('master-cue').active} hasLed ledOn={getState('master-cue').ledOn}
            ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('master-cue')}
            onClick={() => onButtonClick?.('master-cue')} />
        </div>
      </div>

      {/* Row 2: EQ section — CH1 knobs | Level Meters | CH2 knobs */}
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="flex flex-col items-center gap-4">
          <Knob id="ch1-hi" label="HI" value={getValue('ch1-hi')} highlighted={isHl('ch1-hi')} size="lg" labelPosition="above" />
          <Knob id="ch1-mid" label="MID" value={getValue('ch1-mid')} highlighted={isHl('ch1-mid')} size="lg" labelPosition="above" />
          <Knob id="ch1-low" label="LOW" value={getValue('ch1-low')} highlighted={isHl('ch1-low')} size="lg" labelPosition="above" />
        </div>

        <div className="flex gap-2 items-center pt-1">
          <LevelMeter level={getValue('ch1-level')} segments={10} width={8} height={160} />
          <LevelMeter level={getValue('ch2-level')} segments={10} width={8} height={160} />
        </div>

        <div className="flex flex-col items-center gap-4">
          <Knob id="ch2-hi" label="HI" value={getValue('ch2-hi')} highlighted={isHl('ch2-hi')} size="lg" labelPosition="above" />
          <Knob id="ch2-mid" label="MID" value={getValue('ch2-mid')} highlighted={isHl('ch2-mid')} size="lg" labelPosition="above" />
          <Knob id="ch2-low" label="LOW" value={getValue('ch2-low')} highlighted={isHl('ch2-low')} size="lg" labelPosition="above" />
        </div>
      </div>

      {/* Row 3: SMART CFX (left) + CFX knobs */}
      <div className="flex items-center gap-2">
        <PanelButton id="smart-cfx" label="SMART CFX" variant="function" size="md"
          active={getState('smart-cfx').active} hasLed ledOn={getState('smart-cfx').ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('smart-cfx')}
          labelPosition="above"
          onClick={() => onButtonClick?.('smart-cfx')} />
        <div className="flex flex-1 justify-between px-2">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[7px] text-gray-500">CFX</span>
            <Knob id="ch1-cfx" label="" value={getValue('ch1-cfx')} highlighted={isHl('ch1-cfx')} size="lg" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[7px] text-gray-500">CFX</span>
            <Knob id="ch2-cfx" label="" value={getValue('ch2-cfx')} highlighted={isHl('ch2-cfx')} size="lg" />
          </div>
        </div>
      </div>

      {/* Row 4: Headphone controls (left) + Channel CUE buttons (center) — same row per manual p.25 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[7px] text-gray-500">H.MIX</span>
            <Knob id="hp-mix" label="" value={getValue('hp-mix')} highlighted={isHl('hp-mix')} size="md" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[7px] text-gray-500">H.LEVEL</span>
            <Knob id="hp-level" label="" value={getValue('hp-level')} highlighted={isHl('hp-level')} size="md" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <PanelButton id="ch1-cue" label="CUE" variant="standard" size="md"
              active={getState('ch1-cue').active} hasLed ledOn={getState('ch1-cue').ledOn}
              ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('ch1-cue')}
              onClick={() => onButtonClick?.('ch1-cue')} />
            <span className="text-[11px] text-gray-400 font-bold">1</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <PanelButton id="ch2-cue" label="CUE" variant="standard" size="md"
              active={getState('ch2-cue').active} hasLed ledOn={getState('ch2-cue').ledOn}
              ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('ch2-cue')}
              onClick={() => onButtonClick?.('ch2-cue')} />
            <span className="text-[11px] text-gray-400 font-bold">2</span>
          </div>
        </div>
      </div>

      {/* Row 6: SMART FADER (left) + Channel faders (spread right) — manual p.25 #13 is left of #14 */}
      <div className="flex items-end gap-2 py-1">
        <div className="flex flex-col items-center pb-1">
          <PanelButton id="smart-fader" label="SMART FADER" variant="function" size="sm"
            active={getState('smart-fader').active} hasLed ledOn={getState('smart-fader').ledOn}
            ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('smart-fader')}
            labelPosition="above"
            onClick={() => onButtonClick?.('smart-fader')} />
        </div>
        <div className="flex flex-1 justify-between px-4">
          <Slider id="ch1-fader" label="" value={getValue('ch1-fader')} highlighted={isHl('ch1-fader')}
            height={280} />
          <Slider id="ch2-fader" label="" value={getValue('ch2-fader')} highlighted={isHl('ch2-fader')}
            height={280} />
        </div>
      </div>

      {/* Row 7: Pioneer DJ logo */}
      <div className="text-center text-[12px] text-gray-500 italic font-semibold tracking-wider">
        Pioneer DJ
      </div>
    </div>
  );
}
