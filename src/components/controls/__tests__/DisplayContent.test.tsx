/**
 * Tests for DisplayContent — polymorphic tutorial-display renderer.
 *
 * Covers the 3 visual shapes used by current pipeline-built tutorials
 * (DeepMind-12), plus fallback behavior for unmapped screen types.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DisplayContent from '../DisplayContent';
import type { DisplayState } from '@/types/display';

const baseProps = { width: 200, height: 130 };

describe('DisplayContent', () => {
  it('renders home-style screen — statusText only', () => {
    const ds: DisplayState = { screenType: 'home', statusText: 'OSC1 SAW: On', selectedIndex: 1 };
    const { container } = render(<DisplayContent displayState={ds} {...baseProps} />);
    expect(container.textContent).toContain('OSC1 SAW: On');
    // selectedIndex shows as bracketed indicator when no menu/title
    expect(container.textContent).toContain('[1]');
  });

  it('renders menu screen — title + menuItems with selection cursor', () => {
    const ds: DisplayState = {
      screenType: 'menu',
      title: 'OSC 1 PARAMETERS',
      menuItems: [{ label: 'SAWTOOTH' }, { label: 'SQUARE' }, { label: 'PWM' }],
      selectedIndex: 1,
    };
    const { container } = render(<DisplayContent displayState={ds} {...baseProps} />);
    expect(container.textContent).toContain('OSC 1 PARAMETERS');
    expect(container.textContent).toContain('SAWTOOTH');
    expect(container.textContent).toContain('SQUARE');
    expect(container.textContent).toContain('PWM');
    // Selection cursor on the second item (selectedIndex === 1)
    expect(container.textContent).toContain('▶');
  });

  it('renders write-style screen — title + statusText together', () => {
    const ds: DisplayState = {
      screenType: 'write',
      title: 'WRITE PROGRAM',
      statusText: 'BANK A : 001',
      selectedIndex: 0,
    };
    const { container } = render(<DisplayContent displayState={ds} {...baseProps} />);
    expect(container.textContent).toContain('WRITE PROGRAM');
    expect(container.textContent).toContain('BANK A : 001');
  });

  it('falls back gracefully for unmapped screenType — shows screenType label', () => {
    const ds: DisplayState = {
      screenType: 'rec-standby', // valid screenType but no specific renderer
    };
    const { container } = render(<DisplayContent displayState={ds} {...baseProps} />);
    // Empty state shows the screenType so author sees something is wired
    expect(container.textContent).toContain('rec-standby');
  });

  it('renders generic primitive fields when present (parameterName / parameterValue)', () => {
    const ds: DisplayState = {
      screenType: 'home',
      parameterName: 'CUTOFF',
      parameterValue: '64',
    };
    const { container } = render(<DisplayContent displayState={ds} {...baseProps} />);
    expect(container.textContent).toContain('CUTOFF');
    expect(container.textContent).toContain('64');
  });

  it('handles tempo / sceneName generic fields', () => {
    const ds: DisplayState = {
      screenType: 'home',
      tempo: 120,
      sceneName: 'INTRO',
    };
    const { container } = render(<DisplayContent displayState={ds} {...baseProps} />);
    expect(container.textContent).toContain('INTRO');
    expect(container.textContent).toContain('120');
  });

  it('renders empty state when only screenType is present', () => {
    const ds: DisplayState = { screenType: 'home' };
    const { container } = render(<DisplayContent displayState={ds} {...baseProps} />);
    expect(container.textContent).toContain('home');
  });
});
