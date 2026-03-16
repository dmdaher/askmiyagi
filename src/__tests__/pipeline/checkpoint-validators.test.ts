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
});
