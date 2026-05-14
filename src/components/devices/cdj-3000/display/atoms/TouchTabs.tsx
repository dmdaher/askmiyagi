'use client';

import React from 'react';
import theme from '../device-theme.json';

const t = theme.mainDisplay;

interface TouchTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
}

/**
 * Top-right touch tabs on the waveform screen (BEAT LOOP, KEY SHIFT, BEAT JUMP).
 * Matches the CDJ-3000 three-tab layout visible on page 21 of the manual.
 */
export default function TouchTabs({ tabs, activeTab }: TouchTabsProps) {
  return (
    <div className="flex gap-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <div
            key={tab.id}
            className="flex items-center justify-center px-2 py-1"
            style={{
              backgroundColor: isActive ? t.tabActiveBg : t.tabInactiveBg,
              color: isActive ? t.tabActiveText : t.tabInactiveText,
              fontSize: 9,
              fontWeight: 700,
              fontFamily: t.fontFamily,
              lineHeight: 1.2,
              textAlign: 'center',
              minWidth: 44,
              borderRight: `1px solid ${t.borderColor}`,
            }}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}
