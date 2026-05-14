'use client';

import React from 'react';
import theme from './device-theme.json';
import WaveformScreen from './screens/WaveformScreen';
import BrowseScreen from './screens/BrowseScreen';
import SourceScreen from './screens/SourceScreen';
import SearchScreen from './screens/SearchScreen';
import TrackFilterScreen from './screens/TrackFilterScreen';
import UtilityScreen from './screens/UtilityScreen';
import ShortcutScreen from './screens/ShortcutScreen';
import IdleScreen from './screens/IdleScreen';
import TrackInfoScreen from './screens/TrackInfoScreen';

const t = theme.mainDisplay;

/**
 * CDJ-3000 screen types that correspond to distinct display screens
 * documented in the manual. Each maps to a specific screen component.
 */
export type CDJScreenType =
  | 'idle'
  | 'waveform'
  | 'browse'
  | 'source'
  | 'search'
  | 'track-filter'
  | 'utility'
  | 'shortcut'
  | 'track-info';

export interface CDJDisplayState {
  screenType: CDJScreenType;
  [key: string]: unknown;
}

interface DisplayScreenProps {
  displayState: CDJDisplayState;
  highlighted?: boolean;
}

/**
 * Top-level display dispatcher for the CDJ-3000 touch display.
 * Routes the current screenType to the appropriate screen component.
 *
 * All props beyond screenType are spread to the target screen component.
 */
export default function DisplayScreen({ displayState, highlighted }: DisplayScreenProps) {
  const { screenType, ...rest } = displayState;

  const content = (() => {
    switch (screenType) {
      case 'waveform':
        return <WaveformScreen {...(rest as React.ComponentProps<typeof WaveformScreen>)} />;
      case 'browse':
        return <BrowseScreen {...(rest as React.ComponentProps<typeof BrowseScreen>)} />;
      case 'source':
        return <SourceScreen {...(rest as React.ComponentProps<typeof SourceScreen>)} />;
      case 'search':
        return <SearchScreen {...(rest as React.ComponentProps<typeof SearchScreen>)} />;
      case 'track-filter':
        return <TrackFilterScreen {...(rest as React.ComponentProps<typeof TrackFilterScreen>)} />;
      case 'utility':
        return <UtilityScreen {...(rest as React.ComponentProps<typeof UtilityScreen>)} />;
      case 'shortcut':
        return <ShortcutScreen {...(rest as React.ComponentProps<typeof ShortcutScreen>)} />;
      case 'track-info':
        return <TrackInfoScreen {...(rest as React.ComponentProps<typeof TrackInfoScreen>)} />;
      case 'idle':
      default:
        return <IdleScreen {...(rest as React.ComponentProps<typeof IdleScreen>)} />;
    }
  })();

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: t.backgroundColor,
        borderRadius: t.borderRadius,
        border: highlighted ? `2px solid ${t.accentColor}` : `1px solid ${t.borderColor}`,
        aspectRatio: t.aspectRatio,
        fontFamily: t.fontFamily,
        width: '100%',
      }}
    >
      {content}
    </div>
  );
}
