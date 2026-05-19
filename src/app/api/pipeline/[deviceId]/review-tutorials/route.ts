/**
 * GET /api/pipeline/[deviceId]/review-tutorials
 *
 * Returns everything the admin review page needs to display the generated
 * tutorials before they get PR'd:
 *   - summary: validator output (counts + issues per tutorial)
 *   - tutorials: serialized Tutorial[] from the pipeline runner's pause
 *   - manifest: the in-progress panel manifest (for rendering the panel)
 *   - manifestSource: which file backed the manifest (for diagnostics)
 *   - manifestStaleWarning: non-null if manifest-editor.json is newer than
 *     the rendered manifest (admin signal to re-export from editor)
 *   - reviewerNotes: map of batchId → reviewer prose markdown (from
 *     batch-<id>-review.md files written by tutorial-reviewer agent)
 *   - escalationId / status: from pipeline state, for the Approve / Request
 *     Changes actions to address the right escalation
 *
 * 404 if the device isn't currently paused at tutorial-review.
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';

const REVIEWER_NOTES_MAX_BYTES = 50 * 1024;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const state = readState(deviceId);
  if (!state) {
    return NextResponse.json({ error: `No pipeline found for device: ${deviceId}` }, { status: 404 });
  }

  const reviewDir = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'tutorial-review');
  const summaryPath = path.join(reviewDir, 'summary.json');
  const tutorialsPath = path.join(reviewDir, 'tutorials.json');

  // Manifest precedence — SCHEMA-compatible with PanelRenderer first.
  // src/data/manifests/<id>.json is the only schema PanelRenderer renders.
  // manifest-editor.json is checked separately ONLY for the freshness signal.
  const manifestCandidates = [
    path.join(process.cwd(), 'src', 'data', 'manifests', `${deviceId}.json`),
    path.join(process.cwd(), '.pipeline', deviceId, 'manifest.json'),
  ];
  const manifestEditorPath = path.join(process.cwd(), '.pipeline', deviceId, 'manifest-editor.json');

  if (!fs.existsSync(summaryPath) || !fs.existsSync(tutorialsPath)) {
    return NextResponse.json(
      {
        error:
          'No tutorial-review data on disk. The pipeline must complete tutorial-build and reach the tutorial-review pause before the admin page is available.',
      },
      { status: 404 },
    );
  }

  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    const tutorials = JSON.parse(fs.readFileSync(tutorialsPath, 'utf-8'));

    let manifest: unknown = null;
    let manifestSource: string | null = null;
    let manifestMtime: number | null = null;
    for (const candidatePath of manifestCandidates) {
      if (fs.existsSync(candidatePath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(candidatePath, 'utf-8'));
          manifestSource = path.relative(process.cwd(), candidatePath);
          manifestMtime = fs.statSync(candidatePath).mtimeMs;
          break;
        } catch { /* try next candidate */ }
      }
    }

    let manifestStaleWarning: string | null = null;
    let manifestEditorMtime: number | null = null;
    if (manifest && manifestMtime !== null && fs.existsSync(manifestEditorPath)) {
      manifestEditorMtime = fs.statSync(manifestEditorPath).mtimeMs;
      if (manifestEditorMtime > manifestMtime + 60_000) {
        const ageMin = Math.round((manifestEditorMtime - manifestMtime) / 60000);
        manifestStaleWarning =
          `Editor has changes ${ageMin}min newer than the rendered manifest. ` +
          `Canvas shows production view; open the editor and re-save to refresh.`;
      }
    }

    // Reviewer prose per batch — surface what the tutorial-reviewer agent
    // wrote (god-mode value-add). Files are batch-<id>-review.md inside the
    // tutorial-review agent dir. Guarded so one bad file never 500s the API.
    const reviewerNotes: Record<string, string> = {};
    try {
      if (fs.existsSync(reviewDir)) {
        for (const file of fs.readdirSync(reviewDir)) {
          const m = file.match(/^batch-(.+)-review\.md$/);
          if (!m) continue;
          const batchId = m[1];
          try {
            const full = path.join(reviewDir, file);
            const stat = fs.statSync(full);
            const size = Math.min(stat.size, REVIEWER_NOTES_MAX_BYTES);
            const buf = Buffer.alloc(size);
            const fd = fs.openSync(full, 'r');
            try { fs.readSync(fd, buf, 0, size, 0); } finally { fs.closeSync(fd); }
            // Strip UTF-8 BOM if present
            const content = buf.toString('utf-8').replace(/^﻿/, '');
            reviewerNotes[batchId] = stat.size > REVIEWER_NOTES_MAX_BYTES
              ? content + `\n\n…(truncated at ${REVIEWER_NOTES_MAX_BYTES} bytes)`
              : content;
          } catch (err) {
            console.warn(`[review-tutorials] failed to read ${file}: ${err}`);
          }
        }
      }
    } catch (err) {
      console.warn(`[review-tutorials] reviewer notes scan failed: ${err}`);
    }

    const escalation = state.escalations.find(
      e => e.type === 'tutorial-review' && !e.resolvedAt,
    );

    return NextResponse.json({
      deviceId,
      deviceName: state.deviceName,
      currentPhase: state.currentPhase,
      status: state.status,
      escalationId: escalation?.id ?? null,
      summary,
      tutorials,
      manifest,
      manifestSource,
      manifestStaleWarning,
      manifestEditorMtime,
      reviewerNotes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to read review data: ${message}` }, { status: 500 });
  }
}
