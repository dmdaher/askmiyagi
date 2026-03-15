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
} from '../src/lib/pipeline/cost-tracker';
import { PipelineState, SectionStatus } from '../src/lib/pipeline/types';

const deviceId = process.argv[2];
if (!deviceId) {
  console.error('Usage: npx tsx scripts/pipeline-runner.ts <device-id>');
  process.exit(1);
}

async function run() {
  let state = readState(deviceId);
  if (!state) {
    console.error(`No state found for device: ${deviceId}`);
    process.exit(1);
  }

  state.status = 'running';
  state.runnerPid = process.pid;
  writeState(deviceId, state);

  appendLog(deviceId, {
    level: 'info',
    message: `Pipeline runner started (PID: ${process.pid}) from phase: ${state.currentPhase}`,
  });

  try {
    while (state.status === 'running') {
      if (!checkBudget(state)) {
        createEscalation(state, 'budget-exceeded',
          `Budget cap of $${state.budgetCapUsd} exceeded. Total cost: $${state.totalCostUsd.toFixed(2)}`);
        writeState(deviceId, state);
        sendNotification('Miyagi Pipeline', `Budget exceeded for ${state.deviceName}`);
        break;
      }

      writeState(deviceId, state);

      switch (state.currentPhase) {
        case 'pending':
          await doPending(state);
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
  advancePhase(state);
}

async function doPhase0(state: PipelineState) {
  startPhase(state, 'phase-0-gatekeeper');
  appendLog(deviceId, { level: 'info', agent: 'gatekeeper', message: 'Starting Phase 0: Gatekeeper' });

  const serverUp = await checkDevServer();
  if (!serverUp) {
    appendLog(deviceId, { level: 'info', message: 'Dev server not running, starting...' });
    const started = await startDevServer();
    if (!started) {
      createEscalation(state, 'agent-failure', 'Could not start dev server. Please start it manually with `npm run dev`.');
      return;
    }
  }

  try {
    execSync(`git checkout -b ${state.branch} test 2>/dev/null || git checkout ${state.branch}`, { stdio: 'pipe' });
  } catch {
    appendLog(deviceId, { level: 'warn', message: `Branch ${state.branch} may already exist, continuing...` });
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
    phase: 'phase-0-gatekeeper',
    agent: 'gatekeeper',
    model: 'claude-opus-4-6',
  });

  if (result.costEntry) {
    accumulateCost(state, result.costEntry);
    recordCostEntry(deviceId, result.costEntry);
  }

  const checkpoint = readAgentCheckpoint('gatekeeper');
  if (checkpoint.score !== null && checkpoint.score >= 9.5) {
    completePhase(state, 'phase-0-gatekeeper', checkpoint.score, true);
    const sections = parseSectionsFromGatekeeper();
    if (sections.length > 0) state.sections = sections;
    advancePhase(state);
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

      if (!checkBudget(state)) return;

      // SI
      appendLog(deviceId, { level: 'info', agent: 'structural-inspector', message: `SI: section ${section.id} (attempt ${section.attempts})` });
      const siResult = await invokeAgent({
        prompt: `Audit section "${section.id}" of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Read your checkpoint and the Gatekeeper's manifest first.`,
        deviceId, phase: 'phase-1-section-loop', agent: 'structural-inspector', sectionId: section.id,
      });
      if (siResult.costEntry) { accumulateCost(state, siResult.costEntry); recordCostEntry(deviceId, siResult.costEntry); }
      section.siScore = readAgentCheckpoint('structural-inspector').score;

      // PQ
      appendLog(deviceId, { level: 'info', agent: 'panel-questioner', message: `PQ: section ${section.id} (attempt ${section.attempts})` });
      const pqResult = await invokeAgent({
        prompt: `Audit section "${section.id}" of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Compare the rendered panel against the reference photo.`,
        deviceId, phase: 'phase-1-section-loop', agent: 'panel-questioner', sectionId: section.id,
      });
      if (pqResult.costEntry) { accumulateCost(state, pqResult.costEntry); recordCostEntry(deviceId, pqResult.costEntry); }
      section.pqScore = readAgentCheckpoint('panel-questioner').score;

      // Critic
      appendLog(deviceId, { level: 'info', agent: 'critic', message: `Critic: section ${section.id} (attempt ${section.attempts})` });
      const criticResult = await invokeAgent({
        prompt: `Final audit of section "${section.id}" of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Review SI and PQ findings, then render your verdict.`,
        deviceId, phase: 'phase-1-section-loop', agent: 'critic', sectionId: section.id,
      });
      if (criticResult.costEntry) { accumulateCost(state, criticResult.costEntry); recordCostEntry(deviceId, criticResult.costEntry); }
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
  advancePhase(state);
}

async function doPhase2(state: PipelineState) {
  startPhase(state, 'phase-2-global-assembly');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 2: Global Assembly' });

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    state.lastCheckpoint = { phase: 'phase-2-global-assembly', subStep: `attempt-${attempts}` };
    writeState(deviceId, state);
    if (!checkBudget(state)) return;

    const result = await invokeAgent({
      prompt: `Perform global assembly audit of the ${state.deviceName} digital twin. Device ID: ${deviceId}. All sections are vaulted. Check overall layout, cross-section alignment, and global consistency.`,
      deviceId, phase: 'phase-2-global-assembly', agent: 'structural-inspector',
    });
    if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }

    const checkpoint = readAgentCheckpoint('structural-inspector');
    if (checkpoint.score !== null && checkpoint.score >= 10) {
      completePhase(state, 'phase-2-global-assembly', checkpoint.score, true);
      advancePhase(state);
      return;
    }
  }

  completePhase(state, 'phase-2-global-assembly', null, false);
  createEscalation(state, 'agent-failure', 'Global assembly failed after 3 attempts');
}

async function doPhase3(state: PipelineState) {
  startPhase(state, 'phase-3-harmonic-polish');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 3: Harmonic Polish' });
  if (!checkBudget(state)) return;

  const result = await invokeAgent({
    prompt: `Perform final harmonic polish of the ${state.deviceName} digital twin. Device ID: ${deviceId}. Apply any final visual refinements.`,
    deviceId, phase: 'phase-3-harmonic-polish', agent: 'critic',
  });
  if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }

  const checkpoint = readAgentCheckpoint('critic');
  if (checkpoint.score !== null && checkpoint.score >= 9.5) {
    completePhase(state, 'phase-3-harmonic-polish', checkpoint.score, true);
    advancePhase(state);
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
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
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
  if (!checkBudget(state)) return;

  const result = await invokeAgent({
    prompt: `Extract tutorial curriculum from the ${state.deviceName} manuals at: ${state.manualPaths.join(', ')}. Device ID: ${deviceId}. Use chapter-by-chapter extraction.`,
    deviceId, phase: 'phase-4-extraction', agent: 'manual-extractor', model: 'claude-opus-4-6',
  });
  if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }

  const checkpoint = readAgentCheckpoint('manual-extractor');
  if (checkpoint.score !== null && checkpoint.score >= 9.0) {
    completePhase(state, 'phase-4-extraction', checkpoint.score, true);
    advancePhase(state);
  } else {
    completePhase(state, 'phase-4-extraction', checkpoint.score, false);
    createEscalation(state, 'agent-failure', `Manual extraction score ${checkpoint.score ?? 'unknown'} below threshold`);
  }
}

async function doPhase4Audit(state: PipelineState) {
  startPhase(state, 'phase-4-audit');
  appendLog(deviceId, { level: 'info', message: 'Starting Phase 4: Coverage Audit' });
  if (!checkBudget(state)) return;

  const result = await invokeAgent({
    prompt: `Audit tutorial coverage for ${state.deviceName}. Device ID: ${deviceId}. Verify the extraction covers all manual chapters. Produce a batch plan.`,
    deviceId, phase: 'phase-4-audit', agent: 'coverage-auditor',
  });
  if (result.costEntry) { accumulateCost(state, result.costEntry); recordCostEntry(deviceId, result.costEntry); }

  const checkpoint = readAgentCheckpoint('coverage-auditor');
  if (checkpoint.verdict === 'APPROVED') {
    completePhase(state, 'phase-4-audit', checkpoint.score, true);
    const batches = parseBatchesFromAuditor();
    if (batches.length > 0) state.tutorialBatches = batches;
    advancePhase(state);
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
    if (!checkBudget(state)) return;

    appendLog(deviceId, { level: 'info', agent: 'tutorial-builder', message: `Building batch ${batch.batchId}: ${batch.tutorials.join(', ')}` });
    const buildResult = await invokeAgent({
      prompt: `Build tutorial batch ${batch.batchId} for ${state.deviceName}. Device ID: ${deviceId}. Tutorials: ${batch.tutorials.join(', ')}`,
      deviceId, phase: 'phase-5-tutorial-build', agent: 'tutorial-builder', batchId: batch.batchId,
    });
    if (buildResult.costEntry) { accumulateCost(state, buildResult.costEntry); recordCostEntry(deviceId, buildResult.costEntry); }
    batch.builderScore = readAgentCheckpoint('tutorial-builder').score;

    batch.status = 'reviewing';
    state.lastCheckpoint = { phase: 'phase-5-tutorial-build', subStep: `batch-${batch.batchId}-reviewing` };
    writeState(deviceId, state);

    appendLog(deviceId, { level: 'info', agent: 'tutorial-reviewer', message: `Reviewing batch ${batch.batchId}` });
    const reviewResult = await invokeAgent({
      prompt: `Review tutorial batch ${batch.batchId} for ${state.deviceName}. Device ID: ${deviceId}. Verify accuracy against the manual.`,
      deviceId, phase: 'phase-5-tutorial-build', agent: 'tutorial-reviewer', batchId: batch.batchId,
    });
    if (reviewResult.costEntry) { accumulateCost(state, reviewResult.costEntry); recordCostEntry(deviceId, reviewResult.costEntry); }
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
  advancePhase(state);
}

async function doTutorialPR(state: PipelineState) {
  startPhase(state, 'tutorial-pr');
  appendLog(deviceId, { level: 'info', message: 'Creating tutorial PR...' });

  try {
    const prOutput = execSync(
      `gh pr create --base test --title "feat: ${state.deviceName} tutorials" --body "Automated tutorial build for ${state.deviceName} by Miyagi Pipeline"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const prUrl = prOutput.trim();
    appendLog(deviceId, { level: 'info', message: `Tutorial PR created: ${prUrl}` });
    completePhase(state, 'tutorial-pr', null, true);
    advancePhase(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    createEscalation(state, 'agent-failure', `Failed to create tutorial PR: ${message}`);
  }
}

// --- Helpers ---

function readAgentCheckpoint(agent: string) {
  try {
    const checkpointPath = path.join('.claude', 'agent-memory', agent, 'checkpoint.md');
    const content = fs.readFileSync(checkpointPath, 'utf-8');
    return parseCheckpoint(content);
  } catch {
    return { agent: null, deviceId: null, phase: null, status: null, score: null, verdict: null, sectionId: null, batchId: null, timestamp: null };
  }
}

function parseSectionsFromGatekeeper(): SectionStatus[] {
  try {
    const checkpointPath = path.join('.claude', 'agent-memory', 'gatekeeper', 'checkpoint.md');
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
            sections.push({ id, siScore: null, pqScore: null, criticScore: null, vaulted: false, attempts: 0, costUsd: 0, tokens: { input: 0, output: 0 } });
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
    const checkpointPath = path.join('.claude', 'agent-memory', 'coverage-auditor', 'checkpoint.md');
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

// --- Main ---
run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
