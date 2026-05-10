import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';

/**
 * Tests that deleteSelected fully cleans up cross-references in:
 *   - section.childIds
 *   - editorLabels (linked labels for deleted controls)
 *   - controlGroups (filter members, dissolve under-2)
 *   - controlContainers (NEW — closes Tier 3 gap)
 *
 * Without the controlContainers cleanup, deleting a control would leave an
 * orphan id in `controlContainers[i].controlIds` forever, caught by the
 * post-editor validator as CONTAINER_ORPHAN (PR #104 E8).
 */

function resetStore() {
  useEditorStore.setState({
    controls: {
      a: { id: 'a', x: 10, y: 10, w: 40, h: 30, sectionId: 's1', label: 'A', type: 'button', labelPosition: 'above', locked: false },
      b: { id: 'b', x: 60, y: 10, w: 40, h: 30, sectionId: 's1', label: 'B', type: 'button', labelPosition: 'above', locked: false },
      c: { id: 'c', x: 110, y: 10, w: 40, h: 30, sectionId: 's1', label: 'C', type: 'button', labelPosition: 'above', locked: false },
    },
    sections: {
      s1: { id: 's1', headerLabel: 'S1', archetype: 'grid', x: 0, y: 0, w: 200, h: 100, childIds: ['a', 'b', 'c'] },
    },
    controlContainers: [
      { id: 'ctn-1', controlIds: ['a', 'b'], style: 'recessed', x: 5, y: 5, w: 100, h: 50, borderRadius: 4 },
      { id: 'ctn-2', controlIds: ['c'], style: 'recessed', x: 105, y: 5, w: 50, h: 50, borderRadius: 4 },
      { id: 'ctn-3', controlIds: ['a', 'c'], style: 'recessed', x: 5, y: 5, w: 150, h: 50, borderRadius: 4 },
    ],
    editorLabels: [
      { id: 'lbl-a', controlId: 'a', text: 'A-label', x: 10, y: 50, w: 40, fontSize: 8, align: 'center', hidden: false },
      { id: 'lbl-b', controlId: 'b', text: 'B-label', x: 60, y: 50, w: 40, fontSize: 8, align: 'center', hidden: false },
    ],
    controlGroups: [],
    selectedIds: [],
    lockedIds: [],
  } as any);
}

describe('deleteSelected — controlContainers cleanup (Tier 3)', () => {
  beforeEach(resetStore);

  it('removes deleted control id from controlContainers.controlIds', () => {
    useEditorStore.setState({ selectedIds: ['a'] });
    useEditorStore.getState().deleteSelected();
    const { controlContainers } = useEditorStore.getState();

    // ctn-1 originally had ['a', 'b'] — now ['b']
    const ctn1 = controlContainers.find(c => c.id === 'ctn-1');
    expect(ctn1?.controlIds).toEqual(['b']);

    // ctn-3 originally had ['a', 'c'] — now ['c']
    const ctn3 = controlContainers.find(c => c.id === 'ctn-3');
    expect(ctn3?.controlIds).toEqual(['c']);

    // ctn-2 untouched
    const ctn2 = controlContainers.find(c => c.id === 'ctn-2');
    expect(ctn2?.controlIds).toEqual(['c']);
  });

  it('dissolves a container when its last control is deleted', () => {
    useEditorStore.setState({ selectedIds: ['c'] });
    useEditorStore.getState().deleteSelected();
    const { controlContainers } = useEditorStore.getState();

    // ctn-2 had only ['c'] — should be removed entirely
    expect(controlContainers.find(c => c.id === 'ctn-2')).toBeUndefined();

    // ctn-1 had ['a', 'b'] — unchanged
    expect(controlContainers.find(c => c.id === 'ctn-1')?.controlIds).toEqual(['a', 'b']);

    // ctn-3 had ['a', 'c'] — now ['a']
    expect(controlContainers.find(c => c.id === 'ctn-3')?.controlIds).toEqual(['a']);
  });

  it('handles deleting multiple controls in a single pass', () => {
    useEditorStore.setState({ selectedIds: ['a', 'c'] });
    useEditorStore.getState().deleteSelected();
    const { controlContainers } = useEditorStore.getState();

    // ctn-1 had ['a', 'b'] — now ['b']
    expect(controlContainers.find(c => c.id === 'ctn-1')?.controlIds).toEqual(['b']);

    // ctn-2 had ['c'] — dissolved
    expect(controlContainers.find(c => c.id === 'ctn-2')).toBeUndefined();

    // ctn-3 had ['a', 'c'] — both deleted, dissolved
    expect(controlContainers.find(c => c.id === 'ctn-3')).toBeUndefined();
  });

  it('does not mutate containers when no selected controls belong to them', () => {
    // Create a control NOT in any container, then delete it
    useEditorStore.setState((s: any) => ({
      controls: {
        ...s.controls,
        loose: { id: 'loose', x: 200, y: 200, w: 40, h: 30, sectionId: 's1', label: 'L', type: 'button', labelPosition: 'above', locked: false },
      },
      selectedIds: ['loose'],
    }));
    useEditorStore.getState().deleteSelected();
    const { controlContainers } = useEditorStore.getState();

    // All three containers untouched
    expect(controlContainers.find(c => c.id === 'ctn-1')?.controlIds).toEqual(['a', 'b']);
    expect(controlContainers.find(c => c.id === 'ctn-2')?.controlIds).toEqual(['c']);
    expect(controlContainers.find(c => c.id === 'ctn-3')?.controlIds).toEqual(['a', 'c']);
  });

  it('still cleans section.childIds and editorLabels (pre-existing behavior)', () => {
    useEditorStore.setState({ selectedIds: ['a'] });
    useEditorStore.getState().deleteSelected();
    const { sections, editorLabels } = useEditorStore.getState();

    // section.childIds drops the deleted control
    expect(sections.s1.childIds).not.toContain('a');
    expect(sections.s1.childIds).toEqual(['b', 'c']);

    // editorLabels drops the linked label
    expect((editorLabels as any[]).find(l => l.id === 'lbl-a')).toBeUndefined();
    expect((editorLabels as any[]).find(l => l.id === 'lbl-b')).toBeDefined();
  });
});
