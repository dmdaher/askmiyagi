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
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { readState, writeState, appendLog, ensurePipelineDir } from '@/lib/pipeline/state-machine';
import { invokeAgent } from '@/lib/pipeline/runner';
import { trackAudit, untrackAudit, killAudit, getAuditPid } from '@/lib/pipeline/audit-tracker';
import {
  parseMatchTable,
  summarizeMatchTable,
  scoreCoverage,
  buildDirectivesFromVerdict,
  type MatchRow,
  type MatchTableSummary,
  type ScoredVerdict,
} from '@/lib/pipeline/coverage-scorer';

// Use the same on-demand audit-tracker key shape as audit-controls
const TRACKER_ISSUE_ID = 'recheck-coverage';

export const maxDuration = 300; // 5 min — matches audit-controls

interface PreviewResponse {
  canRecheck: boolean;
  reason: string;
  hasIndependentChecklist: boolean; // tells UI whether re-run will be fast (resume) or slow (full)
  /** True when a recheck is currently in-flight (auditor agent spawned via
   *  this route is registered in audit-tracker). UI uses this to disable
   *  the Re-check button + show a "running elsewhere" indicator on every
   *  surface that displays the button, not just the one that launched it. */
  isRecheckRunning: boolean;
}

function computePreview(deviceId: string): PreviewResponse {
  // Check audit-tracker FIRST so we surface "running elsewhere" even when
  // the pipeline state itself is paused/completed (the recheck agent runs
  // outside the pipeline runner).
  const runningPid = getAuditPid(deviceId, TRACKER_ISSUE_ID);
  const isRecheckRunning = runningPid !== undefined;

  const state = readState(deviceId);
  if (!state) {
    return { canRecheck: false, reason: `No pipeline found for ${deviceId}.`, hasIndependentChecklist: false, isRecheckRunning };
  }
  if (isRecheckRunning) {
    return {
      canRecheck: false,
      reason: `Re-check already running (PID ${runningPid}). Wait for it to complete or cancel from the surface that launched it.`,
      hasIndependentChecklist: false,
      isRecheckRunning: true,
    };
  }
  if (state.status === 'running') {
    return { canRecheck: false, reason: 'Pipeline is currently running — pause or wait for completion.', hasIndependentChecklist: false, isRecheckRunning };
  }
  const manualPaths = state.manualPaths ?? [];
  if (manualPaths.length === 0) {
    return { canRecheck: false, reason: 'No manual PDFs registered for this device.', hasIndependentChecklist: false, isRecheckRunning };
  }
  const resolvedManuals = manualPaths.map((p) => path.resolve(p)).filter((p) => fs.existsSync(p));
  if (resolvedManuals.length === 0) {
    return { canRecheck: false, reason: 'Manual PDFs not found on disk.', hasIndependentChecklist: false, isRecheckRunning };
  }
  const checklistPath = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'coverage-auditor', 'independent-checklist.md');
  const hasIndependentChecklist = fs.existsSync(checklistPath);
  return {
    canRecheck: true,
    reason: hasIndependentChecklist
      ? 'Ready to re-check coverage (fast: reuses independent checklist).'
      : 'Ready to re-check coverage (full 3-phase audit: independent read + compare + verdict).',
    hasIndependentChecklist,
    isRecheckRunning: false,
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

      // Phase 3a — compute verdict for the cached data too so the CoverageTab
      // sidebar shows verdict block on initial load (not just after re-running).
      // Read-only: never triggers self-heal even if shouldAutoRetry=true.
      const checkpointPath = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'coverage-auditor', 'checkpoint.md');
      const auditorMarkdown = fs.existsSync(checkpointPath) ? fs.readFileSync(checkpointPath, 'utf-8') : '';
      const cachedState = readState(deviceId);
      const prevGapsRaw = cachedState?.strikeTracker?.['phase-4-audit-prev-critical-gaps'] as unknown as string | undefined;
      const prevConfirmedRaw = cachedState?.strikeTracker?.['phase-4-audit-prev-confirmed-features'] as unknown as string | undefined;
      const verdict = scoreCoverage(auditorMarkdown, {
        matchTableMarkdown: markdown,
        previousCriticalGapFeatures: typeof prevGapsRaw === 'string' ? prevGapsRaw.split('|').filter(Boolean) : [],
        previousConfirmedFeatures: typeof prevConfirmedRaw === 'string' ? prevConfirmedRaw.split('|').filter(Boolean) : [],
      }, deviceId);
      const cachedRetryCount = (cachedState?.strikeTracker?.['phase-4-audit'] as number | undefined) ?? 0;

      return NextResponse.json({
        cached: true,
        summary,
        missing,
        parentOnlyGaps,
        matchTablePath: path.relative(process.cwd(), matchTablePath),
        lastAuditMs: stat.mtimeMs,
        verdict: {
          name: verdict.verdict,
          reason: verdict.reason,
          shouldAutoRetry: verdict.shouldAutoRetry,
          coveragePct: verdict.matchTable?.coveragePct ?? 0,
          selfHealTriggered: false, // GET never triggers self-heal
          retryCount: cachedRetryCount,
          maxRetries: 2,
        },
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
  /** Coverage scorer verdict (NEW Phase 3a). Tells the UI whether the
   *  re-check triggered self-heal and what to display to the admin. */
  verdict?: {
    name: ScoredVerdict['verdict'];
    reason: string;
    shouldAutoRetry: boolean;
    coveragePct: number;
    selfHealTriggered: boolean;
    retryCount: number;
    maxRetries: number;
  };
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

    // ─── Phase 3a — Coverage gate + self-heal trigger ───────────────────
    // Compute deterministic verdict from the match-table. If non-grandfathered
    // and shouldAutoRetry: write extractor-directives.md + advance pipeline
    // state to phase-4-extraction so the next runner pass auto-heals. The
    // existing doPhase4Audit retry cap + convergence checks still apply.
    const checkpointPath = path.join(process.cwd(), '.pipeline', deviceId, 'agents', 'coverage-auditor', 'checkpoint.md');
    const auditorMarkdown = fs.existsSync(checkpointPath) ? fs.readFileSync(checkpointPath, 'utf-8') : '';

    const currentState = readState(deviceId);
    // strikeTracker is typed as Record<string, number> but the pipeline-runner
    // stores stringly-typed values via `as unknown as number` for the previous-
    // gaps + previous-confirmed slots. Read with the same cast back to string.
    const prevGapsRaw = currentState?.strikeTracker?.['phase-4-audit-prev-critical-gaps'] as unknown as string | undefined;
    const previousCriticalGapFeatures = typeof prevGapsRaw === 'string'
      ? prevGapsRaw.split('|').filter(Boolean)
      : [];
    const prevConfirmedRaw = currentState?.strikeTracker?.['phase-4-audit-prev-confirmed-features'] as unknown as string | undefined;
    const previousConfirmedFeatures = typeof prevConfirmedRaw === 'string'
      ? prevConfirmedRaw.split('|').filter(Boolean)
      : [];
    const verdict = scoreCoverage(auditorMarkdown, {
      matchTableMarkdown: markdown,
      previousCriticalGapFeatures,
      previousConfirmedFeatures,
    }, deviceId);

    const MAX_AUDIT_RETRIES = 2;
    const auditKey = 'phase-4-audit';
    const retryCount = (currentState?.strikeTracker?.[auditKey] as number | undefined) ?? 0;
    let selfHealTriggered = false;
    let runnerPid: number | null = null;

    if (currentState && verdict.shouldAutoRetry && retryCount < MAX_AUDIT_RETRIES) {
      try {
        const directivesPath = path.join(process.cwd(), '.pipeline', deviceId, 'extractor-directives.md');
        fs.writeFileSync(directivesPath, buildDirectivesFromVerdict(verdict));
        appendLog(deviceId, {
          level: 'info',
          message: `[recheck-coverage] ${verdict.verdict}: triggering self-heal retry ${retryCount + 1}/${MAX_AUDIT_RETRIES}. ${verdict.criticalGaps.length} critical + ${verdict.moderateGaps.length} moderate gaps listed in directives.`,
        });
        currentState.strikeTracker[auditKey] = retryCount + 1;
        currentState.strikeTracker['phase-4-audit-prev-critical-gaps'] = verdict.criticalGaps
          .map(g => g.feature)
          .join('|') as unknown as number;
        const confirmedIds = rows.filter(r => r.matchKind === 'CONFIRMED').map(r => r.featureId);
        currentState.strikeTracker['phase-4-audit-prev-confirmed-features'] = confirmedIds
          .join('|') as unknown as number;
        // Set phase back so the runner picks up at extraction.
        currentState.currentPhase = 'phase-4-extraction';
        // Spawn the pipeline runner immediately — 1-click UX. Admin doesn't
        // have to navigate to a separate "Resume Pipeline" button. Pattern
        // matches src/app/api/pipeline/[deviceId]/start/route.ts.
        ensurePipelineDir(deviceId);
        const proc = spawn('npx', ['tsx', 'scripts/pipeline-runner.ts', deviceId], {
          detached: true,
          stdio: 'ignore',
        });
        proc.unref();
        runnerPid = proc.pid ?? null;
        currentState.status = 'running';
        currentState.runnerPid = runnerPid;
        writeState(deviceId, currentState);
        appendLog(deviceId, {
          level: 'info',
          message: `[recheck-coverage] runner spawned (PID ${runnerPid}) to apply directives + rebuild missing tutorials. PR #171 skip-existing protects the ${confirmedIds.length} already-built tutorials.`,
        });
        selfHealTriggered = true;
      } catch (err) {
        appendLog(deviceId, { level: 'warn', message: `[recheck-coverage] self-heal failed: ${(err as Error).message}` });
      }
    }

    const response: RecheckResponse = {
      ok: true,
      summary,
      missing,
      parentOnlyGaps,
      matchTablePath: path.relative(process.cwd(), matchTablePath),
      costUsd: result.costEntry?.costUsd ?? 0,
      verdict: {
        name: verdict.verdict,
        reason: verdict.reason,
        shouldAutoRetry: verdict.shouldAutoRetry,
        coveragePct: verdict.matchTable?.coveragePct ?? 0,
        selfHealTriggered,
        retryCount: selfHealTriggered ? retryCount + 1 : retryCount,
        maxRetries: MAX_AUDIT_RETRIES,
      },
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
