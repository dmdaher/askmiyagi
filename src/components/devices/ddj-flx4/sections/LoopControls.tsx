'use client';

import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';
import { DDJ_FLX4_COLORS } from '@/lib/constants';

interface LoopControlsProps {
  deck: 1 | 2;
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function LoopControls({ deck, panelState, highlightedControls, onButtonClick }: LoopControlsProps) {
  const d = `d${deck}`;
  const isHl = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  return (
    <div className="flex items-end px-1 py-1 justify-evenly">
      {/* IN — round orange button */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] text-gray-400 uppercase">IN</span>
        <PanelButton id={`${d}-in`} label="" variant="function" size="md"
          shape="round" roundSize={36}
          active={getState(`${d}-in`).active} hasLed ledOn={getState(`${d}-in`).ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl(`${d}-in`)}
          onClick={() => onButtonClick?.(`${d}-in`)} />
        <span className="text-[7px] text-gray-500">IN ADJ</span>
      </div>

      {/* OUT — round orange button */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] text-gray-400 uppercase">OUT</span>
        <PanelButton id={`${d}-out`} label="" variant="function" size="md"
          shape="round" roundSize={36}
          active={getState(`${d}-out`).active} hasLed ledOn={getState(`${d}-out`).ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl(`${d}-out`)}
          onClick={() => onButtonClick?.(`${d}-out`)} />
        <span className="text-[7px] text-gray-500">OUT ADJ</span>
      </div>

      {/* 4 BEAT/EXIT — small round dark button */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] text-gray-400">4 BEAT/EXIT</span>
        <PanelButton id={`${d}-4beat`} label="" variant="standard" size="sm"
          shape="round" roundSize={28}
          active={getState(`${d}-4beat`).active} highlighted={isHl(`${d}-4beat`)}
          onClick={() => onButtonClick?.(`${d}-4beat`)} />
        <span className="text-[7px] text-gray-500">ACTIVE</span>
      </div>

      {/* CUE/LOOP CALL */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] text-gray-400 whitespace-nowrap">CUE/LOOP CALL</span>
        <div className="flex gap-1 items-end">
          <div className="flex flex-col items-center">
            <PanelButton id={`${d}-cue-loop-left`} label="&#9664;" variant="standard" size="md"
              active={getState(`${d}-cue-loop-left`).active} highlighted={isHl(`${d}-cue-loop-left`)}
              onClick={() => onButtonClick?.(`${d}-cue-loop-left`)} />
            <span className="text-[7px] text-gray-500">1/2X</span>
            <span className="text-[6px] text-gray-600">DEL</span>
          </div>
          <span className="text-[7px] text-gray-500 pb-4">LOOP</span>
          <div className="flex flex-col items-center">
            <PanelButton id={`${d}-cue-loop-right`} label="&#9654;" variant="standard" size="md"
              active={getState(`${d}-cue-loop-right`).active} highlighted={isHl(`${d}-cue-loop-right`)}
              onClick={() => onButtonClick?.(`${d}-cue-loop-right`)} />
            <span className="text-[7px] text-gray-500">2X</span>
            <span className="text-[6px] text-gray-600">MEMORY</span>
          </div>
        </div>
      </div>

      {/* BEAT SYNC — round orange button */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] text-gray-400">&larr; MASTER</span>
        <PanelButton id={`${d}-beat-sync`} label="BEAT SYNC" variant="function" size="lg"
          shape="round" roundSize={44}
          active={getState(`${d}-beat-sync`).active} hasLed ledOn={getState(`${d}-beat-sync`).ledOn}
          ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl(`${d}-beat-sync`)}
          onClick={() => onButtonClick?.(`${d}-beat-sync`)} />
        <span className="text-[7px] text-gray-500">TEMPO RANGE</span>
      </div>
    </div>
  );
}
