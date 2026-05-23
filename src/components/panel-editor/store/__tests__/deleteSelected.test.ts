import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';

/**
 * Policy: pipeline-generated CONTROLS are NEVER deletable in the editor.
 * Only standalone labels, polish banners, and containers are removable.
 * `deleteSelected` is therefore a no-op for controls.
 *
 * These tests assert the no-op contract for the legacy deleteSelected
 * action. The previous behavior (controlContainers/childIds/groups
 * cleanup on control delete) is preserved as
 * `_legacyDeleteSelected_DEPRECATED` for any rare admin tooling, but no
 * UI surface exercises it.
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
    ],
    editorLabels: [
      { id: 'lbl-a', controlId: 'a', text: 'A-label', x: 10, y: 50, w: 40, fontSize: 8, align: 'center', hidden: false },
      { id: 'lbl-b', controlId: 'b', text: 'B-label', x: 60, y: 50, w: 40, fontSize: 8, align: 'center', hidden: false },
    ],
    controlGroups: [],
    selection: [] as any,
    lockedIds: [],
  } as any);
}

describe('deleteSelected — control deletion policy (no-op)', () => {
  beforeEach(resetStore);

  it('does NOT delete controls when called with selected controls', () => {
    useEditorStore.setState({ selection: ['control:a'] as any });
    useEditorStore.getState().deleteSelected();
    const { controls } = useEditorStore.getState();
    expect(controls.a).toBeDefined();
    expect(controls.b).toBeDefined();
    expect(controls.c).toBeDefined();
  });

  it('preserves section.childIds unchanged', () => {
    useEditorStore.setState({ selection: ['control:a', 'control:b'] as any });
    useEditorStore.getState().deleteSelected();
    const { sections } = useEditorStore.getState();
    expect(sections.s1.childIds).toEqual(['a', 'b', 'c']);
  });

  it('preserves controlContainers entirely (containers untouched)', () => {
    useEditorStore.setState({ selection: ['control:a'] as any });
    useEditorStore.getState().deleteSelected();
    const { controlContainers } = useEditorStore.getState();
    expect(controlContainers).toHaveLength(2);
    expect(controlContainers.find((c) => c.id === 'ctn-1')?.controlIds).toEqual(['a', 'b']);
  });

  it('preserves linked labels — they belong to controls that stay', () => {
    useEditorStore.setState({ selection: ['control:a'] as any });
    useEditorStore.getState().deleteSelected();
    const { editorLabels } = useEditorStore.getState();
    expect(editorLabels.find((l) => l.id === 'lbl-a')).toBeDefined();
  });

  it('is a true no-op — multiple calls produce identical state', () => {
    const before = JSON.stringify(useEditorStore.getState().controls);
    useEditorStore.getState().deleteSelected();
    useEditorStore.getState().deleteSelected();
    expect(JSON.stringify(useEditorStore.getState().controls)).toEqual(before);
  });
});
