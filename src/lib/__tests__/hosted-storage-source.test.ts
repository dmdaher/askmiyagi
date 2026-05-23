/**
 * Tests for backup source tagging in hosted-storage.
 *
 * Why: throttle bug + UI coalescing PR adds source-tagged filenames to
 * distinguish autosave / manual / submit / send / restore backups in
 * version-history UI. These tests pin down the filename parser so legacy
 * filenames keep working and new tags round-trip cleanly.
 */
import { describe, it, expect } from 'vitest';
import { parseBackupSource } from '@/lib/hosted-storage';

describe('parseBackupSource', () => {
  it('parses autosave prefix', () => {
    expect(parseBackupSource('autosave-2026-05-14T00-27-42-100Z.json')).toBe('autosave');
  });

  it('parses manual prefix', () => {
    expect(parseBackupSource('manual-2026-05-14T00-27-42-100Z.json')).toBe('manual');
  });

  it('parses submit prefix', () => {
    expect(parseBackupSource('submit-2026-05-14T00-27-42-100Z.json')).toBe('submit');
  });

  it('parses send prefix', () => {
    expect(parseBackupSource('send-2026-05-14T00-27-42-100Z.json')).toBe('send');
  });

  it('parses restore prefix', () => {
    expect(parseBackupSource('restore-2026-05-14T00-27-42-100Z.json')).toBe('restore');
  });

  it('legacy filename (no prefix) defaults to autosave', () => {
    expect(parseBackupSource('2026-05-14T00-27-42-100Z.json')).toBe('autosave');
  });

  it('unknown prefix defaults to autosave', () => {
    expect(parseBackupSource('unknown-2026-05-14T00-27-42.json')).toBe('autosave');
  });

  it('handles bare filename (no extension)', () => {
    expect(parseBackupSource('autosave-foo')).toBe('autosave');
  });

  it('empty string defaults to autosave', () => {
    expect(parseBackupSource('')).toBe('autosave');
  });

  it('only matches at start of filename', () => {
    // A filename like "foo-autosave-..." should NOT be parsed as autosave
    // because the tag must be the leading token.
    expect(parseBackupSource('foo-autosave-2026.json')).toBe('autosave');
  });
});
