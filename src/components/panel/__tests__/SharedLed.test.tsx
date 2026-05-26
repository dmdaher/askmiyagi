import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SharedLed from '../SharedLed';

/**
 * SharedLed tests — same `renderToStaticMarkup` pattern as
 * SharedCircleButton.test.tsx (no jsdom). Asserts on the visible contract:
 * variant dispatch, ledOn tristate per variant, secondaryLabel fallback,
 * data-control-id pass-through.
 */

function render(props: React.ComponentProps<typeof SharedLed>) {
  return renderToStaticMarkup(<SharedLed {...props} />);
}

describe('SharedLed — variant dispatch', () => {
  it('defaults to dot variant when unspecified', () => {
    const html = render({ width: 20, height: 20, label: 'TEST' });
    // Dot renders an inner .rounded-full (the dot itself)
    expect(html).toContain('rounded-full');
    // Dot is the only variant with the outer wrapper using flex items-center justify-center
    expect(html).toContain('class="flex items-center justify-center"');
  });

  it('renders dual-label as a 2-row vertical container', () => {
    const html = render({ width: 60, height: 30, variant: 'dual-label', label: 'A/B' });
    expect(html).toContain('flex flex-col rounded overflow-hidden');
    // Two .flex-1 rows for top/bottom
    expect((html.match(/flex-1/g) || []).length).toBe(2);
  });

  it('renders bar as a horizontal bar + label below', () => {
    const html = render({ width: 40, height: 30, variant: 'bar', label: 'METER' });
    expect(html).toContain('flex flex-col items-center justify-center gap-1 rounded');
    // Bar's transition CSS — applied uniformly (was preview-only pre-PR-3)
    expect(html).toContain('background-color 200ms, box-shadow 200ms');
  });
});

describe('SharedLed — dot variant ledOn tristate', () => {
  const base = { width: 20, height: 20, label: 'L', ledColor: '#22c55e' };

  it('ledOn=true → lit (color + glow + thick border)', () => {
    const html = render({ ...base, ledOn: true });
    expect(html).toContain('background-color:#22c55e');
    expect(html).toContain('box-shadow:0 0 6px #22c55e');
    expect(html).toContain('border:2px solid #22c55e44');
  });

  it('ledOn=false → dim (grey, no glow, thin border)', () => {
    const html = render({ ...base, ledOn: false });
    expect(html).toContain('background-color:#333');
    expect(html).toContain('box-shadow:none');
    expect(html).toContain('border:1px solid #444');
  });

  it('ledOn=undefined → dim (matches editor design-viz default)', () => {
    const html = render({ ...base });
    expect(html).toContain('background-color:#333');
  });
});

describe('SharedLed — dual-label ledOn tristate + secondaryLabel', () => {
  const base = { width: 60, height: 30, variant: 'dual-label' as const, ledColor: '#d4a574' };

  it('ledOn=true → top row active (matches editor design-viz)', () => {
    const html = render({ ...base, label: 'VINYL\nCDJ', ledOn: true });
    // Top: active green background + bright text
    // Bottom: dim background + alpha-shifted text
    expect(html).toContain('background-color:#0a2e1a'); // active green bg
    expect(html).toContain('color:#4ade80'); // bright green text
    expect(html).toContain('color:#d4a57488'); // dimmed text with color suffix
  });

  it('ledOn=false → bottom row active (the actual VINYL/CDJ default)', () => {
    const html = render({ ...base, label: 'VINYL\nCDJ', ledOn: false });
    // Both rows render; the order of #0a2e1a (active) and #1a1a2a (inactive)
    // tells us which row is active. With ledOn=false, BOTTOM is active.
    const firstActive = html.indexOf('#0a2e1a');
    const firstInactive = html.indexOf('#1a1a2a');
    expect(firstInactive).toBeLessThan(firstActive); // inactive appears first = TOP is inactive
  });

  it('ledOn=undefined → top row active (matches editor default)', () => {
    const html = render({ ...base, label: 'VINYL\nCDJ' });
    const firstActive = html.indexOf('#0a2e1a');
    const firstInactive = html.indexOf('#1a1a2a');
    expect(firstActive).toBeLessThan(firstInactive); // active appears first = TOP is active
  });

  it('uses explicit secondaryLabel when set (Properties-panel "Secondary Label" wins)', () => {
    const html = render({
      ...base,
      label: 'PRIMARY',
      secondaryLabel: 'OVERRIDE',
    });
    expect(html).toContain('PRIMARY');
    expect(html).toContain('OVERRIDE');
  });

  it('falls back to splitting label on / when secondaryLabel is unset', () => {
    const html = render({ ...base, label: 'MODE A/MODE B' });
    expect(html).toContain('MODE A');
    expect(html).toContain('MODE B');
  });

  it('falls back to splitting label on \\n when secondaryLabel is unset (VINYL/CDJ case)', () => {
    const html = render({ ...base, label: 'VINYL\nCDJ' });
    expect(html).toContain('VINYL');
    expect(html).toContain('CDJ');
  });

  it('uses single label as top + MODE B fallback when label has no separator', () => {
    // Pre-existing behavior: parts[0] || 'MODE A' = 'SINGLE'; parts[1] || 'MODE B' = 'MODE B'.
    // Only ONE word in the label, so top = the word, bottom = the MODE B default.
    const html = render({ ...base, label: 'SINGLE' });
    expect(html).toContain('SINGLE');
    expect(html).toContain('MODE B');
  });

  it('uses both MODE A/MODE B defaults when label is empty / only separators', () => {
    // Empty label → parts=[], parts[0]=undefined → 'MODE A'; parts[1]=undefined → 'MODE B'.
    const html = render({ ...base, label: '' });
    expect(html).toContain('MODE A');
    expect(html).toContain('MODE B');
  });
});

describe('SharedLed — bar variant ledOn tristate', () => {
  const base = { width: 40, height: 30, variant: 'bar' as const, label: 'LEVEL', ledColor: '#22c55e' };

  it('ledOn=true → lit (color bar + glow)', () => {
    const html = render({ ...base, ledOn: true });
    expect(html).toContain('background-color:#22c55e');
    expect(html).toContain('box-shadow:0 0 6px #22c55e');
  });

  it('ledOn=false → dim (grey bar, no glow)', () => {
    const html = render({ ...base, ledOn: false });
    // Bar uses #333 when off
    expect(html).toContain('background-color:#333');
  });

  it('ledOn=undefined → lit (matches editor design-viz; bar is "always lit" in editor pre-PR-3)', () => {
    const html = render({ ...base });
    expect(html).toContain('background-color:#22c55e');
  });

  it('always emits the transition CSS (pre-PR-3: preview-only; now uniform)', () => {
    for (const ledOn of [true, false, undefined]) {
      const html = render({ ...base, ledOn });
      expect(html).toContain('background-color 200ms, box-shadow 200ms');
    }
  });

  it('renders the label text below the bar', () => {
    const html = render({ ...base, label: 'OUTPUT LEVEL' });
    expect(html).toContain('OUTPUT LEVEL');
  });
});

describe('SharedLed — data-control-id pass-through', () => {
  it('does NOT emit data-control-id attribute when undefined', () => {
    const html = render({ width: 20, height: 20, label: 'X' });
    expect(html).not.toContain('data-control-id');
  });

  it('emits data-control-id attribute when provided (all variants)', () => {
    for (const variant of ['dot', 'dual-label', 'bar'] as const) {
      const html = render({
        width: 40,
        height: 30,
        variant,
        label: 'X',
        dataControlId: 'TEST_LED',
      });
      expect(html).toContain('data-control-id="TEST_LED"');
    }
  });
});

describe('SharedLed — editor design-viz call (no ledOn, matches pre-PR-3 editor)', () => {
  /**
   * Editor's pre-PR-3 ControlNode passes no `ledOn` to the inline render
   * (it's config-time). SharedLed treats undefined as the design-viz state.
   * These tests assert SharedLed matches each pre-PR-3 editor visual.
   */

  it('dot at undefined ledOn matches editor: dim (background #333)', () => {
    const html = render({ width: 20, height: 20, ledColor: '#22c55e', label: 'X' });
    expect(html).toContain('background-color:#333');
    expect(html).not.toContain('box-shadow:0 0 6px');
  });

  it('dual-label at undefined ledOn matches editor: top row active', () => {
    const html = render({ width: 60, height: 30, variant: 'dual-label', label: 'A/B', ledColor: '#22c55e' });
    const firstActive = html.indexOf('#0a2e1a');
    const firstInactive = html.indexOf('#1a1a2a');
    expect(firstActive).toBeLessThan(firstInactive);
  });

  it('bar at undefined ledOn matches editor: lit (always-on visual)', () => {
    const html = render({ width: 40, height: 30, variant: 'bar', label: 'BAR', ledColor: '#22c55e' });
    expect(html).toContain('background-color:#22c55e');
    expect(html).toContain('box-shadow:0 0 6px #22c55e');
  });
});

describe('SharedLed — VINYL_CDJ_INDICATOR fixture (real cdj-3000 control)', () => {
  /**
   * Real data: label='VINYL\nCDJ', secondaryLabel=undefined, ledColor='#d4a574',
   * ledOn=false (stored in manifest). Preview's renderControl passes
   * state.ledOn ?? false → false.
   *
   * Expected visible result: CDJ row lit (bottom active because ledOn=false).
   * This test pins the behavior so it can't regress silently.
   */
  it('renders VINYL on top, CDJ on bottom, CDJ active when ledOn=false', () => {
    const html = render({
      width: 60,
      height: 30,
      variant: 'dual-label',
      label: 'VINYL\nCDJ',
      ledColor: '#d4a574',
      ledOn: false,
      dataControlId: 'VINYL_CDJ_INDICATOR',
    });
    expect(html).toContain('VINYL');
    expect(html).toContain('CDJ');
    expect(html).toContain('data-control-id="VINYL_CDJ_INDICATOR"');
    // Bottom row is active when ledOn=false → look for #0a2e1a appearing AFTER #1a1a2a
    const firstActive = html.indexOf('#0a2e1a');
    const firstInactive = html.indexOf('#1a1a2a');
    expect(firstInactive).toBeLessThan(firstActive);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// triple-label variant — used for 3-position indicators like CDJ-3000
// DIRECTION_INDICATOR (SLIP REV / FWD / REV). Mirrors dual-label coverage
// with added activeRow prop for explicit position control.
// ─────────────────────────────────────────────────────────────────────────

describe('SharedLed — triple-label variant dispatch + structure', () => {
  it('renders triple-label as a 3-row vertical container', () => {
    const html = render({ width: 60, height: 45, variant: 'triple-label', label: 'A/B/C' });
    expect(html).toContain('flex flex-col rounded overflow-hidden');
    // Three .flex-1 rows for top/middle/bottom
    expect((html.match(/flex-1/g) || []).length).toBe(3);
  });

  it('splits label on / into top/middle/bottom (legacy)', () => {
    const html = render({ width: 60, height: 45, variant: 'triple-label', label: 'SLIP REV/FWD/REV' });
    expect(html).toContain('SLIP REV');
    expect(html).toContain('FWD');
    // 'REV' will be in both "SLIP REV" and the bottom row, so check separately
    expect((html.match(/&gt;REV/g) || (html.match(/>REV/g) || [])).length).toBeGreaterThanOrEqual(1);
  });

  it('splits label on \\n', () => {
    const html = render({ width: 60, height: 45, variant: 'triple-label', label: 'SLIP REV\nFWD\nREV' });
    expect(html).toContain('SLIP REV');
    expect(html).toContain('FWD');
  });

  it('uses MODE A/B/C defaults when label is empty', () => {
    const html = render({ width: 60, height: 45, variant: 'triple-label', label: '' });
    expect(html).toContain('MODE A');
    expect(html).toContain('MODE B');
    expect(html).toContain('MODE C');
  });

  it('uses explicit secondaryLabel + tertiaryLabel when provided', () => {
    const html = render({
      width: 60, height: 45, variant: 'triple-label',
      label: 'TOP', tertiaryLabel: 'MID', secondaryLabel: 'BOT',
    });
    expect(html).toContain('TOP');
    expect(html).toContain('MID');
    expect(html).toContain('BOT');
  });

  it('data-control-id pass-through', () => {
    const html = render({
      width: 60, height: 45, variant: 'triple-label',
      label: 'A/B/C', dataControlId: 'DIRECTION_INDICATOR',
    });
    expect(html).toContain('data-control-id="DIRECTION_INDICATOR"');
  });
});

describe('SharedLed — triple-label activeRow + ledOn semantics', () => {
  const base = { width: 60, height: 45, variant: 'triple-label' as const, label: 'TOP/MID/BOT', ledColor: '#22c55e' };

  it('default (no activeRow, ledOn undefined) → top row active (design-viz)', () => {
    const html = render(base);
    // Top row's background is #0a2e1a (active green), and it appears BEFORE other rows
    const firstActive = html.indexOf('#0a2e1a');
    const firstInactive = html.indexOf('#1a1a2a');
    expect(firstActive).toBeLessThan(firstInactive);
  });

  it('activeRow="top" → top row active', () => {
    const html = render({ ...base, activeRow: 'top' });
    expect((html.match(/#0a2e1a/g) || []).length).toBe(1); // exactly one active row
    const firstActive = html.indexOf('#0a2e1a');
    const firstInactive = html.indexOf('#1a1a2a');
    expect(firstActive).toBeLessThan(firstInactive); // top row's bg comes first
  });

  it('activeRow="middle" → middle row active', () => {
    const html = render({ ...base, activeRow: 'middle' });
    expect((html.match(/#0a2e1a/g) || []).length).toBe(1);
    // Middle row's active bg should sit between the two inactive bgs
    const firstInactive = html.indexOf('#1a1a2a');
    const active = html.indexOf('#0a2e1a');
    const lastInactive = html.lastIndexOf('#1a1a2a');
    expect(firstInactive).toBeLessThan(active);
    expect(active).toBeLessThan(lastInactive);
  });

  it('activeRow="bottom" → bottom row active', () => {
    const html = render({ ...base, activeRow: 'bottom' });
    expect((html.match(/#0a2e1a/g) || []).length).toBe(1);
    // Bottom row's active bg comes AFTER both inactive bgs
    const lastActive = html.lastIndexOf('#0a2e1a');
    const lastInactive = html.lastIndexOf('#1a1a2a');
    expect(lastInactive).toBeLessThan(lastActive);
  });

  it('ledOn=false fallback (no activeRow) → bottom row active', () => {
    const html = render({ ...base, ledOn: false });
    const lastActive = html.lastIndexOf('#0a2e1a');
    const lastInactive = html.lastIndexOf('#1a1a2a');
    expect(lastInactive).toBeLessThan(lastActive);
  });

  it('activeRow overrides ledOn (explicit beats fallback)', () => {
    const html = render({ ...base, ledOn: false, activeRow: 'top' });
    // Even though ledOn=false would suggest bottom, activeRow=top wins
    const firstActive = html.indexOf('#0a2e1a');
    const firstInactive = html.indexOf('#1a1a2a');
    expect(firstActive).toBeLessThan(firstInactive);
  });
});

describe('SharedLed — triple-label end-to-end (CDJ-3000 DIRECTION_INDICATOR shape)', () => {
  it('renders SLIP REV / FWD / REV correctly with realistic prod props', () => {
    const html = render({
      width: 48, height: 52,
      variant: 'triple-label',
      label: 'SLIP REV\nFWD\nREV',
      ledColor: '#22c55e',
      dataControlId: 'DIRECTION_INDICATOR',
    });
    expect(html).toContain('SLIP REV');
    expect(html).toContain('FWD');
    expect(html).toContain('data-control-id="DIRECTION_INDICATOR"');
    // 3 flex-1 rows
    expect((html.match(/flex-1/g) || []).length).toBe(3);
    // Default top-active (no activeRow specified)
    expect((html.match(/#0a2e1a/g) || []).length).toBe(1);
  });
});
