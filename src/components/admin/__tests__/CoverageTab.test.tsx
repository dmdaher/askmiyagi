import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import CoverageTab from '../CoverageTab';

function mockFetchOnce(response: unknown, ok = true, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => response,
  }) as unknown as typeof fetch;
}

describe('CoverageTab', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('shows empty state when no cached audit', async () => {
    mockFetchOnce({ cached: false });
    render(<CoverageTab deviceId="empty-device" />);
    await waitFor(() => {
      expect(screen.getByTestId('coverage-tab-empty')).toBeTruthy();
    });
    expect(screen.queryByTestId('coverage-report')).toBeNull();
  });

  it('renders CoverageReport when cached match-table fetched', async () => {
    mockFetchOnce({
      cached: true,
      summary: { total: 10, confirmed: 8, parentOnlyGaps: 1, missingGaps: 1, coveragePct: 80 },
      missing: [{ featureId: 'f1', featureName: 'Missing One', page: '5', matchKind: 'MISSING', tutorialId: '', stepId: '', evidenceQuote: '' }],
      parentOnlyGaps: [{ featureId: 'f2', featureName: 'Parent Gap', page: '7', matchKind: 'CONFIRMED_BY_PARENT_ONLY', tutorialId: 't1', stepId: '', evidenceQuote: '' }],
      matchTablePath: '.pipeline/test-device/agents/coverage-auditor/match-table.md',
      lastAuditMs: Date.now() - 60_000, // 1m ago
    });
    render(<CoverageTab deviceId="test-device" />);
    await waitFor(() => {
      expect(screen.getByTestId('coverage-report')).toBeTruthy();
    });
    expect(screen.getByText(/Missing One/)).toBeTruthy();
    expect(screen.getByText(/Parent Gap/)).toBeTruthy();
  });

  it('shows "Re-check now" button and triggers POST on click', async () => {
    mockFetchOnce({ cached: false });
    render(<CoverageTab deviceId="x" />);
    await waitFor(() => {
      expect(screen.getByTestId('coverage-tab-empty')).toBeTruthy();
    });
    const btn = screen.getByTestId('coverage-tab-recheck-button');
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).disabled).toBe(false);

    // Mock the POST response
    mockFetchOnce({
      ok: true,
      summary: { total: 5, confirmed: 5, parentOnlyGaps: 0, missingGaps: 0, coveragePct: 100 },
      missing: [],
      parentOnlyGaps: [],
      matchTablePath: '.pipeline/x/agents/coverage-auditor/match-table.md',
      costUsd: 3.5,
    });
    fireEvent.click(btn);
    // POST is async — button should briefly show "Re-checking…"
    await waitFor(() => {
      expect(screen.getByTestId('coverage-report')).toBeTruthy();
    });
    // After completion, no gaps state should show
    expect(screen.getByText(/No gaps found/)).toBeTruthy();
  });

  it('renders error state when POST fails', async () => {
    mockFetchOnce({ cached: false });
    render(<CoverageTab deviceId="y" />);
    await waitFor(() => {
      expect(screen.getByTestId('coverage-tab-empty')).toBeTruthy();
    });
    // Mock failed POST
    mockFetchOnce({ error: 'Agent crashed for some reason' }, false, 500);
    fireEvent.click(screen.getByTestId('coverage-tab-recheck-button'));
    await waitFor(() => {
      expect(screen.getByTestId('coverage-tab-error')).toBeTruthy();
    });
    expect(screen.getByText(/Agent crashed/)).toBeTruthy();
  });
});
