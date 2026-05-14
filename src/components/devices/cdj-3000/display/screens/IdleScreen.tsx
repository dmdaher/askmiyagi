'use client';

import React from 'react';
import theme from '../device-theme.json';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface IdleScreenProps {
  /** Player number */
  playerNumber?: number;
  /** Connected device type if any */
  deviceType?: 'USB' | 'SD' | null;
  /** Whether a storage device is connected */
  storageConnected?: boolean;
}

/**
 * Idle/startup screen shown when the CDJ-3000 is powered on but
 * no track is loaded. Shows the Pioneer DJ logo and basic status.
 */
export default function IdleScreen({
  playerNumber = 2,
  deviceType = null,
  storageConnected = false,
}: IdleScreenProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: t.backgroundColor,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Main content: centered Pioneer DJ branding */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Pioneer DJ logo text */}
        <svg width={200} height={40} viewBox="0 0 200 40">
          <text
            x={100}
            y={28}
            textAnchor="middle"
            fill={t.textColor}
            fontSize={20}
            fontWeight={700}
            fontFamily="'Helvetica Neue', Arial, sans-serif"
            letterSpacing={3}
          >
            Pioneer DJ
          </text>
          <line x1={30} y1={36} x2={170} y2={36} stroke={t.accentColor} strokeWidth={1.5} />
        </svg>

        {/* Device status */}
        {storageConnected && deviceType && (
          <div className="flex items-center gap-2 mt-4">
            <div
              className="flex items-center justify-center rounded"
              style={{
                backgroundColor: deviceType === 'USB' ? t.accentColor : '#ff8800',
                width: 24,
                height: 18,
                fontSize: 7,
                fontWeight: 700,
                color: '#000',
              }}
            >
              {deviceType}
            </div>
            <span style={{ color: t.categoryText, fontSize: 10 }}>
              {deviceType} device connected
            </span>
          </div>
        )}

        {!storageConnected && (
          <span
            style={{
              color: t.categoryText,
              fontSize: 10,
              marginTop: 16,
            }}
          >
            No track loaded
          </span>
        )}
      </div>

      {/* Status bar - minimal info */}
      <StatusBar
        playerNumber={playerNumber}
        time="00:00"
        timeMsec="000"
        isRemain={false}
        bpm={0}
        tempo="+0.00"
        tempoRange="10"
        musicalKey=""
      />
    </div>
  );
}
