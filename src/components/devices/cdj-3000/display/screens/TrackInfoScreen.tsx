'use client';

import React from 'react';
import theme from '../device-theme.json';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface TrackInfoScreenProps {
  /** Track title */
  title?: string;
  /** Track artist */
  artist?: string;
  /** Album name */
  album?: string;
  /** Genre */
  genre?: string;
  /** Track duration */
  duration?: string;
  /** BPM */
  bpm?: number;
  /** Musical key */
  musicalKey?: string;
  /** Rating 0-5 */
  rating?: number;
  /** Color label */
  colorLabel?: string;
  /** Comment field */
  comment?: string;
  /** Date added */
  dateAdded?: string;
  /** Bitrate */
  bitrate?: string;
  /** File path */
  filePath?: string;
  /** Album artwork present */
  hasArtwork?: boolean;
  // Status bar
  playerNumber?: number;
  time?: string;
  timeMsec?: string;
  tempoValue?: number;
  tempo?: string;
  tempoRange?: string;
}

/**
 * Detailed track information screen. Shown when INFO button is tapped
 * or when (i) icon is pressed on the waveform screen.
 * Shows metadata fields from the rekordbox library.
 */
export default function TrackInfoScreen({
  title = "Can't Stop, Won't Stop (Original Mix)",
  artist = 'Karuna',
  album = 'Various Artists Collection',
  genre = 'Deep House',
  duration = '05:49',
  bpm = 124.0,
  musicalKey = 'Gm',
  rating = 4,
  colorLabel,
  comment = '',
  dateAdded = '2020-04-28',
  bitrate = '320kbps',
  filePath,
  hasArtwork = true,
  playerNumber = 2,
  time = '03:10',
  timeMsec = '780',
  tempoValue = 128.0,
  tempo = '+3.20',
  tempoRange = '10',
}: TrackInfoScreenProps) {
  const fields = [
    { label: 'Title', value: title },
    { label: 'Artist', value: artist },
    { label: 'Album', value: album },
    { label: 'Genre', value: genre },
    { label: 'Duration', value: duration },
    { label: 'BPM', value: bpm?.toFixed(1) },
    { label: 'Key', value: musicalKey },
    { label: 'Rating', value: rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '-' },
    { label: 'Date Added', value: dateAdded },
    { label: 'Bitrate', value: bitrate },
    ...(comment ? [{ label: 'Comment', value: comment }] : []),
    ...(filePath ? [{ label: 'File', value: filePath }] : []),
  ];

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: t.backgroundColor,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Title bar */}
      <div
        className="px-3 py-1.5"
        style={{
          backgroundColor: t.headerBg,
          borderBottom: `1px solid ${t.borderColor}`,
          fontSize: 12,
          fontWeight: 700,
          color: t.textColor,
        }}
      >
        TRACK INFO
      </div>

      {/* Content: artwork + fields */}
      <div className="flex flex-1 min-h-0 gap-3 p-3">
        {/* Artwork */}
        {hasArtwork && (
          <div
            className="flex items-center justify-center rounded"
            style={{
              width: 100,
              height: 100,
              backgroundColor: t.categoryBg,
              border: `1px solid ${t.borderColor}`,
              flexShrink: 0,
            }}
          >
            <svg width={60} height={60} viewBox="0 0 60 60">
              <defs>
                <linearGradient id="artInfoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2a1020" />
                  <stop offset="100%" stopColor="#102040" />
                </linearGradient>
              </defs>
              <rect width={60} height={60} rx={4} fill="url(#artInfoGrad)" />
              <text x={30} y={34} textAnchor="middle" fill={t.categoryText} fontSize={8}>
                &#9835; Artwork
              </text>
            </svg>
          </div>
        )}

        {/* Metadata fields */}
        <div className="flex-1 flex flex-col gap-0.5 overflow-auto">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-baseline gap-2"
            >
              <span
                style={{
                  color: t.categoryText,
                  fontSize: 9,
                  minWidth: 60,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {field.label}
              </span>
              <span
                style={{
                  color: t.textColor,
                  fontSize: 10,
                  fontWeight: 500,
                }}
              >
                {field.value || '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        playerNumber={playerNumber}
        time={time}
        timeMsec={timeMsec}
        bpm={tempoValue}
        tempo={tempo}
        tempoRange={tempoRange}
        musicalKey={musicalKey}
      />
    </div>
  );
}
