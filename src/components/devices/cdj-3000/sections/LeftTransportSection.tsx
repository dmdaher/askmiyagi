'use client';

import DirectionSwitch from '@/components/controls/DirectionSwitch';
import PanelButton from '@/components/controls/PanelButton';
import { PanelState } from '@/types/panel';

interface LeftTransportSectionProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function LeftTransportSection({
  panelState,
  highlightedControls,
  onButtonClick,
}: LeftTransportSectionProps) {
  const isHighlighted = (id: string) => highlightedControls.includes(id);
  const getState = (id: string) => panelState[id] ?? { active: false };

  // Group labels are rendered inline within the section body

  return (
      <div data-section-id="left-transport" className="flex flex-col gap-1">
        <div className="flex flex-row gap-1 justify-center">
          <PanelButton
            id="beat-jump-left-btn"
            label="BEAT JUMP ◄"
            variant="standard"
            iconContent="◀"
            active={getState('beat-jump-left-btn').active}
            highlighted={isHighlighted('beat-jump-left-btn')}
            onClick={() => onButtonClick?.('beat-jump-left-btn')}
          />
          <PanelButton
            id="beat-jump-right-btn"
            label="BEAT JUMP ►"
            variant="standard"
            iconContent="▶"
            active={getState('beat-jump-right-btn').active}
            highlighted={isHighlighted('beat-jump-right-btn')}
            onClick={() => onButtonClick?.('beat-jump-right-btn')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
          <DirectionSwitch
            id="direction-lever"
            label="DIRECTION FWD, REV, SLIP REV"
            positions={["FWD","REV","SLIP REV"]}
            highlighted={isHighlighted('direction-lever')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
          <PanelButton
            id="track-search-bwd-btn"
            label="TRACK SEARCH I◄◄"
            variant="standard"
            iconContent="|◀◀"
            active={getState('track-search-bwd-btn').active}
            highlighted={isHighlighted('track-search-bwd-btn')}
            onClick={() => onButtonClick?.('track-search-bwd-btn')}
          />
          <PanelButton
            id="track-search-fwd-btn"
            label="TRACK SEARCH ►►I"
            variant="standard"
            iconContent="▶▶|"
            active={getState('track-search-fwd-btn').active}
            highlighted={isHighlighted('track-search-fwd-btn')}
            onClick={() => onButtonClick?.('track-search-fwd-btn')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
          <PanelButton
            id="search-bwd-btn"
            label="SEARCH ◄◄"
            variant="standard"
            iconContent="◀◀"
            active={getState('search-bwd-btn').active}
            highlighted={isHighlighted('search-bwd-btn')}
            onClick={() => onButtonClick?.('search-bwd-btn')}
          />
          <PanelButton
            id="search-fwd-btn"
            label="SEARCH ►►"
            variant="standard"
            iconContent="▶▶"
            active={getState('search-fwd-btn').active}
            highlighted={isHighlighted('search-fwd-btn')}
            onClick={() => onButtonClick?.('search-fwd-btn')}
          />
        </div>
        <div className="flex flex-row gap-1 justify-center">
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
        </div>
        <div className="flex flex-row gap-1 justify-center">
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
        </div>
      </div>
  );
}
