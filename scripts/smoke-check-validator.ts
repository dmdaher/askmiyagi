/**
 * Dev tool: runs the post-editor validator against every pipeline editor
 * manifest on disk so you can scan for orphans and integrity bugs at once.
 *
 * Usage: npx tsx scripts/smoke-check-validator.ts
 *
 * Only targets `.pipeline/<id>/manifest-editor.json` (the editor schema).
 * Production manifests in `src/data/manifests/` use a DIFFERENT schema
 * (`editorSections` vs `sections`) and are not the validator's target.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import * as validators from '../src/lib/pipeline/checkpoint-validators';

const PIPELINE_DIR = '.pipeline';

if (!existsSync(PIPELINE_DIR)) {
  console.error(`No ${PIPELINE_DIR} directory in cwd; run from repo root.`);
  process.exit(1);
}

const deviceDirs = readdirSync(PIPELINE_DIR).filter((name) => {
  const p = join(PIPELINE_DIR, name);
  return statSync(p).isDirectory() && existsSync(join(p, 'manifest-editor.json'));
});

let totalErrors = 0;
let totalWarnings = 0;

for (const id of deviceDirs.sort()) {
  const path = join(PIPELINE_DIR, id, 'manifest-editor.json');
  const r = validators.validatePostEditorManifest(readFileSync(path, 'utf-8'));
  const errCodes = [...new Set(r.findings.filter((f) => f.severity === 'error').map((f) => f.code))];
  const warnCodes = [...new Set(r.findings.filter((f) => f.severity === 'warning').map((f) => f.code))];
  const status = r.valid ? 'PASS' : 'FAIL';
  console.log(`${status}  ${id.padEnd(30)} errors=${r.errorCount} warnings=${r.warningCount}`);
  if (errCodes.length) console.log(`       errors: ${errCodes.join(', ')}`);
  if (warnCodes.length) console.log(`       warns:  ${warnCodes.join(', ')}`);
  totalErrors += r.errorCount;
  totalWarnings += r.warningCount;
}

console.log('---');
console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings across ${deviceDirs.length} manifests`);
