# BUILD-FEATURE — Full Feature Development Lifecycle

End-to-end workflow for building any new feature: pre-build validation → implementation → cross-reference → post-build verification → self-improvement.

**Trigger:** Building any new feature (non-tutorial) from start to finish.

**Combines:** `/pre-build` → implement → `/cross-ref` → `/post-build` → `/verify` → `/self-improve`

---

## Phase 1: Pre-Build Validation

### 1a: Read Project Context
- Read `CLAUDE.md` for architecture, conventions, tech stack
- Read `tasks/lessons.md` for 19 correction patterns to avoid
- Check `specs/` directory for any existing spec
- Check `docs/plans/` for any existing design doc

### 1b: Answer PRE-BUILD Questions (Evidence Required)

**Reference Validation:**
1. Which manual pages did you read? (List page numbers. Manual path: `/Users/devin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Fun & Stuff/Music/Music Studio/`)
2. What does the manual screenshot show? (Describe layout, elements, hierarchy)
3. What is the exact access path? (Button sequence to reach this screen)
4. Which E-knobs/controls are active? (List E1-E6 assignments from manual)

**Cross-Reference:**
5. Cross-referenced screen catalog AND manual? (What did each say?)
6. Parameter names, ranges, defaults verified? (List specifics from Parameter Guide)
7. Tone names verified? (Against Sound List PDF or existing tutorials)

**Manual Reading:**
8. Did YOU read the manual pages? (Not agents — agents hallucinate screen layouts)

**Codebase Check:**
9. Existing patterns to reuse? (Check `components/controls/`, `lib/constants.ts`, `hooks/`, `types/`)
10. Similar component already exists? (Search before creating)
11. ASCII layout presented to user? (Design in terminal first for visual components)

### 1c: Spec & Plan
- If requirements are unclear: use `spec-kit:specify` then `spec-kit:plan`
- If requirements are clear: invoke `superpowers-extended-cc:brainstorming` then `superpowers-extended-cc:writing-plans`
- Write plan to `docs/plans/YYYY-MM-DD-<topic>-design.md`

---

## Phase 2: Setup

1. Invoke `superpowers-extended-cc:using-git-worktrees` for isolated workspace
2. Invoke `superpowers-extended-cc:executing-plans` with plan file

---

## Phase 3: Implementation

Follow the plan task-by-task. For each task:

### 3a: Write Tests First (TDD)
- Write failing test for the feature/component
- Verify test fails
- Implement the feature
- Verify test passes

### 3b: Cross-Reference Any UI Data
For any data displayed in the UI, verify:
- Tone names against Sound List PDF or existing tutorials
- Parameter ranges against Parameter Guide PDF
- Control IDs against `allFantom08ControlIds` in `src/data/panelLayouts/fantom-08.ts`
- E-knob assignments correct for the specific screen
- Highlighted controls contextually correct for the screen mode
- LED states only on buttons with LEDs (zone-1..8, pan-level, ctrl, split, chord-memory, arpeggio, write, play, stop, rec, pad-1..16)
- Zone colors follow formula: `ZONE_COLOR_MAP`, zones 9-16 wrap with `((num-1)%8)+1`

### 3c: Follow Code Conventions
- `'use client'` on all interactive components
- Colors from `DISPLAY_COLORS`, `ZONE_COLORS`, `ZONE_COLOR_MAP` — NEVER hardcode hex
- `font-mono` for LCD text, `text-[10px]`/`text-[11px]` for display text
- Framer Motion for animations (stagger: `delay: i * 0.03`)
- CSS variables: `var(--background)`, `var(--accent)`, `var(--card-bg)`, `var(--surface)`
- Path alias: `@/*` → `./src/*`

### 3d: Avoid Known Pitfalls (19 Patterns)
1. No hardcoded hex colors in display components
2. Never invent tone names
3. Never delegate manual PDF reading to agents
4. Register new ScreenTypes in ALL 5 places
5. Panel state is cumulative
6. Every step needs unique displayState
7. menuItems must be `{ label: string }` objects
8. Highlighted controls must match real workflow context
9. Search before creating files
10. Tutorial ID must match filename
11. CSS transform doesn't change layout size — use wrapper
12. Watch for nested scroll containers
13. overflow-hidden clips, doesn't fix layout
14. Localhost ≠ production layout (budget margins)
15. Adjust scale before fighting overflow properties
16. Test with layering zones (not just splits)
17. Verify hardware interactions against manual
18. Only LED buttons get ledOn/ledColor
19. Copy system parameter lists verbatim from manual

---

## Phase 4: Code Review

1. Invoke `superpowers-extended-cc:requesting-code-review`
2. Invoke `superpowers-extended-cc:receiving-code-review`
3. Process feedback with technical rigor — no performative agreement
4. Push back on YAGNI violations
5. Fix all Critical/Important findings

---

## Phase 5: Post-Build Verification

### Build & Tests (paste actual output)
1. `npm run build` — "Compiled successfully", zero errors
2. `npm run test` — exact count: "X passed, 0 failed"
3. `codeQuality.test.ts` passes
4. Dev server visual check (if applicable)

### Registration Check
- New ScreenType registered in all 5 places?
- New types/fields documented?
- No code duplication?
- Shared constants used throughout?
- Existing patterns followed?

### Evidence
```
VERIFICATION EVIDENCE:
Build:  [PASS/FAIL] — [output]
Tests:  [PASS/FAIL] — [X passed, 0 failed]
Quality: codeQuality.test.ts [PASS/FAIL]
Regressions: [none / describe]
```

---

## Phase 6: Completion

1. Invoke `superpowers-extended-cc:verification-before-completion` — evidence before claims
2. Invoke `superpowers-extended-cc:finishing-a-development-branch` — merge/PR/cleanup

---

## Phase 7: Self-Improvement

Answer:
1. What went well?
2. What was harder than expected?
3. Unverified assumptions?
4. Reusable patterns discovered?
5. Advice for next Claude instance?
6. Quality gates need updating?
7. Memory files current?

Update:
- [ ] `memory/MEMORY.md` — project state
- [ ] `tasks/lessons.md` — if new patterns discovered
- [ ] Quality gate commands — if new questions needed
