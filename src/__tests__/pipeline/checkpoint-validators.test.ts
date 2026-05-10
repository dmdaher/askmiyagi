import { describe, it, expect } from 'vitest';
import {
  validateSieveBucket,
  validateSieveVerified,
  validateSieveAnchored,
  validatePassInventory,
  validatePassRelationships,
  validatePassCurriculum,
  validatePassBatches,
  validateIndependentChecklist,
  validateLedGroupSplitting,
  validatePostEditorManifest,
} from '../../lib/pipeline/checkpoint-validators';

describe('checkpoint-validators', () => {
  describe('validateSieveBucket', () => {
    it('accepts valid bucket with pipe-delimited table', () => {
      const content = `# Sieve Bucket 0 (Pages 1-10)

| Page | Control Name | Type | Value Range |
|------|-------------|------|-------------|
| p.1 | VOLUME | knob | 0-127 |
| p.3 | CUTOFF | knob | 0-127 |
| p.5 | RESONANCE | knob | 0-127 |`;

      const result = validateSieveBucket(content, [1, 10]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects content without table structure', () => {
      const content = `This is just a paragraph about the manual.
It has no table structure at all.`;

      const result = validateSieveBucket(content, [1, 10]);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('No table structure');
    });

    it('rejects pages outside expected range', () => {
      const content = `| Page | Control | Type | Range |
|------|---------|------|-------|
| p.1 | VOLUME | knob | 0-127 |
| p.25 | CUTOFF | knob | 0-127 |
| p.3 | RESONANCE | knob | 0-127 |`;

      const result = validateSieveBucket(content, [1, 10]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('outside expected range'))).toBe(true);
    });

    it('rejects content with interpretation markers', () => {
      const content = `| Page | Control | Type | Range |
|------|---------|------|-------|
| p.1 | VOLUME | knob | 0-127 |
| p.2 | CUTOFF | knob | 0-127 |
| p.3 | RESONANCE | knob | 0-127 |

This would make a great tutorial for beginners.`;

      const result = validateSieveBucket(content, [1, 10]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('interpretation marker'))).toBe(true);
    });

    it('accepts CSV-style extraction', () => {
      const content = `Page,Control Name,Type,Value Range
1,VOLUME,knob,0-127
2,CUTOFF,knob,0-127
3,RESONANCE,knob,0-127
4,ATTACK,knob,0-127
5,DECAY,knob,0-127`;

      const result = validateSieveBucket(content, [1, 10]);
      expect(result.valid).toBe(true);
    });

    // Regression — DeepMind-12 (2026-05-10): description column referenced
    // "POLY menu, page 2" as a cross-reference. The old regex flagged "page 2"
    // anywhere in the content as out-of-range. Fixed by only checking the
    // page number in column 1 of pipe-delimited rows.
    it('accepts cross-references to other pages in description columns', () => {
      const content = `| Page | Control | Type | Description |
|------|---------|------|-------------|
| 15 | PITCH BEND range | setting | assignable (POLY menu, page 2) |
| 17 | CUTOFF | knob | full sweep (see envelope on page 4) |
| 19 | RESONANCE | knob | 0-127 |`;

      const result = validateSieveBucket(content, [11, 20]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts bare-digit format (no "p." prefix) in column 1', () => {
      const content = `| Page | Control | Type | Range |
|------|---------|------|-------|
| 11 | VOLUME | knob | 0-127 |
| 13 | CUTOFF | knob | 0-127 |
| 15 | RESONANCE | knob | 0-127 |`;

      const result = validateSieveBucket(content, [11, 20]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('still rejects an extracted row whose column-1 page is out of range', () => {
      const content = `| Page | Control | Type | Range |
|------|---------|------|-------|
| 11 | VOLUME | knob | 0-127 |
| 5  | WRONG | knob | 0-127 |
| 15 | RESONANCE | knob | 0-127 |`;

      const result = validateSieveBucket(content, [11, 20]);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('outside expected range'))).toBe(true);
    });
  });

  describe('validateSieveVerified', () => {
    it('accepts verified content with marker', () => {
      const content = `# VERIFIED — Bucket 0

No corrections needed.

| Page | Control | Type | Range |
|------|---------|------|-------|
| p.1 | VOLUME | knob | 0-127 |`;

      const result = validateSieveVerified(content);
      expect(result.valid).toBe(true);
    });

    it('rejects content without VERIFIED marker', () => {
      const content = `| Page | Control | Type | Range |
|------|---------|------|-------|
| p.1 | VOLUME | knob | 0-127 |`;

      const result = validateSieveVerified(content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('VERIFIED');
    });

    it('rejects content without table structure', () => {
      const content = `VERIFIED
All looks good.`;

      const result = validateSieveVerified(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('table structure'))).toBe(true);
    });
  });

  describe('validateSieveAnchored', () => {
    it('accepts anchored content with all three sections', () => {
      const content = `# Anchored — Bucket 0

## PANEL-ONLY
- SCENE button (documented elsewhere)

## MANUAL-ONLY
- REVERB SEND knob (not in panel constants)

## NAME MISMATCH
- Manual: "FREQ" → Panel: "FREQUENCY"`;

      const result = validateSieveAnchored(content);
      expect(result.valid).toBe(true);
    });

    it('rejects content missing all sections', () => {
      const content = `Everything matches perfectly.`;

      const result = validateSieveAnchored(content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Missing all cross-reference sections');
    });

    it('rejects content missing some sections', () => {
      const content = `## PANEL-ONLY
Nothing

## MANUAL-ONLY
Nothing`;

      const result = validateSieveAnchored(content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('NAME MISMATCH');
    });
  });

  describe('validatePassInventory', () => {
    it('accepts valid inventory', () => {
      const content = `# Feature Inventory

## Chapter 1: Basics
- VOLUME control (p.5)
- SCENE selection (p.8)

# Page Coverage Map
- Pages 1-10: covered
- Pages 11-20: covered`;

      const result = validatePassInventory(content);
      expect(result.valid).toBe(true);
    });

    it('rejects missing feature inventory', () => {
      const content = `# Page Coverage Map
All pages covered.`;

      const result = validatePassInventory(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Feature Inventory'))).toBe(true);
    });

    it('rejects missing page coverage', () => {
      const content = `# Feature Inventory
- VOLUME
- CUTOFF`;

      const result = validatePassInventory(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Page Coverage'))).toBe(true);
    });
  });

  describe('validatePassRelationships', () => {
    it('accepts content with prerequisite info', () => {
      const content = `# Feature Dependencies

## Prerequisites
- Tone editing requires selecting a zone first
- Effects routing requires understanding MFX

## Dependency Graph
[{ "feature": "tone-edit", "depends_on": ["zone-select"] }]`;

      const result = validatePassRelationships(content);
      expect(result.valid).toBe(true);
    });

    it('rejects content without prerequisites or dependencies', () => {
      const content = `# Features
Here are all the features listed.`;

      const result = validatePassRelationships(content);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePassCurriculum', () => {
    it('accepts valid curriculum with tutorials and DAG', () => {
      const content = `# Curriculum Design

## TUTORIAL: Getting Started
Features: VOLUME, SCENE selection
Pages: 5-12

## TUTORIAL: Sound Design Basics
Features: CUTOFF, RESONANCE, ATTACK
Pages: 20-35

## TUTORIAL: Effects
Features: MFX, routing
Pages: 40-50

## Dependency DAG
getting-started → sound-design → effects`;

      const result = validatePassCurriculum(content);
      expect(result.valid).toBe(true);
    });

    it('rejects content with fewer than 2 TUTORIAL blocks', () => {
      const content = `# Curriculum
## TUTORIAL: Only One
Features: everything`;

      const result = validatePassCurriculum(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('TUTORIAL block'))).toBe(true);
    });

    it('rejects content without DAG', () => {
      const content = `## TUTORIAL: One
Features: A

## TUTORIAL: Two
Features: B

## TUTORIAL: Three
Features: C`;

      const result = validatePassCurriculum(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('DAG'))).toBe(true);
    });
  });

  describe('validatePassBatches', () => {
    it('accepts valid batch plan', () => {
      const content = `# Batch Plan

## BATCH A
Tutorials: getting-started, scene-basics
Dependencies: none

## BATCH B
Tutorials: sound-design, effects
Dependency chain: requires BATCH A

## Execution Order
BATCH A → BATCH B`;

      const result = validatePassBatches(content);
      expect(result.valid).toBe(true);
    });

    it('rejects content with fewer than 2 BATCH blocks', () => {
      const content = `# BATCH A
All tutorials.`;

      const result = validatePassBatches(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('BATCH block'))).toBe(true);
    });

    it('rejects content without dependency chain', () => {
      const content = `## BATCH A
Tutorials: one, two

## BATCH B
Tutorials: three, four`;

      const result = validatePassBatches(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('dependency chain'))).toBe(true);
    });
  });

  describe('validateIndependentChecklist', () => {
    it('accepts valid independent checklist', () => {
      const content = `# Independent Coverage Checklist

## Chapter 1: Getting Started
- Power on procedure (p.24)
- Volume control (p.25)

## Chapter 2: Sound Selection
- Scene browsing (p.30)
- Tone selection (p.32)

## Section 3: Editing
- Parameter editing (p.50)`;

      const result = validateIndependentChecklist(content);
      expect(result.valid).toBe(true);
    });

    it('rejects checklist that references extractor output', () => {
      const content = `# Independent Checklist

## Chapter 1
Based on the manual-extractor's pass-1 inventory...

## Section 2
Checking features.`;

      const result = validateIndependentChecklist(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('extractor output'))).toBe(true);
    });

    it('rejects checklist referencing sieve bucket files', () => {
      const content = `# Checklist

## Chapter 1
Cross-referencing sieve/bucket-0 data...

## Section 2
More items.`;

      const result = validateIndependentChecklist(content);
      expect(result.valid).toBe(false);
    });

    it('rejects checklist without chapter/section structure', () => {
      const content = `All features look good. Everything is covered.`;

      const result = validateIndependentChecklist(content);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('chapter'))).toBe(true);
    });
  });

  // ── K4 Layer 2: LED-group splitting ─────────────────────────────────────
  describe('validateLedGroupSplitting', () => {
    /**
     * Build a blueprint with a single section containing the given controls.
     * Each control object can be a regular {id, centroid?} or a led-group with
     * {id, type:'led-group', count, waveforms?}.
     */
    function makeBlueprint(sectionId: string, controls: Record<string, unknown>[]): string {
      return JSON.stringify({ sections: [{ sectionId, controls }] });
    }

    function makeManifest(controls: Array<{ id: string; type: string; sectionId: string }>): string {
      return JSON.stringify({ controls });
    }

    it('passes when no led-group clusters exist', () => {
      const blueprint = makeBlueprint('lfo1', [
        { id: 'lfo1-rate', centroid: { x: 100, y: 100 } },
      ]);
      const manifest = makeManifest([
        { id: 'lfo1-rate', type: 'slider', sectionId: 'lfo1' },
      ]);
      const result = validateLedGroupSplitting(manifest, blueprint);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes when led-group has count of 1 (no split required)', () => {
      const blueprint = makeBlueprint('lfo1', [
        { id: 'lfo1-some-led', type: 'led-group', count: 1 },
      ]);
      const manifest = makeManifest([
        { id: 'lfo1-some-led', type: 'led', sectionId: 'lfo1' },
      ]);
      expect(validateLedGroupSplitting(manifest, blueprint).valid).toBe(true);
    });

    it('FAILS when led-group with count=7 is merged into 1 control', () => {
      const blueprint = makeBlueprint('lfo1', [
        { id: 'lfo1-waveform-leds', type: 'led-group', count: 7 },
      ]);
      const manifest = makeManifest([
        { id: 'lfo1-waveform-leds', type: 'led', sectionId: 'lfo1' },
      ]);
      const result = validateLedGroupSplitting(manifest, blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('section "lfo1"');
      expect(result.errors[0]).toContain('expected 7');
      expect(result.errors[0]).toContain('manifest has 1');
      expect(result.errors[0]).toContain('lfo1-waveform-leds');
    });

    it('passes when led-group with count=7 is properly split', () => {
      const blueprint = makeBlueprint('lfo1', [
        { id: 'lfo1-waveform-leds', type: 'led-group', count: 7 },
      ]);
      const splitNames = ['sine', 'triangle', 'square', 'ramp-up', 'ramp-down', 'sample-hold', 'sample-glide'];
      const manifest = makeManifest(
        splitNames.map((name) => ({ id: `lfo1-${name}`, type: 'led', sectionId: 'lfo1' }))
      );
      expect(validateLedGroupSplitting(manifest, blueprint).valid).toBe(true);
    });

    it('FAILS when section has TWO led-group clusters and only one is split', () => {
      const blueprint = makeBlueprint('performance', [
        { id: 'voices-leds', type: 'led-group', count: 12 },
        { id: 'octave-leds', type: 'led-group', count: 5 },
      ]);
      // Only voices was split; octave still merged → total LEDs in manifest = 12
      const manifest = makeManifest([
        ...Array.from({ length: 12 }, (_, i) => ({ id: `voice-${i + 1}`, type: 'led', sectionId: 'performance' })),
        { id: 'octave-leds', type: 'led', sectionId: 'performance' }, // not split
      ]);
      const result = validateLedGroupSplitting(manifest, blueprint);
      // Total expected: 12 + 5 = 17; actual LEDs in section: 12 + 1 = 13
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('expected 17');
      expect(result.errors[0]).toContain('manifest has 13');
      // Both cluster IDs should be named in the error
      expect(result.errors[0]).toContain('voices-leds');
      expect(result.errors[0]).toContain('octave-leds');
    });

    it('passes when both clusters in a section are properly split', () => {
      const blueprint = makeBlueprint('performance', [
        { id: 'voices-leds', type: 'led-group', count: 12 },
        { id: 'octave-leds', type: 'led-group', count: 5 },
      ]);
      const manifest = makeManifest([
        ...Array.from({ length: 12 }, (_, i) => ({ id: `voice-${i + 1}`, type: 'led', sectionId: 'performance' })),
        ...['minus-2', 'minus-1', 'zero', 'plus-1', 'plus-2'].map((label) => ({
          id: `octave-${label}`,
          type: 'led',
          sectionId: 'performance',
        })),
      ]);
      expect(validateLedGroupSplitting(manifest, blueprint).valid).toBe(true);
    });

    it('reports errors per under-split section, not per cluster', () => {
      const blueprint = JSON.stringify({
        sections: [
          { sectionId: 'lfo1', controls: [{ id: 'lfo1-waveform-leds', type: 'led-group', count: 7 }] },
          { sectionId: 'lfo2', controls: [{ id: 'lfo2-waveform-leds', type: 'led-group', count: 7 }] },
        ],
      });
      // Both merged
      const manifest = makeManifest([
        { id: 'lfo1-waveform-leds', type: 'led', sectionId: 'lfo1' },
        { id: 'lfo2-waveform-leds', type: 'led', sectionId: 'lfo2' },
      ]);
      const result = validateLedGroupSplitting(manifest, blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('lfo1');
      expect(result.errors[1]).toContain('lfo2');
    });

    it('handles malformed JSON gracefully', () => {
      const result = validateLedGroupSplitting('not json', '{}');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Manifest JSON parse failed');
    });

    it('handles malformed blueprint JSON gracefully', () => {
      const result = validateLedGroupSplitting('{}', 'not json');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Blueprint JSON parse failed');
    });

    it('passes on empty manifest + empty blueprint', () => {
      const result = validateLedGroupSplitting('{"controls":[]}', '{"sections":[]}');
      expect(result.valid).toBe(true);
    });

    it('counts only same-section LEDs (not LEDs in unrelated sections)', () => {
      const blueprint = makeBlueprint('lfo1', [
        { id: 'lfo1-waveform-leds', type: 'led-group', count: 7 },
      ]);
      // 7 LEDs total but in DIFFERENT sections — should still fail
      const manifest = makeManifest([
        { id: 'lfo1-sine', type: 'led', sectionId: 'wrong-section' },
        ...Array.from({ length: 6 }, (_, i) => ({ id: `other-led-${i}`, type: 'led', sectionId: 'somewhere-else' })),
      ]);
      const result = validateLedGroupSplitting(manifest, blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('expected 7');
      expect(result.errors[0]).toContain('manifest has 0'); // none in section "lfo1"
    });
  });

  // ---------------------------------------------------------------------------
  // validatePostEditorManifest — runs after contractor approval, before the rest
  // of the pipeline. Pure-logic check on manifest structural integrity (control
  // IDs, section refs, label/container/groupLabel cross-refs).
  // ---------------------------------------------------------------------------
  describe('validatePostEditorManifest', () => {
    /** Build a minimal valid manifest with the given controls + sections. */
    function makePostEditorManifest(overrides: Record<string, unknown> = {}): string {
      return JSON.stringify({
        controls: {
          'arp-rate': { id: 'arp-rate', label: 'Rate', sectionId: 'arpeggiator' },
          'arp-gate': { id: 'arp-gate', label: 'Gate', sectionId: 'arpeggiator' },
        },
        sections: {
          arpeggiator: { id: 'arpeggiator', childIds: ['arp-rate', 'arp-gate'] },
        },
        editorLabels: [],
        controlContainers: [],
        groupLabels: [],
        ...overrides,
      });
    }

    it('passes on a valid manifest with 0 errors and 0 warnings', () => {
      const result = validatePostEditorManifest(makePostEditorManifest());
      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
      expect(result.findings).toHaveLength(0);
    });

    it('returns INVALID_JSON on malformed input', () => {
      const result = validatePostEditorManifest('not json {{{');
      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.findings[0].code).toBe('INVALID_JSON');
    });

    it('emits NO_CONTROLS when controls is empty', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({ controls: {} }),
      );
      expect(result.valid).toBe(false);
      expect(result.findings.some((f) => f.code === 'NO_CONTROLS')).toBe(true);
    });

    it('emits NO_SECTIONS when sections is empty', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({ sections: {} }),
      );
      expect(result.valid).toBe(false);
      expect(result.findings.some((f) => f.code === 'NO_SECTIONS')).toBe(true);
    });

    it('emits CONTROL_MISSING_ID for a control without an id', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          controls: { 'arp-rate': { label: 'Rate' } }, // no id field
        }),
      );
      expect(result.valid).toBe(false);
      expect(result.findings.some((f) => f.code === 'CONTROL_MISSING_ID')).toBe(true);
    });

    it('emits CONTROL_ID_DUPLICATE when two controls share an id', () => {
      const result = validatePostEditorManifest(
        JSON.stringify({
          controls: [
            { id: 'arp-rate', label: 'Rate', sectionId: 'arpeggiator' },
            { id: 'arp-rate', label: 'Duplicate', sectionId: 'arpeggiator' },
          ],
          sections: { arpeggiator: { id: 'arpeggiator', childIds: ['arp-rate'] } },
        }),
      );
      expect(result.valid).toBe(false);
      const dup = result.findings.find((f) => f.code === 'CONTROL_ID_DUPLICATE');
      expect(dup).toBeDefined();
      expect(dup?.controlId).toBe('arp-rate');
    });

    it('emits SECTION_MISSING_ID for a section without an id', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          sections: { arpeggiator: { childIds: [] } }, // no id field
        }),
      );
      expect(result.valid).toBe(false);
      expect(result.findings.some((f) => f.code === 'SECTION_MISSING_ID')).toBe(true);
    });

    it('emits SECTION_ID_DUPLICATE when two sections share an id', () => {
      const result = validatePostEditorManifest(
        JSON.stringify({
          controls: [{ id: 'arp-rate', label: 'Rate', sectionId: 'arpeggiator' }],
          sections: [
            { id: 'arpeggiator', childIds: ['arp-rate'] },
            { id: 'arpeggiator', childIds: [] },
          ],
        }),
      );
      expect(result.valid).toBe(false);
      const dup = result.findings.find((f) => f.code === 'SECTION_ID_DUPLICATE');
      expect(dup).toBeDefined();
      expect(dup?.sectionId).toBe('arpeggiator');
    });

    it('emits SECTION_CHILD_ORPHAN when childIds references a non-existent control', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          sections: {
            arpeggiator: { id: 'arpeggiator', childIds: ['arp-rate', 'arp-gate', 'ghost-control'] },
          },
        }),
      );
      expect(result.valid).toBe(false);
      const orphan = result.findings.find((f) => f.code === 'SECTION_CHILD_ORPHAN');
      expect(orphan).toBeDefined();
      expect(orphan?.controlId).toBe('ghost-control');
      expect(orphan?.sectionId).toBe('arpeggiator');
    });

    it('emits CONTROL_ORPHAN_SECTION when a control points at a non-existent section', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          controls: {
            'arp-rate': { id: 'arp-rate', label: 'Rate', sectionId: 'ghost-section' },
            'arp-gate': { id: 'arp-gate', label: 'Gate', sectionId: 'arpeggiator' },
          },
          sections: {
            arpeggiator: { id: 'arpeggiator', childIds: ['arp-gate'] },
          },
        }),
      );
      expect(result.valid).toBe(false);
      const orphan = result.findings.find((f) => f.code === 'CONTROL_ORPHAN_SECTION');
      expect(orphan).toBeDefined();
      expect(orphan?.controlId).toBe('arp-rate');
      expect(orphan?.sectionId).toBe('ghost-section');
    });

    it('emits LABEL_ORPHAN_CONTROL when a linked label points to a non-existent control', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          editorLabels: [
            { id: 'lbl-1', controlId: 'ghost-control' },
          ],
        }),
      );
      expect(result.valid).toBe(false);
      expect(result.findings.some((f) => f.code === 'LABEL_ORPHAN_CONTROL')).toBe(true);
    });

    it('emits LABEL_ORPHAN_SECTION as a warning for standalone labels pointing to a missing section', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          editorLabels: [
            { id: 'lbl-1', controlId: null, sectionId: 'ghost-section' },
          ],
        }),
      );
      expect(result.valid).toBe(true); // warnings don't invalidate
      expect(result.warningCount).toBe(1);
      expect(result.findings.some((f) => f.code === 'LABEL_ORPHAN_SECTION')).toBe(true);
    });

    it('emits CONTAINER_ORPHAN when a container references a missing control', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          controlContainers: [
            { id: 'ctn-1', controlIds: ['arp-rate', 'ghost-control'] },
          ],
        }),
      );
      expect(result.valid).toBe(false);
      const orphan = result.findings.find((f) => f.code === 'CONTAINER_ORPHAN');
      expect(orphan).toBeDefined();
      expect(orphan?.controlId).toBe('ghost-control');
    });

    it('emits GROUPLABEL_ORPHAN when a group label references a missing control', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          groupLabels: [
            { id: 'gl-1', controlIds: ['ghost-control'] },
          ],
        }),
      );
      expect(result.valid).toBe(false);
      expect(result.findings.some((f) => f.code === 'GROUPLABEL_ORPHAN')).toBe(true);
    });

    it('emits CONTROL_EMPTY_LABEL warning (not error) for controls with no label', () => {
      const result = validatePostEditorManifest(
        makePostEditorManifest({
          controls: {
            'arp-rate': { id: 'arp-rate', label: '', sectionId: 'arpeggiator' },
            'arp-gate': { id: 'arp-gate', label: 'Gate', sectionId: 'arpeggiator' },
          },
        }),
      );
      expect(result.valid).toBe(true);
      expect(result.warningCount).toBe(1);
      const w = result.findings.find((f) => f.code === 'CONTROL_EMPTY_LABEL');
      expect(w?.severity).toBe('warning');
      expect(w?.controlId).toBe('arp-rate');
    });

    it('accepts kebab-case, snake_case, and SCREAMING_SNAKE ids without warnings', () => {
      const result = validatePostEditorManifest(
        JSON.stringify({
          controls: [
            { id: 'arp-rate', label: 'Kebab', sectionId: 'sec' },
            { id: 'arp_rate', label: 'Snake', sectionId: 'sec' },
            { id: 'BEAT_JUMP_BACK', label: 'Screaming', sectionId: 'sec' },
            { id: 'wheel-1', label: 'Mixed', sectionId: 'sec' },
          ],
          sections: [
            { id: 'sec', childIds: ['arp-rate', 'arp_rate', 'BEAT_JUMP_BACK', 'wheel-1'] },
          ],
        }),
      );
      expect(result.valid).toBe(true);
      expect(result.findings.filter((f) => f.code === 'CONTROL_ID_INVALID_FORMAT')).toHaveLength(0);
    });

    it('emits CONTROL_ID_INVALID_FORMAT warning for ids with spaces or special chars', () => {
      const result = validatePostEditorManifest(
        JSON.stringify({
          controls: [
            { id: 'has space', label: 'Bad', sectionId: 'sec' },
            { id: '1leading-digit', label: 'AlsoBad', sectionId: 'sec' },
            { id: 'good-id', label: 'Good', sectionId: 'sec' },
          ],
          sections: [
            { id: 'sec', childIds: ['has space', '1leading-digit', 'good-id'] },
          ],
        }),
      );
      expect(result.valid).toBe(true); // warnings only
      const badIds = result.findings
        .filter((f) => f.code === 'CONTROL_ID_INVALID_FORMAT')
        .map((f) => f.controlId);
      expect(badIds).toContain('has space');
      expect(badIds).toContain('1leading-digit');
      expect(badIds).not.toContain('good-id');
    });

    it('supports both Record and Array manifest shapes', () => {
      const recordShape = validatePostEditorManifest(
        JSON.stringify({
          controls: { 'a': { id: 'a', label: 'A', sectionId: 's' } },
          sections: { 's': { id: 's', childIds: ['a'] } },
        }),
      );
      const arrayShape = validatePostEditorManifest(
        JSON.stringify({
          controls: [{ id: 'a', label: 'A', sectionId: 's' }],
          sections: [{ id: 's', childIds: ['a'] }],
        }),
      );
      expect(recordShape.valid).toBe(true);
      expect(arrayShape.valid).toBe(true);
    });

    it('accumulates multiple errors in one pass', () => {
      const result = validatePostEditorManifest(
        JSON.stringify({
          controls: [
            { id: 'a', label: 'A', sectionId: 'missing-section' }, // E11
            { id: 'a', label: 'Duplicate', sectionId: 's' }, // E2
            { label: 'NoId', sectionId: 's' }, // E1
          ],
          sections: [
            { id: 's', childIds: ['a', 'ghost'] }, // E5 (ghost)
          ],
        }),
      );
      expect(result.valid).toBe(false);
      const codes = result.findings
        .filter((f) => f.severity === 'error')
        .map((f) => f.code);
      expect(codes).toContain('CONTROL_MISSING_ID');
      expect(codes).toContain('CONTROL_ID_DUPLICATE');
      expect(codes).toContain('CONTROL_ORPHAN_SECTION');
      expect(codes).toContain('SECTION_CHILD_ORPHAN');
      expect(result.errorCount).toBeGreaterThanOrEqual(4);
    });
  });
});
