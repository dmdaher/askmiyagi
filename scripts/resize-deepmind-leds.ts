#!/usr/bin/env tsx
/**
 * Followup to split-deepmind-led-clusters.ts.
 *
 * Two problems with the original migration:
 *   1. LEDs were 10×10 — too small to reliably click in the editor
 *   2. Voices LEDs (12 of them) had a 45×16 cluster bbox, so the split
 *      placed them on top of each other
 *
 * This script resizes each split LED to 18×18 AND redistributes them
 * along the cluster's axis with a minimum gap, expanding outward from
 * the original centroid when the layout was too tight.
 *
 * Usage:
 *   npx tsx scripts/resize-deepmind-leds.ts --dry-run
 *   npx tsx scripts/resize-deepmind-leds.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';
const DEVICE_ID = 'deepmind-12';
const LED_SIZE = 16;
const MIN_GAP = 6; // px between adjacent LED edges (so 16+6 = 22px center-to-center)

interface ClusterLayout {
  ids: string[];
  orientation: 'vertical' | 'horizontal';
}

const CLUSTERS: ClusterLayout[] = [
  {
    ids: ['lfo1-sine', 'lfo1-triangle', 'lfo1-square', 'lfo1-ramp-up',
          'lfo1-ramp-down', 'lfo1-sample-hold', 'lfo1-sample-glide'],
    orientation: 'vertical',
  },
  {
    ids: ['lfo2-sine', 'lfo2-triangle', 'lfo2-square', 'lfo2-ramp-up',
          'lfo2-ramp-down', 'lfo2-sample-hold', 'lfo2-sample-glide'],
    orientation: 'vertical',
  },
  {
    ids: Array.from({ length: 12 }, (_, i) => `voice-${i + 1}`),
    orientation: 'horizontal',
  },
  {
    ids: ['octave-minus-2', 'octave-minus-1', 'octave-zero', 'octave-plus-1', 'octave-plus-2'],
    orientation: 'horizontal',
  },
];

const RED = '\x1b[31m'; const YELLOW = '\x1b[33m'; const GREEN = '\x1b[32m';
const DIM = '\x1b[2m'; const RESET = '\x1b[0m';

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
  if (res.status === 409) throw new Error('409 Conflict — re-run.');
  if (!res.ok) throw new Error(`PUT failed: ${res.status} ${await res.text()}`);
  return await res.json() as { savedAt: string };
}

function saveBackup(hosted: Record<string, unknown>): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const path = join(process.cwd(), '.pipeline', DEVICE_ID, `hosted-blob-backup-${ts}.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(hosted, null, 2));
  return path;
}

/**
 * Redistribute the cluster's LEDs along its axis with non-overlapping spacing.
 * Centers the new layout on the centroid of the existing positions.
 */
function redistribute(
  cluster: ClusterLayout,
  controls: Record<string, Record<string, unknown>>,
): Array<{ id: string; x: number; y: number; w: number; h: number }> | null {
  const existing = cluster.ids.map((id) => controls[id]).filter(Boolean);
  if (existing.length === 0) return null;

  const N = cluster.ids.length;
  const stride = LED_SIZE + MIN_GAP; // center-to-center distance
  const totalSpan = N * stride; // length of layout band
  const startOffset = -totalSpan / 2 + stride / 2; // first center, relative to centroid

  // Centroid (average of existing positions, accounting for current size)
  const cxs = existing.map((c) => (c.x as number) + (c.w as number) / 2);
  const cys = existing.map((c) => (c.y as number) + (c.h as number) / 2);
  const centroidX = cxs.reduce((a, b) => a + b, 0) / cxs.length;
  const centroidY = cys.reduce((a, b) => a + b, 0) / cys.length;

  return cluster.ids.map((id, i) => {
    const offsetAlongAxis = startOffset + i * stride;
    const cx = cluster.orientation === 'horizontal' ? centroidX + offsetAlongAxis : centroidX;
    const cy = cluster.orientation === 'vertical'   ? centroidY + offsetAlongAxis : centroidY;
    return {
      id,
      x: Math.round(cx - LED_SIZE / 2),
      y: Math.round(cy - LED_SIZE / 2),
      w: LED_SIZE,
      h: LED_SIZE,
    };
  });
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`${DIM}Fetching hosted manifest for ${DEVICE_ID}...${RESET}`);
  const hosted = await fetchHosted();
  const controls = (hosted.controls ?? {}) as Record<string, Record<string, unknown>>;

  type Update = { id: string; from: string; to: string };
  const allUpdates: Update[] = [];
  const updatedControls: Record<string, Record<string, unknown>> = { ...controls };

  for (const cluster of CLUSTERS) {
    const newPositions = redistribute(cluster, controls);
    if (!newPositions) {
      console.log(`  ${YELLOW}⚠${RESET} cluster (${cluster.ids[0]}…) has no LEDs in manifest — skipping`);
      continue;
    }
    const orient = cluster.orientation;
    console.log(`\n${GREEN}${cluster.ids[0].split('-')[0]} cluster${RESET} (${orient}, ${newPositions.length} LEDs):`);
    for (const np of newPositions) {
      const old = controls[np.id];
      if (!old) continue;
      const oldStr = `${old.w}×${old.h} @ (${(old.x as number).toFixed(0)},${(old.y as number).toFixed(0)})`;
      const newStr = `${np.w}×${np.h} @ (${np.x},${np.y})`;
      if (oldStr !== newStr) {
        allUpdates.push({ id: np.id, from: oldStr, to: newStr });
      }
      updatedControls[np.id] = { ...old, x: np.x, y: np.y, w: np.w, h: np.h };
    }
    const previewIds = newPositions.slice(0, 3).map(p => p.id).join(', ');
    console.log(`  ${previewIds}${newPositions.length > 3 ? ', …' : ''}`);
    console.log(`  size: ${LED_SIZE}×${LED_SIZE} • spacing: ${LED_SIZE + MIN_GAP}px center-to-center`);
  }

  if (allUpdates.length === 0) {
    console.log(`\n${YELLOW}No updates needed — LEDs already at target size + spacing.${RESET}`);
    return;
  }

  console.log(`\n${GREEN}Total updates:${RESET} ${allUpdates.length} LEDs`);

  if (dryRun) {
    console.log(`\n${YELLOW}[dry-run] No changes will be persisted.${RESET}`);
    console.log(`Sample updates:`);
    for (const u of allUpdates.slice(0, 5)) console.log(`  ${u.id}: ${u.from} → ${u.to}`);
    return;
  }

  const backupPath = saveBackup(hosted);
  console.log(`\n💾 Backup: ${backupPath}`);

  const body: Record<string, unknown> = { ...hosted, controls: updatedControls };
  delete body._source; delete body._status; delete body._adminNote; delete body._contractorNote;
  body._loadedAt = hosted._updatedAt;

  console.log(`${DIM}PUT-ing updated manifest...${RESET}`);
  const result = await putHosted(body);
  console.log(`${GREEN}✓${RESET} Done. New _updatedAt: ${result.savedAt}`);
  console.log(`Hard-refresh /admin/${DEVICE_ID}/editor to see the changes.`);
}

main().catch((e: unknown) => {
  console.error(`\n${RED}✗${RESET} ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
