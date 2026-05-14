/**
 * Tests for the four Display Builder validators in checkpoint-validators.ts.
 *
 * These validators are the "Hard Compiler" that runs after the display-builder
 * agent finishes. They catch contamination (cross-device anchoring), stub
 * generation, missing screens, and malformed inventory files.
 *
 * See plan: docs/plans/2026-04-30-display-builder-agent.md
 * See SOUL: .claude/agents/display-builder.md
 */
import { describe, it, expect } from 'vitest';
import {
  validateDeviceTheme,
  validateScreenInventory,
  validateDisplayComponents,
  validateInventoryCompleteness,
} from '@/lib/pipeline/checkpoint-validators';

// ─── validateDeviceTheme ─────────────────────────────────────────────────────

describe('validateDeviceTheme', () => {
  const validTheme = JSON.stringify({
    background: '#0a1a2a',
    primary: '#00aaff',
    secondary: '#aaaaaa',
    fontFamily: 'monospace',
    fontSizes: { title: 18, body: 14, caption: 10 },
  });

  it('accepts a well-formed theme', () => {
    const r = validateDeviceTheme(validTheme);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('accepts the legacy flat schema (backgroundColor, textColor)', () => {
    const legacy = JSON.stringify({
      backgroundColor: '#0a1a2a',
      textColor: '#e0e0e0',
      fontFamily: 'monospace',
      fontSize: { title: 14 },
    });
    const r = validateDeviceTheme(legacy);
    expect(r.valid).toBe(true);
  });

  it('rejects invalid JSON', () => {
    const r = validateDeviceTheme('{ not json');
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/not valid JSON/i);
  });

  it('rejects missing background', () => {
    const r = validateDeviceTheme(JSON.stringify({ primary: '#fff', fontFamily: 'm', fontSizes: { body: 12 } }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /background/.test(e))).toBe(true);
  });

  it('rejects malformed color value', () => {
    const r = validateDeviceTheme(JSON.stringify({
      background: 'not-a-color',
      primary: '#fff',
      fontFamily: 'm',
      fontSizes: { body: 12 },
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /not a valid color/.test(e))).toBe(true);
  });

  it('accepts rgba and hsla color formats', () => {
    const r = validateDeviceTheme(JSON.stringify({
      background: 'rgba(10, 20, 30, 0.8)',
      primary: 'hsla(120, 50%, 50%, 0.9)',
      fontFamily: 'm',
      fontSizes: { body: 12 },
    }));
    expect(r.valid).toBe(true);
  });

  it('rejects missing fontFamily', () => {
    const r = validateDeviceTheme(JSON.stringify({ background: '#000', primary: '#fff', fontSizes: { body: 12 } }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /fontFamily/.test(e))).toBe(true);
  });
});

// ─── validateScreenInventory ─────────────────────────────────────────────────

describe('validateScreenInventory', () => {
  const validInventory = JSON.stringify({
    deviceId: 'cdj-3000',
    screenTypes: [
      { id: 'home', component: 'HomeScreen', description: 'Idle', manualPages: '14', confidence: 'high' },
      { id: 'waveform', component: 'WaveformScreen', description: 'Performance', manualPages: '21-23', confidence: 'high' },
    ],
  });

  it('accepts a well-formed inventory', () => {
    const r = validateScreenInventory(validInventory);
    expect(r.valid).toBe(true);
  });

  it('rejects invalid JSON', () => {
    const r = validateScreenInventory('{ not json');
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/not valid JSON/i);
  });

  it('rejects missing deviceId', () => {
    const r = validateScreenInventory(JSON.stringify({
      screenTypes: [{ id: 'home', component: 'HomeScreen', manualPages: '1' }],
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /deviceId/.test(e))).toBe(true);
  });

  it('rejects empty screenTypes array', () => {
    const r = validateScreenInventory(JSON.stringify({ deviceId: 'x', screenTypes: [] }));
    expect(r.valid).toBe(false);
  });

  it('rejects duplicate screen ids', () => {
    const r = validateScreenInventory(JSON.stringify({
      deviceId: 'x',
      screenTypes: [
        { id: 'home', component: 'HomeScreen', manualPages: '1' },
        { id: 'home', component: 'OtherScreen', manualPages: '2' },
      ],
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /duplicate/i.test(e))).toBe(true);
  });

  it('rejects component names that violate PascalCase + "Screen" suffix', () => {
    const r = validateScreenInventory(JSON.stringify({
      deviceId: 'x',
      screenTypes: [{ id: 'home', component: 'home_screen', manualPages: '1' }],
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /PascalCase/i.test(e))).toBe(true);
  });

  it('requires manualPages for high-confidence entries', () => {
    const r = validateScreenInventory(JSON.stringify({
      deviceId: 'x',
      screenTypes: [{ id: 'home', component: 'HomeScreen', confidence: 'high' }],
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /manualPages/.test(e))).toBe(true);
  });

  it('exempts low-confidence stubs from manualPages requirement', () => {
    const r = validateScreenInventory(JSON.stringify({
      deviceId: 'x',
      screenTypes: [{ id: 'home', component: 'HomeScreen', confidence: 'low' }],
    }));
    expect(r.valid).toBe(true);
  });

  it('requires a home/idle screen', () => {
    const r = validateScreenInventory(JSON.stringify({
      deviceId: 'x',
      screenTypes: [{ id: 'waveform', component: 'WaveformScreen', manualPages: '1' }],
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /home|idle|default/i.test(e))).toBe(true);
  });

  it('accepts "idle" or "default" as home equivalent', () => {
    const r = validateScreenInventory(JSON.stringify({
      deviceId: 'x',
      screenTypes: [{ id: 'idle-display', component: 'IdleScreen', manualPages: '1' }],
    }));
    expect(r.valid).toBe(true);
  });
});

// ─── validateDisplayComponents ───────────────────────────────────────────────

describe('validateDisplayComponents', () => {
  const inventory = [
    { id: 'home', component: 'HomeScreen', manualPages: '14', confidence: 'high' as const },
    { id: 'waveform', component: 'WaveformScreen', manualPages: '21', confidence: 'high' as const },
  ];

  // ~40 substantive lines, properly named export
  const goodHomeTsx = `
import React from 'react';
import theme from '../device-theme.json';
import { StatusBar } from '../atoms/StatusBar';
import { Indicator } from '../atoms/Indicator';

interface Props {
  title?: string;
  ready?: boolean;
  trackTitle?: string;
}

export function HomeScreen(props: Props) {
  const containerStyle = {
    background: theme.background,
    color: theme.primary,
    padding: 16,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  };
  const headerStyle = {
    fontSize: theme.fontSizes.title,
    fontWeight: 'bold' as const,
  };
  const bodyStyle = {
    flex: 1,
    display: 'grid',
    placeItems: 'center',
  };
  return (
    <div style={containerStyle}>
      <StatusBar />
      <header style={headerStyle}>{props.title ?? 'Display'}</header>
      <div style={bodyStyle}>
        <Indicator on={!!props.ready} />
        <div>{props.trackTitle ?? 'READY'}</div>
      </div>
      <footer style={{ fontSize: theme.fontSizes.caption, opacity: 0.7 }}>
        Idle
      </footer>
    </div>
  );
}
`.trim();

  it('accepts well-formed display directory', () => {
    const files = new Map<string, string>([
      ['screens/HomeScreen.tsx', goodHomeTsx],
      ['screens/WaveformScreen.tsx', goodHomeTsx.replace(/HomeScreen/g, 'WaveformScreen')],
    ]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory });
    expect(r.valid).toBe(true);
  });

  it('flags missing TSX file', () => {
    const files = new Map<string, string>([['screens/HomeScreen.tsx', goodHomeTsx]]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /WaveformScreen/.test(e))).toBe(true);
  });

  it('flags missing named export', () => {
    const files = new Map<string, string>([
      ['screens/HomeScreen.tsx', 'export default function Other() { return null; }\n'.repeat(20)],
      ['screens/WaveformScreen.tsx', goodHomeTsx.replace(/HomeScreen/g, 'WaveformScreen')],
    ]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /missing named export "HomeScreen"/.test(e))).toBe(true);
  });

  it('flags stub-like files (< 30 substantive lines)', () => {
    const stub = 'export function HomeScreen() { return null; }';
    const files = new Map<string, string>([
      ['screens/HomeScreen.tsx', stub],
      ['screens/WaveformScreen.tsx', goodHomeTsx.replace(/HomeScreen/g, 'WaveformScreen')],
    ]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /stub-like/.test(e))).toBe(true);
  });

  it('exempts low-confidence stubs', () => {
    const inv = [
      { id: 'home', component: 'HomeScreen', manualPages: '14', confidence: 'high' as const },
      { id: 'unclear', component: 'UnclearScreen', confidence: 'low' as const },
    ];
    const files = new Map<string, string>([
      ['screens/HomeScreen.tsx', goodHomeTsx],
      // UnclearScreen.tsx may not exist or may be a tiny stub
    ]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory: inv });
    expect(r.valid).toBe(true);
  });

  it('catches anti-anchoring violation — references fantom-08', () => {
    const contaminated = goodHomeTsx + '\n// inspired by fantom-08';
    const files = new Map<string, string>([
      ['screens/HomeScreen.tsx', contaminated],
      ['screens/WaveformScreen.tsx', goodHomeTsx.replace(/HomeScreen/g, 'WaveformScreen')],
    ]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /fantom-08.*anti-anchoring/i.test(e))).toBe(true);
  });

  it('catches anti-anchoring violation — references deepmind-12', () => {
    const contaminated = goodHomeTsx.replace('READY', 'DEEPMIND-12');
    const files = new Map<string, string>([
      ['screens/HomeScreen.tsx', contaminated],
      ['screens/WaveformScreen.tsx', goodHomeTsx.replace(/HomeScreen/g, 'WaveformScreen')],
    ]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => /deepmind-12.*anti-anchoring/i.test(e))).toBe(true);
  });

  it('does NOT flag self-references (own deviceId in own files)', () => {
    const selfRef = goodHomeTsx + '\n// cdj-3000 main display';
    const files = new Map<string, string>([
      ['screens/HomeScreen.tsx', selfRef],
      ['screens/WaveformScreen.tsx', goodHomeTsx.replace(/HomeScreen/g, 'WaveformScreen')],
    ]);
    const r = validateDisplayComponents({ deviceId: 'cdj-3000', files, inventory });
    expect(r.valid).toBe(true);
  });
});

// ─── validateInventoryCompleteness ───────────────────────────────────────────

describe('validateInventoryCompleteness', () => {
  const pass1 = `
# Feature Inventory by Chapter

## Touch Display (pp. 18-26)
- SOURCE screen (p. 18): device selection menu
- Browse screen (pp. 19-20): track list and categories
- Waveform screen (pp. 21-23): main performance view

## Search (p. 36)
- SEARCH screen: on-screen keyboard

## Utility (p. 73)
- UTILITY screen: system settings
`;

  it('accepts inventory that covers all manual screens', () => {
    const inventory = [
      { id: 'source', component: 'SourceScreen', manualPages: '18', description: 'device selection menu', confidence: 'high' as const },
      { id: 'browse', component: 'BrowseScreen', manualPages: '19-20', description: 'track list', confidence: 'high' as const },
      { id: 'waveform', component: 'WaveformScreen', manualPages: '21-23', description: 'performance view', confidence: 'high' as const },
      { id: 'search', component: 'SearchScreen', manualPages: '36', description: 'on-screen keyboard', confidence: 'high' as const },
      { id: 'utility', component: 'UtilityScreen', manualPages: '73', description: 'system settings', confidence: 'high' as const },
    ];
    const r = validateInventoryCompleteness({ inventory, pass1Content: pass1 });
    expect(r.valid).toBe(true);
  });

  it('flags missing screens from inventory', () => {
    const inventory = [
      { id: 'source', component: 'SourceScreen', manualPages: '18', confidence: 'high' as const },
      // Missing browse, waveform, search, utility
    ];
    const r = validateInventoryCompleteness({ inventory, pass1Content: pass1 });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/missing from screen-inventory/);
    // Should mention at least the dropped screens
    expect(r.errors[0]).toMatch(/waveform|browse|search|utility/);
  });

  it('counts low-confidence stubs as coverage', () => {
    const inventory = [
      { id: 'source', component: 'SourceScreen', manualPages: '18', confidence: 'high' as const },
      { id: 'browse', component: 'BrowseScreen', confidence: 'low' as const },
      { id: 'waveform', component: 'WaveformScreen', manualPages: '21-23', confidence: 'high' as const },
      { id: 'search', component: 'SearchScreen', manualPages: '36', confidence: 'high' as const },
      { id: 'utility', component: 'UtilityScreen', manualPages: '73', confidence: 'high' as const },
    ];
    const r = validateInventoryCompleteness({ inventory, pass1Content: pass1 });
    expect(r.valid).toBe(true);
  });

  it('skips completeness check when pass1 has no "X screen" mentions', () => {
    const inventory: { id: string; component: string; confidence?: 'high' | 'low' }[] = [
      { id: 'home', component: 'HomeScreen', confidence: 'high' },
    ];
    const r = validateInventoryCompleteness({ inventory, pass1Content: '# No screens mentioned here' });
    expect(r.valid).toBe(true);
  });

  it('tolerates partial id matches (browse vs Browse screen)', () => {
    const inventory = [
      { id: 'source', component: 'SourceScreen', manualPages: '18', confidence: 'high' as const },
      { id: 'browse', component: 'BrowseScreen', manualPages: '19-20', confidence: 'high' as const },
      { id: 'waveform', component: 'WaveformScreen', manualPages: '21-23', confidence: 'high' as const },
      { id: 'search', component: 'SearchScreen', manualPages: '36', confidence: 'high' as const },
      { id: 'utility', component: 'UtilityScreen', manualPages: '73', confidence: 'high' as const },
    ];
    const r = validateInventoryCompleteness({ inventory, pass1Content: pass1 });
    expect(r.valid).toBe(true);
  });
});
