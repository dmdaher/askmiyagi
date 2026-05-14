'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface CategorySidebarProps {
  categories: string[];
  activeCategory?: string;
  deviceType?: 'USB' | 'SD' | 'LINK';
}

/**
 * Left sidebar on the browse screen showing categories like TRACK, ARTIST,
 * ALBUM, BPM, KEY, HISTORY, etc. Matches manual page 19.
 */
export default function CategorySidebar({
  categories = ['TRACK', 'ARTIST', 'ALBUM', 'BPM', 'KEY', 'S/H', 'HISTORY'],
  activeCategory = 'TRACK',
  deviceType = 'USB',
}: CategorySidebarProps) {
  const deviceColors: Record<string, string> = {
    USB: t.accentColor,
    SD: '#ff8800',
    LINK: '#44cc44',
  };

  return (
    <div
      className="flex flex-col py-1"
      style={{
        backgroundColor: t.categorySidebar,
        width: 44,
        borderRight: `1px solid ${t.borderColor}`,
      }}
    >
      {/* Device icon at top */}
      <div
        className="flex items-center justify-center mb-1"
        style={{
          width: 44,
          height: 24,
        }}
      >
        <div
          className="flex items-center justify-center rounded"
          style={{
            backgroundColor: deviceColors[deviceType],
            width: 18,
            height: 18,
            fontSize: 7,
            fontWeight: 700,
            color: '#000',
          }}
        >
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path d="M5 1v3M3.5 2.5h3M2.5 4v4a1.5 1.5 0 001.5 1.5h2A1.5 1.5 0 008 8V4H2.5z" stroke="#000" strokeWidth={1} />
          </svg>
        </div>
      </div>

      {/* Category items */}
      {categories.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <div
            key={cat}
            className="flex items-center justify-center py-1.5"
            style={{
              color: isActive ? t.categoryActiveText : t.categoryText,
              fontSize: 8,
              fontWeight: isActive ? 700 : 400,
              fontFamily: t.fontFamily,
              backgroundColor: isActive ? `${t.accentColor}15` : 'transparent',
              borderLeft: isActive ? `2px solid ${t.accentColor}` : '2px solid transparent',
            }}
          >
            {cat}
          </div>
        );
      })}
    </div>
  );
}
