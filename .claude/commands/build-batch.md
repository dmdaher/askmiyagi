# BUILD-BATCH — Complete Tutorial Batch Lifecycle

Full end-to-end workflow for a tutorial batch: planning → setup → per-tutorial TDD with all gates → review → gap analysis → verification → merge.

**Trigger:** Adding 3-5 related tutorials to an existing instrument.

**Combines:** `/pre-build` (×N) → `/tutorial-batch` → `/post-build` → `/gap-analysis` → `/verify` → `/self-improve`

**Proven across:** 9 batches (A-I), 59 tutorials, zero regressions.

---

## Phase 1: Planning

### 1a: Identify Tutorials
- Check gap analysis: `docs/plans/2026-02-28-gap-analysis.md`
- Invoke `superpowers-extended-cc:brainstorming` to explore which tutorials to group
- Group 3-5 tutorials by manual chapter or theme

**Batch sizing:**
| Size | Verdict |
|------|---------|
| 1-2 | Too small — use `/build-tutorial` instead |
| **3-5** | **Optimal** |
| 6-8 | Risky — consider splitting |
| 9+ | Too large — must split |

### 1b: Write Batch Plan
Invoke `superpowers-extended-cc:writing-plans` — create `docs/plans/YYYY-MM-DD-batch-[X]-[theme].md`:

**Required sections:**
- Context (current count, additions, new total, manual chapters)
- Reference files table (manual PDF, canonical example, control IDs, registry, test file)
- Critical constraints (all 10 rules — see below)
- Available control IDs (copy from `allFantom08ControlIds`)
- Per-tutorial task with: manual pages, step outline, registration items, TDD cycle

**10 Critical Constraints (embed in every plan):**
1. `menuItems` MUST use `{ label: string }` objects
2. Panel state is CUMULATIVE
3. Every step needs UNIQUE `displayState`
4. No hardcoded hex colors — use constants
5. Control IDs must exist in `allFantom08ControlIds`
6. Zone LED: Red=INT, Green=EXT
7. `screenType` must be registered ScreenType
8. Tutorial `id` must match filename
9. Realistic instruction text
10. `panelStateChanges` keys must be valid control IDs

Include trigger line: `> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans`

---

## Phase 2: Setup

1. Invoke `superpowers-extended-cc:using-git-worktrees` — isolated workspace
2. Invoke `superpowers-extended-cc:executing-plans` with plan file path

---

## Phase 3: Per-Tutorial Execution (Repeat for Each Tutorial)

### 3a: PRE-BUILD Gate (Evidence Required)

**Read the manual pages listed in the plan:**
- Reference Manual: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/Roland Fantom-0 Series Reference Manual.pdf`
- Parameter Guide: `FANTOM-06_07_08_Parameter_eng01_W.pdf`
- Sound List: `FANTOM-06_07_08_SoundList_multi01_W.pdf`

**Answer ALL 11 questions:**
1. Manual pages read (specific page numbers)
2. Manual screenshot description (layout, elements, hierarchy)
3. Exact access path (button sequence)
4. E-knob assignments (E1-E6 per screen)
5. Screen catalog + manual cross-referenced
6. Parameter names/ranges verified (from Parameter Guide)
7. Tone names verified (from Sound List or existing tutorials)
8. YOU read the manual (not agents — agents hallucinate screen layouts)
9. Existing patterns to reuse (check controls/, constants, hooks/, types/)
10. Similar component already exists? (search first)
11. ASCII layout presented? (for visual components)

### 3b: CROSS-REFERENCE Gate

For all UI-visible data, verify:
- [ ] Tone names: against Sound List or existing tutorials (never invent)
- [ ] Parameter ranges: against Parameter Guide
- [ ] Control IDs: against `allFantom08ControlIds`
- [ ] E-knob assignments: correct for each specific screen (they change!)
- [ ] Highlighted controls: match what user would physically touch in this screen mode
- [ ] LED states: `ledOn` only on LED buttons (zone-1..8, pan-level, ctrl, split, chord-memory, arpeggio, write, play, stop, rec, pad-1..16)
- [ ] Zone colors: `ZONE_COLOR_MAP`, zones 9-16 wrap with `((num-1)%8)+1`

### 3c: TDD Cycle

1. **Update test** (`src/__tests__/tutorials/fantom08Tutorials.test.ts`):
   - `expectedStepCounts['tutorial-id'] = N`
   - Update total count
   - Add description string

2. **Verify FAIL**: `npm run test` — new test fails

3. **Create tutorial** (`src/data/tutorials/fantom-08/[name].ts`):
   - Follow `split-keyboard-zones.ts` as canonical example
   - Panel state cumulative, unique displayState per step
   - `menuItems: [{ label: 'X' }]`, not `['X']`
   - `id` matches filename, realistic instructions
   - Control IDs valid, LED claims accurate

4. **Register** (`src/data/tutorials/fantom-08/index.ts`):
   - Import + array + named export (ALL THREE required)

5. **Verify PASS**: `npm run test` + `npm run build`

6. **Commit**: `feat(tutorials): add [name] — [description]`

### 3d: Repeat for Next Tutorial

---

## Phase 4: Code Review

1. Invoke `superpowers-extended-cc:requesting-code-review`
   - Reviewer performs TWO-STAGE review: spec compliance + code quality
2. Invoke `superpowers-extended-cc:receiving-code-review`
   - Technical rigor — no performative agreement ("Great catch!")
   - Push back on YAGNI violations
   - Verify suggestions against actual manual before implementing

**Top 5 review findings to watch for:**
1. Orphaned active controls (activated but never deactivated)
2. Identical displayState across consecutive steps
3. Missing zone data (step describes zones but no zones array)
4. Inconsistent difficulty progression
5. Unreferenced control IDs in highlights

3. Fix all Critical/Important findings
4. `npm run build` — zero errors after fixes

---

## Phase 5: Post-Build Verification

### Build & Tests (paste ACTUAL output — not paraphrases)
1. `npm run build` — "Compiled successfully", zero errors
2. `npm run test` — "X passed, 0 failed" (expect increased count)
3. `codeQuality.test.ts` — PASS
4. Dev server visual check (tutorials play through)

### Registration (per tutorial)
- [ ] File exists, imported, in array, named export, step count, total count, description

### Quality (per tutorial)
- [ ] Panel state cumulative
- [ ] Every step unique displayState
- [ ] All control IDs valid
- [ ] All LED claims accurate
- [ ] All tone names verified
- [ ] menuItems format correct

---

## Phase 6: Gap Analysis

Update `docs/plans/2026-02-28-gap-analysis.md`:
- Change PLANNED/GAP → COVERED for completed sections
- Document any new gaps discovered during implementation
- Update coverage summary table
- Note batch additions with details

---

## Phase 7: Completion & Self-Improvement

### Verify (evidence before claims)
```
BUILD-BATCH Evidence:
━━━━━━━━━━━━━━━━━━━━━━━
Batch: [name/theme]
Tutorials added: [N]
New total: [N]

Build:  [PASS] — Compiled successfully
Tests:  [PASS] — [X] passed, 0 failed
Quality: codeQuality.test.ts PASS
Review: all findings addressed
Gap analysis: updated
━━━━━━━━━━━━━━━━━━━━━━━
```

### Self-Improve
1. What went well?
2. What was harder than expected?
3. Unverified assumptions?
4. Reusable patterns?
5. Advice for next instance?
6. Gates need updating?
7. Memory files current?

### Merge
1. Invoke `superpowers-extended-cc:verification-before-completion`
2. Invoke `superpowers-extended-cc:finishing-a-development-branch`
3. Update `memory/MEMORY.md` with new counts

---

## Skills Chain (invoke in order)

```
1. brainstorming           → before deciding which tutorials
2. writing-plans           → create batch plan
3. using-git-worktrees     → isolated workspace
4. executing-plans         → task-by-task execution
5. test-driven-development → per tutorial
6. systematic-debugging    → when tests fail
7. requesting-code-review  → after all tutorials
8. receiving-code-review   → process feedback
9. verification-before-completion → final evidence
10. finishing-a-development-branch → merge/cleanup
```

**Skip spec-kit** — the Tutorial type IS the spec, the manual IS the requirements.
