'use client';

import React from 'react';
import theme from '../device-theme.json';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface ShortcutScreenProps {
  /** Waveform/Phase meter display setting */
  waveformPhaseMeter?: 'PHASE METER' | 'WAVEFORM';
  /** Hot Cue Auto Load setting */
  hotCueAutoLoad?: 'OFF' | 'rekordbox SETTING' | 'ON';
  /** LCD Brightness */
  lcdBrightness?: number;
  /** Jog LCD Brightness */
  jogLcdBrightness?: number;
  /** Quantize beat value */
  quantizeBeatValue?: string;
  /** Beat jump beat value */
  beatJumpBeatValue?: number;
  /** Waveform color mode */
  waveformColor?: 'BLUE' | 'RGB' | '3 BAND';
  /** Waveform current position */
  waveformCurrentPosition?: 'CENTER' | 'LEFT';
  /** Connected device name */
  deviceName?: string;
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

/**
 * SHORTCUT screen for quick access to common settings.
 * Shown when SHORTCUT button is pressed. Matches manual page 79.
 *
 * Layout (4 quadrants):
 * 1. Player settings (top left) - waveform/phase, hot cue, brightness, quantize/beat jump
 * 2. Device information (top right) - connected device info
 * 3. Device settings (bottom left) - waveform color, position
 * 4. My Settings (bottom right) - LOAD/SAVE buttons
 */
export default function ShortcutScreen({
  waveformPhaseMeter = 'WAVEFORM',
  hotCueAutoLoad = 'rekordbox SETTING',
  lcdBrightness = 3,
  jogLcdBrightness = 3,
  quantizeBeatValue = '1',
  beatJumpBeatValue = 16,
  waveformColor = 'BLUE',
  waveformCurrentPosition = 'CENTER',
  deviceName = 'Device Pioneer DJ 001',
  deviceType = 'USB',
  playerNumber = 2,
  time = '03:10',
  timeMsec = '780',
  bpm = 128.0,
  tempo = '+3.20',
  tempoRange = '10',
  musicalKey = 'Gm',
}: ShortcutScreenProps) {
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
        SHORTCUT
      </div>

      {/* Main content: 4-quadrant grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-0">
        {/* Q1: Player settings */}
        <div
          className="flex flex-col gap-1.5 p-2"
          style={{ borderRight: `1px solid ${t.borderColor}`, borderBottom: `1px solid ${t.borderColor}` }}
        >
          {/* Waveform/Phase Meter */}
          <SettingRow label="WAVEFORM/PHASE METER">
            <ToggleGroup
              options={[
                { value: 'PHASE METER', label: 'PHASE METER' },
                { value: 'WAVEFORM', label: 'WAVEFORM' },
              ]}
              selected={waveformPhaseMeter}
            />
          </SettingRow>

          {/* Hot Cue Auto Load */}
          <SettingRow label="HOT CUE AUTO LOAD">
            <div className="flex gap-0.5">
              {['ON', 'rekordbox', 'OFF'].map((v) => {
                const isSelected =
                  v === hotCueAutoLoad ||
                  (v === 'rekordbox' && hotCueAutoLoad === 'rekordbox SETTING');
                return (
                  <span
                    key={v}
                    className="px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isSelected ? t.tabActiveBg : t.tabInactiveBg,
                      color: isSelected ? '#fff' : t.categoryText,
                      fontSize: 7,
                      fontWeight: 600,
                    }}
                  >
                    {v === 'rekordbox' ? (
                      <span>&#9833;</span>
                    ) : (
                      v
                    )}
                  </span>
                );
              })}
            </div>
          </SettingRow>

          {/* LCD Brightness */}
          <SettingRow label="LCD BRIGHTNESS">
            <NumberStepper value={lcdBrightness} min={1} max={5} />
          </SettingRow>

          {/* Jog LCD Brightness */}
          <SettingRow label="JOG LCD BRIGHTNESS">
            <NumberStepper value={jogLcdBrightness} min={1} max={5} />
          </SettingRow>

          {/* Quantize Beat Value */}
          <SettingRow label="QUANTIZE BEAT VALUE">
            <div className="flex gap-0.5">
              {['1/8', '1/4', '1/2', '1'].map((v) => (
                <span
                  key={v}
                  className="px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: v === quantizeBeatValue ? t.tabActiveBg : t.tabInactiveBg,
                    color: v === quantizeBeatValue ? '#fff' : t.categoryText,
                    fontSize: 8,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          </SettingRow>

          {/* Beat Jump Beat Value */}
          <SettingRow label="BEAT JUMP BEAT VALUE">
            <div className="flex flex-wrap gap-0.5">
              {['1/2', '1', '2', '4', '8', '16', '32', '64'].map((v) => (
                <span
                  key={v}
                  className="px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: String(beatJumpBeatValue) === v ? t.tabActiveBg : t.tabInactiveBg,
                    color: String(beatJumpBeatValue) === v ? '#fff' : t.categoryText,
                    fontSize: 8,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* Q2: Device information */}
        <div
          className="flex flex-col gap-1 p-2"
          style={{ borderBottom: `1px solid ${t.borderColor}` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="flex items-center justify-center rounded"
              style={{
                backgroundColor: t.accentColor,
                width: 22,
                height: 18,
                fontSize: 7,
                color: '#000',
              }}
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <path d="M5 1v3M3.5 2.5h3M2.5 4v4a1.5 1.5 0 001.5 1.5h2A1.5 1.5 0 008 8V4H2.5z" stroke="#000" strokeWidth={1} />
              </svg>
            </div>
            <span style={{ color: t.textColor, fontSize: 10 }}>{deviceName}</span>
          </div>

          {/* Visual representation of device */}
          <div
            className="flex items-center justify-center flex-1 rounded"
            style={{
              backgroundColor: t.categoryBg,
              border: `1px solid ${t.borderColor}`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <svg width={40} height={30} viewBox="0 0 40 30" fill="none">
                <rect x={5} y={2} width={30} height={20} rx={2} stroke={t.categoryText} strokeWidth={0.8} />
                <rect x={10} y={5} width={20} height={12} rx={1} stroke={t.accentColor} strokeWidth={0.5} fill={`${t.accentColor}10`} />
                <circle cx={20} cy={24} r={3} stroke={t.categoryText} strokeWidth={0.6} />
              </svg>
              <span style={{ color: t.categoryText, fontSize: 7 }}>
                {deviceType}
              </span>
            </div>
          </div>
        </div>

        {/* Q3: Device settings */}
        <div
          className="flex flex-col gap-1.5 p-2"
          style={{ borderRight: `1px solid ${t.borderColor}` }}
        >
          <SettingRow label="WAVEFORM COLOR">
            <ToggleGroup
              options={[
                { value: 'BLUE', label: 'BLUE' },
                { value: 'RGB', label: 'RGB' },
                { value: '3 BAND', label: '3 BAND' },
              ]}
              selected={waveformColor}
            />
          </SettingRow>
          <SettingRow label="WAVEFORM CURRENT POSITION">
            <ToggleGroup
              options={[
                { value: 'LEFT', label: 'LEFT' },
                { value: 'CENTER', label: 'CENTER' },
              ]}
              selected={waveformCurrentPosition}
            />
          </SettingRow>
        </div>

        {/* Q4: My Settings */}
        <div className="flex flex-col items-center justify-center gap-2 p-2">
          <span style={{ color: t.categoryText, fontSize: 9, fontWeight: 600 }}>MY SETTINGS</span>
          <div
            className="px-6 py-1.5 rounded"
            style={{
              backgroundColor: t.tabInactiveBg,
              border: `1px solid ${t.borderColor}`,
              color: t.textColor,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            LOAD
          </div>
          <div
            className="px-6 py-1.5 rounded"
            style={{
              backgroundColor: t.tabInactiveBg,
              border: `1px solid ${t.borderColor}`,
              color: t.textColor,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            SAVE
          </div>
        </div>
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

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ color: t.categoryText, fontSize: 7, fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  );
}

function ToggleGroup({
  options,
  selected,
}: {
  options: { value: string; label: string }[];
  selected: string;
}) {
  return (
    <div className="flex gap-0.5">
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <span
            key={opt.value}
            className="px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: isSelected ? t.tabActiveBg : t.tabInactiveBg,
              color: isSelected ? '#fff' : t.categoryText,
              fontSize: 8,
              fontWeight: isSelected ? 700 : 400,
            }}
          >
            {opt.label}
          </span>
        );
      })}
    </div>
  );
}

function NumberStepper({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: t.tabInactiveBg,
          color: value > min ? t.textColor : t.categoryText,
          fontSize: 10,
          border: `1px solid ${t.borderColor}`,
        }}
      >
        {'<'}
      </span>
      <span
        style={{
          color: t.textColor,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: t.fontMono,
          minWidth: 14,
          textAlign: 'center',
        }}
      >
        {value}
      </span>
      <span
        className="px-1.5 py-0.5 rounded"
        style={{
          backgroundColor: t.tabInactiveBg,
          color: value < max ? t.textColor : t.categoryText,
          fontSize: 10,
          border: `1px solid ${t.borderColor}`,
        }}
      >
        {'>'}
      </span>
    </div>
  );
}
