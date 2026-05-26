import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import SidebarTabs, { type TabDef } from '../SidebarTabs';

const baseTabs: TabDef[] = [
  { id: 'tutorials', label: 'Tutorials' },
  { id: 'qa', label: 'QA', count: 3, severity: 'error' },
  { id: 'coverage', label: 'Coverage', count: 5, severity: 'warn' },
  { id: 'notes', label: 'Notes' },
];

describe('SidebarTabs', () => {
  it('renders all 4 tab buttons with correct labels', () => {
    const { container } = render(
      <SidebarTabs tabs={baseTabs} activeId="tutorials" onChange={() => {}} />,
    );
    const buttons = container.querySelectorAll('[data-testid^="sidebar-tab-"]');
    // 4 buttons + 2 badges = 6 matches. Filter by data-testid prefix exact match (no -badge suffix).
    const tabButtons = Array.from(buttons).filter((el) => !el.getAttribute('data-testid')!.endsWith('-badge'));
    expect(tabButtons).toHaveLength(4);
    expect(tabButtons[0].textContent).toContain('Tutorials');
    expect(tabButtons[1].textContent).toContain('QA');
    expect(tabButtons[2].textContent).toContain('Coverage');
    expect(tabButtons[3].textContent).toContain('Notes');
  });

  it('marks active tab visually + via aria-selected', () => {
    const { container } = render(
      <SidebarTabs tabs={baseTabs} activeId="qa" onChange={() => {}} />,
    );
    const activeTab = container.querySelector('[data-testid="sidebar-tab-qa"]')!;
    expect(activeTab.getAttribute('data-active')).toBe('true');
    expect(activeTab.getAttribute('aria-selected')).toBe('true');
    const inactiveTab = container.querySelector('[data-testid="sidebar-tab-tutorials"]')!;
    expect(inactiveTab.getAttribute('data-active')).toBe('false');
    expect(inactiveTab.getAttribute('aria-selected')).toBe('false');
  });

  it('invokes onChange with new tab id when clicked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <SidebarTabs tabs={baseTabs} activeId="tutorials" onChange={onChange} />,
    );
    fireEvent.click(container.querySelector('[data-testid="sidebar-tab-coverage"]')!);
    expect(onChange).toHaveBeenCalledWith('coverage');
  });

  it('renders count badges with severity-appropriate color', () => {
    const { container } = render(
      <SidebarTabs tabs={baseTabs} activeId="tutorials" onChange={() => {}} />,
    );
    const qaBadge = container.querySelector('[data-testid="sidebar-tab-qa-badge"]')! as HTMLElement;
    expect(qaBadge.textContent).toBe('3');
    expect(qaBadge.style.color).toContain('rgb'); // red-400-ish
    const coverageBadge = container.querySelector('[data-testid="sidebar-tab-coverage-badge"]')! as HTMLElement;
    expect(coverageBadge.textContent).toBe('5');
  });

  it('hides badge when count is undefined or null', () => {
    const { container } = render(
      <SidebarTabs tabs={baseTabs} activeId="tutorials" onChange={() => {}} />,
    );
    expect(container.querySelector('[data-testid="sidebar-tab-tutorials-badge"]')).toBeNull();
    expect(container.querySelector('[data-testid="sidebar-tab-notes-badge"]')).toBeNull();
  });

  it('keyboard focus management — active tab is tabIndex 0, others -1', () => {
    const { container } = render(
      <SidebarTabs tabs={baseTabs} activeId="coverage" onChange={() => {}} />,
    );
    const activeTab = container.querySelector('[data-testid="sidebar-tab-coverage"]')!;
    expect(activeTab.getAttribute('tabindex')).toBe('0');
    const inactiveTab = container.querySelector('[data-testid="sidebar-tab-qa"]')!;
    expect(inactiveTab.getAttribute('tabindex')).toBe('-1');
  });
});
