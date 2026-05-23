'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface StatusBarProps {
  playerNumber?: number;
  trackNumber?: number;
  autoCue?: boolean;
  hotCueAutoLoad?: boolean;
  time: string;
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
  quantizeBeatValue?: string;
  beatJumpValue?: string;
}

export default function StatusBar({
  playerNumber = 2,
  trackNumber = 2,
  autoCue = false,
  hotCueAutoLoad = false,
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
  quantizeBeatValue,
  beatJumpValue,
}: StatusBarProps) {
  return (
    <div
      className="flex items-center justify-between px-2 py-1 font-mono"
      style={{
        backgroundColor: t.headerBg,
        borderTop: `1px solid ${t.borderColor}`,
        height: t.statusBarHeight,
        fontFamily: t.fontMono,
      }}
    >
      {/* Left section: Player number, track number, indicators */}
      <div className="flex items-center gap-1">
        <div
          className="flex items-center justify-center rounded px-1"
          style={{
            backgroundColor: t.accentColor,
            color: '#000',
            fontSize: 9,
            fontWeight: 700,
            minWidth: 16,
            height: 16,
          }}
        >
          <span style={{ fontSize: 7, marginRight: 1 }}>PLAYER</span>
          {playerNumber}
        </div>
        <span style={{ color: t.textColor, fontSize: 10 }}>
          {String(trackNumber).padStart(2, '0')}
        </span>
        {hotCueAutoLoad && (
          <span
            style={{
              color: t.cueRed,
              fontSize: 7,
              fontWeight: 700,
              border: `1px solid ${t.cueRed}`,
              borderRadius: 2,
              padding: '0 2px',
            }}
          >
            A.HOT CUE
          </span>
        )}
        {autoCue && (
          <span
            style={{
              color: t.accentColor,
              fontSize: 7,
              fontWeight: 700,
            }}
          >
            AUTO CUE
          </span>
        )}
      </div>

      {/* Center section: Time display */}
      <div className="flex items-baseline gap-0">
        {isRemain && (
          <span style={{ color: t.textColor, fontSize: 7, marginRight: 2 }}>REMAIN</span>
        )}
        <span
          style={{
            color: t.textColor,
            fontSize: t.fontSize.time,
            fontWeight: 700,
            letterSpacing: 1,
            fontFamily: t.fontMono,
          }}
        >
          {time}
        </span>
        <span style={{ color: t.textColor, fontSize: 8 }}>.</span>
        <span
          style={{
            color: t.textColor,
            fontSize: t.fontSize.timeMsec,
            fontWeight: 600,
            fontFamily: t.fontMono,
          }}
        >
          {timeMsec}
        </span>
      </div>

      {/* Right section: Tempo, BPM, indicators */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-end" style={{ fontSize: 8 }}>
          <span style={{ color: t.categoryText }}>{playMode}</span>
        </div>
        <div className="flex flex-col items-end">
          <span style={{ color: t.categoryText, fontSize: 7 }}>TEMPO</span>
          <span style={{ color: t.tempoGreen, fontSize: 11, fontWeight: 600 }}>
            {tempo}%
          </span>
        </div>
        <div
          className="rounded px-1"
          style={{
            backgroundColor: `${t.tabActiveBg}`,
            fontSize: 8,
            color: '#fff',
            padding: '1px 3px',
          }}
        >
          {tempoRange}
        </div>
        <div className="flex flex-col items-end">
          <span style={{ color: t.categoryText, fontSize: 7 }}>BPM</span>
          <span
            style={{
              color: t.bpmColor,
              fontSize: t.fontSize.bpm,
              fontWeight: 700,
              fontFamily: t.fontMono,
            }}
          >
            {bpm.toFixed(1).replace(/\./, '.')}
          </span>
        </div>
        {masterSync && (
          <div
            className="flex flex-col items-center"
            style={{ fontSize: 7 }}
          >
            {masterSync === 'MASTER' && (
              <span
                className="rounded px-1"
                style={{
                  backgroundColor: t.masterYellow,
                  color: '#000',
                  fontWeight: 700,
                }}
              >
                MASTER
              </span>
            )}
            {masterSync === 'SYNC' && (
              <span
                className="rounded px-1"
                style={{
                  backgroundColor: t.syncGreen,
                  color: '#000',
                  fontWeight: 700,
                }}
              >
                SYNC
              </span>
            )}
          </div>
        )}
        {masterTempo && (
          <span style={{ color: t.mtIndicator, fontSize: 7, fontWeight: 700 }}>MT</span>
        )}
        <span
          style={{
            color: keyMatch ? t.syncGreen : t.keyColor,
            fontSize: 10,
            fontWeight: 500,
          }}
        >
          {musicalKey}
        </span>
      </div>
    </div>
  );
}
