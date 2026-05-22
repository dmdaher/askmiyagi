import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SharedCircleButton from '../SharedCircleButton';

/**
 * SharedCircleButton tests — render to static HTML, assert on key visual
 * contract bits: bg shorthand presence, border shape/color, gradient inclusion
 * for integrated-LED states, label visibility / icon-mode classes.
 *
 * Render strategy: `renderToStaticMarkup` matches the project's
 * `render-helpers.test.tsx` pattern (no jsdom required).
 */

function render(props: React.ComponentProps<typeof SharedCircleButton>) {
  return renderToStaticMarkup(<SharedCircleButton {...props} />);
}

describe('SharedCircleButton — face structure', () => {
  it('renders a circle div with the requested diameter', () => {
    const html = render({ diameter: 40, label: 'PLAY' });
    expect(html).toContain('rounded-full');
    expect(html).toContain('width:40px');
    expect(html).toContain('height:40px');
  });

  it('applies surfaceColor to the border + outer glow', () => {
    const html = render({ diameter: 40, label: 'X', surfaceColor: '#ff8800' });
    expect(html).toContain('border:3px solid #ff8800');
    expect(html).toContain('#ff880040'); // outer glow with alpha suffix
  });

  it('defaults border to #444 when surfaceColor is unset', () => {
    const html = render({ diameter: 40, label: 'X' });
    expect(html).toContain('border:3px solid #444');
  });

  it('uses #2a2a2a backgroundColor (default editor look) when not integrated', () => {
    const html = render({ diameter: 40, label: 'X' });
    expect(html).toContain('background-color:#2a2a2a');
  });
});

describe('SharedCircleButton — on-button label / icon', () => {
  it('hides label content when labelPosition is not on-button and labelDisplay is not icon-only', () => {
    const html = render({ diameter: 40, label: 'HIDDEN' });
    expect(html).not.toContain('HIDDEN');
  });

  it('shows label text when labelPosition is on-button', () => {
    const html = render({ diameter: 40, label: 'PLAY', labelPosition: 'on-button' });
    expect(html).toContain('PLAY');
  });

  it('uses break-word for text labels (not icons)', () => {
    const html = render({ diameter: 40, label: 'TEXT', labelPosition: 'on-button' });
    expect(html).toContain('overflow-wrap:break-word');
  });

  it('omits break-word + uses nowrap class when rendering an icon', () => {
    const html = render({
      diameter: 40,
      label: 'PLAY',
      icon: 'play',
      labelDisplay: 'icon-only',
    });
    expect(html).toContain('whitespace-nowrap');
    expect(html).not.toContain('overflow-wrap:break-word');
  });

  it('uses custom labelColor when provided', () => {
    const html = render({
      diameter: 40,
      label: 'X',
      labelPosition: 'on-button',
      labelColor: '#00ffff',
    });
    expect(html).toContain('color:#00ffff');
  });

  it('uses default labelColor (#d1d5db) when not provided', () => {
    const html = render({ diameter: 40, label: 'X', labelPosition: 'on-button' });
    expect(html).toContain('color:#d1d5db');
  });

  it('uses custom labelFontSize when provided', () => {
    const html = render({
      diameter: 40,
      label: 'X',
      labelPosition: 'on-button',
      labelFontSize: 14,
    });
    expect(html).toContain('font-size:14px');
  });

  it('derives icon fontSize from diameter (≥8px) when labelFontSize is unset', () => {
    const html = render({
      diameter: 40,
      label: 'X',
      icon: 'play',
      labelDisplay: 'icon-only',
    });
    // 40 * 0.35 = 14
    expect(html).toContain('font-size:14px');
  });

  it('uses 8px text fontSize when labelFontSize is unset on a text label', () => {
    const html = render({
      diameter: 40,
      label: 'X',
      labelPosition: 'on-button',
    });
    expect(html).toContain('font-size:8px');
  });
});

describe('SharedCircleButton — non-integrated active state', () => {
  it('shifts backgroundColor to #3a3a3a when active=true (preview press state)', () => {
    const html = render({ diameter: 40, label: 'X', active: true });
    expect(html).toContain('background-color:#3a3a3a');
  });

  it('keeps backgroundColor #2a2a2a when active=false', () => {
    const html = render({ diameter: 40, label: 'X', active: false });
    expect(html).toContain('background-color:#2a2a2a');
  });
});

describe('SharedCircleButton — integrated LED tristate', () => {
  const base = { diameter: 40, label: 'X', hasLed: true, ledStyle: 'integrated', ledColor: '#22c55e' };

  it('ledOn=true: renders radial-gradient `background` shorthand AND omits `background-color`', () => {
    const html = render({ ...base, ledOn: true });
    expect(html).toContain('background:radial-gradient');
    // bgColor is undefined when ledOn=true on integrated, so no background-color
    // — the gradient owns the fill.
    expect(html).not.toMatch(/background-color:[^;]/);
  });

  it('ledOn=true: applies the strong glow boxShadow', () => {
    const html = render({ ...base, ledOn: true });
    expect(html).toContain('box-shadow:0 0 12px #22c55e80');
  });

  it('ledOn=true: applies a 1px lit border in the LED color', () => {
    const html = render({ ...base, ledOn: true });
    expect(html).toContain('border:1px solid #22c55e');
  });

  // PR EP2: OFF state — unified LED-capable baseline (was #2a2a2a + 3px
  // surfaceColor border; now #1a1a1e + 1px ledColor*40 border to make
  // LED-capable buttons visually distinct from non-LED buttons even when
  // not lit). Matches the photo's unlit MUTE/HOT SLICE on DJS-1000.
  it('ledOn=false: dark face baseline (LED-capable but not lit)', () => {
    const html = render({ ...base, ledOn: false });
    expect(html).toContain('background-color:#1a1a1e');
    // No gradient when off
    expect(html).not.toContain('radial-gradient');
  });

  it('ledOn=false: thin 1px border in ledColor*40 alpha', () => {
    const html = render({ ...base, ledOn: false });
    expect(html).toContain('border:1px solid #22c55e40');
  });

  it('ledOn=false: surfaceColor does NOT override the LED baseline (LED takes priority)', () => {
    // Old behavior used surfaceColor for the off border. New behavior: LED
    // is the dominant visual cue for LED-capable buttons. surfaceColor
    // applies only to non-LED buttons.
    const html = render({ ...base, ledOn: false, surfaceColor: '#abcdef' });
    expect(html).toContain('border:1px solid #22c55e40');
    expect(html).not.toContain('border:3px solid #abcdef');
  });

  // PR EP2: EDITOR state — slightly more visible than OFF (2px border)
  // so contractor can scan and see "these buttons have LEDs" at a glance.
  it('ledOn=undefined: dark face baseline (editor hint)', () => {
    const html = render({ ...base });
    expect(html).toContain('background-color:#1a1a1e');
    expect(html).not.toContain('radial-gradient');
  });

  it('ledOn=undefined: thicker 2px border in ledColor*40 alpha (more visible than OFF)', () => {
    const html = render({ ...base });
    expect(html).toContain('border:2px solid #22c55e40');
  });

  it('NEVER emits `background:undefined` (Bug 2 guard)', () => {
    for (const ledOn of [true, false, undefined]) {
      const html = render({ ...base, ledOn });
      expect(html).not.toContain('background:undefined');
      expect(html).not.toContain('background-color:undefined');
    }
  });
});

describe('SharedCircleButton — editor-style minimal call (no LED, no state)', () => {
  /**
   * Editor's call from ControlNode passes ONLY: diameter, label, icon,
   * labelPosition, labelDisplay, labelFontSize, labelColor, surfaceColor.
   * It never passes hasLed/ledStyle/ledOn/active/onClick.
   * The output must visually match the pre-extraction editor:
   *   - bg-color: #2a2a2a
   *   - border: 3px solid (surfaceColor or #444)
   *   - boxShadow includes the 1px white highlight (`0 1px 0 rgba(255,255,255,0.05)`)
   *   - no `onclick` attribute on the div
   */
  it('produces a default circle face when called like the editor does', () => {
    const html = render({
      diameter: 40,
      label: 'CUE',
      icon: undefined,
      labelPosition: 'on-button',
      labelDisplay: undefined,
      labelFontSize: undefined,
      labelColor: undefined,
      surfaceColor: undefined,
    });
    expect(html).toContain('background-color:#2a2a2a');
    expect(html).toContain('border:3px solid #444');
    expect(html).toContain('0 1px 0 rgba(255,255,255,0.05)');
    expect(html).not.toContain('radial-gradient');
    expect(html).not.toContain('onclick=');
    expect(html).toContain('CUE');
  });

  it('honors surfaceColor + omits onClick when omitted', () => {
    const html = render({
      diameter: 50,
      label: 'PLAY',
      labelPosition: 'on-button',
      surfaceColor: '#ff4500',
    });
    expect(html).toContain('border:3px solid #ff4500');
    expect(html).toContain('#ff450040');
    expect(html).not.toContain('onclick=');
  });
});
