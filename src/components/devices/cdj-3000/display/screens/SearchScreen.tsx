'use client';

import React from 'react';
import theme from '../device-theme.json';
import TrackListRow from '../atoms/TrackListRow';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface SearchTrack {
  title: string;
  artist?: string;
  bpm?: number;
  musicalKey?: string;
}

interface SearchScreenProps {
  /** Current search query */
  query?: string;
  /** Search results */
  results?: SearchTrack[];
  /** Selected result index */
  selectedIndex?: number;
  /** Show preview column */
  showPreview?: boolean;
  /** Device type */
  deviceType?: 'USB' | 'SD' | 'LINK';
  // Status bar
  playerNumber?: number;
  time?: string;
  timeMsec?: string;
  bpm?: number;
  tempo?: string;
  tempoRange?: string;
  musicalKey?: string;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'X'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'CLEAR'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SPACE'],
];

const DEFAULT_RESULTS: SearchTrack[] = [
  { title: "Can't Stop, Won't Stop (Original Mix)", artist: 'Karuna', bpm: 124.0, musicalKey: '6A' },
  { title: 'Extra Trippy (Original Mix)', artist: 'Danny Howard', bpm: 125.0, musicalKey: '4B' },
  { title: 'Feel Alright (Original Mix)', artist: 'Franky Rizardo', bpm: 127.0, musicalKey: '4A' },
  { title: 'Friends (Original Mix)', artist: 'Capa', bpm: 125.0, musicalKey: '4B' },
  { title: 'Get Down (Original Mix)', artist: 'Eli Brown', bpm: 125.0, musicalKey: '4A' },
  { title: 'In All The Fire (Original Mix)', artist: 'Tinlicker', bpm: 124.0, musicalKey: '4A' },
];

/**
 * Search screen with on-screen QWERTY keyboard. Shown when SEARCH button
 * is pressed while browsing the rekordbox library. Matches manual page 36.
 *
 * Layout:
 * - Top: device icon + search input + PREVIEW/font/INFO buttons
 * - Middle: Track list results
 * - Bottom: On-screen keyboard + status bar
 */
export default function SearchScreen({
  query = '',
  results = DEFAULT_RESULTS,
  selectedIndex = 0,
  showPreview = true,
  deviceType = 'USB',
  playerNumber = 2,
  time = '03:10',
  timeMsec = '780',
  bpm = 128.0,
  tempo = '+3.20',
  tempoRange = '10',
  musicalKey = 'Gm',
}: SearchScreenProps) {
  const deviceColors: Record<string, string> = {
    USB: t.accentColor,
    SD: '#ff8800',
    LINK: '#44cc44',
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: t.backgroundColor,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Top toolbar: search input */}
      <div
        className="flex items-center gap-2 px-2 py-1"
        style={{
          backgroundColor: t.headerBg,
          borderBottom: `1px solid ${t.borderColor}`,
        }}
      >
        <div
          className="flex items-center justify-center rounded"
          style={{
            backgroundColor: deviceColors[deviceType],
            width: 18,
            height: 18,
            fontSize: 7,
            color: '#000',
          }}
        >
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path d="M5 1v3M3.5 2.5h3M2.5 4v4a1.5 1.5 0 001.5 1.5h2A1.5 1.5 0 008 8V4H2.5z" stroke="#000" strokeWidth={1} />
          </svg>
        </div>
        <div className="flex items-center gap-1">
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <circle cx={5} cy={5} r={3.5} stroke={t.categoryText} strokeWidth={1} />
            <line x1={7.5} y1={7.5} x2={10} y2={10} stroke={t.categoryText} strokeWidth={1} />
          </svg>
          <span style={{ color: t.textColor, fontSize: 10 }}>
            {query || ''}
          </span>
          <span
            style={{
              color: t.accentColor,
              fontSize: 10,
              animation: 'blink 1s step-end infinite',
            }}
          >
            |
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {showPreview && (
            <span
              className="px-2 py-0.5 rounded"
              style={{
                backgroundColor: t.accentColor,
                color: '#fff',
                fontSize: 8,
                fontWeight: 700,
              }}
            >
              PREVIEW
            </span>
          )}
          <span style={{ color: t.categoryText, fontSize: 10 }}>
            A<span style={{ fontSize: 8 }}>A</span>
          </span>
          <span style={{ color: t.categoryText, fontSize: 8 }}>&#9432; INFO</span>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center px-2 py-0.5 gap-2"
        style={{
          backgroundColor: t.categoryBg,
          borderBottom: `1px solid ${t.borderColor}`,
          fontSize: 8,
          fontWeight: 600,
          color: t.categoryText,
        }}
      >
        {showPreview && <span style={{ minWidth: 30 }}>PREVIEW</span>}
        <span style={{ minWidth: 20, textAlign: 'right' }}>#</span>
        <span style={{ fontSize: 8 }}>&#9654;</span>
        <span className="flex-1">TRACK &#9650;</span>
        <span className="truncate" style={{ maxWidth: 80 }}>ARTIST &#9650;</span>
        <span style={{ fontSize: 7 }}>&#9830;</span>
        <span style={{ minWidth: 32, textAlign: 'right' }}>BPM &#9660;</span>
        <span style={{ minWidth: 18, textAlign: 'right' }}>KEY</span>
      </div>

      {/* Track results */}
      <div className="flex-1 overflow-auto min-h-0">
        {results.map((track, i) => (
          <TrackListRow
            key={`${track.title}-${i}`}
            index={i}
            title={track.title}
            artist={track.artist}
            bpm={track.bpm}
            musicalKey={track.musicalKey}
            isSelected={i === selectedIndex}
            hasPreview={showPreview}
          />
        ))}
      </div>

      {/* On-screen keyboard */}
      <div
        className="flex flex-col gap-0.5 px-2 py-1.5"
        style={{
          backgroundColor: t.categoryBg,
          borderTop: `1px solid ${t.borderColor}`,
        }}
      >
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-0.5 justify-center">
            {ri === 0 && (
              <div
                className="flex items-center justify-center rounded"
                style={{
                  backgroundColor: t.tabInactiveBg,
                  color: t.categoryText,
                  fontSize: 8,
                  minWidth: 24,
                  height: 20,
                  border: `1px solid ${t.borderColor}`,
                }}
              >
                123
              </div>
            )}
            {row.map((key) => {
              const isWide = key === 'CLEAR' || key === 'SPACE';
              return (
                <div
                  key={key}
                  className="flex items-center justify-center rounded"
                  style={{
                    backgroundColor: t.tabInactiveBg,
                    color: t.textColor,
                    fontSize: isWide ? 8 : 10,
                    fontWeight: 500,
                    minWidth: isWide ? 44 : 22,
                    height: 20,
                    border: `1px solid ${t.borderColor}`,
                  }}
                >
                  {key}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <StatusBar
        playerNumber={playerNumber}
        time={time}
        timeMsec={timeMsec}
        bpm={bpm}
        tempo={tempo}
        tempoRange={tempoRange}
        musicalKey={musicalKey}
      />
    </div>
  );
}
