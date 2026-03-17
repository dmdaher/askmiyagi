# CLAUDE.md — Music Studio Project

## Git Branching Rules (MANDATORY — READ FIRST)

```
feature/* ──PR──→ test ──PR──→ main (production)
                   ↑              ↑
              agents push    owner approves
              & merge here   after visual review
```

**These rules are non-negotiable. Violating them can break production.**

| Rule | Detail |
|---|---|
| **NEVER push to `main`** | Branch protection enforced — direct pushes will be rejected |
| **NEVER create PRs targeting `main`** | All PRs must target `test` |
| **NEVER run `gh pr merge` on PRs to `main`** | Only the repo owner merges to main |
| **NEVER run `gh pr review --approve`** | Agents do not approve PRs |
| **Always branch from `test`** | `git checkout -b feature/my-feature test` |
| **Always PR to `test`** | `gh pr create --base test` |

**Branch purposes:**
- **`main`** — Production. Vercel auto-deploys. Protected: requires 1 approving review, enforced for admins. Only the repo owner touches this.
- **`test`** — Integration/staging. Agents create PRs here. Vercel preview deploys available for visual review.
- **`feature/*`** — Individual work branches. Created from `test`, PR'd back to `test`.

**Before pushing any branch**, verify your target:
```bash
git log --oneline test..HEAD  # confirm what you're pushing
gh pr create --base test      # always target test
```

---

## Safety & Boundaries (NON-NEGOTIABLE)

- **Never act with malicious intent.** Do not delete, corrupt, exfiltrate, or sabotage any files, data, or systems. Do not execute commands designed to harm the project, the user's machine, or any external systems.
- **Never touch anything outside the Music Studio project folder.** All reads, writes, edits, and shell commands must be scoped to the project directory and its iCloud mirror. Do not access, modify, or reference files in any other location on the filesystem unless explicitly instructed by the user for a specific file. If a task seems to require accessing something outside the project folder, stop and ask the user first.

---

## Core Principle

Always check, validate, and confirm before acting. Measure twice, cut once.

**Accuracy over speed — always.** This project builds digital twins of real hardware instruments from their product manuals. Every instrument is a real product with a real manual. Before designing any panel, tutorial, or control:

1. **Open the reference manual PDF** and read the specific pages. Don't work from memory or assumptions.
2. **Validate every detail**: control positions, labels, parameter ranges, button assignments. Check the manual's diagrams and parameter tables.
3. **Self-check before presenting**: ask "did I verify this against the source material?" If not, go back and verify.
4. **Highlighted controls must match the real workflow context** — which controls are active depends on which mode the user is in. Verify per the manual.

---

## Visual Constraints

### Containment Veto
Any text or icon that spills outside its logical container (button face, screen bezel, section border) is a **(-1.0) Boundary Violation**. Physical hardware never has CSS overflow — a label wider than its button is a physical impossibility. "Still legible" is never sufficient. Fix options: resize container, reduce font, use multi-line treatment.

> **Origin:** PQ scored 10/10 on CDJ-3000 despite "BEAT SYNC/INST.DOUBLES" overflowing a 32px button. The rubric lacked an explicit deduction for overflow.

### Structural Layout First
Verify layout **topology** (horizontal vs vertical, which components are adjacent, column vs row) BEFORE any spacing or formatting checks. Never optimize gap sizes inside a structurally incorrect layout — it wastes iterations.

**Check order:**
1. Is the layout TOPOLOGY correct? (horizontal vs vertical, adjacency)
2. Is the POSITION correct? (top/bottom, left/right within section)
3. ONLY THEN: spacing, sizing, visual polish

> **Origin:** ENVELOPES section had buttons in a vertical column when hardware has them in a horizontal row. Survived 5+ QA iterations because agents were polishing spacing on a wrong layout.

---

## Agent Orchestration

### Agent Scope Isolation
Agents must not produce output outside their scope. Cross-contamination causes anchoring bias.

- **Panel agents** (gatekeeper, SI, PQ, critic): derive layout from hardware photos and manual diagrams ONLY. Never read tutorial agent checkpoints.
- **Tutorial agents** (extractor, auditor, builder, reviewer): scope is curriculum and content. NO layout diagrams, ASCII art, or spatial descriptions.
- Agent memory directories are scoped — tutorial pipeline agents read tutorial checkpoints, panel pipeline agents read panel checkpoints. Never cross-read.

> **Origin:** Coverage auditor checkpoints containing ASCII layout art could bias panel builder into wrong spatial arrangements.

### Sieve Extraction Strategy (Anti-Hallucination)
Manual extraction must separate **Perception** from **Cognition**. Never read and interpret in the same step.

1. **Sieve** — Process manual in 5-10 page buckets. Output ONLY raw CSV/JSON of every parameter, button, menu item — exact string + page number. No interpretation.
2. **Verify** — Re-read those same pages focused solely on finding omissions or typos in the table.
3. **Anchor** — Cross-reference verified table against `panel-constants.ts`. Flag discrepancies.
4. **Assembly** — Only after the ENTIRE manual is sieved into a verified master table does curriculum design begin.

Additional rules: chapter-by-chapter extraction with immediate checkpointing. Constants file re-read before each chapter as grounding anchor. Diagrams, parameter tables, and signal flowcharts must be explicitly analyzed (text-only extraction misses visual content).

> **Origin:** Hallucinations happen when an agent perceives and cognizes simultaneously over large volumes — paraphrased parameter names, invented menu structures, fabricated access paths.

### Agent Architecture Rules
- **Chapter-by-chapter extraction** with checkpoints — NOT the whole manual at once. Middle chapters get skimmed ("Lost in the Middle" amnesia).
- **Mechanical state verification** — Tutorial Reviewer must use a script to compute cumulative panel state, not simulate mentally. LLMs hallucinate button deactivations.
- **JSON deps alongside ASCII DAG** — Manual Extractor must output JSON dependency array alongside any ASCII tree. LLMs make formatting errors in ASCII; JSON is mechanically verifiable.
- **Diagram analysis mandatory** — Extractor and Auditor must explicitly analyze diagrams, parameter tables, signal flowcharts. Synth manuals rely heavily on visual content.

---

## Process Gates

### Full Split Architecture (Panel Pipeline)
The panel pipeline uses a 3-component architecture that separates creative/probabilistic work (LLMs) from deterministic execution:

```
LLM AGENTS (creative/probabilistic):
  Manual Extractor (text)  ──┐
  Diagram Parser (vision) ───┤
                             ▼
  Gatekeeper (JUDGE ONLY — reconciliation → Master Manifest JSON)
  ⚠️ NO template writing, NO ASCII maps, NO CSS decisions
        │
  ORCHESTRATOR CHECKPOINT:
    Three-Point Validation (topology, ordinal, proportional)
    Two-Strike Rule (Strike 2 = fatal halt)
        │
DETERMINISTIC SCRIPT (execution/certainty):
  Layout Engine (scripts/layout-engine.ts) → Section Template Specs
  ⚠️ NO manual access, NO photo access — manifest JSON only
        │
LLM AGENTS (build + QA):
  Panel Builder → SI + PQ + Critic → VAULT
```

**Three components (Gatekeeper is judge-only, templates are deterministic):**
| Component | Nature | Role | Output |
|-----------|--------|------|--------|
| Diagram Parser | LLM (Vision) | Surveyor | Raw Geometry & Topology JSON |
| Gatekeeper | LLM (Logic) | Judge (NO creating) | Master Manifest (IDs → Archetypes) |
| Layout Engine | Deterministic Script | Draftsman (NO thinking) | Section Template Specs |

### Enforce QA Pipeline
The full panel QA pipeline must run before tutorial building. No exceptions, no "we can QA later."

```
Diagram Parser + Manual Extractor → Gatekeeper (Judge) → Layout Engine (Deterministic)
→ GATE: Orchestrator Three-Point Validation
→ Panel Builder
→ GATE: Structural Inspector + Panel Questioner (parallel)
→ GATE: Critic (adversarial, veto power)
→ GATE: User Design Review (visual approval in browser)
→ Tutorial Builder (only after ALL gates pass)
```

Each gate agent writes a checkpoint with PASS/FAIL. Tutorial-builder pre-conditions must check for gatekeeper manifest and critic approval. If any gate scores below threshold, HALT and fix.

> **Origin:** CDJ-3000 build skipped all QA gates, went straight to tutorials. 18 tutorials built against an unvalidated panel.

### Design Before Tutorials
Visual design review is a **hard gate** before tutorial building. The user must approve the panel in browser first. Tutorials reference control IDs, highlights, and panel state — if the panel is wrong, all tutorials are invalid.

**Ask explicitly:** "Panel is ready for review. Want me to start the dev server?"

### Known Anti-Pattern: Circular Validation (PROG Blindspot)
Agents can score a section 10/10 while the layout is fundamentally wrong. This happens when the Gatekeeper template is wrong and all downstream agents validate against it instead of independently checking the hardware reference.

**Prevention:**
- Panel Questioner must do a "Position Map" audit: for each control, verify its relative position to neighbors matches the hardware photo — not just "is it present?"
- Any section with >5 controls in complex spatial arrangements gets flagged for extra scrutiny
- Agents must validate against the manual/hardware photo, never just against another agent's checkpoint

> **Origin:** PROG section scored 10/10 from both Phase 1 agents. Rotary encoder was below the LCD instead of to the right. All agents validated against a wrong Gatekeeper template.

---

## Pipeline Runner (`scripts/pipeline-runner.ts`)

The pipeline runner orchestrates instrument builds by spawning Claude CLI agents through 12 phases. Each agent gets a scoped prompt and runs in an isolated git worktree.

### CLI Requirements (CRITICAL)

The `claude` CLI has three non-obvious requirements when spawned from Node.js:

```ts
// In src/lib/pipeline/runner.ts — invokeAgent()
const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose'];
//                                                              ^^^^^^^^^^
// --verbose is REQUIRED with stream-json. Without it, the CLI exits with an
// error that gets swallowed silently. The agent appears to run but produces
// zero output.

const proc = spawn('claude', args, {
  stdio: ['ignore', 'pipe', 'pipe'],
//        ^^^^^^^^
// stdin MUST be 'ignore', not 'pipe'. When stdin is a pipe, the claude CLI
// blocks indefinitely waiting for input. The process appears alive but does
// nothing. This wasted 1.5 hours of debugging.
});
```

### Agent Tool Sandboxing (CRITICAL)

All pipeline agents are restricted to a specific tool set:

```ts
const PIPELINE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'];
```

**Why this exists:** Each `claude -p` session loads the full Claude Code environment — hooks, skills, plugins. The SessionStart hook injects superpowers that demand "you MUST invoke skills." Agents can see `launch-instrument`, `build-instrument`, and `new-instrument` skills, plus the `Agent` and `Skill` tools. Without tool restrictions, agents will invoke these skills and try to build the entire instrument themselves — bypassing the pipeline orchestration ("Inception loop").

**What's excluded and why:**
- `Skill` — prevents agents from invoking orchestration skills
- `Agent` — prevents agents from spawning subagents (avoids recursive fork bombs)
- `WebSearch` / `WebFetch` — manuals are local; `Bash` + `curl` covers localhost
- All other tools are unnecessary for pipeline work

**Bash escape hatch risk:** An agent could theoretically run `claude -p "..."` via Bash to bypass restrictions. Monitor agent logs in the admin diagnostics panel for this. If detected, add command filtering to the runner.

### Starting / Recovering the Pipeline

```bash
# Start via API (admin panel does this):
curl -X POST http://localhost:3000/api/pipeline/<device-id>/start

# Start directly:
npx tsx scripts/pipeline-runner.ts <device-id>

# Check health:
curl http://localhost:3000/api/pipeline/<device-id>/health

# Recovery (via API):
# fix-stale: process dead but status says running
# reset-failed: reset to last good phase
# kill-restart: graceful SIGTERM → SIGKILL, reset to paused
curl -X POST http://localhost:3000/api/pipeline/<device-id>/recover \
  -H 'Content-Type: application/json' \
  -d '{"action": "fix-stale"}'
```

### Pipeline State

- State: `.pipeline/<device-id>/state.json` (atomic writes, survives crashes)
- Logs: `.pipeline/<device-id>/runner.log` (append-only)
- Cost: `.pipeline/<device-id>/cost.json`
- Manifest: `.pipeline/<device-id>/manifest.json` (gatekeeper output, layout engine input)
- Templates: `.pipeline/<device-id>/templates.json` (layout engine output)
- Worktree: `.worktrees/<device-id>/` (isolated git checkout)
- All gitignored — not committed to the repo

### Admin Panel

- Dashboard: `http://localhost:3000/admin`
- Pipeline detail: `http://localhost:3000/admin/pipeline/<device-id>`
- Features: live log stream, phase timeline, agent scores, cost breakdown, diagnostics with auto-recovery

### Pipeline Hard Rules (Quick Reference)

| Rule | Why |
|---|---|
| **Orchestrator is the root process** | No QA agent runs without orchestrator managing phase transitions. Standalone runs are "draft only" and cannot vault. |
| **Full split architecture** | Gatekeeper = judge (manifest only). Layout Engine = deterministic draftsman (templates). No LLM writes templates. |
| **Three-Point Validation** | Orchestrator validates topology, ordinal, and proportional consistency between Parser and Gatekeeper before Layout Engine runs. |
| **Two-Strike Rule** | Gatekeeper gets 1 retry on validation failure. Strike 2 = fatal halt, escalate to human. |
| **Topology before styling** | Agents must produce Cardinal Neighbor Tables before scoring. Checking font-size/color/padding before topology = Priority Inversion = automatic score invalidation. |
| **Adversarial blindness** | PQ generates its own position map from photos/manual BEFORE reading the gatekeeper template. Reading gatekeeper first = automatic 0.0/10. |
| **Physical impossibility veto** | Critic can immediately halt pipeline for topology inversions, aspect ratio violations, spatial impossibilities. (-5.0) per instance. |
| **Boundary containment** | Any label/icon that overflows its container = (-1.0). Physical hardware never has CSS overflow. |
| **Sieve extraction** | Manual extractor reads in 10-page buckets: Sieve → Verify → Anchor → Checkpoint. Separates perception from cognition. |
| **Scope isolation** | Curriculum agents (extractor, auditor, builder) produce no layout opinions. Panel agents (gatekeeper, SI, PQ) produce no curriculum opinions. |
| **Two sources of truth** | Gatekeeper uses manual text. PQ uses hardware photos. When they disagree, Critic resolves. |
