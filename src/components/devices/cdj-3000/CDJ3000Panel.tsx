'use client';

import PanelShell from '@/components/controls/PanelShell';
import SectionContainer from '@/components/controls/SectionContainer';
import { PanelState } from '@/types/panel';
import { CDJ3000_PANEL } from '@/lib/devices/cdj-3000-constants';
import BROWSESection from './sections/BROWSESection';
import MEDIASection from './sections/MediaSection';
import DISPLAYSection from './sections/DisplaySection';
import SELECTORSection from './sections/SELECTORSection';
import HOT_CUESection from './sections/HOT_CUESection';
import JOG_CONTROLSSection from './sections/JOG_CONTROLSSection';
import LOOPSection from './sections/LoopSection';
import CUE_MEMORYSection from './sections/CUE_MEMORYSection';
import SYNCSection from './sections/SYNCSection';
import TRANSPORTSection from './sections/TRANSPORTSection';
import JOG_WHEELSection from './sections/JOG_WHEELSection';
import TEMPOSection from './sections/TempoSection';

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
    <PanelShell
      manufacturer={CDJ3000_PANEL.manufacturer}
      deviceName={CDJ3000_PANEL.deviceName}
      width={CDJ3000_PANEL.width}
      height={CDJ3000_PANEL.height}
      keyboard={null}
    >
        <SectionContainer id="BROWSE" x={14} y={0} w={78} h={6} headerLabel="Navigation Bar">
          <BROWSESection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="MEDIA" x={0} y={0} w={14} h={28} headerLabel="USB/SD Media Ports">
          <MEDIASection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="DISPLAY" x={14} y={7} w={64} h={24} headerLabel="9-inch Touch Display">
          <DISPLAYSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="SELECTOR" x={78} y={6} w={22} h={19} headerLabel="Browse Selector">
          <SELECTORSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="HOT_CUE" x={3} y={31} w={52} h={10} headerLabel="Performance Pads &amp; Mode Buttons">
          <HOT_CUESection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="JOG_CONTROLS" x={78} y={25} w={22} h={23} headerLabel="Jog Wheel Settings">
          <JOG_CONTROLSSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="LOOP" x={12} y={40} w={28} h={10} headerLabel="Loop Controls">
          <LOOPSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="CUE_MEMORY" x={55} y={35} w={23} h={13} headerLabel="Cue/Loop Memory Controls">
          <CUE_MEMORYSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="SYNC" x={78} y={48} w={22} h={12} headerLabel="Beat Sync Controls">
          <SYNCSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="TRANSPORT" x={0} y={50} w={15} h={45} headerLabel="Transport Controls">
          <TRANSPORTSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="JOG_WHEEL" x={18} y={50} w={54} h={35} headerLabel="Jog Wheel">
          <JOG_WHEELSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
        <SectionContainer id="TEMPO" x={80} y={60} w={20} h={35} headerLabel="Tempo Controls">
          <TEMPOSection
            panelState={panelState}
            highlightedControls={highlightedControls}
            onButtonClick={onButtonClick}
          />
        </SectionContainer>
    </PanelShell>
  );
}
