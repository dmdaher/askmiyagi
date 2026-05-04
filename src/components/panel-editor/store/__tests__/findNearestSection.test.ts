/**
 * Unit tests for findNearestSection — the helper that resolves a canvas
 * point (x, y) to the section whose bounding box contains it.
 * Used by addStandaloneLabel and moveLabel to assign sectionId to standalone labels.
 *
 * Since the helper is module-scoped (not exported), we test it via the
 * public actions that consume it: addStandaloneLabel and moveLabel.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';
import type { SectionDef } from '../manifestSlice';

function makeSection(id: string, x: number, y: number, w: number, h: number): SectionDef {
  return {
    id,
    archetype: 'single-row',
    x,
    y,
    w,
    h,
    childIds: [],
    layout: { mode: 'flow', direction: 'row', anchor: null },
  } as unknown as SectionDef;
}

describe('findNearestSection (via addStandaloneLabel)', () => {
  beforeEach(() => {
    // Reset store to a known state with two non-overlapping sections
    useEditorStore.setState({
      sections: {
        'sec-a': makeSection('sec-a', 0, 0, 200, 100),
        'sec-b': makeSection('sec-b', 300, 0, 200, 100),
      },
      controls: {},
      editorLabels: [],
      controlGroups: [],
      controlContainers: [],
      selectedIds: [],
      selectedLabelId: null,
    });
  });

  it('assigns sectionId when label center falls inside a section bbox', () => {
    const id = useEditorStore.getState().addStandaloneLabel(50, 30, 'inside');
    const label = useEditorStore.getState().editorLabels.find((l) => l.id === id);
    expect(label?.sectionId).toBe('sec-a');
  });

  it('assigns sectionId for second non-overlapping section', () => {
    const id = useEditorStore.getState().addStandaloneLabel(330, 30, 'in-b');
    const label = useEditorStore.getState().editorLabels.find((l) => l.id === id);
    expect(label?.sectionId).toBe('sec-b');
  });

  it('leaves sectionId undefined when point falls outside every section', () => {
    const id = useEditorStore.getState().addStandaloneLabel(900, 900, 'outside');
    const label = useEditorStore.getState().editorLabels.find((l) => l.id === id);
    expect(label?.sectionId).toBeUndefined();
  });

  it('uses label center (x + w/2) for section detection — edge case on right boundary', () => {
    // Default w=60 → center at x+30. Click at x=170 → center at 200, on the boundary.
    // sec-a is x=[0,200], so center at 200 lies on the inclusive right edge.
    const id = useEditorStore.getState().addStandaloneLabel(170, 30, 'edge');
    const label = useEditorStore.getState().editorLabels.find((l) => l.id === id);
    expect(label?.sectionId).toBe('sec-a');
  });
});

describe('moveLabel recomputes sectionId on drag', () => {
  beforeEach(() => {
    useEditorStore.setState({
      sections: {
        'sec-a': makeSection('sec-a', 0, 0, 200, 100),
        'sec-b': makeSection('sec-b', 300, 0, 200, 100),
      },
      controls: {},
      editorLabels: [],
      controlGroups: [],
      controlContainers: [],
      selectedIds: [],
      selectedLabelId: null,
    });
  });

  it('updates sectionId when standalone label dragged across section boundary', () => {
    const id = useEditorStore.getState().addStandaloneLabel(50, 30, 'drag');
    expect(useEditorStore.getState().editorLabels.find((l) => l.id === id)?.sectionId).toBe('sec-a');

    // Drag from sec-a area to sec-b area (delta of +300 on x)
    useEditorStore.getState().moveLabel(id, 300, 0);
    expect(useEditorStore.getState().editorLabels.find((l) => l.id === id)?.sectionId).toBe('sec-b');
  });

  it('clears sectionId when standalone label dragged outside every section', () => {
    const id = useEditorStore.getState().addStandaloneLabel(50, 30, 'orphan');
    expect(useEditorStore.getState().editorLabels.find((l) => l.id === id)?.sectionId).toBe('sec-a');

    // Drag far outside any section
    useEditorStore.getState().moveLabel(id, 1000, 1000);
    expect(useEditorStore.getState().editorLabels.find((l) => l.id === id)?.sectionId).toBeUndefined();
  });

  it('does NOT touch sectionId on linked labels (controlId !== null)', () => {
    // Add a linked label manually
    useEditorStore.setState({
      editorLabels: [
        {
          id: 'linked-1',
          controlId: 'some-control-id',
          sectionId: 'sec-a',  // would be derived from control normally; here we set explicitly
          text: 'linked',
          x: 50,
          y: 30,
          fontSize: 8,
          align: 'center',
        },
      ],
    });
    useEditorStore.getState().moveLabel('linked-1', 300, 0);
    const after = useEditorStore.getState().editorLabels.find((l) => l.id === 'linked-1');
    // sectionId on linked labels is not derived from position — left untouched.
    expect(after?.sectionId).toBe('sec-a');
    expect(after?.x).toBe(350);
  });
});
