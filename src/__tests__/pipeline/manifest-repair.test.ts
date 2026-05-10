import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { repairManifest, MAX_AUTO_REPAIRS } from '../../lib/pipeline/manifest-repair';

/**
 * Unit tests for manifest auto-repair (Tier 4).
 *
 * Key invariants tested:
 *  - Idempotency: repair(repair(M)) === repair(M)
 *  - Conservative scope: never invent or delete controls/sections
 *  - Diff cap: > MAX_AUTO_REPAIRS findings bails entirely
 *  - Production manifests are untouched (already valid)
 *  - Each REPAIRABLE_CODES is actually repaired
 *  - Each ESCALATE_CODES is fed to unrepairableFindings, no auto-fix attempted
 */

function makeValid(): string {
  return JSON.stringify({
    controls: {
      'arp-rate': { id: 'arp-rate', label: 'Rate', sectionId: 'arp' },
      'arp-gate': { id: 'arp-gate', label: 'Gate', sectionId: 'arp' },
    },
    sections: {
      arp: { id: 'arp', childIds: ['arp-rate', 'arp-gate'] },
    },
    editorLabels: [
      { id: 'lbl-rate', controlId: 'arp-rate', text: 'RATE' },
    ],
    controlContainers: [
      { id: 'ctn-1', controlIds: ['arp-rate', 'arp-gate'] },
    ],
    groupLabels: [
      { id: 'gl-1', controlIds: ['arp-rate', 'arp-gate'] },
    ],
  });
}

describe('repairManifest', () => {
  describe('valid manifest', () => {
    it('returns valid manifests byte-equivalent (no changes)', () => {
      const json = makeValid();
      const result = repairManifest(json);
      expect(result.valid).toBe(true);
      expect(result.changes).toHaveLength(0);
      expect(result.unrepairableFindings).toHaveLength(0);
      expect(result.bailed).toBe(false);
    });
  });

  describe('idempotency (critical)', () => {
    it('repair(repair(M)) === repair(M) for valid manifest', () => {
      const json = makeValid();
      const r1 = repairManifest(json);
      const r2 = repairManifest(JSON.stringify(r1.repaired));
      expect(r2.repaired).toEqual(r1.repaired);
      expect(r2.changes).toHaveLength(0);
    });

    it('repair(repair(M)) === repair(M) for manifest with orphan label', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        editorLabels: [{ id: 'lbl-ghost', controlId: 'ghost-id', text: 'X' }],
      });
      const r1 = repairManifest(json);
      const r2 = repairManifest(JSON.stringify(r1.repaired));
      expect(r2.repaired).toEqual(r1.repaired);
      expect(r2.changes).toHaveLength(0);
    });

    it('repair(repair(M)) === repair(M) for manifest with multiple orphan types', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a', 'ghost-1'] } },
        editorLabels: [
          { id: 'lbl-1', controlId: 'a', text: 'A' },
          { id: 'lbl-2', controlId: 'ghost-2', text: 'Ghost' },
        ],
        controlContainers: [{ id: 'ctn-1', controlIds: ['a', 'ghost-3'] }],
        groupLabels: [{ id: 'gl-1', controlIds: ['a', 'ghost-4'] }],
      });
      const r1 = repairManifest(json);
      expect(r1.changes.length).toBeGreaterThan(0);
      const r2 = repairManifest(JSON.stringify(r1.repaired));
      expect(r2.repaired).toEqual(r1.repaired);
      expect(r2.changes).toHaveLength(0);
    });
  });

  describe('repair: controlContainers orphan strip', () => {
    it('strips orphan controlIds from a container', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        controlContainers: [{ id: 'ctn-1', controlIds: ['a', 'ghost'] }],
      });
      const result = repairManifest(json);
      const containers = (result.repaired as any).controlContainers;
      expect(containers[0].controlIds).toEqual(['a']);
      expect(result.changes).toContainEqual({ kind: 'container-strip', containerId: 'ctn-1', controlId: 'ghost' });
    });

    it('dissolves an empty container', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        controlContainers: [{ id: 'ctn-empty', controlIds: ['ghost-1', 'ghost-2'] }],
      });
      const result = repairManifest(json);
      const containers = (result.repaired as any).controlContainers;
      expect(containers.find((c: any) => c.id === 'ctn-empty')).toBeUndefined();
      expect(result.changes).toContainEqual({ kind: 'container-dissolve', containerId: 'ctn-empty' });
    });
  });

  describe('repair: groupLabels orphan strip', () => {
    it('strips orphan controlIds from a group label', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        groupLabels: [{ id: 'gl-1', controlIds: ['a', 'ghost'] }],
      });
      const result = repairManifest(json);
      const groups = (result.repaired as any).groupLabels;
      expect(groups[0].controlIds).toEqual(['a']);
      expect(result.changes).toContainEqual({ kind: 'grouplabel-strip', groupLabelId: 'gl-1', controlId: 'ghost' });
    });

    it('dissolves an empty group label', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        groupLabels: [{ id: 'gl-empty', controlIds: ['ghost'] }],
      });
      const result = repairManifest(json);
      const groups = (result.repaired as any).groupLabels;
      expect(groups.find((g: any) => g.id === 'gl-empty')).toBeUndefined();
      expect(result.changes).toContainEqual({ kind: 'grouplabel-dissolve', groupLabelId: 'gl-empty' });
    });
  });

  describe('repair: editorLabels orphan controlId nulled', () => {
    it('nulls the controlId on an orphan linked label (becomes standalone)', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        editorLabels: [
          { id: 'lbl-good', controlId: 'a', text: 'A' },
          { id: 'lbl-bad', controlId: 'ghost', text: 'Ghost' },
        ],
      });
      const result = repairManifest(json);
      const labels = (result.repaired as any).editorLabels;
      const lblBad = labels.find((l: any) => l.id === 'lbl-bad');
      expect(lblBad.controlId).toBeNull();
      expect(lblBad.text).toBe('Ghost'); // text preserved — only controlId nulled
      expect(result.changes).toContainEqual({ kind: 'label-orphan-null', labelId: 'lbl-bad', previousControlId: 'ghost' });
    });
  });

  describe('repair: section.childIds orphan strip', () => {
    it('strips orphan childIds from a section (Record shape)', () => {
      const json = JSON.stringify({
        controls: { 'a': { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a', 'ghost'] } },
      });
      const result = repairManifest(json);
      const s = (result.repaired as any).sections.s;
      expect(s.childIds).toEqual(['a']);
      expect(result.changes).toContainEqual({ kind: 'section-childids-strip', sectionId: 's', controlId: 'ghost' });
    });

    it('strips orphan childIds from a section (Array shape)', () => {
      const json = JSON.stringify({
        controls: [{ id: 'a', sectionId: 's' }],
        sections: [{ id: 's', childIds: ['a', 'ghost'] }],
      });
      const result = repairManifest(json);
      const sections = (result.repaired as any).sections;
      expect(sections[0].childIds).toEqual(['a']);
      expect(result.changes).toContainEqual({ kind: 'section-childids-strip', sectionId: 's', controlId: 'ghost' });
    });
  });

  describe('escalation: not auto-repaired', () => {
    it('NO_CONTROLS escalates, no changes', () => {
      const json = JSON.stringify({ controls: {}, sections: { s: { id: 's', childIds: [] } } });
      const result = repairManifest(json);
      expect(result.changes).toHaveLength(0);
      expect(result.unrepairableFindings.some(f => f.code === 'NO_CONTROLS')).toBe(true);
      expect(result.valid).toBe(false);
    });

    it('NO_SECTIONS escalates, no changes', () => {
      const json = JSON.stringify({ controls: { a: { id: 'a', sectionId: '' } }, sections: {} });
      const result = repairManifest(json);
      expect(result.changes).toHaveLength(0);
      expect(result.unrepairableFindings.some(f => f.code === 'NO_SECTIONS')).toBe(true);
    });

    it('duplicate control IDs escalate, no repair attempted', () => {
      const json = JSON.stringify({
        controls: [
          { id: 'a', sectionId: 's' },
          { id: 'a', sectionId: 's' },
        ],
        sections: { s: { id: 's', childIds: ['a'] } },
      });
      const result = repairManifest(json);
      expect(result.unrepairableFindings.some(f => f.code === 'CONTROL_ID_DUPLICATE')).toBe(true);
    });

    it('CONTROL_ORPHAN_SECTION (control points at missing section) escalates — NOT auto-repaired', () => {
      const json = JSON.stringify({
        controls: { a: { id: 'a', sectionId: 'ghost-section' } },
        sections: { s: { id: 's', childIds: [] } },
      });
      const result = repairManifest(json);
      expect(result.unrepairableFindings.some(f => f.code === 'CONTROL_ORPHAN_SECTION')).toBe(true);
      // Critically: the control's sectionId is NOT silently changed
      expect((result.repaired as any).controls.a.sectionId).toBe('ghost-section');
    });

    it('INVALID_JSON returns bailed=true with no mutation', () => {
      const result = repairManifest('not json {{{');
      expect(result.bailed).toBe(true);
      expect(result.changes).toHaveLength(0);
      expect(result.unrepairableFindings.some(f => f.code === 'INVALID_JSON')).toBe(true);
    });
  });

  describe('diff cap (mass-corruption protection)', () => {
    it('bails when repairable findings exceed MAX_AUTO_REPAIRS', () => {
      // Generate MAX_AUTO_REPAIRS + 1 orphan label refs
      const labels = Array.from({ length: MAX_AUTO_REPAIRS + 1 }, (_, i) => ({
        id: `lbl-${i}`,
        controlId: `ghost-${i}`,
        text: `X${i}`,
      }));
      const json = JSON.stringify({
        controls: { a: { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        editorLabels: labels,
      });
      const result = repairManifest(json);
      expect(result.bailed).toBe(true);
      expect(result.changes).toHaveLength(0);
      // All orphans surface as unrepairable so admin sees them
      expect(result.unrepairableFindings.length).toBeGreaterThan(MAX_AUTO_REPAIRS);
    });

    it('does NOT bail at exactly MAX_AUTO_REPAIRS', () => {
      const labels = Array.from({ length: MAX_AUTO_REPAIRS }, (_, i) => ({
        id: `lbl-${i}`,
        controlId: `ghost-${i}`,
        text: `X${i}`,
      }));
      const json = JSON.stringify({
        controls: { a: { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', childIds: ['a'] } },
        editorLabels: labels,
      });
      const result = repairManifest(json);
      expect(result.bailed).toBe(false);
      expect(result.changes.length).toBe(MAX_AUTO_REPAIRS);
    });
  });

  describe('conservative scope (never invent or delete controls/sections)', () => {
    it('never modifies control records', () => {
      const json = JSON.stringify({
        controls: { a: { id: 'a', sectionId: 's', x: 10, y: 20, label: 'A' } },
        sections: { s: { id: 's', childIds: ['a', 'ghost'] } },
      });
      const result = repairManifest(json);
      expect((result.repaired as any).controls.a).toEqual({ id: 'a', sectionId: 's', x: 10, y: 20, label: 'A' });
    });

    it('never modifies section x/y/w/h or headerLabel', () => {
      const json = JSON.stringify({
        controls: { a: { id: 'a', sectionId: 's' } },
        sections: { s: { id: 's', headerLabel: 'My Section', x: 5, y: 5, w: 100, h: 50, childIds: ['a', 'ghost'] } },
      });
      const result = repairManifest(json);
      const s = (result.repaired as any).sections.s;
      expect(s.headerLabel).toBe('My Section');
      expect(s.x).toBe(5);
      expect(s.y).toBe(5);
      expect(s.w).toBe(100);
      expect(s.h).toBe(50);
    });
  });

  describe('smoke against real pipeline manifests', () => {
    const pipelineDir = join(process.cwd(), '.pipeline');
    const candidates = [
      'fantom-06',
      'cdj-3000',
      'dj-xdj-rx3',
      'rc-505-mk2',
      'minimoog-model-d',
      'alphatheta-cdj3000x',
      'dj-djs-1000',
    ];

    for (const id of candidates) {
      const path = join(pipelineDir, id, 'manifest-editor.json');
      if (!existsSync(path)) continue;

      it(`is idempotent on real ${id} manifest`, () => {
        const json = readFileSync(path, 'utf-8');
        const r1 = repairManifest(json);
        const r2 = repairManifest(JSON.stringify(r1.repaired));
        expect(r2.repaired).toEqual(r1.repaired);
        expect(r2.changes).toHaveLength(0);
      });
    }

    it('catches DeepMind-12 orphan labels and emits repair changes', () => {
      const path = join(pipelineDir, 'deepmind-12', 'manifest-editor.json');
      if (!existsSync(path)) return;
      const result = repairManifest(readFileSync(path, 'utf-8'));
      // We expect the known 3 orphan labels to be nulled
      const nulledLabels = result.changes.filter(c => c.kind === 'label-orphan-null');
      expect(nulledLabels.length).toBeGreaterThanOrEqual(3);
      // None of the unrepairable codes should fire for DeepMind
      const unrepairableCodes = result.unrepairableFindings.map(f => f.code);
      expect(unrepairableCodes).not.toContain('CONTROL_ID_DUPLICATE');
      expect(unrepairableCodes).not.toContain('NO_CONTROLS');
    });
  });
});
