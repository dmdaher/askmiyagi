# TUTORIAL-BATCH — Full Batch Workflow

Execute a batch of 3-5 tutorials from plan to merge, with all quality gates, TDD, code review, and verification.

**Trigger:** Adding a group of related tutorials to an existing instrument.

**Proven across:** 9 batches (A-I), 59 tutorials, zero regressions.

---

## Prerequisites

- [ ] Phases 0-5 of the new instrument pipeline are COMPLETE (panel, screens, control IDs exist)
- [ ] Read `memory/tutorial-batch-playbook.md`
- [ ] Read `docs/quality-gates.md`
- [ ] Read `tasks/lessons.md` (19 correction patterns)
- [ ] Gap analysis available: `docs/plans/2026-02-28-gap-analysis.md`

If prerequisites aren't met, run `/onboard` first (Path B).

---

## Phase 1: Planning

### Step 1.1: Identify Tutorials
- Check gap analysis for uncovered manual sections
- Group 3-5 tutorials by manual chapter or theme
- Invoke `superpowers-extended-cc:brainstorming` to explore which tutorials to group

### Step 1.2: Write Batch Plan
Invoke `superpowers-extended-cc:writing-plans` and create a plan file in `docs/plans/`:

**Required plan format:**
```markdown
# Batch [X]: [Theme] — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

## Context
- Current tutorial count: [N]
- This batch adds: [N] tutorials
- New total: [N]
- Manual chapters covered: [list]

## Reference Files
| File | Purpose |
|------|---------|
| [Manual PDF path] | Pages to read |
| `split-keyboard-zones.ts` | Canonical tutorial example |
| `src/data/panelLayouts/fantom-08.ts` | Control ID reference |
| `src/data/tutorials/fantom-08/index.ts` | Registration file |
| `src/__tests__/tutorials/fantom08Tutorials.test.ts` | Test file |

## Critical Constraints
1. `menuItems` MUST use `{ label: string }` objects — NOT plain strings
2. Panel state is CUMULATIVE — activate when used, deactivate when leaving
3. Every step needs UNIQUE `displayState`
4. No hardcoded hex colors — use constants
5. Control IDs must exist in `allFantom08ControlIds`
6. Zone LED: Red=INT, Green=EXT
7. `displayState.screenType` must be registered ScreenType
8. Tutorial `id` must match filename
9. Realistic instruction text ("Press the MENU button", not abstractions)
10. `panelStateChanges` keys must be valid control IDs

## Available Control IDs
[Copy relevant IDs from allFantom08ControlIds]

## Task N: `tutorial-name` — Title
**Manual pages:** p.XX-YY
**Steps (~N):**
1. Step title — screen type, key controls
2. ...
**Registration:** import + array + named export + test counts
**TDD:** Update test → verify fail → create → register → verify pass
```

### Batch Sizing
| Size | Verdict |
|------|---------|
| 1-2 | Too small — overhead not worth it |
| **3-5** | **Optimal** — completes in one session |
| 6-8 | Risky — may not finish |
| 9+ | Too large — split into multiple batches |

---

## Phase 2: Setup

1. Invoke `superpowers-extended-cc:using-git-worktrees` — create isolated workspace
2. Invoke `superpowers-extended-cc:executing-plans` with the plan file path

---

## Phase 3: Execution (Per Tutorial)

For EACH tutorial in the batch:

### Step 3.1: PRE-BUILD Gate

Run `/pre-build` and answer ALL questions with evidence. Key items:
- Read the specific manual pages listed in the plan
- Describe what the manual screenshot shows
- List the exact access path (button sequence)
- List E1-E6 knob assignments for each screen shown
- Cross-reference screen catalog AND manual
- Verify all tone names against Sound List PDF
- YOU must read the manual pages (not agents)

### Step 3.2: CROSS-REFERENCE Gate

Run `/cross-ref` for all UI-visible data:
- Tone names verified
- Parameter ranges verified
- Control IDs verified against `allFantom08ControlIds`
- E-knob assignments correct for each screen
- Highlighted controls contextually correct
- LED states accurate (only LED buttons get `ledOn`)

### Step 3.3: TDD Cycle

Run `/tdd-tutorial` for the actual implementation:

1. **Update test file** (`src/__tests__/tutorials/fantom08Tutorials.test.ts`):
   - Add to `expectedStepCounts`: `'tutorial-id': N`
   - Update total tutorial count
   - Add description string

2. **Verify test FAILS**: `npm run test` — new test should fail (tutorial doesn't exist)

3. **Create tutorial file** (`src/data/tutorials/fantom-08/tutorial-name.ts`):
   - Follow `split-keyboard-zones.ts` as canonical example
   - Each step: `id`, `title`, `instruction`, `details`, `highlightedControls`, `panelStateChanges`, `displayState`
   - Optional: `zones`, `tips`

4. **Register in index.ts** (`src/data/tutorials/fantom-08/index.ts`):
   - Add import line
   - Add to `fantom08Tutorials` array
   - Add named export

5. **Verify test PASSES + build**: `npm run test` + `npm run build`

6. **Commit**: One commit per tutorial

### Step 3.4: Repeat for Each Tutorial

---

## Phase 4: Review

1. Invoke `superpowers-extended-cc:requesting-code-review` — dispatch `code-reviewer` agent
2. The reviewer performs TWO-STAGE review:
   - Stage 1: Spec compliance (does tutorial match the manual?)
   - Stage 2: Code quality (cumulative state, unique displayState, etc.)
3. Invoke `superpowers-extended-cc:receiving-code-review` — process feedback with technical rigor

**Forbidden reviewer responses:**
- "You're absolutely right!" — performative, not analytical
- "Great catch!" — same
- Instead: evaluate each finding technically, push back on YAGNI violations

**Common review findings (top 5):**
1. Orphaned active controls — step N activates but step N+1 doesn't deactivate
2. Identical displayState across steps — same screenType + same menuItems
3. Missing zone data — step describes zones but doesn't include zones array
4. Inconsistent difficulty progression — beginner tutorial suddenly needs advanced knowledge
5. Unreferenced control IDs in highlights

4. Fix all Critical/Important findings
5. Run `npm run build` — zero errors

---

## Phase 5: Completion

1. Run `/gap-analysis` — update coverage doc
2. Run `/self-improve` — reflect on the batch
3. Run `/verify` — provide fresh evidence for ALL claims
4. Invoke `superpowers-extended-cc:finishing-a-development-branch` — merge/PR/cleanup
5. Update `memory/MEMORY.md` with new counts

---

## PDF Reading Rules

**CRITICAL: Never delegate manual PDF reading to agents.**

Agents CAN:
- Search codebase for existing patterns
- Check control IDs in `allFantom08ControlIds`
- Explore existing tutorials for similar structures
- Run tests and builds

Agents MUST NOT:
- Read manual PDFs and summarize them
- Describe what a hardware screen looks like
- Determine E-knob assignments or parameter ranges
- Make decisions about what controls to highlight

**Reference PDFs (iCloud mirror):**
```
/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/
```
- Reference Manual: `Roland Fantom-0 Series Reference Manual.pdf` (185 pp.)
- Parameter Guide: `FANTOM-06_07_08_Parameter_eng01_W.pdf` (102 pp.)
- Sound List: `FANTOM-06_07_08_SoundList_multi01_W.pdf`

**Research sequence per tutorial:**
1. Open Reference Manual to specific pages
2. Read screen layout, access path, E-knob table
3. Open Parameter Guide if tutorial involves parameter editing
4. Open Sound List if tutorial references specific tone names
5. Cross-reference with existing tutorials for consistent naming
6. THEN start the TDD cycle

---

## Skip spec-kit for Tutorial Batches

The TypeScript `Tutorial` type IS the spec. The reference manual IS the requirements. spec-kit adds overhead with zero benefit for tutorials.

Use spec-kit ONLY for new features with unclear requirements — when you need to discover WHAT to build before deciding HOW.
