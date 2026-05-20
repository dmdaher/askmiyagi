/**
 * Canvas QA — deterministic layers (1 + 3).
 *
 * Imported by the pipeline runner at the tutorial-review pause. These
 * layers need only the manifest + tutorials JSON; no browser, no dev
 * server. Output is `.pipeline/<deviceId>/agents/tutorial-review/qa-report.json`,
 * surfaced on the admin canvas via the review-tutorials API.
 *
 * Layer 2 (visual highlight verification) is in `e2e/canvas-qa-suite.ts`
 * and stays out of the pipeline hot path — it needs a running dev server
 * and can be re-run on demand from the canvas.
 *
 * Design doc: docs/canvas-qa-framework.md
 */
import fs from 'fs';
import path from 'path';
import { readOrphanIntentions, type OrphanIntentionMap } from './orphan-intentions';

export type Severity = 'fail' | 'warn' | 'ok';

export interface QaResult {
  layer: number;
  name: string;
  severity: Severity;
  message: string;
  details?: unknown;
}

/**
 * Layer 1b orphan detail row. May include an agent-produced diagnosis
 * (category A/B/C/D + reason + recommended action). When diagnosis is
 * absent the canvas renders a "Diagnose" button to invoke the agent.
 */
export interface OrphanDetail {
  controlId: string;
  label: string | null;
  /** Heuristic hint visible before agent diagnosis (e.g., `-copy` suffix). */
  hint?: string;
  /** Agent-produced diagnosis (PR-H). Optional — canvas surfaces a button to fetch it when missing. */
  diagnosis?: {
    category: 'A' | 'B' | 'C' | 'D';
    categoryName: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
    citation: string;
    suggestedAction: 'delete' | 'mark-intentional' | 'suggest-tutorial';
    pairedWith?: string | null;
    suggestedTutorial?: {
      title: string;
      description: string;
      estimatedSteps?: number;
      manualPages?: string;
      category?: string;
    } | null;
    diagnosedAt: string;
  };
  /** Set when admin has marked this orphan intentional (suppresses re-flagging). */
  intentional?: {
    category: 'A' | 'B' | 'C' | 'D';
    pairedWith?: string | null;
    reason?: string;
    markedAt: string;
  };
}

export interface QaReport {
  deviceId: string;
  generatedAt: string;
  manifest: { controlCount: number; panelWidth: number; panelHeight: number };
  tutorials: { count: number; stepCount: number };
  results: QaResult[];
  /** Whether layer 2 (visual) results are present. False = deterministic-only. */
  visualVerified: boolean;
  /** True if any 'fail' severity result is present. */
  hasFailures: boolean;
}

interface ManifestControl {
  id: string;
  type: string;
  label?: string;
  shape?: string;
  editorPosition?: { x: number; y: number; w: number; h: number };
}

interface Manifest {
  panelWidth: number;
  panelHeight: number;
  controls: ManifestControl[];
}

interface TutorialStep {
  id?: string;
  title?: string;
  instruction?: string;
  details?: string;
  tipText?: string;
  highlightControls?: string[];
}

interface Tutorial {
  id: string;
  title: string;
  steps: TutorialStep[];
}

// ── Loaders (callers can override paths for testing) ────────────────────
export function loadManifest(deviceId: string, repoRoot: string): Manifest {
  const p = path.join(repoRoot, 'src', 'data', 'manifests', `${deviceId}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function loadTutorialsForDevice(deviceId: string, repoRoot: string): Tutorial[] {
  const p = path.join(
    repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'tutorials.json',
  );
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// ── Layer 1: Reference integrity ────────────────────────────────────────

/**
 * Read previously-cached diagnoses from disk. Stored alongside qa-report
 * so a re-run of layer1 doesn't drop existing agent diagnoses.
 */
function readCachedDiagnoses(deviceId: string, repoRoot: string): Record<string, OrphanDetail['diagnosis']> {
  const p = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'orphan-diagnoses.json');
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as Record<string, OrphanDetail['diagnosis']>;
  } catch { return {}; }
}

export function writeCachedDiagnoses(
  deviceId: string,
  diagnoses: Record<string, OrphanDetail['diagnosis']>,
  repoRoot = process.cwd(),
): void {
  const p = path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review', 'orphan-diagnoses.json');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(diagnoses, null, 2));
}

interface Layer1Options {
  deviceId?: string;
  repoRoot?: string;
}

export function layer1(manifest: Manifest, tutorials: Tutorial[], opts: Layer1Options = {}): QaResult[] {
  const manifestIds = new Set(manifest.controls.map((c) => c.id));
  const referencedIds = new Set<string>();
  for (const tut of tutorials) {
    for (const step of tut.steps) {
      for (const id of step.highlightControls ?? []) referencedIds.add(id);
    }
  }
  const missingFromManifest = [...referencedIds].filter((id) => !manifestIds.has(id));
  const unreferencedAll = [...manifestIds].filter((id) => !referencedIds.has(id));
  const labelLookup = new Map(manifest.controls.map((c) => [c.id, c.label ?? '(no label)']));

  // Read intentions + cached diagnoses to enrich the orphan rows.
  const intentions: OrphanIntentionMap = opts.deviceId
    ? readOrphanIntentions(opts.deviceId, opts.repoRoot ?? process.cwd())
    : {};
  const diagnoses = opts.deviceId
    ? readCachedDiagnoses(opts.deviceId, opts.repoRoot ?? process.cwd())
    : {};

  // Split active (no intention recorded yet) vs intentional (admin
  // already triaged). Both surface on the canvas but in separate
  // visual groupings.
  const activeOrphans: OrphanDetail[] = [];
  const intentionalOrphans: OrphanDetail[] = [];
  for (const id of unreferencedAll) {
    const row: OrphanDetail = {
      controlId: id,
      label: labelLookup.get(id) ?? null,
      hint: /-copy$|-copy-\d+$/.test(id) ? 'looks like an editor duplicate — consider deleting from manifest' : undefined,
    };
    if (intentions[id]) {
      row.intentional = { ...intentions[id] };
      intentionalOrphans.push(row);
      continue;
    }
    if (diagnoses[id]) {
      row.diagnosis = diagnoses[id];
    }
    activeOrphans.push(row);
  }

  // Sort active by category-of-action urgency: A (delete) > C (gap) > B (decorative) > D (redundant) > undiagnosed last
  const order: Record<string, number> = { A: 0, C: 1, B: 2, D: 3 };
  activeOrphans.sort((a, b) => {
    const aOrd = a.diagnosis ? order[a.diagnosis.category] ?? 4 : 5;
    const bOrd = b.diagnosis ? order[b.diagnosis.category] ?? 4 : 5;
    return aOrd - bOrd;
  });

  return [
    {
      layer: 1,
      name: '1a. tutorial→manifest reference integrity',
      severity: missingFromManifest.length > 0 ? 'fail' : 'ok',
      message:
        missingFromManifest.length > 0
          ? `${missingFromManifest.length} tutorial highlightControls IDs missing from manifest`
          : `all ${referencedIds.size} tutorial-referenced IDs exist in manifest`,
      details: missingFromManifest,
    },
    {
      layer: 1,
      name: '1b. manifest→tutorial coverage',
      severity: activeOrphans.length > 0 ? 'warn' : 'ok',
      message:
        activeOrphans.length > 0
          ? `${manifestIds.size - unreferencedAll.length} of ${manifestIds.size} controls referenced; ${activeOrphans.length} need triage (${intentionalOrphans.length} already marked intentional)`
          : intentionalOrphans.length > 0
            ? `all unreferenced orphans (${intentionalOrphans.length}) marked intentional`
            : `all ${manifestIds.size} controls are referenced by at least one tutorial`,
      details: { active: activeOrphans, intentional: intentionalOrphans },
    },
  ];
}

// ── Layer 3: Semantic coherence (advisory) ──────────────────────────────
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[/\-_]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function controlSearchTerms(c: ManifestControl): string[] {
  const out = new Set<string>();
  out.add(c.id.toLowerCase());
  if (c.label) {
    out.add(c.label.toLowerCase().replace(/[/\-_]/g, ' ').trim());
    for (const t of tokenize(c.label)) if (t.length >= 4) out.add(t);
  }
  return [...out];
}

export function layer3(manifest: Manifest, tutorials: Tutorial[]): QaResult[] {
  const mentionedNotHighlighted: Array<{ tutorial: string; step: number; control: string; label: string | null }> = [];
  const highlightedNotMentioned: Array<{ tutorial: string; step: number; control: string; label: string | null }> = [];
  const labelLookup = new Map(manifest.controls.map((c) => [c.id, c.label ?? null]));

  for (const tut of tutorials) {
    for (let i = 0; i < tut.steps.length; i++) {
      const step = tut.steps[i];
      const expected = new Set(step.highlightControls ?? []);
      const text = [step.title, step.instruction, step.details, step.tipText]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const tokens = new Set(tokenize(text));
      const padded = ' ' + text + ' ';

      const mentioned = new Set<string>();
      for (const c of manifest.controls) {
        const terms = controlSearchTerms(c);
        const found = terms.some((t) =>
          t.includes(' ')
            ? padded.includes(' ' + t + ' ') || padded.includes(' ' + t + '.') || padded.includes(' ' + t + ',')
            : tokens.has(t),
        );
        if (found) mentioned.add(c.id);
      }

      for (const id of mentioned) {
        if (!expected.has(id)) {
          mentionedNotHighlighted.push({ tutorial: tut.id, step: i + 1, control: id, label: labelLookup.get(id) ?? null });
        }
      }
      for (const id of expected) {
        if (!mentioned.has(id)) {
          highlightedNotMentioned.push({ tutorial: tut.id, step: i + 1, control: id, label: labelLookup.get(id) ?? null });
        }
      }
    }
  }

  return [
    {
      layer: 3,
      name: '3a. step text mentions control NOT in highlightControls (advisory)',
      severity: 'warn',
      message:
        `${mentionedNotHighlighted.length} cases — heuristic; many are contextual mentions ` +
        `("unlike the X button, this one…"). Review only suspicious patterns.`,
      details: mentionedNotHighlighted,
    },
    {
      layer: 3,
      name: '3b. highlightControls entry NOT mentioned in step text (advisory)',
      severity: 'warn',
      message:
        `${highlightedNotMentioned.length} cases — heuristic; visual-only emphasis is fine, ` +
        `but worth scanning for missed instruction text.`,
      details: highlightedNotMentioned,
    },
  ];
}

// ── Orchestration ───────────────────────────────────────────────────────
export interface RunDeterministicQaOptions {
  deviceId: string;
  repoRoot: string;
  /** Where to write qa-report.json. Defaults to .pipeline/<deviceId>/agents/tutorial-review/. */
  outDir?: string;
}

export function runDeterministicQa(opts: RunDeterministicQaOptions): QaReport {
  const { deviceId, repoRoot } = opts;
  const manifest = loadManifest(deviceId, repoRoot);
  const tutorials = loadTutorialsForDevice(deviceId, repoRoot);

  const results = [
    ...layer1(manifest, tutorials, { deviceId, repoRoot }),
    ...layer3(manifest, tutorials),
  ];
  const report: QaReport = {
    deviceId,
    generatedAt: new Date().toISOString(),
    manifest: {
      controlCount: manifest.controls.length,
      panelWidth: manifest.panelWidth,
      panelHeight: manifest.panelHeight,
    },
    tutorials: {
      count: tutorials.length,
      stepCount: tutorials.reduce((s, t) => s + t.steps.length, 0),
    },
    results,
    visualVerified: false,
    hasFailures: results.some((r) => r.severity === 'fail'),
  };

  const outDir =
    opts.outDir ??
    path.join(repoRoot, '.pipeline', deviceId, 'agents', 'tutorial-review');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'qa-report.json'), JSON.stringify(report, null, 2));
  return report;
}

/**
 * Merge new visual-layer results into an existing qa-report.json. Used by
 * the on-demand "Re-run Visual QA" route + Playwright runner.
 */
export function mergeVisualResults(
  reportPath: string,
  visualResults: QaResult[],
): QaReport {
  const existing = JSON.parse(fs.readFileSync(reportPath, 'utf-8')) as QaReport;
  // Strip prior layer-2 results, replace with new
  const without2 = existing.results.filter((r) => r.layer !== 2);
  const merged: QaReport = {
    ...existing,
    results: [...without2, ...visualResults].sort((a, b) => a.layer - b.layer || a.name.localeCompare(b.name)),
    visualVerified: true,
    hasFailures: [...without2, ...visualResults].some((r) => r.severity === 'fail'),
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(reportPath, JSON.stringify(merged, null, 2));
  return merged;
}
