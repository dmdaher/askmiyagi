/**
 * Tests for looksTransient — classifies which agent failures should auto-retry.
 *
 * Wrong classification = real cost. Treating OOM as transient burns budget on
 * doomed retries. Missing a real transient blip means unnecessary pause-for-
 * admin. These tests pin both halves.
 */
import { describe, it, expect } from 'vitest';
import { looksTransient } from '@/lib/pipeline/runner';

describe('looksTransient', () => {
  describe('YES retry — transient API/network errors', () => {
    it('catches 529 Overloaded', () => {
      expect(looksTransient('API Error: 529 — Overloaded')).toBe(true);
      expect(looksTransient('overloaded_error from anthropic')).toBe(true);
    });

    it('catches stream-idle-timeout (cdj-3000 batch-b case)', () => {
      expect(looksTransient('API Error: Stream idle timeout - partial response received')).toBe(true);
    });

    it('catches socket-hang-up / socket-closed (cdj-3000 batch-e case)', () => {
      expect(looksTransient('API Error: socket hang up')).toBe(true);
      expect(looksTransient('socket connection was closed unexpectedly')).toBe(true);
    });

    it('catches ECONNRESET (non-billing)', () => {
      expect(looksTransient('Error: read ECONNRESET')).toBe(true);
    });

    it('catches ETIMEDOUT', () => {
      expect(looksTransient('Error: ETIMEDOUT after 30 seconds')).toBe(true);
    });

    it('catches generic fetch failed', () => {
      expect(looksTransient('TypeError: fetch failed')).toBe(true);
    });
  });

  describe('NO retry — never-retry patterns override transient', () => {
    it('does NOT retry OOM (heap out of memory)', () => {
      expect(looksTransient('FATAL ERROR: JavaScript heap out of memory')).toBe(false);
    });

    it('does NOT retry 401 Unauthorized', () => {
      expect(looksTransient('API Error: 401 Unauthorized — invalid_api_key')).toBe(false);
    });

    it('does NOT retry 403 Forbidden', () => {
      expect(looksTransient('API Error: 403 Forbidden')).toBe(false);
    });

    it('does NOT retry 402 Payment Required', () => {
      expect(looksTransient('API Error: 402 Payment Required — insufficient_quota')).toBe(false);
    });
  });

  describe('NO retry — non-transient errors', () => {
    it('does not retry generic Error', () => {
      expect(looksTransient('Error: something else broke')).toBe(false);
    });

    it('does not retry empty output', () => {
      expect(looksTransient('')).toBe(false);
    });

    it('does not retry clean success output', () => {
      expect(looksTransient('Tutorial generated successfully')).toBe(false);
    });
  });

  describe('priority: never-retry beats transient', () => {
    it('OOM + 529 in same output → still does not retry (OOM is fatal)', () => {
      expect(looksTransient('JavaScript heap out of memory while waiting for 529 retry')).toBe(false);
    });

    it('401 + ECONNRESET in same output → does not retry', () => {
      expect(looksTransient('401 Unauthorized; underlying ECONNRESET')).toBe(false);
    });
  });
});
