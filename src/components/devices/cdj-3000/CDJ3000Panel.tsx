'use client';

import { motion } from 'framer-motion';
import { PanelState } from '@/types/panel';
import { CDJ3000_PANEL } from '@/lib/devices/cdj-3000-constants';
import BrowseBarSection from './sections/BrowseBarSection';
import MediaSection from './sections/MediaSection';
import DisplaySection from './sections/DisplaySection';
import NavigationSection from './sections/NavigationSection';
import PerformanceModesSection from './sections/PerformanceModesSection';
import HotCueSection from './sections/HotCueSection';
import LoopSection from './sections/LoopSection';
import CueLoopMemorySection from './sections/CueLoopMemorySection';
import LeftTransportSection from './sections/LeftTransportSection';
import JogSection from './sections/JogSection';
import JogModeControlsSection from './sections/JogModeControlsSection';
import BeatSyncSection from './sections/BeatSyncSection';
import TempoSection from './sections/TempoSection';

interface CDJ3000PanelProps {
  panelState: PanelState;
  displayState?: any;
  highlightedControls: string[];
  zones?: any[];
  onButtonClick?: (id: string) => void;
}

export default function CDJ3000Panel({
  panelState,
  highlightedControls,
  onButtonClick,
}: CDJ3000PanelProps) {
  return (
    <div className="w-full h-full overflow-x-auto">
      <motion.div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          width: CDJ3000_PANEL.width,
          minWidth: CDJ3000_PANEL.width,
          height: CDJ3000_PANEL.height,
          backgroundColor: '#1a1a1a',
          boxShadow: '0 0 0 1px rgba(80,80,80,0.3), 0 8px 32px rgba(0,0,0,0.6), 0 2px 0 0 rgba(255,255,255,0.04) inset, 0 -2px 0 0 rgba(0,0,0,0.4) inset',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Panel texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(60,60,60,0.12) 0%, transparent 60%)',
          }}
        />

        {/* Top bezel accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none z-30"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 95%)',
          }}
        />

        {/* Branding bar */}
        <div className="absolute top-1 left-4 z-30 pointer-events-none flex items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-500 tracking-[0.35em] uppercase">
            {CDJ3000_PANEL.manufacturer}
          </span>
          <span className="text-[9px] font-medium text-neutral-600 tracking-[0.2em] uppercase">
            {CDJ3000_PANEL.deviceName}
          </span>
        </div>

        <div
          className="absolute"
          style={{
            left: '10.6%',
            top: '1.5%',
            width: '78.3%',
            height: '4.8%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <BrowseBarSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '2.3%',
            top: '7.5%',
            width: '12.8%',
            height: '15%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <MediaSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '19%',
            top: '7.1%',
            width: '61.3%',
            height: '26.2%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <DisplaySection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '78.2%',
            top: '10.5%',
            width: '23.3%',
            height: '19.5%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <NavigationSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '1.2%',
            top: '23.8%',
            width: '14.3%',
            height: '7.8%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <PerformanceModesSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '14.4%',
            top: '34.4%',
            width: '70.7%',
            height: '3.9%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <HotCueSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '-0.8%',
            top: '40.2%',
            width: '29.2%',
            height: '10%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <LoopSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '59.4%',
            top: '34.5%',
            width: '36%',
            height: '9.5%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <CueLoopMemorySection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '0.6%',
            top: '50.4%',
            width: '15.6%',
            height: '46.6%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <LeftTransportSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '13.6%',
            top: '44.5%',
            width: '75.3%',
            height: '48.9%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <JogSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '69.8%',
            top: '40.5%',
            width: '29.2%',
            height: '10.2%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <JogModeControlsSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '85%',
            top: '46.5%',
            width: '13.2%',
            height: '8.5%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <BeatSyncSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
        <div
          className="absolute"
          style={{
            left: '79.2%',
            top: '58%',
            width: '21.3%',
            height: '36.9%',
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: 'rgba(0,0,0,0.12)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
              padding: '6px',
            }}
          >
            <TempoSection
              panelState={panelState}
              highlightedControls={highlightedControls}
              onButtonClick={onButtonClick}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
