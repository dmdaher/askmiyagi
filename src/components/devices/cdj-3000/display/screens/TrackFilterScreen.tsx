'use client';

import React from 'react';
import theme from '../device-theme.json';
import StatusBar from '../atoms/StatusBar';

const t = theme.mainDisplay;

interface TrackFilterScreenProps {
  /** Active filter tab: BPM/KEY or MY TAG */
  activeTab?: 'BPM/KEY' | 'MY TAG';
  /** BPM value */
  filterBpm?: number;
  /** BPM range percent */
  bpmRange?: number;
  /** Selected key */
  filterKey?: string;
  /** Rating filter (0-5) */
  rating?: number;
  /** Color filter */
  filterColor?: string;
  /** Whether BPM filter is enabled */
  bpmEnabled?: boolean;
  /** Whether KEY filter is enabled */
  keyEnabled?: boolean;
  /** Whether RATING filter is enabled */
  ratingEnabled?: boolean;
  /** Whether COLOR filter is enabled */
  colorEnabled?: boolean;
  /** My Tag categories */
  myTagCategories?: string[];
  /** My Tag values */
  myTagValues?: { category: string; tags: string[]; selectedTags?: string[] }[];
  // Status bar
  playerNumber?: number;
  time?: string;
  timeMsec?: string;
  bpm?: number;
  tempo?: string;
  tempoRange?: string;
  musicalKey?: string;
}

const KEY_NAMES = ['B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E'];
const KEY_NAMES_MINOR = ['Abm', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm', 'Am', 'Em', 'Bm', 'F#m', 'Dbm'];
const RATING_STARS = [1, 2, 3, 4, 5];
const COLORS = ['#ff0000', '#ff8800', '#ffdd00', '#00cc44', '#0088ff', '#8844ff', '#ff44aa', '#ffffff'];

/**
 * Track Filter editing screen. Shown when TRACK FILTER/EDIT is pressed and held.
 * Matches manual page 39 -- has two tabs (BPM/KEY and MY TAG).
 *
 * BPM/KEY tab: BPM value with +/- buttons, key circle, rating stars, color dots
 * MY TAG tab: Category columns with selectable tags
 */
export default function TrackFilterScreen({
  activeTab = 'BPM/KEY',
  filterBpm = 130,
  bpmRange = 6,
  filterKey,
  rating = 0,
  filterColor,
  bpmEnabled = true,
  keyEnabled = false,
  ratingEnabled = false,
  colorEnabled = false,
  playerNumber = 2,
  time = '03:10',
  timeMsec = '780',
  bpm = 128.0,
  tempo = '+3.20',
  tempoRange = '10',
  musicalKey = 'Gm',
}: TrackFilterScreenProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: t.backgroundColor,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Title bar with tabs */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          backgroundColor: t.headerBg,
          borderBottom: `1px solid ${t.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded"
            style={{
              backgroundColor: t.accentColor,
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
          <span style={{ color: t.textColor, fontSize: 12, fontWeight: 700 }}>
            TRACK FILTER
          </span>
        </div>
        <div className="flex items-center gap-0">
          <span
            className="px-2 py-0.5 rounded"
            style={{
              color: t.categoryText,
              fontSize: 8,
              border: `1px solid ${t.borderColor}`,
            }}
          >
            {'< RESET'}
          </span>
          {['BPM/KEY', 'MY TAG'].map((tab) => (
            <span
              key={tab}
              className="px-3 py-0.5"
              style={{
                backgroundColor: tab === activeTab ? t.tabActiveBg : t.tabInactiveBg,
                color: tab === activeTab ? '#fff' : t.categoryText,
                fontSize: 9,
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex px-3 py-2 gap-4">
        {activeTab === 'BPM/KEY' ? (
          <>
            {/* Left column: BPM, RANGE, KEY, RATING, COLOR */}
            <div className="flex flex-col gap-2" style={{ width: 120 }}>
              {/* Master player button */}
              <div
                className="flex items-center gap-1 px-2 py-1 rounded"
                style={{
                  backgroundColor: t.tabInactiveBg,
                  border: `1px solid ${t.borderColor}`,
                }}
              >
                <span style={{ color: t.masterYellow, fontSize: 8, fontWeight: 700 }}>
                  &#9733; MASTER PLAYER
                </span>
              </div>

              {/* BPM */}
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={bpmEnabled}
                  readOnly
                  style={{ accentColor: t.accentColor, width: 10, height: 10 }}
                />
                <span style={{ color: t.categoryText, fontSize: 8 }}>BPM</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: t.tabInactiveBg, color: t.textColor, fontSize: 10, border: `1px solid ${t.borderColor}` }}
                >
                  +10
                </span>
                <span className="px-1 py-0.5 rounded" style={{ backgroundColor: t.tabInactiveBg, color: t.textColor, fontSize: 10, border: `1px solid ${t.borderColor}` }}>+1</span>
                <span
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: t.headerBg, color: t.textColor, fontSize: 14, fontWeight: 700, fontFamily: t.fontMono }}
                >
                  {filterBpm}<span style={{ fontSize: 8 }}>BPM</span>
                </span>
                <span className="px-1 py-0.5 rounded" style={{ backgroundColor: t.tabInactiveBg, color: t.textColor, fontSize: 10, border: `1px solid ${t.borderColor}` }}>-1</span>
                <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: t.tabInactiveBg, color: t.textColor, fontSize: 10, border: `1px solid ${t.borderColor}` }}>-10</span>
              </div>

              {/* RANGE */}
              <div className="flex items-center gap-1">
                <span style={{ color: t.categoryText, fontSize: 8 }}>RANGE</span>
                <span style={{ color: t.textColor, fontSize: 9, fontFamily: t.fontMono }}>
                  {`${filterBpm - Math.round(filterBpm * bpmRange / 100)} - ${filterBpm + Math.round(filterBpm * bpmRange / 100)} BPM`}
                </span>
              </div>

              {/* KEY */}
              <div className="flex items-center gap-1">
                <input type="checkbox" checked={keyEnabled} readOnly style={{ accentColor: t.accentColor, width: 10, height: 10 }} />
                <span style={{ color: t.categoryText, fontSize: 8 }}>KEY</span>
              </div>

              {/* Key selector - circle of fifths simplified as rows */}
              <div className="flex flex-wrap gap-0.5">
                {KEY_NAMES.map((k) => (
                  <span
                    key={k}
                    className="px-1 py-0.5 rounded text-center"
                    style={{
                      backgroundColor: filterKey === k ? t.accentColor : t.tabInactiveBg,
                      color: filterKey === k ? '#000' : t.categoryText,
                      fontSize: 8,
                      minWidth: 18,
                      border: `1px solid ${t.borderColor}`,
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>

              {/* RATING */}
              <div className="flex items-center gap-1">
                <input type="checkbox" checked={ratingEnabled} readOnly style={{ accentColor: t.accentColor, width: 10, height: 10 }} />
                <span style={{ color: t.categoryText, fontSize: 8 }}>RATING</span>
                <div className="flex gap-0.5">
                  {RATING_STARS.map((s) => (
                    <span key={s} style={{ color: s <= rating ? t.masterYellow : t.categoryText, fontSize: 10 }}>
                      &#9733;
                    </span>
                  ))}
                </div>
              </div>

              {/* COLOR */}
              <div className="flex items-center gap-1">
                <input type="checkbox" checked={colorEnabled} readOnly style={{ accentColor: t.accentColor, width: 10, height: 10 }} />
                <span style={{ color: t.categoryText, fontSize: 8 }}>COLOR</span>
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: filterColor === c ? '2px solid #fff' : `1px solid ${t.borderColor}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* MY TAG tab */
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: t.tabActiveBg, color: '#fff', fontSize: 9, fontWeight: 700 }}
              >
                AND
              </span>
              <span
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: t.tabInactiveBg, color: t.categoryText, fontSize: 9 }}
              >
                OR
              </span>
            </div>
            <div className="flex gap-2 flex-1">
              {['Genre', 'Components', 'Situation', 'Untitled Column'].map((cat) => (
                <div key={cat} className="flex flex-col flex-1 gap-0.5">
                  <div
                    className="flex items-center gap-1 px-1 py-0.5"
                    style={{ backgroundColor: t.headerBg, borderRadius: 2 }}
                  >
                    <input type="checkbox" readOnly style={{ accentColor: t.accentColor, width: 8, height: 8 }} />
                    <span style={{ color: t.textColor, fontSize: 8, fontWeight: 600 }}>{cat}</span>
                  </div>
                  {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
                    <span
                      key={`${cat}-${i}`}
                      className="px-1 py-0.5 rounded"
                      style={{
                        color: i === 0 ? '#fff' : t.categoryText,
                        backgroundColor: i === 0 ? `${t.accentColor}30` : 'transparent',
                        fontSize: 8,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ))}
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
