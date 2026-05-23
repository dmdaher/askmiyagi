'use client';

import React from 'react';
import theme from '../device-theme.json';
import TrackInfo from '../atoms/TrackInfo';
import Waveform from '../atoms/Waveform';
import StatusBar from '../atoms/StatusBar';
import TouchTabs from '../atoms/TouchTabs';
import PhaseMeter from '../atoms/PhaseMeter';
import BeatSelector from '../atoms/BeatSelector';
import KeyShiftBar from '../atoms/KeyShiftBar';

const t = theme.mainDisplay;

const WAVEFORM_TABS = [
  { id: 'beat-loop', label: 'BEAT\nLOOP' },
  { id: 'key-shift', label: 'KEY\nSHIFT' },
  { id: 'beat-jump', label: 'BEAT\nJUMP' },
];

interface WaveformScreenProps {
  // Track info
  deviceType?: 'USB' | 'SD' | 'LINK';
  trackTitle?: string;
  trackArtist?: string;
  trackDuration?: string;
  trackBpm?: number;
  trackKey?: string;
  // Waveform state
  progress?: number;
  loopIn?: number;
  loopOut?: number;
  hotCues?: { position: number; color: string; label: string }[];
  cuePoint?: number;
  beatCountdown?: string;
  colorMode?: 'BLUE' | 'RGB' | '3 BAND';
  currentPosition?: 'CENTER' | 'LEFT';
  zoomLevel?: string;
  gridAdjust?: boolean;
  // Phase meter
  phaseOffset?: number;
  // Status bar
  playerNumber?: number;
  trackNumber?: number;
  autoCue?: boolean;
  time?: string;
  timeMsec?: string;
  isRemain?: boolean;
  playMode?: 'SINGLE' | 'CONTINUE';
  tempo?: string;
  tempoRange?: string;
  bpm?: number;
  masterSync?: 'MASTER' | 'SYNC' | null;
  masterTempo?: boolean;
  musicalKey?: string;
  keyMatch?: boolean;
  // Tab state
  activeTab?: string;
  // Beat loop
  beatLoopValues?: string[];
  selectedBeatLoop?: string;
  // Beat jump
  beatJumpValues?: string[];
  selectedBeatJump?: string;
  // Key shift
  keyShiftAmount?: number;
  keyShiftTarget?: string;
  // Quantize
  quantizeBeatValue?: string;
  // Beat jump display value
  beatJumpDisplayValue?: string;
}

/**
 * Main waveform/playback screen -- the primary performance view.
 * Matches manual page 21 (Playback screen / Waveform screen).
 *
 * Layout from top to bottom:
 * 1. Track info bar (device icon, track name, duration, BPM, key)
 * 2. Touch tabs (BEAT LOOP, KEY SHIFT, BEAT JUMP) -- top right
 * 3. Enlarged waveform with phase meter bar above it
 * 4. Overall waveform
 * 5. Conditional bottom panel (beat selector, key shift bar, or hidden)
 * 6. Status bar (player number, time, tempo, BPM, sync status, key)
 */
export default function WaveformScreen({
  deviceType = 'USB',
  trackTitle = "Can't Stop, Won't Stop (Original Mix)",
  trackArtist,
  trackDuration = '05:49',
  trackBpm = 124.0,
  trackKey = 'Gm',
  progress = 0.3,
  loopIn,
  loopOut,
  hotCues = [],
  cuePoint,
  beatCountdown = '06.0',
  colorMode = 'BLUE',
  currentPosition = 'CENTER',
  zoomLevel,
  gridAdjust = false,
  phaseOffset = 0,
  playerNumber = 2,
  trackNumber = 2,
  autoCue = false,
  time = '03:10',
  timeMsec = '780',
  isRemain = true,
  playMode = 'SINGLE',
  tempo = '+3.20',
  tempoRange = '10',
  bpm = 128.0,
  masterSync = null,
  masterTempo = false,
  musicalKey = 'Gm',
  keyMatch = false,
  activeTab,
  beatLoopValues = ['1/4', '1/2', '1', '2', '4', '8', '16', '32'],
  selectedBeatLoop = '16',
  beatJumpValues = ['1/2', '1/2', '1', '1', '2', '2', '4', '4'],
  selectedBeatJump = '16',
  keyShiftAmount = 0,
  keyShiftTarget,
  quantizeBeatValue,
  beatJumpDisplayValue,
}: WaveformScreenProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: t.backgroundColor,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Top bar: Track info + Touch tabs */}
      <div className="flex items-start">
        <div className="flex-1">
          <TrackInfo
            deviceType={deviceType}
            title={trackTitle}
            artist={trackArtist}
            duration={trackDuration}
            bpm={trackBpm}
            musicalKey={trackKey}
          />
        </div>
        <TouchTabs tabs={WAVEFORM_TABS} activeTab={activeTab || ''} />
      </div>

      {/* Phase meter */}
      <div className="flex justify-end px-2 py-0.5">
        <PhaseMeter offset={phaseOffset} />
      </div>

      {/* Enlarged waveform */}
      <div className="flex-1 px-0">
        <Waveform
          variant="enlarged"
          progress={progress}
          loopIn={loopIn}
          loopOut={loopOut}
          hotCues={hotCues}
          cuePoint={cuePoint}
          beatCountdown={beatCountdown}
          colorMode={colorMode}
          currentPosition={currentPosition}
          zoomLevel={zoomLevel}
          gridAdjust={gridAdjust}
        />
      </div>

      {/* Conditional bottom panel based on active tab */}
      {activeTab === 'beat-loop' && (
        <BeatSelector
          values={beatLoopValues}
          selectedValue={selectedBeatLoop}
          variant="loop"
        />
      )}
      {activeTab === 'beat-jump' && (
        <BeatSelector
          values={beatJumpValues}
          selectedValue={selectedBeatJump}
          variant="jump"
        />
      )}
      {activeTab === 'key-shift' && (
        <KeyShiftBar
          currentKey={musicalKey}
          shiftAmount={keyShiftAmount}
          targetKey={keyShiftTarget}
        />
      )}

      {/* Overall waveform */}
      <Waveform
        variant="overall"
        progress={progress}
        loopIn={loopIn}
        loopOut={loopOut}
        hotCues={hotCues}
        cuePoint={cuePoint}
        colorMode={colorMode}
      />

      {/* Status bar */}
      <StatusBar
        playerNumber={playerNumber}
        trackNumber={trackNumber}
        autoCue={autoCue}
        time={time}
        timeMsec={timeMsec}
        isRemain={isRemain}
        playMode={playMode}
        tempo={tempo}
        tempoRange={tempoRange}
        bpm={bpm}
        masterSync={masterSync}
        masterTempo={masterTempo}
        musicalKey={musicalKey}
        keyMatch={keyMatch}
        quantizeBeatValue={quantizeBeatValue}
        beatJumpValue={beatJumpDisplayValue}
      />
    </div>
  );
}
