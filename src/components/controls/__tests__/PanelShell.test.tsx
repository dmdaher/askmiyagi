import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PanelShell from '../PanelShell';

describe('PanelShell', () => {
  it('renders children inside the shell', () => {
    render(
      <PanelShell manufacturer="Pioneer DJ" deviceName="CDJ-3000" width={1200} height={1470}>
        <div data-testid="child">Hello</div>
      </PanelShell>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders manufacturer and device name', () => {
    render(
      <PanelShell manufacturer="Roland" deviceName="FANTOM-06" width={1200} height={361}>
        <div />
      </PanelShell>
    );
    expect(screen.getByText('Roland')).toBeInTheDocument();
    expect(screen.getByText('FANTOM-06')).toBeInTheDocument();
  });

  it('applies width and height to the container', () => {
    const { container } = render(
      <PanelShell manufacturer="Test" deviceName="Test" width={800} height={600}>
        <div />
      </PanelShell>
    );
    // The motion.div is the second child (first is the overflow wrapper)
    const shell = container.firstChild?.firstChild as HTMLElement;
    expect(shell.style.width).toBe('800px');
    expect(shell.style.height).toBe('600px');
  });

  it('renders keyboard when keyboard prop is provided', () => {
    render(
      <PanelShell
        manufacturer="Roland"
        deviceName="FANTOM-06"
        width={1200}
        height={361}
        keyboard={{ keys: 61, startNote: 'C2', panelHeightPercent: 35 }}
      >
        <div data-testid="controls">Controls</div>
      </PanelShell>
    );
    const keys = document.querySelectorAll('[data-key-type]');
    expect(keys.length).toBe(61);
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });

  it('does not render keyboard when keyboard is null', () => {
    render(
      <PanelShell manufacturer="Pioneer" deviceName="CDJ-3000" width={1200} height={1470} keyboard={null}>
        <div />
      </PanelShell>
    );
    const keys = document.querySelectorAll('[data-key-type]');
    expect(keys.length).toBe(0);
  });
});
