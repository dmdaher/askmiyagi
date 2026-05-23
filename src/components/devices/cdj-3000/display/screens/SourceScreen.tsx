'use client';

import React from 'react';
import theme from '../device-theme.json';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface SourceDevice {
  type: 'USB' | 'SD' | 'LINK';
  name: string;
  playerNumber?: number;
  isLoaded?: boolean;
  songs?: number;
  playlists?: number;
  date?: string;
  totalSize?: string;
  availableSize?: string;
  backgroundColor?: string;
}

interface SourceScreenProps {
  devices?: SourceDevice[];
  selectedIndex?: number;
  // Status bar passthrough
  playerNumber?: number;
  time?: string;
  timeMsec?: string;
  bpm?: number;
  tempo?: string;
  tempoRange?: string;
  musicalKey?: string;
}

const DEFAULT_DEVICES: SourceDevice[] = [
  {
    type: 'USB',
    name: 'Device Pioneer DJ 001',
    playerNumber: 1,
    isLoaded: true,
    songs: 20,
    playlists: 10,
    date: '2020-04-28',
    totalSize: '235.5',
    availableSize: '108.9',
  },
  { type: 'USB', name: 'Device Pioneer DJ 002', playerNumber: 2 },
  { type: 'SD', name: 'Device Pioneer DJ 003', playerNumber: 3 },
];

/**
 * SOURCE screen shown when SOURCE button is pressed. Allows selecting
 * which storage device to browse. Matches manual page 18.
 *
 * Layout:
 * - Title bar: "SOURCE"
 * - Left panel: list of connected devices with type icon and name
 * - Right panel: device information for highlighted device
 * - Bottom: MY SETTINGS LOAD button + status bar
 */
export default function SourceScreen({
  devices = DEFAULT_DEVICES,
  selectedIndex = 0,
  playerNumber = 2,
  time = '03:10',
  timeMsec = '780',
  bpm = 128.0,
  tempo = '+3.20',
  tempoRange = '10',
  musicalKey = 'Gm',
}: SourceScreenProps) {
  const selected = devices[selectedIndex];

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
      {/* Title */}
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
        SOURCE
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Device list */}
        <div className="flex-1 flex flex-col">
          {devices.map((device, i) => {
            const isSelected = i === selectedIndex;
            return (
              <div
                key={`${device.name}-${i}`}
                className="flex items-center gap-2 px-3 py-2"
                style={{
                  backgroundColor: isSelected ? t.selectedRowBg : 'transparent',
                  borderLeft: isSelected ? `3px solid ${t.selectedRowBorder}` : '3px solid transparent',
                }}
              >
                {/* Device type badge */}
                <div className="flex flex-col items-center gap-0.5">
                  {device.playerNumber && (
                    <span
                      style={{
                        color: t.categoryText,
                        fontSize: 7,
                        fontFamily: t.fontMono,
                      }}
                    >
                      {device.playerNumber}
                    </span>
                  )}
                  <div
                    className="flex items-center justify-center rounded"
                    style={{
                      backgroundColor: device.backgroundColor || deviceColors[device.type],
                      width: 28,
                      height: 20,
                      fontSize: 7,
                      fontWeight: 700,
                      color: '#000',
                    }}
                  >
                    {device.type === 'LINK' ? (
                      <span style={{ fontSize: 6 }}>LINK</span>
                    ) : (
                      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                        {device.type === 'USB' ? (
                          <path d="M6 1v4M4 3h4M3 5v4a2 2 0 002 2h2a2 2 0 002-2V5H3z" stroke="#000" strokeWidth={1.2} />
                        ) : (
                          <rect x={2} y={1} width={8} height={10} rx={1} stroke="#000" strokeWidth={1.2} />
                        )}
                      </svg>
                    )}
                  </div>
                </div>

                {/* Device name */}
                <span
                  style={{
                    color: isSelected ? '#fff' : t.textColor,
                    fontSize: t.fontSize.value,
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {device.name}
                </span>

                {/* Loaded indicator */}
                {device.isLoaded && (
                  <span
                    className="ml-auto px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${t.accentColor}20`,
                      color: t.accentColor,
                      fontSize: 8,
                      fontWeight: 600,
                    }}
                  >
                    Loaded
                  </span>
                )}
                {isSelected && (
                  <span style={{ color: t.categoryText, fontSize: 12, marginLeft: 'auto' }}>
                    &#9654;
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Device information panel */}
        {selected && selected.isLoaded && (
          <div
            className="flex flex-col gap-1 px-3 py-2"
            style={{
              width: 160,
              borderLeft: `1px solid ${t.borderColor}`,
              backgroundColor: t.categoryBg,
              fontSize: 9,
            }}
          >
            <InfoRow label="Songs" value={String(selected.songs ?? '')} />
            <InfoRow label="Playlists" value={String(selected.playlists ?? '')} />
            <InfoRow label="Date" value={selected.date ?? ''} />
            <InfoRow label="Total" value={selected.totalSize ? `${selected.totalSize} GB` : ''} />
            <InfoRow label="Available" value={selected.availableSize ? `${selected.availableSize} GB` : ''} />
            <div className="flex items-center gap-1 mt-1">
              <span style={{ color: t.categoryText, fontSize: 8 }}>Background Color</span>
              <span
                className="px-2 py-0.5 rounded"
                style={{
                  border: `1px solid ${t.borderColor}`,
                  color: t.textColor,
                  fontSize: 8,
                }}
              >
                Default
              </span>
            </div>
            <div
              className="mt-2 px-2 py-1.5 text-center rounded"
              style={{
                backgroundColor: t.tabInactiveBg,
                border: `1px solid ${t.borderColor}`,
                color: t.textColor,
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              MY SETTINGS LOAD
            </div>
          </div>
        )}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: t.categoryText }}>{label}</span>
      <span style={{ color: t.textColor, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
