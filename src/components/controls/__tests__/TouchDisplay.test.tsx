import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TouchDisplay from '../TouchDisplay';

describe('TouchDisplay', () => {
  it('renders scanline overlay', () => {
    const { container } = render(<TouchDisplay id="main-screen" />);
    const scanline = container.querySelector('[data-layer="scanlines"]');
    expect(scanline).toBeInTheDocument();
  });

  it('renders screen glow overlay', () => {
    const { container } = render(<TouchDisplay id="main-screen" />);
    const glow = container.querySelector('[data-layer="glow"]');
    expect(glow).toBeInTheDocument();
  });

  it('renders bezel with inset shadow', () => {
    const { container } = render(<TouchDisplay id="main-screen" />);
    const bezel = container.querySelector('[data-layer="bezel"]');
    expect(bezel).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    const { container } = render(<TouchDisplay id="main-screen" label="DISPLAY" />);
    expect(container.textContent).toContain('DISPLAY');
  });
});
