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
    <div className="flex flex-col gap-2 px-3 py-2 h-full">
      {/* Branding */}
      <div className="text-center py-1">
        <div className="text-[6px] text-gray-600 uppercase tracking-[0.2em]">Performance DJ Controller</div>
        <div className="text-[13px] font-bold text-gray-300 tracking-wider">DDJ-FLX4</div>
        <div className="flex justify-center gap-3 mt-0.5">
          <span className="text-[7px] text-gray-500 tracking-wide">rekordbox</span>
          <span className="text-[7px] text-gray-500 tracking-wide">serato</span>
        </div>
      </div>

      {/* TRIM + MASTER LEVEL + CUE row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">TRIM</span>
          <Knob id="ch1-trim" label="" value={getValue('ch1-trim')} highlighted={isHl('ch1-trim')} size="md" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">TRIM</span>
          <Knob id="ch2-trim" label="" value={getValue('ch2-trim')} highlighted={isHl('ch2-trim')} size="md" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">MASTER LEVEL</span>
          <Knob id="master-level" label="" value={getValue('master-level')} highlighted={isHl('master-level')} size="md" />
        </div>
        <PanelButton id="master-cue" label="CUE" variant="standard" size="sm"
          active={getState('master-cue').active} hasLed ledOn={getState('master-cue').ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('master-cue')}
          onClick={() => onButtonClick?.('master-cue')} />
      </div>

      {/* MIC LEVEL */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[7px] text-gray-500">MIC LEVEL</span>
        <Knob id="mic-level" label="" value={getValue('mic-level')} highlighted={isHl('mic-level')} size="sm" />
      </div>

      {/* EQ section: CH1 knobs | Level Meters | CH2 knobs */}
      <div className="flex items-start justify-between gap-2 px-1">
        {/* CH1 EQ */}
        <div className="flex flex-col items-center gap-3">
          <Knob id="ch1-hi" label="HI" value={getValue('ch1-hi')} highlighted={isHl('ch1-hi')} size="md" />
          <Knob id="ch1-mid" label="MID" value={getValue('ch1-mid')} highlighted={isHl('ch1-mid')} size="md" />
          <Knob id="ch1-low" label="LOW" value={getValue('ch1-low')} highlighted={isHl('ch1-low')} size="md" />
        </div>

        {/* Center level meters */}
        <div className="flex gap-2 items-center pt-2">
          <LevelMeter level={getValue('ch1-level')} segments={8} width={6} height={120} />
          <LevelMeter level={getValue('ch2-level')} segments={8} width={6} height={120} />
        </div>

        {/* CH2 EQ */}
        <div className="flex flex-col items-center gap-3">
          <Knob id="ch2-hi" label="HI" value={getValue('ch2-hi')} highlighted={isHl('ch2-hi')} size="md" />
          <Knob id="ch2-mid" label="MID" value={getValue('ch2-mid')} highlighted={isHl('ch2-mid')} size="md" />
          <Knob id="ch2-low" label="LOW" value={getValue('ch2-low')} highlighted={isHl('ch2-low')} size="md" />
        </div>
      </div>

      {/* CFX knobs */}
      <div className="flex justify-between items-center px-4">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">CFX</span>
          <Knob id="ch1-cfx" label="" value={getValue('ch1-cfx')} highlighted={isHl('ch1-cfx')} size="sm" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">CFX</span>
          <Knob id="ch2-cfx" label="" value={getValue('ch2-cfx')} highlighted={isHl('ch2-cfx')} size="sm" />
        </div>
      </div>

      {/* SMART CFX */}
      <div className="flex justify-center">
        <PanelButton id="smart-cfx" label="SMART CFX" variant="function" size="sm"
          active={getState('smart-cfx').active} hasLed ledOn={getState('smart-cfx').ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('smart-cfx')}
          onClick={() => onButtonClick?.('smart-cfx')} />
      </div>

      {/* Headphones */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">H.MIX</span>
          <Knob id="hp-mix" label="" value={getValue('hp-mix')} highlighted={isHl('hp-mix')} size="sm" />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[7px] text-gray-500">H.LEVEL</span>
          <Knob id="hp-level" label="" value={getValue('hp-level')} highlighted={isHl('hp-level')} size="sm" />
        </div>
      </div>

      {/* Channel CUE buttons */}
      <div className="flex justify-between items-center px-6">
        <PanelButton id="ch1-cue" label="CUE" variant="standard" size="sm"
          active={getState('ch1-cue').active} hasLed ledOn={getState('ch1-cue').ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('ch1-cue')}
          labelPosition="above" onClick={() => onButtonClick?.('ch1-cue')} />
        <span className="text-[10px] text-gray-400 font-bold">1</span>
        <span className="text-[10px] text-gray-400 font-bold">2</span>
        <PanelButton id="ch2-cue" label="CUE" variant="standard" size="sm"
          active={getState('ch2-cue').active} hasLed ledOn={getState('ch2-cue').ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('ch2-cue')}
          labelPosition="above" onClick={() => onButtonClick?.('ch2-cue')} />
      </div>

      {/* Channel faders — taller for proper DJ look */}
      <div className="flex justify-between px-10 py-1">
        <Slider id="ch1-fader" label="" value={getValue('ch1-fader')} highlighted={isHl('ch1-fader')}
          height={180} />
        <Slider id="ch2-fader" label="" value={getValue('ch2-fader')} highlighted={isHl('ch2-fader')}
          height={180} />
      </div>

      {/* Pioneer DJ logo */}
      <div className="text-center text-[11px] text-gray-500 italic font-semibold tracking-wider">
        Pioneer DJ
      </div>

      {/* SMART FADER */}
      <div className="flex justify-center">
        <PanelButton id="smart-fader" label="SMART FADER" variant="function" size="sm"
          active={getState('smart-fader').active} hasLed ledOn={getState('smart-fader').ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('smart-fader')}
          onClick={() => onButtonClick?.('smart-fader')} />
      </div>

      {/* Crossfader — horizontal slider */}
      <div className="flex justify-center px-3">
        <Slider id="crossfader" label="" value={getValue('crossfader')} highlighted={isHl('crossfader')}
          orientation="horizontal" height={260} width={18} />
      </div>
    </div>
  );
}
