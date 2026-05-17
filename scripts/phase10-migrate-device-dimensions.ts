#!/usr/bin/env tsx
/**
 * Phase 10 migration — backfill `deviceDimensions` from raw `manifest.json`
 * into each device's editor manifest (`manifest-editor.json`).
 *
 * Idempotent: runs safely multiple times. Only writes if:
 *   - Editor manifest is missing `deviceDimensions`
 *   - Raw manifest has it
 *
 * Devices without `deviceDimensions` in raw (deepmind-12, etc.) are
 * left alone — no false data fabricated.
 *
 * Usage:
 *   npx tsx scripts/phase10-migrate-device-dimensions.ts          # dry-run
 *   npx tsx scripts/phase10-migrate-device-dimensions.ts --apply  # write changes
 */

import fs from 'fs';
import path from 'path';

const PIPELINE_DIR = path.resolve(__dirname, '..', '.pipeline');
const APPLY = process.argv.includes('--apply');

function main() {
  if (!fs.existsSync(PIPELINE_DIR)) {
    console.error(`pipeline dir not found: ${PIPELINE_DIR}`);
    process.exit(1);
  }

  console.log(APPLY ? '🚀 APPLYING CHANGES' : '🔍 DRY RUN (use --apply to write)');
  console.log();

  const devices = fs
    .readdirSync(PIPELINE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'saved')
    .map((d) => d.name);

  let migrated = 0;
  let alreadyHas = 0;
  let noRawDims = 0;
  let noEditor = 0;

  for (const device of devices) {
    const editorPath = path.join(PIPELINE_DIR, device, 'manifest-editor.json');
    const rawPath = path.join(PIPELINE_DIR, device, 'manifest.json');

    if (!fs.existsSync(editorPath)) {
      console.log(`  ${device}: no manifest-editor.json (skip)`);
      noEditor++;
      continue;
    }
    if (!fs.existsSync(rawPath)) {
      console.log(`  ${device}: no raw manifest.json (skip)`);
      noRawDims++;
      continue;
    }

    const editor = JSON.parse(fs.readFileSync(editorPath, 'utf-8'));
    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

    if (editor.deviceDimensions) {
      console.log(`  ${device}: already has deviceDimensions (${editor.deviceDimensions.widthMm}×${editor.deviceDimensions.depthMm}mm)`);
      alreadyHas++;
      continue;
    }
    if (!raw.deviceDimensions) {
      console.log(`  ${device}: raw manifest has no deviceDimensions (gatekeeper didn't extract)`);
      noRawDims++;
      continue;
    }

    console.log(`  ${device}: MIGRATE — add deviceDimensions = ${raw.deviceDimensions.widthMm}×${raw.deviceDimensions.depthMm}mm`);
    if (APPLY) {
      editor.deviceDimensions = raw.deviceDimensions;
      fs.writeFileSync(editorPath, JSON.stringify(editor, null, 2) + '\n');
    }
    migrated++;
  }

  console.log();
  console.log(`Summary:`);
  console.log(`  ${migrated} device(s) would migrate ${APPLY ? '(applied)' : '(dry run)'}`);
  console.log(`  ${alreadyHas} already had deviceDimensions`);
  console.log(`  ${noRawDims} had no source data`);
  console.log(`  ${noEditor} had no editor manifest`);
}

main();
