#!/usr/bin/env npx tsx
/**
 * Pipeline Runner — Detached state machine for Claude CLI agent orchestration.
 *
 * Usage: npx tsx scripts/pipeline-runner.ts <device-id>
 *
 * Spawned as a detached process by the API route. Persists across server restarts.
 * Writes state to .pipeline/<device-id>/state.json (atomic writes).
 * Reads agent checkpoints from .claude/agent-memory/*/checkpoint.md.
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

const deviceId = process.argv[2];
if (!deviceId) {
  console.error('Usage: npx tsx scripts/pipeline-runner.ts <device-id>');
  process.exit(1);
}

/** Resolved worktree path — all agent invocations run here */
let worktreeCwd: string;

function getRemainingBudget(state: PipelineState): number {
  return state.budgetCapUsd - (state.totalActualCostUsd || state.totalCostUsd);
}

function isBudgetOk(state: PipelineState): boolean {
  return checkBudget(state).allowed;
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
        case 'phase-0-gatekeeper':
          await doPhase0(state);
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

async function doPhase0(state: PipelineState) {
  startPhase(state, 'phase-0-gatekeeper');
  appendLog(deviceId, { level: 'info', agent: 'gatekeeper', message: 'Starting Phase 0: Gatekeeper' });

  const serverUp = await checkDevServer();
  if (!serverUp) {
    appendLog(deviceId, { level: 'info', message: 'Dev server not running, starting...' });
    const started = await startDevServer(worktreeCwd);
    if (!started) {
      createEscalation(state, 'agent-failure', 'Could not start dev server. Please start it manually with `npm run dev`.');
      return;
    }
  }

  // Install deps in worktree if needed
  if (!fs.existsSync(path.join(worktreeCwd, 'node_modules'))) {
    appendLog(deviceId, { level: 'info', message: 'Installing dependencies in worktree...' });
    execSync('npm install', { cwd: worktreeCwd, stdio: 'pipe' });
  }

  const manualList = state.manualPaths.map((p) => `  - ${p}`).join('\n');
  const prompt = `You are the Gatekeeper agent. Initialize the digital twin build for:
- Device: ${state.deviceName}
- Manufacturer: ${state.manufacturer}
- Device ID: ${deviceId}
- Manuals:
${manualList}

Read all manual PDFs and produce:
1. The Master Manifest of all hardware controls
2. Density Anchors
3. Layout Architecture classification
4. Section Width Ratios
5. Section Topology Maps with Grid Notation and DOM assertions
6. Key Component Proportions

Write your checkpoint to .claude/agent-memory/gatekeeper/checkpoint.md with YAML frontmatter.`;

  const result = await invokeAgent({
    prompt,
    deviceId,
    cwd: worktreeCwd,
    phase: 'phase-0-gatekeeper',
    agent: 'gatekeeper',
    model: 'claude-opus-4-6',
    remainingBudgetUsd: getRemainingBudget(state),
  });

  if (result.costEntry) {
    accumulateCost(state, result.costEntry);
    recordCostEntry(deviceId, result.costEntry);
  }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

  const checkpoint = readAgentCheckpoint('gatekeeper');
  if (checkpoint.score !== null && checkpoint.score >= 9.5) {
    completePhase(state, 'phase-0-gatekeeper', checkpoint.score, true);
    const sections = parseSectionsFromGatekeeper();
    if (sections.length > 0) state.sections = sections;
    advancePhase(state, worktreeCwd);
  } else if (result.exitCode !== 0) {
    createEscalation(state, 'agent-failure', `Gatekeeper failed with exit code ${result.exitCode}`);
  } else {
    completePhase(state, 'phase-0-gatekeeper', checkpoint.score, false);
    createEscalation(state, 'agent-failure', `Gatekeeper score ${checkpoint.score ?? 'unknown'} below threshold (9.5)`);
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
        remainingBudgetUsd: getRemainingBudget(state),
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
        remainingBudgetUsd: getRemainingBudget(state),
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
        remainingBudgetUsd: getRemainingBudget(state),
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
      remainingBudgetUsd: getRemainingBudget(state),
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
  createEscalation(state, 'agent-failure', 'Global assembly failed after 3 attempts');
}

async function doPhase3(state: PipelineState) {
  startPhase(state, 'phase-3-harmonic-polish');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 3: Harmonic Polish' });
  if (!isBudgetOk(state)) return;

  const result = await invokeAgent({
    prompt: `Perform final harmonic polish of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Apply any final visual refinements.`,
    deviceId, cwd: worktreeCwd, phase: 'phase-3-harmonic-polish', agent: 'critic',
    remainingBudgetUsd: getRemainingBudget(state),
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
    createEscalation(state, 'agent-failure', `Harmonic polish score ${checkpoint.score ?? 'unknown'} below threshold`);
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
    createEscalation(state, 'agent-failure', `Failed to create panel PR: ${message}`);
  }
}

async function doPhase4Extract(state: PipelineState) {
  startPhase(state, 'phase-4-extraction');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 4: Manual Extraction' });
  if (!isBudgetOk(state)) return;

  const result = await invokeAgent({
    prompt: `Extract tutorial curriculum from the ${state.deviceName} manuals at: ${state.manualPaths.join(', ')}. Device ID: ${deviceId}. Use chapter-by-chapter extraction.`,
    deviceId, cwd: worktreeCwd, phase: 'phase-4-extraction', agent: 'manual-extractor', model: 'claude-opus-4-6',
    remainingBudgetUsd: getRemainingBudget(state),
  });
  if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

  const checkpoint = readAgentCheckpoint('manual-extractor');
  if (checkpoint.score !== null && checkpoint.score >= 9.0) {
    completePhase(state, 'phase-4-extraction', checkpoint.score, true);
    advancePhase(state, worktreeCwd);
  } else {
    completePhase(state, 'phase-4-extraction', checkpoint.score, false);
    createEscalation(state, 'agent-failure', `Manual extraction score ${checkpoint.score ?? 'unknown'} below threshold`);
  }
}

async function doPhase4Audit(state: PipelineState) {
  startPhase(state, 'phase-4-audit');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 4: Coverage Audit' });
  if (!isBudgetOk(state)) return;

  const result = await invokeAgent({
    prompt: `Audit tutorial coverage for ${state.deviceName}. Device ID: ${deviceId}. Verify the extraction covers all manual chapters. Produce a batch plan.`,
    deviceId, cwd: worktreeCwd, phase: 'phase-4-audit', agent: 'coverage-auditor',
    remainingBudgetUsd: getRemainingBudget(state),
  });
  if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }
  updateBurnRate(state, deviceId);
  updateSubscription(state, result.rateLimitEvents);

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
      remainingBudgetUsd: getRemainingBudget(state),
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
      remainingBudgetUsd: getRemainingBudget(state),
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
    createEscalation(state, 'agent-failure', `Failed to create tutorial PR: ${message}`);
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
