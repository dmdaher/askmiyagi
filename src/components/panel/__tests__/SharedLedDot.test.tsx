import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SharedLedDot from '../SharedLedDot';

function render(props: React.ComponentProps<typeof SharedLedDot>) {
  return renderToStaticMarkup(<SharedLedDot {...props} />);
}

describe('SharedLedDot — external variant (default)', () => {
  it('renders 6×6 colored circle with glow when ledOn=true', () => {
    const html = render({ color: '#22c55e', ledOn: true });
    expect(html).toContain('class="rounded-full"');
    expect(html).toContain('width:6px');
    expect(html).toContain('height:6px');
    expect(html).toContain('background-color:#22c55e');
    expect(html).toContain('box-shadow:0 0 4px 1px #22c55e');
  });

  it('renders dim #333 with no shadow when ledOn=false', () => {
    const html = render({ color: '#22c55e', ledOn: false });
    expect(html).toContain('background-color:#333');
    expect(html).toContain('box-shadow:none');
  });

  it('treats ledOn=undefined as LIT (editor design-viz)', () => {
    const html = render({ color: '#22c55e' });
    expect(html).toContain('background-color:#22c55e');
    expect(html).toContain('box-shadow:0 0 4px 1px #22c55e');
  });

  it('honors custom size', () => {
    const html = render({ color: '#fff', size: 10 });
    expect(html).toContain('width:10px');
    expect(html).toContain('height:10px');
  });

  it('merges extra className', () => {
    const html = render({ color: '#fff', className: 'extra-class' });
    expect(html).toContain('class="rounded-full extra-class"');
  });
});

describe('SharedLedDot — internal variant (PanelButton flex sibling)', () => {
  it('renders LIT with stronger glow (0 0 6px 2px) when ledOn=true', () => {
    const html = render({ color: '#22c55e', ledOn: true, variant: 'internal' });
    expect(html).toContain('rounded-full transition-all duration-150');
    expect(html).toContain('background-color:#22c55e');
    expect(html).toContain('box-shadow:0 0 6px 2px #22c55e');
  });

  it('renders DIM with #1a1a1a + inset shadow when ledOn=false', () => {
    const html = render({ color: '#22c55e', ledOn: false, variant: 'internal' });
    expect(html).toContain('background-color:#1a1a1a');
    expect(html).toContain('box-shadow:inset 0 1px 2px rgba(0,0,0,0.5)');
  });

  it('treats ledOn=undefined as DIM (matches pre-refactor PanelButton behavior)', () => {
    const html = render({ color: '#22c55e', variant: 'internal' });
    expect(html).toContain('background-color:#1a1a1a');
    expect(html).toContain('box-shadow:inset 0 1px 2px rgba(0,0,0,0.5)');
  });

  it('uses size prop when provided (fluid mode)', () => {
    const html = render({ color: '#fff', variant: 'internal', size: 8 });
    expect(html).toContain('width:8px');
    expect(html).toContain('height:8px');
  });

  it('uses className for sizing when size omitted (preset mode like sizeStyle.led)', () => {
    const html = render({ color: '#fff', variant: 'internal', className: 'w-1.5 h-1.5' });
    expect(html).toContain('rounded-full transition-all duration-150 w-1.5 h-1.5');
    // No inline width/height when sizing via className
    expect(html).not.toContain('width:');
    expect(html).not.toContain('height:');
  });
});
