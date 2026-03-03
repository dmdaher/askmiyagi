import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock process.env before importing the store
vi.stubEnv('NEXT_PUBLIC_PREVIEW_CODES', 'TESTCODE,PREVIEW2026,miyagi-preview');

// Dynamic import to pick up the env stub
const { usePreviewStore } = await import('@/store/previewStore');

describe('previewStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    usePreviewStore.setState({
      hasAccess: false,
      inviteCode: null,
      agreedToTerms: false,
    });
  });

  it('starts with no access', () => {
    const state = usePreviewStore.getState();
    expect(state.hasAccess).toBe(false);
    expect(state.inviteCode).toBeNull();
    expect(state.agreedToTerms).toBe(false);
  });

  it('validates correct codes (case-insensitive)', () => {
    const { validateCode } = usePreviewStore.getState();
    expect(validateCode('TESTCODE')).toBe(true);
    expect(validateCode('testcode')).toBe(true);
    expect(validateCode('TestCode')).toBe(true);
    expect(validateCode('PREVIEW2026')).toBe(true);
    expect(validateCode('miyagi-preview')).toBe(true);
    expect(validateCode('MIYAGI-PREVIEW')).toBe(true);
  });

  it('rejects invalid codes', () => {
    const { validateCode } = usePreviewStore.getState();
    expect(validateCode('WRONG')).toBe(false);
    expect(validateCode('')).toBe(false);
    expect(validateCode('test')).toBe(false);
  });

  it('grants access with valid code', () => {
    usePreviewStore.getState().grantAccess('TESTCODE');
    const state = usePreviewStore.getState();
    expect(state.hasAccess).toBe(true);
    expect(state.inviteCode).toBe('TESTCODE');
  });

  it('agrees to terms', () => {
    usePreviewStore.getState().agreeToTerms();
    expect(usePreviewStore.getState().agreedToTerms).toBe(true);
  });

  it('revokes access and clears all state', () => {
    usePreviewStore.getState().grantAccess('TESTCODE');
    usePreviewStore.getState().agreeToTerms();
    usePreviewStore.getState().revokeAccess();

    const state = usePreviewStore.getState();
    expect(state.hasAccess).toBe(false);
    expect(state.inviteCode).toBeNull();
    expect(state.agreedToTerms).toBe(false);
  });

  it('trims whitespace from codes', () => {
    usePreviewStore.getState().grantAccess('  TESTCODE  ');
    expect(usePreviewStore.getState().inviteCode).toBe('TESTCODE');
  });
});
