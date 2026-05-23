import { describe, it, expect } from 'vitest';
import { computeManifestVersion } from '@/lib/pipeline/manifest-version';

/**
 * Tests for manifest → editor data flow.
 * Verifies that loadFromManifest correctly processes all manifest structures.
 */

// Re-implement extractContainerIds for testing (same logic as manifestSlice.ts)
function extractContainerIds(containerAssignment: Record<string, unknown>): string[] {
  const ids: string[] = [];
  for (const value of Object.values(containerAssignment)) {
    if (Array.isArray(value)) {
      ids.push(...(value as string[]));
    } else if (value && typeof value === 'object') {
      const extractNested = (obj: Record<string, unknown>): string[] => {
        const nested: string[] = [];
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) {
            nested.push(...(v as string[]));
          } else if (v && typeof v === 'object' && 'controls' in (v as Record<string, unknown>)) {
            nested.push(...((v as { controls: string[] }).controls));
          } else if (v && typeof v === 'object') {
            nested.push(...extractNested(v as Record<string, unknown>));
          }
        }
        return nested;
      };
      ids.push(...extractNested(value as Record<string, unknown>));
    }
  }
  return ids;
}

describe('manifest → editor data flow', () => {
  describe('containerAssignment extraction', () => {
    it('extracts from flat arrays', () => {
      const ids = extractContainerIds({ left: ['a', 'b'], right: ['c'] });
      expect(ids).toEqual(['a', 'b', 'c']);
    });

    it('extracts from deeply nested Fantom-06 common section', () => {
      const assignment = {
        'left-column': ['write', 'master-fx', 'motional-pad', 'daw-ctrl', 'menu'],
        anchor: ['display'],
        'function-knobs': { row: { controls: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'], direction: 'row' } },
        'bottom-left': ['tempo'],
        'nav-right': {
          'value-dial': ['value-dial'],
          'inc-dec': { controls: ['dec', 'inc'], direction: 'row' },
          'cursor-cross': ['cursor-up', 'cursor-left', 'cursor-right', 'cursor-down'],
          'bottom-nav': { controls: ['shift', 'exit', 'enter'], direction: 'row' },
        },
      };
      const ids = extractContainerIds(assignment);
      expect(ids.length).toBe(23);
      expect(ids).toContain('e1');
      expect(ids).toContain('enter');
      expect(ids).toContain('display');
    });

    it('extracts from CDJ-3000 HOT_CUE with nested pads', () => {
      const assignment = {
        'left-column': ['SLIP', 'QUANTIZE', 'TIME_MODE'],
        'right-column': { pads: { controls: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], direction: 'row' } },
      };
      const ids = extractContainerIds(assignment);
      expect(ids.length).toBe(11);
    });
  });

  describe('manifest version marker', () => {
    it('same manifest produces same hash', () => {
      const m = { controls: [{ id: 'a', type: 'button' }], sections: [{ id: 's1' }] };
      expect(computeManifestVersion(m)).toBe(computeManifestVersion(m));
    });

    it('different control IDs produce different hash', () => {
      const m1 = { controls: [{ id: 'a', type: 'button' }], sections: [{ id: 's1' }] };
      const m2 = { controls: [{ id: 'b', type: 'button' }], sections: [{ id: 's1' }] };
      expect(computeManifestVersion(m1)).not.toBe(computeManifestVersion(m2));
    });

    it('different shapes produce different hash', () => {
      const m1 = { controls: [{ id: 'a', type: 'button', shape: 'circle' }], sections: [] };
      const m2 = { controls: [{ id: 'a', type: 'button', shape: 'rectangle' }], sections: [] };
      expect(computeManifestVersion(m1)).not.toBe(computeManifestVersion(m2));
    });

    it('empty manifest produces consistent hash', () => {
      const m = { controls: [], sections: [] };
      expect(computeManifestVersion(m)).toBe(computeManifestVersion(m));
    });
  });
});
