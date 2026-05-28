#!/usr/bin/env npx tsx
/**
 * Regenerate the tutorial-review artifact (tutorials.json + summary.json) for
 * a device from its current src/data/tutorials/<deviceId>/index.ts.
 *
 * Background: the admin review page at /admin/<id>/review-tutorials reads from
 * .pipeline/<id>/agents/tutorial-review/tutorials.json — a pipeline-generated
 * artifact written by the tutorial-builder agent during a full pipeline run.
 * When you author new tutorials directly in src/data/tutorials/<id>/ (the way
 * PR-X2 added 5 integration tutorials), the artifact stays stale until the
 * full pipeline tutorial-builder phase re-runs (expensive: ~30 min, ~$15-30).
 *
 * This script bypasses that cost: it imports the current tutorials at
 * runtime, serializes them to the same JSON shape, and writes
 * .pipeline/<id>/agents/tutorial-review/tutorials.json + summary.json so the
 * admin review page picks them up on next load. ~5 seconds, $0.
 *
 * The existing qa-report.json + reviewer prose markdown files are left
 * untouched — they still reflect the prior pipeline run. Re-running them
 * requires the tutorial-reviewer agent (which is a paid LLM call).
 *
 * Usage:
 *   npx tsx scripts/regenerate-tutorial-review-artifact.ts <deviceId>
 *
 * Example:
 *   npx tsx scripts/regenerate-tutorial-review-artifact.ts cdj-3000
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Tutorial } from '@/types/tutorial';

const deviceId = process.argv[2];
if (!deviceId) {
  console.error('Usage: npx tsx scripts/regenerate-tutorial-review-artifact.ts <deviceId>');
  process.exit(1);
}

async function main() {
  // Dynamic import — each device has its own tutorials module
  const mod = await import(`@/data/tutorials/${deviceId}/index`);
  // The exported array name follows the pattern <camelCaseDeviceId>Tutorials.
  // Find it by looking for an exported Tutorial[] in the module.
  const tutorialsExport = Object.entries(mod).find(
    ([, value]) => Array.isArray(value) && value.length > 0 && (value[0] as Tutorial)?.steps !== undefined,
  );
  if (!tutorialsExport) {
    console.error(`No Tutorial[] export found in @/data/tutorials/${deviceId}/index`);
    process.exit(1);
  }
  const tutorials = tutorialsExport[1] as Tutorial[];

  const outDir = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'tutorial-review');
  fs.mkdirSync(outDir, { recursive: true });

  // SHA-backup the existing artifact before overwriting (safety: never lose
  // a paid pipeline run's output without a trail)
  const ts = Date.now();
  const tutorialsPath = path.join(outDir, 'tutorials.json');
  const summaryPath = path.join(outDir, 'summary.json');
  if (fs.existsSync(tutorialsPath)) {
    fs.copyFileSync(tutorialsPath, path.join(outDir, `tutorials.${ts}.bak.json`));
    console.log(`✓ backed up existing tutorials.json → tutorials.${ts}.bak.json`);
  }
  if (fs.existsSync(summaryPath)) {
    fs.copyFileSync(summaryPath, path.join(outDir, `summary.${ts}.bak.json`));
    console.log(`✓ backed up existing summary.json → summary.${ts}.bak.json`);
  }

  // Write the regenerated tutorials.json — same shape the admin route expects
  fs.writeFileSync(tutorialsPath, JSON.stringify(tutorials, null, 2));
  console.log(`✓ wrote tutorials.json (${tutorials.length} tutorials)`);

  // Regenerate summary.json — clear all errors/warnings since this is a
  // source regeneration, not an actual reviewer pass. The qa-report.json
  // and per-batch reviewer notes are left untouched so admin can still see
  // the prior reviewer's feedback on tutorials that haven't changed.
  const summary = {
    deviceId,
    totalTutorials: tutorials.length,
    totalSteps: tutorials.reduce((s, t) => s + t.steps.length, 0),
    totalErrors: 0,
    totalWarnings: 0,
    totalInfos: 0,
    byTutorial: Object.fromEntries(
      tutorials.map((t) => [
        t.id,
        {
          errors: 0,
          warnings: 0,
          infos: 0,
          title: t.title,
          stepCount: t.steps.length,
        },
      ]),
    ),
    regeneratedFromSource: true,
    regeneratedAt: new Date().toISOString(),
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✓ wrote summary.json (${tutorials.length} tutorials, ${summary.totalSteps} steps)`);

  console.log(`\nDone. Admin can now see all ${tutorials.length} tutorials at /admin/${deviceId}/review-tutorials`);
  console.log(`Backups (if any) are in ${outDir} — *.bak.json suffix.`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
