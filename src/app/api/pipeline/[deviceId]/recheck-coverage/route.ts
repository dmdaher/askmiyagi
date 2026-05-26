/**
 * GET  /api/pipeline/{deviceId}/recheck-coverage
 *   Preview: { canRecheck, reason }. Lets the UI disable the button when
 *   pre-conditions aren't met (pipeline running, no manual, no extractor
 *   checkpoint, etc.).
 *
 * POST /api/pipeline/{deviceId}/recheck-coverage
 *   On-demand invocation of the existing `coverage-auditor` agent against
 *   the CURRENT tutorial files on disk. Returns the parsed match-table
 *   summary (counts + missing + parent-only gaps with evidence).
 *
 *   The agent reuses any existing `independent-checklist.md` (skips Phase 1)
 *   so a re-check is fast (~2-4 min, ~$3-5). Pass { forceFullReread: true }
 *   to delete the existing checklist and force the full 3-phase audit.
 *
 *   Composes with PR #169 (auto-push of match-table.md to pipeline/<id>)
 *   so git history preserves every prior match-table version.
 *
 * DELETE /api/pipeline/{deviceId}/recheck-coverage
 *   Cancel a running re-check. Kills the spawned claude CLI subprocess.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readState } from '@/lib/pipeline/state-machine';
import { invokeAgent } from '@/lib/pipeline/runner';
import { trackAudit, untrackAudit, killAudit } from '@/lib/pipeline/audit-tracker';
import {
  parseMatchTable,
  summarizeMatchTable,
  type MatchRow,
  type MatchTableSummary,
} from '@/lib/pipeline/coverage-scorer';

// Use the same on-demand audit-tracker key shape as audit-controls
const TRACKER_ISSUE_ID = 'recheck-coverage';

export const maxDuration = 300; // 5 min — matches audit-controls

interface PreviewResponse {
  canRecheck: boolean;
  reason: string;
  hasIndependentChecklist: boolean; // tells UI whether re-run will be fast (resume) or slow (full)
}

function computePreview(deviceId: string): PreviewResponse {
  const state = readState(deviceId);
  if (!state) {
    return { canRecheck: false, reason: `No pipeline found for ${deviceId}.`, hasIndependentChecklist: false };
  }
  if (state.status === 'running') {
    return { canRecheck: false, reason: 'Pipeline is currently running — pause or wait for completion.', hasIndependentChecklist: false };
  }
  const manualPaths = state.manualPaths ?? [];
  if (manualPaths.length === 0) {
    return { canRecheck: false, reason: 'No manual PDFs registered for this device.', hasIndependentChecklist: false };
  }
  const resolvedManuals = manualPaths.map((p) => path.resolve(p)).filter((p) => fs.existsSync(p));
  if (resolvedManuals.length === 0) {
    return { canRecheck: false, reason: 'Manual PDFs not found on disk.', hasIndependentChecklist: false };
  }
  const checklistPath = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'coverage-auditor', 'independent-checklist.md');
  const hasIndependentChecklist = fs.existsSync(checklistPath);
  return {
    canRecheck: true,
    reason: hasIndependentChecklist
      ? 'Ready to re-check coverage (fast: reuses independent checklist).'
      : 'Ready to re-check coverage (full 3-phase audit: independent read + compare + verdict).',
    hasIndependentChecklist,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // ?action=cached → return cached match-table results if present (for Coverage tab on canvas)
  if (action === 'cached') {
    const matchTablePath = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'coverage-auditor', 'match-table.md');
    if (!fs.existsSync(matchTablePath)) {
      return NextResponse.json({ cached: false });
    }
    try {
      const markdown = fs.readFileSync(matchTablePath, 'utf-8');
      const rows = parseMatchTable(markdown);
      const summary = summarizeMatchTable(rows);
      const missing = rows.filter((r) => r.matchKind === 'MISSING');
      const parentOnlyGaps = rows.filter((r) => r.matchKind === 'CONFIRMED_BY_PARENT_ONLY');
      const stat = fs.statSync(matchTablePath);
      return NextResponse.json({
        cached: true,
        summary,
        missing,
        parentOnlyGaps,
        matchTablePath: path.relative(process.cwd(), matchTablePath),
        lastAuditMs: stat.mtimeMs,
      });
    } catch (err) {
      return NextResponse.json(
        { cached: false, error: 'Failed to parse cached match-table', details: (err as Error).message },
        { status: 500 },
      );
    }
  }

  // Default: return preview (canRecheck + reason)
  return NextResponse.json(computePreview(deviceId));
}

interface RecheckResponse {
  ok: true;
  summary: MatchTableSummary;
  missing: MatchRow[];
  parentOnlyGaps: MatchRow[];
  matchTablePath: string;
  costUsd: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const body: { forceFullReread?: boolean } = await request.json().catch(() => ({}));

  const preview = computePreview(deviceId);
  if (!preview.canRecheck) {
    return NextResponse.json({ error: preview.reason }, { status: 400 });
  }

  const state = readState(deviceId)!; // preview guarantees state exists
  const auditorDir = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'coverage-auditor');
  const checklistPath = path.join(auditorDir, 'independent-checklist.md');
  const matchTablePath = path.join(auditorDir, 'match-table.md');

  // Force full re-read if requested (deletes existing checklist so agent does Phase 1 again)
  if (body.forceFullReread && fs.existsSync(checklistPath)) {
    fs.unlinkSync(checklistPath);
  }

  fs.mkdirSync(auditorDir, { recursive: true });

  const manualPathsList = (state.manualPaths ?? [])
    .map((p) => path.resolve(p))
    .filter((p) => fs.existsSync(p));

  const tutorialsDir = path.join(process.cwd(), 'src/data/tutorials', deviceId);
  const existingTutorialIds = fs.existsSync(tutorialsDir)
    ? fs.readdirSync(tutorialsDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts').map((f) => f.replace(/\.ts$/, ''))
    : [];

  const checklistResumeHint = fs.existsSync(checklistPath)
    ? `\nAn existing independent-checklist.md is at ${checklistPath}. SKIP Phase 1 and read this checklist as-is — it represents your prior independent reading of the manual.`
    : `\nNo prior independent-checklist.md found. Do Phase 1 (independent manual read) first, then Phase 2.`;

  // Reuse the existing coverage-auditor agent (no SOUL change). Same agent
  // the pipeline phase-4 invokes — just on-demand against current tutorials.
  const prompt = `ON-DEMAND COVERAGE RE-CHECK — ${state.deviceName} (${deviceId})

You are the coverage-auditor. Your job is the same as your pipeline-phase invocation: independently verify that built tutorials cover everything in the manual, and emit a per-feature match-table.md.${checklistResumeHint}

Manual PDFs:
${manualPathsList.map((p) => `  - ${p}`).join('\n')}

Built tutorials currently on disk (${existingTutorialIds.length}): ${existingTutorialIds.join(', ') || '(none)'}
Tutorial files location: ${tutorialsDir}

Required outputs (write to ${auditorDir}/):
  - match-table.md (REQUIRED, full schema per your SOUL Phase 2 §1)
  - checkpoint.md (verdict + frontmatter coverage_pct)

Do NOT modify any tutorial .ts files. Read-only audit.

Respond with: "RE-CHECK COMPLETE — see match-table.md" when done.`;

  // Block concurrent re-checks for the same device
  const { getAuditPid } = await import('@/lib/pipeline/audit-tracker');
  if (getAuditPid(deviceId, TRACKER_ISSUE_ID)) {
    return NextResponse.json(
      { error: 'A re-check is already running for this device. Cancel it first or wait for completion.' },
      { status: 409 },
    );
  }

  try {
    const result = await invokeAgent({
      prompt,
      deviceId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      phase: 'phase-4-audit' as any,
      agent: 'coverage-auditor',
      cwd: process.cwd(),
      allowedTools: ['Read', 'Write', 'Glob', 'Grep', 'Bash'],
      maxBudgetPerInvocation: 8,
      onChildPid: (pid) => trackAudit(deviceId, TRACKER_ISSUE_ID, pid),
    });

    untrackAudit(deviceId, TRACKER_ISSUE_ID);

    // Parse the match-table the agent just wrote
    if (!fs.existsSync(matchTablePath)) {
      return NextResponse.json(
        { error: 'Agent ran but did not produce match-table.md', agentOutput: result.output.substring(0, 2000) },
        { status: 500 },
      );
    }

    const markdown = fs.readFileSync(matchTablePath, 'utf-8');
    const rows = parseMatchTable(markdown);
    const summary = summarizeMatchTable(rows);
    const missing = rows.filter((r) => r.matchKind === 'MISSING');
    const parentOnlyGaps = rows.filter((r) => r.matchKind === 'CONFIRMED_BY_PARENT_ONLY');

    const response: RecheckResponse = {
      ok: true,
      summary,
      missing,
      parentOnlyGaps,
      matchTablePath: path.relative(process.cwd(), matchTablePath),
      costUsd: result.costEntry?.costUsd ?? 0,
    };
    return NextResponse.json(response);
  } catch (err) {
    untrackAudit(deviceId, TRACKER_ISSUE_ID);
    return NextResponse.json(
      { error: 'Re-check agent failed', details: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params;
  const killed = killAudit(deviceId, TRACKER_ISSUE_ID);
  return NextResponse.json({ ok: true, killed });
}
