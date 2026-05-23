import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import {
  renderLabelText,
  inferPortVariant,
  mapButtonLabelPosition,
  resolveDisplayContent,
} from '../render-helpers';

describe('renderLabelText', () => {
  it('returns plain string when no newline', () => {
    expect(renderLabelText('HELLO')).toBe('HELLO');
  });

  it('splits on \\n into spans with <br/> between lines', () => {
    const out = renderLabelText('LINE1\nLINE2');
    const html = renderToStaticMarkup(<>{out}</>);
    expect(html).toContain('LINE1');
    expect(html).toContain('LINE2');
    expect(html).toContain('<br');
  });

  it('handles 3+ lines correctly', () => {
    const out = renderLabelText('A\nB\nC');
    const html = renderToStaticMarkup(<>{out}</>);
    // Two <br> elements between three lines
    expect(html.match(/<br/g)?.length).toBe(2);
  });

  it('handles empty string', () => {
    expect(renderLabelText('')).toBe('');
  });
});

describe('inferPortVariant', () => {
  it('returns "sd-card" for SD-keyword labels', () => {
    expect(inferPortVariant('SD CARD')).toBe('sd-card');
    expect(inferPortVariant('Memory Card')).toBe('sd-card');
    expect(inferPortVariant('sd memory card indicator')).toBe('sd-card');
  });

  it('returns "ethernet" for networking labels (ethernet, lan, link)', () => {
    expect(inferPortVariant('ETHERNET')).toBe('ethernet');
    expect(inferPortVariant('LAN')).toBe('ethernet');
    expect(inferPortVariant('LINK')).toBe('ethernet');
  });

  it('returns "rca" for analog audio labels', () => {
    expect(inferPortVariant('RCA OUT')).toBe('rca');
    expect(inferPortVariant('Phono In')).toBe('rca');
  });

  it('returns "usb-a" for USB-keyword labels', () => {
    expect(inferPortVariant('USB')).toBe('usb-a');
    expect(inferPortVariant('USB Stop')).toBe('usb-a');
  });

  it('defaults to "usb-a" for unknown / empty labels', () => {
    expect(inferPortVariant('XYZ')).toBe('usb-a');
    expect(inferPortVariant('')).toBe('usb-a');
  });

  it('is case-insensitive', () => {
    expect(inferPortVariant('sd')).toBe('sd-card');
    expect(inferPortVariant('SD')).toBe('sd-card');
    expect(inferPortVariant('Sd')).toBe('sd-card');
  });
});

describe('mapButtonLabelPosition', () => {
  it('maps direct values', () => {
    expect(mapButtonLabelPosition('on-button')).toBe('on');
    expect(mapButtonLabelPosition('above')).toBe('above');
    expect(mapButtonLabelPosition('below')).toBe('below');
  });

  it('falls back to "on" for left/right/hidden', () => {
    expect(mapButtonLabelPosition('left')).toBe('on');
    expect(mapButtonLabelPosition('right')).toBe('on');
    expect(mapButtonLabelPosition('hidden')).toBe('on');
  });

  it('falls back to "on" for unknown / undefined', () => {
    expect(mapButtonLabelPosition(undefined)).toBe('on');
    expect(mapButtonLabelPosition('')).toBe('on');
    expect(mapButtonLabelPosition('xyz')).toBe('on');
  });
});

describe('resolveDisplayContent', () => {
  it('returns label text + isIcon:false when no icon set', () => {
    const out = resolveDisplayContent({ label: 'HELLO' });
    expect(out).toEqual({ text: 'HELLO', isIcon: false });
  });

  it('returns label text when icon is set but labelDisplay is not icon-only', () => {
    const out = resolveDisplayContent({
      label: 'PLAY',
      icon: 'play',
      labelDisplay: 'above',
    });
    expect(out).toEqual({ text: 'PLAY', isIcon: false });
  });

  it('returns the unicode icon when labelDisplay is icon-only and HARDWARE_ICONS has it', () => {
    const out = resolveDisplayContent({
      label: '',
      icon: 'play',
      labelDisplay: 'icon-only',
    });
    expect(out.isIcon).toBe(true);
    expect(out.text).toBe('▶');
    expect(out.svgIcon).toBeUndefined();
  });

  it('returns the SVG icon when HARDWARE_ICON_SVGS has it (and prefers it over text map)', () => {
    const out = resolveDisplayContent({
      label: '',
      icon: 'sine-wave',
      labelDisplay: 'icon-only',
    });
    expect(out.isIcon).toBe(true);
    expect(out.text).toBe('');
    expect(out.svgIcon).toBeDefined();
  });

  it('falls back to the raw icon key string for unknown icon keys (debug-friendly)', () => {
    const out = resolveDisplayContent({
      label: '',
      icon: 'unknown-icon-key',
      labelDisplay: 'icon-only',
    });
    expect(out.isIcon).toBe(true);
    expect(out.text).toBe('unknown-icon-key');
  });
});
