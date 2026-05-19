#!/usr/bin/env npx tsx
/**
 * Pipeline Runner — Detached state machine for Claude CLI agent orchestration.
 *
 * Usage: npx tsx scripts/pipeline-runner.ts <device-id>
 *
 * Spawned as a detached process by the API route. Persists across server restarts.
 * Writes state to .pipeline/<device-id>/state.json (atomic writes).
 * Reads agent checkpoints from .pipeline/<device-id>/agents/<id>/checkpoint.md.
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
  invokeAgentWithRetry,
  probeAnthropicHealth,
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
import {
  preInspectDiagramParser,
  validateDiagramParserOutput,
  preInspectGatekeeper,
  validateGatekeeperManifest,
  validateNeighborDirections,
  validateArchetypeGeometry,
} from '../src/lib/pipeline/checkpoint-validators';
import * as validators from '../src/lib/pipeline/checkpoint-validators';
import * as coverageScorer from '../src/lib/pipeline/coverage-scorer';
import { pipelinePaths, agentPath, inputPath } from '../src/lib/pipeline/paths';

const deviceId = process.argv[2];
if (!deviceId) {
  console.error('Usage: npx tsx scripts/pipeline-runner.ts <device-id>');
  process.exit(1);
}

/** Resolved worktree path — all agent invocations run here */
let worktreeCwd: string;

function paths() {
  return pipelinePaths(deviceId, worktreeCwd);
}

/**
 * Sandboxed tool set for pipeline agents.
 * Excludes Skill, Agent, WebSearch, WebFetch — prevents agents from
 * invoking skills (launch-instrument, etc.) or spawning subagents,
 * which would bypass the pipeline orchestration.
 */
const PIPELINE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'];

/**
 * Gatekeeper-specific tool set: no Bash.
 * The gatekeeper is a JUDGE — it reads manuals, reads parser output, and writes
 * the manifest JSON via the Write tool. It must NOT execute scripts (layout-engine.ts)
 * or spawn processes. Removing Bash is the mechanical boundary that enforces this.
 */
const GATEKEEPER_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep'];

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
  // 'panel-pr-review', — removed with panel-pr phase
  'curriculum-review',
  'topology-deadlock',
  'two-strike-halt',
  'physical-impossibility',
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
    const p = paths();
    const checkpointPath = p.agent(agent).wtCheckpoint;
    if (!fs.existsSync(checkpointPath)) return '';
    const content = fs.readFileSync(checkpointPath, 'utf-8');
    if (!content.trim()) return '';
    return `\n\n--- RESUME CONTEXT ---
A previous run of this agent was interrupted. It left a checkpoint at:
.pipeline/${deviceId}/agents/${agent}/checkpoint.md

Read that checkpoint file FIRST. Continue from where it left off rather than starting from scratch.
If the checkpoint indicates the work was complete, verify and finalize rather than redoing.
--- END RESUME CONTEXT ---\n`;
  } catch {
    return '';
  }
}

/** Copy an agent's output from worktree to main repo for persistence */
function copyAgentOutput(agentName: string) {
  const p = paths();
  const src = p.agent(agentName).wtDir;
  const dest = p.agent(agentName).dir;
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
  appendLog(deviceId, { level: 'info', agent: agentName, message: `Copied agent output to main repo` });
}

/** Copy all agent outputs + inputs from main repo to worktree (for resume) */
function copyPipelineToWorktree() {
  const p = paths();
  // Copy agents/ if exists
  if (fs.existsSync(p.agentsDir)) {
    fs.cpSync(p.agentsDir, p.wtAgentsDir, { recursive: true });
    appendLog(deviceId, { level: 'info', agent: 'runner', message: 'Copied agent outputs to worktree for resume' });
  }
  // Copy input/ if exists
  if (fs.existsSync(p.inputDir)) {
    fs.cpSync(p.inputDir, path.join(worktreeCwd, '.pipeline', deviceId, 'input'), { recursive: true });
  }
  // Copy promoted artifacts if they exist
  if (fs.existsSync(p.manifest)) {
    fs.mkdirSync(path.dirname(p.wtManifest), { recursive: true });
    fs.copyFileSync(p.manifest, p.wtManifest);
  }
  if (fs.existsSync(p.templates)) {
    fs.copyFileSync(p.templates, p.wtTemplates);
  }
}

/** Track the active child (claude CLI) PID in state so recovery can kill it */
function trackChildPid(state: PipelineState, pid: number | null) {
  state.childPid = pid;
  writeState(deviceId, state);
}

/**
 * Track active agent name + last-activity timestamp in state for the
 * diagnostics panel's hung-agent detection. Called from invokeAgent's
 * onAgentActivity callback (throttled to every 30s).
 */
function trackAgentActivity(state: PipelineState, agent: string | null, ts: number | null) {
  state.activeAgentName = agent;
  state.lastAgentActivityMs = ts;
  writeState(deviceId, state);
}

async function run() {
  let state = readState(deviceId);
  if (!state) {
    console.error(`No state found for device: ${deviceId}`);
    process.exit(1);
  }

  // Pre-flight: probe Anthropic API health. If the API is hard-down (529),
  // pause cleanly with a clear message instead of burning budget on doomed
  // agent invocations. Discovered cdj-3000 2026-05-18 — two consecutive
  // builder runs wasted $1.30 + ~6min before this guardrail existed.
  const probe = await probeAnthropicHealth();
  if (!probe.healthy) {
    appendLog(deviceId, {
      level: 'error',
      message:
        `Pre-flight: Anthropic API not healthy (${probe.reason ?? 'unknown'}). ` +
        `Pausing runner. Check https://status.claude.com/ and resume from /admin when green.`,
    });
    createEscalation(state, 'agent-failure',
      `Pre-flight API probe failed: ${probe.reason ?? 'unknown'}. ` +
      `Anthropic API appears overloaded or unavailable. Wait for recovery, then click Resume.`);
    state.status = 'paused';
    state.runnerPid = null;
    writeState(deviceId, state);
    return;
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

  // If resuming, copy existing agent outputs to worktree
  if (state.phases.some(ph => ph.status === 'passed')) {
    copyPipelineToWorktree();
  }

  // Pull latest code into worktree — ensures SOULs, validators, and scripts are current
  try {
    execSync('git fetch origin test && git merge origin/test --no-edit', {
      cwd: worktreeCwd,
      stdio: 'pipe',
    });
    appendLog(deviceId, { level: 'info', message: 'Worktree updated to latest test' });
  } catch {
    appendLog(deviceId, { level: 'warn', message: 'Could not update worktree — using existing code' });
  }

  // Copy uploaded manuals into worktree (they're in the project root, not in the git checkout)
  for (const manualPath of state.manualPaths) {
    const absSource = path.resolve(manualPath);
    const destInWorktree = path.join(worktreeCwd, manualPath);
    const destDir = path.dirname(destInWorktree);
    if (fs.existsSync(absSource) && !fs.existsSync(destInWorktree)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(absSource, destInWorktree);
      appendLog(deviceId, { level: 'info', message: `Copied manual to worktree: ${manualPath}` });
    } else if (!fs.existsSync(absSource)) {
      appendLog(deviceId, { level: 'warn', message: `Manual not found at ${manualPath} — preflight will re-download` });
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

  // Signal handlers — ensure cleanup runs when killed by cancel/restart/pause
  const handleSignal = (signal: string) => {
    appendLog(deviceId, { level: 'info', message: `Runner received ${signal} — cleaning up` });
    clearInterval(heartbeatInterval);
    state.runnerPid = null;
    state.childPid = null;
    if (state.status === 'running') {
      state.status = 'paused';
    }
    writeState(deviceId, state);
    process.exit(0);
  };
  process.on('SIGTERM', () => handleSignal('SIGTERM'));
  process.on('SIGINT', () => handleSignal('SIGINT'));

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
        case 'phase-0-control-extractor':
          await doPhase0ControlExtractor(state);
          break;
        case 'phase-0-gatekeeper':
          await doPhase0(state);
          break;
        case 'phase-0-layout-engine':
          await doPhase0LayoutEngine(state);
          break;
        case 'phase-0-post-editor-check':
          await doPhase0PostEditorCheck(state);
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
        // Legacy panel-pr: deprecated when PanelRenderer replaced codegen,
        // but older state files still reference it. Transparently advance
        // past — getNextPhase('panel-pr', ...) returns 'phase-4-extraction'.
        case 'panel-pr': {
          appendLog(deviceId, {
            level: 'info',
            message: 'Skipping legacy panel-pr phase (PanelRenderer obviates codegen PR step).',
          });
          // Mark the historical phase as skipped so the timeline reflects it
          const existingPanelPr = state.phases.find((p) => p.phase === 'panel-pr');
          if (existingPanelPr) {
            existingPanelPr.status = 'skipped';
            existingPanelPr.completedAt = new Date().toISOString();
          }
          advancePhase(state, worktreeCwd);
          break;
        }
        case 'phase-4-extraction':
          await doPhase4Extract(state);
          break;
        case 'phase-4-audit':
          await doPhase4Audit(state);
          break;
        case 'phase-5-display-build':
          await doPhase5DisplayBuild(state);
          break;
        case 'phase-5-tutorial-build':
          await doPhase5(state);
          break;
        case 'tutorial-review':
          await doTutorialReview(state);
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
    appendLog(deviceId, { level: 'info', message: `Manual downloaded: ${state.manualPaths.join(', ')}` });

    // ── Auto-download hardware photos ──────────────────────────────────
    const photosDir = path.join(outputDir, 'photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Copy photos from main repo if they exist there but not in worktree
    const mainRepoPhotos = path.join('docs', state.manufacturer, deviceId, 'photos');
    if (fs.existsSync(mainRepoPhotos) && mainRepoPhotos !== photosDir) {
      const mainPhotos = fs.readdirSync(mainRepoPhotos).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      for (const photo of mainPhotos) {
        const dest = path.join(photosDir, photo);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(mainRepoPhotos, photo), dest);
          appendLog(deviceId, { level: 'info', message: `Copied photo from main repo: ${photo}` });
        }
      }
    }

    const existingPhotos = fs.readdirSync(photosDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (existingPhotos.length === 0) {
      appendLog(deviceId, { level: 'info', message: 'No photos found — auto-downloading hardware photos...' });

      const photoResult = await invokeAgent({
        prompt: `Find and download top-down/overhead hardware photos for:
- Manufacturer: ${state.manufacturer}
- Device: ${state.deviceName}

REQUIREMENTS:
1. You MUST find at least ONE top-down/overhead view of the entire instrument
2. Also download angled views and front views if available
3. Check the manufacturer's official website FIRST:
   - Roland: https://static.roland.com/assets/images/products/gallery/{device-slug}_top_gal.jpg
   - Pioneer DJ: https://www.pioneerdj.com/en-us/product/{device-slug}/
   - Behringer: https://www.behringer.com/product/{device-slug}
4. If official site fails, use WebSearch: "${state.manufacturer} ${state.deviceName} top view overhead photo"
5. Download images using Bash with curl: curl -sL -o "{filename}.jpg" "{url}"
6. Save ALL photos to: ${photosDir}
7. Name files: ${deviceId}-top-view.jpg, ${deviceId}-top-angle.jpg, ${deviceId}-hero.jpg, ${deviceId}-front.jpg
8. Verify each download is a valid image (file size > 10KB)
9. Delete any files that are HTML error pages (< 10KB or not JPEG/PNG)

IMPORTANT: At minimum, you need a top-down view. The Diagram Parser CANNOT run without photos.`,
        deviceId,
        cwd: worktreeCwd,
        phase: 'phase-preflight',
        agent: 'photo-downloader',
        allowedTools: ['WebSearch', 'WebFetch', 'Bash', 'Read', 'Write'],
        remainingBudgetUsd: getRemainingBudget(state),
        maxBudgetPerInvocation: 5,
        onChildPid: (pid) => trackChildPid(state, pid),
      });

      if (photoResult.costEntry) {
        accumulateCost(state, photoResult.costEntry);
        recordCostEntry(deviceId, photoResult.costEntry);
      }

      // Verify photos were downloaded
      const downloadedPhotos = fs.readdirSync(photosDir).filter(f => {
        if (!/\.(jpg|jpeg|png|webp)$/i.test(f)) return false;
        const stat = fs.statSync(path.join(photosDir, f));
        return stat.size > 10000; // Must be > 10KB to be a real image
      });

      if (downloadedPhotos.length > 0) {
        appendLog(deviceId, { level: 'info', message: `Photos downloaded: ${downloadedPhotos.join(', ')}` });
      } else {
        appendLog(deviceId, { level: 'warn', message: 'No valid photos downloaded — parser may fail' });
      }
    } else {
      appendLog(deviceId, { level: 'info', message: `Photos already exist: ${existingPhotos.join(', ')}` });
    }

    // ── Copy manuals and photos to centralized input/ directory ──────────
    // `state.manualPaths` is worktree-relative after the agent downloads
    // (set at line 547 above). Resolving against worktreeCwd (not the main
    // repo's process.cwd()) is essential — otherwise the source path
    // doesn't exist, fs.existsSync returns false, and the copy silently
    // skips. That's the dj-xdj-rr / minimoog preflight bug: manuals
    // downloaded to the worktree's `docs/` dir never made it to durable
    // storage at `.pipeline/<id>/input/manuals/`, then worktree cleanup
    // erased them.
    //
    // Secondary fix: after the copy succeeds, rewrite `state.manualPaths`
    // to point at the durable location. Subsequent phases find the manual
    // via the runner's `copyPipelineToWorktree` re-stage (line 196), which
    // mirrors `.pipeline/<id>/input/` into each new worktree.
    const pfPaths = paths();
    fs.mkdirSync(pfPaths.manualsDir, { recursive: true });
    const durableManualPaths: string[] = [];
    for (const manualPath of state.manualPaths) {
      const absSource = path.resolve(worktreeCwd, manualPath);
      if (fs.existsSync(absSource)) {
        const cleanName = path.basename(manualPath);
        const durableAbsDest = path.join(pfPaths.manualsDir, cleanName);
        fs.copyFileSync(absSource, durableAbsDest);
        durableManualPaths.push(path.relative(process.cwd(), durableAbsDest));
        appendLog(deviceId, { level: 'info', agent: 'preflight', message: `Manual staged to durable storage: ${cleanName}` });
      } else {
        appendLog(deviceId, { level: 'warn', agent: 'preflight', message: `Manual source not found at ${absSource} — durable copy skipped (downstream phases may fail to find this manual)` });
      }
    }
    // Defensive safety net: scan worktreeCwd/docs/<vendor>/<device>/ for
    // any PDFs the agent put there that aren't in state.manualPaths
    // (handles future agents that write to slightly different paths or
    // bonus manuals not enumerated in manualPaths). Migrate them too so
    // nothing gets lost during worktree cleanup.
    const fallbackPdfs = findPdfsInDir(outputDir).filter(
      (p) => !state.manualPaths.some((mp) => path.basename(mp) === path.basename(p))
    );
    for (const fbPath of fallbackPdfs) {
      const cleanName = path.basename(fbPath);
      const durableAbsDest = path.join(pfPaths.manualsDir, cleanName);
      if (!fs.existsSync(durableAbsDest)) {
        fs.copyFileSync(fbPath, durableAbsDest);
        durableManualPaths.push(path.relative(process.cwd(), durableAbsDest));
        appendLog(deviceId, { level: 'info', agent: 'preflight', message: `Migrated stray PDF to durable storage: ${cleanName}` });
      }
    }
    if (durableManualPaths.length > 0) {
      state.manualPaths = durableManualPaths;
    }

    fs.mkdirSync(pfPaths.photosDir, { recursive: true });
    // Copy photos to input/photos/
    const photosSourceDir = path.join('docs', state.manufacturer, deviceId, 'photos');
    if (fs.existsSync(photosSourceDir)) {
      for (const photo of fs.readdirSync(photosSourceDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))) {
        fs.copyFileSync(path.join(photosSourceDir, photo), path.join(pfPaths.photosDir, photo));
      }
    }
    // Also copy from worktree photos dir (may have been downloaded there)
    if (fs.existsSync(photosDir)) {
      for (const photo of fs.readdirSync(photosDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))) {
        const dest = path.join(pfPaths.photosDir, photo);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(photosDir, photo), dest);
        }
      }
    }

    // Copy input to worktree
    fs.cpSync(pfPaths.inputDir, path.join(worktreeCwd, '.pipeline', deviceId, 'input'), { recursive: true });

    completePhase(state, 'phase-preflight', null, true);
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

  // Check if parser already produced valid output (spatial-blueprint.json exists)
  const existingBlueprint = paths().agent('diagram-parser').wtDir + '/spatial-blueprint.json';
  if (fs.existsSync(existingBlueprint)) {
    const blueprintJson = fs.readFileSync(existingBlueprint, 'utf-8');
    const checkpointPath = paths().agent('diagram-parser').wtCheckpoint;
    const checkpointContent = fs.existsSync(checkpointPath) ? fs.readFileSync(checkpointPath, 'utf-8') : '';
    const { validateDiagramParserOutput: validate } = await import('../src/lib/pipeline/checkpoint-validators');
    const validation = validate(checkpointContent, blueprintJson);
    if (validation.score >= 9.0) {
      appendLog(deviceId, { level: 'info', agent: 'diagram-parser',
        message: `Existing spatial-blueprint.json passes validation (${validation.score.toFixed(1)}/10). Skipping re-run.` });
      completePhase(state, 'phase-0-diagram-parser', validation.score, true);
      advancePhase(state, worktreeCwd);
      return;
    }
  }

  if (!isBudgetOk(state)) return;

  // --- PRE-INSPECTION ---
  const photoDir = path.join(worktreeCwd, 'docs', state.manufacturer, deviceId, 'photos');
  let photoPaths: string[] = [];
  try {
    photoPaths = fs.readdirSync(photoDir)
      .filter((f: string) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map((f: string) => path.join(photoDir, f));
  } catch { /* no photos dir */ }

  const preCheck = preInspectDiagramParser({
    manualPaths: state.manualPaths,
    photoPaths,
  });
  if (!preCheck.valid) {
    for (const err of preCheck.errors) {
      appendLog(deviceId, { level: 'warn', agent: 'diagram-parser', message: `PRE-INSPECT: ${err}` });
    }
    if (state.manualPaths.length === 0) {
      completePhase(state, 'phase-0-diagram-parser', null, false);
      createEscalation(state, 'manual-not-found', 'No manual available for Diagram Parser');
      return;
    }
    if (photoPaths.length === 0) {
      completePhase(state, 'phase-0-diagram-parser', null, false);
      createEscalation(state, 'agent-failure',
        `No hardware photos found at docs/${state.manufacturer}/${deviceId}/photos/. ` +
        `The Diagram Parser requires photos as PRIMARY input. Upload photos before running.`);
      return;
    }
  }

  const manualList = state.manualPaths.map((p) => `  - ${p}`).join('\n');
  const photoListStr = photoPaths
    .map((p: string) => `  - ${path.relative(worktreeCwd, p)}`)
    .join('\n');

  const resumeCtx = getResumeContext('diagram-parser');
  const prompt = `You are the Diagram Parser agent. Extract spatial geometry from hardware photos and manual for:
- Device: ${state.deviceName}
- Manufacturer: ${state.manufacturer}
- Device ID: ${deviceId}
- Hardware photos (PRIMARY — all coordinates come from these):
${photoListStr}
- Manual (SECONDARY — for control count, identity, and type hints only):
${manualList}

COORDINATE RULE (NON-NEGOTIABLE): ALL centroid coordinates must come from the PHOTOS.
The manual tells you WHAT exists (names, types, count). The photos tell you WHERE it is.
If you cannot clearly see a control's position in the photos, output centroid: null.
NEVER derive coordinates from manual diagram callout line positions.

Your job is to be a SURVEYOR — extract spatial facts from images.
Use the manual to know what to look for and verify your count, but measure positions from photos.
Your output is consumed by a DETERMINISTIC MACHINE, not a human. Output JSON with coordinates, not prose.

For each section on the hardware panel:
1. Identify section boundaries (bounding boxes as % of panel)
2. Extract control centroids (2 decimal precision, % of section) — FROM PHOTOS
3. Discover neighbors (±3% threshold in 4 cardinal directions)
4. Classify topology (grid-NxM, single-column, single-row, cluster-above-anchor, etc.)
5. Lock proportions (height splits, aspect ratios)
6. Document aspect ratios for all elements
7. Assign containerZones for multi-zone topologies

Output spatial-blueprint JSON per section.
Write your checkpoint to ${agentPath(deviceId, 'diagram-parser')}/checkpoint.md with YAML frontmatter.
Include: agent: diagram-parser, deviceId: ${deviceId}, phase: 0, status, score, verdict, timestamp

Read manuals from: ${inputPath(deviceId).manuals}/
Read photos from: ${inputPath(deviceId).photos}/${resumeCtx}`;

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
  const dpCheckpointPath = paths().agent('diagram-parser').wtCheckpoint;
  const checkpointFileExists = fs.existsSync(dpCheckpointPath);

  // Copy agent output BEFORE validation (so main repo has the files regardless of score)
  copyAgentOutput('diagram-parser');

  // --- POST-INSPECTION (mechanical validation) ---
  if (checkpointFileExists) {
    const content = fs.readFileSync(dpCheckpointPath, 'utf-8');

    // Check for spatial-blueprint.json in the agent's output directory
    const blueprintPathPrimary = paths().wtParserBlueprint;
    const blueprintPathLegacy = path.join(worktreeCwd, '.pipeline', deviceId, 'spatial-blueprint.json');
    let blueprintJson: string | undefined;
    for (const bp of [blueprintPathPrimary, blueprintPathLegacy]) {
      if (fs.existsSync(bp)) {
        blueprintJson = fs.readFileSync(bp, 'utf-8');
        appendLog(deviceId, { level: 'info', agent: 'diagram-parser', message: `Found spatial-blueprint.json at ${path.relative(worktreeCwd, bp)} (${(blueprintJson.length / 1024).toFixed(1)}KB)` });
        // If found at legacy location, copy to canonical agent output dir
        if (bp === blueprintPathLegacy && !fs.existsSync(blueprintPathPrimary)) {
          const destDir = path.dirname(blueprintPathPrimary);
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(bp, blueprintPathPrimary);
          appendLog(deviceId, { level: 'info', agent: 'diagram-parser', message: 'Copied spatial-blueprint.json to agent output dir for downstream phases' });
        }
        break;
      }
    }

    const validation = validateDiagramParserOutput(content, blueprintJson);

    // Log all mechanical findings
    for (const err of validation.errors) {
      appendLog(deviceId, { level: 'warn', agent: 'diagram-parser', message: `POST-INSPECT: ${err}` });
    }
    appendLog(deviceId, {
      level: 'info', agent: 'diagram-parser',
      message: `POST-INSPECT: mechanical score ${validation.score.toFixed(1)}/10 (agent self-score: ${checkpoint.score ?? 'none'})`,
    });

    // Normalize agent self-score: if < 1.0, assume 0-1 scale and multiply by 10
    const rawSelfScore = checkpoint.score ?? 0;
    const normalizedSelfScore = rawSelfScore <= 1.0 && rawSelfScore > 0 ? rawSelfScore * 10 : rawSelfScore;

    // Effective score = min(mechanical, normalized self-score)
    // Mechanical validates structure (fields exist). Self-score validates quality (data correct).
    // Neither alone is sufficient — structure without quality is garbage in correct format,
    // quality without structure means the validator has a bug.
    const effectiveScore = Math.min(validation.score, normalizedSelfScore > 0 ? normalizedSelfScore : validation.score);
    appendLog(deviceId, {
      level: 'info', agent: 'diagram-parser',
      message: `Effective score: ${effectiveScore.toFixed(1)} (mechanical: ${validation.score.toFixed(1)}, self: ${rawSelfScore} → normalized: ${normalizedSelfScore.toFixed(1)})`,
    });

    if (effectiveScore >= 9.0 && validation.valid) {
      // Agent output already copied above (before validation)
      completePhase(state, 'phase-0-diagram-parser', effectiveScore, true);
      advancePhase(state, worktreeCwd);
    } else {
      completePhase(state, 'phase-0-diagram-parser', effectiveScore, false);
      // Send specific errors back as retry context
      const errorSummary = validation.errors.slice(0, 3).join('; ');
      if (!tryAutoRetry(state, 'agent-failure',
        `Diagram Parser failed mechanical validation (score: ${effectiveScore.toFixed(1)}). ` +
        `Errors: ${errorSummary}`)) return;
    }
  } else if (result.exitCode !== 0) {
    if (!tryAutoRetry(state, 'agent-failure', `Diagram Parser failed with exit code ${result.exitCode}`)) return;
  } else {
    completePhase(state, 'phase-0-diagram-parser', checkpoint.score, false);
    if (!tryAutoRetry(state, 'agent-failure', `Diagram Parser scored below 9.0`)) return;
  }
}

async function doPhase0ControlExtractor(state: PipelineState) {
  startPhase(state, 'phase-0-control-extractor');
  appendLog(deviceId, { level: 'info', agent: 'control-extractor', message: 'Starting Phase 0b: Control Extractor (manual-only)' });
  if (!isBudgetOk(state)) return;

  // Skip if inventory already exists and is valid
  const inventoryPath = paths().wtControlInventory;
  if (fs.existsSync(inventoryPath)) {
    try {
      const inv = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
      const skipCount = inv.controls?.length ?? inv.topPanel?.length ?? inv.items?.length ?? 0;
      if (skipCount > 0) {
        appendLog(deviceId, { level: 'info', agent: 'control-extractor',
          message: `Existing control-inventory.json valid (${inv.controls.length} controls). Skipping re-run.` });
        completePhase(state, 'phase-0-control-extractor', 10, true);
        advancePhase(state, worktreeCwd);
        return;
      }
    } catch { /* invalid JSON, re-run */ }
  }

  const manualList = state.manualPaths.map((p) => `  - ${p}`).join('\n');
  const resumeCtx = getResumeContext('control-extractor');
  const prompt = `You are the Control Extractor agent. Read the manual and extract a structured control inventory for:
- Device: ${state.deviceName}
- Manufacturer: ${state.manufacturer}
- Device ID: ${deviceId}
- Manuals:
${manualList}

MANUAL-ONLY MODE: Read ONLY the manual PDF. Do NOT look at photos.
A separate Diagram Parser agent handles the photos. You handle the text.

Find the "Part Names" or "Controls" section of the manual. Extract every numbered item:
- item number, verbatim label, control type, functional group, description, page number
- Flag compound items (one manual item = multiple physical controls)

Output a JSON file to ${agentPath(deviceId, 'control-extractor')}/control-inventory.json
Write checkpoint to ${agentPath(deviceId, 'control-extractor')}/checkpoint.md${resumeCtx}`;

  const result = await invokeAgent({
    prompt,
    deviceId,
    cwd: worktreeCwd,
    phase: 'phase-0-control-extractor',
    agent: 'control-extractor',
    allowedTools: GATEKEEPER_TOOLS, // Read, Write, Edit, Glob, Grep — no Bash
    remainingBudgetUsd: getRemainingBudget(state),
    onChildPid: (pid) => trackChildPid(state, pid),
  });

  if (result.costEntry) {
    accumulateCost(state, result.costEntry);
    recordCostEntry(deviceId, result.costEntry);
  }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

  // Copy agent output BEFORE validation
  copyAgentOutput('control-extractor');

  // Validate output
  if (fs.existsSync(inventoryPath)) {
    try {
      const inv = JSON.parse(fs.readFileSync(inventoryPath, 'utf-8'));
      // Accept various key names for the controls array
      const controlCount = inv.controls?.length ?? inv.topPanel?.length ?? inv.items?.length ?? 0;
      appendLog(deviceId, { level: 'info', agent: 'control-extractor',
        message: `POST-INSPECT: ${controlCount} controls extracted` });

      if (controlCount > 0) {
        // Agent output already copied above (before validation)
        completePhase(state, 'phase-0-control-extractor', 10, true);
        advancePhase(state, worktreeCwd);
      } else {
        completePhase(state, 'phase-0-control-extractor', null, false);
        if (!tryAutoRetry(state, 'agent-failure', 'Control Extractor produced empty inventory')) return;
      }
    } catch (e) {
      completePhase(state, 'phase-0-control-extractor', null, false);
      if (!tryAutoRetry(state, 'agent-failure', `Control inventory JSON invalid: ${(e as Error).message}`)) return;
    }
  } else {
    completePhase(state, 'phase-0-control-extractor', null, false);
    if (!tryAutoRetry(state, 'agent-failure', 'Control Extractor produced no inventory file')) return;
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

  const manualListGk = state.manualPaths.map((p) => `  - ${p}`).join('\n');
  const resumeCtx = getResumeContext('gatekeeper');
  const prompt = `You are the Gatekeeper agent (JUDGE ONLY). Produce the Master Manifest for:
- Device: ${state.deviceName}
- Manufacturer: ${state.manufacturer}
- Device ID: ${deviceId}
- Manuals:
${manualListGk}

IMPORTANT: You are the JUDGE. You reconcile TWO data streams:
1. Manual text (read the PDFs for control names, functional groups, parameter info)
2. Diagram Parser output (read ${agentPath(deviceId, 'diagram-parser')}/spatial-blueprint.json for spatial geometry)

Also check if a Control Extractor inventory exists at ${agentPath(deviceId, 'control-extractor')}/control-inventory.json — if so, use it as an additional reference for control naming.

Read manuals from: ${inputPath(deviceId).manuals}/
Read photos from: ${inputPath(deviceId).photos}/

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
DO NOT run the layout engine yourself. DO NOT execute scripts/layout-engine.ts via Bash.
The pipeline runner handles layout engine execution after your manifest is validated.

IMPORTANT: For each section, include panelBoundingBox from the Parser's spatial-blueprint.
Copy the Parser's bounding box values (x, y, w, h as % of panel) into each section.
This defines WHERE on the physical panel each section sits — critical for global layout.

Output the Master Manifest JSON in a \`\`\`json code block in your checkpoint.
The JSON must conform to the MasterManifest interface in scripts/layout-engine.ts.
Also write the manifest to ${agentPath(deviceId, 'gatekeeper')}/manifest.json

Write your checkpoint to ${agentPath(deviceId, 'gatekeeper')}/checkpoint.md with YAML frontmatter.
Include: agent: gatekeeper, deviceId: ${deviceId}, phase: 0, status, score, verdict, timestamp, conflicts${resumeCtx}`;

  const result = await invokeAgent({
    prompt,
    deviceId,
    cwd: worktreeCwd,
    phase: 'phase-0-gatekeeper',
    agent: 'gatekeeper',
    model: 'claude-opus-4-6',
    allowedTools: GATEKEEPER_TOOLS,
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

  // --- COPY AGENT OUTPUT BEFORE VALIDATION ---
  // Always copy agent output from worktree to main repo immediately after the agent exits.
  // Validation reads from main repo. If validation fails and we retry, the agent overwrites its output.
  copyAgentOutput('gatekeeper');

  // --- POST-INSPECTION: validate the manifest.json file mechanically ---
  const gkManifest = paths().agent('gatekeeper').dir + '/manifest.json';
  const worktreeManifest = path.join(worktreeCwd, '.pipeline', deviceId, 'manifest.json');
  const mainManifest = path.join('.pipeline', deviceId, 'manifest.json');
  const manifestPath = fs.existsSync(gkManifest) ? gkManifest
    : fs.existsSync(worktreeManifest) ? worktreeManifest
    : fs.existsSync(mainManifest) ? mainManifest
    : null;

  if (manifestPath) {
    const manifestJson = fs.readFileSync(manifestPath, 'utf-8');
    const validation = validateGatekeeperManifest(manifestJson);

    for (const err of validation.errors) {
      appendLog(deviceId, { level: 'warn', agent: 'gatekeeper', message: `POST-INSPECT: ${err}` });
    }
    appendLog(deviceId, {
      level: 'info', agent: 'gatekeeper',
      message: `POST-INSPECT: mechanical score ${validation.score.toFixed(1)}/10 (agent self-score: ${checkpoint.score ?? 'none'})`,
    });

    // 4-Point Validation: check neighbor directions against parser centroids
    const blueprintPath = paths().wtParserBlueprint;
    if (fs.existsSync(blueprintPath)) {
      const blueprintJson = fs.readFileSync(blueprintPath, 'utf-8');
      const neighborCheck = validateNeighborDirections(manifestJson, blueprintJson);
      if (neighborCheck.flippedNeighbors.length > 0) {
        for (const flip of neighborCheck.flippedNeighbors) {
          appendLog(deviceId, {
            level: 'warn', agent: 'gatekeeper',
            message: `4-POINT: Flipped neighbor — ${flip.control}.${flip.direction} = ${flip.neighbor}, but geometry says ${flip.expected}`,
          });
        }
        appendLog(deviceId, {
          level: 'warn', agent: 'gatekeeper',
          message: `4-POINT: ${neighborCheck.flippedNeighbors.length} flipped neighbor direction(s) found. Deducting from score.`,
        });
        // Deduct lightly — flipped neighbors are auto-corrected in the manifest.
        // Cap total deduction at 1.0 regardless of count (they're mechanical fixes, not data quality issues).
        const flipDeduction = Math.min(neighborCheck.flippedNeighbors.length * 0.1, 1.0);
        validation.score = Math.max(0, validation.score - flipDeduction);
        validation.errors.push(...neighborCheck.errors);
      } else {
        appendLog(deviceId, { level: 'info', agent: 'gatekeeper', message: '4-POINT: All neighbor directions consistent with parser centroids' });
      }

      // Archetype-Geometry Validation: does the archetype match the centroid distribution?
      const archetypeCheck = validateArchetypeGeometry(manifestJson, blueprintJson);
      if (archetypeCheck.mismatches.length > 0) {
        // Auto-correct archetypes based on geometry — centroids are the source of truth
        const parsedManifest = JSON.parse(manifestJson);
        let corrected = false;
        for (const mm of archetypeCheck.mismatches) {
          const section = parsedManifest.sections.find((s: { id: string }) => s.id === mm.sectionId);
          if (section) {
            appendLog(deviceId, {
              level: 'info', agent: 'gatekeeper',
              message: `ARCHETYPE-GEOMETRY: Auto-correcting "${mm.sectionId}" from "${mm.archetype}" → "${mm.suggestion}" (${mm.reason})`,
            });
            section.archetype = mm.suggestion;
            corrected = true;
          }
        }
        if (corrected) {
          // Re-save the corrected manifest
          const manifestPath = paths().manifest;
          fs.writeFileSync(manifestPath, JSON.stringify(parsedManifest, null, 2));
          appendLog(deviceId, { level: 'info', agent: 'gatekeeper', message: `Auto-corrected ${archetypeCheck.mismatches.length} archetype(s) in manifest.json` });
        }
      } else {
        appendLog(deviceId, { level: 'info', agent: 'gatekeeper', message: 'ARCHETYPE-GEOMETRY: All archetypes consistent with centroid distribution' });
      }
    }

    // Normalize gatekeeper self-score
    const rawGkScore = checkpoint.score ?? 0;
    const normalizedGkScore = rawGkScore <= 1.0 && rawGkScore > 0 ? rawGkScore * 10 : rawGkScore;
    const effectiveGkScore = Math.min(validation.score, normalizedGkScore > 0 ? normalizedGkScore : validation.score);
    appendLog(deviceId, {
      level: 'info', agent: 'gatekeeper',
      message: `Effective score: ${effectiveGkScore.toFixed(1)} (mechanical: ${validation.score.toFixed(1)}, self: ${rawGkScore} → normalized: ${normalizedGkScore.toFixed(1)})`,
    });

    // Gatekeeper threshold uses mechanical score only. The self-score reflects
    // reconciliation difficulty (number of conflicts), not data quality. A manifest
    // with 7 documented conflicts and a self-score of 7.5 is MORE trustworthy than
    // one with 0 conflicts and a 10/10 (which likely smoothed over issues silently).
    // The mechanical validator (structural completeness + 4-Point + archetype-geometry)
    // is the authoritative gate.
    if (validation.score >= 9.0 && validation.valid) {
      // Agent output already copied above (before validation)
      // Copy manifest to main pipeline dir if needed
      if (manifestPath === worktreeManifest && !fs.existsSync(mainManifest)) {
        fs.mkdirSync(path.dirname(mainManifest), { recursive: true });
        fs.copyFileSync(worktreeManifest, mainManifest);
      }
      // Promote gatekeeper manifest from agent dir to pipeline root
      const gkPaths = paths();
      const gkManifestSources = [
        gkPaths.wtGatekeeperManifest,          // worktree agents/gatekeeper/manifest.json
        gkPaths.gatekeeperManifest,             // main repo agents/gatekeeper/manifest.json
        worktreeManifest,                        // worktree .pipeline/{id}/manifest.json (legacy)
        gkPaths.manifest,                        // main repo .pipeline/{id}/manifest.json (legacy fallback)
      ];
      const gkManifestSource = gkManifestSources.find(p => fs.existsSync(p));
      if (gkManifestSource) {
        // Read existing manifest BEFORE overwriting — preserve sticky fields
        let previousManifest: Record<string, unknown> | null = null;
        if (fs.existsSync(gkPaths.manifest)) {
          try { previousManifest = JSON.parse(fs.readFileSync(gkPaths.manifest, 'utf-8')); } catch { /* ignore */ }
        }

        fs.mkdirSync(path.dirname(gkPaths.manifest), { recursive: true });
        fs.copyFileSync(gkManifestSource, gkPaths.manifest);
        appendLog(deviceId, { level: 'info', agent: 'gatekeeper', message: `Promoted manifest.json from ${path.basename(path.dirname(gkManifestSource))} to pipeline root` });

        // Carry forward deviceDimensions and keyboard if gatekeeper didn't include them.
        // These are physical facts about the hardware — they never change between runs.
        // Priority: gatekeeper output > editor manifest corrections > previous pipeline manifest.
        if (previousManifest) {
          const promoted = JSON.parse(fs.readFileSync(gkPaths.manifest, 'utf-8'));
          let carried = false;
          if (!promoted.deviceDimensions && previousManifest.deviceDimensions) {
            promoted.deviceDimensions = previousManifest.deviceDimensions;
            carried = true;
          }
          if (!promoted.keyboard && previousManifest.keyboard) {
            promoted.keyboard = previousManifest.keyboard;
            carried = true;
          }
          if (carried) {
            fs.writeFileSync(gkPaths.manifest, JSON.stringify(promoted, null, 2));
            appendLog(deviceId, { level: 'warn', agent: 'gatekeeper', message: 'Carried forward deviceDimensions/keyboard from previous manifest — gatekeeper did not include them' });
          }
        }
      }
      completePhase(state, 'phase-0-gatekeeper', effectiveGkScore, true);
      const sections = parseSectionsFromGatekeeper();
      if (sections.length > 0) state.sections = sections;
      advancePhase(state, worktreeCwd);
    } else {
      completePhase(state, 'phase-0-gatekeeper', effectiveGkScore, false);
      const errorSummary = validation.errors.slice(0, 3).join('; ');
      if (!tryAutoRetry(state, 'agent-failure',
        `Gatekeeper manifest failed validation (score: ${effectiveGkScore.toFixed(1)}). ` +
        `Errors: ${errorSummary}`)) return;
    }
  } else if (result.exitCode !== 0) {
    if (!tryAutoRetry(state, 'agent-failure', `Gatekeeper failed with exit code ${result.exitCode}`)) return;
  } else {
    completePhase(state, 'phase-0-gatekeeper', checkpoint.score, false);
    if (!tryAutoRetry(state, 'agent-failure', `Gatekeeper produced no manifest.json file`)) return;
  }
}

async function doPhase0LayoutEngine(state: PipelineState) {
  const lePaths = paths();
  const outputPath = lePaths.templates;
  const phaseResult = state.phases.find(p => p.phase === 'phase-0-layout-engine');

  // If templates already exist and phase was completed, check editor-ready gate.
  // Escalations of type 'editor-ready' are created when the pipeline pauses for
  // contractor editing; resolving them via /api/pipeline/<id>/escalation lets
  // the runner advance to QA. Earlier code mistakenly checked type='agent-failure'
  // here, which caused the gate to never resolve (the type was wrong); fixed
  // 2026-05-10.
  if (phaseResult?.status === 'passed' && fs.existsSync(outputPath)) {
    const editorResolved = state.escalations.some(
      e => e.type === 'editor-ready' && e.resolvedAt
    );
    if (editorResolved) {
      appendLog(deviceId, { level: 'info', message: 'Layout Engine: templates exist and editor gate resolved, advancing' });
      advancePhase(state, worktreeCwd);
      return;
    }
    // Editor gate not yet resolved — check if escalation exists
    const editorPending = state.escalations.some(
      e => e.type === 'editor-ready' && !e.resolvedAt
    );
    if (!editorPending) {
      // Re-create escalation (shouldn't happen, but defensive)
      createEscalation(state, 'editor-ready',
        `Pipeline ready for editor. Click "Send to Contractor" to upload the manifest for the contractor to edit. ` +
        `Resume the pipeline after the panel is approved to start QA.\n` +
        `Manifest: .pipeline/${deviceId}/manifest.json\n` +
        `Templates: .pipeline/${deviceId}/templates.json`);
      sendNotification('Miyagi Pipeline', `${state.deviceName} is ready for the editor`);
    }
    appendLog(deviceId, { level: 'info', message: 'Layout Engine: waiting for editor/contractor gate to be resolved' });
    state.status = 'paused';
    writeState(deviceId, state);
    return;
  }

  startPhase(state, 'phase-0-layout-engine');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 0e: Layout Engine (deterministic template generation)' });

  const manifestPath = lePaths.manifest;

  // Find the manifest JSON — check multiple locations
  const worktreeManifestPath = lePaths.wtManifest;

  if (fs.existsSync(worktreeManifestPath) && !fs.existsSync(manifestPath)) {
    // Copy from worktree to main pipeline dir
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.copyFileSync(worktreeManifestPath, manifestPath);
    appendLog(deviceId, { level: 'info', message: 'Copied manifest from worktree to pipeline dir' });

    // Also copy templates if the gatekeeper already ran the layout engine
    const worktreeTemplatesPath = path.join(worktreeCwd, '.pipeline', deviceId, 'templates.json');
    if (fs.existsSync(worktreeTemplatesPath)) {
      fs.copyFileSync(worktreeTemplatesPath, outputPath);
      appendLog(deviceId, { level: 'info', message: 'Copied templates from worktree (gatekeeper pre-ran layout engine)' });
    }
  }

  if (!fs.existsSync(manifestPath)) {
    // Fallback: extract JSON from gatekeeper checkpoint
    const gatekeeperCheckpointPath = paths().agent('gatekeeper').wtCheckpoint;

    if (!fs.existsSync(gatekeeperCheckpointPath)) {
      completePhase(state, 'phase-0-layout-engine', null, false);
      if (!tryAutoRetry(state, 'agent-failure', 'No manifest found — checked worktree .pipeline/, main .pipeline/, and gatekeeper checkpoint')) return;
      return;
    }

    const checkpointContent = fs.readFileSync(gatekeeperCheckpointPath, 'utf-8');
    const jsonMatch = checkpointContent.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      completePhase(state, 'phase-0-layout-engine', null, false);
      if (!tryAutoRetry(state, 'agent-failure', 'No manifest.json file and no JSON block in gatekeeper checkpoint')) return;
      return;
    }

    try {
      JSON.parse(jsonMatch[1]);
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, jsonMatch[1], 'utf-8');
    } catch (e) {
      completePhase(state, 'phase-0-layout-engine', null, false);
      if (!tryAutoRetry(state, 'agent-failure', `Manifest JSON is invalid: ${(e as Error).message}`)) return;
      return;
    }
  }

  // Run the deterministic layout engine
  // Use absolute paths to avoid cwd-relative resolution issues
  try {
    const layoutEnginePath = path.resolve('scripts/layout-engine.ts');
    const absManifestPath = path.resolve(manifestPath);
    const absOutputPath = path.resolve(outputPath);
    appendLog(deviceId, { level: 'info', message: `Running layout engine: ${absManifestPath} → ${absOutputPath}` });

    execSync(
      `npx tsx "${layoutEnginePath}" "${absManifestPath}" --output "${absOutputPath}"`,
      { stdio: 'pipe', timeout: 30_000 }
    );

    if (fs.existsSync(absOutputPath)) {
      const output = JSON.parse(fs.readFileSync(absOutputPath, 'utf-8'));
      const templateCount = output.templates?.length ?? 0;
      const controlCount = output.panelArchitecture?.totalControls ?? 0;
      appendLog(deviceId, {
        level: 'info',
        message: `Layout Engine: ${templateCount} templates generated for ${controlCount} controls`,
      });
      completePhase(state, 'phase-0-layout-engine', 10, true);

      // Generate manifest-editor.json from gatekeeper manifest so the editor
      // can load it immediately. Without this, "Send to Contractor" fails because
      // manifest-editor.json doesn't exist until the admin makes a manual edit.
      const editorManifestPath = path.join('.pipeline', deviceId, 'manifest-editor.json');
      if (!fs.existsSync(editorManifestPath)) {
        try {
          const gkManifest = JSON.parse(fs.readFileSync(paths().manifest, 'utf-8'));
          const dims = gkManifest.deviceDimensions ?? { widthMm: 800, depthMm: 400 };
          const aspect = dims.widthMm / dims.depthMm;
          const canvasWidth = Math.round(Math.max(1200, Math.min(2400, aspect * 800)));
          const canvasHeight = Math.round(canvasWidth / aspect);

          const sections: Record<string, any> = {};
          const controls: Record<string, any> = {};
          const editorLabels: any[] = [];

          // Convert sections: percentage bounding boxes → pixel positions
          for (const s of (gkManifest.sections ?? [])) {
            const bbox = s.panelBoundingBox ?? { x: 0, y: 0, w: 100, h: 100 };
            sections[s.id] = {
              id: s.id,
              headerLabel: s.headerLabel ?? s.id.toUpperCase(),
              archetype: s.archetype ?? 'single-column',
              x: Math.round((bbox.x / 100) * canvasWidth),
              y: Math.round((bbox.y / 100) * canvasHeight),
              w: Math.round((bbox.w / 100) * canvasWidth),
              h: Math.round((bbox.h / 100) * canvasHeight),
              childIds: s.controls ?? [],
            };
          }

          // Convert controls: distribute within their section bounds
          for (const c of (gkManifest.controls ?? [])) {
            const sectionId = c.section ?? '';
            const section = sections[sectionId];
            const sectionControls = section?.childIds ?? [];
            const idx = sectionControls.indexOf(c.id);
            const count = sectionControls.length || 1;

            // Grid layout within section
            const cols = Math.ceil(Math.sqrt(count));
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const cellW = (section?.w ?? 200) / cols;
            const cellH = (section?.h ?? 200) / Math.ceil(count / cols);

            controls[c.id] = {
              id: c.id,
              label: c.verbatimLabel ?? c.id,
              type: c.type ?? 'button',
              x: Math.round((section?.x ?? 0) + col * cellW + cellW * 0.1),
              y: Math.round((section?.y ?? 0) + row * cellH + cellH * 0.1),
              w: Math.round(cellW * 0.8),
              h: Math.round(cellH * 0.8),
              sectionId,
              labelPosition: c.type === 'pad' ? 'on-button' : 'above',
              locked: false,
            };

            // Create editorLabel
            editorLabels.push({
              text: c.verbatimLabel ?? c.id,
              controlId: c.id,
              x: Math.round((section?.x ?? 0) + col * cellW + cellW * 0.1),
              y: Math.round((section?.y ?? 0) + row * cellH - 12),
              w: Math.max((c.verbatimLabel ?? c.id).length * 7, 40),
              h: 14,
              fontSize: 9,
            });
          }

          const editorManifest = {
            _source: 'editor',
            deviceId: gkManifest.deviceId ?? deviceId,
            deviceName: gkManifest.deviceName ?? state.deviceName,
            manufacturer: gkManifest.manufacturer ?? state.manufacturer,
            sections,
            controls,
            editorLabels,
            controlGroups: [],
            canvasWidth,
            canvasHeight,
            controlScale: 1.0,
            zoom: 1.0,
            keyboard: gkManifest.keyboard ?? null,
          };

          fs.writeFileSync(editorManifestPath, JSON.stringify(editorManifest, null, 2));
          appendLog(deviceId, {
            level: 'info',
            message: `Generated manifest-editor.json (${Object.keys(controls).length} controls, ${Object.keys(sections).length} sections, ${canvasWidth}x${canvasHeight} canvas)`,
          });
        } catch (genErr) {
          appendLog(deviceId, {
            level: 'warn',
            message: `Could not generate manifest-editor.json: ${(genErr as Error).message}. Admin can create it by opening the editor.`,
          });
        }
      }

      // Pause for editor — the contractor positions controls via the hosted editor.
      // Use "Send to Contractor" on the pipeline detail page to upload to Blob.
      createEscalation(state, 'editor-ready',
        `Pipeline ready for editor. Click "Send to Contractor" to upload the manifest for the contractor to edit. ` +
        `Resume the pipeline after the panel is approved to start QA.\n` +
        `Manifest: .pipeline/${deviceId}/manifest.json\n` +
        `Templates: .pipeline/${deviceId}/templates.json`);
      sendNotification('Miyagi Pipeline', `${state.deviceName} is ready for the editor`);
      state.status = 'paused';
      writeState(deviceId, state);
      return;
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

/**
 * Phase 0 Post-Editor Check — pure-logic validation of the contractor-approved
 * manifest. Runs between layout-engine (with editor pause) and phase-4-extraction.
 *
 * No LLM. Catches structural integrity issues that would silently corrupt every
 * downstream agent and every generated tutorial: missing control IDs, duplicate
 * IDs, orphaned section.childIds, orphaned label.controlId references, etc.
 *
 * On error: creates a `control-id-validation-failed` escalation listing every
 * issue. Pipeline halts. Admin reviews findings in dashboard, fixes in editor,
 * resolves escalation, resumes pipeline.
 *
 * On warnings only: logs them and advances (informational).
 *
 * Origin: 2026-05-10 — replaces the QA work that archived phases 1-3 used to
 * do, with a fast deterministic check focused on what tutorials actually need
 * (valid control IDs to reference).
 */
async function doPhase0PostEditorCheck(state: PipelineState) {
  startPhase(state, 'phase-0-post-editor-check');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 0: Post-Editor Validation (control-ID integrity)' });

  // Read the contractor-approved manifest from the main pipeline dir
  // (contractor edits write to root/manifest-editor.json; runner copies
  //  to worktree at various points but the canonical source is here)
  const editorManifestPath = paths().editorManifest;
  if (!fs.existsSync(editorManifestPath)) {
    appendLog(deviceId, { level: 'warn', message: `manifest-editor.json not found at ${editorManifestPath} — skipping post-editor check` });
    completePhase(state, 'phase-0-post-editor-check', null, true);
    advancePhase(state, worktreeCwd);
    return;
  }

  const manifestJson = fs.readFileSync(editorManifestPath, 'utf-8');
  const result = validators.validatePostEditorManifest(manifestJson);

  // Log warnings (always — informational)
  for (const finding of result.findings) {
    if (finding.severity === 'warning') {
      appendLog(deviceId, {
        level: 'warn',
        message: `[${finding.code}] ${finding.message}`,
      });
    }
  }

  if (result.errorCount > 0) {
    const summary = `${result.errorCount} structural error${result.errorCount === 1 ? '' : 's'} in manifest. Fix in editor, resolve escalation, then resume.`;
    const details = result.findings
      .filter((f) => f.severity === 'error')
      .map((f) => `  [${f.code}] ${f.message}`)
      .join('\n');

    appendLog(deviceId, { level: 'error', message: summary });
    appendLog(deviceId, { level: 'info', message: details });

    createEscalation(state, 'control-id-validation-failed', `${summary}\n\n${details}`);
    sendNotification('Miyagi Pipeline', `${state.deviceName}: ${result.errorCount} manifest integrity issue${result.errorCount === 1 ? '' : 's'}`);

    completePhase(state, 'phase-0-post-editor-check', null, false);
    state.status = 'paused';
    writeState(deviceId, state);
    return;
  }

  appendLog(deviceId, {
    level: 'info',
    message: `Post-Editor Check passed: 0 errors, ${result.warningCount} warning${result.warningCount === 1 ? '' : 's'}`,
  });
  completePhase(state, 'phase-0-post-editor-check', null, true);
  advancePhase(state, worktreeCwd);
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
      copyAgentOutput('structural-inspector');

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
      copyAgentOutput('panel-questioner');

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
      copyAgentOutput('critic');

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

  const sieveDir = paths().wtSieveDir;
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

Write output to: ${agentPath(deviceId, 'manual-extractor')}/sieve/${bucketFile}`,
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

1. Read the sieve bucket at: ${agentPath(deviceId, 'manual-extractor')}/sieve/${bucketFile}
2. Re-read pages ${pageStart}-${pageEnd} of "${primaryManual}"
3. Compare: find any omissions or typos in the bucket table
4. Write the corrected table to: ${agentPath(deviceId, 'manual-extractor')}/sieve/${verifiedFile}
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

1. Read the verified extraction at: ${agentPath(deviceId, 'manual-extractor')}/sieve/${verifiedFile}
2. Find and read the panel constants file for ${state.deviceName} (look for panel-constants.ts or similar in src/data/)
3. Cross-reference every item in the verified table against the panel constants
4. Write results to: ${agentPath(deviceId, 'manual-extractor')}/sieve/${anchoredFile}

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
  const extractorSievePath = agentPath(deviceId, 'manual-extractor') + '/sieve';
  const extractorAgentPath = agentPath(deviceId, 'manual-extractor');
  const passConfigs = [
    {
      num: 1, name: 'Feature Inventory', file: 'pass-1-inventory.md',
      validate: validators.validatePassInventory, cap: 5,
      prompt: `PASS 1 — FEATURE INVENTORY

Read ALL verified sieve buckets in ${extractorSievePath}/bucket-*-verified.md

Produce a consolidated Feature Inventory:
1. **Feature Inventory** — Every unique feature/workflow grouped by manual chapter, with page references
2. **Page Coverage Map** — Which pages are covered, which have gaps

Write to: ${extractorSievePath}/pass-1-inventory.md`,
    },
    {
      num: 2, name: 'Relationships', file: 'pass-2-relationships.md',
      validate: validators.validatePassRelationships, cap: 5,
      prompt: `PASS 2 — RELATIONSHIPS & DEPENDENCIES

Read: ${extractorSievePath}/pass-1-inventory.md

For each feature in the inventory, determine:
1. **Prerequisites** — What must the user know/configure before using this feature?
2. **Dependencies** — Which other features does this one depend on?
3. **Dependency JSON** — Output a JSON array: [{ "feature": "name", "depends_on": ["feat1", "feat2"] }]

Write to: ${extractorSievePath}/pass-2-relationships.md`,
    },
    {
      num: 3, name: 'Curriculum Design', file: 'pass-3-curriculum.md',
      validate: validators.validatePassCurriculum, cap: 5,
      prompt: `PASS 3 — CURRICULUM DESIGN

Read:
- ${extractorSievePath}/pass-1-inventory.md
- ${extractorSievePath}/pass-2-relationships.md
- .pipeline/${deviceId}/extractor-directives.md (IF IT EXISTS — auditor-flagged gaps from a prior pass that MUST be addressed this time)

If extractor-directives.md exists, treat every gap listed there as a NON-NEGOTIABLE requirement for this curriculum. Each critical gap MUST have a tutorial (new or expanded) that covers it. Cite the manual pages from the directives in your tutorial entries.

Design the tutorial curriculum:
1. Group features into TUTORIAL blocks (3-8 related features per tutorial)
2. Name each tutorial descriptively
3. For each TUTORIAL, list: title, features covered, manual pages, prerequisites
4. Build a DAG (dependency graph) showing tutorial ordering
5. Output the DAG as both ASCII art and a JSON dependency array
6. If directives existed, add a "Directive Coverage" section confirming each
   listed gap has a tutorial home; cite the new/expanded tutorial id.

Write to: ${extractorSievePath}/pass-3-curriculum.md`,
    },
    {
      num: 4, name: 'Batch Plan', file: 'pass-4-batches.md',
      validate: validators.validatePassBatches, cap: 5,
      prompt: `PASS 4 — BATCH PLAN

Read:
- ${extractorSievePath}/pass-3-curriculum.md

Group tutorials into BATCH blocks for implementation:
1. Each BATCH should contain 3-5 tutorials that can be built together
2. Respect the dependency chain — no batch should depend on a later batch
3. For each BATCH: list tutorials, estimated complexity, dependency chain to prior batches
4. Define the execution order for batches

Also write the final checkpoint to ${extractorAgentPath}/checkpoint.md with YAML frontmatter:
agent: manual-extractor, device_id: ${deviceId}, phase: 4, status: PASS, score: 10

Write batch plan to: ${extractorSievePath}/pass-4-batches.md`,
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
  copyAgentOutput('manual-extractor');
  const checkpoint = readAgentCheckpoint('manual-extractor');
  const score = checkpoint.score ?? 10;
  completePhase(state, 'phase-4-extraction', score, true);
  advancePhase(state, worktreeCwd);
}

async function doPhase4Audit(state: PipelineState) {
  startPhase(state, 'phase-4-audit');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 4: Coverage Audit (Independence Enforced)' });
  if (!isBudgetOk(state)) return;

  const auditPaths = paths();
  const extractorMemDir = auditPaths.wtExtractorDir;
  const sealedDir = auditPaths.extractorSealed;
  const auditorDir = auditPaths.agent('coverage-auditor').wtDir;
  const independentChecklistPath = path.join(auditorDir, 'independent-checklist.md');
  const comparativeAuditPath = path.join(auditorDir, 'comparative-audit.md');

  fs.mkdirSync(auditorDir, { recursive: true });

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

Write your independent checklist to: ${agentPath(deviceId, 'coverage-auditor')}/independent-checklist.md

Rules:
- Work ONLY from the manual — do not read any files in ${agentPath(deviceId, 'manual-extractor')}/
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
1. Your independent checklist: ${agentPath(deviceId, 'coverage-auditor')}/independent-checklist.md
2. The extractor's inventory: ${agentPath(deviceId, 'manual-extractor')}/sieve/pass-1-inventory.md
3. The extractor's curriculum: ${agentPath(deviceId, 'manual-extractor')}/sieve/pass-3-curriculum.md
4. The extractor's batch plan: ${agentPath(deviceId, 'manual-extractor')}/sieve/pass-4-batches.md

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

Write to: ${agentPath(deviceId, 'coverage-auditor')}/comparative-audit.md`,
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

Read your comparative audit: ${agentPath(deviceId, 'coverage-auditor')}/comparative-audit.md

Based on your analysis, render a final verdict:
- APPROVED: Coverage is >= 90% and no critical gaps
- REJECTED: Coverage is < 90% or critical features are missing

Write your checkpoint to ${agentPath(deviceId, 'coverage-auditor')}/checkpoint.md with YAML frontmatter:
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
  copyAgentOutput('coverage-auditor');
  const batches = parseBatchesFromAuditor();

  // Post-parse sanity check (cdj-3000 regression guard, 2026-05-18).
  // Background: a parser bug fixed in 9340015 silently returned [] for
  // months. Devices that ran phase-4-audit during that window had empty
  // tutorialBatches written to state, then tutorial-build silently produced
  // 0 tutorials and tutorial-pr failed with a misleading git error.
  // The fix below halts immediately if we parsed 0 batches BUT the source
  // file looks substantive (>200 chars, contains 'T01' or similar). That
  // signals the auditor produced content but the parser failed — exactly
  // the cdj-3000 pattern. We escalate instead of advancing with empty
  // batches.
  if (batches.length === 0) {
    const batchesPath = path.join(
      paths().agent('manual-extractor').wtDir,
      'sieve',
      'pass-4-batches.md',
    );
    if (fs.existsSync(batchesPath)) {
      const raw = fs.readFileSync(batchesPath, 'utf-8');
      const looksSubstantive = raw.length > 200 && /T\d+/.test(raw);
      if (looksSubstantive) {
        const msg =
          `Coverage auditor passed BUT parseBatchesFromExtractor returned 0 batches ` +
          `from a ${raw.length}-char file at ${batchesPath} that contains T-tokens. ` +
          `Likely a parser/format regression — refusing to advance with empty batches. ` +
          `Inspect the file format and reconcile with parseBatchesFromExtractor's regex.`;
        appendLog(deviceId, { level: 'error', message: msg });
        completePhase(state, 'phase-4-audit', null, false);
        createEscalation(state, 'agent-failure', msg);
        state.status = 'paused';
        writeState(deviceId, state);
        return;
      }
    }
  }

  if (batches.length > 0) state.tutorialBatches = batches;

  // Deterministic verdict from the coverage-scorer. The LLM auditor's
  // frontmatter verdict is ADVISORY only — the script applies codified
  // thresholds to the auditor's structured gap output for the
  // authoritative verdict. See src/lib/pipeline/coverage-scorer.ts.
  const auditorMarkdown = checkpoint.markdown ?? '';
  const prevGapsRaw = state.strikeTracker['phase-4-audit-prev-critical-gaps'];
  const previousGaps = typeof prevGapsRaw === 'string'
    ? prevGapsRaw.split('|').filter(Boolean)
    : [];
  const verdict = coverageScorer.scoreCoverage(auditorMarkdown, {
    previousCriticalGapFeatures: previousGaps,
  });
  appendLog(deviceId, {
    level: 'info',
    message: `Coverage scorer verdict: ${verdict.verdict}. ${verdict.reason}`,
  });
  // Persist current critical gap set for convergence check on next retry
  state.strikeTracker['phase-4-audit-prev-critical-gaps'] = verdict.criticalGaps
    .map(g => g.feature)
    .join('|') as unknown as number;

  if (verdict.verdict === 'APPROVED' || verdict.verdict === 'APPROVED_WITH_WARNINGS') {
    if (verdict.verdict === 'APPROVED_WITH_WARNINGS') {
      try {
        fs.appendFileSync(
          path.join('.pipeline', deviceId, 'repair-log.jsonl'),
          JSON.stringify({
            timestamp: new Date().toISOString(),
            changes: [],
            unrepairableFindings: [{
              severity: 'error',
              code: 'CURRICULUM_APPROVED_WITH_WARNINGS',
              message: `${verdict.reason} ${verdict.moderateGaps.length} moderate gap${verdict.moderateGaps.length === 1 ? '' : 's'} logged.`,
            }],
            bailed: false,
            note: 'curriculum advanced with moderate gaps flagged for later review',
          }) + '\n',
        );
      } catch { /* best-effort logging */ }
    }
    completePhase(state, 'phase-4-audit', verdict.scores.composite, true);
    advancePhase(state, worktreeCwd);
    return;
  }

  // ── REJECTED or CRITICAL — decide auto-retry vs escalate ────────────────
  const MAX_AUDIT_RETRIES = 2;
  const auditKey = 'phase-4-audit';
  const retryCount = state.strikeTracker[auditKey] ?? 0;

  if (verdict.shouldAutoRetry && retryCount < MAX_AUDIT_RETRIES) {
    const directives = coverageScorer.buildDirectivesFromVerdict(verdict);
    try {
      fs.writeFileSync(path.join('.pipeline', deviceId, 'extractor-directives.md'), directives);
      appendLog(deviceId, {
        level: 'info',
        message: `${verdict.verdict}: auto-retry ${retryCount + 1}/${MAX_AUDIT_RETRIES} with directives (${verdict.criticalGaps.length} critical + ${verdict.moderateGaps.length} moderate gaps).`,
      });
    } catch (err) {
      appendLog(deviceId, { level: 'warn', message: `Could not write directives: ${(err as Error).message}` });
    }
    state.strikeTracker[auditKey] = retryCount + 1;
    completePhase(state, 'phase-4-audit', verdict.scores.composite, false);
    startPhase(state, 'phase-4-extraction');
    writeState(deviceId, state);
    return;
  }

  // Escalate: CRITICAL verdict, regressed retry, or max retries hit
  completePhase(state, 'phase-4-audit', verdict.scores.composite, false);
  const escalationMsg = verdict.regressed
    ? `Extractor regressed on retry — ${verdict.reason}`
    : retryCount >= MAX_AUDIT_RETRIES
      ? `${verdict.verdict} after ${MAX_AUDIT_RETRIES} auto-retries. ${verdict.reason}`
      : `${verdict.verdict}: ${verdict.reason}`;
  createEscalation(state, 'curriculum-review', escalationMsg);
  sendNotification('Miyagi Pipeline', `Curriculum review needed for ${state.deviceName}`);
}

async function doPhase5DisplayBuild(state: PipelineState) {
  startPhase(state, 'phase-5-display-build');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 5-X: Display Builder (screen component generation)' });

  if (!isBudgetOk(state)) return;

  const displayResult = await invokeAgent({
    prompt: `Generate display screen components for ${state.deviceName} (${deviceId}).

Read the manual to identify all screen types this instrument has.
Use the three-pass process: Style Probe → Atomic Components → Screen Assembly.

Manual location: ${state.manualPaths.map(p => path.join(worktreeCwd, p)).join(', ')}
Feature inventory: ${agentPath(deviceId, 'manual-extractor')}/

Output to: src/components/devices/${deviceId}/display/
Create: device-theme.json, atoms/, screens/, DisplayScreen.tsx dispatcher, screen-inventory.json.`,
    deviceId,
    cwd: worktreeCwd,
    phase: 'phase-5-display-build',
    agent: 'display-builder',
    allowedTools: PIPELINE_TOOLS,
    remainingBudgetUsd: getRemainingBudget(state),
    onChildPid: (pid) => trackChildPid(state, pid),
  });

  if (displayResult.costEntry) {
    accumulateCost(state, displayResult.costEntry);
    recordCostEntry(deviceId, displayResult.costEntry);
  }
  updateBurnRate(state, deviceId);
  updateSubscription(state, displayResult.rateLimitEvents);

  // ─── Post-checks: mechanical validation of agent output ──────────────────
  // The agent's checkpoint score is informational. These validators are the
  // hard compiler that catches stub files, missing screens, malformed JSON,
  // and cross-device contamination. Failure here halts the phase.
  const displayDir = path.join(worktreeCwd, 'src', 'components', 'devices', deviceId, 'display');
  const themePath = path.join(displayDir, 'device-theme.json');
  const inventoryPath = path.join(displayDir, 'screen-inventory.json');
  const pass1Path = path.join(agentPath(deviceId, 'manual-extractor'), 'sieve', 'pass-1-inventory.md');

  const postCheckErrors: string[] = [];

  // 1. Theme JSON
  if (!fs.existsSync(themePath)) {
    postCheckErrors.push(`Missing ${themePath}`);
  } else {
    const themeContent = fs.readFileSync(themePath, 'utf-8');
    const themeResult = validators.validateDeviceTheme(themeContent);
    if (!themeResult.valid) {
      postCheckErrors.push(...themeResult.errors.map(e => `device-theme.json: ${e}`));
    }
  }

  // 2. Inventory JSON + parse for downstream checks
  let inventoryEntries: Array<{ id: string; component: string; confidence?: 'high' | 'low'; description?: string; manualPages?: string }> = [];
  if (!fs.existsSync(inventoryPath)) {
    postCheckErrors.push(`Missing ${inventoryPath}`);
  } else {
    const inventoryContent = fs.readFileSync(inventoryPath, 'utf-8');
    const inventoryResult = validators.validateScreenInventory(inventoryContent);
    if (!inventoryResult.valid) {
      postCheckErrors.push(...inventoryResult.errors.map(e => `screen-inventory.json: ${e}`));
    } else {
      try {
        const parsed = JSON.parse(inventoryContent);
        inventoryEntries = parsed.screenTypes ?? [];
      } catch { /* validateScreenInventory already caught this */ }
    }
  }

  // 3. Component files — TSX existence, named exports, substantive content, anti-anchoring grep
  if (fs.existsSync(displayDir) && inventoryEntries.length > 0) {
    const files = new Map<string, string>();
    const collectFiles = (dir: string, prefix: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectFiles(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
          files.set(rel, fs.readFileSync(fullPath, 'utf-8'));
        }
      }
    };
    collectFiles(displayDir, '');

    const componentResult = validators.validateDisplayComponents({
      deviceId,
      files,
      inventory: inventoryEntries,
    });
    if (!componentResult.valid) {
      postCheckErrors.push(...componentResult.errors.map(e => `display components: ${e}`));
    }
  }

  // 4. Completeness check against manual-extractor's screen list
  if (fs.existsSync(pass1Path) && inventoryEntries.length > 0) {
    const pass1Content = fs.readFileSync(pass1Path, 'utf-8');
    const completenessResult = validators.validateInventoryCompleteness({
      inventory: inventoryEntries,
      pass1Content,
    });
    if (!completenessResult.valid) {
      postCheckErrors.push(...completenessResult.errors.map(e => `inventory completeness: ${e}`));
    }
  }

  if (postCheckErrors.length > 0) {
    appendLog(deviceId, {
      level: 'error',
      message: `Phase 5-X post-check failed (${postCheckErrors.length} error${postCheckErrors.length > 1 ? 's' : ''})`,
      detail: postCheckErrors.slice(0, 10).join('\n'),
    });
    completePhase(state, 'phase-5-display-build', null, false);
    createEscalation(
      state,
      'display-builder-post-check',
      `Display Builder output failed validation: ${postCheckErrors[0]}${postCheckErrors.length > 1 ? ` (+${postCheckErrors.length - 1} more)` : ''}`,
    );
    sendNotification('Miyagi Pipeline', `Display Builder validation failed for ${state.deviceName}`);
    return;
  }

  appendLog(deviceId, {
    level: 'info',
    message: `Phase 5-X post-check passed (${inventoryEntries.length} screens validated, no contamination detected)`,
  });
  completePhase(state, 'phase-5-display-build', null, true);
  advancePhase(state, worktreeCwd);
}

async function doPhase5(state: PipelineState) {
  startPhase(state, 'phase-5-tutorial-build');

  // Defensive re-parse: state.tutorialBatches can be empty even when the
  // auditor's batch file exists on disk (e.g., cdj-3000 hit an earlier broken
  // parser that left state empty). If we'd start the agent loop with 0
  // batches, it would silently produce 0 tutorials and fail downstream at
  // tutorial-pr with a misleading error. Recover here, or halt loudly.
  if (state.tutorialBatches.length === 0) {
    appendLog(deviceId, {
      level: 'warn',
      message: 'state.tutorialBatches is empty — attempting recovery from auditor output',
    });
    const reparsed = parseBatchesFromExtractor();
    if (reparsed.length === 0) {
      const msg =
        `Cannot start tutorial-build: state.tutorialBatches is empty AND no batches found at ` +
        `.pipeline/${deviceId}/agents/manual-extractor/sieve/pass-4-batches.md. ` +
        `Re-run extractor + auditor first.`;
      appendLog(deviceId, { level: 'error', message: msg });
      createEscalation(state, 'agent-failure', msg);
      state.status = 'paused';
      writeState(deviceId, state);
      return;
    }
    state.tutorialBatches = reparsed;
    appendLog(deviceId, {
      level: 'info',
      message: `Recovered ${reparsed.length} batches from auditor output`,
    });
    writeState(deviceId, state);
  }

  appendLog(deviceId, { level: 'info', message: `Starting Phase 5: Tutorial Build (${state.tutorialBatches.length} batches)` });

  for (const batch of state.tutorialBatches) {
    if (batch.status === 'approved') continue;

    batch.status = 'building';
    state.lastCheckpoint = { phase: 'phase-5-tutorial-build', subStep: `batch-${batch.batchId}-building` };
    writeState(deviceId, state);
    if (!isBudgetOk(state)) return;

    appendLog(deviceId, { level: 'info', agent: 'tutorial-builder', message: `Building batch ${batch.batchId}: ${batch.tutorials.join(', ')}` });
    // If admin requested changes from a prior tutorial-review pause, the feedback
    // note rides on the next build attempt's prompt so the agent knows what to fix.
    const feedbackSuffix = state.tutorialReviewFeedback
      ? `\n\nADMIN FEEDBACK from prior review (address before re-submitting):\n${state.tutorialReviewFeedback}`
      : '';
    // Uses invokeAgentWithRetry — handles transient 529 Overloaded errors
    // with exponential backoff (30s, 120s, 300s). After exhaustion, returns
    // the failure and our GATE 1 below pauses with an escalation.
    trackAgentActivity(state, 'tutorial-builder', Date.now());
    const buildResult = await invokeAgentWithRetry({
      prompt: `Build tutorial batch ${batch.batchId} for ${state.deviceName}. Device ID: ${deviceId}. Tutorials: ${batch.tutorials.join(', ')}${feedbackSuffix}`,
      deviceId, cwd: worktreeCwd, phase: 'phase-5-tutorial-build', agent: 'tutorial-builder', batchId: batch.batchId,
      allowedTools: PIPELINE_TOOLS,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
      onAgentActivity: (ts) => trackAgentActivity(state, 'tutorial-builder', ts),
    });
    trackAgentActivity(state, null, null);
    if (buildResult.costEntry) { accumulateCost(state, buildResult.costEntry); recordCostEntry(deviceId, buildResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, buildResult.rateLimitEvents);

    // GATE 1: builder must exit cleanly. If 529, OOM, or any non-zero exit,
    // halt with an escalation instead of running the reviewer against empty
    // (or partial) work. Saves token budget and prevents cascade through
    // GATE 2's stale-checkpoint hazard.
    if (buildResult.exitCode !== 0) {
      const msg =
        `tutorial-builder failed for batch ${batch.batchId} (exit ${buildResult.exitCode}). ` +
        `Common causes: 529 API Overloaded, network blip, OOM. ` +
        `Pipeline paused so the reviewer doesn't run against an empty batch. ` +
        `Resume from /admin when ready — pipeline will retry this batch.`;
      appendLog(deviceId, { level: 'error', message: msg });
      // Reset batch to pending so retry starts fresh
      batch.status = 'pending';
      batch.builderScore = null;
      createEscalation(state, 'agent-failure', msg);
      state.status = 'paused';
      writeState(deviceId, state);
      return;
    }

    batch.builderScore = readAgentCheckpoint('tutorial-builder').score;

    batch.status = 'reviewing';
    state.lastCheckpoint = { phase: 'phase-5-tutorial-build', subStep: `batch-${batch.batchId}-reviewing` };
    writeState(deviceId, state);

    // GATE 2: clear ANY prior reviewer checkpoint before invoking reviewer.
    // Otherwise a stale APPROVED from batch-a (or a manual recovery) gets
    // re-read as the verdict for batch-b → false-approved cascade.
    // Discovered cdj-3000 2026-05-18 — see PR-D.
    const reviewerCheckpointPath = paths().agent('tutorial-reviewer').wtCheckpoint;
    try { fs.rmSync(reviewerCheckpointPath, { force: true }); } catch { /* ignore */ }

    appendLog(deviceId, { level: 'info', agent: 'tutorial-reviewer', message: `Reviewing batch ${batch.batchId}` });
    const reviewStartMs = Date.now();
    trackAgentActivity(state, 'tutorial-reviewer', Date.now());
    const reviewResult = await invokeAgentWithRetry({
      prompt: `Review tutorial batch ${batch.batchId} for ${state.deviceName}. Device ID: ${deviceId}. Verify accuracy against the manual.`,
      deviceId, cwd: worktreeCwd, phase: 'phase-5-tutorial-build', agent: 'tutorial-reviewer', batchId: batch.batchId,
      allowedTools: PIPELINE_TOOLS,
      remainingBudgetUsd: getRemainingBudget(state),
      onChildPid: (pid) => trackChildPid(state, pid),
      onAgentActivity: (ts) => trackAgentActivity(state, 'tutorial-reviewer', ts),
    });
    trackAgentActivity(state, null, null);
    const reviewWallMs = Date.now() - reviewStartMs;
    if (reviewResult.costEntry) { accumulateCost(state, reviewResult.costEntry); recordCostEntry(deviceId, reviewResult.costEntry); }
    updateBurnRate(state, deviceId);
    updateSubscription(state, reviewResult.rateLimitEvents);

    // GATE 3: reviewer must also exit cleanly. Pause if not.
    if (reviewResult.exitCode !== 0) {
      const msg =
        `tutorial-reviewer failed for batch ${batch.batchId} (exit ${reviewResult.exitCode}). ` +
        `Builder output is intact; reviewer hit an error (likely 529 or transient). ` +
        `Resume from /admin to retry just the reviewer.`;
      appendLog(deviceId, { level: 'error', message: msg });
      createEscalation(state, 'agent-failure', msg);
      state.status = 'paused';
      writeState(deviceId, state);
      return;
    }

    // GATE 4: verify checkpoint was written AND batchId matches. A
    // missing-checkpoint or batchId-mismatch means the reviewer didn't
    // actually review THIS batch (either it forgot to write, or somehow
    // wrote one for a previous batch).
    //
    // PR-E enhancement: if checkpoint missing but reviewer exited cleanly
    // with substantive work (>$0.50, >60s) AND stdout has an explicit
    // `Verdict: APPROVED|REJECTED` line matching this batchId AND no
    // contradicting rejection keywords → synthesize the checkpoint and
    // proceed. Strict guards in reviewer-prose-synth.ts. Saves admin from
    // manually patching state.json (4 of 5 cdj-3000 batches needed this).
    const checkpoint = readAgentCheckpoint('tutorial-reviewer');
    const batchIdMismatch = checkpoint.batchId && checkpoint.batchId !== batch.batchId;
    if (!checkpoint.verdict || batchIdMismatch) {
      // Try synth from prose first
      const { synthesizeReviewerVerdict } = await import('../src/lib/pipeline/reviewer-prose-synth');
      const synth = synthesizeReviewerVerdict({
        output: reviewResult.output,
        expectedBatchId: batch.batchId,
        exitCode: reviewResult.exitCode,
        wallMs: reviewWallMs,
        costUsd: reviewResult.costEntry?.costUsd ?? 0,
      });

      if (synth.synthesized && synth.verdict) {
        // Write synthetic checkpoint so resume / re-entry sees the verdict
        try {
          const synthCheckpoint =
            `---\n` +
            `agent: tutorial-reviewer\n` +
            `deviceId: ${deviceId}\n` +
            `batchId: ${batch.batchId}\n` +
            `verdict: ${synth.verdict}\n` +
            `score: 0\n` +
            `timestamp: ${new Date().toISOString()}\n` +
            `synthesized: true\n` +
            `synthesisReason: ${synth.reason.replace(/[\n\r]/g, ' ')}\n` +
            `---\n\n` +
            `# Auto-synthesized verdict from reviewer prose\n\n` +
            `Reviewer exited cleanly but didn't write checkpoint.md (likely a SOUL ` +
            `bug on this worktree pre-dating PR-D's mandate). The synth module ` +
            `extracted the verdict from stdout with all strict guards passing.\n\n` +
            `**Evidence**: \`${synth.evidence ?? ''}\`\n\n` +
            `Full reviewer output preserved at: ` +
            `\`.pipeline/${deviceId}/agents/tutorial-reviewer/last-output.md\`\n`;
          fs.mkdirSync(path.dirname(reviewerCheckpointPath), { recursive: true });
          fs.writeFileSync(reviewerCheckpointPath, synthCheckpoint);
        } catch (writeErr) {
          appendLog(deviceId, {
            level: 'warn',
            message: `Could not write synthesized checkpoint: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}. Proceeding anyway.`,
          });
        }

        batch.reviewerVerdict = synth.verdict;
        appendLog(deviceId, {
          level: 'info',
          message:
            `[AUTO-RECOVERY] Synthesized ${synth.verdict} verdict for batch ${batch.batchId} ` +
            `from reviewer prose. ${synth.reason}. Evidence: "${synth.evidence}".`,
        });
        // Fall through to the normal verdict-handling branch below
      } else {
        // Synth refused (guards not met) → pause with detailed reason
        const msg = batchIdMismatch
          ? `tutorial-reviewer wrote checkpoint for batch ${checkpoint.batchId} but we're on ${batch.batchId} — refusing to use stale verdict.`
          : `tutorial-reviewer exited cleanly but didn't write a verdict to checkpoint.md for batch ${batch.batchId}. ` +
            `Auto-synth refused: ${synth.reason}. ` +
            `Full reviewer output preserved at .pipeline/${deviceId}/agents/tutorial-reviewer/last-output.md — ` +
            `read it and either click Approve in /admin or restart the reviewer.`;
        appendLog(deviceId, { level: 'error', message: msg });
        createEscalation(state, 'agent-failure', msg);
        state.status = 'paused';
        writeState(deviceId, state);
        return;
      }
    } else {
      batch.reviewerVerdict = checkpoint.verdict;
    }

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
  // Clear the feedback once consumed so we don't re-include it on the NEXT
  // unrelated build pass.
  state.tutorialReviewFeedback = null;
  advancePhase(state, worktreeCwd);
}

/**
 * Tutorial Review pause phase — runs deterministic validators across all
 * generated tutorials, persists the summary to disk, then pauses for admin
 * approval via the /admin/<id>/review-tutorials page.
 *
 * Resume routes:
 *   resolution = 'approve'              → advance to tutorial-pr
 *   resolution = 'changes-requested'    → reset batches, store feedback,
 *                                         jump back to phase-5-tutorial-build
 */
async function doTutorialReview(state: PipelineState) {
  // Re-entry: a previous run paused us here and admin resolved the escalation.
  const resolvedReview = state.escalations.find(
    e => e.type === 'tutorial-review' && e.resolvedAt && e.phase === 'tutorial-review',
  );

  if (resolvedReview) {
    const resolution = resolvedReview.resolution ?? '';
    appendLog(deviceId, {
      level: 'info',
      message: `Tutorial review resolved: ${resolution}`,
    });

    if (resolution === 'approve' || resolution === 'override-applied') {
      completePhase(state, 'tutorial-review', null, true);
      advancePhase(state, worktreeCwd);
      return;
    }

    if (resolution.startsWith('changes-requested')) {
      // Reset batches so tutorial-build re-runs; store the feedback note for
      // the tutorial-builder agent to consume on its next attempt.
      const note = resolution.slice('changes-requested:'.length).trim();
      state.tutorialReviewFeedback = note || 'Admin requested changes (no note provided).';
      for (const batch of state.tutorialBatches) {
        batch.status = 'pending';
        batch.builderScore = null;
        batch.reviewerVerdict = null;
      }
      // Move back to tutorial-build. completePhase isn't called here — the
      // review phase stays "running" historically until tutorials are approved.
      startPhase(state, 'phase-5-tutorial-build');
      appendLog(deviceId, {
        level: 'info',
        message: `Pipeline rewound to tutorial-build with admin feedback: ${state.tutorialReviewFeedback}`,
      });
      return;
    }

    // Unknown resolution — fail safe by halting
    appendLog(deviceId, {
      level: 'error',
      message: `Unknown tutorial-review resolution: ${resolution}`,
    });
    state.status = 'failed';
    return;
  }

  // First entry: run validators + create the pause escalation.
  startPhase(state, 'tutorial-review');
  appendLog(deviceId, { level: 'info', message: 'Starting tutorial-review: validating generated tutorials' });

  try {
    const { validateGeneratedTutorials } = await import('../src/lib/pipeline/tutorial-validators');
    const { loadTutorials } = await import('../src/lib/tutorial/loadValidControlIds');

    // Generated tutorials live in the worktree at <wt>/src/data/tutorials/<deviceId>/
    // — they aren't in canonical yet (tutorial-pr opens that PR). The admin
    // review page reads from canonical, so we serialize the tutorials to JSON
    // here and persist alongside summary.json.
    const tutorialsBaseDir = path.join(worktreeCwd, 'src/data/tutorials');
    const summary = await validateGeneratedTutorials(deviceId, {
      preferPipelineManifest: true,
      tutorialsBaseDir,
    });
    const tutorials = await loadTutorials(deviceId, { tutorialsBaseDir });

    // Persist for the admin review page. .pipeline/ in the worktree is a
    // symlink to canonical so a single write reaches the admin's source.
    const summaryDir = paths().agent('tutorial-review').wtDir;
    fs.mkdirSync(summaryDir, { recursive: true });
    fs.writeFileSync(path.join(summaryDir, 'summary.json'), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(summaryDir, 'tutorials.json'), JSON.stringify(tutorials, null, 2));

    const msg =
      `${summary.totalTutorials} tutorials generated for ${state.deviceName} ` +
      `(${summary.totalSteps} total steps). ` +
      `Errors: ${summary.totalErrors}, Warnings: ${summary.totalWarnings}, Info: ${summary.totalInfos}. ` +
      `Click "Review Tutorials" to inspect each one in the admin review canvas, ` +
      `then Approve or Request Changes.`;

    createEscalation(state, 'tutorial-review', msg);
    sendNotification('Miyagi Pipeline', `${state.deviceName} tutorials ready for review`);
    appendLog(deviceId, { level: 'info', message: 'Tutorial Review: paused, waiting for admin approval' });
    state.status = 'paused';
    writeState(deviceId, state);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendLog(deviceId, {
      level: 'error',
      message: `Tutorial-review validation failed: ${message}. Pausing anyway so admin can investigate.`,
    });
    // Pause even on validator failure — admin can decide whether to retry or override
    createEscalation(
      state,
      'tutorial-review',
      `Validator failed to run (${message}). Inspect generated tutorials manually before approving.`,
    );
    state.status = 'paused';
    writeState(deviceId, state);
  }
}

async function doTutorialPR(state: PipelineState) {
  startPhase(state, 'tutorial-pr');
  appendLog(deviceId, { level: 'info', message: 'Creating tutorial PR...' });

  try {
    // Push the worktree branch to remote before creating PR
    execSync('git push -u origin HEAD', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], cwd: worktreeCwd });

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

function readAgentCheckpoint(agentName: string) {
  try {
    const checkpointPath = paths().agent(agentName).wtCheckpoint;
    const content = fs.readFileSync(checkpointPath, 'utf-8');
    return parseCheckpoint(content);
  } catch {
    return { agent: null, deviceId: null, phase: null, status: null, score: null, verdict: null, sectionId: null, batchId: null, timestamp: null };
  }
}

function parseSectionsFromGatekeeper(): SectionStatus[] {
  try {
    // Parse sections from manifest.json directly — not the checkpoint markdown
    const p = paths();
    const manifestLoc = fs.existsSync(p.wtManifest) ? p.wtManifest
      : fs.existsSync(p.manifest) ? p.manifest
      : null;

    if (!manifestLoc) {
      appendLog(deviceId, { level: 'warn', message: 'No manifest.json found — cannot parse sections' });
      return [];
    }

    const manifest = JSON.parse(fs.readFileSync(manifestLoc, 'utf-8'));
    const sections: SectionStatus[] = [];

    for (const s of manifest.sections ?? []) {
      if (s.id) {
        sections.push({
          id: s.id,
          siScore: null,
          pqScore: null,
          criticScore: null,
          vaulted: false,
          attempts: 0,
          costUsd: 0,
          tokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
        });
      }
    }

    appendLog(deviceId, { level: 'info', message: `Parsed ${sections.length} sections from manifest.json` });
    return sections;
  } catch {
    return [];
  }
}

/**
 * Parse tutorial batches from the manual-extractor's Pass 4 output.
 *
 * The batches live in:
 *   .pipeline/<id>/agents/manual-extractor/sieve/pass-4-batches.md
 *
 * Format is a markdown table:
 *   | Batch | Tutorials              | Count | ...
 *   |-------|------------------------|-------|...
 *   | A     | T01, T02, T15, T21     | 4     | ...
 *   | B     | T03, T19, T22, T23     | 4     | ...
 *
 * Previous implementation read from coverage-auditor's checkpoint with a
 * regex that expected `batch X: T01, T02` colon-separated format — neither
 * the file nor the format matched reality, so it silently returned []
 * for every device. Result: every tutorial-build ran with 0 batches.
 */
function parseBatchesFromExtractor() {
  const batchesPath = path.join(
    paths().agent('manual-extractor').wtDir,
    'sieve',
    'pass-4-batches.md',
  );

  if (!fs.existsSync(batchesPath)) {
    appendLog(deviceId, {
      level: 'warn',
      message: `Batches file missing at ${batchesPath} — tutorial-build will have 0 batches`,
    });
    return [];
  }

  try {
    const content = fs.readFileSync(batchesPath, 'utf-8');
    const batches: { batchId: string; tutorials: string[] }[] = [];

    // Match markdown table rows like: | A | T01, T02, T15, T21 | 4 | ...
    // - Must start with `|` and a single letter/number batch ID
    // - Tutorials cell contains one or more T<digits> tokens, comma-separated
    // - Stops at the next `|`
    const rowPattern = /^\|\s*([A-Z0-9][A-Z0-9-]*)\s*\|\s*(T\d+(?:\s*,\s*T\d+)*)\s*\|/gim;
    const seen = new Set<string>();
    let match;
    while ((match = rowPattern.exec(content)) !== null) {
      const batchId = `batch-${match[1].toLowerCase()}`;
      // Skip the header row's separator (which doesn't have T-tokens anyway)
      // and the "Total" summary row (e.g., `| **Total** | **T01–T23** | ...`)
      if (seen.has(batchId)) continue;
      const tutorials = match[2].split(',').map((t) => t.trim()).filter(Boolean);
      if (tutorials.length === 0) continue;
      seen.add(batchId);
      batches.push({ batchId, tutorials });
    }

    if (batches.length === 0) {
      appendLog(deviceId, {
        level: 'warn',
        message: `Found batches file at ${batchesPath} but parsed 0 batches. ` +
                 `Expected markdown table rows like '| A | T01, T02 | ...'`,
      });
    }

    return batches.map((b) => ({
      ...b,
      status: 'pending' as const,
      builderScore: null,
      reviewerVerdict: null,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    appendLog(deviceId, {
      level: 'error',
      message: `Failed to parse batches: ${msg}`,
    });
    return [];
  }
}

// Backward-compat alias — internal callers still use the old name.
// Removable once all references are migrated.
const parseBatchesFromAuditor = parseBatchesFromExtractor;

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
