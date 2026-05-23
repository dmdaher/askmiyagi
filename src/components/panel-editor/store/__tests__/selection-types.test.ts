import { describe, it, expect } from 'vitest';
import {
  formatSelectableId,
  parseSelectableId,
  selectionOfType,
  hasSelectionOfType,
  selectionTypes,
  type SelectableId,
} from '../selection-types';

describe('selection-types', () => {
  describe('formatSelectableId', () => {
    it('joins type and id with a colon', () => {
      expect(formatSelectableId('control', 'cutoff')).toBe('control:cutoff');
      expect(formatSelectableId('label', 'lbl-12')).toBe('label:lbl-12');
    });

    it('preserves embedded colons in ids (only the FIRST colon is the separator)', () => {
      expect(formatSelectableId('section', 'osc:1:section')).toBe('section:osc:1:section');
    });
  });

  describe('parseSelectableId', () => {
    it('round-trips with formatSelectableId', () => {
      const id = formatSelectableId('control', 'cutoff');
      expect(parseSelectableId(id)).toEqual({ type: 'control', id: 'cutoff' });
    });

    it('handles ids with colons in them by splitting on the first colon only', () => {
      expect(parseSelectableId('section:osc:1:section')).toEqual({ type: 'section', id: 'osc:1:section' });
    });

    it('returns null for unknown types', () => {
      expect(parseSelectableId('widget:foo')).toBeNull();
    });

    it('returns null for missing id or missing colon', () => {
      expect(parseSelectableId('control')).toBeNull();
      expect(parseSelectableId('control:')).toBeNull();
      expect(parseSelectableId(':cutoff')).toBeNull();
    });
  });

  describe('selectionOfType', () => {
    it('returns ids for the requested type only', () => {
      const sel: SelectableId[] = ['control:a', 'control:b', 'label:l1', 'section:s1'];
      expect(selectionOfType(sel, 'control')).toEqual(['a', 'b']);
      expect(selectionOfType(sel, 'label')).toEqual(['l1']);
      expect(selectionOfType(sel, 'section')).toEqual(['s1']);
      expect(selectionOfType(sel, 'banner')).toEqual([]);
    });

    it('preserves order of appearance', () => {
      const sel: SelectableId[] = ['control:z', 'control:a', 'control:m'];
      expect(selectionOfType(sel, 'control')).toEqual(['z', 'a', 'm']);
    });
  });

  describe('hasSelectionOfType', () => {
    it('returns true when at least one entry matches', () => {
      const sel: SelectableId[] = ['control:a', 'label:l1'];
      expect(hasSelectionOfType(sel, 'control')).toBe(true);
      expect(hasSelectionOfType(sel, 'label')).toBe(true);
      expect(hasSelectionOfType(sel, 'banner')).toBe(false);
    });

    it('returns false for empty selection', () => {
      expect(hasSelectionOfType([], 'control')).toBe(false);
    });
  });

  describe('selectionTypes', () => {
    it('returns the unique set of types present', () => {
      const sel: SelectableId[] = ['control:a', 'control:b', 'label:l1'];
      const types = selectionTypes(sel);
      expect(types.has('control')).toBe(true);
      expect(types.has('label')).toBe(true);
      expect(types.has('section')).toBe(false);
      expect(types.size).toBe(2);
    });

    it('returns an empty set for empty selection', () => {
      expect(selectionTypes([]).size).toBe(0);
    });
  });
});
