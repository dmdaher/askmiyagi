#!/usr/bin/env tsx
/**
 * One-time admin script: patch the contractor's hosted-Blob manifest with the
 * keyboard config from the local manifest-editor.json — leaving every other
 * field (controls, sections, labels, positions) untouched.
 *
 * Use case: contractor's hosted manifest has `keyboard: null` because an
 * earlier overwrite stripped it. We want to restore the keyboard without
 * trampling their positioning work.
 *
 * Safety:
 *   - Saves a timestamped backup of the FULL hosted manifest before patching
 *   - Backups land under .pipeline/<deviceId>/hosted-blob-backup-<ISO>.json
 *   - Each backup is gitignored (.pipeline/* paths) — local-only
 *   - --revert <backup-path> mode restores the backup verbatim
 *
 * Usage:
 *   npx tsx scripts/patch-hosted-keyboard.ts <deviceId>
 *   npx tsx scripts/patch-hosted-keyboard.ts <deviceId> --force         # overwrite even if hosted already has a keyboard
 *   npx tsx scripts/patch-hosted-keyboard.ts <deviceId> --revert <path> # restore a previously-saved backup
 *
 * Env:
 *   BASE_URL          (default: http://localhost:3000)
 *   ADMIN_PASSWORD    (default: miyagi2026)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'miyagi2026';

async function fetchHosted(deviceId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/api/hosted/panels/${deviceId}`, {
    headers: { Cookie: `admin_access=${ADMIN_PASSWORD}` },
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

async function putHosted(deviceId: string, body: Record<string, unknown>): Promise<{ savedAt: string }> {
  const res = await fetch(`${BASE_URL}/api/hosted/panels/${deviceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `admin_access=${ADMIN_PASSWORD}`,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 409) {
    throw new Error('409 Conflict — contractor saved between read and write. Try again.');
  }
  if (!res.ok) throw new Error(`PUT failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { savedAt: string };
}

/** Strip server-only fields and stamp `_loadedAt` for the conflict check. */
function preparePutBody(hosted: Record<string, unknown>, mutations: Record<string, unknown> = {}): Record<string, unknown> {
  const body = { ...hosted, ...mutations };
  delete body._source;
  delete body._status;
  delete body._adminNote;
  delete body._contractorNote;
  body._loadedAt = hosted._updatedAt;
  return body;
}

function saveBackup(deviceId: string, hosted: Record<string, unknown>): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(process.cwd(), '.pipeline', deviceId, `hosted-blob-backup-${ts}.json`);
  mkdirSync(dirname(backupPath), { recursive: true });
  writeFileSync(backupPath, JSON.stringify(hosted, null, 2));
  return backupPath;
}

async function patch(deviceId: string, force: boolean) {
  // Read keyboard from local manifest
  const localPath = join(process.cwd(), '.pipeline', deviceId, 'manifest-editor.json');
  let localKeyboard: unknown;
  try {
    const localManifest = JSON.parse(readFileSync(localPath, 'utf8')) as { keyboard?: unknown };
    localKeyboard = localManifest.keyboard;
  } catch (e) {
    throw new Error(`Failed to read local manifest at ${localPath}: ${e}`);
  }
  if (!localKeyboard) {
    throw new Error(`Local manifest has no keyboard config — nothing to patch.`);
  }
  console.log(`Local keyboard:`, JSON.stringify(localKeyboard, null, 2));

  console.log(`\nFetching hosted manifest for ${deviceId}...`);
  const hosted = await fetchHosted(deviceId);
  console.log(`Hosted manifest size: ${JSON.stringify(hosted).length} chars`);
  console.log(`Hosted current keyboard:`, hosted.keyboard);
  console.log(`Hosted _updatedAt:`, hosted._updatedAt);

  if (hosted.keyboard && !force) {
    console.error(`\n⚠ Hosted already has a keyboard — refusing without --force.`);
    process.exit(1);
  }

  // BACKUP before mutation
  const backupPath = saveBackup(deviceId, hosted);
  console.log(`\n💾 Backup saved → ${backupPath}`);
  console.log(`   To revert: npx tsx scripts/patch-hosted-keyboard.ts ${deviceId} --revert "${backupPath}"`);

  // PUT only the keyboard field changed; everything else preserved.
  const body = preparePutBody(hosted, { keyboard: localKeyboard });
  console.log(`\nPUT-ing patched manifest...`);
  const result = await putHosted(deviceId, body);
  console.log(`\x1b[32m✓\x1b[0m Keyboard patched. New _updatedAt: ${result.savedAt}`);
  console.log(`\nContractor's editor will pick up the change on next page load.`);
}

async function revert(deviceId: string, backupPath: string) {
  let backup: Record<string, unknown>;
  try {
    backup = JSON.parse(readFileSync(backupPath, 'utf8')) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Failed to read backup at ${backupPath}: ${e}`);
  }
  console.log(`Backup _updatedAt: ${backup._updatedAt}`);
  console.log(`Backup keyboard:`, backup.keyboard);

  console.log(`\nFetching CURRENT hosted manifest (will be replaced)...`);
  const current = await fetchHosted(deviceId);
  console.log(`Current _updatedAt: ${current._updatedAt}`);
  console.log(`Current keyboard:`, current.keyboard);

  // Save a "pre-revert" snapshot too — in case the revert itself was a mistake
  const safetyPath = saveBackup(deviceId, current);
  console.log(`\n💾 Pre-revert snapshot saved → ${safetyPath}`);

  // PUT the backup. Use current's _updatedAt as _loadedAt to satisfy conflict check.
  const body = preparePutBody({ ...backup, _updatedAt: current._updatedAt });
  console.log(`\nPUT-ing backup contents back to hosted...`);
  const result = await putHosted(deviceId, body);
  console.log(`\x1b[32m✓\x1b[0m Reverted. New _updatedAt: ${result.savedAt}`);
}

async function main() {
  const deviceId = process.argv[2];
  if (!deviceId) {
    console.error('Usage:');
    console.error('  npx tsx scripts/patch-hosted-keyboard.ts <deviceId> [--force]');
    console.error('  npx tsx scripts/patch-hosted-keyboard.ts <deviceId> --revert <backup-path>');
    process.exit(1);
  }

  const revertIdx = process.argv.indexOf('--revert');
  if (revertIdx >= 0) {
    const backupPath = process.argv[revertIdx + 1];
    if (!backupPath) {
      console.error('--revert requires a backup file path');
      process.exit(1);
    }
    await revert(deviceId, backupPath);
    return;
  }

  await patch(deviceId, process.argv.includes('--force'));
}

main().catch((e: unknown) => {
  console.error(`\n\x1b[31m✗\x1b[0m ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
