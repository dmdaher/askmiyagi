#!/usr/bin/env tsx
/**
 * Audit script: scan every instrument's manifest + diagram-parser blueprint
 * for LED indicator cluster bugs (where N physical LEDs are stored as a
 * single control instead of N individual controls).
 *
 * Two signals:
 *   1. PRIMARY: blueprint has `type: 'led-group'` with `count > 1` AND the
 *      manifest doesn't have at least N matching split controls. This is
 *      the authoritative signal — same logic as the L2 validator.
 *   2. SECONDARY (heuristic): manifest has a control with id ending in
 *      `-leds` (plural) and `type: 'led'`. Strong cluster indicator
 *      regardless of blueprint presence.
 *
 * Usage:
 *   npx tsx scripts/audit-led-clusters.ts
 *   npx tsx scripts/audit-led-clusters.ts --hosted   # check hosted Blob too
 *
 * Output:
 *   Per-instrument report with cluster findings + recommended actions.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';

const RED = '\x1b[31m'; const YELLOW = '\x1b[33m'; const GREEN = '\x1b[32m';
const DIM = '\x1b[2m'; const BOLD = '\x1b[1m'; const RESET = '\x1b[0m';

// Names indicating a cluster (plural). Single-LED status indicators
// (`usb-indicator`, `power-led`, `overload-led`) are NOT flagged.
const CLUSTER_SUFFIXES = [/-leds$/, /-indicators$/, /-meters$/, /-segments$/];

interface ManifestControl {
  id: string;
  type: string;
  w?: number;
  h?: number;
  sectionId?: string;
}

interface BlueprintControl {
  id: string;
  type?: string;
  count?: number;
  waveforms?: string[];
  voiceNumbers?: number[];
  octaveLabels?: string[];
}

interface BlueprintSection {
  sectionId?: string;
  id?: string;
  controls?: BlueprintControl[];
}

interface ClusterFinding {
  id: string;
  source: 'blueprint' | 'manifest-name';
  details: string;
  expectedCount?: number;
  actualSplitCount?: number;
}

function listInstruments(): string[] {
  const dir = '.pipeline';
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'saved')
    .map((d) => d.name);
}

function loadJson(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function loadManifestControls(manifest: Record<string, unknown>): ManifestControl[] {
  const ctrls = manifest.controls;
  if (!ctrls) return [];
  if (Array.isArray(ctrls)) return ctrls as ManifestControl[];
  return Object.values(ctrls as Record<string, ManifestControl>);
}

function loadBlueprintSections(blueprint: Record<string, unknown>): BlueprintSection[] {
  const sections = blueprint.sections;
  if (!sections) return [];
  if (Array.isArray(sections)) return sections as BlueprintSection[];
  return Object.entries(sections as Record<string, unknown>).map(([key, val]) => ({
    sectionId: key,
    ...(val as Record<string, unknown>),
  })) as BlueprintSection[];
}

function findClusters(
  manifest: Record<string, unknown> | null,
  blueprint: Record<string, unknown> | null,
): ClusterFinding[] {
  const findings: ClusterFinding[] = [];

  const manifestControls = manifest ? loadManifestControls(manifest) : [];
  const manifestById = new Map(manifestControls.map((c) => [c.id, c]));

  // PRIMARY signal: blueprint led-groups with count > 1
  if (blueprint) {
    for (const section of loadBlueprintSections(blueprint)) {
      for (const c of section.controls ?? []) {
        if (c.type !== 'led-group') continue;
        const count = c.count ?? 0;
        if (count <= 1) continue;
        // Count manifest LEDs in same section
        const sectionId = section.sectionId ?? section.id ?? '';
        const manifestLedsInSection = manifestControls.filter(
          (m) => m.type === 'led' && m.sectionId === sectionId,
        );
        const isUnsplit = manifestLedsInSection.length < count;
        if (isUnsplit) {
          findings.push({
            id: c.id,
            source: 'blueprint',
            details: `Parser says ${count} LEDs, but section "${sectionId}" has only ${manifestLedsInSection.length} type='led' control${manifestLedsInSection.length === 1 ? '' : 's'}.`,
            expectedCount: count,
            actualSplitCount: manifestLedsInSection.length,
          });
        }
      }
    }
  }

  // SECONDARY signal: manifest controls with cluster-suffix names
  for (const c of manifestControls) {
    if (c.type !== 'led') continue;
    const matches = CLUSTER_SUFFIXES.some((p) => p.test(c.id));
    if (!matches) continue;
    // Only flag if there isn't ALREADY a flag from blueprint (same cluster)
    if (findings.some((f) => f.id === c.id)) continue;
    findings.push({
      id: c.id,
      source: 'manifest-name',
      details: `Plural-name cluster (${c.id}) at ${c.w ?? '?'}×${c.h ?? '?'} px. Looks like an unsplit cluster.`,
    });
  }

  return findings;
}

async function maybeFetchHosted(deviceId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/hosted/panels/${deviceId}`, {
      headers: { Cookie: `admin_access=${ADMIN_PASSWORD}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const checkHosted = process.argv.includes('--hosted');
  const instruments = listInstruments().sort();

  console.log(`${BOLD}LED cluster audit${RESET} — scanning ${instruments.length} instruments\n`);

  type Report = { id: string; localFindings: ClusterFinding[]; hostedFindings: ClusterFinding[] | null; manifestPresent: boolean; blueprintPresent: boolean };
  const reports: Report[] = [];

  for (const id of instruments) {
    const manifestPath = join('.pipeline', id, 'manifest-editor.json');
    const blueprintPath = join('.pipeline', id, 'agents', 'diagram-parser', 'spatial-blueprint.json');
    const localManifest = loadJson(manifestPath);
    const blueprint = loadJson(blueprintPath);
    const localFindings = findClusters(localManifest, blueprint);

    let hostedFindings: ClusterFinding[] | null = null;
    if (checkHosted) {
      const hosted = await maybeFetchHosted(id);
      if (hosted) hostedFindings = findClusters(hosted, blueprint);
    }

    reports.push({
      id,
      localFindings,
      hostedFindings,
      manifestPresent: !!localManifest,
      blueprintPresent: !!blueprint,
    });
  }

  // Summary
  const affected = reports.filter((r) => r.localFindings.length > 0 || (r.hostedFindings ?? []).length > 0);
  const clean = reports.filter((r) => r.localFindings.length === 0 && (r.hostedFindings ?? []).length === 0 && r.manifestPresent);
  const skipped = reports.filter((r) => !r.manifestPresent);

  for (const r of reports) {
    const label = r.localFindings.length > 0 ? `${RED}NEEDS SPLIT${RESET}`
      : !r.manifestPresent ? `${DIM}skipped (no manifest)${RESET}`
      : `${GREEN}clean${RESET}`;
    console.log(`${BOLD}${r.id}${RESET}  ${label}`);
    console.log(`  ${DIM}local manifest: ${r.manifestPresent ? 'yes' : 'no'} • blueprint: ${r.blueprintPresent ? 'yes' : 'no'}${RESET}`);

    if (r.localFindings.length === 0 && r.manifestPresent) {
      console.log(`  ${GREEN}✓${RESET} no clusters detected`);
    }

    for (const f of r.localFindings) {
      const marker = f.source === 'blueprint' ? `${RED}[BLUEPRINT]${RESET}` : `${YELLOW}[NAME]${RESET}`;
      console.log(`  ${marker} ${f.id}`);
      console.log(`     ${DIM}${f.details}${RESET}`);
    }

    if (r.hostedFindings && r.hostedFindings.length !== r.localFindings.length) {
      console.log(`  ${YELLOW}⚠ hosted differs from local: ${r.hostedFindings.length} clusters in hosted vs ${r.localFindings.length} in local${RESET}`);
    }
    console.log('');
  }

  // Footer summary
  console.log(`${BOLD}Summary${RESET}`);
  console.log(`  ${RED}Affected (need migration):${RESET} ${affected.length}`);
  for (const r of affected) {
    console.log(`    - ${r.id} (${r.localFindings.length} cluster${r.localFindings.length === 1 ? '' : 's'})`);
  }
  console.log(`  ${GREEN}Clean:${RESET} ${clean.length}`);
  console.log(`  ${DIM}Skipped:${RESET} ${skipped.length}`);
}

main().catch((e: unknown) => {
  console.error(`\n${RED}✗${RESET} ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
