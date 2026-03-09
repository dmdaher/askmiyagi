'use client';

import Slider from '@/components/controls/Slider';
import PanelButton from '@/components/controls/PanelButton';
import PadButton from '@/components/controls/PadButton';
import JogWheel from '@/components/controls/JogWheel';
import { PanelState } from '@/types/panel';
import { DDJ_FLX4_COLORS } from '@/lib/constants';
import LoopControls from './LoopControls';

interface DeckSectionProps {
  deck: 1 | 2;
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

const PAD_MODES = [
  { label: 'HOT CUE', shift: 'KEYBOARD', suffix: 'hot-cue' },
  { label: 'PAD FX1', shift: 'PAD FX 2', suffix: 'pad-fx1' },
  { label: 'BEAT JUMP', shift: 'BEAT LOOP', suffix: 'beat-jump' },
  { label: 'SAMPLER', shift: 'KEY SHIFT', suffix: 'sampler' },
];

export default function DeckSection({ deck, panelState, highlightedControls, onButtonClick }: DeckSectionProps) {
  const d = `d${deck}`;
  const isHl = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };
  const getValue = (id: string) => panelState[id]?.value ?? 64;

  // Tempo slider — tall sidebar spanning jog through pads area
  const tempoColumn = (
    <div className="flex flex-col items-center justify-center" style={{ width: 60 }}>
      <Slider id={`${d}-tempo`} label="TEMPO"
        value={getValue(`${d}-tempo`)} highlighted={isHl(`${d}-tempo`)}
        height={520} />
    </div>
  );

  // SHIFT button — own row, aligned to inner edge (toward mixer)
  const shiftRow = (
    <div className={`flex ${deck === 1 ? 'justify-start' : 'justify-end'} px-2`}>
      <PanelButton id={`${d}-shift`} label="SHIFT" variant="function" size="sm"
        active={getState(`${d}-shift`).active} highlighted={isHl(`${d}-shift`)}
        onClick={() => onButtonClick?.(`${d}-shift`)} />
    </div>
  );

  // Transport (CUE + PLAY) as vertical column of round buttons
  const transportColumn = (
    <div className="flex flex-col items-center gap-3 justify-center">
      <PanelButton id={`${d}-cue`} label="CUE" variant="standard" size="lg"
        shape="round" roundSize={76}
        active={getState(`${d}-cue`).active} highlighted={isHl(`${d}-cue`)}
        onClick={() => onButtonClick?.(`${d}-cue`)} />
      <PanelButton id={`${d}-play`} label="&#9654;/&#10074;&#10074;" variant="standard" size="lg"
        shape="round" roundSize={76}
        active={getState(`${d}-play`).active} highlighted={isHl(`${d}-play`)}
        onClick={() => onButtonClick?.(`${d}-play`)} />
      <span className="text-[7px] text-gray-500">PLAY/PAUSE</span>
    </div>
  );

  // Mode buttons + Pad grid in one column so they align perfectly
  const modeAndPadColumn = (
    <div className="flex flex-col gap-2">
      {/* Mode buttons — same width grid as pads for alignment */}
      <div className="grid grid-cols-4 gap-2">
        {PAD_MODES.map(mode => (
          <div key={mode.suffix} className="flex flex-col items-center gap-0.5">
            <PanelButton id={`${d}-${mode.suffix}`} label={mode.label} variant="function" size="sm"
              active={getState(`${d}-${mode.suffix}`).active} hasLed
              ledOn={getState(`${d}-${mode.suffix}`).ledOn}
              ledColor={DDJ_FLX4_COLORS.accent} highlighted={isHl(`${d}-${mode.suffix}`)}
              onClick={() => onButtonClick?.(`${d}-${mode.suffix}`)} />
            <span className="text-[6px] text-gray-600 uppercase">{mode.shift}</span>
          </div>
        ))}
      </div>
      {/* Performance pads 2x4 grid */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
          <PadButton key={n} id={`${d}-pad-${n}`} label={`${n}`}
            active={getState(`${d}-pad-${n}`).active}
            color={DDJ_FLX4_COLORS.accent} highlighted={isHl(`${d}-pad-${n}`)}
            size={100}
            onClick={() => onButtonClick?.(`${d}-pad-${n}`)} />
        ))}
      </div>
    </div>
  );

  // Transport + Mode + Pads — CUE/PLAY on left, mode buttons above pads on right
  const transportAndPads = (
    <div className="flex items-end gap-3">
      {transportColumn}
      {modeAndPadColumn}
    </div>
  );

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg h-full"
      style={{
        background: 'linear-gradient(180deg, rgba(40,40,44,0.6) 0%, rgba(28,28,32,0.8) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Row 1: Loop controls */}
      <LoopControls deck={deck} panelState={panelState}
        highlightedControls={highlightedControls} onButtonClick={onButtonClick} />

      {/* Row 2: Main area — jog + bottom controls with tempo sidebar */}
      <div className="flex flex-1 gap-3">
        {deck === 2 && tempoColumn}

        {/* Inner column: jog, search strip, mode buttons, transport+pads */}
        <div className="flex flex-col flex-1 items-center gap-2">
          {/* Search strip — tactile touch strip above jog */}
          <div className="flex items-center gap-2">
            <span className="text-[7px] text-gray-500 tracking-wider">SEARCH</span>
            <div className="rounded-full" style={{
              width: 450, height: 6,
              background: 'linear-gradient(180deg, #1a1a1e 0%, #333338 50%, #1a1a1e 100%)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)',
            }} />
          </div>

          {/* Jog wheel — dominant element */}
          <div className="flex items-center justify-center flex-1">
            <JogWheel id={`${d}-jog`} highlighted={isHl(`${d}-jog`)} size={680} onButtonClick={onButtonClick} />
          </div>

          {/* SHIFT button — own row at inner edge */}
          {shiftRow}

          {/* Transport + Mode buttons + Pads (mode buttons aligned with pad columns) */}
          {transportAndPads}
        </div>

        {deck === 1 && tempoColumn}
      </div>
    </div>
  );
}
