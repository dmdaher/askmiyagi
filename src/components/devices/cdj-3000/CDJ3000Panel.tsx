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
            left: '12%',
            top: '0%',
            width: '68%',
            height: '4%',
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
            left: '0%',
            top: '2%',
            width: '12%',
            height: '20%',
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
            left: '12%',
            top: '4%',
            width: '64%',
            height: '29%',
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
            left: '76%',
            top: '2%',
            width: '24%',
            height: '31%',
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
            left: '0%',
            top: '22%',
            width: '12%',
            height: '12%',
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
            left: '2%',
            top: '34%',
            width: '53%',
            height: '5%',
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
            left: '2%',
            top: '39%',
            width: '48%',
            height: '9%',
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
            left: '76%',
            top: '33%',
            width: '24%',
            height: '12%',
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
            left: '0%',
            top: '48%',
            width: '18%',
            height: '48%',
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
            left: '14%',
            top: '44%',
            width: '55%',
            height: '50%',
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
            left: '76%',
            top: '45%',
            width: '20%',
            height: '11%',
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
            left: '76%',
            top: '56%',
            width: '20%',
            height: '12%',
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
            left: '78%',
            top: '66%',
            width: '22%',
            height: '34%',
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
