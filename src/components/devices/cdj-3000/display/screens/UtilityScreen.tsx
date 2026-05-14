'use client';

import React from 'react';
import theme from '../device-theme.json';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface UtilitySetting {
  label: string;
  value: string;
  hasSubmenu?: boolean;
}

interface UtilityScreenProps {
  /** Active category in left sidebar */
  activeCategory?: string;
  /** Settings list for the active category */
  settings?: UtilitySetting[];
  /** Selected setting index */
  selectedIndex?: number;
  /** Available option values for selected setting */
  options?: { value: string; selected?: boolean }[];
  /** Firmware version */
  versionNumber?: string;
  // Status bar
  playerNumber?: number;
  time?: string;
  timeMsec?: string;
  bpm?: number;
  tempo?: string;
  tempoRange?: string;
  musicalKey?: string;
}

const UTILITY_CATEGORIES = [
  'DJ SETTING',
  'DISPLAY (LCD)',
  'DISPLAY (INDICATOR)',
  'PRO DJ LINK',
  'SYSTEM',
  'INFO',
];

const DEFAULT_SETTINGS: UtilitySetting[] = [
  { label: 'LCD BRIGHTNESS', value: '3' },
  { label: 'JOG LCD BRIGHTNESS', value: '3' },
  { label: 'LANGUAGE', value: 'ENGLISH' },
  { label: 'SCREEN SAVER', value: 'ON' },
  { label: 'TOUCH DISPLAY CALIBRATION', value: '', hasSubmenu: true },
];

/**
 * UTILITY settings screen. Shown when MENU/UTILITY button is pressed and held.
 * Matches manual page 73.
 *
 * Layout:
 * - Left sidebar: setting categories (DJ SETTING, DISPLAY, etc.)
 * - Center: settings list with current values
 * - Right: option values (radio buttons)
 */
export default function UtilityScreen({
  activeCategory = 'DISPLAY (LCD)',
  settings = DEFAULT_SETTINGS,
  selectedIndex = 1,
  options,
  versionNumber = 'Ver.1.00.002',
  playerNumber = 2,
  time = '03:10',
  timeMsec = '780',
  bpm = 128.0,
  tempo = '+3.20',
  tempoRange = '10',
  musicalKey = 'Gm',
}: UtilityScreenProps) {
  const selectedSetting = settings[selectedIndex];

  // Generate default options if not provided
  const displayOptions = options || [
    { value: '1', selected: false },
    { value: '2', selected: false },
    { value: '3', selected: selectedSetting?.value === '3' },
    { value: '4', selected: false },
    { value: '5', selected: false },
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
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          backgroundColor: t.headerBg,
          borderBottom: `1px solid ${t.borderColor}`,
        }}
      >
        <span style={{ color: t.textColor, fontSize: 12, fontWeight: 700 }}>
          UTILITY
        </span>
        <span style={{ color: t.categoryText, fontSize: 8 }}>{versionNumber}</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: categories */}
        <div
          className="flex flex-col py-1"
          style={{
            backgroundColor: t.categorySidebar,
            width: 70,
            borderRight: `1px solid ${t.borderColor}`,
          }}
        >
          {UTILITY_CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <div
                key={cat}
                className="px-2 py-1.5"
                style={{
                  color: isActive ? t.categoryActiveText : t.categoryText,
                  fontSize: 7,
                  fontWeight: isActive ? 700 : 400,
                  backgroundColor: isActive ? `${t.accentColor}15` : 'transparent',
                  borderLeft: isActive ? `2px solid ${t.accentColor}` : '2px solid transparent',
                  lineHeight: 1.3,
                }}
              >
                {cat}
              </div>
            );
          })}
        </div>

        {/* Center: settings list */}
        <div className="flex-1 flex flex-col">
          {settings.map((setting, i) => {
            const isSelected = i === selectedIndex;
            return (
              <div
                key={setting.label}
                className="flex items-center justify-between px-3 py-1.5"
                style={{
                  backgroundColor: isSelected ? t.selectedRowBg : 'transparent',
                  borderLeft: isSelected ? `2px solid ${t.selectedRowBorder}` : '2px solid transparent',
                }}
              >
                <span
                  style={{
                    color: isSelected ? '#fff' : t.textColor,
                    fontSize: 10,
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {setting.label}
                </span>
                <span
                  style={{
                    color: t.accentColor,
                    fontSize: 10,
                    fontFamily: t.fontMono,
                  }}
                >
                  {setting.value}
                  {setting.hasSubmenu && (
                    <span style={{ marginLeft: 4, color: t.categoryText }}>&#9654;</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: option values */}
        <div
          className="flex flex-col py-1 px-2 gap-0.5"
          style={{
            width: 50,
            borderLeft: `1px solid ${t.borderColor}`,
          }}
        >
          {displayOptions.map((opt, i) => (
            <div
              key={`${opt.value}-${i}`}
              className="flex items-center gap-1 py-0.5"
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: `1.5px solid ${opt.selected ? t.accentColor : t.categoryText}`,
                  backgroundColor: opt.selected ? t.accentColor : 'transparent',
                }}
              />
              <span
                style={{
                  color: opt.selected ? '#fff' : t.categoryText,
                  fontSize: 9,
                }}
              >
                {opt.value}
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
        bpm={bpm}
        tempo={tempo}
        tempoRange={tempoRange}
        musicalKey={musicalKey}
      />
    </div>
  );
}
