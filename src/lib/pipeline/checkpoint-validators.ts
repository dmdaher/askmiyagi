/**
 * Checkpoint Validators — Mechanical post-inspection for agent output.
 *
 * These are the "Hard Compiler" for agent behavior. Instead of hoping
 * agents follow their SOULs' self-check instructions, the pipeline runner
 * calls these validators after every agent invocation.
 *
 * Returns { valid, errors, score } — errors are specific enough to send
 * back to the agent as a "Compiler Error" for retry.
 */

import type {
  MasterManifest,
  ManifestControl,
  ControlType,
} from '@/types/manifest';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidationReport {
  score: number;
  passed: boolean;
  autoFixes: Array<{ controlId: string; field: string; from: unknown; to: unknown; rule: string }>;
  flags: Array<{ controlId: string; field: string; message: string }>;
  missing: Array<{ controlId: string; field: string; severity: 'critical' | 'major' | 'minor' }>;
  totalControls: number;
  fullyEnriched: number;
  partiallyEnriched: number;
  unenriched: number;
}

/**
 * Validate a sieve bucket file: must have table structure, pages within range, no interpretation.
 */
export function validateSieveBucket(content: string, pageRange: [number, number]): ValidationResult {
  const errors: string[] = [];

  // Must have table-like structure (pipe-delimited rows or CSV-like rows)
  const hasTable = content.includes('|') && content.split('\n').filter((l) => l.includes('|')).length >= 3;
  const hasCsv = content.split('\n').filter((l) => l.includes(',')).length >= 5;
  if (!hasTable && !hasCsv) {
    errors.push('No table structure found (expected pipe-delimited or CSV rows)');
  }

  // Check that referenced pages are within the expected range
  const pageRefs = content.match(/\bp(?:age)?[.\s]*(\d+)/gi) ?? [];
  for (const ref of pageRefs) {
    const pageNum = parseInt(ref.replace(/\D/g, ''), 10);
    if (!isNaN(pageNum) && (pageNum < pageRange[0] || pageNum > pageRange[1])) {
      errors.push(`Page reference ${pageNum} outside expected range ${pageRange[0]}-${pageRange[1]}`);
      break; // One violation is enough
    }
  }

  // Must NOT contain interpretation markers (these belong in Assembly, not Sieve)
  const interpretationMarkers = [
    /\btutorial\b/i,
    /\bcurriculum\b/i,
    /\bbatch\b/i,
    /\bprerequisite\b/i,
    /\blearning\s+objective\b/i,
  ];
  for (const marker of interpretationMarkers) {
    if (marker.test(content)) {
      errors.push(`Contains interpretation marker "${marker.source}" — Sieve buckets must be raw extraction only`);
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a verified bucket file: must have VERIFIED marker.
 */
export function validateSieveVerified(content: string): ValidationResult {
  const errors: string[] = [];

  if (!/VERIFIED/i.test(content)) {
    errors.push('Missing VERIFIED marker');
  }

  // Should still have table structure from the original bucket
  const hasTable = content.includes('|') && content.split('\n').filter((l) => l.includes('|')).length >= 3;
  const hasCsv = content.split('\n').filter((l) => l.includes(',')).length >= 5;
  if (!hasTable && !hasCsv) {
    errors.push('No table structure found — verified file should retain original extraction');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an anchored bucket file: must have cross-reference sections.
 */
export function validateSieveAnchored(content: string): ValidationResult {
  const errors: string[] = [];

  const requiredSections = ['PANEL-ONLY', 'MANUAL-ONLY', 'NAME MISMATCH'];
  const foundSections = requiredSections.filter((s) =>
    content.toUpperCase().includes(s)
  );

  if (foundSections.length === 0) {
    errors.push(`Missing all cross-reference sections: ${requiredSections.join(', ')}`);
  } else if (foundSections.length < requiredSections.length) {
    const missing = requiredSections.filter((s) => !content.toUpperCase().includes(s));
    errors.push(`Missing cross-reference sections: ${missing.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Pass 1 — Feature Inventory: must have inventory and page coverage.
 */
export function validatePassInventory(content: string): ValidationResult {
  const errors: string[] = [];

  if (!/feature\s+inventory/i.test(content)) {
    errors.push('Missing "Feature Inventory" section');
  }

  if (!/page\s+coverage/i.test(content)) {
    errors.push('Missing "Page Coverage Map" section');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Pass 2 — Relationships: must have prerequisite/dependency sections.
 */
export function validatePassRelationships(content: string): ValidationResult {
  const errors: string[] = [];

  const hasPrerequisites = /prerequisite/i.test(content);
  const hasDependencies = /dependenc/i.test(content);

  if (!hasPrerequisites && !hasDependencies) {
    errors.push('Missing prerequisite or dependency sections');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Pass 3 — Curriculum: must have TUTORIAL blocks and DAG.
 */
export function validatePassCurriculum(content: string): ValidationResult {
  const errors: string[] = [];

  const tutorialBlockCount = (content.match(/TUTORIAL/gi) ?? []).length;
  if (tutorialBlockCount < 2) {
    errors.push(`Found ${tutorialBlockCount} TUTORIAL block(s), expected at least 2`);
  }

  if (!/DAG|dependency\s+graph|dependency\s+tree/i.test(content)) {
    errors.push('Missing DAG or dependency graph');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate Pass 4 — Batches: must have BATCH blocks and dependency chain.
 */
export function validatePassBatches(content: string): ValidationResult {
  const errors: string[] = [];

  const batchBlockCount = (content.match(/BATCH/gi) ?? []).length;
  if (batchBlockCount < 2) {
    errors.push(`Found ${batchBlockCount} BATCH block(s), expected at least 2`);
  }

  if (!/dependenc.*chain|batch.*order|execution.*order/i.test(content)) {
    errors.push('Missing dependency chain or batch ordering');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate the auditor's independent checklist: must have per-chapter summary,
 * must NOT reference extractor output files.
 */
export function validateIndependentChecklist(content: string): ValidationResult {
  const errors: string[] = [];

  // Must have chapter-level structure
  if (!/chapter|section\s+\d/i.test(content)) {
    errors.push('Missing chapter or section-level summary');
  }

  // Must NOT reference extractor output (independence check)
  const extractorRefs = [
    /sieve\/bucket/i,
    /pass-\d-/i,
    /manual-extractor/i,
    /extractor.*output/i,
    /extractor.*checkpoint/i,
  ];
  for (const ref of extractorRefs) {
    if (ref.test(content)) {
      errors.push(`References extractor output ("${ref.source}") — independent checklist must be derived solely from the manual`);
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Phase 0: Panel Pipeline Validators ─────────────────────────────────────

/**
 * Pre-inspection: verify inputs exist before spawning an agent.
 */
export function preInspectDiagramParser(opts: {
  manualPaths: string[];
  photoPaths: string[];
}): ValidationResult {
  const errors: string[] = [];

  if (opts.manualPaths.length === 0) {
    errors.push('No manual PDFs available — parser needs front-panel diagrams');
  }

  if (opts.photoPaths.length === 0) {
    errors.push('No hardware photos found — parser requires photos as PRIMARY input for centroid extraction');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Post-inspection: validate Diagram Parser output.
 * Checks for structured spatial-blueprint JSON in the checkpoint OR a separate JSON file.
 * The parser may write structured data to spatial-blueprint.json instead of embedding in the checkpoint.
 */
export function validateDiagramParserOutput(content: string, blueprintJson?: string): ValidationResult & { score: number } {
  // If a separate blueprint JSON file exists, validate that instead of/alongside the checkpoint
  const checkContent = blueprintJson ? `${content}\n\`\`\`json\n${blueprintJson}\n\`\`\`` : content;
  const errors: string[] = [];
  let score = 10.0;

  // 1. Must contain spatial-blueprint JSON (not just prose/tables)
  const hasJsonBlocks = (checkContent.match(/```json/g) ?? []).length;
  const hasCentroids = checkContent.includes('"centroid"') || checkContent.includes('"cx"');
  const hasTopology = checkContent.includes('"topology"');
  const hasBoundingBox = checkContent.includes('"boundingBox"') || checkContent.includes('"panelBoundingBox"') || checkContent.includes('"bbox"') || (checkContent.includes('"w"') && checkContent.includes('"h"'));

  if (hasJsonBlocks === 0) {
    errors.push('No JSON code blocks found — output is prose-only. Parser must output spatial-blueprint JSON per section.');
    score -= 3.0;
  }

  if (!hasCentroids) {
    errors.push('No centroid coordinates found. Every control must have { "x": N.NN, "y": N.NN }.');
    score -= 2.0;
  }

  if (!hasTopology) {
    errors.push('No topology classifications found. Every section must have a "topology" field.');
    score -= 1.0;
  }

  if (!hasBoundingBox) {
    errors.push('No bounding boxes found. Every control and section must have a "boundingBox".');
    score -= 1.0;
  }

  // 2. Check for containerZones in multi-zone topologies
  const multiZoneTopologies = ['cluster-above-anchor', 'cluster-below-anchor', 'anchor-layout', 'slider-anchored'];
  const hasMultiZone = multiZoneTopologies.some(t => checkContent.includes(t));
  const hasContainerZones = checkContent.includes('"containerZones"');

  if (hasMultiZone && !hasContainerZones) {
    errors.push('Multi-zone topology detected but no containerZones field. Parser must assign control indices to zones.');
    score -= 2.0;
  }

  // 3. Check for neighbor relationships
  const hasNeighbors = checkContent.includes('"neighbors"') || checkContent.includes('"north"') || checkContent.includes('"N"');
  if (!hasNeighbors) {
    errors.push('No neighbor relationships found. Every control must have cardinal neighbor references.');
    score -= 1.0;
  }

  // 4. Check for aspect ratios
  const hasAspectRatio = checkContent.includes('"aspectRatio"');
  if (!hasAspectRatio) {
    errors.push('No aspect ratios found. Anchor elements and non-square controls must have W:H ratios.');
    score -= 1.0;
  }

  // 5. Verify centroid precision (2 decimal places)
  // Accept both "x": and "cx": naming conventions
  const centroidMatches = checkContent.match(/"(?:x|cx)":\s*([\d.]+)/g) ?? [];
  const lowPrecision = centroidMatches.filter(m => {
    const val = m.match(/([\d.]+)/)?.[1] ?? '';
    const decimals = val.includes('.') ? val.split('.')[1].length : 0;
    return decimals < 2;
  });
  if (centroidMatches.length > 0 && lowPrecision.length > centroidMatches.length * 0.3) {
    errors.push(`${lowPrecision.length}/${centroidMatches.length} centroids have less than 2 decimal precision.`);
    score -= 0.5;
  }

  score = Math.max(0, score);
  return { valid: errors.length === 0, errors, score };
}

/**
 * Post-inspection: validate Gatekeeper manifest JSON.
 * Checks the actual manifest file, not the checkpoint prose.
 */
export function validateGatekeeperManifest(manifestJson: string): ValidationResult & { score: number } {
  const errors: string[] = [];
  let score = 10.0;

  // 1. Parse JSON
  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(manifestJson);
  } catch (e) {
    return { valid: false, errors: [`Manifest JSON is not parseable: ${(e as Error).message}`], score: 0 };
  }

  // 2. Required top-level fields
  const requiredFields = ['deviceId', 'deviceName', 'manufacturer', 'layoutType', 'sections', 'controls'];
  for (const field of requiredFields) {
    if (!(field in manifest)) {
      errors.push(`Missing required field: ${field}`);
      score -= 1.0;
    }
  }

  const sections = (manifest.sections ?? []) as Array<Record<string, unknown>>;
  const controls = (manifest.controls ?? []) as Array<Record<string, unknown>>;

  // 3. Sections must have archetypes from known library
  const knownArchetypes = new Set([
    'grid-NxM', 'single-column', 'single-row', 'anchor-layout',
    'cluster-above-anchor', 'cluster-below-anchor', 'dual-column', 'stacked-rows',
  ]);
  for (const s of sections) {
    if (!s.archetype) {
      errors.push(`Section "${s.id}" missing archetype`);
      score -= 1.0;
    } else if (!knownArchetypes.has(s.archetype as string)) {
      errors.push(`Section "${s.id}" has unknown archetype "${s.archetype}". Valid: ${[...knownArchetypes].join(', ')}`);
      score -= 1.0;
    }
  }

  // 4. Multi-container archetypes must have containerAssignment
  const needsContainers = new Set(['cluster-above-anchor', 'cluster-below-anchor', 'anchor-layout', 'dual-column']);
  const missingSections: string[] = [];
  for (const s of sections) {
    if (needsContainers.has(s.archetype as string) && !s.containerAssignment) {
      missingSections.push(s.id as string);
    }
  }
  if (missingSections.length > 0) {
    errors.push(`Missing containerAssignment for: ${missingSections.join(', ')}. Gatekeeper must specify which controls go in each container.`);
    score -= 2.0;
  }

  // 5. All controls must be assigned to a section
  const assignedControls = new Set(sections.flatMap(s => (s.controls ?? []) as string[]));
  const orphans = controls.filter(c => !assignedControls.has(c.id as string));
  if (orphans.length > 0) {
    errors.push(`${orphans.length} orphaned controls not assigned to any section: ${orphans.slice(0, 5).map(c => c.id).join(', ')}`);
    score -= 1.0;
  }

  // 6. Controls must have spatialNeighbors
  const missingNeighbors = controls.filter(c => !c.spatialNeighbors);
  if (missingNeighbors.length > 0) {
    errors.push(`${missingNeighbors.length} controls missing spatialNeighbors`);
    score -= 0.5;
  }

  // 7. Density targets
  if (!manifest.densityTargets) {
    errors.push('Missing densityTargets');
    score -= 0.5;
  }

  // 8. heightSplits must be 0-1 range (not integers like 30, 65) — auto-correct
  for (const s of sections) {
    const splits = s.heightSplits as { cluster?: number; anchor?: number; gap?: number } | undefined;
    if (splits) {
      const values = [splits.cluster, splits.anchor, splits.gap].filter(v => v !== undefined) as number[];
      const hasIntegers = values.some(v => v > 1.0);
      if (hasIntegers) {
        // Auto-correct: divide by 100 to convert percentages to decimals
        if (splits.cluster !== undefined && splits.cluster > 1.0) splits.cluster = splits.cluster / 100;
        if (splits.anchor !== undefined && splits.anchor > 1.0) splits.anchor = splits.anchor / 100;
        if (splits.gap !== undefined && splits.gap > 1.0) splits.gap = splits.gap / 100;
        errors.push(`Section "${s.id}" heightSplits auto-corrected from integers to decimals (${JSON.stringify(splits)})`);
        score -= 0.5; // Deduct less since auto-corrected
      }
    }
  }

  // 9. panelBoundingBox — sections should have global positioning data
  const missingBBox = sections.filter(s => !s.panelBoundingBox);
  if (missingBBox.length > 0) {
    errors.push(`${missingBBox.length} sections missing panelBoundingBox: ${missingBBox.slice(0, 3).map(s => s.id).join(', ')}`);
    score -= 0.5;
  }

  // 10. Validate keyboard field
  if (manifest.keyboard !== undefined && manifest.keyboard !== null) {
    const kb = manifest.keyboard as Record<string, unknown>;
    if (!kb.keys || !kb.startNote || !kb.panelHeightPercent) {
      errors.push('keyboard field missing required sub-fields: keys, startNote, panelHeightPercent');
      score -= 1.0;
    }
    if (kb.panelHeightPercent && ((kb.panelHeightPercent as number) < 10 || (kb.panelHeightPercent as number) > 90)) {
      errors.push(`keyboard.panelHeightPercent (${kb.panelHeightPercent}) outside valid range 10-90`);
      score -= 0.5;
    }
    // Validate sections don't extend into keyboard area
    if (kb.panelHeightPercent) {
      const maxY = kb.panelHeightPercent as number;
      for (const section of sections) {
        const bb = section.panelBoundingBox as { y: number; h: number } | undefined;
        if (bb && (bb.y + bb.h) > maxY + 2) { // 2% tolerance
          errors.push(`Section "${section.id}" extends below panel area (y+h=${(bb.y + bb.h).toFixed(1)}% > ${maxY}%)`);
          score -= 0.5;
        }
      }
    }
  }

  // 11. Visual enrichment soft enforcement — deductions, not hard rejection
  const totalControls = controls.length;
  if (totalControls > 0) {
    const missingShape = controls.filter(c => !c.shape).length;
    const missingSizeClass = controls.filter(c => !c.sizeClass).length;
    const missingLabelDisplay = controls.filter(c => !c.labelDisplay).length;
    const pctMissingShape = missingShape / totalControls;
    const pctMissingSizeClass = missingSizeClass / totalControls;
    const pctMissingLabelDisplay = missingLabelDisplay / totalControls;

    if (pctMissingShape > 0.2) {
      errors.push(`${missingShape}/${totalControls} controls missing shape (${(pctMissingShape * 100).toFixed(0)}%)`);
      score -= 1.0;
    }
    if (pctMissingSizeClass > 0.2) {
      errors.push(`${missingSizeClass}/${totalControls} controls missing sizeClass (${(pctMissingSizeClass * 100).toFixed(0)}%)`);
      score -= 0.5;
    }
    if (pctMissingLabelDisplay > 0.2) {
      errors.push(`${missingLabelDisplay}/${totalControls} controls missing labelDisplay (${(pctMissingLabelDisplay * 100).toFixed(0)}%)`);
      score -= 0.5;
    }
  }

  score = Math.max(0, score);
  return { valid: errors.length === 0, errors, score };
}

/**
 * Archetype-Geometry Validation: verify the chosen archetype makes sense
 * for the centroid distribution. Catches wrong archetypes like using
 * cluster-above-anchor for a side-by-side layout.
 */
export function validateArchetypeGeometry(
  manifestJson: string,
  blueprintJson: string
): ValidationResult & { mismatches: Array<{ sectionId: string; archetype: string; reason: string; suggestion: string }> } {
  const errors: string[] = [];
  const mismatches: Array<{ sectionId: string; archetype: string; reason: string; suggestion: string }> = [];

  let manifest: { sections: Array<{ id: string; archetype: string; controls: string[] }> };
  let blueprint: { sections: Array<{ sectionId: string; controls: Array<{ id: number; centroid: { x: number; y: number } }> }> };

  try {
    manifest = JSON.parse(manifestJson);
    blueprint = JSON.parse(blueprintJson);
  } catch {
    return { valid: false, errors: ['Could not parse JSON'], mismatches: [] };
  }

  for (const mSection of manifest.sections) {
    const bSection = blueprint.sections.find(bs =>
      bs.sectionId === mSection.id ||
      bs.sectionId?.toLowerCase().includes(mSection.id.replace(/-/g, '').toLowerCase())
    );
    if (!bSection || bSection.controls.length < 2) continue;

    const centroids = bSection.controls.map(c => c.centroid).filter(Boolean);
    if (centroids.length < 2) continue;

    // Compute spread: how much do centroids vary in X vs Y?
    const xs = centroids.map(c => c.x);
    const ys = centroids.map(c => c.y);
    const xSpread = Math.max(...xs) - Math.min(...xs);
    const ySpread = Math.max(...ys) - Math.min(...ys);

    // Detect X-clusters: do centroids split into 2+ distinct X groups?
    const sortedXs = [...xs].sort((a, b) => a - b);
    let maxXGap = 0;
    for (let i = 1; i < sortedXs.length; i++) {
      maxXGap = Math.max(maxXGap, sortedXs[i] - sortedXs[i - 1]);
    }
    const hasTwoXClusters = maxXGap > 15; // >15% gap between X groups = two columns

    const archetype = mSection.archetype;

    // cluster-above-anchor / cluster-below-anchor: implies vertical stacking
    // If controls spread more horizontally than vertically, archetype is likely wrong
    // Exception: narrow sections (width < 20%) can have horizontal offset within a vertical stack
    // because controls are small relative to the section width — X-spread is noise, not signal
    const isNarrowSection = xSpread < 30; // Less than 30% X-spread in a section = probably vertical
    if ((archetype === 'cluster-above-anchor' || archetype === 'cluster-below-anchor') && hasTwoXClusters && !isNarrowSection) {
      mismatches.push({
        sectionId: mSection.id,
        archetype,
        reason: `Controls have two distinct X-clusters (gap: ${maxXGap.toFixed(0)}%). ` +
          `${archetype} implies vertical stacking, but geometry shows side-by-side arrangement.`,
        suggestion: 'dual-column',
      });
      errors.push(
        `Section "${mSection.id}": archetype "${archetype}" mismatches geometry. ` +
        `Controls split into two X-clusters (gap: ${maxXGap.toFixed(0)}%). Suggest "dual-column".`
      );
    }

    // single-column: all controls should share similar X (within ±10%)
    if (archetype === 'single-column' && xSpread > 20) {
      mismatches.push({
        sectionId: mSection.id,
        archetype,
        reason: `X-spread is ${xSpread.toFixed(0)}% but single-column expects <20%.`,
        suggestion: xSpread > 30 ? 'dual-column' : 'stacked-rows',
      });
      errors.push(
        `Section "${mSection.id}": archetype "single-column" but X-spread is ${xSpread.toFixed(0)}%. ` +
        `Controls aren't in a single column.`
      );
    }

    // single-row: all controls should share similar Y (within ±10%)
    if (archetype === 'single-row' && ySpread > 20) {
      mismatches.push({
        sectionId: mSection.id,
        archetype,
        reason: `Y-spread is ${ySpread.toFixed(0)}% but single-row expects <20%.`,
        suggestion: 'stacked-rows',
      });
      errors.push(
        `Section "${mSection.id}": archetype "single-row" but Y-spread is ${ySpread.toFixed(0)}%. ` +
        `Controls aren't in a single row.`
      );
    }
  }

  return { valid: mismatches.length === 0, errors, mismatches };
}

/**
 * Orchestrator 4-Point Validation: verify gatekeeper's neighbor directions
 * against parser's centroid coordinates. Catches flipped East/West errors.
 */
export function validateNeighborDirections(
  manifestJson: string,
  blueprintJson: string
): ValidationResult & { flippedNeighbors: Array<{ control: string; neighbor: string; direction: string; expected: string }> } {
  const errors: string[] = [];
  const flipped: Array<{ control: string; neighbor: string; direction: string; expected: string }> = [];

  let manifest: { sections: Array<{ id: string; controls: string[] }>; controls: Array<{ id: string; spatialNeighbors?: Record<string, string | null> }> };
  let blueprint: { sections: Array<{ sectionId: string; controls: Array<{ id: number; centroid: { x: number; y: number } }> }> };

  try {
    manifest = JSON.parse(manifestJson);
    blueprint = JSON.parse(blueprintJson);
  } catch {
    return { valid: false, errors: ['Could not parse manifest or blueprint JSON'], flippedNeighbors: [] };
  }

  // Build a centroid lookup: control ID → { x, y }
  // The parser uses numeric IDs, the gatekeeper uses string IDs.
  // Map them by matching order within each section.
  const centroidMap = new Map<string, { x: number; y: number }>();

  for (const mSection of manifest.sections) {
    // Find matching blueprint section
    const bSection = blueprint.sections.find(bs => {
      // Match by section ID or by similar naming
      return bs.sectionId === mSection.id ||
        bs.sectionId?.toLowerCase().includes(mSection.id.replace(/-/g, '').toLowerCase());
    });

    if (!bSection) continue;

    // Map by order: manifest controls[i] → blueprint controls[i]
    for (let i = 0; i < mSection.controls.length && i < bSection.controls.length; i++) {
      const controlId = mSection.controls[i];
      const centroid = bSection.controls[i]?.centroid;
      if (centroid) {
        centroidMap.set(controlId, centroid);
      }
    }
  }

  // Now check each control's neighbor directions against centroids
  for (const control of manifest.controls) {
    const neighbors = control.spatialNeighbors;
    if (!neighbors) continue;

    const myCentroid = centroidMap.get(control.id);
    if (!myCentroid) continue;

    // Check each direction
    const directionChecks: Array<{ dir: string; neighborId: string | null; expectedRelation: (mine: { x: number; y: number }, theirs: { x: number; y: number }) => boolean; correctDir: string }> = [
      { dir: 'above', neighborId: neighbors.above ?? neighbors.north ?? neighbors.N, expectedRelation: (m, t) => t.y < m.y, correctDir: 'below' },
      { dir: 'below', neighborId: neighbors.below ?? neighbors.south ?? neighbors.S, expectedRelation: (m, t) => t.y > m.y, correctDir: 'above' },
      { dir: 'left', neighborId: neighbors.left ?? neighbors.west ?? neighbors.W, expectedRelation: (m, t) => t.x < m.x, correctDir: 'right' },
      { dir: 'right', neighborId: neighbors.right ?? neighbors.east ?? neighbors.E, expectedRelation: (m, t) => t.x > m.x, correctDir: 'left' },
    ];

    for (const check of directionChecks) {
      if (!check.neighborId) continue;
      const neighborCentroid = centroidMap.get(check.neighborId);
      if (!neighborCentroid) continue;

      if (!check.expectedRelation(myCentroid, neighborCentroid)) {
        // Direction is wrong
        const actualDir = neighborCentroid.x < myCentroid.x ? 'left'
          : neighborCentroid.x > myCentroid.x ? 'right'
          : neighborCentroid.y < myCentroid.y ? 'above'
          : 'below';

        flipped.push({
          control: control.id,
          neighbor: check.neighborId,
          direction: check.dir,
          expected: actualDir,
        });

        errors.push(
          `Neighbor direction flipped: ${control.id}.${check.dir} = ${check.neighborId}, ` +
          `but centroids show ${check.neighborId} is actually to the ${actualDir} ` +
          `(${control.id}: x=${myCentroid.x}, y=${myCentroid.y} | ${check.neighborId}: x=${neighborCentroid.x}, y=${neighborCentroid.y})`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, flippedNeighbors: flipped };
}

/**
 * Pre-inspection for Gatekeeper: verify both data streams are available.
 */
export function preInspectGatekeeper(opts: {
  parserCheckpointExists: boolean;
  parserScore: number | null;
  manualPaths: string[];
}): ValidationResult {
  const errors: string[] = [];

  if (!opts.parserCheckpointExists) {
    errors.push('Diagram Parser checkpoint not found — Gatekeeper requires Parser output');
  }

  if (opts.parserScore !== null && opts.parserScore < 9.0) {
    errors.push(`Diagram Parser score (${opts.parserScore}) below 9.0 — Gatekeeper should not proceed with low-quality geometry`);
  }

  if (opts.manualPaths.length === 0) {
    errors.push('No manual PDFs available — Gatekeeper requires manual text');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Phase 0: Manifest Completeness Validator ──────────────────────────────

/**
 * Blueprint control with bounding box info for geometric checks.
 */
interface BlueprintControl {
  id: number | string;
  centroid?: { x: number; y: number };
  boundingBox?: { x: number; y: number; w: number; h: number };
}

interface BlueprintSection {
  sectionId: string;
  controls: BlueprintControl[];
}

interface Blueprint {
  sections: BlueprintSection[];
}

/**
 * Validate manifest completeness after the Visual Extractor, before the Layout Engine.
 *
 * This is a PURE function — no file I/O, no side effects.
 * 1. Parses the manifest JSON
 * 2. Applies auto-fixes (modifies the parsed manifest in-place)
 * 3. Runs all checks and computes score (base 10.0, deductions per issue)
 * 4. Returns { score, passed (>= 9.0), report, correctedManifest }
 */
export function validateManifestCompleteness(
  manifestJson: string,
  blueprintJson?: string,
): { score: number; passed: boolean; report: ValidationReport; correctedManifest: string } {
  // ── Parse inputs ─────────────────────────────────────────────────────────

  let manifest: MasterManifest;
  try {
    manifest = JSON.parse(manifestJson) as MasterManifest;
  } catch (e) {
    const emptyReport: ValidationReport = {
      score: 0, passed: false,
      autoFixes: [], flags: [], missing: [],
      totalControls: 0, fullyEnriched: 0, partiallyEnriched: 0, unenriched: 0,
    };
    return { score: 0, passed: false, report: emptyReport, correctedManifest: manifestJson };
  }

  let blueprint: Blueprint | null = null;
  if (blueprintJson) {
    try {
      blueprint = JSON.parse(blueprintJson) as Blueprint;
    } catch {
      // Non-fatal — geometric checks will be skipped
    }
  }

  const controls = manifest.controls ?? [];
  const sections = manifest.sections ?? [];
  const groupLabels = manifest.groupLabels ?? [];

  const autoFixes: ValidationReport['autoFixes'] = [];
  const flags: ValidationReport['flags'] = [];
  const missing: ValidationReport['missing'] = [];

  // Build control ID lookup
  const controlMap = new Map<string, ManifestControl>();
  for (const c of controls) {
    controlMap.set(c.id, c);
  }

  // Build section lookup (control → section)
  const controlToSection = new Map<string, string>();
  for (const s of sections) {
    for (const cId of s.controls) {
      controlToSection.set(cId, s.id);
    }
  }

  // ── Auto-Fixes (applied before scoring) ──────────────────────────────────

  for (const c of controls) {
    const label = (c.verbatimLabel ?? '').toLowerCase();

    // Rule 1: label contains "port" + type is "button" → type = "port", labelDisplay = "hidden"
    if (label.includes('port') && c.type === 'button') {
      autoFixes.push({ controlId: c.id, field: 'type', from: c.type, to: 'port', rule: 'label-contains-port' });
      autoFixes.push({ controlId: c.id, field: 'labelDisplay', from: c.labelDisplay, to: 'hidden', rule: 'label-contains-port' });
      c.type = 'port';
      c.labelDisplay = 'hidden';
    }

    // Rule 2: label contains "slot" + type is "button" → type = "slot", labelDisplay = "hidden"
    if (label.includes('slot') && c.type === 'button') {
      autoFixes.push({ controlId: c.id, field: 'type', from: c.type, to: 'slot', rule: 'label-contains-slot' });
      autoFixes.push({ controlId: c.id, field: 'labelDisplay', from: c.labelDisplay, to: 'hidden', rule: 'label-contains-slot' });
      c.type = 'slot';
      c.labelDisplay = 'hidden';
    }

    // Rule 3: label contains "indicator" + type is "button" → type = "led"
    if (label.includes('indicator') && c.type === 'button') {
      autoFixes.push({ controlId: c.id, field: 'type', from: c.type, to: 'led', rule: 'label-contains-indicator' });
      c.type = 'led';
    }

    // Rule 10: switch + positions >= 3 → type = "lever"
    if (c.type === 'switch' && (c.positions ?? 0) >= 3) {
      autoFixes.push({ controlId: c.id, field: 'type', from: c.type, to: 'lever', rule: 'switch-positions-gte-3' });
      c.type = 'lever';
    }

    // Rule 4: Missing shape on knob/encoder → shape = "circle"
    if ((c.type === 'knob' || c.type === 'encoder') && !c.shape) {
      autoFixes.push({ controlId: c.id, field: 'shape', from: c.shape, to: 'circle', rule: 'default-shape-knob-encoder' });
      c.shape = 'circle';
    }

    // Rule 5: Missing shape on pad → shape = "square"
    if (c.type === 'pad' && !c.shape) {
      autoFixes.push({ controlId: c.id, field: 'shape', from: c.shape, to: 'square', rule: 'default-shape-pad' });
      c.shape = 'square';
    }

    // Rule 6: Missing orientation on fader/slider → orientation = "vertical"
    if ((c.type === 'fader' || c.type === 'slider') && !c.orientation) {
      autoFixes.push({ controlId: c.id, field: 'orientation', from: c.orientation, to: 'vertical', rule: 'default-orientation-fader-slider' });
      c.orientation = 'vertical';
    }

    // Rule 7: Missing interactionType on knob → interactionType = "rotary"
    if (c.type === 'knob' && !c.interactionType) {
      autoFixes.push({ controlId: c.id, field: 'interactionType', from: c.interactionType, to: 'rotary', rule: 'default-interaction-knob' });
      c.interactionType = 'rotary';
    }

    // Rule 12: Missing interactionType on encoder → interactionType = "rotary"
    if (c.type === 'encoder' && !c.interactionType) {
      autoFixes.push({ controlId: c.id, field: 'interactionType', from: c.interactionType, to: 'rotary', rule: 'default-interaction-encoder' });
      c.interactionType = 'rotary';
    }

    // Rule 8: Missing interactionType on fader → interactionType = "slide"
    if (c.type === 'fader' && !c.interactionType) {
      autoFixes.push({ controlId: c.id, field: 'interactionType', from: c.interactionType, to: 'slide', rule: 'default-interaction-fader' });
      c.interactionType = 'slide';
    }

    // Rule 13: Missing interactionType on button → interactionType = "momentary"
    if (c.type === 'button' && !c.interactionType) {
      autoFixes.push({ controlId: c.id, field: 'interactionType', from: c.interactionType, to: 'momentary', rule: 'default-interaction-button' });
      c.interactionType = 'momentary';
    }

    // Rule 14: Missing labelDisplay on port/slot → labelDisplay = "hidden"
    if ((c.type === 'port' || c.type === 'slot') && !c.labelDisplay) {
      autoFixes.push({ controlId: c.id, field: 'labelDisplay', from: c.labelDisplay, to: 'hidden', rule: 'default-labelDisplay-port-slot' });
      c.labelDisplay = 'hidden';
    }

    // Rule 15: Missing labelDisplay on led → labelDisplay = "below"
    if (c.type === 'led' && !c.labelDisplay) {
      autoFixes.push({ controlId: c.id, field: 'labelDisplay', from: c.labelDisplay, to: 'below', rule: 'default-labelDisplay-led' });
      c.labelDisplay = 'below';
    }

    // Rule 9: Missing sizeClass → default to "md"
    if (!c.sizeClass) {
      autoFixes.push({ controlId: c.id, field: 'sizeClass', from: c.sizeClass, to: 'md', rule: 'default-sizeClass' });
      c.sizeClass = 'md';
    }

    // Physical constraint auto-fixes: enforce correct interactionType
    if ((c.type === 'knob' || c.type === 'encoder') && c.interactionType && c.interactionType !== 'rotary') {
      autoFixes.push({ controlId: c.id, field: 'interactionType', from: c.interactionType, to: 'rotary', rule: 'physical-constraint-rotary' });
      c.interactionType = 'rotary';
    }
    if ((c.type === 'fader' || c.type === 'slider') && c.interactionType && c.interactionType !== 'slide') {
      autoFixes.push({ controlId: c.id, field: 'interactionType', from: c.interactionType, to: 'slide', rule: 'physical-constraint-slide' });
      c.interactionType = 'slide';
    }
    if ((c.type === 'led' || c.type === 'port' || c.type === 'slot') && c.interactionType != null) {
      autoFixes.push({ controlId: c.id, field: 'interactionType', from: c.interactionType, to: null, rule: 'physical-constraint-non-interactive' });
      c.interactionType = undefined;
    }
  }

  // Rule 11: sharedLabel on control but no matching groupLabels entry → flag (don't auto-create structure)
  const groupLabelTextSet = new Set<string>();
  for (const gl of groupLabels) {
    groupLabelTextSet.add(gl.text);
  }
  for (const c of controls) {
    if (c.sharedLabel && !groupLabelTextSet.has(c.sharedLabel)) {
      flags.push({
        controlId: c.id,
        field: 'sharedLabel',
        message: `Control has sharedLabel "${c.sharedLabel}" but no matching groupLabels[] entry exists`,
      });
    }
  }

  // ── Scoring ──────────────────────────────────────────────────────────────

  let score = 10.0;

  // --- Integrity: Duplicate control IDs ---
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const c of controls) {
    if (seenIds.has(c.id)) {
      duplicateIds.add(c.id);
    }
    seenIds.add(c.id);
  }
  for (const dupId of duplicateIds) {
    score -= 2.0;
    missing.push({ controlId: dupId, field: 'id', severity: 'critical' });
    flags.push({ controlId: dupId, field: 'id', message: `Duplicate control ID: "${dupId}"` });
  }

  // --- Integrity: Valid spatialNeighbor references ---
  for (const c of controls) {
    if (!c.spatialNeighbors) continue;
    const dirs = ['above', 'below', 'left', 'right'] as const;
    for (const dir of dirs) {
      const neighborId = c.spatialNeighbors[dir];
      if (neighborId && !controlMap.has(neighborId)) {
        score -= 0.5;
        flags.push({
          controlId: c.id,
          field: `spatialNeighbors.${dir}`,
          message: `Invalid spatialNeighbor reference: "${neighborId}" does not exist in manifest`,
        });
      }
    }
  }

  // --- Integrity: deviceDimensions present ---
  if (!manifest.deviceDimensions) {
    score -= 1.0;
    missing.push({ controlId: '_manifest', field: 'deviceDimensions', severity: 'major' });
  }

  // --- Required field checks (post auto-fix) ---
  for (const c of controls) {
    if (duplicateIds.has(c.id)) continue; // Already penalized

    // shape
    if (!c.shape) {
      score -= 0.5;
      missing.push({ controlId: c.id, field: 'shape', severity: 'major' });
    }

    // sizeClass
    if (!c.sizeClass) {
      score -= 0.5;
      missing.push({ controlId: c.id, field: 'sizeClass', severity: 'major' });
    }

    // labelDisplay
    if (!c.labelDisplay) {
      score -= 0.5;
      missing.push({ controlId: c.id, field: 'labelDisplay', severity: 'major' });
    }

    // buttonStyle on buttons
    if (c.type === 'button' && !c.buttonStyle) {
      score -= 0.25;
      missing.push({ controlId: c.id, field: 'buttonStyle', severity: 'minor' });
    }

    // ledColor on LED-type controls
    if ((c.type === 'led') && !c.ledColor) {
      score -= 0.5;
      missing.push({ controlId: c.id, field: 'ledColor', severity: 'major' });
    }

    // hasLed === true → ledColor and ledBehavior
    if (c.hasLed) {
      if (!c.ledColor) {
        score -= 0.5;
        missing.push({ controlId: c.id, field: 'ledColor', severity: 'major' });
      }
      if (!c.ledBehavior) {
        score -= 0.25;
        missing.push({ controlId: c.id, field: 'ledBehavior', severity: 'minor' });
      }
    }

    // labelDisplay === 'icon-only' → icon must be set
    if (c.labelDisplay === 'icon-only' && !c.icon) {
      score -= 0.5;
      missing.push({ controlId: c.id, field: 'icon', severity: 'major' });
    }

    // interactionType (post auto-fix, so only flag types that weren't auto-fixed)
    if (!c.interactionType && !['led', 'port', 'slot'].includes(c.type)) {
      score -= 0.25;
      missing.push({ controlId: c.id, field: 'interactionType', severity: 'minor' });
    }
  }

  // --- Physical constraint flags (for button/pad/screen — not auto-fixed, just flagged) ---
  for (const c of controls) {
    if (c.type === 'button' && c.interactionType && ['rotary', 'slide'].includes(c.interactionType)) {
      score -= 1.0;
      flags.push({
        controlId: c.id,
        field: 'interactionType',
        message: `Button has physically impossible interactionType "${c.interactionType}" — expected momentary/toggle/hold`,
      });
    }
    if (c.type === 'pad' && c.interactionType && ['rotary', 'slide'].includes(c.interactionType)) {
      score -= 1.0;
      flags.push({
        controlId: c.id,
        field: 'interactionType',
        message: `Pad has physically impossible interactionType "${c.interactionType}" — expected momentary/toggle`,
      });
    }
    if (c.type === 'screen' && c.interactionType && ['rotary', 'slide'].includes(c.interactionType)) {
      flags.push({
        controlId: c.id,
        field: 'interactionType',
        message: `Screen has interactionType "${c.interactionType}" — expected touch or null`,
      });
    }
  }

  // --- switch + positions >= 3 not converted to lever (post auto-fix check) ---
  for (const c of controls) {
    if (c.type === 'switch' && (c.positions ?? 0) >= 3) {
      score -= 0.5;
      flags.push({
        controlId: c.id,
        field: 'type',
        message: `type is 'switch' but positions >= 3, should be 'lever'`,
      });
    }
  }

  // --- Pairing checks ---
  for (const c of controls) {
    if (!c.pairedWith) continue;
    const partner = controlMap.get(c.pairedWith);

    // Broken pairing: A→B but B doesn't exist or B↛A
    if (!partner) {
      score -= 1.0;
      flags.push({
        controlId: c.id,
        field: 'pairedWith',
        message: `Paired with "${c.pairedWith}" but that control does not exist`,
      });
      continue;
    }

    if (partner.pairedWith !== c.id) {
      score -= 1.0;
      flags.push({
        controlId: c.id,
        field: 'pairedWith',
        message: `Broken pairing: ${c.id}→${c.pairedWith} but ${c.pairedWith}→${partner.pairedWith ?? 'null'}`,
      });
    }

    // Shared label consistency
    if (c.sharedLabel && partner.sharedLabel && c.sharedLabel !== partner.sharedLabel) {
      flags.push({
        controlId: c.id,
        field: 'sharedLabel',
        message: `Paired controls have different sharedLabel: "${c.sharedLabel}" vs "${partner.sharedLabel}"`,
      });
    }

    // Both must be in same section
    const cSection = controlToSection.get(c.id);
    const pSection = controlToSection.get(c.pairedWith);
    if (cSection && pSection && cSection !== pSection) {
      flags.push({
        controlId: c.id,
        field: 'pairedWith',
        message: `Paired controls in different sections: "${cSection}" vs "${pSection}"`,
      });
    }
  }

  // --- Nesting checks ---
  for (const c of controls) {
    if (!c.nestedIn) continue;
    const parent = controlMap.get(c.nestedIn);

    if (!parent) {
      score -= 1.0;
      flags.push({
        controlId: c.id,
        field: 'nestedIn',
        message: `nestedIn references "${c.nestedIn}" which does not exist in manifest`,
      });
      continue;
    }

    // Container-capable types
    const containerTypes: ControlType[] = ['wheel', 'screen'];
    if (!containerTypes.includes(parent.type)) {
      flags.push({
        controlId: c.id,
        field: 'nestedIn',
        message: `Parent "${c.nestedIn}" has type "${parent.type}" which is not container-capable (expected wheel/screen)`,
      });
    }

    // Same section
    const cSection = controlToSection.get(c.id);
    const pSection = controlToSection.get(c.nestedIn);
    if (cSection && pSection && cSection !== pSection) {
      flags.push({
        controlId: c.id,
        field: 'nestedIn',
        message: `Nested control and parent in different sections: "${cSection}" vs "${pSection}"`,
      });
    }

    // Geometric containment check (if blueprint bounding boxes are available)
    if (blueprint) {
      const childBBox = findBoundingBox(blueprint, c.id);
      const parentBBox = findBoundingBox(blueprint, c.nestedIn);
      if (childBBox && parentBBox) {
        const contained =
          childBBox.x >= parentBBox.x &&
          childBBox.y >= parentBBox.y &&
          (childBBox.x + childBBox.w) <= (parentBBox.x + parentBBox.w) &&
          (childBBox.y + childBBox.h) <= (parentBBox.y + parentBBox.h);
        if (!contained) {
          score -= 1.0;
          flags.push({
            controlId: c.id,
            field: 'nestedIn',
            message: `CRITICAL: "${c.id}" bounding box is not contained within parent "${c.nestedIn}" — geometric paradox`,
          });
        }
      }
    }
  }

  // --- Group label checks ---
  for (const gl of groupLabels) {
    for (const cId of gl.controlIds) {
      // Every controlId in groupLabels must exist
      if (!controlMap.has(cId)) {
        score -= 0.5;
        flags.push({
          controlId: cId,
          field: 'groupLabels',
          message: `groupLabels entry "${gl.text}" references non-existent control "${cId}"`,
        });
        continue;
      }

      // All controls in a group label must be in the same section
      const firstSection = controlToSection.get(gl.controlIds[0]);
      const thisSection = controlToSection.get(cId);
      if (firstSection && thisSection && firstSection !== thisSection) {
        flags.push({
          controlId: cId,
          field: 'groupLabels',
          message: `groupLabels entry "${gl.text}": control "${cId}" is in section "${thisSection}" but first control is in "${firstSection}"`,
        });
      }

      // Cross-check: control's sharedLabel must match groupLabel text
      const ctrl = controlMap.get(cId);
      if (ctrl && ctrl.sharedLabel !== gl.text) {
        score -= 0.5;
        flags.push({
          controlId: cId,
          field: 'sharedLabel',
          message: `groupLabels says sharedLabel should be "${gl.text}" but control has "${ctrl.sharedLabel ?? 'null'}"`,
        });
      }
    }
  }

  // --- Size class checks (if blueprint available) ---
  if (blueprint) {
    for (const s of sections) {
      const bSection = findBlueprintSection(blueprint, s.id);
      if (!bSection) continue;

      const areas: Array<{ controlId: string; area: number }> = [];
      for (let i = 0; i < s.controls.length && i < bSection.controls.length; i++) {
        const bc = bSection.controls[i];
        if (bc.boundingBox) {
          areas.push({ controlId: s.controls[i], area: bc.boundingBox.w * bc.boundingBox.h });
        }
      }

      if (areas.length === 0) continue;
      const medianArea = computeMedian(areas.map(a => a.area));
      if (medianArea === 0) continue;

      const sizeClassSteps: Array<{ key: string; min: number; max: number }> = [
        { key: 'xs', min: 0, max: 0.4 },
        { key: 'sm', min: 0.4, max: 0.7 },
        { key: 'md', min: 0.7, max: 1.3 },
        { key: 'lg', min: 1.3, max: 2.0 },
        { key: 'xl', min: 2.0, max: Infinity },
      ];
      const sizeOrder = ['xs', 'sm', 'md', 'lg', 'xl'];

      for (const { controlId, area } of areas) {
        const ctrl = controlMap.get(controlId);
        if (!ctrl || !ctrl.sizeClass) continue;

        const ratio = area / medianArea;
        const computed = sizeClassSteps.find(s => ratio >= s.min && ratio < s.max)?.key ?? 'md';
        const ctrlIdx = sizeOrder.indexOf(ctrl.sizeClass);
        const computedIdx = sizeOrder.indexOf(computed);

        if (Math.abs(ctrlIdx - computedIdx) > 1) {
          flags.push({
            controlId,
            field: 'sizeClass',
            message: `sizeClass "${ctrl.sizeClass}" differs from geometry-computed "${computed}" by more than 1 step (ratio: ${ratio.toFixed(2)})`,
          });
        }
      }
    }
  }

  // ── Enrichment stats ─────────────────────────────────────────────────────

  const enrichmentFields: (keyof ManifestControl)[] = [
    'shape', 'sizeClass', 'labelDisplay', 'buttonStyle', 'interactionType',
    'surfaceColor', 'icon', 'primaryLabel',
  ];

  let fullyEnriched = 0;
  let partiallyEnriched = 0;
  let unenriched = 0;

  for (const c of controls) {
    const filled = enrichmentFields.filter(f => c[f] != null).length;
    if (filled === enrichmentFields.length) {
      fullyEnriched++;
    } else if (filled > 0) {
      partiallyEnriched++;
    } else {
      unenriched++;
    }
  }

  // ── Clamp score and build result ─────────────────────────────────────────

  score = Math.max(0, Math.min(10, score));
  const passed = score >= 9.0;

  const report: ValidationReport = {
    score,
    passed,
    autoFixes,
    flags,
    missing,
    totalControls: controls.length,
    fullyEnriched,
    partiallyEnriched,
    unenriched,
  };

  const correctedManifest = JSON.stringify(manifest, null, 2);

  return { score, passed, report, correctedManifest };
}

// ─── Manifest Completeness Validator Helpers ─────────────────────────────────

function findBlueprintSection(blueprint: Blueprint, sectionId: string): BlueprintSection | undefined {
  return blueprint.sections.find(bs =>
    bs.sectionId === sectionId ||
    bs.sectionId?.toLowerCase().includes(sectionId.replace(/-/g, '').toLowerCase())
  );
}

function findBoundingBox(blueprint: Blueprint, controlId: string): { x: number; y: number; w: number; h: number } | undefined {
  for (const s of blueprint.sections) {
    for (const c of s.controls) {
      const cId = String(c.id);
      if (cId === controlId && c.boundingBox) {
        return c.boundingBox;
      }
    }
  }
  return undefined;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
