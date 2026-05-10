/**
 * Manifest auto-repair — runs server-side on manifest GET + PUT.
 *
 * Scope: surgically clean up SAFE orphan references (label/container/groupLabel
 * pointing at non-existent controls; section.childIds entries pointing at
 * non-existent controls). NEVER touches:
 *   - Control records themselves (we never invent or delete controls)
 *   - Section records themselves
 *   - Anything that requires guessing contractor intent
 *
 * What it does NOT repair (escalates to admin instead):
 *   - Missing top-level fields, NO_CONTROLS, NO_SECTIONS
 *   - Duplicate IDs (we cannot safely pick which to keep)
 *   - Missing control IDs (CONTROL_MISSING_ID)
 *   - Mutual section disagreement (case 2/3: both targets exist but disagree)
 *   - Mass corruption (diff cap exceeded — bounded blast radius)
 *
 * Mandatory mitigations (enforced by the callers in API routes):
 *   1. Pre-repair backup of the original manifest before any write
 *   2. Idempotency: repair(repair(M)) === repair(M) — covered by tests
 *   3. Diff cap: if changes > MAX_AUTO_REPAIRS, bail and escalate
 *   4. Audit log: every change appended to .pipeline/<id>/repair-log.jsonl
 *
 * Origin 2026-05-10: post-editor validator (PR #104) catches drift at pipeline
 * resume time but bad UX — pipeline halts hours after the save. Auto-repair
 * closes the latency by handling trivial fixes server-side at save time,
 * keeping the contractor's experience clean.
 */

import type { ValidationResult } from './checkpoint-validators';
import { validatePostEditorManifest, type PostEditorFinding } from './checkpoint-validators';

/** Maximum number of auto-repairs in a single pass. Above this, we bail and
 *  escalate — protects against mass-corruption upstream silently destroying
 *  large numbers of references. Manual admin review required above the cap. */
export const MAX_AUTO_REPAIRS = 10;

export type RepairChange =
  | { kind: 'container-strip'; containerId: string; controlId: string }
  | { kind: 'container-dissolve'; containerId: string }
  | { kind: 'grouplabel-strip'; groupLabelId: string; controlId: string }
  | { kind: 'grouplabel-dissolve'; groupLabelId: string }
  | { kind: 'label-orphan-null'; labelId: string; previousControlId: string }
  | { kind: 'section-childids-strip'; sectionId: string; controlId: string };

export interface RepairResult extends ValidationResult {
  /** Post-repair manifest as a JSON-serializable object. */
  repaired: unknown;
  /** Itemized list of every change made. */
  changes: RepairChange[];
  /** Findings the repair function refuses to auto-fix; admin must resolve. */
  unrepairableFindings: PostEditorFinding[];
  /** True if the diff cap was hit — repair aborted, manifest returned unchanged. */
  bailed: boolean;
}

// Codes the repair function knows how to fix safely.
const REPAIRABLE_CODES = new Set([
  'CONTAINER_ORPHAN',
  'GROUPLABEL_ORPHAN',
  'LABEL_ORPHAN_CONTROL',
  'SECTION_CHILD_ORPHAN',
]);

// Codes that always escalate (we explicitly do not try to repair).
const ESCALATE_CODES = new Set([
  'INVALID_JSON',
  'NO_CONTROLS',
  'NO_SECTIONS',
  'CONTROL_MISSING_ID',
  'SECTION_MISSING_ID',
  'CONTROL_ID_DUPLICATE',
  'SECTION_ID_DUPLICATE',
  'CONTROL_ORPHAN_SECTION',
]);

type AnyManifest = {
  controls?: Record<string, { id?: string }> | Array<{ id?: string }>;
  sections?: Record<string, { id?: string; childIds?: string[] }> | Array<{ id?: string; childIds?: string[] }>;
  editorLabels?: Array<{ id?: string; controlId?: string | null; sectionId?: string }>;
  controlContainers?: Array<{ id?: string; controlIds?: string[] }>;
  groupLabels?: Array<{ id?: string; controlIds?: string[] }>;
  [k: string]: unknown;
};

function collectValidControlIds(manifest: AnyManifest): Set<string> {
  const out = new Set<string>();
  const src = manifest.controls;
  if (!src) return out;
  const list = Array.isArray(src) ? src : Object.values(src);
  for (const c of list) {
    if (typeof c?.id === 'string' && c.id.trim() !== '') out.add(c.id);
  }
  return out;
}

function collectValidSectionIds(manifest: AnyManifest): Set<string> {
  const out = new Set<string>();
  const src = manifest.sections;
  if (!src) return out;
  const list = Array.isArray(src) ? src : Object.values(src);
  for (const s of list) {
    if (typeof s?.id === 'string' && s.id.trim() !== '') out.add(s.id);
  }
  return out;
}

/**
 * Repair a manifest in memory. PURE function — no I/O, no mutation of input.
 * Callers (API routes) are responsible for backup + audit log + persistence.
 */
export function repairManifest(manifestJson: string): RepairResult {
  let manifest: AnyManifest;
  try {
    manifest = JSON.parse(manifestJson);
  } catch {
    return {
      valid: false,
      errors: ['Manifest is not valid JSON — cannot repair'],
      repaired: manifestJson,
      changes: [],
      unrepairableFindings: [{ severity: 'error', code: 'INVALID_JSON', message: 'Manifest is not valid JSON' }],
      bailed: true,
    };
  }

  // Re-use the existing validator to enumerate findings.
  const validation = validatePostEditorManifest(manifestJson);

  // Sort findings into repairable vs escalate.
  const repairable: PostEditorFinding[] = [];
  const unrepairable: PostEditorFinding[] = [];
  for (const f of validation.findings) {
    if (f.severity === 'warning') continue; // warnings aren't acted on
    if (ESCALATE_CODES.has(f.code)) {
      unrepairable.push(f);
    } else if (REPAIRABLE_CODES.has(f.code)) {
      repairable.push(f);
    } else {
      // Unknown error code — conservative: escalate
      unrepairable.push(f);
    }
  }

  // Diff cap — protects against mass-corruption blind repair.
  // We count "repairable" findings (each = at least one change). If above cap,
  // bail entirely and let admin review.
  if (repairable.length > MAX_AUTO_REPAIRS) {
    return {
      valid: false,
      errors: validation.errors,
      repaired: manifest,
      changes: [],
      unrepairableFindings: [...unrepairable, ...repairable],
      bailed: true,
    };
  }

  // Build sets we'll consult during repair. Compute once.
  const validControlIds = collectValidControlIds(manifest);
  // (validSectionIds unused for now — repair scope only touches control-ref orphans)

  const changes: RepairChange[] = [];

  // Deep-ish clone (only the parts we mutate).
  const out: AnyManifest = { ...manifest };

  // ── Repair 1: controlContainers — strip orphan control refs ────────────
  if (Array.isArray(out.controlContainers)) {
    out.controlContainers = out.controlContainers
      .map(c => {
        if (!c.controlIds) return c;
        const filtered = c.controlIds.filter(id => {
          if (validControlIds.has(id)) return true;
          changes.push({ kind: 'container-strip', containerId: c.id ?? '?', controlId: id });
          return false;
        });
        return { ...c, controlIds: filtered };
      })
      .filter(c => {
        // Dissolve empty containers
        if ((c.controlIds?.length ?? 0) === 0) {
          changes.push({ kind: 'container-dissolve', containerId: c.id ?? '?' });
          return false;
        }
        return true;
      });
  }

  // ── Repair 2: groupLabels — strip orphan control refs ──────────────────
  if (Array.isArray(out.groupLabels)) {
    out.groupLabels = out.groupLabels
      .map(g => {
        if (!g.controlIds) return g;
        const filtered = g.controlIds.filter(id => {
          if (validControlIds.has(id)) return true;
          changes.push({ kind: 'grouplabel-strip', groupLabelId: g.id ?? '?', controlId: id });
          return false;
        });
        return { ...g, controlIds: filtered };
      })
      .filter(g => {
        if ((g.controlIds?.length ?? 0) === 0) {
          changes.push({ kind: 'grouplabel-dissolve', groupLabelId: g.id ?? '?' });
          return false;
        }
        return true;
      });
  }

  // ── Repair 3: editorLabels — null orphan controlId (label becomes standalone) ──
  if (Array.isArray(out.editorLabels)) {
    out.editorLabels = out.editorLabels.map(l => {
      if (!l.controlId) return l;
      if (validControlIds.has(l.controlId)) return l;
      changes.push({ kind: 'label-orphan-null', labelId: l.id ?? '?', previousControlId: l.controlId });
      return { ...l, controlId: null };
    });
  }

  // ── Repair 4: section.childIds — strip orphan control refs ──────────────
  // Handles both Record and Array shapes.
  if (out.sections) {
    if (Array.isArray(out.sections)) {
      out.sections = out.sections.map(s => {
        if (!s.childIds) return s;
        const filtered = s.childIds.filter(id => {
          if (validControlIds.has(id)) return true;
          changes.push({ kind: 'section-childids-strip', sectionId: s.id ?? '?', controlId: id });
          return false;
        });
        return { ...s, childIds: filtered };
      });
    } else {
      const updated: Record<string, { id?: string; childIds?: string[] }> = {};
      for (const [key, s] of Object.entries(out.sections)) {
        if (!s.childIds) {
          updated[key] = s;
          continue;
        }
        const filtered = s.childIds.filter(id => {
          if (validControlIds.has(id)) return true;
          changes.push({ kind: 'section-childids-strip', sectionId: s.id ?? key, controlId: id });
          return false;
        });
        updated[key] = { ...s, childIds: filtered };
      }
      out.sections = updated;
    }
  }

  return {
    valid: unrepairable.length === 0,
    errors: unrepairable.map(f => `[${f.code}] ${f.message}`),
    repaired: out,
    changes,
    unrepairableFindings: unrepairable,
    bailed: false,
  };
}
