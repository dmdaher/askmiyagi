import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../index';

/**
 * Tests for setControlSection — the canonical atomic API for changing a
 * control's section assignment. Must keep `controls[id].sectionId` and
 * `sections[sid].childIds` in sync in a single store mutation.
 *
 * See manifestSlice.ts: setControlSection (action) and the manifest-integrity
 * review (Tier 2) for context.
 */

function resetStore() {
  useEditorStore.setState({
    controls: {
      'arp-rate': { id: 'arp-rate', x: 10, y: 20, w: 40, h: 30, sectionId: 'arp', label: 'Rate', type: 'knob', labelPosition: 'below', locked: false },
      'arp-gate': { id: 'arp-gate', x: 60, y: 20, w: 40, h: 30, sectionId: 'arp', label: 'Gate', type: 'knob', labelPosition: 'below', locked: false },
      'lfo-rate': { id: 'lfo-rate', x: 200, y: 20, w: 40, h: 30, sectionId: 'lfo', label: 'Rate', type: 'knob', labelPosition: 'below', locked: false },
      'orphan':   { id: 'orphan',   x: 300, y: 20, w: 40, h: 30, sectionId: '',    label: 'Orphan', type: 'knob', labelPosition: 'below', locked: false },
    },
    sections: {
      arp: { id: 'arp', headerLabel: 'ARP', archetype: 'grid', x: 0, y: 0, w: 200, h: 100, childIds: ['arp-rate', 'arp-gate'] },
      lfo: { id: 'lfo', headerLabel: 'LFO', archetype: 'grid', x: 0, y: 200, w: 200, h: 100, childIds: ['lfo-rate'] },
    },
    selectedIds: [],
    lockedIds: [],
    controlGroups: [],
  } as any);
}

describe('setControlSection', () => {
  beforeEach(resetStore);

  it('moves a control between two sections atomically', () => {
    useEditorStore.getState().setControlSection('arp-rate', 'lfo');
    const { controls, sections } = useEditorStore.getState();

    // Control's sectionId points to new section
    expect(controls['arp-rate'].sectionId).toBe('lfo');

    // Old section's childIds no longer contains the control
    expect(sections.arp.childIds).not.toContain('arp-rate');
    expect(sections.arp.childIds).toEqual(['arp-gate']);

    // New section's childIds now contains the control
    expect(sections.lfo.childIds).toContain('arp-rate');
    expect(sections.lfo.childIds).toEqual(['lfo-rate', 'arp-rate']);
  });

  it('detaches a control when newSectionId is null', () => {
    useEditorStore.getState().setControlSection('arp-rate', null);
    const { controls, sections } = useEditorStore.getState();

    expect(controls['arp-rate'].sectionId).toBe('');
    expect(sections.arp.childIds).not.toContain('arp-rate');
  });

  it('detaches a control when newSectionId is empty string', () => {
    useEditorStore.getState().setControlSection('arp-rate', '');
    const { controls, sections } = useEditorStore.getState();

    expect(controls['arp-rate'].sectionId).toBe('');
    expect(sections.arp.childIds).not.toContain('arp-rate');
  });

  it('attaches an orphan control to a section', () => {
    useEditorStore.getState().setControlSection('orphan', 'arp');
    const { controls, sections } = useEditorStore.getState();

    expect(controls.orphan.sectionId).toBe('arp');
    expect(sections.arp.childIds).toContain('orphan');
  });

  it('refuses to write a dangling reference to a non-existent section', () => {
    useEditorStore.getState().setControlSection('arp-rate', 'ghost-section');
    const { controls, sections } = useEditorStore.getState();

    // State unchanged — no dangling refs created
    expect(controls['arp-rate'].sectionId).toBe('arp');
    expect(sections.arp.childIds).toContain('arp-rate');
    expect((sections as any)['ghost-section']).toBeUndefined();
  });

  it('no-ops on non-existent control', () => {
    const before = JSON.stringify(useEditorStore.getState());
    useEditorStore.getState().setControlSection('ghost-control', 'arp');
    const after = JSON.stringify(useEditorStore.getState());
    expect(after).toBe(before);
  });

  it('is idempotent — calling with the current sectionId is a no-op', () => {
    const before = JSON.stringify(useEditorStore.getState());
    useEditorStore.getState().setControlSection('arp-rate', 'arp');
    const after = JSON.stringify(useEditorStore.getState());
    expect(after).toBe(before);
  });

  it('does not produce duplicate entries in childIds when reassigning twice', () => {
    useEditorStore.getState().setControlSection('arp-rate', 'lfo');
    useEditorStore.getState().setControlSection('arp-rate', 'lfo'); // second call
    const { sections } = useEditorStore.getState();

    const occurrences = sections.lfo.childIds.filter(id => id === 'arp-rate').length;
    expect(occurrences).toBe(1);
  });

  it('round-trip leaves manifest internally consistent', () => {
    // arp → lfo → arp
    useEditorStore.getState().setControlSection('arp-rate', 'lfo');
    useEditorStore.getState().setControlSection('arp-rate', 'arp');
    const { controls, sections } = useEditorStore.getState();

    expect(controls['arp-rate'].sectionId).toBe('arp');
    expect(sections.arp.childIds).toContain('arp-rate');
    expect(sections.lfo.childIds).not.toContain('arp-rate');
    // sections.arp.childIds order should preserve other children
    expect(sections.arp.childIds).toEqual(expect.arrayContaining(['arp-gate', 'arp-rate']));
  });
});
