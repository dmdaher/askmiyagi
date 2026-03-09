'use client';

import Knob from '@/components/controls/Knob';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';
import { DDJ_FLX4_COLORS } from '@/lib/constants';

interface EffectsSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function EffectsSection({ panelState, highlightedControls, onButtonClick }: EffectsSectionProps) {
  const isHl = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };
  const getValue = (id: string) => panelState[id]?.value ?? 64;

  return (
    <div className="flex flex-col justify-start gap-6 px-2 py-4 h-full">
      <span className="text-[10px] text-gray-400 font-semibold tracking-wider text-center">BEAT FX</span>

      {/* CH SELECT — 3-position slide switch */}
      <div className="flex flex-col items-center gap-1" data-control-id="fx-ch-select">
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[8px] text-gray-500">1</span>
          <span className="text-[8px] text-gray-500">2</span>
          <span className="text-[8px] text-gray-500">1&2</span>
        </div>
        <div
          className="relative rounded-full cursor-pointer"
          style={{
            width: 70, height: 14,
            background: 'linear-gradient(180deg, #1a1a1e 0%, #333 50%, #1a1a1e 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)',
          }}
          onClick={() => onButtonClick?.('fx-ch-select')}
        >
          {/* Slider thumb — positioned at current selection */}
          <div
            className="absolute rounded-full"
            style={{
              width: 18, height: 18, top: -2,
              left: getState('fx-ch-select').active ? 26 : 2,
              background: 'radial-gradient(circle at 40% 35%, #888 0%, #555 50%, #333 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid #222',
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <PanelButton id="fx-select" label="FX SELECT" variant="standard" size="md"
          active={getState('fx-select').active} highlighted={isHl('fx-select')}
          labelPosition="above"
          onClick={() => onButtonClick?.('fx-select')} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] text-gray-500">BEAT</span>
        <div className="flex gap-1.5">
          <PanelButton id="fx-beat-left" label="&#9664;" variant="standard" size="md"
            active={getState('fx-beat-left').active} highlighted={isHl('fx-beat-left')}
            onClick={() => onButtonClick?.('fx-beat-left')} />
          <PanelButton id="fx-beat-right" label="&#9654;" variant="standard" size="md"
            active={getState('fx-beat-right').active} highlighted={isHl('fx-beat-right')}
            onClick={() => onButtonClick?.('fx-beat-right')} />
        </div>
        <div className="flex gap-3 text-[7px] text-gray-500">
          <span>AUTO</span><span>TAP</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] text-gray-500">LEVEL/DEPTH</span>
        <Knob id="fx-level-depth" label="" value={getValue('fx-level-depth')}
          highlighted={isHl('fx-level-depth')} size="lg" />
        <div className="flex justify-between w-full text-[7px] text-gray-500 px-1">
          <span>MIN</span><span>MAX</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <PanelButton id="fx-on-off" label="ON/OFF" variant="function" size="md"
          active={getState('fx-on-off').active} hasLed ledOn={getState('fx-on-off').ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl('fx-on-off')}
          labelPosition="above"
          onClick={() => onButtonClick?.('fx-on-off')} />
        <span className="text-[7px] text-gray-500">RELEASE FX</span>
      </div>
    </div>
  );
}
