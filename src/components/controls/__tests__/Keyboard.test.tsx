import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Keyboard from '../Keyboard';

describe('Keyboard', () => {
  it('renders correct key count for 61-key keyboard', () => {
    const { container } = render(<Keyboard keys={61} startNote="C2" />);
    const allKeys = container.querySelectorAll('[data-key-type]');
    expect(allKeys.length).toBe(61);
  });

  it('renders correct key count for 25-key keyboard', () => {
    const { container } = render(<Keyboard keys={25} startNote="C3" />);
    const allKeys = container.querySelectorAll('[data-key-type]');
    expect(allKeys.length).toBe(25);
  });

  it('renders correct key count for 88-key keyboard', () => {
    const { container } = render(<Keyboard keys={88} startNote="A0" />);
    const allKeys = container.querySelectorAll('[data-key-type]');
    expect(allKeys.length).toBe(88);
  });

  it('renders with zone coloring', () => {
    const zones = [
      { zoneNumber: 1, color: '#ff0000', lowNote: 36, highNote: 60, label: 'Zone 1' },
    ];
    const { container } = render(<Keyboard keys={61} startNote="C2" zones={zones} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('has both white and black keys', () => {
    const { container } = render(<Keyboard keys={61} startNote="C2" />);
    const whiteKeys = container.querySelectorAll('[data-key-type="white"]');
    const blackKeys = container.querySelectorAll('[data-key-type="black"]');
    expect(whiteKeys.length).toBeGreaterThan(0);
    expect(blackKeys.length).toBeGreaterThan(0);
  });
});
