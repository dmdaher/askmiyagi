/**
 * Attention Inventory — aggregates auto-repair events + unrepairable findings
 * across every pipeline device into a single sorted list the admin reviews
 * on their schedule.
 *
 * Sources:
 *   - `.pipeline/<id>/repair-log.jsonl` (append-only; written by manifest API
 *     routes when repairManifest() makes changes)
 *   - `.pipeline/<id>/state.json` `requiresAdminReview` flag (set when
 *     unrepairable findings surface)
 *
 * Reviewed status:
 *   - `.pipeline/attention-reviewed.json` — { [itemId]: { reviewedAt } }
 *
 * Pure function — no side effects. Caller (API route) handles HTTP.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { Severity, RepairChange } from './manifest-repair';
import type { PostEditorFinding } from './checkpoint-validators';

// Inlined from manifest-repair to avoid a Turbopack 16.1.6 production-build
// resolution bug — when the import was named, Vercel's build failed with
// "Cannot find findingSeverity" against this exact line, even though the
// export existed. Inlining is fine: 4 lines, no shared state.
//
// TODO(2026-Q3): once Vercel's default Next.js detection catches up to
// 16.2.6+ (current default is 16.1.6), revert to importing findingSeverity
// from './manifest-repair' to remove this duplication.
const CRITICAL_CODES = new Set([
  'INVALID_JSON',
  'NO_CONTROLS',
  'NO_SECTIONS',
  'CONTROL_MISSING_ID',
  'SECTION_MISSING_ID',
  'CONTROL_ID_DUPLICATE',
  'SECTION_ID_DUPLICATE',
]);
function findingSeverity(code: string): Severity {
  if (CRITICAL_CODES.has(code)) return 'critical';
  if (code === 'CONTROL_ORPHAN_SECTION' || code === 'LABEL_ORPHAN_CONTROL') return 'high';
  return 'medium';
}

const PIPELINE_DIR = '.pipeline';
const REVIEWED_FILE = join(PIPELINE_DIR, 'attention-reviewed.json');

export interface AttentionItem {
  /** Stable id for marking reviewed. Composed from device + timestamp + index. */
  id: string;
  deviceId: string;
  severity: Severity;
  /** Short kind tag (e.g. 'label-orphan-null', 'unrepairable-finding') */
  kind: string;
  /** Human-readable headline for the inventory row */
  description: string;
  /** Suggested next action for admin (could be 'No action — informational' for medium) */
  suggestedAction: string;
  /** Optional recovery payload — e.g. the previousControlId that was stripped */
  originalState?: Record<string, unknown>;
  /** ISO timestamp when this was logged */
  timestamp: string;
  reviewed: boolean;
}

interface RepairLogEntry {
  timestamp: string;
  changes: RepairChange[];
  unrepairableFindings: PostEditorFinding[];
  bailed: boolean;
}

interface ReviewedStore {
  [itemId: string]: { reviewedAt: string };
}

function readReviewed(): ReviewedStore {
  if (!existsSync(REVIEWED_FILE)) return {};
  try {
    return JSON.parse(readFileSync(REVIEWED_FILE, 'utf-8')) as ReviewedStore;
  } catch {
    return {};
  }
}

function describeChange(rawChange: RepairChange | { kind: string; [k: string]: unknown }): { description: string; suggestedAction: string; originalState?: Record<string, unknown> } {
  // Admin actions (audit-only records, auto-reviewed)
  if (rawChange.kind === 'admin-relink-apply') {
    const prev = (rawChange as { previousControlId?: string }).previousControlId;
    const next = (rawChange as { newControlId?: string }).newControlId;
    return {
      description: `Admin re-linked: "${prev}" → "${next}"`,
      suggestedAction: 'No action — admin action recorded for audit.',
      originalState: { previousControlId: prev, newControlId: next },
    };
  }
  if (rawChange.kind === 'admin-relink-undo') {
    const restored = (rawChange as { backupRestored?: string }).backupRestored;
    return {
      description: `Admin undid a re-link (restored from ${restored})`,
      suggestedAction: 'No action — admin action recorded for audit.',
    };
  }
  const change = rawChange as RepairChange;
  switch (change.kind) {
    case 'label-orphan-null':
      return {
        description: `Label "${change.labelId}" was detached from missing control "${change.previousControlId}".`,
        suggestedAction: `If "${change.previousControlId}" was renamed/split, re-link the label to the new ID. Otherwise leave standalone or delete.`,
        originalState: { previousControlId: change.previousControlId, labelId: change.labelId },
      };
    case 'container-strip':
      return {
        description: `Container "${change.containerId}" lost reference to missing control "${change.controlId}".`,
        suggestedAction: 'No action — cosmetic. Re-add the control to the container if it was renamed.',
        originalState: { containerId: change.containerId, controlId: change.controlId },
      };
    case 'container-dissolve':
      return {
        description: `Container "${change.containerId}" was dissolved (all member controls deleted).`,
        suggestedAction: 'No action — informational. Re-create the container if it was needed.',
        originalState: { containerId: change.containerId, originalControlIds: change.originalControlIds },
      };
    case 'grouplabel-strip':
      return {
        description: `Group label "${change.groupLabelId}" lost reference to missing control "${change.controlId}".`,
        suggestedAction: 'No action — cosmetic.',
        originalState: { groupLabelId: change.groupLabelId, controlId: change.controlId },
      };
    case 'grouplabel-dissolve':
      return {
        description: `Group label "${change.groupLabelId}" was dissolved (all member controls deleted).`,
        suggestedAction: 'No action — informational.',
        originalState: { groupLabelId: change.groupLabelId, originalControlIds: change.originalControlIds },
      };
    case 'section-childids-strip':
      return {
        description: `Section "${change.sectionId}" childIds list lost reference to missing control "${change.controlId}".`,
        suggestedAction: 'No action — cosmetic, panel still renders correctly.',
        originalState: { sectionId: change.sectionId, controlId: change.controlId },
      };
    default:
      return {
        description: `Repair: ${(change as { kind: string }).kind}`,
        suggestedAction: 'See repair log for details.',
      };
  }
}

function describeFinding(f: PostEditorFinding): { description: string; suggestedAction: string } {
  switch (f.code) {
    case 'CONTROL_ORPHAN_SECTION':
      return {
        description: `Control "${f.controlId}" points at non-existent section "${f.sectionId}".`,
        suggestedAction: 'Open editor, drag the control into a real section OR clear its sectionId.',
      };
    case 'CONTROL_ID_DUPLICATE':
      return {
        description: `Duplicate control id detected: "${f.controlId}". Tutorials may reference the wrong control.`,
        suggestedAction: 'Critical: regenerate manifest from gatekeeper or manually deduplicate.',
      };
    case 'SECTION_ID_DUPLICATE':
      return {
        description: `Duplicate section id detected: "${f.sectionId}".`,
        suggestedAction: 'Critical: regenerate manifest or manually deduplicate.',
      };
    case 'NO_CONTROLS':
      return {
        description: 'Manifest has no controls — pipeline gatekeeper failed upstream.',
        suggestedAction: 'Critical: re-run gatekeeper or upload a new manifest.',
      };
    case 'NO_SECTIONS':
      return {
        description: 'Manifest has no sections — pipeline layout engine failed.',
        suggestedAction: 'Critical: re-run layout engine.',
      };
    default:
      return {
        description: f.message,
        suggestedAction: 'Inspect repair log for context.',
      };
  }
}

/**
 * Severity levels that EVER reach the admin inventory. Medium/low events
 * (container dissolved, section.childIds strip, format warnings) still get
 * written to `repair-log.jsonl` for forensic purposes, but they don't
 * belong in the admin UI — they're not actionable and admin can't decide
 * anything about them.
 *
 * Engineering can grep the JSONL directly if they ever need to investigate.
 */
const INVENTORY_SEVERITIES: Set<Severity> = new Set(['critical', 'high']);

/**
 * Change kinds that represent ADMIN ACTIONS (not findings). They appear in
 * the inventory for audit purposes but are auto-marked reviewed so they
 * don't clutter the "needs review" view. Admin can find them via
 * "Show reviewed" toggle.
 */
const ADMIN_ACTION_KINDS = new Set(['admin-relink-apply', 'admin-relink-undo']);

/**
 * Aggregate every actionable repair event + admin-review flag across all
 * devices. Returns items sorted: critical → high, newest first.
 *
 * Medium/low repairs are deliberately excluded — see INVENTORY_SEVERITIES.
 */
export function loadAttentionItems(): AttentionItem[] {
  if (!existsSync(PIPELINE_DIR)) return [];

  const reviewed = readReviewed();
  const items: AttentionItem[] = [];

  const deviceDirs = readdirSync(PIPELINE_DIR).filter((name) => {
    if (name === 'attention-reviewed.json' || name === 'saved') return false;
    try {
      return statSync(join(PIPELINE_DIR, name)).isDirectory();
    } catch {
      return false;
    }
  });

  for (const deviceId of deviceDirs) {
    // ── Source 1: repair-log.jsonl ────────────────────────────────────
    const logPath = join(PIPELINE_DIR, deviceId, 'repair-log.jsonl');
    if (existsSync(logPath)) {
      const lines = readFileSync(logPath, 'utf-8').split('\n').filter((l) => l.trim());
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        let entry: RepairLogEntry;
        try {
          entry = JSON.parse(lines[lineIdx]);
        } catch {
          continue;
        }

        // Repair changes → one item each (only high+critical reach inventory).
        // Admin actions (relink-apply / relink-undo) are auto-marked reviewed
        // so they're an audit record only, not a "needs review" item.
        for (let chgIdx = 0; chgIdx < (entry.changes ?? []).length; chgIdx++) {
          const change = entry.changes[chgIdx];
          const severity = change.severity ?? 'medium';
          if (!INVENTORY_SEVERITIES.has(severity)) continue;
          const id = `${deviceId}:${entry.timestamp}:c${lineIdx}-${chgIdx}`;
          const info = describeChange(change);
          const autoReviewed = ADMIN_ACTION_KINDS.has(change.kind);
          items.push({
            id,
            deviceId,
            severity,
            kind: change.kind,
            description: info.description,
            suggestedAction: info.suggestedAction,
            originalState: info.originalState,
            timestamp: entry.timestamp,
            reviewed: autoReviewed || id in reviewed,
          });
        }

        // Unrepairable findings → one item each (only high+critical reach inventory)
        for (let findIdx = 0; findIdx < (entry.unrepairableFindings ?? []).length; findIdx++) {
          const f = entry.unrepairableFindings[findIdx];
          const severity = findingSeverity(f.code);
          if (!INVENTORY_SEVERITIES.has(severity)) continue;
          const id = `${deviceId}:${entry.timestamp}:u${lineIdx}-${findIdx}`;
          const info = describeFinding(f);
          items.push({
            id,
            deviceId,
            severity,
            kind: f.code,
            description: info.description,
            suggestedAction: info.suggestedAction,
            originalState: { code: f.code, controlId: f.controlId, sectionId: f.sectionId },
            timestamp: entry.timestamp,
            reviewed: id in reviewed,
          });
        }
      }
    }
  }

  // Sort: critical → high, newest first within tier
  const severityRank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const sevDiff = severityRank[a.severity] - severityRank[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return items;
}

/** Counts by severity for the dashboard badge. */
export function countBySeverity(items: AttentionItem[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const item of items) {
    if (!item.reviewed) counts[item.severity]++;
  }
  return counts;
}
