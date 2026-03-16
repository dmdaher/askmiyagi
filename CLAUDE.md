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

## Instrument Build Pipeline (MANDATORY FOR ALL NEW INSTRUMENTS)

### Pipeline Order — Design First, Tutorials After

```
── DESIGN PHASES (do these first) ──
1. Manual Extractor (Sieve protocol) → control IDs + feature inventory
2. Gatekeeper → Master Manifest (ASCII map + coarse grid + cardinal neighbors)
   - No ASCII map = PROJECT STALLED
3. Panel Design (ITERATIVE_ASSEMBLY_MODE):
   For each section (in gatekeeper's build order):
     a. Build section
     b. Render in isolation (?section=X)
     c. Structural Inspector — topology + cardinal neighbors FIRST
     d. Panel Questioner — independent photo map FIRST, then diff vs gatekeeper
     e. Critic — adversarial verification against manual
     f. ALL THREE must score 10/10 → VAULT
   Then: Global Assembly (10.0) → Harmonic Polish (≥9.5)
4. DESIGN REVIEW — user approves panel in browser
   ─── panel locked after approval ───

── TUTORIAL PHASES (only after panel approved) ──
5. Coverage Auditor → verify tutorial plan
6. Tutorial Builder → build tutorials in batches
7. Tutorial Reviewer → validate tutorials
```

### Pipeline Hard Rules

| Rule | Why |
|---|---|
| **Orchestrator is the root process** | No QA agent runs without orchestrator managing phase transitions. Standalone runs are "draft only" and cannot vault. |
| **Topology before styling** | Agents must produce Cardinal Neighbor Tables before scoring. Checking font-size/color/padding before topology = Priority Inversion = automatic score invalidation. |
| **Adversarial blindness** | PQ generates its own position map from photos/manual BEFORE reading the gatekeeper template. Reading gatekeeper first = automatic 0.0/10. |
| **Boundary containment** | Any label/icon that overflows its container = (-1.0). Physical hardware never has CSS overflow. |
| **Sieve extraction** | Manual extractor reads in 10-page buckets: Sieve → Verify → Anchor → Checkpoint. Separates perception from cognition. |
| **Scope isolation** | Curriculum agents (extractor, auditor, builder) produce no layout opinions. Panel agents (gatekeeper, SI, PQ) produce no curriculum opinions. |
| **Two sources of truth** | Gatekeeper uses manual text. PQ uses hardware photos. When they disagree, Critic resolves. |
