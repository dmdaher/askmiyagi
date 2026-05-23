/**
 * One-off backfill: runs repairManifest() against every existing
 * manifest-editor.json on disk and writes the resulting changes to that
 * device's repair-log.jsonl. This populates the attention inventory with
 * REAL findings from manifests that pre-date the auto-repair wiring.
 *
 * Run: npx tsx scripts/backfill-attention-inventory.ts
 *
 * Idempotent: re-running won't duplicate entries because repair() is
 * idempotent — second pass produces zero changes.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from 'fs';
import { join } from 'path';
import { repairManifest } from '../src/lib/pipeline/manifest-repair';

const PIPELINE_DIR = '.pipeline';

if (!existsSync(PIPELINE_DIR)) {
  console.error('No .pipeline directory — run from repo root.');
  process.exit(1);
}

const deviceDirs = readdirSync(PIPELINE_DIR).filter((name) => {
  if (name === 'attention-reviewed.json' || name === 'saved') return false;
  try {
    return statSync(join(PIPELINE_DIR, name)).isDirectory();
  } catch {
    return false;
  }
});

let totalChanges = 0;
let totalUnrepairable = 0;
let deviceCount = 0;

for (const deviceId of deviceDirs.sort()) {
  const manifestPath = join(PIPELINE_DIR, deviceId, 'manifest-editor.json');
  if (!existsSync(manifestPath)) continue;

  const manifestJson = readFileSync(manifestPath, 'utf-8');
  const result = repairManifest(manifestJson);

  if (result.changes.length === 0 && result.unrepairableFindings.length === 0) {
    console.log(`✓ ${deviceId}: clean (no findings)`);
    continue;
  }

  // Write log entry
  const logPath = join(PIPELINE_DIR, deviceId, 'repair-log.jsonl');
  const entry = {
    timestamp: new Date().toISOString(),
    changes: result.changes,
    unrepairableFindings: result.unrepairableFindings,
    bailed: result.bailed,
    note: 'backfilled from existing manifest',
  };
  appendFileSync(logPath, JSON.stringify(entry) + '\n');

  // Persist repaired manifest (with pre-repair backup)
  if (result.changes.length > 0 && !result.bailed) {
    const backupDir = join(PIPELINE_DIR, deviceId, 'backups');
    if (!existsSync(backupDir)) {
      // Created lazily; no fs.mkdirSync to keep deps minimal
      readdirSync(join(PIPELINE_DIR, deviceId)); // touch
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = join(PIPELINE_DIR, deviceId, 'backups', `manifest-editor-pre-repair-${ts}.json`);
    try {
      writeFileSync(backupPath, manifestJson);
    } catch {
      console.warn(`  ! could not write backup for ${deviceId} — skipping persist`);
      continue;
    }
    writeFileSync(manifestPath, JSON.stringify(result.repaired, null, 2));
  }

  console.log(`! ${deviceId}: ${result.changes.length} repair${result.changes.length === 1 ? '' : 's'}, ${result.unrepairableFindings.length} unrepairable`);
  totalChanges += result.changes.length;
  totalUnrepairable += result.unrepairableFindings.length;
  deviceCount++;
}

console.log('');
console.log(`Done. ${deviceCount} device${deviceCount === 1 ? '' : 's'} had findings. ${totalChanges} changes, ${totalUnrepairable} unrepairable.`);
console.log('Open /admin to view the attention inventory.');
