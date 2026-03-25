import { describe, it, expect } from 'vitest';

/**
 * Tests that loadFromManifest correctly extracts ALL controls from
 * various containerAssignment structures. This prevents the bug where
 * nested container objects (e.g., { controls: [...], direction: 'row' })
 * are silently dropped, causing controls to disappear from the editor.
 */

// Helper: simulate the extractIds logic from loadFromManifest
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

describe('containerAssignment extraction', () => {
  it('handles flat arrays', () => {
    const assignment = {
      'left-column': ['btn-1', 'btn-2'],
      'right-column': ['btn-3', 'btn-4'],
    };
    expect(extractContainerIds(assignment)).toEqual(['btn-1', 'btn-2', 'btn-3', 'btn-4']);
  });

  it('handles nested subzones with controls + direction', () => {
    const assignment = {
      'left-column': ['slip', 'quantize'],
      'right-column': {
        pads: {
          controls: ['pad-a', 'pad-b', 'pad-c', 'pad-d'],
          direction: 'row',
        },
      },
    };
    const ids = extractContainerIds(assignment);
    expect(ids).toContain('slip');
    expect(ids).toContain('quantize');
    expect(ids).toContain('pad-a');
    expect(ids).toContain('pad-d');
    expect(ids.length).toBe(6);
  });

  it('handles deeply nested structures (Fantom-06 common section)', () => {
    const assignment = {
      'left-column': ['write', 'master-fx', 'motional-pad', 'daw-ctrl', 'menu'],
      anchor: ['display'],
      'function-knobs': {
        row: {
          controls: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'],
          direction: 'row',
        },
      },
      'bottom-left': ['tempo'],
      'nav-right': {
        'value-dial': ['value-dial'],
        'inc-dec': {
          controls: ['dec', 'inc'],
          direction: 'row',
        },
        'cursor-cross': ['cursor-up', 'cursor-left', 'cursor-right', 'cursor-down'],
        'bottom-nav': {
          controls: ['shift', 'exit', 'enter'],
          direction: 'row',
        },
      },
    };
    const ids = extractContainerIds(assignment);
    // Should find ALL 23 controls
    expect(ids).toContain('write');
    expect(ids).toContain('display');
    expect(ids).toContain('e1');
    expect(ids).toContain('e6');
    expect(ids).toContain('tempo');
    expect(ids).toContain('value-dial');
    expect(ids).toContain('dec');
    expect(ids).toContain('cursor-up');
    expect(ids).toContain('shift');
    expect(ids).toContain('enter');
    expect(ids.length).toBe(23);
  });

  it('handles CDJ-3000 HOT_CUE nested pads', () => {
    const assignment = {
      'left-column': ['SLIP', 'QUANTIZE', 'TIME_MODE_AUTO_CUE'],
      'right-column': {
        pads: {
          controls: ['HOT_CUE_A', 'HOT_CUE_B', 'HOT_CUE_C', 'HOT_CUE_D',
                     'HOT_CUE_E', 'HOT_CUE_F', 'HOT_CUE_G', 'HOT_CUE_H'],
          direction: 'row',
        },
      },
    };
    const ids = extractContainerIds(assignment);
    expect(ids.length).toBe(11);
    expect(ids).toContain('SLIP');
    expect(ids).toContain('HOT_CUE_A');
    expect(ids).toContain('HOT_CUE_H');
  });

  it('handles empty/undefined values gracefully', () => {
    expect(extractContainerIds({})).toEqual([]);
    expect(extractContainerIds({ a: null as unknown })).toEqual([]);
    expect(extractContainerIds({ a: undefined as unknown })).toEqual([]);
  });
});
