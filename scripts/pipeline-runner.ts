#!/usr/bin/env npx tsx
/**
 * Pipeline Runner — Detached state machine for Claude CLI agent orchestration.
 *
 * Usage: npx tsx scripts/pipeline-runner.ts <device-id>
 *
 * Spawned as a detached process by the API route. Persists across server restarts.
 * Writes state to .pipeline/<device-id>/state.json (atomic writes).
 * Reads agent checkpoints from .claude/agent-memory/<id>/checkpoint.md.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  readState,
  writeState,
  startPhase,
  completePhase,
  advancePhase,
  createEscalation,
  appendLog,
  createWorktree,
  removeWorktree,
} from '../src/lib/pipeline/state-machine';
import {
  invokeAgent,
  checkDevServer,
  startDevServer,
  sendNotification,
} from '../src/lib/pipeline/runner';
import { parseCheckpoint } from '../src/lib/pipeline/checkpoint-parser';
import {
  accumulateCost,
  recordCostEntry,
  checkBudget,
  updateBurnRate,
  updateSubscription,
} from '../src/lib/pipeline/cost-tracker';
import { PipelineState, SectionStatus } from '../src/lib/pipeline/types';
import * as validators from '../src/lib/pipeline/checkpoint-validators';

const deviceId = process.argv[2];
if (!deviceId) {
  console.error('Usage: npx tsx scripts/pipeline-runner.ts <device-id>');
  process.exit(1);
}

/** Resolved worktree path — all agent invocations run here */
let worktreeCwd: string;

/**
 * Sandboxed tool set for pipeline agents.
 * Excludes Skill, Agent, WebSearch, WebFetch — prevents agents from
 * invoking skills (launch-instrument, etc.) or spawning subagents,
 * which would bypass the pipeline orchestration.
 */
const PIPELINE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'];

/** Max auto-retries per phase before escalating to human */
const MAX_PHASE_RETRIES = 2;

/** Track retry counts per phase to avoid infinite loops */
const phaseRetries: Record<string, number> = {};

/**
 * Escalation types that require human intervention — never auto-retry.
 * Everything else gets retried up to MAX_PHASE_RETRIES times.
 */
const HUMAN_REQUIRED_ESCALATIONS = new Set([
  'budget-exceeded',
  'manual-not-found',
  'panel-pr-review',
  'curriculum-review',
  'topology-deadlock',
  'two-strike-halt',
  'physical-impossibility',
  'template-review',
]);

/**
 * Try to auto-retry instead of escalating. Returns true if we should retry
 * (the escalation was NOT created), false if the escalation was created and
 * the pipeline should pause.
 */
function tryAutoRetry(
  state: PipelineState,
  type: string,
  message: string,
  prUrl?: string
): boolean {
  if (HUMAN_REQUIRED_ESCALATIONS.has(type)) {
    createEscalation(state, type as Parameters<typeof createEscalation>[1], message, prUrl);
    return false;
  }

  const key = `${state.currentPhase}:${type}`;
  phaseRetries[key] = (phaseRetries[key] ?? 0) + 1;

  if (phaseRetries[key] > MAX_PHASE_RETRIES) {
    appendLog(deviceId, {
      level: 'warn',
      message: `Auto-retry exhausted (${MAX_PHASE_RETRIES}x) for ${state.currentPhase}: ${message}. Escalating to human.`,
    });
    createEscalation(state, type as Parameters<typeof createEscalation>[1], message, prUrl);
    return false;
  }

  appendLog(deviceId, {
    level: 'info',
    message: `Auto-retrying ${state.currentPhase} (attempt ${phaseRetries[key]}/${MAX_PHASE_RETRIES}): ${message}`,
  });

  // Reset the phase so the main loop re-runs it
  const phaseResult = state.phases.find((p) => p.phase === state.currentPhase);
  if (phaseResult) {
    phaseResult.status = 'running';
    phaseResult.completedAt = null;
  }

  return true;
}

function getRemainingBudget(state: PipelineState): number {
  return state.budgetCapUsd - (state.totalActualCostUsd || state.totalCostUsd);
}

function isBudgetOk(state: PipelineState): boolean {
  return checkBudget(state).allowed;
}

/**
 * Check if an agent has existing work from a previous interrupted run.
 * Returns a resume context string to prepend to the agent prompt, or empty string.
 */
function getResumeContext(agent: string): string {
  try {
    const checkpointPath = path.join(worktreeCwd, '.claude', 'agent-memory', agent, 'checkpoint.md');
    if (!fs.existsSync(checkpointPath)) return '';

    const content = fs.readFileSync(checkpointPath, 'utf-8');
    if (!content.trim()) return '';

    return `\n\n--- RESUME CONTEXT ---
A previous run of this agent was interrupted. It left a checkpoint at:
.claude/agent-memory/${agent}/checkpoint.md

Read that checkpoint file FIRST. Continue from where it left off rather than starting from scratch.
If the checkpoint indicates the work was complete, verify and finalize rather than redoing.
--- END RESUME CONTEXT ---\n`;
  } catch {
    return '';
  }
}

/** Track the active child (claude CLI) PID in state so recovery can kill it */
function trackChildPid(state: PipelineState, pid: number | null) {
  state.childPid = pid;
  writeState(deviceId, state);
}

async function run() {
  let state = readState(deviceId);
  if (!state) {
    console.error(`No state found for device: ${deviceId}`);
    process.exit(1);
  }

  state.status = 'running';
  state.runnerPid = process.pid;

  // Set up worktree if not already created
  if (!state.worktreePath || !fs.existsSync(state.worktreePath)) {
    appendLog(deviceId, {
      level: 'info',
      message: `Creating git worktree for isolated execution...`,
    });
    try {
      const wtPath = createWorktree(deviceId, state.branch);
      state.worktreePath = wtPath;
      appendLog(deviceId, {
        level: 'info',
        message: `Worktree created at ${wtPath}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendLog(deviceId, { level: 'error', message: `Failed to create worktree: ${message}` });
      state.status = 'failed';
      state.currentPhase = 'failed';
      writeState(deviceId, state);
      return;
    }
  }

  worktreeCwd = state.worktreePath!;

  // Copy uploaded manuals into worktree (they're in the project root, not in the git checkout)
  for (const manualPath of state.manualPaths) {
    const absSource = path.resolve(manualPath);
    const destInWorktree = path.join(worktreeCwd, manualPath);
    const destDir = path.dirname(destInWorktree);
    if (fs.existsSync(absSource) && !fs.existsSync(destInWorktree)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(absSource, destInWorktree);
      appendLog(deviceId, { level: 'info', message: `Copied manual to worktree: ${manualPath}` });
    }
  }

  writeState(deviceId, state);

  appendLog(deviceId, {
    level: 'info',
    message: `Pipeline runner started (PID: ${process.pid}) in worktree: ${worktreeCwd}, phase: ${state.currentPhase}`,
  });

  // Heartbeat: update state.updatedAt every 30s so the admin UI knows we're alive
  const heartbeatInterval = setInterval(() => {
    try {
      const current = readState(deviceId);
      if (current && current.status === 'running') {
        writeState(deviceId, current); // writeState sets updatedAt automatically
      }
    } catch { /* ignore heartbeat errors */ }
  }, 30_000);

  try {
    while (state.status === 'running') {
      const budgetCheck = checkBudget(state);
      if (!budgetCheck.allowed) {
        createEscalation(state, 'budget-exceeded',
          `Budget cap of $${state.budgetCapUsd} exceeded. Total cost: $${(state.totalActualCostUsd || state.totalCostUsd).toFixed(2)}`);
        writeState(deviceId, state);
        sendNotification('Miyagi Pipeline', `Budget exceeded for ${state.deviceName}`);
        break;
      }
      if (budgetCheck.warning) {
        appendLog(deviceId, { level: 'warn', message: budgetCheck.warning });
      }

      writeState(deviceId, state);

      switch (state.currentPhase) {
        case 'pending':
          await doPending(state);
          break;
        case 'phase-preflight':
          await doPreflight(state);
          break;
        case 'phase-0-diagram-parser':
          await doPhase0DiagramParser(state);
          break;
        case 'phase-0-gatekeeper':
          await doPhase0(state);
          break;
        case 'phase-0-layout-engine':
          await doPhase0LayoutEngine(state);
          break;
        case 'phase-1-section-loop':
          await doPhase1(state);
          break;
        case 'phase-2-global-assembly':
          await doPhase2(state);
          break;
        case 'phase-3-harmonic-polish':
          await doPhase3(state);
          break;
        case 'panel-pr':
          await doPanelPR(state);
          break;
        case 'phase-4-extraction':
          await doPhase4Extract(state);
          break;
        case 'phase-4-audit':
          await doPhase4Audit(state);
          break;
        case 'phase-5-tutorial-build':
          await doPhase5(state);
          break;
        case 'tutorial-pr':
          await doTutorialPR(state);
          break;
        case 'completed':
        case 'failed':
          state.status = state.currentPhase === 'completed' ? 'completed' : 'failed';
          break;
        default:
          appendLog(deviceId, { level: 'error', message: `Unknown phase: ${state.currentPhase}` });
          state.status = 'failed';
          state.currentPhase = 'failed';
      }

      // Clear child PID after each phase iteration
      state.childPid = null;
      writeState(deviceId, state);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendLog(deviceId, { level: 'error', message: `Pipeline crashed: ${message}` });
    state.status = 'failed';
    state.currentPhase = 'failed';
    writeState(deviceId, state);
    sendNotification('Miyagi Pipeline', `Pipeline failed for ${state.deviceName}: ${message}`);
  }

  clearInterval(heartbeatInterval);
  state.runnerPid = null;

  // Clean up worktree on completion or failure (but not on pause — we resume later)
  if (state.status === 'completed' || state.status === 'failed') {
    appendLog(deviceId, { level: 'info', message: 'Cleaning up worktree...' });
    try {
      removeWorktree(deviceId);
      state.worktreePath = null;
    } catch {
      appendLog(deviceId, { level: 'warn', message: 'Failed to remove worktree — manual cleanup may be needed' });
    }
  }

  writeState(deviceId, state);

  appendLog(deviceId, {
    level: 'info',
    message: `Pipeline runner exiting with status: ${state.status}`,
  });

  if (state.status === 'completed') {
    sendNotification('Miyagi Pipeline', `Pipeline completed for ${state.deviceName}!`);
  }
}

// --- Phase Handlers ---

async function doPending(state: PipelineState) {
  appendLog(deviceId, { level: 'info', message: 'Transitioning from pending...' });
  advancePhase(state, worktreeCwd);
}

async function doPreflight(state: PipelineState) {
  startPhase(state, 'phase-preflight');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase Preflight: Auto-download manual' });
  if (!isBudgetOk(state)) return;

  const outputDir = path.join(worktreeCwd, 'docs', state.manufacturer, deviceId);

  // Install MCP server deps if needed (with file lock to prevent races)
  const mcpDir = path.resolve('mcp-servers/synth-manual-mcp');
  const lockFile = path.join(mcpDir, 'install.lock');
  if (!fs.existsSync(path.join(mcpDir, 'node_modules'))) {
    // Simple file lock: if lock exists and is recent (< 2 min), wait; otherwise take it
    let locked = false;
    try {
      const lockStat = fs.statSync(lockFile);
      locked = Date.now() - lockStat.mtimeMs < 120000;
    } catch { /* no lock file */ }

    if (locked) {
      appendLog(deviceId, { level: 'info', message: 'Waiting for MCP server install (another pipeline is installing)...' });
      // Wait up to 60s for the other install to finish
      let waited = 0;
      while (fs.existsSync(lockFile) && waited < 60000) {
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
        await wait(2000);
        waited += 2000;
      }
    } else {
      try {
        fs.writeFileSync(lockFile, String(process.pid));
        appendLog(deviceId, { level: 'info', message: 'Installing MCP server dependencies...' });
        execSync('npm install', { cwd: mcpDir, stdio: 'pipe' });
      } finally {
        try { fs.unlinkSync(lockFile); } catch { /* ignore */ }
      }
    }
  }

  // Write MCP config to worktree so Claude CLI discovers the server
  const settingsPath = path.join(worktreeCwd, '.claude', 'settings.json');
  const mcpServerPath = path.resolve('mcp-servers/synth-manual-mcp/index.ts');
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch {
    // No existing settings
  }
  settings.mcpServers = {
    ...(settings.mcpServers as Record<string, unknown> ?? {}),
    'synth-manual-mcp': {
      command: 'npx',
      args: ['tsx', mcpServerPath],
    },
  };
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  const result = await invokeAgent({
    prompt: `Find and download the product manual PDF for:
- Manufacturer: ${state.manufacturer}
- Device: ${state.deviceName}

Use the download_device_manual tool with outputDir: "${outputDir}"

If the automated search doesn't find it, try:
1. Use WebSearch to find "${state.manufacturer} ${state.deviceName} manual PDF download"
2. Look for direct PDF links in the results
3. Use download_pdf_from_url to download any PDF you find

Save all manuals to: ${outputDir}

If you cannot find or download the manual after trying all approaches, state clearly that the manual was not found.`,
    deviceId,
    cwd: worktreeCwd,
    phase: 'phase-preflight',
    agent: 'preflight',
    allowedTools: [
      'mcp__synth-manual-mcp__download_device_manual',
      'mcp__synth-manual-mcp__download_pdf_from_url',
      'WebSearch',
      'WebFetch',
      'Bash',
      'Write',
      'Read',
    ],
    remainingBudgetUsd: getRemainingBudget(state),
    onChildPid: (pid) => trackChildPid(state, pid),
  });

  if (result.costEntry) {
    accumulateCost(state, result.costEntry);
    recordCostEntry(deviceId, result.costEntry);
  }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

  // Check if any PDFs were downloaded
  const downloadedPdfs = findPdfsInDir(outputDir);

  if (downloadedPdfs.length > 0) {
    // Store paths relative to worktree for agent prompts
    state.manualPaths = downloadedPdfs.map((p) => path.relative(worktreeCwd, p));
    completePhase(state, 'phase-preflight', null, true);
    appendLog(deviceId, { level: 'info', message: `Manual downloaded: ${state.manualPaths.join(', ')}` });
    advancePhase(state, worktreeCwd);
  } else {
    completePhase(state, 'phase-preflight', null, false);
    createEscalation(state, 'manual-not-found',
      `Could not find manual for ${state.manufacturer} ${state.deviceName}. Please upload manually via the admin UI.`);
    sendNotification('Miyagi Pipeline', `Manual not found for ${state.deviceName} — please upload manually`);
  }
}

async function doPhase0DiagramParser(state: PipelineState) {
  startPhase(state, 'phase-0-diagram-parser');
  appendLog(deviceId, { level: 'info', agent: 'diagram-parser', message: 'Starting Phase 0a: Diagram Parser (vision extraction)' });
  if (!isBudgetOk(state)) return;

  const manualList = state.manualPaths.map((p) => `  - ${p}`).join('\n');
  const resumeCtx = getResumeContext('diagram-parser');
  const prompt = `You are the Diagram Parser agent. Extract spatial geometry from hardware photos and manual diagrams for:
- Device: ${state.deviceName}
- Manufacturer: ${state.manufacturer}
- Device ID: ${deviceId}
- Manuals:
${manualList}

Your job is to be a SURVEYOR — extract spatial facts from images. Do NOT interpret, name, or design anything.

For each section on the hardware panel:
1. Identify section boundaries (bounding boxes as % of panel)
2. Extract control centroids (2 decimal precision, % of section)
3. Discover neighbors (±3% threshold in 4 cardinal directions)
4. Classify topology (grid-NxM, single-column, single-row, cluster-above-anchor, etc.)
5. Lock proportions (height splits, aspect ratios)
6. Document aspect ratios for all elements

Output spatial-blueprint JSON per section.
Write your checkpoint to .claude/agent-memory/diagram-parser/checkpoint.md with YAML frontmatter.
Include: agent: diagram-parser, deviceId: ${deviceId}, phase: 0, status, score, verdict, timestamp${resumeCtx}`;

  const result = await invokeAgent({
    prompt,
    deviceId,
    cwd: worktreeCwd,
    phase: 'phase-0-diagram-parser',
    agent: 'diagram-parser',
    model: 'claude-opus-4-6',
    allowedTools: PIPELINE_TOOLS,
    remainingBudgetUsd: getRemainingBudget(state),
    onChildPid: (pid) => trackChildPid(state, pid),
  });

  if (result.costEntry) {
    accumulateCost(state, result.costEntry);
    recordCostEntry(deviceId, result.costEntry);
  }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

  const checkpoint = readAgentCheckpoint('diagram-parser');
  const checkpointFileExists = fs.existsSync(
    path.join(worktreeCwd, '.claude', 'agent-memory', 'diagram-parser', 'checkpoint.md')
  );
  const parserPassed =
    (checkpoint.score !== null && checkpoint.score >= 9.0) ||
    (result.exitCode === 0 && checkpointFileExists);

  if (parserPassed) {
    completePhase(state, 'phase-0-diagram-parser', checkpoint.score ?? 10, true);
    advancePhase(state, worktreeCwd);
  } else if (result.exitCode !== 0) {
    if (!tryAutoRetry(state, 'agent-failure', `Diagram Parser failed with exit code ${result.exitCode}`)) return;
  } else {
    completePhase(state, 'phase-0-diagram-parser', checkpoint.score, false);
    if (!tryAutoRetry(state, 'agent-failure', `Diagram Parser scored below 9.0`)) return;
  }
}

async function doPhase0(state: PipelineState) {
  startPhase(state, 'phase-0-gatekeeper');
  appendLog(deviceId, { level: 'info', agent: 'gatekeeper', message: 'Starting Phase 0: Gatekeeper' });

  const serverUp = await checkDevServer();
  if (!serverUp) {
    appendLog(deviceId, { level: 'info', message: 'Dev server not running, starting...' });
    const started = await startDevServer(worktreeCwd);
    if (!started) {
      if (!tryAutoRetry(state, 'agent-failure', 'Could not start dev server. Please start it manually with `npm run dev`.')) return;
      return; // retry will re-enter doPhase0
    }
  }

  // Install deps in worktree if needed
  if (!fs.existsSync(path.join(worktreeCwd, 'node_modules'))) {
    appendLog(deviceId, { level: 'info', message: 'Installing dependencies in worktree...' });
    execSync('npm install', { cwd: worktreeCwd, stdio: 'pipe' });
  }

  const manualList = state.manualPaths.map((p) => `  - ${p}`).join('\n');
  const resumeCtx = getResumeContext('gatekeeper');
  const prompt = `You are the Gatekeeper agent (JUDGE ONLY). Produce the Master Manifest for:
- Device: ${state.deviceName}
- Manufacturer: ${state.manufacturer}
- Device ID: ${deviceId}
- Manuals:
${manualList}

IMPORTANT: You are the JUDGE. You reconcile TWO independent data streams:
1. Manual text (read the PDFs for control names, functional groups, parameter info)
2. Diagram Parser output (read .claude/agent-memory/diagram-parser/checkpoint.md for spatial geometry)

Your job is to RECONCILE these into a Master Manifest JSON. Rules:
- Geometry (Parser) wins PLACEMENT decisions
- Text (Manual) wins NAMING decisions
- Conflicts must be FLAGGED, not smoothed

You must select archetypes ONLY from the Layout Engine's defined library:
grid-NxM, single-column, single-row, anchor-layout, cluster-above-anchor,
cluster-below-anchor, dual-column, stacked-rows.
Unknown layouts = flag for manual review, do NOT invent archetype names.

You DO NOT produce: ASCII maps, CSS, section templates, or component structure.
The Layout Engine (a deterministic script) will generate templates from your manifest.

Output the Master Manifest JSON conforming to the MasterManifest interface in scripts/layout-engine.ts.

Write your checkpoint to .claude/agent-memory/gatekeeper/checkpoint.md with YAML frontmatter.
Include: agent: gatekeeper, deviceId: ${deviceId}, phase: 0, status, score, verdict, timestamp, conflicts${resumeCtx}`;

  const result = await invokeAgent({
    prompt,
    deviceId,
    cwd: worktreeCwd,
    phase: 'phase-0-gatekeeper',
    agent: 'gatekeeper',
    model: 'claude-opus-4-6',
    allowedTools: PIPELINE_TOOLS,
    remainingBudgetUsd: getRemainingBudget(state),
    onChildPid: (pid) => trackChildPid(state, pid),
  });

  if (result.costEntry) {
    accumulateCost(state, result.costEntry);
    recordCostEntry(deviceId, result.costEntry);
  }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

  const checkpoint = readAgentCheckpoint('gatekeeper');
  // Gatekeeper passes if: score >= 9.5, OR exit code 0 with a checkpoint file written
  // (the gatekeeper produces a manifest, not a self-score — status: complete is sufficient)
  const checkpointFileExists = fs.existsSync(
    path.join(worktreeCwd, '.claude', 'agent-memory', 'gatekeeper', 'checkpoint.md')
  );
  const gatekeeperPassed =
    (checkpoint.score !== null && checkpoint.score >= 9.5) ||
    (result.exitCode === 0 && checkpointFileExists);

  if (gatekeeperPassed) {
    completePhase(state, 'phase-0-gatekeeper', checkpoint.score ?? 10, true);
    const sections = parseSectionsFromGatekeeper();
    if (sections.length > 0) state.sections = sections;
    advancePhase(state, worktreeCwd);
  } else if (result.exitCode !== 0) {
    if (!tryAutoRetry(state, 'agent-failure', `Gatekeeper failed with exit code ${result.exitCode}`)) return;
  } else {
    completePhase(state, 'phase-0-gatekeeper', checkpoint.score, false);
    if (!tryAutoRetry(state, 'agent-failure', `Gatekeeper produced no checkpoint file`)) return;
  }
}

async function doPhase0LayoutEngine(state: PipelineState) {
  // If templates already exist and phase was completed (resuming after template-review approval),
  // just advance to the next phase.
  const outputPath = path.join('.pipeline', deviceId, 'templates.json');
  const phaseResult = state.phases.find(p => p.phase === 'phase-0-layout-engine');
  if (phaseResult?.status === 'passed' && fs.existsSync(outputPath)) {
    appendLog(deviceId, { level: 'info', message: 'Layout Engine: templates already generated, advancing after review approval' });
    advancePhase(state, worktreeCwd);
    return;
  }

  startPhase(state, 'phase-0-layout-engine');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 0e: Layout Engine (deterministic template generation)' });

  // Extract manifest JSON from gatekeeper checkpoint
  const gatekeeperCheckpointPath = path.join(
    worktreeCwd, '.claude', 'agent-memory', 'gatekeeper', 'checkpoint.md'
  );

  if (!fs.existsSync(gatekeeperCheckpointPath)) {
    completePhase(state, 'phase-0-layout-engine', null, false);
    if (!tryAutoRetry(state, 'agent-failure', 'Gatekeeper checkpoint not found — cannot run Layout Engine')) return;
    return;
  }

  // Try to extract JSON manifest from gatekeeper checkpoint
  const checkpointContent = fs.readFileSync(gatekeeperCheckpointPath, 'utf-8');
  const jsonMatch = checkpointContent.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    completePhase(state, 'phase-0-layout-engine', null, false);
    if (!tryAutoRetry(state, 'agent-failure', 'No JSON manifest found in gatekeeper checkpoint')) return;
    return;
  }

  // Write manifest to pipeline dir for the layout engine
  const manifestPath = path.join('.pipeline', deviceId, 'manifest.json');
  const outputPath = path.join('.pipeline', deviceId, 'templates.json');

  try {
    // Validate JSON is parseable before writing
    JSON.parse(jsonMatch[1]);
    fs.writeFileSync(manifestPath, jsonMatch[1], 'utf-8');
  } catch (e) {
    completePhase(state, 'phase-0-layout-engine', null, false);
    if (!tryAutoRetry(state, 'agent-failure', `Manifest JSON is invalid: ${(e as Error).message}`)) return;
    return;
  }

  // Run the deterministic layout engine
  try {
    const layoutEnginePath = path.resolve('scripts/layout-engine.ts');
    appendLog(deviceId, { level: 'info', message: `Running layout engine: ${manifestPath} → ${outputPath}` });

    execSync(
      `npx tsx "${layoutEnginePath}" "${manifestPath}" --output "${outputPath}"`,
      { cwd: worktreeCwd, stdio: 'pipe', timeout: 30_000 }
    );

    if (fs.existsSync(outputPath)) {
      const output = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      const templateCount = output.templates?.length ?? 0;
      const controlCount = output.panelArchitecture?.totalControls ?? 0;
      appendLog(deviceId, {
        level: 'info',
        message: `Layout Engine: ${templateCount} templates generated for ${controlCount} controls`,
      });
      completePhase(state, 'phase-0-layout-engine', 10, true);

      // --- Template Review Gate ---
      // Pause so the user can inspect manifest + templates before Panel Builder runs.
      // Templates: .pipeline/<deviceId>/templates.json
      // Manifest:  .pipeline/<deviceId>/manifest.json
      const archetypeSummary = (output.templates ?? [])
        .map((t: { sectionId: string; archetype: string }) => `${t.sectionId} → ${t.archetype}`)
        .join(', ');
      createEscalation(state, 'template-review',
        `Layout Engine produced ${templateCount} section templates for ${controlCount} controls. ` +
        `Review templates at .pipeline/${deviceId}/templates.json before Panel Builder runs.\n` +
        `Archetypes: ${archetypeSummary}`);
      sendNotification('Miyagi Pipeline', `Templates ready for review: ${state.deviceName}`);
    } else {
      completePhase(state, 'phase-0-layout-engine', null, false);
      if (!tryAutoRetry(state, 'agent-failure', 'Layout Engine produced no output file')) return;
    }
  } catch (e) {
    const errorMsg = (e as Error).message || String(e);
    appendLog(deviceId, { level: 'error', message: `Layout Engine failed: ${errorMsg}` });

    // Check if this is a LayoutEngineError (unknown archetype, missing fields)
    if (errorMsg.includes('LAYOUT ENGINE ERROR') || errorMsg.includes('LayoutEngineError')) {
      // This means the manifest has an unknown archetype or missing required fields.
      // Increment strike count for the gatekeeper and potentially re-run it.
      const currentStrikes = (state.strikeTracker['layout-engine'] ?? 0) + 1;
      state.strikeTracker['layout-engine'] = currentStrikes;

      if (currentStrikes >= 2) {
        // Two-Strike Rule: fatal halt
        completePhase(state, 'phase-0-layout-engine', null, false);
        createEscalation(state, 'two-strike-halt',
          `Layout Engine failed twice. The Gatekeeper's manifest uses archetypes or fields not supported by the Layout Engine. Error: ${errorMsg}`);
        sendNotification('Miyagi Pipeline', `Two-Strike halt: Layout Engine for ${state.deviceName}`);
        return;
      }

      // Strike 1: retry — go back to gatekeeper with correction context
      appendLog(deviceId, {
        level: 'warn',
        message: `Layout Engine Strike ${currentStrikes}: ${errorMsg}. Re-running Gatekeeper with correction.`,
      });
      completePhase(state, 'phase-0-layout-engine', null, false);
      state.currentPhase = 'phase-0-gatekeeper';
      return;
    }

    completePhase(state, 'phase-0-layout-engine', null, false);
    if (!tryAutoRetry(state, 'agent-failure', `Layout Engine failed: ${errorMsg}`)) return;
  }
}

async function doPhase1(state: PipelineState) {
  startPhase(state, 'phase-1-section-loop');
  appendLog(deviceId, { level: 'info', message: `Starting Phase 1: Section Loop (${state.sections.length} sections)` });

  for (const section of state.sections) {
    if (section.vaulted) continue;

    while (section.attempts < 3 && !section.vaulted) {
      section.attempts++;
      state.lastCheckpoint = { phase: 'phase-1-section-loop', subStep: `section-${section.id}-attempt-${section.attempts}` };
      writeState(deviceId, state);

      if (!isBudgetOk(state)) return;

      // SI
      appendLog(deviceId, { level: 'info', agent: 'structural-inspector', message: `SI: section ${section.id} (attempt ${section.attempts})` });
      const siResult = await invokeAgent({
        prompt: `Audit section "${section.id}" of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Read your checkpoint and the Gatekeeper's manifest first.`,
        deviceId, cwd: worktreeCwd, phase: 'phase-1-section-loop', agent: 'structural-inspector', sectionId: section.id,
        allowedTools: PIPELINE_TOOLS,
        remainingBudgetUsd: getRemainingBudget(state),
        onChildPid: (pid) => trackChildPid(state, pid),
      });
      if (siResult.costEntry) { accumulateCost(state, siResult.costEntry); recordCostEntry(deviceId, siResult.costEntry); }
      updateBurnRate(state, deviceId);
      updateSubscription(state, siResult.rateLimitEvents);
      section.siScore = readAgentCheckpoint('structural-inspector').score;

      // PQ
      appendLog(deviceId, { level: 'info', agent: 'panel-questioner', message: `PQ: section ${section.id} (attempt ${section.attempts})` });
      const pqResult = await invokeAgent({
        prompt: `Audit section "${section.id}" of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Compare the rendered panel against the reference photo.`,
        deviceId, cwd: worktreeCwd, phase: 'phase-1-section-loop', agent: 'panel-questioner', sectionId: section.id,
        allowedTools: PIPELINE_TOOLS,
        remainingBudgetUsd: getRemainingBudget(state),
        onChildPid: (pid) => trackChildPid(state, pid),
      });
      if (pqResult.costEntry) { accumulateCost(state, pqResult.costEntry); recordCostEntry(deviceId, pqResult.costEntry); }
      updateBurnRate(state, deviceId);
      updateSubscription(state, pqResult.rateLimitEvents);
      section.pqScore = readAgentCheckpoint('panel-questioner').score;

      // Critic
      appendLog(deviceId, { level: 'info', agent: 'critic', message: `Critic: section ${section.id} (attempt ${section.attempts})` });
      const criticResult = await invokeAgent({
        prompt: `Final audit of section "${section.id}" of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Review SI and PQ findings, then render your verdict.`,
        deviceId, cwd: worktreeCwd, phase: 'phase-1-section-loop', agent: 'critic', sectionId: section.id,
        allowedTools: PIPELINE_TOOLS,
        remainingBudgetUsd: getRemainingBudget(state),
        onChildPid: (pid) => trackChildPid(state, pid),
      });
      if (criticResult.costEntry) { accumulateCost(state, criticResult.costEntry); recordCostEntry(deviceId, criticResult.costEntry); }
      updateBurnRate(state, deviceId);
      updateSubscription(state, criticResult.rateLimitEvents);
      section.criticScore = readAgentCheckpoint('critic').score;

      if (section.siScore === 10 && section.pqScore === 10 && section.criticScore === 10) {
        section.vaulted = true;
        appendLog(deviceId, { level: 'info', message: `Section ${section.id} VAULTED (attempt ${section.attempts})` });
      }

      writeState(deviceId, state);
    }

    if (!section.vaulted) {
      createEscalation(state, 'topology-deadlock',
        `Section "${section.id}" failed after ${section.attempts} attempts. Scores: SI=${section.siScore}, PQ=${section.pqScore}, Critic=${section.criticScore}`);
      sendNotification('Miyagi Pipeline', `Topology deadlock on section ${section.id}`);
      return;
    }
  }

  completePhase(state, 'phase-1-section-loop', 10, true);
  advancePhase(state, worktreeCwd);
}

async function doPhase2(state: PipelineState) {
  startPhase(state, 'phase-2-global-assembly');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 2: Global Assembly' });

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    state.lastCheckpoint = { phase: 'phase-2-global-assembly', subStep: `attempt-${attempts}` };
    writeState(deviceId, state);
    if (!isBudgetOk(state)) return;

    const result = await invokeAgent({
      prompt: `Perform global assembly audit of the ${state.deviceName} digital twin. Device ID: ${deviceId}. All sections are vaulted. Check overall layout, cross-section alignment, and global consistency.`,
      deviceId, cwd: worktreeCwd, phase: 'phase-2-global-assembly', agent: 'structural-inspector',
      allowedTools: PIPELINE_TOOLS,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, result.rateLimitEvents);

    const checkpoint = readAgentCheckpoint('structural-inspector');
    if (checkpoint.score !== null && checkpoint.score >= 10) {
      completePhase(state, 'phase-2-global-assembly', checkpoint.score, true);
      advancePhase(state, worktreeCwd);
      return;
    }
  }

  completePhase(state, 'phase-2-global-assembly', null, false);
  tryAutoRetry(state, 'agent-failure', 'Global assembly failed after 3 attempts');
}

async function doPhase3(state: PipelineState) {
  startPhase(state, 'phase-3-harmonic-polish');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 3: Harmonic Polish' });
  if (!isBudgetOk(state)) return;

  const result = await invokeAgent({
    prompt: `Perform final harmonic polish of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Apply any final visual refinements.`,
    deviceId, cwd: worktreeCwd, phase: 'phase-3-harmonic-polish', agent: 'critic',
    allowedTools: PIPELINE_TOOLS,
    remainingBudgetUsd: getRemainingBudget(state),
    onChildPid: (pid) => trackChildPid(state, pid),
  });
  if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

  const checkpoint = readAgentCheckpoint('critic');
  if (checkpoint.score !== null && checkpoint.score >= 9.5) {
    completePhase(state, 'phase-3-harmonic-polish', checkpoint.score, true);
    advancePhase(state, worktreeCwd);
  } else {
    completePhase(state, 'phase-3-harmonic-polish', checkpoint.score, false);
    tryAutoRetry(state, 'agent-failure', `Harmonic polish score ${checkpoint.score ?? 'unknown'} below threshold`);
  }
}

async function doPanelPR(state: PipelineState) {
  startPhase(state, 'panel-pr');
  appendLog(deviceId, { level: 'info', message: 'Creating panel PR...' });

  try {
    const prOutput = execSync(
      `gh pr create --base test --title "feat: ${state.deviceName} digital twin panel" --body "Automated panel build for ${state.deviceName} by Miyagi Pipeline"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], cwd: worktreeCwd }
    );
    const prUrl = prOutput.trim();
    appendLog(deviceId, { level: 'info', message: `Panel PR created: ${prUrl}` });
    createEscalation(state, 'panel-pr-review', `Panel PR ready for review: ${prUrl}`, prUrl);
    sendNotification('Miyagi Pipeline', `Panel PR ready for review: ${state.deviceName}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    tryAutoRetry(state, 'agent-failure', `Failed to create panel PR: ${message}`);
  }
}

/**
 * Get the total page count of a PDF via mdls (macOS) or pdfinfo fallback.
 * Returns 0 if unable to determine.
 */
function getManualPageCount(manualPath: string): number {
  const resolved = path.isAbsolute(manualPath) ? manualPath : path.join(worktreeCwd, manualPath);
  try {
    // Try mdls first (macOS native — fast, no deps)
    const mdlsOutput = execSync(`mdls -name kMDItemNumberOfPages "${resolved}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const match = mdlsOutput.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch { /* mdls failed */ }

  try {
    // Fallback: pdfinfo (from poppler)
    const pdfinfoOutput = execSync(`pdfinfo "${resolved}" 2>/dev/null | grep -i "^Pages:"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const match = pdfinfoOutput.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch { /* pdfinfo not available */ }

  // Last resort: invoke a quick agent to check
  return 0;
}

async function doPhase4Extract(state: PipelineState) {
  startPhase(state, 'phase-4-extraction');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 4: Manual Extraction (Sieve Protocol)' });
  if (!isBudgetOk(state)) return;

  const sieveDir = path.join(worktreeCwd, '.claude', 'agent-memory', 'manual-extractor', 'sieve');
  fs.mkdirSync(sieveDir, { recursive: true });

  // Step 1: Determine manual page count and bucket count
  const primaryManual = state.manualPaths[0];
  let totalPages = getManualPageCount(primaryManual);

  if (totalPages === 0) {
    // Ask the extractor agent to report the page count
    appendLog(deviceId, { level: 'info', message: 'Could not determine page count via mdls/pdfinfo — using agent' });
    const countResult = await invokeAgent({
      prompt: `Read the PDF at "${primaryManual}" and report ONLY the total number of pages. Output a single line: TOTAL_PAGES: <number>`,
      deviceId, cwd: worktreeCwd, phase: 'phase-4-extraction', agent: 'manual-extractor',
      allowedTools: ['Read', 'Bash'],
      maxBudgetPerInvocation: 1,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (countResult.costEntry) { accumulateCost(state, countResult.costEntry); recordCostEntry(deviceId, countResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, countResult.rateLimitEvents);

    const pageMatch = countResult.output.match(/TOTAL_PAGES:\s*(\d+)/);
    totalPages = pageMatch ? parseInt(pageMatch[1], 10) : 200; // conservative fallback
  }

  const BUCKET_SIZE = 10;
  const totalBuckets = Math.ceil(totalPages / BUCKET_SIZE);
  appendLog(deviceId, { level: 'info', message: `Manual: ${totalPages} pages → ${totalBuckets} buckets of ${BUCKET_SIZE} pages` });

  // Initialize extraction progress
  state.extractionProgress = {
    totalBuckets,
    completedBuckets: 0,
    currentSubStep: null,
    passesCompleted: 0,
  };
  writeState(deviceId, state);

  // Step 2: Resume detection — find already-completed buckets
  let startBucket = 0;
  for (let i = 0; i < totalBuckets; i++) {
    const anchoredPath = path.join(sieveDir, `bucket-${i}-anchored.md`);
    if (fs.existsSync(anchoredPath)) {
      startBucket = i + 1;
      state.extractionProgress.completedBuckets = i + 1;
    } else {
      break;
    }
  }
  if (startBucket > 0) {
    appendLog(deviceId, { level: 'info', message: `Resuming from bucket ${startBucket} (${startBucket} already complete)` });
  }

  // Step 3: Sieve → Verify → Anchor loop for each bucket
  for (let i = startBucket; i < totalBuckets; i++) {
    const pageStart = i * BUCKET_SIZE + 1;
    const pageEnd = Math.min((i + 1) * BUCKET_SIZE, totalPages);
    const bucketFile = `bucket-${i}.md`;
    const verifiedFile = `bucket-${i}-verified.md`;
    const anchoredFile = `bucket-${i}-anchored.md`;

    if (!isBudgetOk(state)) return;

    // 3a. Sieve — raw extraction
    state.extractionProgress.currentSubStep = 'sieve';
    state.lastCheckpoint = { phase: 'phase-4-extraction', subStep: `bucket-${i}-sieve` };
    writeState(deviceId, state);

    appendLog(deviceId, { level: 'info', agent: 'manual-extractor', message: `Sieve: bucket ${i} (pages ${pageStart}-${pageEnd})` });
    const sieveResult = await invokeAgent({
      prompt: `SIEVE EXTRACTION — Bucket ${i} (pages ${pageStart}-${pageEnd})

Read pages ${pageStart}-${pageEnd} of the manual at "${primaryManual}".

Output ONLY a raw CSV/table of every parameter, button, control, menu item, and setting found on these pages.

Format each row as: | Page | Control/Parameter Name (EXACT string from manual) | Type (knob/button/slider/menu/screen/parameter) | Value Range |

Rules:
- Use the EXACT names from the manual — do not paraphrase or abbreviate
- Include EVERY item, even if it seems minor
- Do NOT interpret, group, or categorize — just extract
- Do NOT mention tutorials, curriculum, learning objectives, or prerequisites
- Do NOT skip items that seem redundant

Write output to: .claude/agent-memory/manual-extractor/sieve/${bucketFile}`,
      deviceId, cwd: worktreeCwd, phase: 'phase-4-extraction', agent: 'manual-extractor',
      model: 'claude-opus-4-6',
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: 2,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (sieveResult.costEntry) { accumulateCost(state, sieveResult.costEntry); recordCostEntry(deviceId, sieveResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, sieveResult.rateLimitEvents);

    // Validate sieve bucket
    const bucketPath = path.join(sieveDir, bucketFile);
    if (fs.existsSync(bucketPath)) {
      const bucketContent = fs.readFileSync(bucketPath, 'utf-8');
      const validation = validators.validateSieveBucket(bucketContent, [pageStart, pageEnd]);
      if (!validation.valid) {
        appendLog(deviceId, { level: 'warn', message: `Bucket ${i} validation failed: ${validation.errors.join('; ')}` });
        if (!tryAutoRetry(state, 'agent-failure', `Sieve bucket ${i} invalid: ${validation.errors.join('; ')}`)) return;
        return; // retry will re-enter doPhase4Extract and resume from this bucket
      }
    } else {
      appendLog(deviceId, { level: 'warn', message: `Bucket ${i} file not created` });
      if (!tryAutoRetry(state, 'agent-failure', `Sieve bucket ${i} file was not created`)) return;
      return;
    }

    if (!isBudgetOk(state)) return;

    // 3b. Verify — re-read same pages, check for omissions
    state.extractionProgress.currentSubStep = 'verify';
    state.lastCheckpoint = { phase: 'phase-4-extraction', subStep: `bucket-${i}-verify` };
    writeState(deviceId, state);

    appendLog(deviceId, { level: 'info', agent: 'manual-extractor', message: `Verify: bucket ${i}` });
    const verifyResult = await invokeAgent({
      prompt: `SIEVE VERIFICATION — Bucket ${i} (pages ${pageStart}-${pageEnd})

1. Read the sieve bucket at: .claude/agent-memory/manual-extractor/sieve/${bucketFile}
2. Re-read pages ${pageStart}-${pageEnd} of "${primaryManual}"
3. Compare: find any omissions or typos in the bucket table
4. Write the corrected table to: .claude/agent-memory/manual-extractor/sieve/${verifiedFile}
5. Add a "VERIFIED" header at the top, followed by a summary of corrections made (or "No corrections needed")

Focus ONLY on:
- Missing parameters/controls
- Misspelled names (compare against manual text exactly)
- Wrong page numbers
- Missing value ranges`,
      deviceId, cwd: worktreeCwd, phase: 'phase-4-extraction', agent: 'manual-extractor',
      model: 'claude-opus-4-6',
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: 2,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (verifyResult.costEntry) { accumulateCost(state, verifyResult.costEntry); recordCostEntry(deviceId, verifyResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, verifyResult.rateLimitEvents);

    // Validate verified file
    const verifiedPath = path.join(sieveDir, verifiedFile);
    if (fs.existsSync(verifiedPath)) {
      const verifiedContent = fs.readFileSync(verifiedPath, 'utf-8');
      const validation = validators.validateSieveVerified(verifiedContent);
      if (!validation.valid) {
        appendLog(deviceId, { level: 'warn', message: `Verified bucket ${i} validation failed: ${validation.errors.join('; ')}` });
        if (!tryAutoRetry(state, 'agent-failure', `Verified bucket ${i} invalid: ${validation.errors.join('; ')}`)) return;
        return;
      }
    } else {
      appendLog(deviceId, { level: 'warn', message: `Verified bucket ${i} file not created` });
      if (!tryAutoRetry(state, 'agent-failure', `Verified bucket ${i} file was not created`)) return;
      return;
    }

    if (!isBudgetOk(state)) return;

    // 3c. Anchor — cross-reference against panel constants
    state.extractionProgress.currentSubStep = 'anchor';
    state.lastCheckpoint = { phase: 'phase-4-extraction', subStep: `bucket-${i}-anchor` };
    writeState(deviceId, state);

    appendLog(deviceId, { level: 'info', agent: 'manual-extractor', message: `Anchor: bucket ${i}` });
    const anchorResult = await invokeAgent({
      prompt: `SIEVE ANCHORING — Bucket ${i} (pages ${pageStart}-${pageEnd})

1. Read the verified extraction at: .claude/agent-memory/manual-extractor/sieve/${verifiedFile}
2. Find and read the panel constants file for ${state.deviceName} (look for panel-constants.ts or similar in src/data/)
3. Cross-reference every item in the verified table against the panel constants
4. Write results to: .claude/agent-memory/manual-extractor/sieve/${anchoredFile}

The output MUST have these three sections:
## PANEL-ONLY
Controls/parameters in the panel constants that do NOT appear in this bucket's manual pages
(This is expected for controls documented on other pages — just list them)

## MANUAL-ONLY
Controls/parameters in this bucket that do NOT appear in the panel constants
(These may need to be added to the panel)

## NAME MISMATCH
Controls where the manual name differs from the panel constants name
(Format: Manual: "X" → Panel: "Y")`,
      deviceId, cwd: worktreeCwd, phase: 'phase-4-extraction', agent: 'manual-extractor',
      model: 'claude-opus-4-6',
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: 2,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (anchorResult.costEntry) { accumulateCost(state, anchorResult.costEntry); recordCostEntry(deviceId, anchorResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, anchorResult.rateLimitEvents);

    // Validate anchored file
    const anchoredPath = path.join(sieveDir, anchoredFile);
    if (fs.existsSync(anchoredPath)) {
      const anchoredContent = fs.readFileSync(anchoredPath, 'utf-8');
      const validation = validators.validateSieveAnchored(anchoredContent);
      if (!validation.valid) {
        appendLog(deviceId, { level: 'warn', message: `Anchored bucket ${i} validation failed: ${validation.errors.join('; ')}` });
        if (!tryAutoRetry(state, 'agent-failure', `Anchored bucket ${i} invalid: ${validation.errors.join('; ')}`)) return;
        return;
      }
    } else {
      appendLog(deviceId, { level: 'warn', message: `Anchored bucket ${i} file not created` });
      if (!tryAutoRetry(state, 'agent-failure', `Anchored bucket ${i} file was not created`)) return;
      return;
    }

    // Bucket complete
    state.extractionProgress.completedBuckets = i + 1;
    writeState(deviceId, state);
    appendLog(deviceId, { level: 'info', message: `Bucket ${i} complete (${i + 1}/${totalBuckets})` });
  }

  state.extractionProgress.currentSubStep = null;

  // Step 4: Assembly passes (curriculum design begins only after ALL buckets sieved)
  const passConfigs = [
    {
      num: 1, name: 'Feature Inventory', file: 'pass-1-inventory.md',
      validate: validators.validatePassInventory, cap: 5,
      prompt: `PASS 1 — FEATURE INVENTORY

Read ALL verified sieve buckets in .claude/agent-memory/manual-extractor/sieve/bucket-*-verified.md

Produce a consolidated Feature Inventory:
1. **Feature Inventory** — Every unique feature/workflow grouped by manual chapter, with page references
2. **Page Coverage Map** — Which pages are covered, which have gaps

Write to: .claude/agent-memory/manual-extractor/sieve/pass-1-inventory.md`,
    },
    {
      num: 2, name: 'Relationships', file: 'pass-2-relationships.md',
      validate: validators.validatePassRelationships, cap: 5,
      prompt: `PASS 2 — RELATIONSHIPS & DEPENDENCIES

Read: .claude/agent-memory/manual-extractor/sieve/pass-1-inventory.md

For each feature in the inventory, determine:
1. **Prerequisites** — What must the user know/configure before using this feature?
2. **Dependencies** — Which other features does this one depend on?
3. **Dependency JSON** — Output a JSON array: [{ "feature": "name", "depends_on": ["feat1", "feat2"] }]

Write to: .claude/agent-memory/manual-extractor/sieve/pass-2-relationships.md`,
    },
    {
      num: 3, name: 'Curriculum Design', file: 'pass-3-curriculum.md',
      validate: validators.validatePassCurriculum, cap: 5,
      prompt: `PASS 3 — CURRICULUM DESIGN

Read:
- .claude/agent-memory/manual-extractor/sieve/pass-1-inventory.md
- .claude/agent-memory/manual-extractor/sieve/pass-2-relationships.md

Design the tutorial curriculum:
1. Group features into TUTORIAL blocks (3-8 related features per tutorial)
2. Name each tutorial descriptively
3. For each TUTORIAL, list: title, features covered, manual pages, prerequisites
4. Build a DAG (dependency graph) showing tutorial ordering
5. Output the DAG as both ASCII art and a JSON dependency array

Write to: .claude/agent-memory/manual-extractor/sieve/pass-3-curriculum.md`,
    },
    {
      num: 4, name: 'Batch Plan', file: 'pass-4-batches.md',
      validate: validators.validatePassBatches, cap: 5,
      prompt: `PASS 4 — BATCH PLAN

Read:
- .claude/agent-memory/manual-extractor/sieve/pass-3-curriculum.md

Group tutorials into BATCH blocks for implementation:
1. Each BATCH should contain 3-5 tutorials that can be built together
2. Respect the dependency chain — no batch should depend on a later batch
3. For each BATCH: list tutorials, estimated complexity, dependency chain to prior batches
4. Define the execution order for batches

Also write the final checkpoint to .claude/agent-memory/manual-extractor/checkpoint.md with YAML frontmatter:
agent: manual-extractor, device_id: ${deviceId}, phase: 4, status: PASS, score: 10

Write batch plan to: .claude/agent-memory/manual-extractor/sieve/pass-4-batches.md`,
    },
  ];

  for (const pass of passConfigs) {
    // Resume: skip if pass output already exists
    const passPath = path.join(sieveDir, pass.file);
    if (fs.existsSync(passPath)) {
      appendLog(deviceId, { level: 'info', message: `Pass ${pass.num} (${pass.name}) already complete, skipping` });
      state.extractionProgress.passesCompleted = pass.num;
      continue;
    }

    if (!isBudgetOk(state)) return;

    state.lastCheckpoint = { phase: 'phase-4-extraction', subStep: `pass-${pass.num}` };
    writeState(deviceId, state);

    appendLog(deviceId, { level: 'info', agent: 'manual-extractor', message: `Pass ${pass.num}: ${pass.name}` });
    const passResult = await invokeAgent({
      prompt: pass.prompt,
      deviceId, cwd: worktreeCwd, phase: 'phase-4-extraction', agent: 'manual-extractor',
      model: 'claude-opus-4-6',
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: pass.cap,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (passResult.costEntry) { accumulateCost(state, passResult.costEntry); recordCostEntry(deviceId, passResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, passResult.rateLimitEvents);

    // Validate pass output
    if (fs.existsSync(passPath)) {
      const passContent = fs.readFileSync(passPath, 'utf-8');
      const validation = pass.validate(passContent);
      if (!validation.valid) {
        appendLog(deviceId, { level: 'warn', message: `Pass ${pass.num} validation failed: ${validation.errors.join('; ')}` });
        if (!tryAutoRetry(state, 'agent-failure', `Pass ${pass.num} (${pass.name}) invalid: ${validation.errors.join('; ')}`)) return;
        return;
      }
    } else {
      appendLog(deviceId, { level: 'warn', message: `Pass ${pass.num} output file not created` });
      if (!tryAutoRetry(state, 'agent-failure', `Pass ${pass.num} (${pass.name}) output file was not created`)) return;
      return;
    }

    state.extractionProgress.passesCompleted = pass.num;
    writeState(deviceId, state);
    appendLog(deviceId, { level: 'info', message: `Pass ${pass.num} (${pass.name}) complete` });
  }

  // All sieve + passes complete
  const checkpoint = readAgentCheckpoint('manual-extractor');
  const score = checkpoint.score ?? 10;
  completePhase(state, 'phase-4-extraction', score, true);
  advancePhase(state, worktreeCwd);
}

async function doPhase4Audit(state: PipelineState) {
  startPhase(state, 'phase-4-audit');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 4: Coverage Audit (Independence Enforced)' });
  if (!isBudgetOk(state)) return;

  const extractorMemDir = path.join(worktreeCwd, '.claude', 'agent-memory', 'manual-extractor');
  const sealedDir = path.join(worktreeCwd, '.claude', 'agent-memory', '.extractor-sealed');
  const auditorSieveDir = path.join(worktreeCwd, '.claude', 'agent-memory', 'coverage-auditor');
  const independentChecklistPath = path.join(auditorSieveDir, 'independent-checklist.md');
  const comparativeAuditPath = path.join(auditorSieveDir, 'comparative-audit.md');

  fs.mkdirSync(auditorSieveDir, { recursive: true });

  // Phase 1: Independent reading — SEAL extractor output
  let sealed = false;
  try {
    // Resume: skip Phase 1 if independent checklist already exists
    if (fs.existsSync(independentChecklistPath)) {
      appendLog(deviceId, { level: 'info', message: 'Independent checklist already exists, skipping Phase 1' });
    } else {
      // Seal extractor output so auditor can't see it
      if (fs.existsSync(extractorMemDir)) {
        appendLog(deviceId, { level: 'info', message: 'Sealing extractor output for auditor independence' });
        fs.renameSync(extractorMemDir, sealedDir);
        sealed = true;
      }

      state.lastCheckpoint = { phase: 'phase-4-audit', subStep: 'independent-read' };
      writeState(deviceId, state);

      appendLog(deviceId, { level: 'info', agent: 'coverage-auditor', message: 'Phase 1: Independent manual reading' });
      const phase1Result = await invokeAgent({
        prompt: `INDEPENDENT COVERAGE AUDIT — Phase 1

You are the Coverage Auditor. Read the ${state.deviceName} manual at "${state.manualPaths.join(', ')}" INDEPENDENTLY.

Do NOT look for or reference any extractor output. Build your OWN checklist from scratch.

For each chapter/section of the manual:
1. List every feature, workflow, and parameter you find
2. Note the page numbers
3. Assess complexity (simple/medium/complex)
4. Note any dependencies between features

Write your independent checklist to: .claude/agent-memory/coverage-auditor/independent-checklist.md

Rules:
- Work ONLY from the manual — do not read any files in .claude/agent-memory/manual-extractor/
- Do not reference sieve buckets, passes, or extractor output
- This is YOUR independent assessment`,
        deviceId, cwd: worktreeCwd, phase: 'phase-4-audit', agent: 'coverage-auditor',
        model: 'claude-opus-4-6',
        allowedTools: PIPELINE_TOOLS,
        maxBudgetPerInvocation: 5,
        remainingBudgetUsd: getRemainingBudget(state),
        onChildPid: (pid) => trackChildPid(state, pid),
      });
      if (phase1Result.costEntry) { accumulateCost(state, phase1Result.costEntry); recordCostEntry(deviceId, phase1Result.costEntry); }
      updateBurnRate(state, deviceId);
      updateSubscription(state, phase1Result.rateLimitEvents);

      // Validate independence
      if (fs.existsSync(independentChecklistPath)) {
        const checklistContent = fs.readFileSync(independentChecklistPath, 'utf-8');
        const validation = validators.validateIndependentChecklist(checklistContent);
        if (!validation.valid) {
          appendLog(deviceId, { level: 'warn', message: `Independent checklist validation failed: ${validation.errors.join('; ')}` });
          // This is a serious integrity failure — don't auto-retry, escalate
          createEscalation(state, 'agent-failure' as Parameters<typeof createEscalation>[1],
            `Auditor independence violated: ${validation.errors.join('; ')}`);
          return;
        }
      } else {
        appendLog(deviceId, { level: 'warn', message: 'Independent checklist file not created' });
        if (!tryAutoRetry(state, 'agent-failure', 'Auditor did not create independent-checklist.md')) return;
        return;
      }
    }
  } finally {
    // UNSEAL — restore extractor files (crash-safe: always runs)
    if (sealed && fs.existsSync(sealedDir)) {
      appendLog(deviceId, { level: 'info', message: 'Unsealing extractor output' });
      // If extractorMemDir was recreated during the agent run, merge
      if (fs.existsSync(extractorMemDir)) {
        // Move sealed contents back — don't overwrite anything the auditor created
        const sealedFiles = fs.readdirSync(sealedDir);
        for (const file of sealedFiles) {
          const src = path.join(sealedDir, file);
          const dest = path.join(extractorMemDir, file);
          if (!fs.existsSync(dest)) {
            fs.renameSync(src, dest);
          }
        }
        fs.rmSync(sealedDir, { recursive: true, force: true });
      } else {
        fs.renameSync(sealedDir, extractorMemDir);
      }
      sealed = false;
    }
  }

  if (!isBudgetOk(state)) return;

  // Phase 2: Comparative audit — now the auditor CAN see extractor output
  if (!fs.existsSync(comparativeAuditPath)) {
    state.lastCheckpoint = { phase: 'phase-4-audit', subStep: 'comparative-audit' };
    writeState(deviceId, state);

    appendLog(deviceId, { level: 'info', agent: 'coverage-auditor', message: 'Phase 2: Comparative audit' });
    const phase2Result = await invokeAgent({
      prompt: `COMPARATIVE COVERAGE AUDIT — Phase 2

Now compare your independent checklist against the extractor's output.

Read:
1. Your independent checklist: .claude/agent-memory/coverage-auditor/independent-checklist.md
2. The extractor's inventory: .claude/agent-memory/manual-extractor/sieve/pass-1-inventory.md
3. The extractor's curriculum: .claude/agent-memory/manual-extractor/sieve/pass-3-curriculum.md
4. The extractor's batch plan: .claude/agent-memory/manual-extractor/sieve/pass-4-batches.md

Produce a comparative audit with these sections:

## FEATURE GAP ANALYSIS
Features YOU found that the extractor MISSED (list each with page reference)

## EXTRA FEATURES
Features the extractor found that you did NOT (verify these against the manual)

## COVERAGE SCORE
Percentage of your checklist features covered by the extractor

## DEPENDENCY ERRORS
Any dependency ordering mistakes in the extractor's curriculum/batch plan

## RECOMMENDATIONS
Specific fixes needed before the curriculum can be approved

Write to: .claude/agent-memory/coverage-auditor/comparative-audit.md`,
      deviceId, cwd: worktreeCwd, phase: 'phase-4-audit', agent: 'coverage-auditor',
      model: 'claude-opus-4-6',
      allowedTools: PIPELINE_TOOLS,
      maxBudgetPerInvocation: 5,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (phase2Result.costEntry) { accumulateCost(state, phase2Result.costEntry); recordCostEntry(deviceId, phase2Result.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, phase2Result.rateLimitEvents);

    // Validate comparative audit
    if (fs.existsSync(comparativeAuditPath)) {
      const auditContent = fs.readFileSync(comparativeAuditPath, 'utf-8');
      if (!/FEATURE\s+GAP\s+ANALYSIS/i.test(auditContent)) {
        appendLog(deviceId, { level: 'warn', message: 'Comparative audit missing FEATURE GAP ANALYSIS section' });
        if (!tryAutoRetry(state, 'agent-failure', 'Comparative audit missing required sections')) return;
        return;
      }
    } else {
      appendLog(deviceId, { level: 'warn', message: 'Comparative audit file not created' });
      if (!tryAutoRetry(state, 'agent-failure', 'Auditor did not create comparative-audit.md')) return;
      return;
    }
  } else {
    appendLog(deviceId, { level: 'info', message: 'Comparative audit already exists, skipping Phase 2' });
  }

  if (!isBudgetOk(state)) return;

  // Phase 3: Final verdict
  state.lastCheckpoint = { phase: 'phase-4-audit', subStep: 'verdict' };
  writeState(deviceId, state);

  appendLog(deviceId, { level: 'info', agent: 'coverage-auditor', message: 'Phase 3: Final verdict' });
  const verdictResult = await invokeAgent({
    prompt: `COVERAGE AUDIT — Phase 3: Verdict

Read your comparative audit: .claude/agent-memory/coverage-auditor/comparative-audit.md

Based on your analysis, render a final verdict:
- APPROVED: Coverage is >= 90% and no critical gaps
- REJECTED: Coverage is < 90% or critical features are missing

Write your checkpoint to .claude/agent-memory/coverage-auditor/checkpoint.md with YAML frontmatter:
agent: coverage-auditor, device_id: ${deviceId}, phase: 4, status: PASS or FAIL, verdict: APPROVED or REJECTED, score: <coverage percentage as 0-10>

Include a summary of your findings in the checkpoint body.`,
    deviceId, cwd: worktreeCwd, phase: 'phase-4-audit', agent: 'coverage-auditor',
    model: 'claude-opus-4-6',
    allowedTools: PIPELINE_TOOLS,
    maxBudgetPerInvocation: 5,
    remainingBudgetUsd: getRemainingBudget(state),
    onChildPid: (pid) => trackChildPid(state, pid),
  });
  if (verdictResult.costEntry) { accumulateCost(state, verdictResult.costEntry); recordCostEntry(deviceId, verdictResult.costEntry); }
  updateBurnRate(state, deviceId);
  updateSubscription(state, verdictResult.rateLimitEvents);

  const checkpoint = readAgentCheckpoint('coverage-auditor');
  if (checkpoint.verdict === 'APPROVED') {
    completePhase(state, 'phase-4-audit', checkpoint.score, true);
    const batches = parseBatchesFromAuditor();
    if (batches.length > 0) state.tutorialBatches = batches;
    advancePhase(state, worktreeCwd);
  } else {
    completePhase(state, 'phase-4-audit', checkpoint.score, false);
    createEscalation(state, 'curriculum-review', `Coverage auditor verdict: ${checkpoint.verdict ?? 'unknown'}. Review the tutorial plan.`);
    sendNotification('Miyagi Pipeline', `Curriculum review needed for ${state.deviceName}`);
  }
}

async function doPhase5(state: PipelineState) {
  startPhase(state, 'phase-5-tutorial-build');
  appendLog(deviceId, { level: 'info', message: `Starting Phase 5: Tutorial Build (${state.tutorialBatches.length} batches)` });

  for (const batch of state.tutorialBatches) {
    if (batch.status === 'approved') continue;

    batch.status = 'building';
    state.lastCheckpoint = { phase: 'phase-5-tutorial-build', subStep: `batch-${batch.batchId}-building` };
    writeState(deviceId, state);
    if (!isBudgetOk(state)) return;

    appendLog(deviceId, { level: 'info', agent: 'tutorial-builder', message: `Building batch ${batch.batchId}: ${batch.tutorials.join(', ')}` });
    const buildResult = await invokeAgent({
      prompt: `Build tutorial batch ${batch.batchId} for ${state.deviceName}. Device ID: ${deviceId}. Tutorials: ${batch.tutorials.join(', ')}`,
      deviceId, cwd: worktreeCwd, phase: 'phase-5-tutorial-build', agent: 'tutorial-builder', batchId: batch.batchId,
      allowedTools: PIPELINE_TOOLS,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (buildResult.costEntry) { accumulateCost(state, buildResult.costEntry); recordCostEntry(deviceId, buildResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, buildResult.rateLimitEvents);
    batch.builderScore = readAgentCheckpoint('tutorial-builder').score;

    batch.status = 'reviewing';
    state.lastCheckpoint = { phase: 'phase-5-tutorial-build', subStep: `batch-${batch.batchId}-reviewing` };
    writeState(deviceId, state);

    appendLog(deviceId, { level: 'info', agent: 'tutorial-reviewer', message: `Reviewing batch ${batch.batchId}` });
    const reviewResult = await invokeAgent({
      prompt: `Review tutorial batch ${batch.batchId} for ${state.deviceName}. Device ID: ${deviceId}. Verify accuracy against the manual.`,
      deviceId, cwd: worktreeCwd, phase: 'phase-5-tutorial-build', agent: 'tutorial-reviewer', batchId: batch.batchId,
      allowedTools: PIPELINE_TOOLS,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
    });
    if (reviewResult.costEntry) { accumulateCost(state, reviewResult.costEntry); recordCostEntry(deviceId, reviewResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, reviewResult.rateLimitEvents);
    batch.reviewerVerdict = readAgentCheckpoint('tutorial-reviewer').verdict;

    if (batch.reviewerVerdict === 'APPROVED') {
      batch.status = 'approved';
      appendLog(deviceId, { level: 'info', message: `Batch ${batch.batchId} APPROVED` });
    } else {
      batch.status = 'rejected';
      createEscalation(state, 'curriculum-review', `Batch ${batch.batchId} rejected by reviewer.`);
      return;
    }

    writeState(deviceId, state);
  }

  completePhase(state, 'phase-5-tutorial-build', 10, true);
  advancePhase(state, worktreeCwd);
}

async function doTutorialPR(state: PipelineState) {
  startPhase(state, 'tutorial-pr');
  appendLog(deviceId, { level: 'info', message: 'Creating tutorial PR...' });

  try {
    const prOutput = execSync(
      `gh pr create --base test --title "feat: ${state.deviceName} tutorials" --body "Automated tutorial build for ${state.deviceName} by Miyagi Pipeline"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], cwd: worktreeCwd }
    );
    const prUrl = prOutput.trim();
    appendLog(deviceId, { level: 'info', message: `Tutorial PR created: ${prUrl}` });
    completePhase(state, 'tutorial-pr', null, true);
    advancePhase(state, worktreeCwd);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    tryAutoRetry(state, 'agent-failure', `Failed to create tutorial PR: ${message}`);
  }
}

// --- Helpers ---

function readAgentCheckpoint(agent: string) {
  try {
    const checkpointPath = path.join(worktreeCwd, '.claude', 'agent-memory', agent, 'checkpoint.md');
    const content = fs.readFileSync(checkpointPath, 'utf-8');
    return parseCheckpoint(content);
  } catch {
    return { agent: null, deviceId: null, phase: null, status: null, score: null, verdict: null, sectionId: null, batchId: null, timestamp: null };
  }
}

function parseSectionsFromGatekeeper(): SectionStatus[] {
  try {
    const checkpointPath = path.join(worktreeCwd, '.claude', 'agent-memory', 'gatekeeper', 'checkpoint.md');
    const content = fs.readFileSync(checkpointPath, 'utf-8');
    const sections: SectionStatus[] = [];
    const lines = content.split('\n');

    let inManifest = false;
    for (const line of lines) {
      if (line.includes('MANIFEST') || (line.includes('Section') && line.includes('|'))) {
        inManifest = true;
        continue;
      }
      if (inManifest && line.startsWith('|') && !line.includes('---')) {
        const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
        if (cells.length > 0 && cells[0] && !cells[0].includes('Section') && !cells[0].includes('ID')) {
          const id = cells[0].toLowerCase().replace(/\s+/g, '-');
          if (!sections.find((s) => s.id === id)) {
            sections.push({ id, siScore: null, pqScore: null, criticScore: null, vaulted: false, attempts: 0, costUsd: 0, tokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 } });
          }
        }
      }
      if (inManifest && line.trim() === '') inManifest = false;
    }
    return sections;
  } catch {
    return [];
  }
}

function parseBatchesFromAuditor() {
  try {
    const checkpointPath = path.join(worktreeCwd, '.claude', 'agent-memory', 'coverage-auditor', 'checkpoint.md');
    const content = fs.readFileSync(checkpointPath, 'utf-8');
    const batches: { batchId: string; tutorials: string[] }[] = [];
    const batchPattern = /batch[- ]?(\w+).*?:\s*(.+)/gi;
    let match;
    while ((match = batchPattern.exec(content)) !== null) {
      const batchId = `batch-${match[1].toLowerCase()}`;
      const tutorials = match[2].split(',').map((t) => t.trim()).filter(Boolean);
      if (tutorials.length > 0) batches.push({ batchId, tutorials });
    }
    return batches.map((b) => ({ ...b, status: 'pending' as const, builderScore: null, reviewerVerdict: null }));
  } catch {
    return [];
  }
}

function findPdfsInDir(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

// --- Main ---
run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
