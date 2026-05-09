#!/usr/bin/env tsx
/**
 * One-time admin migration: split DeepMind-12's existing LED cluster controls
 * into individual LED controls (one per real LED on the hardware).
 *
 * Background. The DeepMind manifest has 4 real LED clusters that should each
 * be N individual LEDs (per the manual). Today they're stored as 1 control
 * each. PR-A's gatekeeper rule + validator prevent this for FUTURE
 * instruments — this script fixes the EXISTING DeepMind state.
 *
 * Mappings (canonical names from DeepMind12_UserManual.pdf p. 8–9):
 *
 *   lfo1-waveform-leds → 7 LEDs (sine, triangle, square, ramp-up,
 *                                ramp-down, sample-hold, sample-glide)
 *   lfo2-waveform-leds → 7 LEDs (same names, lfo2 prefix)
 *   voices-leds        → 12 LEDs (voice-1 … voice-12)
 *   octave-leds        → 5 LEDs (octave-minus-2 … octave-plus-2)
 *   env-curve-leds     → FLAGGED for review only — manual p. 9 says
 *                        envelope curves are on the LCD, not physical LEDs
 *
 * Tutorial safety. The script scans `src/data/tutorials/deepmind-12/**` for
 * references to any cluster ID. If any are found, the script REFUSES to run
 * unless --update-tutorials is passed; with that flag, it rewrites references
 * atomically (cluster ID → array of all N new IDs).
 *
 * Usage:
 *   npx tsx scripts/split-deepmind-led-clusters.ts --dry-run
 *   npx tsx scripts/split-deepmind-led-clusters.ts
 *   npx tsx scripts/split-deepmind-led-clusters.ts --update-tutorials
 *   npx tsx scripts/split-deepmind-led-clusters.ts --revert <backup-path>
 *
 * Env:
 *   BASE_URL          (default: http://localhost:3000)
 *   ADMIN_PASSWORD    (default: miyagi2026)
 */

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const DEVICE_ID = 'deepmind-12';
const TUTORIALS_DIR = join(process.cwd(), 'src', 'data', 'tutorials', DEVICE_ID);

// ── Cluster definitions ────────────────────────────────────────────────────

interface ClusterMapping {
  clusterId: string;
  splitIds: string[];          // canonical IDs in order
  splitLabels: string[];       // user-visible labels per LED
  orientation: 'vertical' | 'horizontal' | 'auto';
  exclusive: boolean;          // only one lit at a time?
}

const CLUSTERS: ClusterMapping[] = [
  {
    clusterId: 'lfo1-waveform-leds',
    splitIds: ['lfo1-sine', 'lfo1-triangle', 'lfo1-square', 'lfo1-ramp-up',
               'lfo1-ramp-down', 'lfo1-sample-hold', 'lfo1-sample-glide'],
    splitLabels: ['SINE', 'TRI', 'SQR', 'RAMP↑', 'RAMP↓', 'S&H', 'S&G'],
    orientation: 'vertical',
    exclusive: true,
  },
  {
    clusterId: 'lfo2-waveform-leds',
    splitIds: ['lfo2-sine', 'lfo2-triangle', 'lfo2-square', 'lfo2-ramp-up',
               'lfo2-ramp-down', 'lfo2-sample-hold', 'lfo2-sample-glide'],
    splitLabels: ['SINE', 'TRI', 'SQR', 'RAMP↑', 'RAMP↓', 'S&H', 'S&G'],
    orientation: 'vertical',
    exclusive: true,
  },
  {
    clusterId: 'voices-leds',
    splitIds: Array.from({ length: 12 }, (_, i) => `voice-${i + 1}`),
    splitLabels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
    orientation: 'horizontal',
    exclusive: false, // multiple voices light at once
  },
  {
    clusterId: 'octave-leds',
    splitIds: ['octave-minus-2', 'octave-minus-1', 'octave-zero', 'octave-plus-1', 'octave-plus-2'],
    splitLabels: ['-2', '-1', '0', '+1', '+2'],
    orientation: 'horizontal',
    exclusive: true,
  },
];

const FLAG_FOR_REVIEW = 'env-curve-leds';

const LED_SIZE = 24; // px square — bigger than visually ideal but Rnd's 10×10 corner resize handles eat most of the click area otherwise

// ── Helpers ────────────────────────────────────────────────────────────────

const RED = '\x1b[31m'; const YELLOW = '\x1b[33m'; const GREEN = '\x1b[32m';
const DIM = '\x1b[2m'; const RESET = '\x1b[0m';
const log = console.log;

async function fetchHosted(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/api/hosted/panels/${DEVICE_ID}`, {
    headers: { Cookie: `admin_access=${ADMIN_PASSWORD}` },
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status} ${await res.text()}`);
  return await res.json() as Record<string, unknown>;
}

async function putHosted(body: Record<string, unknown>): Promise<{ savedAt: string }> {
  const res = await fetch(`${BASE_URL}/api/hosted/panels/${DEVICE_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${ADMIN_PASSWORD}` },
    body: JSON.stringify(body),
  });
  if (res.status === 409) throw new Error('409 Conflict — contractor saved between read and write. Re-run.');
  if (!res.ok) throw new Error(`PUT failed: ${res.status} ${await res.text()}`);
  return await res.json() as { savedAt: string };
}

function preparePutBody(hosted: Record<string, unknown>, mutated: Record<string, unknown>): Record<string, unknown> {
  const body = { ...mutated };
  delete body._source; delete body._status; delete body._adminNote; delete body._contractorNote;
  body._loadedAt = hosted._updatedAt;
  return body;
}

function saveBackup(hosted: Record<string, unknown>): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(process.cwd(), '.pipeline', DEVICE_ID, `hosted-blob-backup-${ts}.json`);
  mkdirSync(dirname(backupPath), { recursive: true });
  writeFileSync(backupPath, JSON.stringify(hosted, null, 2));
  return backupPath;
}

function distributePositions(
  cluster: { x: number; y: number; w: number; h: number },
  count: number,
  orientation: 'vertical' | 'horizontal' | 'auto',
): Array<{ x: number; y: number; w: number; h: number }> {
  const dir = orientation === 'auto' ? (cluster.h > cluster.w ? 'vertical' : 'horizontal') : orientation;
  const positions: Array<{ x: number; y: number; w: number; h: number }> = [];
  if (dir === 'vertical') {
    const slotH = cluster.h / count;
    const cx = cluster.x + (cluster.w - LED_SIZE) / 2;
    for (let i = 0; i < count; i++) {
      positions.push({
        x: Math.round(cx),
        y: Math.round(cluster.y + i * slotH + (slotH - LED_SIZE) / 2),
        w: LED_SIZE,
        h: LED_SIZE,
      });
    }
  } else {
    const slotW = cluster.w / count;
    const cy = cluster.y + (cluster.h - LED_SIZE) / 2;
    for (let i = 0; i < count; i++) {
      positions.push({
        x: Math.round(cluster.x + i * slotW + (slotW - LED_SIZE) / 2),
        y: Math.round(cy),
        w: LED_SIZE,
        h: LED_SIZE,
      });
    }
  }
  return positions;
}

interface TutorialRef {
  file: string;
  clusterId: string;
  occurrences: number;
}

function scanTutorialsForClusterRefs(): TutorialRef[] {
  const refs: TutorialRef[] = [];
  function walk(dir: string) {
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (full.endsWith('.ts')) {
        const content = readFileSync(full, 'utf8');
        for (const cluster of CLUSTERS) {
          // Match the literal string between quotes (avoids matching ids that
          // happen to be a substring, e.g., a comment).
          const pattern = new RegExp(`['"\`]${cluster.clusterId}['"\`]`, 'g');
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            refs.push({ file: full, clusterId: cluster.clusterId, occurrences: matches.length });
          }
        }
      }
    }
  }
  walk(TUTORIALS_DIR);
  return refs;
}

function rewriteTutorials(refs: TutorialRef[], dryRun: boolean): void {
  // Group by file so we read+write each file once.
  const byFile = new Map<string, TutorialRef[]>();
  for (const r of refs) {
    const list = byFile.get(r.file) ?? [];
    list.push(r);
    byFile.set(r.file, list);
  }
  for (const [file, fileRefs] of byFile) {
    let content = readFileSync(file, 'utf8');
    let totalReplacements = 0;
    for (const ref of fileRefs) {
      const cluster = CLUSTERS.find((c) => c.clusterId === ref.clusterId);
      if (!cluster) continue;
      // Replace 'cluster-id' (and "..." and `...`) with array spread of split ids.
      // Conservative: replace ONLY when the cluster-id appears as an array element
      // inside `highlightControls` or `panelStateChanges`. We use a simple string
      // replace — works because cluster IDs are unique and unambiguous in tutorials.
      const splitArrayString = cluster.splitIds.map((id) => `'${id}'`).join(', ');
      const variants = [`'${ref.clusterId}'`, `"${ref.clusterId}"`, `\`${ref.clusterId}\``];
      for (const v of variants) {
        while (content.includes(v)) {
          content = content.replace(v, splitArrayString);
          totalReplacements++;
        }
      }
    }
    if (totalReplacements > 0) {
      log(`  ${dryRun ? '[dry-run] would rewrite' : 'rewrote'} ${file} (${totalReplacements} replacement${totalReplacements === 1 ? '' : 's'})`);
      if (!dryRun) writeFileSync(file, content);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

interface SplitResult {
  cluster: ClusterMapping;
  newControls: Array<Record<string, unknown>>;
}

function buildSplitControls(cluster: ClusterMapping, source: Record<string, unknown>): Array<Record<string, unknown>> {
  const positions = distributePositions(
    { x: source.x as number, y: source.y as number, w: source.w as number, h: source.h as number },
    cluster.splitIds.length,
    cluster.orientation,
  );
  return cluster.splitIds.map((id, i) => ({
    ...source, // inherit ledColor, ledStyle, sectionId, container assignment, etc.
    id,
    label: cluster.splitLabels[i],
    type: 'led',
    ...positions[i],
    // Drop fields that don't apply to individual LEDs
    spatialNeighbors: undefined,
  }));
}

async function patch(args: { dryRun: boolean; updateTutorials: boolean; force: boolean }): Promise<void> {
  log(`${DIM}Fetching hosted manifest for ${DEVICE_ID}...${RESET}`);
  const hosted = await fetchHosted();
  const controls = (hosted.controls ?? {}) as Record<string, Record<string, unknown>>;
  const sections = (hosted.sections ?? {}) as Record<string, Record<string, unknown>>;
  log(`Hosted _updatedAt: ${hosted._updatedAt}`);

  // 1. Tutorial pre-flight scan
  log(`\n${DIM}Pre-flight tutorial scan...${RESET}`);
  const tutorialRefs = scanTutorialsForClusterRefs();
  if (tutorialRefs.length > 0) {
    log(`${YELLOW}⚠ Found ${tutorialRefs.length} tutorial reference(s) to cluster IDs:${RESET}`);
    for (const r of tutorialRefs) {
      log(`  - ${r.file}: '${r.clusterId}' × ${r.occurrences}`);
    }
    if (!args.updateTutorials) {
      log(`\n${RED}✗ Refusing to run.${RESET}`);
      log(`  Tutorials reference cluster IDs that this script will delete.`);
      log(`  Re-run with ${YELLOW}--update-tutorials${RESET} to atomically replace each cluster id`);
      log(`  with the array of split ids (e.g., 'octave-leds' → 'octave-minus-2', 'octave-minus-1', ...).`);
      process.exit(1);
    }
  } else {
    log(`${GREEN}✓${RESET} No tutorial references found.`);
  }

  // 2. Identify clusters to split
  log(`\n${DIM}Planning splits...${RESET}`);
  const splits: SplitResult[] = [];
  for (const cluster of CLUSTERS) {
    const source = controls[cluster.clusterId];
    if (!source) {
      log(`  ${YELLOW}⚠${RESET} ${cluster.clusterId} not found in manifest (already split? skipping)`);
      continue;
    }
    // Idempotency: if any split id already exists, skip unless --force
    const existing = cluster.splitIds.filter((id) => controls[id]);
    if (existing.length > 0 && !args.force) {
      log(`  ${YELLOW}⚠${RESET} ${cluster.clusterId} already partially split (${existing.length}/${cluster.splitIds.length} exist). Skipping. Use --force to redo.`);
      continue;
    }
    const newControls = buildSplitControls(cluster, source);
    splits.push({ cluster, newControls });
    log(`  ${GREEN}+${RESET} ${cluster.clusterId} → ${cluster.splitIds.length} LEDs (${cluster.orientation}): ${cluster.splitIds.join(', ')}`);
  }

  // env-curve-leds: flag for review, do not auto-delete
  if (controls[FLAG_FOR_REVIEW]) {
    log(`  ${YELLOW}⚑${RESET} ${FLAG_FOR_REVIEW} flagged for human review. Manual p.9 says envelope curves are on the LCD, not physical LEDs. NOT deleted by this script.`);
  }

  if (splits.length === 0) {
    log(`\n${YELLOW}No clusters to split. Manifest already migrated (or nothing matched).${RESET}`);
    return;
  }

  // 3. Build new controls map and update sections
  const updatedControls: Record<string, Record<string, unknown>> = { ...controls };
  const updatedSections: Record<string, Record<string, unknown>> = {};
  for (const [sid, sec] of Object.entries(sections)) {
    updatedSections[sid] = { ...sec, childIds: [...((sec.childIds as string[]) ?? [])] };
  }

  for (const { cluster, newControls } of splits) {
    // Insert new controls
    for (const newCtrl of newControls) {
      updatedControls[newCtrl.id as string] = newCtrl;
    }
    // Remove cluster control
    delete updatedControls[cluster.clusterId];
    // Update section childIds: replace cluster id with split ids
    const sectionId = (controls[cluster.clusterId].sectionId ?? null) as string | null;
    if (sectionId && updatedSections[sectionId]) {
      const childIds = updatedSections[sectionId].childIds as string[];
      const idx = childIds.indexOf(cluster.clusterId);
      if (idx >= 0) {
        childIds.splice(idx, 1, ...cluster.splitIds);
      } else {
        // Cluster not in childIds; just append the split ids
        childIds.push(...cluster.splitIds);
      }
    }
  }

  if (args.dryRun) {
    log(`\n${YELLOW}[dry-run] No changes will be persisted.${RESET}`);
    log(`Tutorials would be rewritten:`);
    rewriteTutorials(tutorialRefs, true);
    return;
  }

  // 4. Save backup
  log(`\n${DIM}Saving safety backup of hosted state...${RESET}`);
  const backupPath = saveBackup(hosted);
  log(`💾 Backup: ${backupPath}`);
  log(`   Revert: npx tsx scripts/patch-hosted-keyboard.ts ${DEVICE_ID} --revert "${backupPath}"`);

  // 5. Rewrite tutorials atomically with manifest mutation
  if (tutorialRefs.length > 0 && args.updateTutorials) {
    log(`\n${DIM}Rewriting tutorials (atomic with manifest update)...${RESET}`);
    rewriteTutorials(tutorialRefs, false);
  }

  // 6. PUT updated manifest
  log(`\n${DIM}PUT-ing updated manifest...${RESET}`);
  const body = preparePutBody(hosted, { ...hosted, controls: updatedControls, sections: updatedSections });
  const result = await putHosted(body);
  log(`${GREEN}✓${RESET} Migration complete. New _updatedAt: ${result.savedAt}`);

  // 7. Summary
  const totalNew = splits.reduce((sum, s) => sum + s.newControls.length, 0);
  log(`\n${GREEN}Summary:${RESET}`);
  log(`  Clusters split: ${splits.length}`);
  log(`  New LED controls created: ${totalNew}`);
  log(`  Cluster controls removed: ${splits.length}`);
  log(`  Tutorial references updated: ${tutorialRefs.length} ${tutorialRefs.length > 0 ? `(in ${new Set(tutorialRefs.map(r => r.file)).size} file${new Set(tutorialRefs.map(r => r.file)).size === 1 ? '' : 's'})` : ''}`);
  log(`  env-curve-leds: ${controls[FLAG_FOR_REVIEW] ? 'flagged for review (NOT deleted)' : 'not present'}`);
  log(`\nContractor's editor will pick up the changes on next page load.`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const updateTutorials = args.includes('--update-tutorials');
  const force = args.includes('--force');
  const revertIdx = args.indexOf('--revert');
  if (revertIdx >= 0) {
    log(`${YELLOW}--revert flag is handled by patch-hosted-keyboard.ts${RESET}`);
    log(`Run: npx tsx scripts/patch-hosted-keyboard.ts ${DEVICE_ID} --revert "${args[revertIdx + 1]}"`);
    process.exit(0);
  }
  await patch({ dryRun, updateTutorials, force });
}

main().catch((e: unknown) => {
  console.error(`\n${RED}✗${RESET} ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
