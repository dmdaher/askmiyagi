import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';
import { selectedControlIds } from '../selection-types';

/**
 * EP7: store actions backing the "Select Controls ▾" dropdown.
 *   - selectAllControls() — replace selection with every control
 *   - selectControlsByType(types, append?) — select by type filter
 *
 * Both go through the unified `selection` array (the post-Phase-6c
 * canonical selection state).
 */

function resetStore() {
  useEditorStore.setState({
    controls: {
      btn1: { id: 'btn1', x: 0, y: 0, w: 10, h: 10, sectionId: 's', label: 'B1', type: 'button', labelPosition: 'above', locked: false },
      btn2: { id: 'btn2', x: 20, y: 0, w: 10, h: 10, sectionId: 's', label: 'B2', type: 'button', labelPosition: 'above', locked: false },
      knob1: { id: 'knob1', x: 0, y: 20, w: 10, h: 10, sectionId: 's', label: 'K1', type: 'knob', labelPosition: 'above', locked: false },
      pad1: { id: 'pad1', x: 0, y: 40, w: 10, h: 10, sectionId: 's', label: 'P1', type: 'pad', labelPosition: 'above', locked: false },
      pad2: { id: 'pad2', x: 20, y: 40, w: 10, h: 10, sectionId: 's', label: 'P2', type: 'pad', labelPosition: 'above', locked: false },
      slider1: { id: 'slider1', x: 0, y: 60, w: 10, h: 30, sectionId: 's', label: 'S1', type: 'slider', labelPosition: 'above', locked: false },
      fader1: { id: 'fader1', x: 20, y: 60, w: 10, h: 30, sectionId: 's', label: 'F1', type: 'fader', labelPosition: 'above', locked: false },
    },
    sections: {
      s: { id: 's', headerLabel: 'S', archetype: 'grid', x: 0, y: 0, w: 100, h: 100, childIds: [] },
    },
    selection: [],
  });
}

describe('selectAllControls', () => {
  beforeEach(resetStore);

  it('selects every control', () => {
    const store = useEditorStore.getState();
    store.selectAllControls();
    const selected = selectedControlIds(useEditorStore.getState().selection);
    expect(selected.sort()).toEqual(['btn1', 'btn2', 'fader1', 'knob1', 'pad1', 'pad2', 'slider1'].sort());
  });

  it('replaces any existing selection', () => {
    useEditorStore.getState().setSelectedIds(['btn1']);
    expect(selectedControlIds(useEditorStore.getState().selection)).toEqual(['btn1']);
    useEditorStore.getState().selectAllControls();
    expect(selectedControlIds(useEditorStore.getState().selection).length).toBe(7);
  });

  it('handles empty controls map without error', () => {
    useEditorStore.setState({ controls: {} });
    useEditorStore.getState().selectAllControls();
    expect(selectedControlIds(useEditorStore.getState().selection)).toEqual([]);
  });
});

describe('selectControlsByType', () => {
  beforeEach(resetStore);

  it('selects all controls of a single type', () => {
    useEditorStore.getState().selectControlsByType(['button']);
    const selected = selectedControlIds(useEditorStore.getState().selection);
    expect(selected.sort()).toEqual(['btn1', 'btn2']);
  });

  it('selects across multiple types (sliders + faders share a group)', () => {
    useEditorStore.getState().selectControlsByType(['slider', 'fader']);
    const selected = selectedControlIds(useEditorStore.getState().selection);
    expect(selected.sort()).toEqual(['fader1', 'slider1']);
  });

  it('returns empty when no controls match', () => {
    useEditorStore.getState().selectControlsByType(['wheel']);
    expect(selectedControlIds(useEditorStore.getState().selection)).toEqual([]);
  });

  it('replaces existing selection by default', () => {
    useEditorStore.getState().setSelectedIds(['btn1', 'knob1']);
    useEditorStore.getState().selectControlsByType(['pad']);
    expect(selectedControlIds(useEditorStore.getState().selection).sort()).toEqual(['pad1', 'pad2']);
  });

  it('appends to existing selection when append=true (Shift+click)', () => {
    useEditorStore.getState().selectControlsByType(['button']);
    expect(selectedControlIds(useEditorStore.getState().selection).sort()).toEqual(['btn1', 'btn2']);
    useEditorStore.getState().selectControlsByType(['pad'], true);
    expect(selectedControlIds(useEditorStore.getState().selection).sort()).toEqual(['btn1', 'btn2', 'pad1', 'pad2']);
  });

  it('append=true dedupes overlapping selections (no duplicates)', () => {
    useEditorStore.getState().setSelectedIds(['btn1', 'pad1']);
    useEditorStore.getState().selectControlsByType(['button'], true);
    const selected = selectedControlIds(useEditorStore.getState().selection).sort();
    expect(selected).toEqual(['btn1', 'btn2', 'pad1']);
  });
});
