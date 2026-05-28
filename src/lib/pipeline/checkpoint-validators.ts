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

  // Check that EXTRACTED-FROM page references are within the expected range.
  // We only check column 1 of pipe-delimited table rows — that's the "page this
  // row was extracted from." Description columns can legitimately reference
  // OTHER pages as cross-references (e.g., "see POLY menu, page 2") without
  // being a validation failure. The old content-wide regex flagged those
  // cross-refs as false positives. (Fixed 2026-05-10.)
  //
  // Accepts column-1 formats: `| 15 |`, `| p.1 |`, `| p1 |`, `| page 5 |`.
  // Rejects header rows (`| Page |`) and separator rows (`| --- |`) — both
  // non-numeric.
  const rowPageMatches = [...content.matchAll(/^\s*\|\s*(?:p(?:age)?[.\s]*)?(\d+)\s*\|/gim)];
  for (const m of rowPageMatches) {
    const pageNum = parseInt(m[1], 10);
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
 * Validate the post-editor manifest — runs after contractor approval, before
 * the rest of the pipeline (extraction, audit, tutorial-build). This is a
 * pure-logic check (no LLM) on the structural integrity of the manifest's
 * control IDs and references. Tutorials reference control IDs; if IDs are
 * missing, duplicated, or orphaned, every downstream agent and every generated
 * tutorial silently inherits the bug.
 *
 * Halts the pipeline on ERRORS. Logs WARNINGS but advances.
 *
 * Checks (origin 2026-05-10):
 *   E1. Every control has a non-empty string `id`
 *   E2. All control IDs are unique
 *   E3. Every section has a non-empty string `id`
 *   E4. All section IDs are unique
 *   E5. Every section.childIds[] reference points to an existing control
 *   E6. Every editorLabel with a non-null `controlId` points to an existing control
 *   E7. Every editorLabel with a `sectionId` set points to an existing section
 *   E8. Every controlContainer's controlIds[] entries point to existing controls
 *   E9. Every groupLabel's controlIds[] entries point to existing controls
 *   E10. Manifest has at least one control and one section
 *   W1. Each id is kebab-case: ^[a-z][a-z0-9-]*[a-z0-9]$ (or single lowercase letter)
 *   W2. Every control has a non-empty `label` (else hard to debug)
 */
export interface PostEditorFinding {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  controlId?: string;
  sectionId?: string;
}

export interface PostEditorValidationResult extends ValidationResult {
  findings: PostEditorFinding[];
  errorCount: number;
  warningCount: number;
}

interface PostEditorControl {
  id?: string;
  label?: string;
  sectionId?: string;
}
interface PostEditorSection {
  id?: string;
  childIds?: string[];
}

interface PostEditorManifest {
  controls?: Record<string, PostEditorControl> | PostEditorControl[];
  sections?: Record<string, PostEditorSection> | PostEditorSection[];
  editorLabels?: Array<{ id?: string; controlId?: string | null; sectionId?: string }>;
  controlContainers?: Array<{ id?: string; controlIds?: string[] }>;
  groupLabels?: Array<{ id?: string; controlIds?: string[] }>;
}

// Permissive identifier check: must start with letter, contain only letters,
// digits, underscore, or hyphen. Matches observed production conventions
// across instruments: kebab-case (deepmind-12, fantom-06: `arp-chord`,
// `wheel-1`), screaming snake (cdj-3000: `BEAT_JUMP_BACK`), and mixed.
// Tutorials reference IDs as case-sensitive string keys — any of these work.
const VALID_ID_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;

function toArray<T extends { id?: string }>(
  source: Record<string, T> | T[] | undefined,
): T[] {
  if (!source) return [];
  if (Array.isArray(source)) return source;
  return Object.values(source);
}

export function validatePostEditorManifest(manifestJson: string): PostEditorValidationResult {
  const findings: PostEditorFinding[] = [];
  const errors: string[] = [];

  let manifest: PostEditorManifest;
  try {
    manifest = JSON.parse(manifestJson);
  } catch {
    return {
      valid: false,
      errors: ['Manifest is not valid JSON'],
      findings: [{ severity: 'error', code: 'INVALID_JSON', message: 'Manifest is not valid JSON' }],
      errorCount: 1,
      warningCount: 0,
    };
  }

  const controls = toArray(manifest.controls);
  const sections = toArray(manifest.sections);
  const labels = manifest.editorLabels ?? [];
  const containers = manifest.controlContainers ?? [];
  const groupLabels = manifest.groupLabels ?? [];

  // E10: manifest non-empty
  if (controls.length === 0) {
    findings.push({ severity: 'error', code: 'NO_CONTROLS', message: 'Manifest has no controls' });
  }
  if (sections.length === 0) {
    findings.push({ severity: 'error', code: 'NO_SECTIONS', message: 'Manifest has no sections' });
  }

  // E1, E2: control IDs present + unique
  const controlIdCounts = new Map<string, number>();
  controls.forEach((c, idx) => {
    if (typeof c.id !== 'string' || c.id.trim() === '') {
      findings.push({
        severity: 'error',
        code: 'CONTROL_MISSING_ID',
        message: `Control at index ${idx} has no id`,
      });
      return;
    }
    controlIdCounts.set(c.id, (controlIdCounts.get(c.id) ?? 0) + 1);
  });
  for (const [id, count] of controlIdCounts) {
    if (count > 1) {
      findings.push({
        severity: 'error',
        code: 'CONTROL_ID_DUPLICATE',
        message: `Control id "${id}" appears ${count} times — IDs must be unique`,
        controlId: id,
      });
    }
  }
  const validControlIds = new Set(controlIdCounts.keys());

  // E3, E4: section IDs present + unique
  const sectionIdCounts = new Map<string, number>();
  sections.forEach((s, idx) => {
    if (typeof s.id !== 'string' || s.id.trim() === '') {
      findings.push({
        severity: 'error',
        code: 'SECTION_MISSING_ID',
        message: `Section at index ${idx} has no id`,
      });
      return;
    }
    sectionIdCounts.set(s.id, (sectionIdCounts.get(s.id) ?? 0) + 1);
  });
  for (const [id, count] of sectionIdCounts) {
    if (count > 1) {
      findings.push({
        severity: 'error',
        code: 'SECTION_ID_DUPLICATE',
        message: `Section id "${id}" appears ${count} times — IDs must be unique`,
        sectionId: id,
      });
    }
  }
  const validSectionIds = new Set(sectionIdCounts.keys());

  // E5: section.childIds[] reference existing controls
  for (const section of sections) {
    if (!section.id || !section.childIds) continue;
    for (const childId of section.childIds) {
      if (!validControlIds.has(childId)) {
        findings.push({
          severity: 'error',
          code: 'SECTION_CHILD_ORPHAN',
          message: `Section "${section.id}" childIds references "${childId}" which doesn't exist in controls`,
          sectionId: section.id,
          controlId: childId,
        });
      }
    }
  }

  // E6: linked labels (controlId != null) reference existing controls
  // E7: standalone labels with sectionId reference existing sections
  for (const label of labels) {
    if (label.controlId && !validControlIds.has(label.controlId)) {
      findings.push({
        severity: 'error',
        code: 'LABEL_ORPHAN_CONTROL',
        message: `Label "${label.id ?? '?'}" links to controlId "${label.controlId}" which doesn't exist`,
        controlId: label.controlId,
      });
    }
    if (!label.controlId && label.sectionId && !validSectionIds.has(label.sectionId)) {
      findings.push({
        severity: 'warning',
        code: 'LABEL_ORPHAN_SECTION',
        message: `Standalone label "${label.id ?? '?'}" has sectionId "${label.sectionId}" which doesn't exist`,
        sectionId: label.sectionId,
      });
    }
  }

  // E8: container.controlIds[] reference existing controls
  for (const container of containers) {
    if (!container.controlIds) continue;
    for (const cid of container.controlIds) {
      if (!validControlIds.has(cid)) {
        findings.push({
          severity: 'error',
          code: 'CONTAINER_ORPHAN',
          message: `Container "${container.id ?? '?'}" references controlId "${cid}" which doesn't exist`,
          controlId: cid,
        });
      }
    }
  }

  // E9: groupLabel.controlIds[] reference existing controls
  for (const gl of groupLabels) {
    if (!gl.controlIds) continue;
    for (const cid of gl.controlIds) {
      if (!validControlIds.has(cid)) {
        findings.push({
          severity: 'error',
          code: 'GROUPLABEL_ORPHAN',
          message: `Group label "${gl.id ?? '?'}" references controlId "${cid}" which doesn't exist`,
          controlId: cid,
        });
      }
    }
  }

  // E11: control.sectionId references existing section
  // (E5 covers section.childIds → controls; this is the reverse direction)
  for (const c of controls) {
    if (c.id && c.sectionId && !validSectionIds.has(c.sectionId)) {
      findings.push({
        severity: 'error',
        code: 'CONTROL_ORPHAN_SECTION',
        message: `Control "${c.id}" sectionId "${c.sectionId}" doesn't exist`,
        controlId: c.id,
        sectionId: c.sectionId,
      });
    }
  }

  // W1: valid identifier (warning) — must start with a letter and contain
  // only letters, digits, underscore, or hyphen. Permissive enough to accept
  // kebab-case, snake_case, and SCREAMING_SNAKE_CASE.
  for (const c of controls) {
    if (c.id && !VALID_ID_RE.test(c.id)) {
      findings.push({
        severity: 'warning',
        code: 'CONTROL_ID_INVALID_FORMAT',
        message: `Control id "${c.id}" has invalid format — must start with letter, contain only letters/digits/underscore/hyphen`,
        controlId: c.id,
      });
    }
  }

  // W2: empty label (warning)
  for (const c of controls) {
    if (c.id && (typeof c.label !== 'string' || c.label.trim() === '')) {
      findings.push({
        severity: 'warning',
        code: 'CONTROL_EMPTY_LABEL',
        message: `Control "${c.id}" has no label — hard to debug visually`,
        controlId: c.id,
      });
    }
  }

  for (const f of findings) {
    if (f.severity === 'error') errors.push(`[${f.code}] ${f.message}`);
  }

  const errorCount = findings.filter((f) => f.severity === 'error').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;

  return {
    valid: errorCount === 0,
    errors,
    findings,
    errorCount,
    warningCount,
  };
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
 * Also runs a deterministic cycle detection on any JSON dependency array
 * found in the content (the LLM is unreliable at cycle detection; a
 * topological sort handles it perfectly).
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

  // Deterministic cycle detection on the JSON dependency array
  const cycleResult = detectBatchCycles(content);
  if (cycleResult.cycleMembers.length > 0) {
    errors.push(
      `Dependency cycle detected: ${cycleResult.cycleMembers.join(' → ')} → ${cycleResult.cycleMembers[0]}. ` +
      'Break this cycle and re-run.',
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parse a JSON dependency array out of pass-4-batches.md content and detect
 * cycles via Kahn's algorithm.
 *
 * Expected format (the extractor's SOUL guides toward this):
 *
 *   [
 *     { "batch": "A", "depends_on": [] },
 *     { "batch": "B", "depends_on": ["A"] },
 *     { "batch": "C", "depends_on": ["B"] }
 *   ]
 *
 * If no JSON array is found, returns empty (the LLM may have only produced
 * an ASCII DAG — caller should treat as "no cycle check possible" rather
 * than "no cycle"; existing required-content checks still apply).
 *
 * Exported for tests.
 */
export function detectBatchCycles(content: string): { cycleMembers: string[]; checked: boolean } {
  // Find the first JSON array of objects with `batch` + `depends_on`
  // Use a non-greedy match to handle multiple JSON blocks in the content
  const jsonMatches = content.matchAll(/\[\s*\{[\s\S]*?\}\s*\]/g);
  let deps: { batch: string; depends_on: string[] }[] | null = null;
  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match[0]);
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every(
          (e): e is { batch: string; depends_on: string[] } =>
            e && typeof e.batch === 'string' && Array.isArray(e.depends_on),
        )
      ) {
        deps = parsed;
        break;
      }
    } catch { /* not JSON or wrong shape, keep looking */ }
  }

  if (!deps) {
    return { cycleMembers: [], checked: false };
  }

  // Kahn's algorithm: nodes with 0 in-degree go first; repeat. Any unvisited
  // nodes at the end are part of a cycle.
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const node of deps) {
    if (!inDegree.has(node.batch)) inDegree.set(node.batch, 0);
    if (!adj.has(node.batch)) adj.set(node.batch, []);
    for (const dep of node.depends_on) {
      // edge: dep -> node.batch (dep must come before)
      if (!inDegree.has(dep)) inDegree.set(dep, 0);
      if (!adj.has(dep)) adj.set(dep, []);
      adj.get(dep)!.push(node.batch);
      inDegree.set(node.batch, (inDegree.get(node.batch) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [n, d] of inDegree) if (d === 0) queue.push(n);
  const visited = new Set<string>();
  while (queue.length > 0) {
    const n = queue.shift()!;
    visited.add(n);
    for (const next of adj.get(n) ?? []) {
      inDegree.set(next, (inDegree.get(next) ?? 0) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  const unvisited = Array.from(inDegree.keys()).filter((n) => !visited.has(n));
  return { cycleMembers: unvisited, checked: true };
}

/**
 * Validate the auditor's independent checklist: must have per-chapter summary,
 * must NOT reference extractor output files.
 */
export function validateIndependentChecklist(content: string): ValidationResult {
  const errors: string[] = [];

  // Must have section-level structure. Accept any of:
  //   - the literal word "chapter" or "section <N>" (e.g. "## Section 3:")
  //   - numbered markdown headings like "## 1. OVERVIEW" or "### 1.1 Intro"
  //   - 3+ markdown H2 headings (any titles — enough structure to count as
  //     a section-by-section breakdown)
  // The third rule lets well-structured outputs pass even when the auditor
  // uses bare topic names like "## OSC" / "## LFO" without numbering.
  const hasExplicitMarker = /chapter|section\s+\d/i.test(content);
  const numberedHeadingCount = (content.match(/^#{2,3}\s+\d+(\.\d+)?[.\s]/gm) ?? []).length;
  const totalH2Count = (content.match(/^##\s+/gm) ?? []).length;

  if (!hasExplicitMarker && numberedHeadingCount < 2 && totalH2Count < 3) {
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
  const warnings: string[] = [];
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

  // 3. Sections must have archetypes from known library.
  // Archetype only drives the initial Layout Engine output that contractor
  // overwrites by hand. Unknown archetype is logged as advisory, not a hard
  // error — pipeline shouldn't halt for something contractor repositions anyway.
  const knownArchetypes = new Set([
    'grid-NxM', 'single-column', 'single-row', 'anchor-layout',
    'cluster-above-anchor', 'cluster-below-anchor', 'dual-column', 'stacked-rows',
    'transport-pair',
  ]);
  for (const s of sections) {
    if (!s.archetype) {
      errors.push(`Section "${s.id}" missing archetype`);
      score -= 1.0;
    } else if (!knownArchetypes.has(s.archetype as string)) {
      warnings.push(`Section "${s.id}" has unknown archetype "${s.archetype}". Valid: ${[...knownArchetypes].join(', ')}`);
    }
  }

  // 4. Multi-container archetypes typically need containerAssignment.
  // Only matters for the Layout Engine's initial output (which contractor
  // overrides). Logged as advisory so admin can spot a wrong archetype choice
  // (e.g. anchor-layout on a single-control section) without halting pipeline.
  const needsContainers = new Set(['cluster-above-anchor', 'cluster-below-anchor', 'anchor-layout', 'dual-column']);
  const missingSections: string[] = [];
  for (const s of sections) {
    if (needsContainers.has(s.archetype as string) && !s.containerAssignment) {
      missingSections.push(s.id as string);
    }
  }
  if (missingSections.length > 0) {
    warnings.push(`Missing containerAssignment for: ${missingSections.join(', ')}. Either supply containerAssignment or pick a non-container archetype (single-row/single-column) for single-control sections.`);
  }

  // 5. All controls must be assigned to a section — HARD error.
  // The editor has no UI to add controls, so an orphaned control is unrecoverable
  // by the contractor and would silently render outside any section frame.
  const assignedControls = new Set(sections.flatMap(s => (s.controls ?? []) as string[]));
  const orphans = controls.filter(c => !assignedControls.has(c.id as string));
  if (orphans.length > 0) {
    errors.push(`${orphans.length} orphaned controls not assigned to any section: ${orphans.slice(0, 5).map(c => c.id).join(', ')}`);
    score -= 1.0;
  }

  // 5b. LED-button check (advisory). When a button's notes/label/description
  // evidence describes it as illuminated but hasLed !== true, surface this so
  // contractor (or admin) knows to toggle LED Style in Properties before
  // tutorials reference it via ledOn. Not a hard error — contractor can fix.
  const litKeywords = /illuminat|backlit|lights up|lit when|LED.{0,12}button|button.{0,12}LED|light.{0,5}on/i;
  const litButtonGaps: string[] = [];
  for (const c of controls) {
    if (c.type !== 'button' && c.type !== 'pad') continue;
    if (c.hasLed === true) continue;
    const evidence = [c.notes, c.description, c.label]
      .filter((s) => typeof s === 'string')
      .join(' ');
    if (evidence && litKeywords.test(evidence)) {
      litButtonGaps.push(c.id as string);
    }
  }
  if (litButtonGaps.length > 0) {
    warnings.push(
      `${litButtonGaps.length} button/pad control(s) appear to have integrated LEDs per their notes but hasLed is not set: ${litButtonGaps.slice(0, 8).join(', ')}. Tutorials using ledOn:true on these will not light them up. Set hasLed:true + ledStyle:'integrated' in the manifest (or contractor toggles LED Style in Properties).`
    );
  }

  // 6. Controls should have spatialNeighbors (enrichment — can be inferred from blueprint)
  const missingNeighbors = controls.filter(c => !c.spatialNeighbors);
  // Not a hard error — layout engine computes neighbors from diagram parser centroids

  // 7. Density targets (enrichment — layout engine has defaults)
  // Not a hard error — layout engine uses sensible defaults when missing

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
        // Tracked as auto-fix, not a real error (appended after valid check)
      }
    }
  }

  // 9. panelBoundingBox — sections should have global positioning data
  // Enrichment field — diagram parser provides this, gatekeeper copies it.
  // If missing, layout engine uses parser blueprint directly. Not a hard error.

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

  // 11. Visual enrichment — log as info only (NOT errors).
  // These fields are auto-fixed by the completeness validator. Including them in
  // errors[] makes valid=false which blocks the pipeline even when score >= 9.0.
  const totalControls = controls.length;
  if (totalControls > 0) {
    const missingShape = controls.filter(c => !c.shape).length;
    const missingSizeClass = controls.filter(c => !c.sizeClass).length;
    const missingLabelDisplay = controls.filter(c => !c.labelDisplay).length;

    // Log as info in errors array with "(auto-fixed)" suffix so they show in logs
    // but DON'T affect the valid flag — use a separate warnings array
    const autoFixInfo: string[] = [];
    if (missingShape > 0) {
      autoFixInfo.push(`${missingShape}/${totalControls} controls missing shape (auto-fixed)`);
    }
    if (missingSizeClass > 0) {
      autoFixInfo.push(`${missingSizeClass}/${totalControls} controls missing sizeClass (auto-fixed)`);
    }
    if (missingLabelDisplay > 0) {
      autoFixInfo.push(`${missingLabelDisplay}/${totalControls} controls missing labelDisplay (auto-fixed)`);
    }

    // valid is based on real errors only — auto-fix info + advisory warnings
    // are appended after for logging, prefixed so they're distinguishable.
    const valid = errors.length === 0;
    errors.push(...warnings.map((w) => `(advisory) ${w}`));
    errors.push(...autoFixInfo);
    score = Math.max(0, score);
    return { valid, errors, score };
  }

  // valid is based on real errors only — warnings appended after for logging
  const valid = errors.length === 0;
  errors.push(...warnings.map((w) => `(advisory) ${w}`));
  score = Math.max(0, score);
  return { valid, errors, score };
}

/**
 * LED-Group Split Validation (post-gatekeeper, deterministic).
 *
 * The diagram parser emits cluster controls as `type: "led-group"` with
 * `count: N` (where N > 1) and a names array (waveforms / voiceNumbers /
 * octaveLabels). The gatekeeper's L1 rule says: when count > 1, MUST split
 * into N individual `type: "led"` controls.
 *
 * This validator catches gatekeeper drift: if the parser reported count=7
 * but the manifest has only 1 LED control in that section, the gatekeeper
 * merged when it shouldn't have. Pure deterministic count check — no LLM.
 *
 * Behavior:
 *   - Aggregates expected LED counts per section across all led-group clusters
 *   - Compares against actual manifest LED count per section
 *   - Returns one error per under-split section, naming the offending cluster(s)
 *
 * Origin: K4 Layer 2 (LED indicators systemic fix, 2026-05-09).
 */
export function validateLedGroupSplitting(
  manifestJson: string,
  blueprintJson: string
): ValidationResult {
  const errors: string[] = [];

  let manifest: { controls?: Array<Record<string, unknown>> };
  let blueprint: Blueprint;
  try {
    manifest = JSON.parse(manifestJson);
  } catch (e) {
    return { valid: false, errors: [`Manifest JSON parse failed: ${(e as Error).message}`] };
  }
  try {
    blueprint = normalizeBlueprint(JSON.parse(blueprintJson));
  } catch (e) {
    return { valid: false, errors: [`Blueprint JSON parse failed: ${(e as Error).message}`] };
  }

  const manifestControls = (manifest.controls ?? []) as Array<{
    id?: string;
    type?: string;
    sectionId?: string;
  }>;

  // Aggregate expected LED counts per section across all led-group clusters.
  const expectedPerSection = new Map<string, { totalCount: number; clusters: string[] }>();
  for (const section of blueprint.sections) {
    for (const control of section.controls as Array<BlueprintControl & { type?: string; count?: number }>) {
      if (control.type !== 'led-group') continue;
      const count = control.count;
      if (typeof count !== 'number' || count <= 1) continue;
      const acc = expectedPerSection.get(section.sectionId) ?? { totalCount: 0, clusters: [] };
      acc.totalCount += count;
      acc.clusters.push(String(control.id));
      expectedPerSection.set(section.sectionId, acc);
    }
  }

  // For each section that should have split LEDs, count actual LED controls.
  for (const [sectionId, expected] of expectedPerSection) {
    const actualLeds = manifestControls.filter(
      (c) => c.type === 'led' && c.sectionId === sectionId
    );
    if (actualLeds.length < expected.totalCount) {
      const clusterList = expected.clusters.join(', ');
      const plural = expected.clusters.length > 1 ? 'clusters' : 'cluster';
      errors.push(
        `LED-group splitting failed in section "${sectionId}": expected ${expected.totalCount} ` +
        `split LED controls (from ${plural} ${clusterList}), but manifest has ${actualLeds.length}. ` +
        `Per the indicator-splitting rule, when the diagram parser reports type:"led-group" with ` +
        `count > 1, the gatekeeper MUST emit one type:"led" control per LED — geometric evidence ` +
        `from the parser overrides textual phrasing in the manual.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
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
  let blueprint: Blueprint;

  try {
    manifest = JSON.parse(manifestJson);
    blueprint = normalizeBlueprint(JSON.parse(blueprintJson));
  } catch {
    return { valid: false, errors: ['Could not parse JSON'], mismatches: [] };
  }

  for (const mSection of manifest.sections) {
    const bSection = blueprint.sections.find(bs =>
      bs.sectionId === mSection.id ||
      bs.sectionId?.toLowerCase().includes(mSection.id.replace(/-/g, '').toLowerCase())
    );
    if (!bSection || bSection.controls.length < 2) continue;

    const centroids = bSection.controls.map(c => c.centroid).filter((c): c is { x: number; y: number } => !!c);
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
  let blueprint: Blueprint;

  try {
    manifest = JSON.parse(manifestJson);
    blueprint = normalizeBlueprint(JSON.parse(blueprintJson));
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

/** Normalize blueprint.sections — agent may output as object or array */
function normalizeBlueprint(raw: Record<string, unknown>): Blueprint {
  let sections: BlueprintSection[] = [];
  if (Array.isArray(raw.sections)) {
    sections = raw.sections;
  } else if (raw.sections && typeof raw.sections === 'object') {
    // Convert object { sectionId: { controls: [...] } } to array
    sections = Object.entries(raw.sections as Record<string, unknown>).map(([key, val]) => ({
      sectionId: key,
      controls: (val as { controls?: BlueprintControl[] })?.controls ?? [],
      ...(val as Record<string, unknown>),
    })) as BlueprintSection[];
  }
  return { ...raw, sections } as Blueprint;
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
      blueprint = normalizeBlueprint(JSON.parse(blueprintJson));
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

    // Rule 16: Missing shape on any remaining type → default shape
    if (!c.shape) {
      const defaultShape = (['knob', 'encoder', 'wheel', 'dial'].includes(c.type)) ? 'circle' : 'rectangle';
      autoFixes.push({ controlId: c.id, field: 'shape', from: c.shape, to: defaultShape, rule: 'default-shape-fallback' });
      c.shape = defaultShape;
    }

    // Rule 17: Missing labelDisplay → default based on type
    if (!c.labelDisplay) {
      const defaultDisplay = c.type === 'led' ? 'below' : c.type === 'port' || c.type === 'slot' ? 'hidden' : 'above';
      autoFixes.push({ controlId: c.id, field: 'labelDisplay', from: c.labelDisplay, to: defaultDisplay, rule: 'default-labelDisplay-fallback' });
      c.labelDisplay = defaultDisplay;
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

    // shape, sizeClass, labelDisplay — scored AFTER auto-fixes have run.
    // Only penalize if still missing after auto-fix (e.g., button without shape
    // has no auto-fix rule, so it's a real gap from the gatekeeper).
    if (!c.shape) {
      score -= 0.5;
      missing.push({ controlId: c.id, field: 'shape', severity: 'major' });
    }
    if (!c.sizeClass) {
      score -= 0.5;
      missing.push({ controlId: c.id, field: 'sizeClass', severity: 'major' });
    }
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

// ─────────────────────────────────────────────────────────────────────────────
// Display Builder validators
//
// Run after doPhase5DisplayBuild's invokeAgent returns. Mechanical post-checks
// that prevent the agent from gaming the system with stub files or
// cross-device contamination.
//
// See plan: docs/plans/2026-04-30-display-builder-agent.md
// See SOUL: .claude/agents/display-builder.md
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the device-theme.json output from Pass 1 (Style Probe).
 * Required fields, valid hex colors, displayDimensions present.
 */
export function validateDeviceTheme(themeJson: string): ValidationResult {
  const errors: string[] = [];
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(themeJson);
  } catch (e) {
    return { valid: false, errors: [`device-theme.json is not valid JSON: ${(e as Error).message}`] };
  }

  // Accept either flat (backgroundColor) or new schema (background) — SOUL has both
  const bg = parsed.background ?? parsed.backgroundColor;
  const text = parsed.textColor ?? parsed.primary;
  if (typeof bg !== 'string') errors.push('Missing required field: background/backgroundColor');
  if (typeof text !== 'string') errors.push('Missing required field: textColor/primary');

  const hexLike = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))$/i;
  for (const [key, val] of Object.entries(parsed)) {
    if (typeof val === 'string' && (key.toLowerCase().includes('color') || ['background', 'primary', 'secondary', 'danger', 'headerBg', 'borderColor'].includes(key))) {
      if (!hexLike.test(val)) {
        errors.push(`${key}: not a valid color value (got "${val}")`);
      }
    }
  }

  if (!parsed.fontFamily) errors.push('Missing fontFamily');
  if (!parsed.fontSize && !parsed.fontSizes) errors.push('Missing fontSize/fontSizes object');

  return { valid: errors.length === 0, errors };
}

interface ScreenInventoryEntry {
  id: string;
  component: string;
  description?: string;
  manualPages?: string;
  controlsThatOpen?: string[];
  props?: string[];
  confidence?: 'high' | 'low';
}

/**
 * Validates the screen-inventory.json output.
 * IDs unique, component names valid, manual page refs non-empty for high-confidence entries.
 */
export function validateScreenInventory(inventoryJson: string): ValidationResult {
  const errors: string[] = [];
  let parsed: { deviceId?: string; screenTypes?: ScreenInventoryEntry[] };
  try {
    parsed = JSON.parse(inventoryJson);
  } catch (e) {
    return { valid: false, errors: [`screen-inventory.json is not valid JSON: ${(e as Error).message}`] };
  }

  if (!parsed.deviceId) errors.push('Missing deviceId field');
  if (!Array.isArray(parsed.screenTypes)) {
    return { valid: false, errors: ['screen-inventory.json must contain screenTypes array'] };
  }
  if (parsed.screenTypes.length === 0) {
    errors.push('screen-inventory.json has no screen types');
  }

  const ids = new Set<string>();
  const componentNamePattern = /^[A-Z][A-Za-z0-9]*Screen$/;

  parsed.screenTypes.forEach((entry, idx) => {
    if (!entry.id) {
      errors.push(`screenTypes[${idx}]: missing id`);
    } else if (ids.has(entry.id)) {
      errors.push(`screenTypes[${idx}]: duplicate id "${entry.id}"`);
    } else {
      ids.add(entry.id);
    }
    if (!entry.component) {
      errors.push(`screenTypes[${idx}]: missing component`);
    } else if (!componentNamePattern.test(entry.component)) {
      errors.push(`screenTypes[${idx}]: component "${entry.component}" doesn't match PascalCase + "Screen" suffix`);
    }
    // High-confidence entries must cite the manual; low-confidence stubs are exempt.
    if (entry.confidence !== 'low' && !entry.manualPages) {
      errors.push(`screenTypes[${idx}] (${entry.id}): missing manualPages reference`);
    }
  });

  // Every device must include a home/idle screen — SOUL rule G3.
  const hasHome = parsed.screenTypes.some(e => e.id === 'home' || /home|idle|default/i.test(e.id));
  if (!hasHome) {
    errors.push('No home/idle screen found — every device must have a default screen');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the actual TSX screen component files exist + don't reference other devices.
 *
 * Anti-anchoring grep: the new device's display directory must not contain
 * strings matching other known device IDs. Catches the contamination failure
 * mode where the agent inadvertently copies from src/components/devices/<other>/.
 *
 * Caller provides:
 *   - deviceId — this device, used to exclude its own name from the grep
 *   - files — Map<relativePath, fileContents> for every file under
 *             src/components/devices/<deviceId>/display/
 *   - inventory — parsed screen-inventory.json (use validateScreenInventory first)
 *
 * Checks:
 *   - Every component in inventory has a matching TSX file
 *   - Each TSX file contains a named export matching its component
 *   - Each TSX file is at least 30 LOC of substantive JSX (catches stubs that pass size check)
 *   - No file references any other known device name (anti-anchoring)
 */
export function validateDisplayComponents(opts: {
  deviceId: string;
  files: Map<string, string>;
  inventory: ScreenInventoryEntry[];
  knownOtherDevices?: string[];
}): ValidationResult {
  const { deviceId, files, inventory } = opts;
  // Default exclude list — these are device IDs from existing src/components/devices/*
  const otherDevices = (opts.knownOtherDevices ?? [
    'fantom-08', 'fantom-06', 'cdj-3000', 'alphatheta-cdj3000x', 'deepmind-12',
    'ddj-flx4', 'dj-djs-1000', 'dj-xdj-rx3', 'rc505-mk2',
  ]).filter(d => d !== deviceId);

  const errors: string[] = [];

  for (const entry of inventory) {
    // Skip low-confidence stubs — they're allowed to be sparse + tagged TODO
    if (entry.confidence === 'low') continue;

    const tsxPath = `screens/${entry.component}.tsx`;
    const content = files.get(tsxPath);
    if (!content) {
      errors.push(`Missing TSX file for "${entry.id}" — expected ${tsxPath}`);
      continue;
    }
    // Named export check
    const exportPattern = new RegExp(`export\\s+(default\\s+)?(function|const|class)\\s+${entry.component}\\b`);
    if (!exportPattern.test(content)) {
      errors.push(`${tsxPath}: missing named export "${entry.component}"`);
    }
    // Substantive content: count non-blank non-comment lines, must be > 30
    const substantiveLines = content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
      .length;
    if (substantiveLines < 30) {
      errors.push(`${tsxPath}: only ${substantiveLines} substantive lines (stub-like; agent should mark confidence:'low' or build the real component)`);
    }
  }

  // Anti-anchoring grep across all files
  for (const [relPath, content] of files.entries()) {
    for (const other of otherDevices) {
      // Word-boundary match so 'cdj-3000' doesn't match 'cdj-3000x' as a false positive
      const wordRe = new RegExp(`\\b${other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (wordRe.test(content)) {
        errors.push(`${relPath}: contains reference to "${other}" — anti-anchoring violation`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Cross-checks screen-inventory.json against manual-extractor's pass-1-inventory.md
 * to ensure every screen listed in the extractor's output has a corresponding entry.
 *
 * Caller provides:
 *   - inventory — parsed screen-inventory.json entries
 *   - pass1Content — raw content of pass-1-inventory.md
 *
 * The check is heuristic: it pulls all bullet-style screen names from the markdown
 * and looks for a matching id or description in the inventory. Low-confidence stubs
 * count toward coverage (they're explicit placeholders, not fabrications).
 */
export function validateInventoryCompleteness(opts: {
  inventory: ScreenInventoryEntry[];
  pass1Content: string;
}): ValidationResult {
  const errors: string[] = [];
  const { inventory, pass1Content } = opts;

  // Extract candidate screen names from pass1 — looks for "X screen" patterns
  // (case-insensitive, tolerates hyphenation and parenthetical clarifications)
  const screenMentions = new Set<string>();
  const screenPattern = /(?:^|\W)([A-Z][A-Za-z0-9\- ]{1,30})\s+screen\b/gm;
  let m;
  while ((m = screenPattern.exec(pass1Content)) !== null) {
    const cleaned = m[1].trim().toLowerCase().replace(/\s+/g, '-');
    if (cleaned.length > 1) screenMentions.add(cleaned);
  }

  if (screenMentions.size === 0) {
    // pass-1-inventory.md doesn't follow the expected "X screen" pattern;
    // we can't validate completeness mechanically. Not an error — just skip.
    return { valid: true, errors: [] };
  }

  // For each extracted screen mention, look for a match in inventory ids OR descriptions
  const missingMentions: string[] = [];
  for (const mention of screenMentions) {
    const hit = inventory.some(e => {
      if (e.id.toLowerCase().includes(mention)) return true;
      if (mention.includes(e.id.toLowerCase())) return true;
      if (e.description?.toLowerCase().includes(mention.replace(/-/g, ' '))) return true;
      return false;
    });
    if (!hit) missingMentions.push(mention);
  }

  if (missingMentions.length > 0) {
    errors.push(`Manual screens missing from screen-inventory.json: ${missingMentions.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}
