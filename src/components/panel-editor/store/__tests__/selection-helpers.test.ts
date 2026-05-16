import { describe, it, expect } from 'vitest';
import type { SelectableId } from '../selection-types';
import {
  selectedControlIds,
  selectedLabelIdFromSelection,
  selectedBannerIdFromSelection,
  selectedSectionIdFromSelection,
  isControlSelected,
  isLabelSelected,
  isSectionSelected,
  isBannerSelected,
  selectionCounts,
} from '../selection-types';

/**
 * Phase 6a — lock in the contract of the new typed selector helpers.
 * Every helper must match the EXACT semantics of the legacy field it
 * replaces, so call-site migration is a pure refactor (no behavior change).
 */

const ctrl = (id: string) => `control:${id}` as SelectableId;
const lbl = (id: string) => `label:${id}` as SelectableId;
const sec = (id: string) => `section:${id}` as SelectableId;
const ban = (id: string) => `banner:${id}` as SelectableId;
const con = (id: string) => `container:${id}` as SelectableId;

describe('selectedControlIds — mirrors legacy selectedIds (controls + sections mix)', () => {
  it('returns control ids from control: entries', () => {
    expect(selectedControlIds([ctrl('a'), ctrl('b')])).toEqual(['a', 'b']);
  });

  it('also returns section ids (legacy selectedIds was a mixed bag)', () => {
    expect(selectedControlIds([ctrl('a'), sec('s1')])).toEqual(['a', 's1']);
  });

  it('preserves insertion order', () => {
    expect(selectedControlIds([ctrl('z'), ctrl('a'), ctrl('m')])).toEqual(['z', 'a', 'm']);
  });

  it('skips labels, banners, containers', () => {
    expect(selectedControlIds([lbl('l1'), ctrl('c1'), ban('b1'), con('cn1')])).toEqual(['c1']);
  });

  it('returns empty array for empty selection', () => {
    expect(selectedControlIds([])).toEqual([]);
  });

  it('returns empty array for selection containing only labels', () => {
    expect(selectedControlIds([lbl('l1'), lbl('l2')])).toEqual([]);
  });
});

describe('selectedLabelIdFromSelection — mirrors legacy selectedLabelId single-slot', () => {
  it('returns the single label id when exactly one label is selected', () => {
    expect(selectedLabelIdFromSelection([lbl('only-one')])).toBe('only-one');
  });

  it('returns null when zero labels are in selection', () => {
    expect(selectedLabelIdFromSelection([ctrl('c1'), ctrl('c2')])).toBeNull();
    expect(selectedLabelIdFromSelection([])).toBeNull();
  });

  it('returns null when MULTIPLE labels are in selection (legacy field could not represent this)', () => {
    expect(selectedLabelIdFromSelection([lbl('l1'), lbl('l2')])).toBeNull();
  });

  it('returns the label id even when mixed with controls (1-label case still single)', () => {
    expect(selectedLabelIdFromSelection([ctrl('c1'), lbl('the-label')])).toBe('the-label');
  });
});

describe('selectedBannerIdFromSelection — mirrors legacy selectedBannerId', () => {
  it('returns single banner id', () => {
    expect(selectedBannerIdFromSelection([ban('only-one')])).toBe('only-one');
  });

  it('returns null when 0 or 2+ banners', () => {
    expect(selectedBannerIdFromSelection([])).toBeNull();
    expect(selectedBannerIdFromSelection([ban('b1'), ban('b2')])).toBeNull();
  });

  it('returns banner id when mixed with other types', () => {
    expect(selectedBannerIdFromSelection([ctrl('c1'), ban('the-banner'), lbl('l1')])).toBe('the-banner');
  });
});

describe('selectedSectionIdFromSelection', () => {
  it('returns single section id', () => {
    expect(selectedSectionIdFromSelection([sec('s1')])).toBe('s1');
  });

  it('returns null when no section or multiple sections', () => {
    expect(selectedSectionIdFromSelection([])).toBeNull();
    expect(selectedSectionIdFromSelection([ctrl('c1')])).toBeNull();
    expect(selectedSectionIdFromSelection([sec('s1'), sec('s2')])).toBeNull();
  });
});

describe('isControlSelected / isLabelSelected / isSectionSelected / isBannerSelected', () => {
  const sel: SelectableId[] = [ctrl('c1'), lbl('l1'), sec('s1'), ban('b1')];

  it('isControlSelected detects control presence', () => {
    expect(isControlSelected(sel, 'c1')).toBe(true);
    expect(isControlSelected(sel, 'c2')).toBe(false);
    expect(isControlSelected(sel, 'l1')).toBe(false); // l1 is a label, not a control
  });

  it('isLabelSelected detects label presence', () => {
    expect(isLabelSelected(sel, 'l1')).toBe(true);
    expect(isLabelSelected(sel, 'c1')).toBe(false);
  });

  it('isSectionSelected detects section presence', () => {
    expect(isSectionSelected(sel, 's1')).toBe(true);
    expect(isSectionSelected(sel, 'c1')).toBe(false);
  });

  it('isBannerSelected detects banner presence', () => {
    expect(isBannerSelected(sel, 'b1')).toBe(true);
    expect(isBannerSelected(sel, 'l1')).toBe(false);
  });
});

describe('selectionCounts — per-type breakdown for routing', () => {
  it('counts mixed selection correctly', () => {
    const result = selectionCounts([ctrl('a'), ctrl('b'), lbl('l1'), ban('b1'), sec('s1')]);
    expect(result).toEqual({
      control: 2, label: 1, section: 1, banner: 1, container: 0, groupLabel: 0, total: 5,
    });
  });

  it('returns zero counts for empty selection', () => {
    expect(selectionCounts([])).toEqual({
      control: 0, label: 0, section: 0, banner: 0, container: 0, groupLabel: 0, total: 0,
    });
  });

  it('total matches selection length even for unknown prefixes', () => {
    const result = selectionCounts(['unknown:xyz' as SelectableId, ctrl('c')]);
    expect(result.total).toBe(2);
    expect(result.control).toBe(1);
  });
});
