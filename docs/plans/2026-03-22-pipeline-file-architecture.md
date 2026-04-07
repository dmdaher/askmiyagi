# Pipeline File Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate file-not-found bugs by centralizing all pipeline file paths into a single `.pipeline/{deviceId}/` directory with predictable agent output locations.

**Architecture:** Create a `pipelinePaths(deviceId)` helper that returns every path the runner needs. Replace 150+ ad-hoc `path.join()` calls with helper calls. Update 14 SOUL prompts to use new output contract. Add `input/` directory for manuals/photos and `agents/` directory for all agent outputs.

**Tech Stack:** TypeScript, Node.js fs, path module

---

### Task 1: Create `pipelinePaths` helper module

**Files:**
- Create: `src/lib/pipeline/paths.ts`

**Step 1: Write the path helper**

```typescript
// src/lib/pipeline/paths.ts
import path from 'path';

/**
 * Centralized path construction for the pipeline.
 * Every file the runner reads or writes goes through here.
 *
 * Directory structure:
 * .pipeline/{deviceId}/
 * ├── state.json, runner.log, cost.json
 * ├── input/manuals/, input/photos/
 * ├── agents/{agent-name}/checkpoint.md + structured outputs
 * ├── manifest.json (promoted), templates.json
 * ├── manifest-editor.json (contractor), backups/
 */
export function pipelinePaths(deviceId: string, worktreeCwd?: string) {
  const root = path.join('.pipeline', deviceId);
  const wtRoot = worktreeCwd ? path.join(worktreeCwd, '.pipeline', deviceId) : root;

  return {
    // --- Root-level state ---
    root,
    state: path.join(root, 'state.json'),
    log: path.join(root, 'runner.log'),
    cost: path.join(root, 'cost.json'),

    // --- Inputs (read-only after preflight) ---
    inputDir: path.join(root, 'input'),
    manualsDir: path.join(root, 'input', 'manuals'),
    photosDir: path.join(root, 'input', 'photos'),
    wtManualsDir: path.join(wtRoot, 'input', 'manuals'),
    wtPhotosDir: path.join(wtRoot, 'input', 'photos'),

    // --- Agent outputs ---
    agentsDir: path.join(root, 'agents'),
    wtAgentsDir: path.join(wtRoot, 'agents'),

    agent(name: string) {
      return {
        dir: path.join(root, 'agents', name),
        wtDir: path.join(wtRoot, 'agents', name),
        checkpoint: path.join(root, 'agents', name, 'checkpoint.md'),
        wtCheckpoint: path.join(wtRoot, 'agents', name, 'checkpoint.md'),
      };
    },

    // Diagram Parser
    parserBlueprint: path.join(root, 'agents', 'diagram-parser', 'spatial-blueprint.json'),
    wtParserBlueprint: path.join(wtRoot, 'agents', 'diagram-parser', 'spatial-blueprint.json'),

    // Control Extractor
    controlInventory: path.join(root, 'agents', 'control-extractor', 'control-inventory.json'),
    wtControlInventory: path.join(wtRoot, 'agents', 'control-extractor', 'control-inventory.json'),

    // Gatekeeper
    gatekeeperManifest: path.join(root, 'agents', 'gatekeeper', 'manifest.json'),
    wtGatekeeperManifest: path.join(wtRoot, 'agents', 'gatekeeper', 'manifest.json'),

    // Manual Extractor sieve
    sieveDir: path.join(root, 'agents', 'manual-extractor', 'sieve'),
    wtSieveDir: path.join(wtRoot, 'agents', 'manual-extractor', 'sieve'),
    sieveBucket(n: number) { return path.join(root, 'agents', 'manual-extractor', 'sieve', `bucket-${String(n).padStart(3, '0')}.md`); },
    sieveVerified(n: number) { return path.join(root, 'agents', 'manual-extractor', 'sieve', `bucket-${String(n).padStart(3, '0')}-verified.md`); },
    sieveAnchored(n: number) { return path.join(root, 'agents', 'manual-extractor', 'sieve', `bucket-${String(n).padStart(3, '0')}-anchored.md`); },
    sievePass(n: number) { return path.join(root, 'agents', 'manual-extractor', 'sieve', `pass-${n}-${['', 'inventory', 'relationships', 'curriculum', 'batches'][n]}.md`); },

    // Audit sealing
    extractorSealed: path.join(wtRoot, 'agents', '.extractor-sealed'),
    wtExtractorDir: path.join(wtRoot, 'agents', 'manual-extractor'),

    // --- Promoted artifacts (root level) ---
    manifest: path.join(root, 'manifest.json'),
    wtManifest: path.join(wtRoot, 'manifest.json'),
    templates: path.join(root, 'templates.json'),
    wtTemplates: path.join(wtRoot, 'templates.json'),

    // --- Editor ---
    editorManifest: path.join(root, 'manifest-editor.json'),
    savedEditorManifest: path.join('.pipeline', 'saved', deviceId, 'manifest-editor.json'),
    backups: path.join(root, 'backups'),
  };
}

/** Relative path for use in agent prompts (relative to worktree cwd) */
export function agentPath(deviceId: string, agentName: string) {
  return `.pipeline/${deviceId}/agents/${agentName}`;
}

export function inputPath(deviceId: string) {
  return {
    manuals: `.pipeline/${deviceId}/input/manuals`,
    photos: `.pipeline/${deviceId}/input/photos`,
  };
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/lib/pipeline/paths.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/pipeline/paths.ts
git commit -m "feat: add centralized pipelinePaths helper for canonical file layout"
```

---

### Task 2: Update preflight — input/ directory + copy logic

**Files:**
- Modify: `scripts/pipeline-runner.ts` (preflight handler, ~lines 367-554)

**Step 1: Import pipelinePaths and update preflight**

At top of pipeline-runner.ts, add import:
```typescript
import { pipelinePaths, agentPath, inputPath } from '../src/lib/pipeline/paths';
```

Replace the manual/photo copy logic in preflight to:
1. Create `.pipeline/{deviceId}/input/manuals/` and `input/photos/` directories
2. Copy downloaded manuals into `input/manuals/` with clean names
3. Copy downloaded photos into `input/photos/`
4. Copy `input/` from main repo → worktree

**Step 2: Add post-phase copy-back helper**

Add a helper function `copyAgentOutput()`:
```typescript
function copyAgentOutput(agentName: string) {
  const p = pipelinePaths(deviceId, worktreeCwd);
  const src = p.agent(agentName).wtDir;
  const dest = p.agent(agentName).dir;
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      const srcFile = path.join(src, file);
      const stat = fs.statSync(srcFile);
      if (stat.isFile()) {
        fs.copyFileSync(srcFile, path.join(dest, file));
      } else if (stat.isDirectory()) {
        // Recursive copy for sieve/ subdirectory
        fs.mkdirSync(path.join(dest, file), { recursive: true });
        for (const subFile of fs.readdirSync(srcFile)) {
          fs.copyFileSync(path.join(srcFile, subFile), path.join(dest, file, subFile));
        }
      }
    }
    appendLog(deviceId, { level: 'info', agent: agentName, message: `Copied agent output to main repo (${dest})` });
  }
}
```

**Step 3: Add resume copy helper**

Add a helper `copyAgentsToWorktree()`:
```typescript
function copyAgentsToWorktree() {
  const p = pipelinePaths(deviceId, worktreeCwd);
  if (fs.existsSync(p.agentsDir)) {
    fs.cpSync(p.agentsDir, p.wtAgentsDir, { recursive: true });
    appendLog(deviceId, { level: 'info', agent: 'runner', message: 'Copied agent outputs from main repo to worktree for resume' });
  }
  // Also copy input/
  if (fs.existsSync(p.inputDir)) {
    fs.cpSync(p.inputDir, path.join(worktreeCwd, '.pipeline', deviceId, 'input'), { recursive: true });
  }
}
```

Call `copyAgentsToWorktree()` after worktree creation (line ~209) if resuming a pipeline (state has completed phases).

**Step 4: Update `readAgentCheckpoint()` and `getResumeContext()`**

Replace the old `.claude/agent-memory` paths:
```typescript
function getResumeContext(agent: string): string {
  try {
    const p = pipelinePaths(deviceId, worktreeCwd);
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
```

**Step 5: Commit**

```bash
git add scripts/pipeline-runner.ts
git commit -m "feat: update preflight to use input/ dir + add copy helpers"
```

---

### Task 3: Update diagram parser + control extractor phase paths

**Files:**
- Modify: `scripts/pipeline-runner.ts` (~lines 556-820)

**Step 1: Update diagram parser handler**

Replace every `.claude/agent-memory/diagram-parser/` reference with `pipelinePaths()` calls:
- `existingBlueprint` path (line 560)
- `checkpointPath` (line 564)
- `blueprintPathAgentMem` / `blueprintPathPipeline` (lines 675-677) — now just one path
- Prompt text: tell agent to write to `.pipeline/{deviceId}/agents/diagram-parser/`
- After validation: call `copyAgentOutput('diagram-parser')`

**Step 2: Update control extractor handler**

Replace `.claude/agent-memory/control-extractor/` paths:
- `inventoryPath` (line 744)
- Prompt text (lines 775-776)
- After validation: call `copyAgentOutput('control-extractor')`

**Step 3: Commit**

```bash
git commit -m "feat: update diagram-parser + control-extractor to new paths"
```

---

### Task 4: Update gatekeeper + layout engine phase paths

**Files:**
- Modify: `scripts/pipeline-runner.ts` (~lines 822-1162)

**Step 1: Update gatekeeper handler**

- Prompt text: tell agent to write manifest to `.pipeline/{deviceId}/agents/gatekeeper/manifest.json` and checkpoint to `.pipeline/{deviceId}/agents/gatekeeper/checkpoint.md`
- Remove instruction to write to `.pipeline/{deviceId}/manifest.json` root (runner promotes after validation)
- Update `worktreeManifest`/`mainManifest` paths (lines 905-906) — now check `agents/gatekeeper/manifest.json`
- Update `blueprintPath` (line 924)
- After validation + promotion: `copyAgentOutput('gatekeeper')`, then promote manifest to root
- Promotion: `fs.copyFileSync(p.gatekeeperManifest, p.manifest)`

**Step 2: Update layout engine handler**

- Manifest read path (line 1036): use `p.manifest` (promoted root)
- Templates write path: `p.templates`
- Remove worktree fallback paths (lines 1040-1042)
- No agent copy needed (layout engine is a script, not an agent)

**Step 3: Commit**

```bash
git commit -m "feat: update gatekeeper + layout-engine to new paths"
```

---

### Task 5: Update QA phase paths (SI, PQ, Critic, Phases 1-3)

**Files:**
- Modify: `scripts/pipeline-runner.ts` (~lines 1164-1298)

**Step 1: Update section loop (Phase 1)**

- SI prompt: read from `.pipeline/{deviceId}/agents/gatekeeper/checkpoint.md`, write to `.pipeline/{deviceId}/agents/structural-inspector/`
- PQ prompt: same pattern
- Critic prompt: read SI + PQ from `.pipeline/{deviceId}/agents/`, write to `.pipeline/{deviceId}/agents/critic/`
- After each agent: `copyAgentOutput(agentName)`

**Step 2: Update Phase 2 + 3 prompts**

Same pattern — update all checkpoint path references.

**Step 3: Commit**

```bash
git commit -m "feat: update QA phases (SI/PQ/Critic) to new paths"
```

---

### Task 6: Update manual extractor + coverage auditor paths (Phase 4)

**Files:**
- Modify: `scripts/pipeline-runner.ts` (~lines 1343-1905)

**Step 1: Update sieve bucket paths**

Replace `sieveDir` (line 1348):
```typescript
const p = pipelinePaths(deviceId, worktreeCwd);
const sieveDir = p.wtSieveDir;
fs.mkdirSync(sieveDir, { recursive: true });
```

Update ALL bucket/verified/anchored file paths in prompts:
- `Write output to: .pipeline/{deviceId}/agents/manual-extractor/sieve/bucket-{i}.md`
- `Read: .pipeline/{deviceId}/agents/manual-extractor/sieve/bucket-{i}.md`
- Same for verified, anchored files

**Step 2: Update pass prompts**

- Pass 1-4: all read/write paths become `.pipeline/{deviceId}/agents/manual-extractor/sieve/pass-{n}-*.md`
- Final checkpoint: `.pipeline/{deviceId}/agents/manual-extractor/checkpoint.md`

**Step 3: Update audit sealing**

Replace `extractorMemDir` (line 1702):
```typescript
const p = pipelinePaths(deviceId, worktreeCwd);
const extractorDir = p.wtExtractorDir;
const sealedDir = p.extractorSealed;
fs.renameSync(extractorDir, sealedDir);
// ... after audit ...
fs.renameSync(sealedDir, extractorDir);
```

**Step 4: Update auditor prompts**

- Independent checklist: `.pipeline/{deviceId}/agents/coverage-auditor/independent-checklist.md`
- Comparative audit: `.pipeline/{deviceId}/agents/coverage-auditor/comparative-audit.md`
- DO NOT read: `.pipeline/{deviceId}/agents/manual-extractor/` (sealed)

**Step 5: After each agent: `copyAgentOutput()`**

**Step 6: Commit**

```bash
git commit -m "feat: update manual-extractor + coverage-auditor to new paths"
```

---

### Task 7: Update tutorial builder/reviewer + PR phases

**Files:**
- Modify: `scripts/pipeline-runner.ts` (~lines 1907-1982)

**Step 1: Update tutorial builder prompt paths**
**Step 2: Update tutorial reviewer prompt paths**
**Step 3: After each: `copyAgentOutput()`**

**Step 4: Commit**

```bash
git commit -m "feat: update tutorial phases to new paths"
```

---

### Task 8: Update helper functions (parseSectionsFromGatekeeper, parseBatchesFromAuditor)

**Files:**
- Modify: `scripts/pipeline-runner.ts` (~lines 1988-2050)

**Step 1: Update `parseSectionsFromGatekeeper()`**

Replace manifest path lookups (lines 1999-2000) with `pipelinePaths()`:
```typescript
const p = pipelinePaths(deviceId, worktreeCwd);
const manifestPath = fs.existsSync(p.manifest) ? p.manifest
  : fs.existsSync(p.wtManifest) ? p.wtManifest
  : null;
```

**Step 2: Update `parseBatchesFromAuditor()`**

Replace checkpoint path (line 2037):
```typescript
const p = pipelinePaths(deviceId, worktreeCwd);
const checkpointPath = p.agent('coverage-auditor').wtCheckpoint;
```

**Step 3: Commit**

```bash
git commit -m "feat: update helper functions to new paths"
```

---

### Task 9: Update all SOUL prompts

**Files:**
- Modify: `.claude/agents/diagram-parser.md`
- Modify: `.claude/agents/control-extractor.md`
- Modify: `.claude/agents/gatekeeper.md`
- Modify: `.claude/agents/orchestrator.md`
- Modify: `.claude/agents/structural-inspector.md`
- Modify: `.claude/agents/panel-questioner.md`
- Modify: `.claude/agents/critic.md`
- Modify: `.claude/agents/manual-extractor.md`
- Modify: `.claude/agents/coverage-auditor.md`
- Modify: `.claude/agents/tutorial-builder.md`
- Modify: `.claude/agents/tutorial-reviewer.md`
- Modify: `.claude/agents/visual-extractor.md`
- Modify: `.claude/agents/main-agent.md`

**Step 1: For each SOUL, replace every `.claude/agent-memory/{agent}/` with `.pipeline/{deviceId}/agents/{agent}/`**

Note: SOUL prompts use `{deviceId}` as a placeholder — the runner injects the actual deviceId into the prompt string. SOULs should use the literal string `.pipeline/<deviceId>/agents/<agent-name>/` and the runner's template substitution handles the rest.

Key replacements per agent:
- `Reads from: .claude/agent-memory/X/checkpoint.md` → `Reads from: .pipeline/<deviceId>/agents/X/checkpoint.md`
- `Writes to: .claude/agent-memory/X/checkpoint.md` → `Writes to: .pipeline/<deviceId>/agents/X/checkpoint.md`
- All resume checkpoint paths
- All cross-agent read paths (e.g., critic reads SI + PQ)

Also add the Output Contract block to each SOUL:
```
## OUTPUT CONTRACT (MANDATORY)
Write ALL output to: .pipeline/<deviceId>/agents/<your-agent-name>/
Read manuals from: .pipeline/<deviceId>/input/manuals/
Read photos from: .pipeline/<deviceId>/input/photos/
DO NOT write to .claude/agent-memory/ or any other location.
```

**Step 2: Commit**

```bash
git add .claude/agents/*.md
git commit -m "feat: update all SOUL prompts to canonical pipeline paths"
```

---

### Task 10: Update checkpoint validators

**Files:**
- Modify: `src/lib/pipeline/checkpoint-validators.ts`

**Step 1: Update any hardcoded path references**

The validators mostly work on file content (strings), not paths. But check:
- `preInspectDiagramParser()` — may reference photo/manual paths
- `preInspectGatekeeper()` — may check parser checkpoint existence
- Error messages mentioning `.claude/agent-memory`

**Step 2: Commit**

```bash
git commit -m "fix: update validator error messages to new paths"
```

---

### Task 11: Clean up dead code + update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` — update Pipeline State section to document new paths
- Modify: `src/app/api/pipeline/[deviceId]/manifest/route.ts` — already done (worktree fallback removed)
- Delete: `.claude/agent-memory/` empty dirs (pipeline agents no longer use this)

**Step 1: Update CLAUDE.md Pipeline State section**

```markdown
### Pipeline State
- State: `.pipeline/<device-id>/state.json`
- Logs: `.pipeline/<device-id>/runner.log`
- Cost: `.pipeline/<device-id>/cost.json`
- Inputs: `.pipeline/<device-id>/input/manuals/` and `input/photos/`
- Agent outputs: `.pipeline/<device-id>/agents/<agent-name>/`
- Manifest: `.pipeline/<device-id>/manifest.json` (promoted from gatekeeper)
- Templates: `.pipeline/<device-id>/templates.json` (layout engine output)
- Editor: `.pipeline/<device-id>/manifest-editor.json` (contractor's work)
- Saved edits: `.pipeline/saved/<device-id>/` (survives pipeline resets)
- Worktree: `.worktrees/<device-id>/` (isolated git checkout)
```

**Step 2: Clean up empty agent-memory dirs**

```bash
rm -rf .claude/agent-memory/diagram-parser .claude/agent-memory/orchestrator .claude/agent-memory/visual-extractor
```

**Step 3: Commit**

```bash
git commit -m "docs: update CLAUDE.md with new pipeline file architecture"
```

---

### Task 12: Smoke test — dry run verification

**Step 1: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 2: Verify path helper works**

```bash
npx tsx -e "
const { pipelinePaths } = require('./src/lib/pipeline/paths');
const p = pipelinePaths('cdj-3000', '/tmp/worktree');
console.log('manifest:', p.manifest);
console.log('parser blueprint:', p.parserBlueprint);
console.log('sieve bucket 1:', p.sieveBucket(1));
console.log('agent checkpoint:', p.agent('gatekeeper').checkpoint);
"
```

Expected output:
```
manifest: .pipeline/cdj-3000/manifest.json
parser blueprint: .pipeline/cdj-3000/agents/diagram-parser/spatial-blueprint.json
sieve bucket 1: .pipeline/cdj-3000/agents/manual-extractor/sieve/bucket-001.md
agent checkpoint: .pipeline/cdj-3000/agents/gatekeeper/checkpoint.md
```

**Step 3: Verify saved CDJ-3000 files still intact**

```bash
ls -la .pipeline/saved/cdj-3000/
```

Expected: manifest-editor.json, manifest.json, templates.json present

**Step 4: Commit final**

```bash
git commit -m "chore: verify pipeline file architecture migration complete"
```
