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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
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

  // 8. heightSplits must be 0-1 range (not integers like 30, 65)
  for (const s of sections) {
    const splits = s.heightSplits as { cluster?: number; anchor?: number; gap?: number } | undefined;
    if (splits) {
      const values = [splits.cluster, splits.anchor, splits.gap].filter(v => v !== undefined) as number[];
      const hasIntegers = values.some(v => v > 1.0);
      if (hasIntegers) {
        errors.push(`Section "${s.id}" heightSplits has values > 1.0 (${JSON.stringify(splits)}). Must be 0-1 range (e.g., 0.30 not 30).`);
        score -= 1.0;
      }
    }
  }

  // 9. panelBoundingBox — sections should have global positioning data
  const missingBBox = sections.filter(s => !s.panelBoundingBox);
  if (missingBBox.length > 0) {
    errors.push(`${missingBBox.length} sections missing panelBoundingBox: ${missingBBox.slice(0, 3).map(s => s.id).join(', ')}`);
    score -= 0.5;
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
    const sectionWidth = bSection.controls.length > 0 ? 100 : 0; // We check spread relative to section
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
      { dir: 'above', neighborId: neighbors.above, expectedRelation: (m, t) => t.y < m.y, correctDir: 'below' },
      { dir: 'below', neighborId: neighbors.below, expectedRelation: (m, t) => t.y > m.y, correctDir: 'above' },
      { dir: 'left', neighborId: neighbors.left, expectedRelation: (m, t) => t.x < m.x, correctDir: 'right' },
      { dir: 'right', neighborId: neighbors.right, expectedRelation: (m, t) => t.x > m.x, correctDir: 'left' },
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
