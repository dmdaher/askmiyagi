'use client';

import { PanelState } from '@/types/panel';
import DeckSection from './sections/DeckSection';
import BrowseSection from './sections/BrowseSection';
import MixerSection from './sections/MixerSection';
import EffectsSection from './sections/EffectsSection';

interface DDJFlx4PanelProps {
  panelState: PanelState;
  highlightedControls: string[];
  onButtonClick?: (id: string) => void;
}

export default function DDJFlx4Panel({ panelState, highlightedControls, onButtonClick }: DDJFlx4PanelProps) {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl"
      style={{
        width: 2400,
        height: 1263,
        background: 'linear-gradient(180deg, #2a2a2e 0%, #1e1e22 50%, #1a1a1e 100%)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        transformOrigin: 'top left',
      }}
    >
      <div className="flex h-full p-4 gap-1.5">
        {/* Column 1: Deck 1 */}
        <div style={{ width: 940 }}>
          <DeckSection deck={1} panelState={panelState}
            highlightedControls={highlightedControls} onButtonClick={onButtonClick} />
        </div>

        {/* Column 2: Center (Browse + Mixer + Effects) */}
        <div className="flex flex-col gap-1.5" style={{ width: 476 }}>
          <BrowseSection panelState={panelState}
            highlightedControls={highlightedControls} onButtonClick={onButtonClick} />
          <div className="flex gap-1.5 flex-1">
            <div style={{ width: 340 }}>
              <MixerSection panelState={panelState}
                highlightedControls={highlightedControls} onButtonClick={onButtonClick} />
            </div>
            <div style={{ width: 130 }}>
              <EffectsSection panelState={panelState}
                highlightedControls={highlightedControls} onButtonClick={onButtonClick} />
            </div>
          </div>
        </div>

        {/* Column 3: Deck 2 */}
        <div style={{ width: 940 }}>
          <DeckSection deck={2} panelState={panelState}
            highlightedControls={highlightedControls} onButtonClick={onButtonClick} />
        </div>
      </div>
    </div>
  );
}
