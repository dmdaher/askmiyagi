'use client';

import React from 'react';
import theme from '../device-theme.json';
import CategorySidebar from '../atoms/CategorySidebar';
import TrackListRow from '../atoms/TrackListRow';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface BrowseTrack {
  title: string;
  artist?: string;
  bpm?: number;
  musicalKey?: string;
  isPlaying?: boolean;
}

interface BrowseScreenProps {
  /** Category sidebar categories */
  categories?: string[];
  /** Active category */
  activeCategory?: string;
  /** Device type shown in sidebar */
  deviceType?: 'USB' | 'SD' | 'LINK';
  /** Current folder/list name */
  folderName?: string;
  /** Tracks in the current view */
  tracks?: BrowseTrack[];
  /** Currently selected track index */
  selectedIndex?: number;
  /** Whether PREVIEW column is visible */
  showPreview?: boolean;
  /** Column sort indicators */
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  /** Status bar props passed through */
  playerNumber?: number;
  time?: string;
  timeMsec?: string;
  bpm?: number;
  tempo?: string;
  tempoRange?: string;
  musicalKey?: string;
  masterSync?: 'MASTER' | 'SYNC' | null;
}

const DEFAULT_TRACKS: BrowseTrack[] = [
  { title: '6AM (Original Mix)', artist: 'Juliet Fox', bpm: 124.0, musicalKey: '3B' },
  { title: "Can't Stop, Won't Stop (Original Mix)", artist: 'Karuna', bpm: 124.0, musicalKey: '6A', isPlaying: true },
  { title: 'Extra Trippy (Original Mix)', artist: 'Danny Howard', bpm: 125.0, musicalKey: '4B' },
  { title: 'Feel Alright (Original Mix)', artist: 'Franky Rizardo', bpm: 127.0, musicalKey: '4A' },
  { title: 'Friends (Original Mix)', artist: 'Capa', bpm: 125.0, musicalKey: '4B' },
  { title: 'Get Down (Original Mix)', artist: 'Eli Brown', bpm: 125.0, musicalKey: '4A' },
  { title: 'In All The Fire (Original Mix)', artist: 'Tinlicker', bpm: 124.0, musicalKey: '4A' },
  { title: 'Kwelanga (Original Mix)', artist: 'Secondcity', bpm: 124.0, musicalKey: '9B' },
  { title: 'Liar', artist: 'The Erised', bpm: 131.0, musicalKey: '6A' },
  { title: 'Misidentify (Original Mix)', artist: 'PROFF ft. Cory Friesenhan', bpm: 128.0, musicalKey: '8A' },
];

/**
 * Browse/track list screen. Displayed when BROWSE, TAG LIST, PLAYLIST,
 * or SEARCH button is pressed. Matches manual page 19.
 *
 * Layout:
 * - Left: Category sidebar (TRACK, ARTIST, ALBUM, etc.)
 * - Top: Breadcrumb path + PREVIEW/font-size/INFO buttons
 * - Center: Track list table with columns
 * - Bottom: Playback status bar
 */
export default function BrowseScreen({
  categories = ['TRACK', 'ARTIST', 'ALBUM', 'BPM', 'KEY', 'S/H', 'HISTORY'],
  activeCategory = 'TRACK',
  deviceType = 'USB',
  folderName = 'Playlist 001',
  tracks = DEFAULT_TRACKS,
  selectedIndex = 1,
  showPreview = true,
  sortColumn = 'TRACK',
  sortDirection = 'asc',
  playerNumber = 2,
  time = '03:10',
  timeMsec = '780',
  bpm = 128.0,
  tempo = '+3.20',
  tempoRange = '10',
  musicalKey = 'Gm',
  masterSync = null,
}: BrowseScreenProps) {
  const columns = [
    ...(showPreview ? ['PREVIEW'] : []),
    'TRACK',
    '[0020]',
    'ARTIST',
    '',
    'BPM',
    'KEY',
  ];

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: t.backgroundColor,
        fontFamily: t.fontFamily,
      }}
    >
      <div className="flex flex-1 min-h-0">
        {/* Category sidebar */}
        <CategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          deviceType={deviceType}
        />

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top toolbar: back button, folder name, PREVIEW/font/INFO */}
          <div
            className="flex items-center justify-between px-2 py-1"
            style={{
              backgroundColor: t.headerBg,
              borderBottom: `1px solid ${t.borderColor}`,
            }}
          >
            <div className="flex items-center gap-1">
              <span style={{ color: t.categoryText, fontSize: 10 }}>&#8592;</span>
              <span style={{ color: t.categoryText, fontSize: 9 }}>&#9776;</span>
              <span
                style={{
                  color: t.textColor,
                  fontSize: t.fontSize.label,
                  fontWeight: 500,
                }}
              >
                {folderName}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
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
              <span
                style={{
                  color: t.categoryText,
                  fontSize: 10,
                }}
              >
                A<span style={{ fontSize: 8 }}>A</span>
              </span>
              <span
                style={{
                  color: t.categoryText,
                  fontSize: 8,
                  marginLeft: 4,
                }}
              >
                &#9432; INFO
              </span>
            </div>
          </div>

          {/* Column header row */}
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
            <span className="flex-1">
              TRACK {sortColumn === 'TRACK' ? (sortDirection === 'asc' ? '&#9650;' : '&#9660;') : ''}
            </span>
            <span className="truncate" style={{ maxWidth: 80 }}>ARTIST &#9650;</span>
            <span style={{ fontSize: 7 }}>&#9830;</span>
            <span style={{ minWidth: 32, textAlign: 'right' }}>BPM &#9660;</span>
            <span style={{ minWidth: 18, textAlign: 'right' }}>KEY</span>
          </div>

          {/* Track list */}
          <div className="flex-1 overflow-auto">
            {tracks.map((track, i) => (
              <TrackListRow
                key={`${track.title}-${i}`}
                index={i}
                title={track.title}
                artist={track.artist}
                bpm={track.bpm}
                musicalKey={track.musicalKey}
                isSelected={i === selectedIndex}
                isPlaying={track.isPlaying}
                hasPreview={showPreview}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Status bar at bottom */}
      <StatusBar
        playerNumber={playerNumber}
        time={time}
        timeMsec={timeMsec}
        bpm={bpm}
        tempo={tempo}
        tempoRange={tempoRange}
        musicalKey={musicalKey}
        masterSync={masterSync}
      />
    </div>
  );
}
