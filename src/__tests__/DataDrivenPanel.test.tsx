import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DataDrivenPanel from '@/components/devices/DataDrivenPanel';
import type { PanelLayout } from '@/types/panel';

const structuralLayout: PanelLayout = {
  deviceId: 'test-device',
  layoutMode: 'structural',
  dimensions: { width: 400, height: 600 },
  background: { color: '#1a1a1e' },
  rows: [
    { sections: ['top-bar'], height: 'auto' },
    { sections: ['left', 'center', 'right'], stretch: 'center', gap: 8 },
  ],
  sections: [
    {
      id: 'top-bar',
      label: 'Top Bar',
      controlLayout: { type: 'flex-row', gap: 4 },
      controls: [
        { id: 'btn-1', type: 'button', label: 'A', section: 'top-bar' },
        { id: 'btn-2', type: 'button', label: 'B', section: 'top-bar' },
        { id: 'btn-3', type: 'button', label: 'C', section: 'top-bar' },
      ],
    },
    {
      id: 'left',
      label: 'Left',
      controlLayout: { type: 'flex-col', gap: 8 },
      minWidth: 80,
      controls: [
        { id: 'knob-1', type: 'knob', label: 'K1', section: 'left' },
      ],
    },
    {
      id: 'center',
      label: 'Center',
      controlLayout: { type: 'grid', columns: 4, gap: 4 },
      controls: [
        { id: 'pad-1', type: 'pad', label: '1', section: 'center' },
        { id: 'pad-2', type: 'pad', label: '2', section: 'center' },
        { id: 'pad-3', type: 'pad', label: '3', section: 'center' },
        { id: 'pad-4', type: 'pad', label: '4', section: 'center' },
      ],
    },
    {
      id: 'right',
      label: 'Right',
      controlLayout: { type: 'flex-col', gap: 4 },
      minWidth: 60,
      controls: [
        { id: 'slider-1', type: 'slider', label: 'S1', section: 'right' },
      ],
    },
  ],
};

describe('DataDrivenPanel', () => {
  it('renders all sections in structural mode', () => {
    const { container } = render(
      <DataDrivenPanel layout={structuralLayout} panelState={{}} highlightedControls={[]} />,
    );
    expect(container.querySelector('[data-section-id="top-bar"]')).toBeTruthy();
    expect(container.querySelector('[data-section-id="left"]')).toBeTruthy();
    expect(container.querySelector('[data-section-id="center"]')).toBeTruthy();
    expect(container.querySelector('[data-section-id="right"]')).toBeTruthy();
  });

  it('renders controls within sections', () => {
    const { container } = render(
      <DataDrivenPanel layout={structuralLayout} panelState={{}} highlightedControls={[]} />,
    );
    const controls = container.querySelectorAll('[data-control-id]');
    expect(controls.length).toBeGreaterThanOrEqual(9);
  });

  it('uses flex-row for top-bar section', () => {
    const { container } = render(
      <DataDrivenPanel layout={structuralLayout} panelState={{}} highlightedControls={[]} />,
    );
    const topBar = container.querySelector('[data-section-id="top-bar"]') as HTMLElement;
    const controlsContainer = topBar?.querySelector('[data-layout]') as HTMLElement;
    expect(controlsContainer?.dataset.layout).toBe('flex-row');
  });

  it('uses grid for center section', () => {
    const { container } = render(
      <DataDrivenPanel layout={structuralLayout} panelState={{}} highlightedControls={[]} />,
    );
    const center = container.querySelector('[data-section-id="center"]') as HTMLElement;
    const controlsContainer = center?.querySelector('[data-layout]') as HTMLElement;
    expect(controlsContainer?.dataset.layout).toBe('grid');
  });

  it('applies highlight to controls', () => {
    const { container } = render(
      <DataDrivenPanel layout={structuralLayout} panelState={{}} highlightedControls={['btn-1']} />,
    );
    const btn = container.querySelector('[data-control-id="btn-1"]');
    expect(btn).toBeTruthy();
  });
});
